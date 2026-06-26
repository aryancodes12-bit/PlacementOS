let ffmpegOperationQueue:
    Promise<void> =
    Promise.resolve();

/**
 * Serializes every operation using the singleton
 * FFmpeg instance.
 *
 * This prevents extraction and chunk-generation jobs
 * from modifying the FFmpeg virtual filesystem at the
 * same time.
 */
export const runInterviewFfmpegOperation =
    <Result>(
        operation:
            () => Promise<Result>
    ): Promise<Result> => {
        const result =
            ffmpegOperationQueue.then(
                operation,
                operation
            );

        ffmpegOperationQueue =
            result.then(
                () => undefined,
                () => undefined
            );

        return result;
    };