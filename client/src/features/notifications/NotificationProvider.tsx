import {
    useEffect,
    type ReactNode,
} from "react";

import {
    useAuthStore,
} from "../../store/authStore";

import {
    notificationService,
} from "./notification.service";

import {
    useNotificationStore,
} from "./notification.store";

import {
    connectNotificationSocket,
    disconnectNotificationSocket,
    notificationSocket,
} from "./notification.socket";

import type {
    RealtimeNotificationPayload,
} from "./notification.types";

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider = ({
    children,
}: NotificationProviderProps) => {
    const isAuthenticated =
        useAuthStore(
            (state) =>
                state.isAuthenticated
        );

    const setLoading =
        useNotificationStore(
            (state) =>
                state.setLoading
        );

    const setSnapshot =
        useNotificationStore(
            (state) =>
                state.setSnapshot
        );

    const addRealtimeNotification =
        useNotificationStore(
            (state) =>
                state.addRealtimeNotification
        );

    const setRealtimeConnected =
        useNotificationStore(
            (state) =>
                state.setRealtimeConnected
        );

    const clearNotifications =
        useNotificationStore(
            (state) =>
                state.clearNotifications
        );

    useEffect(() => {
        let cancelled = false;

        const loadNotifications =
            async () => {
                setLoading(true);

                try {
                    /*
                     * The REST request runs first so
                     * the Axios interceptor can refresh
                     * an expired access token before
                     * Socket.IO authenticates.
                     */
                    const response =
                        await notificationService
                            .getNotifications(
                                1,
                                20
                            );

                    if (cancelled) {
                        return;
                    }

                    setSnapshot(
                        response.data.data
                    );

                    connectNotificationSocket();
                } catch (error: any) {
                    if (cancelled) {
                        return;
                    }

                    const status =
                        error?.response?.status;

                    if (status !== 401) {
                        console.error(
                            "Failed to initialize notifications:",
                            error
                        );
                    }

                    setRealtimeConnected(
                        false
                    );

                    setLoading(false);
                }
            };

        const handleConnect = () => {
            console.log(
                "[Notifications] Socket transport connected:",
                notificationSocket.id
            );

            setRealtimeConnected(
                true
            );
        };

        const handleDisconnect = (
            reason: string
        ) => {
            console.log(
                "[Notifications] Socket disconnected:",
                reason
            );

            setRealtimeConnected(
                false
            );
        };

        const handleReady = (
            payload: {
                userId: string;
            }
        ) => {
            console.log(
                "[Notifications] Authenticated socket ready:",
                payload
            );

            setRealtimeConnected(
                true
            );
        };

        const handleNewNotification =
            (
                notification:
                    RealtimeNotificationPayload
            ) => {
                console.log(
                    "[Notifications] New realtime notification:",
                    notification
                );

                addRealtimeNotification(
                    notification
                );
            };

        const handleConnectError =
            (error: Error) => {
                setRealtimeConnected(
                    false
                );

                console.error(
                    "[Notifications] Socket authentication failed:",
                    error.message
                );
            };

        /*
         * Register listeners before connecting,
         * otherwise early connection events can
         * be missed.
         */
        notificationSocket.on(
            "connect",
            handleConnect
        );

        notificationSocket.on(
            "disconnect",
            handleDisconnect
        );

        notificationSocket.on(
            "connection:ready",
            handleReady
        );

        notificationSocket.on(
            "notification:new",
            handleNewNotification
        );

        notificationSocket.on(
            "connect_error",
            handleConnectError
        );

        if (isAuthenticated) {
            void loadNotifications();
        } else {
            disconnectNotificationSocket();
            clearNotifications();
        }

        return () => {
            cancelled = true;

            notificationSocket.off(
                "connect",
                handleConnect
            );

            notificationSocket.off(
                "disconnect",
                handleDisconnect
            );

            notificationSocket.off(
                "connection:ready",
                handleReady
            );

            notificationSocket.off(
                "notification:new",
                handleNewNotification
            );

            notificationSocket.off(
                "connect_error",
                handleConnectError
            );
        };
    }, [
        isAuthenticated,
        setLoading,
        setSnapshot,
        addRealtimeNotification,
        setRealtimeConnected,
        clearNotifications,
    ]);

    return <>{children}</>;
};