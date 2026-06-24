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
    createNotification:
        vi.fn(),

    emitNotificationToUser:
        vi.fn(),

    toRealtimeNotification:
        vi.fn(),
}));

vi.mock(
    "./notification.service",
    () => ({
        createNotification:
            mocks.createNotification,
    })
);

vi.mock(
    "../realtime/socket",
    () => ({
        emitNotificationToUser:
            mocks.emitNotificationToUser,

        toRealtimeNotification:
            mocks.toRealtimeNotification,
    })
);

import {
    publishDailyPlanReadyNotification,
} from "./dailyPlanNotification.service";

describe(
    "Daily Plan notification service",
    () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it(
            "creates and emits a Daily Plan ready notification",
            async () => {
                const notification = {
                    id:
                        "notification-1",

                    userId:
                        "user-1",

                    type:
                        NotificationType
                            .DAILY_PLAN_READY,

                    title:
                        "Your Daily AI Plan is ready",

                    message:
                        "Plan generated.",

                    link:
                        "/daily-plan",

                    isRead: false,
                    readAt: null,

                    emailEligible:
                        false,

                    emailSentAt:
                        null,

                    dedupeKey:
                        "DAILY_PLAN_READY:2026-06-24",

                    metadata: {
                        createdDate:
                            "2026-06-24",
                    },

                    createdAt:
                        new Date(
                            "2026-06-24T14:30:00.000Z"
                        ),

                    updatedAt:
                        new Date(
                            "2026-06-24T14:30:00.000Z"
                        ),
                };

                const realtimePayload = {
                    id:
                        "notification-1",

                    type:
                        "DAILY_PLAN_READY",

                    title:
                        "Your Daily AI Plan is ready",

                    message:
                        "Plan generated.",

                    link:
                        "/daily-plan",

                    isRead: false,

                    createdAt:
                        "2026-06-24T14:30:00.000Z",
                };

                mocks.createNotification
                    .mockResolvedValue(
                        notification
                    );

                mocks.toRealtimeNotification
                    .mockReturnValue(
                        realtimePayload
                    );

                mocks.emitNotificationToUser
                    .mockReturnValue(true);

                const result =
                    await publishDailyPlanReadyNotification(
                        {
                            userId:
                                "user-1",

                            createdDate:
                                "2026-06-24",
                        }
                    );

                expect(
                    mocks.createNotification
                ).toHaveBeenCalledWith({
                    userId:
                        "user-1",

                    type:
                        NotificationType
                            .DAILY_PLAN_READY,

                    title:
                        "Your Daily AI Plan is ready",

                    message:
                        expect.stringContaining(
                            "today’s focused preparation plan"
                        ),

                    link:
                        "/daily-plan",

                    dedupeKey:
                        "DAILY_PLAN_READY:2026-06-24",

                    emailEligible:
                        false,

                    metadata: {
                        createdDate:
                            "2026-06-24",

                        source:
                            "daily-plan-generation",
                    },
                });

                expect(
                    mocks.toRealtimeNotification
                ).toHaveBeenCalledWith(
                    notification
                );

                expect(
                    mocks.emitNotificationToUser
                ).toHaveBeenCalledWith(
                    "user-1",
                    realtimePayload
                );

                expect(result).toEqual({
                    notification,
                    emitted: true,
                });
            }
        );

        it(
            "does not fail Daily Plan generation when notification creation fails",
            async () => {
                mocks.createNotification
                    .mockRejectedValue(
                        new Error(
                            "Notification database unavailable"
                        )
                    );

                const result =
                    await publishDailyPlanReadyNotification(
                        {
                            userId:
                                "user-1",

                            createdDate:
                                "2026-06-24",
                        }
                    );

                expect(result).toBeNull();

                expect(
                    mocks.emitNotificationToUser
                ).not.toHaveBeenCalled();
            }
        );
    }
);