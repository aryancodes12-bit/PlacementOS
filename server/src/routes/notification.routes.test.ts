import express from "express";
import request from "supertest";

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
    listNotifications: vi.fn(),

    getUnreadNotificationCount:
        vi.fn(),

    markNotificationAsRead:
        vi.fn(),

    markAllNotificationsAsRead:
        vi.fn(),
}));

vi.mock(
    "../middlewares/auth.middleware",
    () => ({
        protect: (
            req: {
                user?: {
                    id: string;
                    role: string;
                    email: string;
                };
            },
            _res: unknown,
            next: () => void
        ) => {
            req.user = {
                id: "user-1",
                role: "STUDENT",
                email:
                    "student@example.com",
            };

            next();
        },
    })
);

vi.mock(
    "../services/notification.service",
    () => ({
        listNotifications:
            mocks.listNotifications,

        getUnreadNotificationCount:
            mocks.getUnreadNotificationCount,

        markNotificationAsRead:
            mocks.markNotificationAsRead,

        markAllNotificationsAsRead:
            mocks.markAllNotificationsAsRead,
    })
);

import notificationRoutes from "./notification.routes";

const app = express();

app.use(express.json());

app.use(
    "/api/notifications",
    notificationRoutes
);

describe(
    "notification routes",
    () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it(
            "returns paginated notifications using safe default query values",
            async () => {
                mocks.listNotifications
                    .mockResolvedValue({
                        notifications: [
                            {
                                id:
                                    "notification-1",
                            },
                        ],

                        unreadCount: 1,

                        pagination: {
                            page: 1,
                            limit: 20,
                            total: 1,
                            totalPages: 1,
                            hasNextPage:
                                false,
                            hasPreviousPage:
                                false,
                        },
                    });

                const response =
                    await request(app)
                        .get(
                            "/api/notifications?page=invalid&limit=-5"
                        )
                        .expect(200);

                expect(
                    mocks.listNotifications
                ).toHaveBeenCalledWith({
                    userId:
                        "user-1",

                    page: 1,
                    limit: 20,
                });

                expect(
                    response.body.success
                ).toBe(true);

                expect(
                    response.body.data
                        .unreadCount
                ).toBe(1);
            }
        );

        it(
            "returns the current unread count",
            async () => {
                mocks.getUnreadNotificationCount
                    .mockResolvedValue(6);

                const response =
                    await request(app)
                        .get(
                            "/api/notifications/unread-count"
                        )
                        .expect(200);

                expect(
                    response.body
                ).toEqual({
                    success: true,

                    data: {
                        unreadCount: 6,
                    },
                });

                expect(
                    mocks.getUnreadNotificationCount
                ).toHaveBeenCalledWith(
                    "user-1"
                );
            }
        );

        it(
            "rejects an invalid notification ID",
            async () => {
                const invalidId =
                    "x".repeat(101);

                const response =
                    await request(app)
                        .patch(
                            `/api/notifications/${invalidId}/read`
                        )
                        .expect(400);

                expect(
                    response.body
                        .message
                ).toBe(
                    "Invalid notification ID."
                );

                expect(
                    mocks.markNotificationAsRead
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "returns 404 when the notification is missing or belongs to another user",
            async () => {
                mocks.markNotificationAsRead
                    .mockResolvedValue(
                        null
                    );

                const response =
                    await request(app)
                        .patch(
                            "/api/notifications/notification-404/read"
                        )
                        .expect(404);

                expect(
                    response.body
                ).toEqual({
                    success: false,

                    message:
                        "Notification not found.",
                });

                expect(
                    mocks.markNotificationAsRead
                ).toHaveBeenCalledWith(
                    "user-1",
                    "notification-404"
                );
            }
        );

        it(
            "marks one notification as read",
            async () => {
                mocks.markNotificationAsRead
                    .mockResolvedValue({
                        alreadyRead:
                            false,

                        notification: {
                            id:
                                "notification-1",

                            userId:
                                "user-1",

                            isRead:
                                true,
                        },
                    });

                const response =
                    await request(app)
                        .patch(
                            "/api/notifications/notification-1/read"
                        )
                        .expect(200);

                expect(
                    response.body
                ).toMatchObject({
                    success: true,

                    alreadyRead:
                        false,

                    message:
                        "Notification marked as read.",

                    data: {
                        notification: {
                            id:
                                "notification-1",

                            isRead:
                                true,
                        },
                    },
                });
            }
        );

        it(
            "returns an idempotent response when the notification was already read",
            async () => {
                mocks.markNotificationAsRead
                    .mockResolvedValue({
                        alreadyRead:
                            true,

                        notification: {
                            id:
                                "notification-1",

                            userId:
                                "user-1",

                            isRead:
                                true,
                        },
                    });

                const response =
                    await request(app)
                        .patch(
                            "/api/notifications/notification-1/read"
                        )
                        .expect(200);

                expect(
                    response.body
                        .alreadyRead
                ).toBe(true);

                expect(
                    response.body
                        .message
                ).toBe(
                    "Notification was already read."
                );
            }
        );

        it(
            "marks all unread notifications as read",
            async () => {
                mocks.markAllNotificationsAsRead
                    .mockResolvedValue({
                        updatedCount: 4,
                        readAt:
                            new Date(
                                "2026-06-23T15:00:00.000Z"
                            ),
                    });

                const response =
                    await request(app)
                        .patch(
                            "/api/notifications/read-all"
                        )
                        .expect(200);

                expect(
                    response.body.success
                ).toBe(true);

                expect(
                    response.body.message
                ).toBe(
                    "All notifications marked as read."
                );

                expect(
                    response.body.data
                        .updatedCount
                ).toBe(4);

                expect(
                    mocks.markAllNotificationsAsRead
                ).toHaveBeenCalledWith(
                    "user-1"
                );
            }
        );

        it(
            "returns a no-op message when no unread notifications exist",
            async () => {
                mocks.markAllNotificationsAsRead
                    .mockResolvedValue({
                        updatedCount: 0,
                        readAt:
                            new Date(),
                    });

                const response =
                    await request(app)
                        .patch(
                            "/api/notifications/read-all"
                        )
                        .expect(200);

                expect(
                    response.body.message
                ).toBe(
                    "No unread notifications."
                );
            }
        );
    }
);