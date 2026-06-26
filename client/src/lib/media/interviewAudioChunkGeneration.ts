import type {
    FFmpeg,
} from "@ffmpeg/ffmpeg";

import {
    assertInterviewAudioChunkSize,
} from "./interviewAudioChunks";

import type {
    InterviewAudioChunkWindow,
} from "./interviewAudioChunks";

import {
    INTERVIEW_AUDIO_BITRATE_KBPS,
    INTERVIEW_AUDIO_CHANNEL_COUNT,
    INTERVIEW_AUDIO_SAMPLE_RATE,
} from "./interviewAudioExtraction";

import {
    loadInterviewFfmpeg,
} from "./interviewFfmpeg";

import {
    runInterviewFfmpegOperation,
} from "./interviewFfmpegOperation";

const OUTPUT_AUDIO_MIME_TYPE =
    "audio/mpeg";

const MAX_CAPTURED_FFMPEG_LOGS =
    120;

export interface GeneratedInterviewAudioChunk {
    index: number;
    file: File;
    startSeconds: number;
    endSeconds: number;
    durationSeconds: number;
    sizeBytes: number;
}

export interface GenerateInterviewAudioChunksInput {
    audioFile: File;
    windows: InterviewAudioChunkWindow[];
}

const getFileExtension = (
    fileName: string
): string => {
    const normalizedName =
        fileName
            .trim()
            .toLowerCase();

    const dotIndex =
        normalizedName.lastIndexOf(
            "."
        );

    if (
        dotIndex < 0 ||
        dotIndex ===
        normalizedName.length - 1
    ) {
        return "";
    }

    return normalizedName.slice(
        dotIndex + 1
    );
};

const getOutputBaseName = (
    fileName: string
): string => {
    const trimmedName =
        fileName.trim();

    const dotIndex =
        trimmedName.lastIndexOf(
            "."
        );

    const baseName =
        dotIndex > 0
            ? trimmedName.slice(
                0,
                dotIndex
            )
            : trimmedName;

    const sanitizedName =
        baseName
            .replace(
                /[^a-zA-Z0-9-_]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            );

    return (
        sanitizedName ||
        "interview-audio"
    );
};

const createOperationId =
    (): string => {
        if (
            typeof crypto !==
            "undefined" &&
            typeof crypto.randomUUID ===
            "function"
        ) {
            return crypto.randomUUID();
        }

        return [
            Date.now(),
            Math.random()
                .toString(36)
                .slice(2),
        ].join("-");
    };

const validateAudioFile = (
    file: File
): void => {
    if (file.size <= 0) {
        throw new Error(
            "The selected audio file is empty."
        );
    }

    const fileName =
        file.name.toLowerCase();

    const hasAudioMimeType =
        file.type
            .toLowerCase()
            .startsWith(
                "audio/"
            );

    const hasSupportedExtension =
        [
            ".mp3",
            ".wav",
            ".m4a",
            ".webm",
            ".ogg",
        ].some(
            (extension) =>
                fileName.endsWith(
                    extension
                )
        );

    if (
        !hasAudioMimeType &&
        !hasSupportedExtension
    ) {
        throw new Error(
            "Unsupported audio format. Use MP3, WAV, M4A, WEBM, or OGG."
        );
    }
};

const validateChunkWindows = (
    windows: InterviewAudioChunkWindow[]
): void => {
    if (windows.length === 0) {
        throw new Error(
            "At least one audio chunk window is required."
        );
    }

    windows.forEach(
        (
            window,
            position
        ) => {
            if (
                window.index !==
                position
            ) {
                throw new Error(
                    "Audio chunk indexes must be sequential."
                );
            }

            if (
                !Number.isFinite(
                    window.startSeconds
                ) ||
                !Number.isFinite(
                    window.endSeconds
                ) ||
                !Number.isFinite(
                    window.durationSeconds
                ) ||
                window.startSeconds <
                0 ||
                window.endSeconds <=
                window.startSeconds ||
                window.durationSeconds <=
                0
            ) {
                throw new Error(
                    `Audio chunk ${position + 1} has an invalid time window.`
                );
            }
        }
    );
};

const safelyDeleteFfmpegFile =
    async (
        ffmpeg: FFmpeg,
        fileName: string
    ): Promise<void> => {
        try {
            await ffmpeg.deleteFile(
                fileName
            );
        } catch {
            // File may not exist if processing failed
            // before FFmpeg created it.
        }
    };

const normalizeChunkGenerationError = (
    error: unknown,
    logs: string[]
): Error => {
    const originalMessage =
        error instanceof Error
            ? error.message
            : "";

    const diagnostics =
        [
            originalMessage,
            ...logs,
        ]
            .join("\n")
            .toLowerCase();

    if (
        diagnostics.includes(
            "matches no streams"
        ) ||
        diagnostics.includes(
            "stream map '0:a:0'"
        ) ||
        diagnostics.includes(
            "does not contain any stream"
        )
    ) {
        return new Error(
            "The selected media does not contain a readable audio track."
        );
    }

    if (
        diagnostics.includes(
            "invalid data found"
        ) ||
        diagnostics.includes(
            "could not find codec parameters"
        )
    ) {
        return new Error(
            "The audio could not be decoded. It may be damaged or use an unsupported codec."
        );
    }

    if (
        originalMessage.startsWith(
            "An interview audio chunk"
        ) ||
        originalMessage.startsWith(
            "FFmpeg produced"
        ) ||
        originalMessage.startsWith(
            "Audio chunk"
        )
    ) {
        return new Error(
            originalMessage
        );
    }

    return new Error(
        "Unable to split the interview audio into safe upload chunks."
    );
};

/**
 * Creates overlapping 16 kHz mono MP3 files from the
 * supplied chunk windows.
 *
 * The source file and generated temporary files remain
 * inside the browser and FFmpeg virtual filesystem.
 */
export const generateInterviewAudioChunks =
    async ({
        audioFile,
        windows,
    }: GenerateInterviewAudioChunksInput): Promise<
        GeneratedInterviewAudioChunk[]
    > => {
        validateAudioFile(
            audioFile
        );

        validateChunkWindows(
            windows
        );

        return runInterviewFfmpegOperation(
            async () => {
                const ffmpeg =
                    await loadInterviewFfmpeg();

                const operationId =
                    createOperationId();

                const inputExtension =
                    getFileExtension(
                        audioFile.name
                    ) || "mp3";

                const inputFileName =
                    `chunk-source-${operationId}.${inputExtension}`;

                const outputBaseName =
                    getOutputBaseName(
                        audioFile.name
                    );

                const generatedChunks:
                    GeneratedInterviewAudioChunk[] =
                    [];

                const generatedOutputNames:
                    string[] = [];

                const logs:
                    string[] = [];

                const handleLog = ({
                    message,
                }: {
                    message: string;
                }) => {
                    logs.push(
                        message
                    );

                    if (
                        logs.length >
                        MAX_CAPTURED_FFMPEG_LOGS
                    ) {
                        logs.shift();
                    }
                };

                ffmpeg.on(
                    "log",
                    handleLog
                );

                try {
                    const sourceBytes =
                        new Uint8Array(
                            await audioFile.arrayBuffer()
                        );

                    await ffmpeg.writeFile(
                        inputFileName,
                        sourceBytes
                    );

                    for (
                        const window
                        of windows
                    ) {
                        const partNumber =
                            String(
                                window.index +
                                1
                            ).padStart(
                                3,
                                "0"
                            );

                        const totalParts =
                            String(
                                windows.length
                            ).padStart(
                                3,
                                "0"
                            );

                        const outputFileName =
                            `chunk-output-${operationId}-${partNumber}.mp3`;

                        generatedOutputNames.push(
                            outputFileName
                        );

                        const exitCode =
                            await ffmpeg.exec([
                                "-ss",
                                String(
                                    window.startSeconds
                                ),

                                "-i",
                                inputFileName,

                                "-t",
                                String(
                                    window.durationSeconds
                                ),

                                "-map",
                                "0:a:0",

                                "-vn",

                                "-ac",
                                String(
                                    INTERVIEW_AUDIO_CHANNEL_COUNT
                                ),

                                "-ar",
                                String(
                                    INTERVIEW_AUDIO_SAMPLE_RATE
                                ),

                                "-c:a",
                                "libmp3lame",

                                "-b:a",
                                `${INTERVIEW_AUDIO_BITRATE_KBPS}k`,

                                "-map_metadata",
                                "-1",

                                "-y",

                                outputFileName,
                            ]);

                        if (
                            exitCode !==
                            0
                        ) {
                            throw new Error(
                                `Audio chunk ${window.index + 1} failed with exit code ${exitCode}.`
                            );
                        }

                        const outputData =
                            await ffmpeg.readFile(
                                outputFileName
                            );

                        if (
                            typeof outputData ===
                            "string"
                        ) {
                            throw new Error(
                                `FFmpeg produced invalid data for audio chunk ${window.index + 1}.`
                            );
                        }

                        const outputBytes =
                            Uint8Array.from(
                                outputData
                            );

                        const chunkFile =
                            new File(
                                [
                                    outputBytes,
                                ],
                                `${outputBaseName}-part-${partNumber}-of-${totalParts}.mp3`,
                                {
                                    type:
                                        OUTPUT_AUDIO_MIME_TYPE,
                                    lastModified:
                                        Date.now(),
                                }
                            );

                        assertInterviewAudioChunkSize(
                            chunkFile
                        );

                        generatedChunks.push({
                            index:
                                window.index,

                            file:
                                chunkFile,

                            startSeconds:
                                window.startSeconds,

                            endSeconds:
                                window.endSeconds,

                            durationSeconds:
                                window.durationSeconds,

                            sizeBytes:
                                chunkFile.size,
                        });

                        await safelyDeleteFfmpegFile(
                            ffmpeg,
                            outputFileName
                        );
                    }

                    return generatedChunks;
                } catch (
                generationError
                ) {
                    throw normalizeChunkGenerationError(
                        generationError,
                        logs
                    );
                } finally {
                    ffmpeg.off(
                        "log",
                        handleLog
                    );

                    await Promise.all([
                        safelyDeleteFfmpegFile(
                            ffmpeg,
                            inputFileName
                        ),

                        ...generatedOutputNames.map(
                            (
                                outputFileName
                            ) =>
                                safelyDeleteFfmpegFile(
                                    ffmpeg,
                                    outputFileName
                                )
                        ),
                    ]);
                }
            }
        );
    };