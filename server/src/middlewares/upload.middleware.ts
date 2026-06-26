import multer from "multer";

const MEGABYTE =
    1024 * 1024;

export const INTERVIEW_AUDIO_UPLOAD_LIMIT_BYTES =
    24 * MEGABYTE;

const memoryStorage =
    multer.memoryStorage();

const generalAllowedMimeTypes =
    new Set([
        "audio/mpeg",
        "audio/mp3",
        "audio/mp4",
        "audio/wav",
        "audio/x-wav",
        "audio/webm",
        "audio/ogg",
        "audio/x-m4a",

        "video/mp4",
        "video/webm",
        "video/quicktime",

        "application/pdf",
        "application/octet-stream",
    ]);

const generalAllowedExtensions =
    /\.(mp3|mp4|wav|webm|ogg|m4a|mov|pdf)$/i;

const extractedAudioMimeTypes =
    new Set([
        "audio/mpeg",
        "audio/mp3",
        "audio/mp4",
        "audio/wav",
        "audio/x-wav",
        "audio/webm",
        "audio/ogg",
        "audio/x-m4a",
    ]);

const extractedAudioExtensions =
    /\.(mp3|wav|webm|ogg|m4a)$/i;

export const upload =
    multer({
        storage:
            memoryStorage,

        limits: {
            fileSize:
                50 * MEGABYTE,
        },

        fileFilter: (
            _req,
            file,
            callback
        ) => {
            const hasAllowedMimeType =
                generalAllowedMimeTypes.has(
                    file.mimetype
                        .trim()
                        .toLowerCase()
                );

            const hasAllowedExtension =
                generalAllowedExtensions.test(
                    file.originalname
                );

            if (
                hasAllowedMimeType ||
                hasAllowedExtension
            ) {
                callback(
                    null,
                    true
                );
                return;
            }

            callback(
                new Error(
                    "Only audio, video, or PDF files are allowed"
                )
            );
        },
    });

/**
 * Strict uploader for browser-extracted interview audio.
 *
 * The original video must never reach this middleware.
 * Each uploaded audio file must stay below the safe
 * 24 MB transcription limit.
 */
export const uploadInterviewExtractedAudio =
    multer({
        storage:
            memoryStorage,

        limits: {
            fileSize:
                INTERVIEW_AUDIO_UPLOAD_LIMIT_BYTES,
            files:
                1,
        },

        fileFilter: (
            _req,
            file,
            callback
        ) => {
            const normalizedMimeType =
                file.mimetype
                    .trim()
                    .toLowerCase();

            const hasAllowedMimeType =
                extractedAudioMimeTypes.has(
                    normalizedMimeType
                );

            const hasAllowedExtension =
                extractedAudioExtensions.test(
                    file.originalname
                );

            if (
                hasAllowedMimeType ||
                hasAllowedExtension
            ) {
                callback(
                    null,
                    true
                );
                return;
            }

            callback(
                new Error(
                    "Only extracted interview audio files are allowed"
                )
            );
        },
    }); export const MAX_INTERVIEW_AUDIO_CHUNKS =
        100;

/**
 * Accepts multiple browser-generated audio chunks.
 * Every chunk has its own 24 MB limit.
 */
export const uploadInterviewAudioChunks =
    multer({
        storage:
            memoryStorage,

        limits: {
            fileSize:
                INTERVIEW_AUDIO_UPLOAD_LIMIT_BYTES,

            files:
                MAX_INTERVIEW_AUDIO_CHUNKS,
        },

        fileFilter: (
            _req,
            file,
            callback
        ) => {
            const normalizedMimeType =
                file.mimetype
                    .trim()
                    .toLowerCase();

            const hasAllowedMimeType =
                extractedAudioMimeTypes.has(
                    normalizedMimeType
                );

            const hasAllowedExtension =
                extractedAudioExtensions.test(
                    file.originalname
                );

            if (
                hasAllowedMimeType ||
                hasAllowedExtension
            ) {
                callback(
                    null,
                    true
                );
                return;
            }

            callback(
                new Error(
                    "Only interview audio chunk files are allowed"
                )
            );
        },
    });