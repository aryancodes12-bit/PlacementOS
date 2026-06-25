import {
    prisma,
} from "../prisma/client";

import {
    emitNotificationToUser,
    toRealtimeNotification,
} from "../realtime/socket";

import {
    createNotification,
} from "./notification.service";

import {
    evaluateReminders,
} from "./reminderEvaluation.service";

import type {
    ReminderItem,
} from "./reminderEvaluation.service";

import {
    sendDailyDigestEmail,
} from "./dailyDigestEmail.service";

interface LocalClock {
    localDate: string;

    hour: number;
    minute: number;

    totalMinutes: number;
}

interface PersistReminderInput {
    userId: string;
    reminder: ReminderItem;

    emailEligible: boolean;
}

export interface NotificationAutomationSummary {
    startedAt: string;
    completedAt: string;

    preferencesScanned: number;
    usersDue: number;

    remindersEvaluated: number;
    notificationsCreated: number;

    emailsSent: number;
    emailsSkipped: number;

    errors: Array<{
        userId: string;
        message: string;
    }>;
}

const getLocalClock = (
    date: Date,
    timezone: string
): LocalClock => {
    const parts =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    timezone,

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                hourCycle:
                    "h23",
            }
        ).formatToParts(date);

    const getPart = (
        type: Intl.DateTimeFormatPartTypes
    ): string => {
        return (
            parts.find(
                (part) =>
                    part.type === type
            )?.value ??
            ""
        );
    };

    const year =
        getPart("year");

    const month =
        getPart("month");

    const day =
        getPart("day");

    const hour =
        Number(
            getPart("hour")
        );

    const minute =
        Number(
            getPart("minute")
        );

    if (
        !year ||
        !month ||
        !day ||
        !Number.isInteger(hour) ||
        !Number.isInteger(minute)
    ) {
        throw new Error(
            `Unable to calculate local time for timezone: ${timezone}`
        );
    }

    return {
        localDate:
            `${year}-${month}-${day}`,

        hour,
        minute,

        totalMinutes:
            hour * 60 + minute,
    };
};

const persistReminder =
    async ({
        userId,
        reminder,
        emailEligible,
    }: PersistReminderInput) => {
        const existing =
            await prisma.notification
                .findUnique({
                    where: {
                        userId_dedupeKey: {
                            userId,

                            dedupeKey:
                                reminder.dedupeKey,
                        },
                    },
                });

        if (existing) {
            return {
                notification:
                    existing,

                created:
                    false,
            };
        }

        try {
            const notification =
                await createNotification({
                    userId,

                    type:
                        reminder.type,

                    title:
                        reminder.title,

                    message:
                        reminder.message,

                    link:
                        reminder.link,

                    dedupeKey:
                        reminder.dedupeKey,

                    emailEligible,

                    metadata:
                        reminder.metadata,
                });

            emitNotificationToUser(
                userId,

                toRealtimeNotification(
                    notification
                )
            );

            return {
                notification,
                created: true,
            };
        } catch (error) {
            /*
             * Protect against two scheduler calls racing
             * to create the same dedupe key.
             */
            const notification =
                await prisma.notification
                    .findUnique({
                        where: {
                            userId_dedupeKey: {
                                userId,

                                dedupeKey:
                                    reminder
                                        .dedupeKey,
                            },
                        },
                    });

            if (notification) {
                return {
                    notification,
                    created:
                        false,
                };
            }

            throw error;
        }
    };

const getErrorMessage = (
    error: unknown
): string => {
    return error instanceof Error
        ? error.message
        : "Unknown notification automation error.";
};

export const runNotificationAutomation =
    async (
        now = new Date()
    ): Promise<NotificationAutomationSummary> => {
        const summary:
            NotificationAutomationSummary = {
            startedAt:
                now.toISOString(),

            completedAt:
                now.toISOString(),

            preferencesScanned:
                0,

            usersDue:
                0,

            remindersEvaluated:
                0,

            notificationsCreated:
                0,

            emailsSent:
                0,

            emailsSkipped:
                0,

            errors: [],
        };

        const preferences =
            await prisma
                .notificationPreference
                .findMany({
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                emailVerified:
                                    true,
                            },
                        },
                    },
                });

        summary.preferencesScanned =
            preferences.length;

        for (
            const preference
            of preferences
        ) {
            try {
                const localClock =
                    getLocalClock(
                        now,

                        preference
                            .timezone
                    );

                const scheduledMinutes =
                    preference
                        .digestHour *
                    60 +
                    preference
                        .digestMinute;

                /*
                 * Run after the configured local time.
                 * The daily dedupe keys prevent repeated
                 * notification creation on later runs.
                 */
                if (
                    localClock
                        .totalMinutes <
                    scheduledMinutes
                ) {
                    continue;
                }

                summary.usersDue +=
                    1;

                const reminders =
                    await evaluateReminders({
                        userId:
                            preference
                                .userId,

                        localDate:
                            localClock
                                .localDate,

                        timezone:
                            preference
                                .timezone,

                        preferences: {
                            streakRiskEnabled:
                                preference
                                    .streakRiskEnabled,

                            dsaRevisionEnabled:
                                preference
                                    .dsaRevisionEnabled,

                            resumeStaleEnabled:
                                preference
                                    .resumeStaleEnabled,

                            interviewInactiveEnabled:
                                preference
                                    .interviewInactiveEnabled,
                        },

                        now,
                    });

                summary.remindersEvaluated +=
                    reminders.length;

                const canReceiveEmail =
                    preference
                        .emailDigestEnabled &&
                    preference
                        .user
                        .emailVerified;

                const notificationIds:
                    string[] = [];

                for (
                    const reminder
                    of reminders
                ) {
                    const result =
                        await persistReminder({
                            userId:
                                preference
                                    .userId,

                            reminder,

                            emailEligible:
                                canReceiveEmail,
                        });

                    notificationIds.push(
                        result
                            .notification
                            .id
                    );

                    if (
                        result.created
                    ) {
                        summary.notificationsCreated +=
                            1;
                    }
                }

                if (
                    !preference
                        .emailDigestEnabled ||
                    !preference
                        .user
                        .emailVerified
                ) {
                    summary.emailsSkipped +=
                        1;

                    continue;
                }

                if (
                    preference
                        .lastDigestDate ===
                    localClock.localDate
                ) {
                    summary.emailsSkipped +=
                        1;

                    continue;
                }

                if (
                    reminders.length === 0
                ) {
                    summary.emailsSkipped +=
                        1;

                    continue;
                }

                await sendDailyDigestEmail({
                    toEmail:
                        preference
                            .user
                            .email,

                    toName:
                        preference
                            .user
                            .name,

                    localDate:
                        localClock
                            .localDate,

                    timezone:
                        preference
                            .timezone,

                    reminders,

                    now,
                });

                await prisma.$transaction([
                    prisma
                        .notificationPreference
                        .update({
                            where: {
                                userId:
                                    preference
                                        .userId,
                            },

                            data: {
                                lastDigestDate:
                                    localClock
                                        .localDate,

                                lastDigestSentAt:
                                    now,
                            },
                        }),

                    prisma.notification
                        .updateMany({
                            where: {
                                id: {
                                    in:
                                        notificationIds,
                                },
                            },

                            data: {
                                emailEligible:
                                    true,

                                emailSentAt:
                                    now,
                            },
                        }),
                ]);

                summary.emailsSent +=
                    1;
            } catch (error) {
                summary.errors.push({
                    userId:
                        preference
                            .userId,

                    message:
                        getErrorMessage(
                            error
                        ),
                });

                console.error(
                    "Notification automation user failure:",
                    {
                        userId:
                            preference
                                .userId,

                        error,
                    }
                );
            }
        }

        summary.completedAt =
            new Date().toISOString();

        return summary;
    };