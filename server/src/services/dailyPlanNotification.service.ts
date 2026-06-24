import {
    NotificationType,
} from "@prisma/client";

import {
    emitNotificationToUser,
    toRealtimeNotification,
} from "../realtime/socket";

import {
    createNotification,
} from "./notification.service";

interface PublishDailyPlanReadyInput {
    userId: string;
    createdDate: string;
}

export const publishDailyPlanReadyNotification =
    async ({
        userId,
        createdDate,
    }: PublishDailyPlanReadyInput) => {
        try {
            /*
             * One notification per user per
             * daily-plan date.
             *
             * createNotification uses the unique
             * userId + dedupeKey constraint, so
             * retries cannot create duplicates.
             */
            const notification =
                await createNotification({
                    userId,

                    type:
                        NotificationType
                            .DAILY_PLAN_READY,

                    title:
                        "Your Daily AI Plan is ready",

                    message:
                        "PlacementOS has generated today’s focused preparation plan using your current DSA, resume, interview, and readiness data.",

                    link:
                        "/daily-plan",

                    dedupeKey:
                        `DAILY_PLAN_READY:${createdDate}`,

                    emailEligible:
                        false,

                    metadata: {
                        createdDate,

                        source:
                            "daily-plan-generation",
                    },
                });

            const emitted =
                emitNotificationToUser(
                    userId,
                    toRealtimeNotification(
                        notification
                    )
                );

            return {
                notification,
                emitted,
            };
        } catch (error) {
            /*
             * Notification failure must never
             * make Daily Plan generation fail.
             */
            if (
                process.env.NODE_ENV !==
                "test"
            ) {
                console.error(
                    "Daily Plan ready notification failed:",
                    error
                );
            }

            return null;
        }
    };