const MAX_TRANSCRIPT_OVERLAP_WORDS =
    120;

const MIN_TRANSCRIPT_OVERLAP_WORDS =
    3;

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
        overlapLength -= 1
    ) {
        const existingStart =
            existingWords.length -
            overlapLength;

        let matches =
            true;

        for (
            let index = 0;
            index < overlapLength;
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
                    nextWords[index]
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

export const combineInterviewChunkTranscripts = (
    transcripts: string[]
): string => {
    return transcripts
        .map(
            (transcript) =>
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