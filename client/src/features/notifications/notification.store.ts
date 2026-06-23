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
                    const existingIndex =
                        state.notifications
                            .findIndex(
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

                    if (
                        existingIndex !==
                        -1
                    ) {
                        const existing =
                            state.notifications[
                            existingIndex
                            ];

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
                    }

                    return {
                        notifications: [
                            incoming,
                            ...state.notifications,
                        ].slice(
                            0,
                            MAX_CACHED_NOTIFICATIONS
                        ),

                        unreadCount:
                            state.unreadCount +
                            (incoming.isRead
                                ? 0
                                : 1),
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