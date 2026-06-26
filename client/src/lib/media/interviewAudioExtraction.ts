import type {
    FFmpeg,
} from "@ffmpeg/ffmpeg";
import {
    runInterviewFfmpegOperation,
} from "./interviewFfmpegOperation";
import {
    loadInterviewFfmpeg,
} from "./interviewFfmpeg";

export const INTERVIEW_AUDIO_SAMPLE_RATE =
    16_000;

export const INTERVIEW_AUDIO_CHANNEL_COUNT =
    1;

export const INTERVIEW_AUDIO_BITRATE_KBPS =
    48;

const OUTPUT_AUDIO_MIME_TYPE =
    "audio/mpeg";

const supportedVideoExtensions =
    new Set([
        "mp4",
        "webm",
        "mov",
    ]);

export interface ExtractedInterviewAudio {
    file: File;
    sourceVideoName: string;
    sourceVideoSizeBytes: number;
    outputSizeBytes: number;
    sampleRate: number;
    channelCount: number;
    bitrateKbps: number;
}


const getFileExtension = (
    fileName: string
): string => {
    const normalizedName =
        fileName
            .trim()
            .toLowerCase();

    const dotIndex =
        normalizedName
            .lastIndexOf(".");

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
        "interview"
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

const validateSourceVideo = (
    videoFile: File
): void => {
    if (videoFile.size <= 0) {
        throw new Error(
            "The selected video file is empty."
        );
    }

    const extension =
        getFileExtension(
            videoFile.name
        );

    const hasVideoMimeType =
        videoFile.type
            .toLowerCase()
            .startsWith(
                "video/"
            );

    const hasSupportedExtension =
        supportedVideoExtensions.has(
            extension
        );

    if (
        !hasVideoMimeType &&
        !hasSupportedExtension
    ) {
        throw new Error(
            "Unsupported video format. Use MP4, WEBM, or MOV."
        );
    }
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
            // The file may not exist if processing failed
            // before it was created.
        }
    };

const normalizeExtractionError = (
    error: unknown,
    ffmpegLogs: string[]
): Error => {
    const originalMessage =
        error instanceof Error
            ? error.message
            : "";

    const diagnosticText =
        [
            originalMessage,
            ...ffmpegLogs,
        ]
            .join("\n")
            .toLowerCase();

    if (
        diagnosticText.includes(
            "matches no streams"
        ) ||
        diagnosticText.includes(
            "does not contain any stream"
        ) ||
        diagnosticText.includes(
            "stream map '0:a:0'"
        )
    ) {
        return new Error(
            "This video does not contain an audio track."
        );
    }

    if (
        diagnosticText.includes(
            "invalid data found"
        ) ||
        diagnosticText.includes(
            "could not find codec parameters"
        )
    ) {
        return new Error(
            "The selected video could not be decoded. It may be damaged or use an unsupported codec."
        );
    }

    if (
        originalMessage.startsWith(
            "The selected video"
        ) ||
        originalMessage.startsWith(
            "Unsupported video"
        ) ||
        originalMessage.startsWith(
            "This video"
        )
    ) {
        return new Error(
            originalMessage
        );
    }

    return new Error(
        "Unable to extract audio from this video. Try converting it to MP4 or WEBM and upload it again."
    );
};

/**
 * Extracts only the first audio stream from a video.
 *
 * Output:
 * - MP3
 * - 16 kHz sample rate
 * - mono channel
 * - 48 kbps bitrate
 *
 * No network upload happens inside this function.
 */
export const extractInterviewAudioFromVideo =
    async (
        videoFile: File
    ): Promise<ExtractedInterviewAudio> => {
        validateSourceVideo(
            videoFile
        );

        return runInterviewFfmpegOperation(
            async () => {
                const ffmpeg =
                    await loadInterviewFfmpeg();

                const operationId =
                    createOperationId();

                const inputExtension =
                    getFileExtension(
                        videoFile.name
                    ) || "mp4";

                const inputFileName =
                    `interview-input-${operationId}.${inputExtension}`;

                const outputFileName =
                    `interview-output-${operationId}.mp3`;

                const ffmpegLogs:
                    string[] = [];

                const handleLog = ({
                    message,
                }: {
                    message: string;
                }) => {
                    ffmpegLogs.push(
                        message
                    );

                    if (
                        ffmpegLogs.length >
                        100
                    ) {
                        ffmpegLogs.shift();
                    }
                };

                ffmpeg.on(
                    "log",
                    handleLog
                );

                try {
                    const sourceBytes =
                        new Uint8Array(
                            await videoFile.arrayBuffer()
                        );

                    await ffmpeg.writeFile(
                        inputFileName,
                        sourceBytes
                    );

                    const exitCode =
                        await ffmpeg.exec([
                            "-i",
                            inputFileName,

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

                            outputFileName,
                        ]);

                    if (
                        exitCode !== 0
                    ) {
                        throw new Error(
                            `FFmpeg audio extraction failed with exit code ${exitCode}.`
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
                            "FFmpeg returned an invalid audio output."
                        );
                    }

                    const outputBytes =
                        Uint8Array.from(
                            outputData
                        );

                    if (
                        outputBytes.byteLength ===
                        0
                    ) {
                        throw new Error(
                            "FFmpeg produced an empty audio file."
                        );
                    }

                    const extractedFile =
                        new File(
                            [
                                outputBytes,
                            ],
                            `${getOutputBaseName(videoFile.name)}-16khz-mono.mp3`,
                            {
                                type:
                                    OUTPUT_AUDIO_MIME_TYPE,
                                lastModified:
                                    Date.now(),
                            }
                        );

                    return {
                        file:
                            extractedFile,

                        sourceVideoName:
                            videoFile.name,

                        sourceVideoSizeBytes:
                            videoFile.size,

                        outputSizeBytes:
                            extractedFile.size,

                        sampleRate:
                            INTERVIEW_AUDIO_SAMPLE_RATE,

                        channelCount:
                            INTERVIEW_AUDIO_CHANNEL_COUNT,

                        bitrateKbps:
                            INTERVIEW_AUDIO_BITRATE_KBPS,
                    };
                } catch (
                extractionError
                ) {
                    throw normalizeExtractionError(
                        extractionError,
                        ffmpegLogs
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

                        safelyDeleteFfmpegFile(
                            ffmpeg,
                            outputFileName
                        ),
                    ]);
                }
            }
        );
    };