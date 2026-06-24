
import type {
    Response,
} from "express";

import type {
    AuthRequest,
} from "../middlewares/auth.middleware";

import {
    deleteNotificationForUser,
    deleteReadNotificationsForUser,
} from "../services/notificationDeletion.service";

export const deleteNotification =
    async (
        req: AuthRequest,
        res: Response
    ) => {
        try {
            const userId =
                req.user!.id;

            const notificationId =
                String(
                    req.params.id || ""
                ).trim();

            if (
                !notificationId ||
                notificationId.length > 100
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,

                        message:
                            "Invalid notification ID.",
                    });
            }

            const deleted =
                await deleteNotificationForUser(
                    userId,
                    notificationId
                );

            if (!deleted) {
                return res
                    .status(404)
                    .json({
                        success: false,

                        message:
                            "Notification was not found.",
                    });
            }

            return res
                .status(200)
                .json({
                    success: true,

                    message:
                        "Notification deleted.",

                    data: {
                        notificationId,
                    },
                });
        } catch (error) {
            console.error(
                "Delete notification error:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,

                    message:
                        "Failed to delete notification.",
                });
        }
    };

export const clearReadNotifications =
    async (
        req: AuthRequest,
        res: Response
    ) => {
        try {
            const userId =
                req.user!.id;

            const deletedCount =
                await deleteReadNotificationsForUser(
                    userId
                );

            return res
                .status(200)
                .json({
                    success: true,

                    message:
                        deletedCount > 0
                            ? `${deletedCount} read notification(s) deleted.`
                            : "No read notifications to delete.",

                    data: {
                        deletedCount,
                    },
                });
        } catch (error) {
            console.error(
                "Clear read notifications error:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,

                    message:
                        "Failed to clear read notifications.",
                });
        }
    };

