export type NotificationType =
    | "STREAK_RISK"
    | "DSA_REVISION_DUE"
    | "RESUME_STALE"
    | "INTERVIEW_INACTIVE"
    | "INTERVIEW_ANALYSIS_READY"
    | "DAILY_PLAN_READY"
    | "RESUME_ANALYSIS_READY";

export interface NotificationItem {
    id: string;
    type: NotificationType;

    title: string;
    message: string;
    link: string | null;

    isRead: boolean;
    readAt: string | null;

    createdAt: string;
    updatedAt?: string;
}

export interface NotificationPagination {
    page: number;
    limit: number;

    total: number;
    totalPages: number;

    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface NotificationListData {
    notifications: NotificationItem[];
    unreadCount: number;

    pagination: NotificationPagination;
}

export interface NotificationListResponse {
    success: boolean;
    data: NotificationListData;
}

export interface UnreadCountResponse {
    success: boolean;

    data: {
        unreadCount: number;
    };
}

export interface MarkNotificationReadResponse {
    success: boolean;
    alreadyRead: boolean;
    message: string;

    data: {
        notification: NotificationItem;
    };
}

export interface MarkAllNotificationsReadResponse {
    success: boolean;
    message: string;

    data: {
        updatedCount: number;
        readAt: string;
    };
}

export interface RealtimeNotificationPayload {
    id: string;
    type: NotificationType;

    title: string;
    message: string;
    link: string | null;

    isRead: boolean;
    createdAt: string;
}