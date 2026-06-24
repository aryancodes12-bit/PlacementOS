import {
    io,
    type Socket,
} from "socket.io-client";

import type {
    RealtimeNotificationPayload,
} from "./notification.types";

interface ServerToClientEvents {
    "connection:ready": (
        payload: {
            userId: string;
        }
    ) => void;

    "notification:new": (
        payload:
            RealtimeNotificationPayload
    ) => void;
}

interface ClientToServerEvents {
    "connection:ping": (
        callback?: (
            payload: {
                ok: true;
                timestamp: string;
            }
        ) => void
    ) => void;
}

export type PlacementSocket =
    Socket<
        ServerToClientEvents,
        ClientToServerEvents
    >;

const normalizeServerUrl = (
    value?: string
): string => {
    if (!value) {
        return "http://localhost:5000";
    }

    return value
        .trim()
        .replace(/\/api\/?$/, "")
        .replace(/\/+$/, "");
};

const SOCKET_SERVER_URL =
    normalizeServerUrl(
        import.meta.env
            .VITE_SOCKET_URL ||
        import.meta.env
            .VITE_API_URL
    );

const getAccessToken =
    (): string | null => {
        return localStorage.getItem(
            "accessToken"
        );
    };

export const notificationSocket:
    PlacementSocket = io(
        SOCKET_SERVER_URL,
        {
            autoConnect: false,

            /*
             * Function form ensures every
             * reconnect attempt reads the latest
             * access token from localStorage.
             */
            auth: (callback) => {
                callback({
                    token:
                        getAccessToken(),
                });
            },

            reconnection: true,
            reconnectionAttempts: 8,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,

            timeout: 10000,
        }
    );

export const connectNotificationSocket =
    (): boolean => {
        const token =
            getAccessToken();

        if (!token) {
            return false;
        }

        if (
            !notificationSocket.connected &&
            !notificationSocket.active
        ) {
            notificationSocket.connect();
        }

        return true;
    };

export const disconnectNotificationSocket =
    (): void => {
        if (
            notificationSocket.connected ||
            notificationSocket.active
        ) {
            notificationSocket.disconnect();
        }
    };