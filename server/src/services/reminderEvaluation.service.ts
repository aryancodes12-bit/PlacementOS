import {
    NotificationType,
    type NotificationPreference,
} from "@prisma/client";

import {
    prisma,
} from "../prisma/client";

const DAY_IN_MILLISECONDS =
    24 * 60 * 60 * 1_000;

const RESUME_STALE_DAYS = 30;
const INTERVIEW_INACTIVE_DAYS = 14;

type ReminderPreferenceFlags =
    Pick<
        NotificationPreference,
        | "streakRiskEnabled"
        | "dsaRevisionEnabled"
        | "resumeStaleEnabled"
        | "interviewInactiveEnabled"
    >;

export interface ReminderItem {
    type: NotificationType;

    title: string;
    message: string;
    link: string;

    dedupeKey: string;
    emailLine: string;

    metadata: Record<
        string,
        string | number | boolean
    >;
}

interface EvaluateRemindersInput {
    userId: string;
    localDate: string;
    timezone: string;

    preferences:
    ReminderPreferenceFlags;

    now?: Date;
}

const daysSince = (
    value: Date,
    now: Date
): number => {
    return Math.max(
        0,
        Math.floor(
            (
                now.getTime() -
                value.getTime()
            ) /
            DAY_IN_MILLISECONDS
        )
    );
};

export const evaluateReminders =
    async ({
        userId,
        localDate,
        timezone,
        preferences,
        now = new Date(),
    }: EvaluateRemindersInput):
        Promise<ReminderItem[]> => {
        /*
         * Streak.date uses PostgreSQL DATE.
         * UTC midnight preserves the requested YYYY-MM-DD.
         */
        const localCalendarDate =
            new Date(
                `${localDate}T00:00:00.000Z`
            );

        const [
            todayActivityCount,
            dueDsaRevisionCount,
            totalDsaProblems,
            latestResume,
            latestInterview,
        ] = await Promise.all([
            prisma.streak.count({
                where: {
                    userId,
                    date:
                        localCalendarDate,
                },
            }),

            prisma.dSAProblem.count({
                where: {
                    userId,

                    nextRevisionAt: {
                        lte: now,
                    },
                },
            }),

            prisma.dSAProblem.count({
                where: {
                    userId,
                },
            }),

            prisma.resume.findFirst({
                where: {
                    userId,
                },

                orderBy: {
                    createdAt:
                        "desc",
                },

                select: {
                    id: true,
                    fileName: true,
                    atsScore: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),

            prisma.interviewSession
                .findFirst({
                    where: {
                        userId,
                    },

                    orderBy: {
                        date:
                            "desc",
                    },

                    select: {
                        id: true,
                        company: true,
                        role: true,
                        date: true,
                    },
                }),
        ]);

        const hasPreparationEvidence =
            totalDsaProblems > 0 ||
            Boolean(latestResume) ||
            Boolean(latestInterview);

        if (!hasPreparationEvidence) {
            return [];
        }

        const reminders:
            ReminderItem[] = [];

        if (
            preferences
                .streakRiskEnabled &&
            todayActivityCount === 0
        ) {
            reminders.push({
                type:
                    NotificationType.STREAK_RISK,

                title:
                    "Your preparation streak is at risk",

                message:
                    "No preparation activity has been recorded today. Complete one focused task before the day ends.",

                link:
                    "/dashboard",

                dedupeKey:
                    `STREAK_RISK:${localDate}`,

                emailLine:
                    "No preparation activity has been recorded today. Complete one focused task to protect your consistency.",

                metadata: {
                    localDate,
                    timezone,
                    activityCount:
                        todayActivityCount,
                },
            });
        }

        if (
            preferences
                .dsaRevisionEnabled &&
            dueDsaRevisionCount > 0
        ) {
            const problemLabel =
                dueDsaRevisionCount === 1
                    ? "problem is"
                    : "problems are";

            reminders.push({
                type:
                    NotificationType.DSA_REVISION_DUE,

                title:
                    "DSA revisions are due",

                message:
                    `${dueDsaRevisionCount} tracked ${problemLabel} due for revision.`,

                link:
                    "/dsa",

                dedupeKey:
                    `DSA_REVISION_DUE:${localDate}`,

                emailLine:
                    `${dueDsaRevisionCount} tracked ${problemLabel} due or overdue for revision.`,

                metadata: {
                    localDate,
                    timezone,
                    dueCount:
                        dueDsaRevisionCount,
                },
            });
        }

        if (
            preferences
                .resumeStaleEnabled
        ) {
            if (!latestResume) {
                reminders.push({
                    type:
                        NotificationType.RESUME_STALE,

                    title:
                        "Add your resume to PlacementOS",

                    message:
                        "Your preparation profile has activity, but no resume has been uploaded yet.",

                    link:
                        "/resume",

                    dedupeKey:
                        `RESUME_STALE:${localDate}`,

                    emailLine:
                        "No resume is currently available. Upload one to unlock ATS and role-fit analysis.",

                    metadata: {
                        localDate,
                        timezone,
                        reason:
                            "missing",
                    },
                });
            } else {
                const resumeAgeDays =
                    daysSince(
                        latestResume
                            .updatedAt,

                        now
                    );

                if (
                    resumeAgeDays >=
                    RESUME_STALE_DAYS
                ) {
                    reminders.push({
                        type:
                            NotificationType.RESUME_STALE,

                        title:
                            "Your resume may need an update",

                        message:
                            `Your latest resume has not been updated for ${resumeAgeDays} days.`,

                        link:
                            "/resume",

                        dedupeKey:
                            `RESUME_STALE:${localDate}`,

                        emailLine:
                            `Your latest resume is ${resumeAgeDays} days old. Review keywords, projects, and recent achievements.`,

                        metadata: {
                            localDate,
                            timezone,

                            resumeId:
                                latestResume.id,

                            resumeAgeDays,

                            atsScore:
                                latestResume
                                    .atsScore ??
                                0,

                            fileName:
                                latestResume
                                    .fileName ??
                                "Latest resume",
                        },
                    });
                }
            }
        }

        if (
            preferences
                .interviewInactiveEnabled
        ) {
            if (!latestInterview) {
                reminders.push({
                    type:
                        NotificationType.INTERVIEW_INACTIVE,

                    title:
                        "Start your interview practice",

                    message:
                        "No interview replay has been recorded yet. Log one practice session to identify improvement areas.",

                    link:
                        "/interviews",

                    dedupeKey:
                        `INTERVIEW_INACTIVE:${localDate}`,

                    emailLine:
                        "No interview replay is available yet. Record a mock or real interview session for targeted feedback.",

                    metadata: {
                        localDate,
                        timezone,
                        reason:
                            "missing",
                    },
                });
            } else {
                const inactiveDays =
                    daysSince(
                        latestInterview
                            .date,

                        now
                    );

                if (
                    inactiveDays >=
                    INTERVIEW_INACTIVE_DAYS
                ) {
                    reminders.push({
                        type:
                            NotificationType.INTERVIEW_INACTIVE,

                        title:
                            "Interview practice is inactive",

                        message:
                            `Your last interview session was ${inactiveDays} days ago. Schedule another practice replay.`,

                        link:
                            "/interviews",

                        dedupeKey:
                            `INTERVIEW_INACTIVE:${localDate}`,

                        emailLine:
                            `Your last interview replay was ${inactiveDays} days ago. Practice one structured answer today.`,

                        metadata: {
                            localDate,
                            timezone,

                            inactiveDays,

                            interviewId:
                                latestInterview.id,

                            company:
                                latestInterview
                                    .company,

                            role:
                                latestInterview
                                    .role,
                        },
                    });
                }
            }
        }

        return reminders;
    };