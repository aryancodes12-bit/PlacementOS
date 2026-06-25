import {
    sendEmailJsTemplate,
} from "./emailJs.service";

interface SendVerificationEmailInput {
    email: string;
    name: string;
    token: string;
}

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

export const sendVerificationEmail =
    async ({
        email,
        name,
        token,
    }: SendVerificationEmailInput):
        Promise<void> => {
        const templateId =
            requireEnvironmentVariable(
                "EMAILJS_TEMPLATE_ID"
            );

        const clientUrl =
            requireEnvironmentVariable(
                "CLIENT_URL"
            ).replace(
                /\/+$/,
                ""
            );

        const verificationLink =
            `${clientUrl}/verify-email?token=` +
            encodeURIComponent(token);

        await sendEmailJsTemplate({
            templateId,

            logLabel:
                "verification",

            failureMessage:
                "Verification email could not be sent.",

            templateParams: {
                to_email:
                    email,

                to_name:
                    name,

                verification_link:
                    verificationLink,

                expires_in:
                    "30 minutes",

                application_name:
                    "PlacementOS",
            },
        });
    };