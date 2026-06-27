import axios from "axios";

type AuthProvider =
    | "PASSWORD"
    | "GOOGLE";

interface AuthAlertUser {
    userId: string;
    name?: string | null;
    email: string;
    authProvider: AuthProvider;
    occurredAt?: Date;
}

interface TelegramSendMessageResponse {
    ok: boolean;
    description?: string;
}

const TELEGRAM_REQUEST_TIMEOUT_MS =
    5_000;

const isTelegramAuthAlertsEnabled =
    (): boolean => {
        return (
            process.env
                .TELEGRAM_AUTH_ALERTS_ENABLED
                ?.trim()
                .toLowerCase() ===
            "true"
        );
    };

const getTelegramConfiguration =
    (): {
        botToken: string;
        chatId: string;
    } | null => {
        const botToken =
            process.env
                .TELEGRAM_BOT_TOKEN
                ?.trim();

        const chatId =
            process.env
                .TELEGRAM_ADMIN_CHAT_ID
                ?.trim();

        if (
            !botToken ||
            !chatId
        ) {
            return null;
        }

        return {
            botToken,
            chatId,
        };
    };

const maskEmail = (
    email: string
): string => {
    const [
        localPart,
        domain,
    ] =
        email.split("@");

    if (
        !localPart ||
        !domain
    ) {
        return "unknown";
    }

    if (
        localPart.length <=
        2
    ) {
        return `${localPart[0] ?? "*"}***@${domain}`;
    }

    return (
        `${localPart.slice(
            0,
            2
        )}` +
        `***@${domain}`
    );
};

const formatTimestamp = (
    date: Date
): string => {
    return new Intl
        .DateTimeFormat(
            "en-IN",
            {
                timeZone:
                    "Asia/Kolkata",

                dateStyle:
                    "medium",

                timeStyle:
                    "medium",
            }
        )
        .format(
            date
        );
};

const sanitizeText = (
    value: string
): string => {
    return value
        .replace(
            /[\u0000-\u001F\u007F]/g,
            " "
        )
        .trim();
};

const sendTelegramMessage = async (
    message: string
): Promise<void> => {
    if (
        !isTelegramAuthAlertsEnabled()
    ) {
        return;
    }

    const configuration =
        getTelegramConfiguration();

    if (
        !configuration
    ) {
        console.warn(
            "[Telegram] Auth alerts are enabled but Telegram configuration is incomplete."
        );

        return;
    }

    const endpoint =
        `https://api.telegram.org/bot` +
        `${configuration.botToken}` +
        `/sendMessage`;

    try {
        const response =
            await axios.post<TelegramSendMessageResponse>(
                endpoint,
                {
                    chat_id:
                        configuration.chatId,

                    text:
                        message,

                    disable_web_page_preview:
                        true,
                },
                {
                    timeout:
                        TELEGRAM_REQUEST_TIMEOUT_MS,

                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );

        if (
            !response.data.ok
        ) {
            console.warn(
                "[Telegram] Telegram rejected the auth alert request.",
                response.data
                    .description ??
                "Unknown Telegram error."
            );
        }
    } catch (
    error: unknown
    ) {
        if (
            axios.isAxiosError(
                error
            )
        ) {
            console.error(
                "[Telegram] Failed to send auth alert:",
                error.response
                    ?.data
                    ?.description ??
                error.message
            );

            return;
        }

        console.error(
            "[Telegram] Failed to send auth alert:",
            error instanceof Error
                ? error.message
                : "Unknown error"
        );
    }
};

export const notifyAdminOfSignup = async ({
    userId,
    name,
    email,
    authProvider,
    occurredAt =
    new Date(),
}: AuthAlertUser): Promise<void> => {
    const safeName =
        sanitizeText(
            name ??
            "Not provided"
        );

    const safeUserId =
        sanitizeText(
            userId
        );

    const message = [
        "🟢 New PlacementOS Signup",
        "",
        `Name: ${safeName}`,
        `Email: ${maskEmail(email)}`,
        `Method: ${authProvider}`,
        `Time: ${formatTimestamp(occurredAt)}`,
        `User ID: ${safeUserId}`,
    ].join("\n");

    await sendTelegramMessage(
        message
    );
};

export const notifyAdminOfLogin = async ({
    userId,
    name,
    email,
    authProvider,
    occurredAt =
    new Date(),
}: AuthAlertUser): Promise<void> => {
    const safeName =
        sanitizeText(
            name ??
            "Not provided"
        );

    const safeUserId =
        sanitizeText(
            userId
        );

    const message = [
        "🔐 PlacementOS Login",
        "",
        `Name: ${safeName}`,
        `Email: ${maskEmail(email)}`,
        `Method: ${authProvider}`,
        `Time: ${formatTimestamp(occurredAt)}`,
        `User ID: ${safeUserId}`,
    ].join("\n");

    await sendTelegramMessage(
        message
    );
};