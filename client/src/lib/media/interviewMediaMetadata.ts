export type InterviewMediaType =
    | "audio"
    | "video";

export interface InterviewMediaMetadata {
    mediaType: InterviewMediaType;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    durationSeconds: number;
    durationLabel: string;
    width: number | null;
    height: number | null;
}

export const MAX_INTERVIEW_AUDIO_DURATION_SECONDS =
    60 * 60;

export const MAX_INTERVIEW_VIDEO_DURATION_SECONDS =
    30 * 60;

const MEDIA_METADATA_TIMEOUT_MS =
    15_000;

const supportedExtensions: Record<
    InterviewMediaType,
    ReadonlySet<string>
> = {
    audio: new Set([
        "mp3",
        "wav",
        "m4a",
        "webm",
        "ogg",
    ]),

    video: new Set([
        "mp4",
        "webm",
        "mov",
    ]),
};

const supportedExtensionLabels: Record<
    InterviewMediaType,
    string
> = {
    audio:
        "MP3, WAV, M4A, WEBM, or OGG",

    video:
        "MP4, WEBM, or MOV",
};

const getFileExtension = (
    fileName: string
): string => {
    const normalizedName =
        fileName
            .trim()
            .toLowerCase();

    const lastDotIndex =
        normalizedName
            .lastIndexOf(".");

    if (
        lastDotIndex < 0 ||
        lastDotIndex ===
        normalizedName.length - 1
    ) {
        return "";
    }

    return normalizedName.slice(
        lastDotIndex + 1
    );
};

const isMediaMimeType = (
    mimeType: string
): boolean => {
    return (
        mimeType.startsWith(
            "audio/"
        ) ||
        mimeType.startsWith(
            "video/"
        )
    );
};

const isExpectedMimeType = (
    mimeType: string,
    mediaType: InterviewMediaType
): boolean => {
    return mimeType.startsWith(
        `${mediaType}/`
    );
};

const validateMediaFileIdentity = (
    file: File,
    mediaType: InterviewMediaType
): void => {
    if (file.size <= 0) {
        throw new Error(
            `The selected ${mediaType} file is empty.`
        );
    }

    const mimeType =
        file.type
            .trim()
            .toLowerCase();

    const extension =
        getFileExtension(
            file.name
        );

    const hasSupportedExtension =
        supportedExtensions[
            mediaType
        ].has(extension);

    const hasExpectedMimeType =
        isExpectedMimeType(
            mimeType,
            mediaType
        );

    const hasConflictingMediaMimeType =
        Boolean(mimeType) &&
        isMediaMimeType(
            mimeType
        ) &&
        !hasExpectedMimeType;

    if (
        hasConflictingMediaMimeType
    ) {
        throw new Error(
            `The selected file is not a valid ${mediaType} file.`
        );
    }

    if (
        !hasExpectedMimeType &&
        !hasSupportedExtension
    ) {
        throw new Error(
            `Unsupported ${mediaType} format. Use ${supportedExtensionLabels[mediaType]}.`
        );
    }
};

export const formatInterviewMediaDuration = (
    durationSeconds: number
): string => {
    const roundedSeconds =
        Math.max(
            0,
            Math.round(
                durationSeconds
            )
        );

    const hours =
        Math.floor(
            roundedSeconds /
            3600
        );

    const minutes =
        Math.floor(
            (
                roundedSeconds %
                3600
            ) / 60
        );

    const seconds =
        roundedSeconds % 60;

    if (hours > 0) {
        return [
            hours,
            minutes,
            seconds,
        ]
            .map(
                (
                    value,
                    index
                ) =>
                    index === 0
                        ? String(
                            value
                        )
                        : String(
                            value
                        ).padStart(
                            2,
                            "0"
                        )
            )
            .join(":");
    }

    return [
        minutes,
        seconds,
    ]
        .map((value) =>
            String(
                value
            ).padStart(
                2,
                "0"
            )
        )
        .join(":");
};

const normalizeMetadataError = (
    error: unknown,
    mediaType: InterviewMediaType
): Error => {
    if (error instanceof Error) {
        return error;
    }

    return new Error(
        `Unable to read the selected ${mediaType} file. The file may be damaged or unsupported.`
    );
};

/**
 * Reads media metadata locally in the browser.
 *
 * The original file remains on the user's device.
 * The temporary object URL is always revoked after
 * metadata has loaded or an error occurs.
 */
export const readInterviewMediaMetadata =
    async (
        file: File,
        mediaType: InterviewMediaType
    ): Promise<InterviewMediaMetadata> => {
        validateMediaFileIdentity(
            file,
            mediaType
        );

        if (
            typeof document ===
            "undefined" ||
            typeof URL ===
            "undefined" ||
            typeof URL.createObjectURL !==
            "function"
        ) {
            throw new Error(
                "Media metadata validation is not available in this environment."
            );
        }

        const mediaElement =
            document.createElement(
                mediaType
            );

        const objectUrl =
            URL.createObjectURL(
                file
            );

        mediaElement.preload =
            "metadata";

        mediaElement.muted =
            true;

        try {
            return await new Promise<InterviewMediaMetadata>(
                (
                    resolve,
                    reject
                ) => {
                    let settled =
                        false;

                    const timeoutId =
                        window.setTimeout(
                            () => {
                                finishWithError(
                                    new Error(
                                        `Reading the selected ${mediaType} file took too long. Try another file.`
                                    )
                                );
                            },
                            MEDIA_METADATA_TIMEOUT_MS
                        );

                    const cleanup =
                        () => {
                            window.clearTimeout(
                                timeoutId
                            );

                            mediaElement.removeEventListener(
                                "loadedmetadata",
                                handleLoadedMetadata
                            );

                            mediaElement.removeEventListener(
                                "error",
                                handleMediaError
                            );

                            mediaElement.removeEventListener(
                                "abort",
                                handleMediaAbort
                            );
                        };

                    const finishWithError =
                        (
                            error: Error
                        ) => {
                            if (settled) {
                                return;
                            }

                            settled =
                                true;

                            cleanup();
                            reject(
                                error
                            );
                        };

                    const handleLoadedMetadata =
                        () => {
                            if (settled) {
                                return;
                            }

                            const durationSeconds =
                                mediaElement.duration;

                            if (
                                !Number.isFinite(
                                    durationSeconds
                                ) ||
                                durationSeconds <=
                                0
                            ) {
                                finishWithError(
                                    new Error(
                                        `The selected ${mediaType} file has an invalid or unreadable duration.`
                                    )
                                );
                                return;
                            }
                            if (
                                mediaType ===
                                "audio" &&
                                durationSeconds >
                                MAX_INTERVIEW_AUDIO_DURATION_SECONDS
                            ) {
                                finishWithError(
                                    new Error(
                                        "Audio interviews must be 60 minutes or shorter."
                                    )
                                );
                                return;
                            }
                            if (
                                mediaType ===
                                "video" &&
                                durationSeconds >
                                MAX_INTERVIEW_VIDEO_DURATION_SECONDS
                            ) {
                                finishWithError(
                                    new Error(
                                        "Video interviews must be 30 minutes or shorter."
                                    )
                                );
                                return;
                            }

                            const videoElement =
                                mediaType ===
                                    "video"
                                    ? (
                                        mediaElement as HTMLVideoElement
                                    )
                                    : null;

                            settled =
                                true;

                            cleanup();

                            resolve({
                                mediaType,
                                fileName:
                                    file.name,
                                mimeType:
                                    file.type ||
                                    "unknown",
                                sizeBytes:
                                    file.size,
                                durationSeconds,
                                durationLabel:
                                    formatInterviewMediaDuration(
                                        durationSeconds
                                    ),
                                width:
                                    videoElement
                                        ?.videoWidth ||
                                    null,
                                height:
                                    videoElement
                                        ?.videoHeight ||
                                    null,
                            });
                        };

                    const handleMediaError =
                        () => {
                            finishWithError(
                                new Error(
                                    `Unable to read the selected ${mediaType} file. The file may be damaged or unsupported.`
                                )
                            );
                        };

                    const handleMediaAbort =
                        () => {
                            finishWithError(
                                new Error(
                                    `${mediaType === "video" ? "Video" : "Audio"} metadata validation was interrupted.`
                                )
                            );
                        };

                    mediaElement.addEventListener(
                        "loadedmetadata",
                        handleLoadedMetadata
                    );

                    mediaElement.addEventListener(
                        "error",
                        handleMediaError
                    );

                    mediaElement.addEventListener(
                        "abort",
                        handleMediaAbort
                    );

                    mediaElement.src =
                        objectUrl;

                    mediaElement.load();
                }
            );
        } catch (error) {
            throw normalizeMetadataError(
                error,
                mediaType
            );
        } finally {
            mediaElement.pause();
            mediaElement.removeAttribute(
                "src"
            );
            mediaElement.load();

            URL.revokeObjectURL(
                objectUrl
            );
        }
    };