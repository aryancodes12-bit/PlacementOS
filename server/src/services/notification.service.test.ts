import {
    NotificationType,
} from "@prisma/client";

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
    notificationUpsert: vi.fn(),
    notificationFindMany: vi.fn(),
    notificationCount: vi.fn(),
    notificationFindFirst: vi.fn(),
    notificationUpdate: vi.fn(),
    notificationUpdateMany: vi.fn(),

    transaction: vi.fn(),
}));

vi.mock(
    "../prisma/client",
    () => ({
        prisma: {
            notification: {
                upsert:
                    mocks.notificationUpsert,

                findMany:
                    mocks.notificationFindMany,

                count:
                    mocks.notificationCount,

                findFirst:
                    mocks.notificationFindFirst,

                update:
                    mocks.notificationUpdate,

                updateMany:
                    mocks.notificationUpdateMany,
            },

            $transaction:
                mocks.transaction,
        },
    })
);

import {
    createNotification,
    getUnreadNotificationCount,
    listNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "./notification.service";

describe(
    "notification service",
    () => {
        beforeEach(() => {
            vi.clearAllMocks();

            mocks.transaction
                .mockImplementation(
                    async (
                        operations: Array<
                            Promise<unknown>
                        >
                    ) => {
                        return Promise.all(
                            operations
                        );
                    }
                );
        });

        it(
            "creates an idempotent notification with normalized input",
            async () => {
                const createdNotification = {
                    id: "notification-1",
                    userId: "user-1",

                    type:
                        NotificationType
                            .DAILY_PLAN_READY,

                    title:
                        "Daily plan ready",

                    message:
                        "Your daily preparation plan is ready.",

                    link:
                        "/daily-plan",

                    dedupeKey:
                        "DAILY_PLAN_READY:2026-06-23",

                    isRead: false,
                    emailEligible: false,
                };

                mocks.notificationUpsert
                    .mockResolvedValue(
                        createdNotification
                    );

                const result =
                    await createNotification({
                        userId:
                            "  user-1  ",

                        type:
                            NotificationType
                                .DAILY_PLAN_READY,

                        title:
                            "  Daily   plan ready  ",

                        message:
                            " Your daily preparation plan is ready. ",

                        link:
                            "/daily-plan",

                        dedupeKey:
                            " DAILY_PLAN_READY:2026-06-23 ",

                        metadata: {
                            generated:
                                true,
                        },
                    });

                expect(result).toEqual(
                    createdNotification
                );

                expect(
                    mocks.notificationUpsert
                ).toHaveBeenCalledWith({
                    where: {
                        userId_dedupeKey:
                        {
                            userId:
                                "user-1",

                            dedupeKey:
                                "DAILY_PLAN_READY:2026-06-23",
                        },
                    },

                    update: {},

                    create: {
                        userId:
                            "user-1",

                        type:
                            NotificationType
                                .DAILY_PLAN_READY,

                        title:
                            "Daily plan ready",

                        message:
                            "Your daily preparation plan is ready.",

                        link:
                            "/daily-plan",

                        dedupeKey:
                            "DAILY_PLAN_READY:2026-06-23",

                        emailEligible:
                            false,

                        metadata: {
                            generated:
                                true,
                        },
                    },
                });
            }
        );

        it(
            "does not allow external notification links",
            async () => {
                mocks.notificationUpsert
                    .mockResolvedValue({
                        id: "notification-1",
                    });

                await createNotification({
                    userId: "user-1",

                    type:
                        NotificationType
                            .RESUME_ANALYSIS_READY,

                    title:
                        "Resume analysis ready",

                    message:
                        "Your resume analysis has completed.",

                    link:
                        "https://malicious.example",

                    dedupeKey:
                        "RESUME_ANALYSIS:resume-1",
                });

                expect(
                    mocks.notificationUpsert
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        create:
                            expect.objectContaining({
                                link:
                                    undefined,
                            }),
                    })
                );
            }
        );

        it(
            "lists paginated notifications and caps the page size at fifty",
            async () => {
                const notifications = [
                    {
                        id:
                            "notification-2",
                    },
                    {
                        id:
                            "notification-1",
                    },
                ];

                mocks.notificationFindMany
                    .mockResolvedValue(
                        notifications
                    );

                mocks.notificationCount
                    .mockResolvedValueOnce(
                        61
                    )
                    .mockResolvedValueOnce(
                        7
                    );

                const result =
                    await listNotifications({
                        userId:
                            "user-1",

                        page: 2,
                        limit: 999,
                    });

                expect(
                    mocks.notificationFindMany
                ).toHaveBeenCalledWith({
                    where: {
                        userId:
                            "user-1",
                    },

                    orderBy: [
                        {
                            createdAt:
                                "desc",
                        },
                        {
                            id:
                                "desc",
                        },
                    ],

                    skip: 50,
                    take: 50,
                });

                expect(result).toEqual({
                    notifications,
                    unreadCount: 7,

                    pagination: {
                        page: 2,
                        limit: 50,
                        total: 61,
                        totalPages: 2,
                        hasNextPage:
                            false,
                        hasPreviousPage:
                            true,
                    },
                });
            }
        );

        it(
            "returns the unread notification count",
            async () => {
                mocks.notificationCount
                    .mockResolvedValue(4);

                const result =
                    await getUnreadNotificationCount(
                        "user-1"
                    );

                expect(result).toBe(4);

                expect(
                    mocks.notificationCount
                ).toHaveBeenCalledWith({
                    where: {
                        userId:
                            "user-1",

                        isRead: false,
                    },
                });
            }
        );

        it(
            "returns null when a notification does not belong to the user",
            async () => {
                mocks.notificationFindFirst
                    .mockResolvedValue(
                        null
                    );

                const result =
                    await markNotificationAsRead(
                        "user-1",
                        "other-user-notification"
                    );

                expect(result).toBeNull();

                expect(
                    mocks.notificationUpdate
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "does not update an already-read notification",
            async () => {
                const notification = {
                    id: "notification-1",
                    userId: "user-1",
                    isRead: true,
                    readAt:
                        new Date(),
                };

                mocks.notificationFindFirst
                    .mockResolvedValue(
                        notification
                    );

                const result =
                    await markNotificationAsRead(
                        "user-1",
                        "notification-1"
                    );

                expect(result).toEqual({
                    notification,
                    alreadyRead: true,
                });

                expect(
                    mocks.notificationUpdate
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "marks an unread notification as read",
            async () => {
                mocks.notificationFindFirst
                    .mockResolvedValue({
                        id:
                            "notification-1",

                        userId:
                            "user-1",

                        isRead: false,
                        readAt: null,
                    });

                mocks.notificationUpdate
                    .mockResolvedValue({
                        id:
                            "notification-1",

                        userId:
                            "user-1",

                        isRead: true,

                        readAt:
                            new Date(),
                    });

                const result =
                    await markNotificationAsRead(
                        "user-1",
                        "notification-1"
                    );

                expect(
                    result?.alreadyRead
                ).toBe(false);

                expect(
                    mocks.notificationUpdate
                ).toHaveBeenCalledWith({
                    where: {
                        id:
                            "notification-1",
                    },

                    data: {
                        isRead: true,
                        readAt:
                            expect.any(
                                Date
                            ),
                    },
                });
            }
        );

        it(
            "marks all unread notifications as read",
            async () => {
                mocks.notificationUpdateMany
                    .mockResolvedValue({
                        count: 3,
                    });

                const result =
                    await markAllNotificationsAsRead(
                        "user-1"
                    );

                expect(
                    result.updatedCount
                ).toBe(3);

                expect(
                    result.readAt
                ).toBeInstanceOf(Date);

                expect(
                    mocks.notificationUpdateMany
                ).toHaveBeenCalledWith({
                    where: {
                        userId:
                            "user-1",

                        isRead: false,
                    },

                    data: {
                        isRead: true,
                        readAt:
                            expect.any(
                                Date
                            ),
                    },
                });
            }
        );
    }
);