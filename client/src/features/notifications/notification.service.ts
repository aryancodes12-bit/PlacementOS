import api from "../../services/api";

import type {
    MarkAllNotificationsReadResponse,
    MarkNotificationReadResponse,
    NotificationListResponse,
    UnreadCountResponse,
} from "./notification.types";

export const notificationService = {
    getNotifications: (
        page = 1,
        limit = 20
    ) => {
        return api.get<NotificationListResponse>(
            "/notifications",
            {
                params: {
                    page,
                    limit,
                },
            }
        );
    },

    getUnreadCount: () => {
        return api.get<UnreadCountResponse>(
            "/notifications/unread-count"
        );
    },

    markRead: (
        notificationId: string
    ) => {
        return api.patch<MarkNotificationReadResponse>(
            `/notifications/${encodeURIComponent(
                notificationId
            )}/read`
        );
    },

    markAllRead: () => {
        return api.patch<MarkAllNotificationsReadResponse>(
            "/notifications/read-all"
        );
    },
};