import {
    afterEach,
    describe,
    expect,
    it,
} from "vitest";

import {
    closeSocketServer,
    emitNotificationToUser,
    getSocketServer,
    getUserSocketRoom,
    toRealtimeNotification,
} from "./socket";

describe(
    "socket realtime utilities",
    () => {
        afterEach(
            async () => {
                await closeSocketServer();
            }
        );

        it(
            "builds a private user room",
            () => {
                expect(
                    getUserSocketRoom(
                        "user-123"
                    )
                ).toBe(
                    "user:user-123"
                );
            }
        );

        it(
            "does not emit before socket initialization",
            () => {
                expect(
                    getSocketServer()
                ).toBeNull();

                const emitted =
                    emitNotificationToUser(
                        "user-123",
                        {
                            id:
                                "notification-1",

                            type:
                                "DAILY_PLAN_READY",

                            title:
                                "Daily plan ready",

                            message:
                                "Your daily plan is ready.",

                            link:
                                "/daily-plan",

                            isRead:
                                false,

                            createdAt:
                                "2026-06-23T15:00:00.000Z",
                        }
                    );

                expect(
                    emitted
                ).toBe(false);
            }
        );

        it(
            "serializes only client-safe notification fields",
            () => {
                const payload =
                    toRealtimeNotification(
                        {
                            id:
                                "notification-1",

                            type:
                                "RESUME_ANALYSIS_READY",

                            title:
                                "Resume analysis ready",

                            message:
                                "Your resume analysis is complete.",

                            link:
                                "/resume",

                            isRead:
                                false,

                            createdAt:
                                new Date(
                                    "2026-06-23T15:00:00.000Z"
                                ),
                        }
                    );

                expect(
                    payload
                ).toEqual({
                    id:
                        "notification-1",

                    type:
                        "RESUME_ANALYSIS_READY",

                    title:
                        "Resume analysis ready",

                    message:
                        "Your resume analysis is complete.",

                    link:
                        "/resume",

                    isRead:
                        false,

                    createdAt:
                        "2026-06-23T15:00:00.000Z",
                });
            }
        );
    }
);