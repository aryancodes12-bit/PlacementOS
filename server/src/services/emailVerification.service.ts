import axios from "axios";

interface SendVerificationEmailInput {
    email: string;
    name: string;
    token: string;
}

interface EmailJsRequestBody {
    service_id: string;
    template_id: string;
    user_id: string;
    accessToken?: string;

    template_params: {
        to_email: string;
        to_name: string;
        verification_link: string;
        expires_in: string;
        application_name: string;
    };
}

const EMAIL_SEND_INTERVAL_MS = 1_100;

let emailQueue: Promise<void> = Promise.resolve();
let lastEmailSentAt = 0;

const requireEnvironmentVariable = (
    key: string
): string => {
    const value = process.env[key]?.trim();

    if (!value) {
        throw new Error(
            `Missing required environment variable: ${key}`
        );
    }

    return value;
};

const wait = (milliseconds: number) =>
    new Promise<void>((resolve) => {
        setTimeout(resolve, milliseconds);
    });

const enqueueEmail = async (
    operation: () => Promise<void>
): Promise<void> => {
    const queuedOperation = emailQueue.then(
        async () => {
            const elapsed =
                Date.now() - lastEmailSentAt;

            const remainingDelay = Math.max(
                0,
                EMAIL_SEND_INTERVAL_MS - elapsed
            );

            if (remainingDelay > 0) {
                await wait(remainingDelay);
            }

            await operation();

            lastEmailSentAt = Date.now();
        }
    );

    emailQueue = queuedOperation.catch(
        () => undefined
    );

    return queuedOperation;
};

export const sendVerificationEmail = async ({
    email,
    name,
    token,
}: SendVerificationEmailInput): Promise<void> => {
    const serviceId =
        requireEnvironmentVariable(
            "EMAILJS_SERVICE_ID"
        );

    const templateId =
        requireEnvironmentVariable(
            "EMAILJS_TEMPLATE_ID"
        );

    const publicKey =
        requireEnvironmentVariable(
            "EMAILJS_PUBLIC_KEY"
        );

    /*
     * Optional. Only needed when private-key authorization
     * is enabled in EmailJS Account → Security.
     */
    const privateKey =
        process.env.EMAILJS_PRIVATE_KEY?.trim();

    const clientUrl =
        requireEnvironmentVariable(
            "CLIENT_URL"
        ).replace(/\/+$/, "");

    const verificationLink =
        `${clientUrl}/verify-email?token=` +
        encodeURIComponent(token);

    const requestBody: EmailJsRequestBody = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,

        template_params: {
            to_email: email,
            to_name: name,
            verification_link:
                verificationLink,
            expires_in: "30 minutes",
            application_name: "PlacementOS",
        },
    };

    if (privateKey) {
        requestBody.accessToken =
            privateKey;
    }

    await enqueueEmail(async () => {
        try {
            await axios.post(
                "https://api.emailjs.com/api/v1.0/email/send",
                requestBody,
                {
                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    timeout: 10_000,
                }
            );
        } catch (error: any) {
            console.error(
                "EmailJS verification error:",
                {
                    status:
                        error.response?.status,

                    response:
                        error.response?.data,

                    message:
                        error.message,
                }
            );

            throw new Error(
                "Verification email could not be sent."
            );
        }
    });
};