
import {
    NotificationType,
} from "@prisma/client";

import type {
    Response,
} from "express";

import type {
    AuthRequest,
} from "../middlewares/auth.middleware";

import {
    createNotification,
} from "../services/notification.service";

import {
    emitNotificationToUser,
    toRealtimeNotification,
} from "../realtime/socket";

export const createTestNotification =
    async (
        req: AuthRequest,
        res: Response
    ) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }

            /*
             * Date.now() intentionally creates a
             * unique development notification for
             * every manual test request.
             */
            const notification =
                await createNotification({
                    userId:
                        req.user.id,

                    type:
                        NotificationType
                            .DAILY_PLAN_READY,

                    title:
                        "Realtime notifications are working",

                    message:
                        "Your PlacementOS notification bell received this update instantly.",

                    link:
                        "/daily-plan",

                    dedupeKey:
                        `DEV_TEST:${req.user.id}:${Date.now()}`,

                    emailEligible:
                        false,

                    metadata: {
                        source:
                            "development-test",
                    },
                });

            const emitted =
                emitNotificationToUser(
                    req.user.id,
                    toRealtimeNotification(
                        notification
                    )
                );

            return res.status(201).json({
                success: true,

                message:
                    "Development notification created.",

                data: {
                    notification,
                    emitted,
                },
            });
        } catch (error) {
            console.error(
                "Create development notification error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to create development notification.",
            });
        }
    };

