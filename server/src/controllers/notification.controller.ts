import type {
    Response,
} from "express";

import type {
    AuthRequest,
} from "../middlewares/auth.middleware";

import {
    getUnreadNotificationCount,
    listNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "../services/notification.service";

const parsePositiveInteger = (
    value: unknown,
    fallback: number
): number => {
    const parsed =
        Number.parseInt(
            String(value ?? ""),
            10
        );

    if (
        !Number.isFinite(parsed) ||
        parsed < 1
    ) {
        return fallback;
    }

    return parsed;
};

export const getNotifications =
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

            const page =
                parsePositiveInteger(
                    req.query.page,
                    1
                );

            const limit =
                parsePositiveInteger(
                    req.query.limit,
                    20
                );

            const data =
                await listNotifications({
                    userId:
                        req.user.id,

                    page,
                    limit,
                });

            return res.status(200).json({
                success: true,
                data,
            });
        } catch (error) {
            console.error(
                "Get notifications error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to load notifications.",
            });
        }
    };

export const getUnreadCount =
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

            const unreadCount =
                await getUnreadNotificationCount(
                    req.user.id
                );

            return res.status(200).json({
                success: true,

                data: {
                    unreadCount,
                },
            });
        } catch (error) {
            console.error(
                "Get unread notification count error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to load unread notification count.",
            });
        }
    };

export const markRead =
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

            const notificationId =
                String(
                    req.params.id ||
                    ""
                ).trim();

            if (
                !notificationId ||
                notificationId.length >
                100
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid notification ID.",
                });
            }

            const result =
                await markNotificationAsRead(
                    req.user.id,
                    notificationId
                );

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Notification not found.",
                });
            }

            return res.status(200).json({
                success: true,

                alreadyRead:
                    result.alreadyRead,

                message:
                    result.alreadyRead
                        ? "Notification was already read."
                        : "Notification marked as read.",

                data: {
                    notification:
                        result.notification,
                },
            });
        } catch (error) {
            console.error(
                "Mark notification read error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to mark notification as read.",
            });
        }
    };

export const markAllRead =
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

            const result =
                await markAllNotificationsAsRead(
                    req.user.id
                );

            return res.status(200).json({
                success: true,

                message:
                    result.updatedCount ===
                        0
                        ? "No unread notifications."
                        : "All notifications marked as read.",

                data: result,
            });
        } catch (error) {
            console.error(
                "Mark all notifications read error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to mark notifications as read.",
            });
        }
    };