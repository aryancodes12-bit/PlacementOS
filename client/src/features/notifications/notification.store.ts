
import {
    create,
} from "zustand";

import type {
    NotificationItem,
    NotificationListData,
    RealtimeNotificationPayload,
} from "./notification.types";

interface NotificationState {
    notifications: NotificationItem[];
    unreadCount: number;

    loading: boolean;
    initialized: boolean;
    realtimeConnected: boolean;

    setLoading: (
        loading: boolean
    ) => void;

    setRealtimeConnected: (
        connected: boolean
    ) => void;

    setSnapshot: (
        data: NotificationListData
    ) => void;

    addRealtimeNotification: (
        notification:
            RealtimeNotificationPayload
    ) => void;

    markReadLocally: (
        notificationId: string,
        readAt?: string
    ) => void;

    markAllReadLocally: (
        readAt?: string
    ) => void;

    removeNotificationLocally: (
        notificationId: string
    ) => void;

    clearReadNotificationsLocally:
    () => void;

    clearNotifications: () => void;
}

const MAX_CACHED_NOTIFICATIONS = 50;

export const useNotificationStore =
    create<NotificationState>(
        (set) => ({
            notifications: [],
            unreadCount: 0,

            loading: false,
            initialized: false,
            realtimeConnected:
                false,

            setLoading: (
                loading
            ) => {
                set({
                    loading,
                });
            },

            setRealtimeConnected: (
                connected
            ) => {
                set({
                    realtimeConnected:
                        connected,
                });
            },

            setSnapshot: (
                data
            ) => {
                set({
                    notifications:
                        data.notifications,

                    unreadCount:
                        data.unreadCount,

                    initialized: true,
                    loading: false,
                });
            },

            addRealtimeNotification: (
                payload
            ) => {
                set((state) => {
                    const existing =
                        state.notifications.find(
                            (
                                notification
                            ) =>
                                notification.id ===
                                payload.id
                        );

                    const incoming:
                        NotificationItem = {
                        ...payload,
                        readAt: null,
                    };

                    const nextNotifications =
                        [
                            incoming,

                            ...state.notifications.filter(
                                (
                                    notification
                                ) =>
                                    notification.id !==
                                    payload.id
                            ),
                        ].slice(
                            0,
                            MAX_CACHED_NOTIFICATIONS
                        );

                    if (!existing) {
                        return {
                            notifications:
                                nextNotifications,

                            unreadCount:
                                state.unreadCount +
                                (incoming.isRead
                                    ? 0
                                    : 1),
                        };
                    }

                    const unreadDifference =
                        existing.isRead &&
                            !incoming.isRead
                            ? 1
                            : !existing.isRead &&
                                incoming.isRead
                                ? -1
                                : 0;

                    return {
                        notifications:
                            nextNotifications,

                        unreadCount:
                            Math.max(
                                0,
                                state.unreadCount +
                                unreadDifference
                            ),
                    };
                });
            },

            markReadLocally: (
                notificationId,
                readAt = new Date()
                    .toISOString()
            ) => {
                set((state) => {
                    const notification =
                        state.notifications.find(
                            (item) =>
                                item.id ===
                                notificationId
                        );

                    if (
                        !notification ||
                        notification.isRead
                    ) {
                        return state;
                    }

                    return {
                        notifications:
                            state.notifications.map(
                                (item) =>
                                    item.id ===
                                        notificationId
                                        ? {
                                            ...item,

                                            isRead:
                                                true,

                                            readAt,
                                        }
                                        : item
                            ),

                        unreadCount:
                            Math.max(
                                0,
                                state.unreadCount -
                                1
                            ),
                    };
                });
            },

            markAllReadLocally: (
                readAt = new Date()
                    .toISOString()
            ) => {
                set((state) => ({
                    notifications:
                        state.notifications.map(
                            (
                                notification
                            ) => ({
                                ...notification,

                                isRead:
                                    true,

                                readAt:
                                    notification.readAt ??
                                    readAt,
                            })
                        ),

                    unreadCount: 0,
                }));
            },

            removeNotificationLocally: (
                notificationId
            ) => {
                set((state) => {
                    const notification =
                        state.notifications.find(
                            (item) =>
                                item.id ===
                                notificationId
                        );

                    if (!notification) {
                        return state;
                    }

                    return {
                        notifications:
                            state.notifications.filter(
                                (item) =>
                                    item.id !==
                                    notificationId
                            ),

                        unreadCount:
                            Math.max(
                                0,
                                state.unreadCount -
                                (notification.isRead
                                    ? 0
                                    : 1)
                            ),
                    };
                });
            },

            clearReadNotificationsLocally:
                () => {
                    set((state) => ({
                        notifications:
                            state.notifications.filter(
                                (
                                    notification
                                ) =>
                                    !notification.isRead
                            ),
                    }));
                },

            clearNotifications:
                () => {
                    set({
                        notifications:
                            [],

                        unreadCount: 0,

                        loading: false,
                        initialized:
                            false,

                        realtimeConnected:
                            false,
                    });
                },
        })
    );

