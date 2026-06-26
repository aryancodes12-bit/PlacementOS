type UnknownRecord =
    Record<
        string,
        unknown
    >;

export interface GroqRetryOptions {
    operationName: string;

    /**
     * Number of retries after the first attempt.
     * maxRetries: 2 means at most 3 total attempts.
     */
    maxRetries?: number;

    baseDelayMs?: number;
    maxDelayMs?: number;
}

const DEFAULT_MAX_RETRIES =
    2;

const DEFAULT_BASE_DELAY_MS =
    1_000;

const DEFAULT_MAX_DELAY_MS =
    8_000;

const isRecord = (
    value: unknown
): value is UnknownRecord =>
    typeof value ===
    "object" &&
    value !==
    null;

const readNumericValue = (
    value: unknown
): number | null => {
    if (
        typeof value ===
        "number" &&
        Number.isFinite(
            value
        )
    ) {
        return value;
    }

    if (
        typeof value ===
        "string"
    ) {
        const parsed =
            Number(
                value
            );

        if (
            Number.isFinite(
                parsed
            )
        ) {
            return parsed;
        }
    }

    return null;
};

export const getGroqErrorStatus = (
    error: unknown
): number | null => {
    if (
        !isRecord(
            error
        )
    ) {
        return null;
    }

    const directStatus =
        readNumericValue(
            error.status
        ) ??
        readNumericValue(
            error.statusCode
        );

    if (
        directStatus !==
        null
    ) {
        return directStatus;
    }

    if (
        isRecord(
            error.response
        )
    ) {
        const responseStatus =
            readNumericValue(
                error.response.status
            ) ??
            readNumericValue(
                error.response.statusCode
            );

        if (
            responseStatus !==
            null
        ) {
            return responseStatus;
        }
    }

    if (
        isRecord(
            error.error
        )
    ) {
        return (
            readNumericValue(
                error.error.status
            ) ??
            readNumericValue(
                error.error.statusCode
            )
        );
    }

    return null;
};

const getHeaderValue = (
    headers: unknown,
    headerName: string
): string | null => {
    if (
        !headers
    ) {
        return null;
    }

    if (
        isRecord(
            headers
        ) &&
        typeof headers.get ===
        "function"
    ) {
        const getHeader =
            headers.get as (
                name: string
            ) => unknown;

        const value =
            getHeader(
                headerName
            );

        return typeof value ===
            "string"
            ? value
            : null;
    }

    if (
        !isRecord(
            headers
        )
    ) {
        return null;
    }

    const normalizedHeaderName =
        headerName.toLowerCase();

    for (
        const [
            key,
            value,
        ] of Object.entries(
            headers
        )
    ) {
        if (
            key.toLowerCase() !==
            normalizedHeaderName
        ) {
            continue;
        }

        if (
            typeof value ===
            "string"
        ) {
            return value;
        }

        if (
            typeof value ===
            "number"
        ) {
            return String(
                value
            );
        }
    }

    return null;
};

const getGroqErrorHeaders = (
    error: unknown
): unknown => {
    if (
        !isRecord(
            error
        )
    ) {
        return null;
    }

    if (
        error.headers
    ) {
        return error.headers;
    }

    if (
        isRecord(
            error.response
        )
    ) {
        return (
            error.response.headers ??
            null
        );
    }

    return null;
};

const parseRetryAfterMs = (
    error: unknown
): number | null => {
    const retryAfter =
        getHeaderValue(
            getGroqErrorHeaders(
                error
            ),
            "retry-after"
        );

    if (
        !retryAfter
    ) {
        return null;
    }

    const seconds =
        Number(
            retryAfter
        );

    if (
        Number.isFinite(
            seconds
        ) &&
        seconds >= 0
    ) {
        return Math.ceil(
            seconds *
            1_000
        );
    }

    const retryDate =
        Date.parse(
            retryAfter
        );

    if (
        Number.isNaN(
            retryDate
        )
    ) {
        return null;
    }

    return Math.max(
        retryDate -
        Date.now(),
        0
    );
};

export const isRetryableGroqError = (
    error: unknown
): boolean => {
    const status =
        getGroqErrorStatus(
            error
        );

    return (
        status ===
        429 ||
        (
            status !==
            null &&
            status >=
            500 &&
            status <=
            599
        )
    );
};

const sleep = (
    delayMs: number
): Promise<void> =>
    new Promise(
        (resolve) => {
            setTimeout(
                resolve,
                delayMs
            );
        }
    );

const calculateRetryDelayMs = (
    error: unknown,
    retryNumber: number,
    baseDelayMs: number,
    maxDelayMs: number
): number => {
    const retryAfterMs =
        parseRetryAfterMs(
            error
        );

    if (
        retryAfterMs !==
        null
    ) {
        return Math.min(
            Math.max(
                retryAfterMs,
                0
            ),
            maxDelayMs
        );
    }

    const exponentialDelay =
        baseDelayMs *
        2 **
        Math.max(
            retryNumber -
            1,
            0
        );

    const jitterMs =
        Math.floor(
            Math.random() *
            Math.max(
                Math.floor(
                    baseDelayMs /
                    2
                ),
                1
            )
        );

    return Math.min(
        exponentialDelay +
        jitterMs,
        maxDelayMs
    );
};

export const executeGroqRequestWithRetry =
    async <T>(
        operation: () => Promise<T>,
        options: GroqRetryOptions
    ): Promise<T> => {
        const maxRetries =
            options.maxRetries ??
            DEFAULT_MAX_RETRIES;

        const baseDelayMs =
            options.baseDelayMs ??
            DEFAULT_BASE_DELAY_MS;

        const maxDelayMs =
            options.maxDelayMs ??
            DEFAULT_MAX_DELAY_MS;

        let retryNumber =
            0;

        while (
            true
        ) {
            const attemptNumber =
                retryNumber +
                1;

            try {
                return await operation();
            } catch (
            error
            ) {
                const status =
                    getGroqErrorStatus(
                        error
                    );

                const shouldRetry =
                    isRetryableGroqError(
                        error
                    ) &&
                    retryNumber <
                    maxRetries;

                if (
                    !shouldRetry
                ) {
                    console.error(
                        "[Groq] Request failed",
                        {
                            operation:
                                options.operationName,

                            attempt:
                                attemptNumber,

                            status:
                                status ??
                                "unknown",

                            retrying:
                                false,
                        }
                    );

                    throw error;
                }

                retryNumber +=
                    1;

                const delayMs =
                    calculateRetryDelayMs(
                        error,
                        retryNumber,
                        baseDelayMs,
                        maxDelayMs
                    );

                console.warn(
                    "[Groq] Temporary failure; retry scheduled",
                    {
                        operation:
                            options.operationName,

                        attempt:
                            attemptNumber,

                        status:
                            status ??
                            "unknown",

                        retry:
                            retryNumber,

                        maxRetries,

                        delayMs,
                    }
                );

                await sleep(
                    delayMs
                );
            }
        }
    };

class SerialGroqQueue {
    private tail:
        Promise<void> =
        Promise.resolve();

    private activeCount =
        0;

    private waitingCount =
        0;

    async run<T>(
        operationName: string,
        operation: () => Promise<T>
    ): Promise<T> {
        this.waitingCount +=
            1;

        const previousTask =
            this.tail.catch(
                () =>
                    undefined
            );

        let releaseTask:
            () => void =
            () =>
                undefined;

        const currentTask =
            new Promise<void>(
                (resolve) => {
                    releaseTask =
                        resolve;
                }
            );

        this.tail =
            previousTask.then(
                () =>
                    currentTask
            );

        await previousTask;

        this.waitingCount -=
            1;

        this.activeCount +=
            1;

        console.info(
            "[Groq] Transcription started",
            {
                operation:
                    operationName,

                active:
                    this.activeCount,

                waiting:
                    this.waitingCount,
            }
        );

        try {
            return await operation();
        } finally {
            this.activeCount -=
                1;

            releaseTask();

            console.info(
                "[Groq] Transcription finished",
                {
                    operation:
                        operationName,

                    active:
                        this.activeCount,

                    waiting:
                        this.waitingCount,
                }
            );
        }
    }

    getStats() {
        return {
            active:
                this.activeCount,

            waiting:
                this.waitingCount,
        };
    }
}

const groqTranscriptionQueue =
    new SerialGroqQueue();

/**
 * Runs transcription calls one at a time across this server process.
 *
 * This protects the shared Groq API key from bursts while keeping
 * chunk order deterministic.
 */
export const runGroqTranscriptionTask =
    <T>(
        operationName: string,
        operation: () => Promise<T>
    ): Promise<T> =>
        groqTranscriptionQueue.run(
            operationName,
            () =>
                executeGroqRequestWithRetry(
                    operation,
                    {
                        operationName,
                    }
                )
        );

export const getGroqTranscriptionQueueStats =
    () =>
        groqTranscriptionQueue.getStats();