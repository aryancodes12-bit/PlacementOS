
import type {
    NotificationPreference,
} from "@prisma/client";

import {
    prisma,
} from "../prisma/client";

export interface NotificationPreferencePatch {
    emailDigestEnabled?: boolean;

    streakRiskEnabled?: boolean;
    dsaRevisionEnabled?: boolean;
    resumeStaleEnabled?: boolean;
    interviewInactiveEnabled?: boolean;

    digestHour?: number;
    digestMinute?: number;
    timezone?: string;
}

const buildPreferenceData = (
    input: NotificationPreferencePatch
): NotificationPreferencePatch => {
    return {
        ...(input.emailDigestEnabled !==
            undefined && {
            emailDigestEnabled:
                input.emailDigestEnabled,
        }),

        ...(input.streakRiskEnabled !==
            undefined && {
            streakRiskEnabled:
                input.streakRiskEnabled,
        }),

        ...(input.dsaRevisionEnabled !==
            undefined && {
            dsaRevisionEnabled:
                input.dsaRevisionEnabled,
        }),

        ...(input.resumeStaleEnabled !==
            undefined && {
            resumeStaleEnabled:
                input.resumeStaleEnabled,
        }),

        ...(input.interviewInactiveEnabled !==
            undefined && {
            interviewInactiveEnabled:
                input.interviewInactiveEnabled,
        }),

        ...(input.digestHour !==
            undefined && {
            digestHour:
                input.digestHour,
        }),

        ...(input.digestMinute !==
            undefined && {
            digestMinute:
                input.digestMinute,
        }),

        ...(input.timezone !==
            undefined && {
            timezone:
                input.timezone,
        }),
    };
};

export const getOrCreateNotificationPreference =
    async (
        userId: string
    ): Promise<NotificationPreference> => {
        return prisma.notificationPreference.upsert({
            where: {
                userId,
            },

            update: {},

            create: {
                userId,
            },
        });
    };

export const updateNotificationPreference =
    async (
        userId: string,
        input: NotificationPreferencePatch
    ): Promise<NotificationPreference> => {
        const preferenceData =
            buildPreferenceData(input);

        return prisma.notificationPreference.upsert({
            where: {
                userId,
            },

            update: {
                ...preferenceData,
            },

            create: {
                userId,
                ...preferenceData,
            },
        });
    };

