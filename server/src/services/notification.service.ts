import {
    NotificationType,
    type Prisma,
} from "@prisma/client";

import {
    prisma,
} from "../prisma/client";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export interface CreateNotificationInput {
    userId: string;
    type: NotificationType;

    title: string;
    message: string;
    link?: string | null;

    dedupeKey: string;

    emailEligible?: boolean;
    metadata?: Prisma.InputJsonValue;
}

export interface ListNotificationsInput {
    userId: string;
    page?: number;
    limit?: number;
}

const normalizeRequiredText = (
    value: string,
    fieldName: string,
    maxLength: number
): string => {
    const normalized = value
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, maxLength);

    if (!normalized) {
        throw new Error(
            `${fieldName} is required.`
        );
    }

    return normalized;
};

const normalizeInternalLink = (
    value?: string | null
): string | undefined => {
    if (!value) {
        return undefined;
    }

    const normalized =
        value.trim();

    /*
     * Notification links should only navigate
     * inside PlacementOS.
     */
    if (
        !normalized.startsWith("/") ||
        normalized.startsWith("//")
    ) {
        return undefined;
    }

    return normalized.slice(0, 300);
};

const normalizePagination = (
    page?: number,
    limit?: number
) => {
    const safePage =
        Number.isInteger(page) &&
            Number(page) > 0
            ? Number(page)
            : 1;

    const requestedLimit =
        Number.isInteger(limit) &&
            Number(limit) > 0
            ? Number(limit)
            : DEFAULT_PAGE_SIZE;

    const safeLimit =
        Math.min(
            requestedLimit,
            MAX_PAGE_SIZE
        );

    return {
        page: safePage,
        limit: safeLimit,
        skip:
            (safePage - 1) *
            safeLimit,
    };
};

export const createNotification =
    async (
        input: CreateNotificationInput
    ) => {
        const userId =
            normalizeRequiredText(
                input.userId,
                "User ID",
                100
            );

        const title =
            normalizeRequiredText(
                input.title,
                "Notification title",
                120
            );

        const message =
            normalizeRequiredText(
                input.message,
                "Notification message",
                500
            );

        const dedupeKey =
            normalizeRequiredText(
                input.dedupeKey,
                "Notification dedupe key",
                200
            );

        /*
         * Unique userId + dedupeKey makes this
         * operation idempotent. Cron retries or
         * duplicate completion callbacks will not
         * create duplicate notifications.
         */
        return prisma.notification.upsert({
            where: {
                userId_dedupeKey: {
                    userId,
                    dedupeKey,
                },
            },

            update: {},

            create: {
                userId,
                type: input.type,

                title,
                message,

                link:
                    normalizeInternalLink(
                        input.link
                    ),

                dedupeKey,

                emailEligible:
                    input.emailEligible ??
                    false,

                metadata:
                    input.metadata,
            },
        });
    };

export const listNotifications =
    async ({
        userId,
        page,
        limit,
    }: ListNotificationsInput) => {
        const pagination =
            normalizePagination(
                page,
                limit
            );

        const [
            notifications,
            total,
            unreadCount,
        ] = await prisma.$transaction([
            prisma.notification.findMany({
                where: {
                    userId,
                },

                orderBy: [
                    {
                        createdAt:
                            "desc",
                    },
                    {
                        id: "desc",
                    },
                ],

                skip:
                    pagination.skip,

                take:
                    pagination.limit,
            }),

            prisma.notification.count({
                where: {
                    userId,
                },
            }),

            prisma.notification.count({
                where: {
                    userId,
                    isRead: false,
                },
            }),
        ]);

        const totalPages =
            total === 0
                ? 0
                : Math.ceil(
                    total /
                    pagination.limit
                );

        return {
            notifications,
            unreadCount,

            pagination: {
                page:
                    pagination.page,

                limit:
                    pagination.limit,

                total,
                totalPages,

                hasNextPage:
                    pagination.page <
                    totalPages,

                hasPreviousPage:
                    pagination.page >
                    1,
            },
        };
    };

export const getUnreadNotificationCount =
    async (
        userId: string
    ): Promise<number> => {
        return prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    };

export const markNotificationAsRead =
    async (
        userId: string,
        notificationId: string
    ) => {
        /*
         * findFirst with userId prevents an
         * authenticated user from modifying
         * another user's notification by ID.
         */
        const existingNotification =
            await prisma.notification.findFirst({
                where: {
                    id: notificationId,
                    userId,
                },
            });

        if (!existingNotification) {
            return null;
        }

        if (
            existingNotification.isRead
        ) {
            return {
                notification:
                    existingNotification,

                alreadyRead: true,
            };
        }

        const notification =
            await prisma.notification.update({
                where: {
                    id: notificationId,
                },

                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });

        return {
            notification,
            alreadyRead: false,
        };
    };

export const markAllNotificationsAsRead =
    async (
        userId: string
    ) => {
        const readAt = new Date();

        const result =
            await prisma.notification.updateMany({
                where: {
                    userId,
                    isRead: false,
                },

                data: {
                    isRead: true,
                    readAt,
                },
            });

        return {
            updatedCount:
                result.count,

            readAt,
        };
    };