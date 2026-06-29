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

const getReminderByType = (
    reminders: ReminderItem[],
    type: NotificationType
) => {
    return reminders.find(
        (reminder) =>
            reminder.type === type
    );
};

const getMetadataNumber = (
    reminder: ReminderItem | undefined,
    key: string
): number | null => {
    const value =
        reminder?.metadata[key];

    return typeof value === "number"
        ? value
        : null;
};

const pluralize = (
    count: number,
    singular: string,
    plural = `${singular}s`
) => {
    return count === 1
        ? singular
        : plural;
};

const buildDigestCoachCopy = (
    reminders: ReminderItem[]
) => {
    const dsaReminder =
        getReminderByType(
            reminders,
            NotificationType.DSA_REVISION_DUE
        );

    const streakReminder =
        getReminderByType(
            reminders,
            NotificationType.STREAK_RISK
        );

    const resumeReminder =
        getReminderByType(
            reminders,
            NotificationType.RESUME_STALE
        );

    const interviewReminder =
        getReminderByType(
            reminders,
            NotificationType.INTERVIEW_INACTIVE
        );

    if (dsaReminder) {
        const dueCount =
            getMetadataNumber(
                dsaReminder,
                "dueCount"
            ) ?? 0;

        const problemText =
            dueCount > 0
                ? `${dueCount} ${pluralize(
                    dueCount,
                    "problem"
                )}`
                : "your due queue";

        return {
            priorityTitle:
                "Clear DSA revision first",

            focusMessage:
                `Start with ${problemText} due for spaced revision before adding new work.`,

            nextStep:
                "Revise the due item, write the mistake pattern, and mark the next revision date.",
        };
    }

    if (
        streakReminder &&
        (resumeReminder || interviewReminder)
    ) {
        return {
            priorityTitle:
                "Protect today's streak",

            focusMessage:
                "Log one focused preparation action today, then handle the oldest open readiness gap.",

            nextStep:
                resumeReminder
                    ? "Complete one resume edit that improves keywords, project clarity, or ATS evidence."
                    : "Record or review one spoken answer so interview practice is active again.",
        };
    }

    if (streakReminder) {
        return {
            priorityTitle:
                "Protect today's streak",

            focusMessage:
                "Complete one measurable preparation task before the day ends.",

            nextStep:
                "Pick the smallest task that creates evidence: a solved note, a resume bullet, or a recorded answer.",
        };
    }

    if (resumeReminder) {
        const ageDays =
            getMetadataNumber(
                resumeReminder,
                "resumeAgeDays"
            );

        return {
            priorityTitle:
                ageDays
                    ? "Refresh stale resume evidence"
                    : "Add resume evidence",

            focusMessage:
                ageDays
                    ? `Your resume is ${ageDays} ${pluralize(
                        ageDays,
                        "day"
                    )} old; update one role-relevant project or keyword section.`
                    : "Upload your resume so PlacementOS can score ATS, role fit, keywords, and projects.",

            nextStep:
                ageDays
                    ? "Rewrite one project bullet with action, tech stack, metric, and impact."
                    : "Upload a clean one-page PDF with education, skills, projects, and links.",
        };
    }

    if (interviewReminder) {
        const inactiveDays =
            getMetadataNumber(
                interviewReminder,
                "inactiveDays"
            );

        return {
            priorityTitle:
                inactiveDays
                    ? "Restart interview practice"
                    : "Create interview evidence",

            focusMessage:
                inactiveDays
                    ? `Your last interview replay was ${inactiveDays} ${pluralize(
                        inactiveDays,
                        "day"
                    )} ago; practice one structured answer today.`
                    : "Record one mock or past interview so feedback can target real weaknesses.",

            nextStep:
                "Speak one project answer using problem, architecture, tradeoff, and measurable result.",
        };
    }

    return {
        priorityTitle:
            "Stay on plan",

        focusMessage:
            "Continue your current preparation plan and complete the highest-priority task first.",

        nextStep:
            "Choose one task that leaves a concrete artifact for tomorrow's plan.",
    };
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
            `PlacementOS daily digest - ${digestDate}`;

        const coachCopy =
            buildDigestCoachCopy(
                reminders
            );

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

                priority_title:
                    coachCopy
                        .priorityTitle,

                priority_message:
                    coachCopy
                        .focusMessage,

                next_step:
                    coachCopy
                        .nextStep,

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
                    coachCopy
                        .focusMessage,

                dashboard_url:
                    `${clientUrl}/dashboard`,

                preferences_url:
                    `${clientUrl}/settings`,
            },
        });
    };
