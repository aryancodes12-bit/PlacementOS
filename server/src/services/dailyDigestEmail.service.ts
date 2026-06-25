import {
    NotificationType,
} from "@prisma/client";

import {
    sendEmailJsTemplate,
} from "./emailJs.service";

import type {
    ReminderItem,
} from "./reminderEvaluation.service";

interface SendDailyDigestEmailInput {
    toEmail: string;
    toName: string;

    localDate: string;
    timezone: string;

    reminders: ReminderItem[];

    now?: Date;
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

const getReminderStatus = (
    reminders: ReminderItem[],
    type: NotificationType,
    fallback: string
): string => {
    return (
        reminders.find(
            (reminder) =>
                reminder.type === type
        )?.emailLine ??
        fallback
    );
};

const getPrimaryFocus = (
    reminders: ReminderItem[]
): string => {
    if (
        reminders.some(
            (reminder) =>
                reminder.type ===
                NotificationType
                    .DSA_REVISION_DUE
        )
    ) {
        return "Clear your due DSA revision queue before starting new problems.";
    }

    if (
        reminders.some(
            (reminder) =>
                reminder.type ===
                NotificationType.STREAK_RISK
        )
    ) {
        return "Complete one focused preparation task today and protect your consistency.";
    }

    if (
        reminders.some(
            (reminder) =>
                reminder.type ===
                NotificationType
                    .RESUME_STALE
        )
    ) {
        return "Review your latest resume and improve one measurable project or experience bullet.";
    }

    if (
        reminders.some(
            (reminder) =>
                reminder.type ===
                NotificationType
                    .INTERVIEW_INACTIVE
        )
    ) {
        return "Practice one technical or behavioural answer out loud using a clear structure.";
    }

    return "Continue your current preparation plan and complete the highest-priority task first.";
};

export const sendDailyDigestEmail =
    async ({
        toEmail,
        toName,
        localDate,
        timezone,
        reminders,
        now = new Date(),
    }: SendDailyDigestEmailInput):
        Promise<void> => {
        const templateId =
            requireEnvironmentVariable(
                "EMAILJS_DIGEST_TEMPLATE_ID"
            );

        const clientUrl =
            requireEnvironmentVariable(
                "CLIENT_URL"
            ).replace(
                /\/+$/,
                ""
            );

        const configuredLogoUrl =
            process.env
                .EMAILJS_LOGO_URL
                ?.trim();

        const logoUrl =
            configuredLogoUrl ||
            `${clientUrl}/placementos-logo.jpeg`;

        const digestDate =
            new Intl.DateTimeFormat(
                "en-IN",
                {
                    timeZone:
                        timezone,

                    weekday:
                        "long",

                    day:
                        "numeric",

                    month:
                        "long",

                    year:
                        "numeric",
                }
            ).format(now);

        const subject =
            `PlacementOS daily digest — ${digestDate}`;

        await sendEmailJsTemplate({
            templateId,

            logLabel:
                "daily digest",

            failureMessage:
                "Daily digest email could not be sent.",

            templateParams: {
                to_email:
                    toEmail,

                to_name:
                    toName,

                subject,

                application_name:
                    "PlacementOS",

                logo_url:
                    logoUrl,

                digest_date:
                    digestDate,

                local_date:
                    localDate,

                timezone,

                reminder_count:
                    reminders.length,

                streak_status:
                    getReminderStatus(
                        reminders,

                        NotificationType
                            .STREAK_RISK,

                        "Your preparation activity is on track for today."
                    ),

                dsa_status:
                    getReminderStatus(
                        reminders,

                        NotificationType
                            .DSA_REVISION_DUE,

                        "No tracked DSA revisions are currently due."
                    ),

                resume_status:
                    getReminderStatus(
                        reminders,

                        NotificationType
                            .RESUME_STALE,

                        "Your latest resume does not currently require a stale-data reminder."
                    ),

                interview_status:
                    getReminderStatus(
                        reminders,

                        NotificationType
                            .INTERVIEW_INACTIVE,

                        "Your interview-practice activity is currently on track."
                    ),

                focus_message:
                    getPrimaryFocus(
                        reminders
                    ),

                dashboard_url:
                    `${clientUrl}/dashboard`,

                preferences_url:
                    `${clientUrl}/settings`,
            },
        });
    };