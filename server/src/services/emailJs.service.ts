import axios from "axios";

export type EmailJsTemplateValue =
    | string
    | number
    | boolean
    | null
    | undefined;

export type EmailJsTemplateParameters =
    Record<string, EmailJsTemplateValue>;

interface SendEmailJsTemplateInput {
    templateId: string;
    templateParams: EmailJsTemplateParameters;

    logLabel: string;
    failureMessage: string;
}

interface EmailJsRequestBody {
    service_id: string;
    template_id: string;
    user_id: string;

    accessToken?: string;

    template_params:
    EmailJsTemplateParameters;
}

const EMAILJS_ENDPOINT =
    "https://api.emailjs.com/api/v1.0/email/send";

const EMAIL_SEND_INTERVAL_MS = 1_100;

let emailQueue: Promise<void> =
    Promise.resolve();

let lastEmailAttemptAt = 0;

const requireEnvironmentVariable = (
    key: string
): string => {
    const value =
        process.env[key]?.trim();

    if (!value) {
        throw new Error(
            `Missing required environment variable: ${key}`
        );
    }

    return value;
};

const wait = (
    milliseconds: number
): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(
            resolve,
            milliseconds
        );
    });
};

const enqueueEmail = async (
    operation: () => Promise<void>
): Promise<void> => {
    const queuedOperation =
        emailQueue.then(
            async () => {
                const elapsed =
                    Date.now() -
                    lastEmailAttemptAt;

                const remainingDelay =
                    Math.max(
                        0,
                        EMAIL_SEND_INTERVAL_MS -
                        elapsed
                    );

                if (
                    remainingDelay > 0
                ) {
                    await wait(
                        remainingDelay
                    );
                }

                try {
                    await operation();
                } finally {
                    /*
                     * Record every network attempt,
                     * including failed attempts, so the
                     * EmailJS rate limit remains protected.
                     */
                    lastEmailAttemptAt =
                        Date.now();
                }
            }
        );

    /*
     * A failed email must not permanently
     * break the queue for later emails.
     */
    emailQueue =
        queuedOperation.catch(
            () => undefined
        );

    return queuedOperation;
};

export const sendEmailJsTemplate =
    async ({
        templateId,
        templateParams,
        logLabel,
        failureMessage,
    }: SendEmailJsTemplateInput):
        Promise<void> => {
        const serviceId =
            requireEnvironmentVariable(
                "EMAILJS_SERVICE_ID"
            );

        const publicKey =
            requireEnvironmentVariable(
                "EMAILJS_PUBLIC_KEY"
            );

        const privateKey =
            process.env
                .EMAILJS_PRIVATE_KEY
                ?.trim();

        const requestBody:
            EmailJsRequestBody = {
            service_id:
                serviceId,

            template_id:
                templateId,

            user_id:
                publicKey,

            template_params:
                templateParams,
        };

        if (privateKey) {
            requestBody.accessToken =
                privateKey;
        }

        await enqueueEmail(
            async () => {
                try {
                    await axios.post(
                        EMAILJS_ENDPOINT,
                        requestBody,
                        {
                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            timeout:
                                10_000,
                        }
                    );
                } catch (
                error: unknown
                ) {
                    if (
                        axios.isAxiosError(
                            error
                        )
                    ) {
                        console.error(
                            `EmailJS ${logLabel} error:`,
                            {
                                status:
                                    error
                                        .response
                                        ?.status,

                                response:
                                    error
                                        .response
                                        ?.data,

                                message:
                                    error
                                        .message,
                            }
                        );
                    } else {
                        console.error(
                            `EmailJS ${logLabel} error:`,
                            error
                        );
                    }

                    throw new Error(
                        failureMessage
                    );
                }
            }
        );
    };