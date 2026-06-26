import type {
    FFmpeg,
} from "@ffmpeg/ffmpeg";

const FFMPEG_CORE_VERSION =
    "0.12.10";

const FFMPEG_CORE_BASE_URL =
    `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

let ffmpegInstance:
    | FFmpeg
    | null = null;

let ffmpegLoadPromise:
    | Promise<FFmpeg>
    | null = null;

export const isInterviewFfmpegSupported =
    (): boolean => {
        return (
            typeof window !==
            "undefined" &&
            typeof WebAssembly !==
            "undefined" &&
            typeof Worker !==
            "undefined" &&
            typeof Blob !==
            "undefined" &&
            typeof URL !==
            "undefined"
        );
    };

const createUnsupportedBrowserError =
    () => {
        return new Error(
            "This browser cannot process interview media locally. Use the latest desktop version of Chrome, Edge, or Firefox."
        );
    };

const normalizeFfmpegLoadError = (
    error: unknown
) => {
    if (
        error instanceof Error
    ) {
        return new Error(
            `Unable to load the local media processor: ${error.message}`
        );
    }

    return new Error(
        "Unable to load the local media processor."
    );
};

/**
 * Lazily downloads and initializes the single-thread
 * FFmpeg WebAssembly runtime.
 *
 * Calling this function repeatedly reuses the same instance
 * and the same in-progress load operation.
 */
export const loadInterviewFfmpeg =
    async (): Promise<FFmpeg> => {
        if (
            !isInterviewFfmpegSupported()
        ) {
            throw createUnsupportedBrowserError();
        }

        if (
            ffmpegInstance?.loaded
        ) {
            return ffmpegInstance;
        }

        if (
            ffmpegLoadPromise
        ) {
            return ffmpegLoadPromise;
        }

        ffmpegLoadPromise =
            (async () => {
                const [
                    ffmpegModule,
                    utilModule,
                ] =
                    await Promise.all([
                        import(
                            "@ffmpeg/ffmpeg"
                        ),

                        import(
                            "@ffmpeg/util"
                        ),
                    ]);

                const {
                    FFmpeg,
                } =
                    ffmpegModule;

                const {
                    toBlobURL,
                } =
                    utilModule;

                const ffmpeg =
                    ffmpegInstance ??
                    new FFmpeg();

                ffmpegInstance =
                    ffmpeg;

                if (
                    !ffmpeg.loaded
                ) {
                    const [
                        coreURL,
                        wasmURL,
                    ] =
                        await Promise.all([
                            toBlobURL(
                                `${FFMPEG_CORE_BASE_URL}/ffmpeg-core.js`,
                                "text/javascript"
                            ),

                            toBlobURL(
                                `${FFMPEG_CORE_BASE_URL}/ffmpeg-core.wasm`,
                                "application/wasm"
                            ),
                        ]);

                    await ffmpeg.load({
                        coreURL,
                        wasmURL,
                    });
                }

                return ffmpeg;
            })().catch(
                (
                    error:
                        unknown
                ) => {
                    ffmpegInstance
                        ?.terminate();

                    ffmpegInstance =
                        null;

                    ffmpegLoadPromise =
                        null;

                    throw normalizeFfmpegLoadError(
                        error
                    );
                }
            );

        return ffmpegLoadPromise;
    };

/**
 * Returns true only after the FFmpeg core has finished loading.
 */
export const isInterviewFfmpegLoaded =
    (): boolean => {
        return (
            ffmpegInstance
                ?.loaded ??
            false
        );
    };

/**
 * Terminates the worker and clears the singleton.
 * The next operation will load a fresh runtime.
 */
export const terminateInterviewFfmpeg =
    (): void => {
        ffmpegInstance
            ?.terminate();

        ffmpegInstance =
            null;

        ffmpegLoadPromise =
            null;
    };