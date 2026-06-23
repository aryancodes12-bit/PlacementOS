import type {
    Server as HttpServer,
} from "http";

import {
    Server,
    type Socket,
} from "socket.io";

import {
    prisma,
} from "../prisma/client";

import {
    verifyAccessToken,
} from "../services/auth.service";

export interface AuthenticatedSocketUser {
    id: string;
    email: string;
    role: string;
}

export interface RealtimeNotificationPayload {
    id: string;

    type: string;

    title: string;
    message: string;
    link: string | null;

    isRead: boolean;

    createdAt: string;
}

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

interface InterServerEvents { }

interface SocketData {
    user: AuthenticatedSocketUser;
}

export type PlacementSocketServer =
    Server<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >;

export type PlacementSocket =
    Socket<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >;

let socketServer:
    PlacementSocketServer | null =
    null;

export const getUserSocketRoom = (
    userId: string
): string => {
    return `user:${userId}`;
};

const getSocketAccessToken = (
    socket: PlacementSocket
): string | null => {
    const authToken =
        socket.handshake.auth?.token;

    if (
        typeof authToken ===
        "string" &&
        authToken.trim()
    ) {
        return authToken.trim();
    }

    const authorizationHeader =
        socket.handshake.headers
            .authorization;

    if (
        typeof authorizationHeader !==
        "string"
    ) {
        return null;
    }

    const [
        scheme,
        token,
    ] =
        authorizationHeader
            .trim()
            .split(/\s+/);

    if (
        scheme?.toLowerCase() !==
        "bearer" ||
        !token
    ) {
        return null;
    }

    return token;
};

const authenticateSocket =
    async (
        socket: PlacementSocket,
        next: (
            error?: Error
        ) => void
    ): Promise<void> => {
        try {
            const token =
                getSocketAccessToken(
                    socket
                );

            if (!token) {
                next(
                    new Error(
                        "AUTHENTICATION_REQUIRED"
                    )
                );
                return;
            }

            const decoded =
                verifyAccessToken(
                    token
                );

            const user =
                await prisma.user.findUnique({
                    where: {
                        id:
                            decoded.userId,
                    },

                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                });

            if (!user) {
                next(
                    new Error(
                        "USER_NOT_FOUND"
                    )
                );
                return;
            }

            socket.data.user = {
                id: user.id,
                email: user.email,
                role: user.role,
            };

            next();
        } catch {
            next(
                new Error(
                    "INVALID_ACCESS_TOKEN"
                )
            );
        }
    };

export const initializeSocketServer =
    (
        httpServer: HttpServer,
        allowedOrigins: string[]
    ): PlacementSocketServer => {
        if (socketServer) {
            return socketServer;
        }

        const io:
            PlacementSocketServer =
            new Server<
                ClientToServerEvents,
                ServerToClientEvents,
                InterServerEvents,
                SocketData
            >(
                httpServer,
                {
                    cors: {
                        origin:
                            allowedOrigins,

                        methods: [
                            "GET",
                            "POST",
                        ],

                        credentials:
                            true,
                    },
                }
            );

        io.use(
            authenticateSocket
        );

        io.on(
            "connection",
            (socket) => {
                const user =
                    socket.data.user;

                const userRoom =
                    getUserSocketRoom(
                        user.id
                    );

                /*
                 * The room is derived only from
                 * the verified access token.
                 * Clients cannot choose another
                 * user's room.
                 */
                socket.join(
                    userRoom
                );

                console.log(
                    `Authenticated socket connected: ${socket.id}`
                );

                socket.emit(
                    "connection:ready",
                    {
                        userId:
                            user.id,
                    }
                );

                socket.on(
                    "connection:ping",
                    (callback) => {
                        callback?.({
                            ok: true,

                            timestamp:
                                new Date()
                                    .toISOString(),
                        });
                    }
                );

                socket.on(
                    "disconnect",
                    (reason) => {
                        console.log(
                            `Authenticated socket disconnected: ${socket.id} (${reason})`
                        );
                    }
                );
            }
        );

        socketServer = io;

        return io;
    };

export const getSocketServer =
    ():
        | PlacementSocketServer
        | null => {
        return socketServer;
    };

export const emitNotificationToUser =
    (
        userId: string,
        notification:
            RealtimeNotificationPayload
    ): boolean => {
        if (!socketServer) {
            /*
             * During tests, CLI jobs, or server
             * initialization the Socket.IO server
             * may not exist. Database notification
             * creation must still succeed.
             */
            return false;
        }

        socketServer
            .to(
                getUserSocketRoom(
                    userId
                )
            )
            .emit(
                "notification:new",
                notification
            );

        return true;
    };
export const toRealtimeNotification =
    (
        notification: {
            id: string;
            type: string;
            title: string;
            message: string;
            link: string | null;
            isRead: boolean;
            createdAt: Date;
        }
    ):
        RealtimeNotificationPayload => {
        return {
            id: notification.id,

            type:
                notification.type,

            title:
                notification.title,

            message:
                notification.message,

            link:
                notification.link,

            isRead:
                notification.isRead,

            createdAt:
                notification.createdAt
                    .toISOString(),
        };
    };
export const closeSocketServer =
    async (): Promise<void> => {
        if (!socketServer) {
            return;
        }

        const currentServer =
            socketServer;

        socketServer = null;

        await new Promise<void>(
            (resolve) => {
                currentServer.close(
                    () => {
                        resolve();
                    }
                );
            }
        );
    };