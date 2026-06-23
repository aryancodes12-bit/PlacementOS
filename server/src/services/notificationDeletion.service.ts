
import {
    prisma,
} from "../prisma/client";

const DAY_IN_MILLISECONDS =
    24 * 60 * 60 * 1000;

const DEFAULT_RETENTION_DAYS =
    90;

let lastCleanupAt = 0;

let activeCleanup:
    Promise<number> | null = null;

const getRetentionDays = () => {
    const configuredDays =
        Number(
            process.env
                .NOTIFICATION_RETENTION_DAYS
        );

    if (
        Number.isInteger(
            configuredDays
        ) &&
        configuredDays >= 7 &&
        configuredDays <= 365
    ) {
        return configuredDays;
    }

    return DEFAULT_RETENTION_DAYS;
};

export const deleteNotificationForUser =
    async (
        userId: string,
        notificationId: string
    ): Promise<boolean> => {
        const result =
            await prisma.notification.deleteMany(
                {
                    where: {
                        id:
                            notificationId,

                        userId,
                    },
                }
            );

        return result.count > 0;
    };

export const deleteReadNotificationsForUser =
    async (
        userId: string
    ): Promise<number> => {
        const result =
            await prisma.notification.deleteMany(
                {
                    where: {
                        userId,
                        isRead: true,
                    },
                }
            );

        return result.count;
    };

export const cleanupExpiredNotifications =
    async (): Promise<number> => {
        const retentionDays =
            getRetentionDays();

        const cutoffDate =
            new Date(
                Date.now() -
                retentionDays *
                DAY_IN_MILLISECONDS
            );

        const result =
            await prisma.notification.deleteMany(
                {
                    where: {
                        createdAt: {
                            lt: cutoffDate,
                        },
                    },
                }
            );

        return result.count;
    };

/*
 * Cleanup runs at most once every 24 hours,
 * even if multiple notification requests arrive.
 */
export const maybeCleanupExpiredNotifications =
    async (): Promise<number> => {
        const now = Date.now();

        if (
            now - lastCleanupAt <
            DAY_IN_MILLISECONDS
        ) {
            return 0;
        }

        if (activeCleanup) {
            return activeCleanup;
        }

        activeCleanup =
            cleanupExpiredNotifications()
                .then((deletedCount) => {
                    lastCleanupAt =
                        Date.now();

                    if (
                        deletedCount > 0 &&
                        process.env
                            .NODE_ENV !==
                        "test"
                    ) {
                        console.log(
                            `[Notifications] Removed ${deletedCount} expired notification(s).`
                        );
                    }

                    return deletedCount;
                })
                .finally(() => {
                    activeCleanup =
                        null;
                });

        return activeCleanup;
    };

