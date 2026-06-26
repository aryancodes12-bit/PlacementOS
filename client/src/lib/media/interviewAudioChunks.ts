export const INTERVIEW_AUDIO_UPLOAD_LIMIT_BYTES =
    24 * 1024 * 1024;

/*
 * Keep headroom for multipart metadata and small
 * encoding-size variation.
 */
export const INTERVIEW_AUDIO_CHUNK_TARGET_BYTES =
    23 * 1024 * 1024;

export const INTERVIEW_AUDIO_CHUNK_OVERLAP_SECONDS =
    2;

const MAX_TRANSCRIPT_OVERLAP_WORDS =
    120;

const MIN_TRANSCRIPT_OVERLAP_WORDS =
    3;

export interface InterviewAudioChunkWindow {
    index: number;
    startSeconds: number;
    endSeconds: number;
    durationSeconds: number;
}

export interface PlanInterviewAudioChunksInput {
    durationSeconds: number;
    sizeBytes: number;
    targetBytes?: number;
    overlapSeconds?: number;
}

const roundSeconds = (
    value: number
): number => {
    return Number(
        value.toFixed(3)
    );
};

const assertPositiveFiniteNumber = (
    value: number,
    fieldName: string
): void => {
    if (
        !Number.isFinite(value) ||
        value <= 0
    ) {
        throw new Error(
            `${fieldName} must be a positive finite number.`
        );
    }
};

export const requiresInterviewAudioChunking = (
    sizeBytes: number
): boolean => {
    return (
        sizeBytes >
        INTERVIEW_AUDIO_UPLOAD_LIMIT_BYTES
    );
};

/**
 * Produces overlapping time windows based on the
 * compressed audio's real average bytes per second.
 *
 * Actual generated chunk sizes must still be checked
 * after FFmpeg processing.
 */
export const planInterviewAudioChunks = ({
    durationSeconds,
    sizeBytes,
    targetBytes =
    INTERVIEW_AUDIO_CHUNK_TARGET_BYTES,
    overlapSeconds =
    INTERVIEW_AUDIO_CHUNK_OVERLAP_SECONDS,
}: PlanInterviewAudioChunksInput): InterviewAudioChunkWindow[] => {
    assertPositiveFiniteNumber(
        durationSeconds,
        "Audio duration"
    );

    assertPositiveFiniteNumber(
        sizeBytes,
        "Audio size"
    );

    assertPositiveFiniteNumber(
        targetBytes,
        "Chunk target size"
    );

    if (
        !Number.isFinite(
            overlapSeconds
        ) ||
        overlapSeconds < 0
    ) {
        throw new Error(
            "Chunk overlap must be zero or a positive finite number."
        );
    }

    if (
        targetBytes >
        INTERVIEW_AUDIO_UPLOAD_LIMIT_BYTES
    ) {
        throw new Error(
            "Chunk target size cannot exceed the 24 MB upload limit."
        );
    }

    if (
        !requiresInterviewAudioChunking(
            sizeBytes
        )
    ) {
        return [
            {
                index: 0,
                startSeconds: 0,
                endSeconds:
                    roundSeconds(
                        durationSeconds
                    ),
                durationSeconds:
                    roundSeconds(
                        durationSeconds
                    ),
            },
        ];
    }

    const averageBytesPerSecond =
        sizeBytes /
        durationSeconds;

    const chunkDurationSeconds =
        Math.floor(
            targetBytes /
            averageBytesPerSecond
        );

    if (
        chunkDurationSeconds <=
        overlapSeconds
    ) {
        throw new Error(
            "The audio bitrate is too high to create safe overlapping chunks."
        );
    }

    const windows:
        InterviewAudioChunkWindow[] =
        [];

    let startSeconds =
        0;

    let index =
        0;

    while (
        startSeconds <
        durationSeconds
    ) {
        const endSeconds =
            Math.min(
                durationSeconds,
                startSeconds +
                chunkDurationSeconds
            );

        windows.push({
            index,
            startSeconds:
                roundSeconds(
                    startSeconds
                ),
            endSeconds:
                roundSeconds(
                    endSeconds
                ),
            durationSeconds:
                roundSeconds(
                    endSeconds -
                    startSeconds
                ),
        });

        if (
            endSeconds >=
            durationSeconds
        ) {
            break;
        }

        const nextStartSeconds =
            endSeconds -
            overlapSeconds;

        if (
            nextStartSeconds <=
            startSeconds
        ) {
            throw new Error(
                "Unable to advance the interview audio chunk window."
            );
        }

        startSeconds =
            nextStartSeconds;

        index +=
            1;

        if (
            index >
            10_000
        ) {
            throw new Error(
                "Interview audio produced too many chunks."
            );
        }
    }

    return windows;
};

const normalizeTranscriptWord = (
    word: string
): string => {
    return word
        .normalize("NFKC")
        .toLocaleLowerCase()
        .replace(
            /[^\p{L}\p{N}]+/gu,
            ""
        );
};

const getTranscriptWords = (
    transcript: string
): string[] => {
    return (
        transcript
            .trim()
            .match(/\S+/g) ??
        []
    );
};

const findTranscriptOverlapLength = (
    existingWords: string[],
    nextWords: string[]
): number => {
    const maximumOverlap =
        Math.min(
            MAX_TRANSCRIPT_OVERLAP_WORDS,
            existingWords.length,
            nextWords.length
        );

    for (
        let overlapLength =
            maximumOverlap;
        overlapLength >=
        MIN_TRANSCRIPT_OVERLAP_WORDS;
        overlapLength -=
        1
    ) {
        const existingStart =
            existingWords.length -
            overlapLength;

        let matches =
            true;

        for (
            let index = 0;
            index <
            overlapLength;
            index += 1
        ) {
            const existingWord =
                normalizeTranscriptWord(
                    existingWords[
                    existingStart +
                    index
                    ]
                );

            const nextWord =
                normalizeTranscriptWord(
                    nextWords[
                    index
                    ]
                );

            if (
                !existingWord ||
                !nextWord ||
                existingWord !==
                nextWord
            ) {
                matches =
                    false;
                break;
            }
        }

        if (matches) {
            return overlapLength;
        }
    }

    return 0;
};

const mergeInterviewTranscripts = (
    existingTranscript: string,
    nextTranscript: string
): string => {
    const existingWords =
        getTranscriptWords(
            existingTranscript
        );

    const nextWords =
        getTranscriptWords(
            nextTranscript
        );

    if (
        existingWords.length ===
        0
    ) {
        return nextWords.join(
            " "
        );
    }

    if (
        nextWords.length ===
        0
    ) {
        return existingWords.join(
            " "
        );
    }

    const overlapLength =
        findTranscriptOverlapLength(
            existingWords,
            nextWords
        );

    return [
        ...existingWords,
        ...nextWords.slice(
            overlapLength
        ),
    ].join(
        " "
    );
};

/**
 * Combines ordered chunk transcripts and removes an
 * exact normalized suffix/prefix match created by the
 * overlapping audio windows.
 */
export const combineInterviewChunkTranscripts = (
    transcripts: string[]
): string => {
    return transcripts
        .map((transcript) =>
            transcript.trim()
        )
        .filter(Boolean)
        .reduce(
            (
                combined,
                transcript
            ) =>
                mergeInterviewTranscripts(
                    combined,
                    transcript
                ),
            ""
        )
        .trim();
};

export const assertInterviewAudioChunkSize = (
    file: File
): void => {
    if (
        file.size ===
        0
    ) {
        throw new Error(
            "FFmpeg produced an empty interview audio chunk."
        );
    }

    if (
        file.size >
        INTERVIEW_AUDIO_UPLOAD_LIMIT_BYTES
    ) {
        throw new Error(
            "An interview audio chunk exceeded the safe 24 MB upload limit."
        );
    }
};