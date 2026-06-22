import "dotenv/config";

import {
    createServer,
} from "http";

import {
    Server,
} from "socket.io";

import {
    allowedOrigins,
    app,
} from "./app";

export const httpServer =
    createServer(app);

export const io = new Server(
    httpServer,
    {
        cors: {
            origin: allowedOrigins,

            methods: [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
            ],

            credentials: true,
        },
    }
);

io.on(
    "connection",
    (socket) => {
        console.log(
            `User connected: ${socket.id}`
        );

        socket.on(
            "disconnect",
            () => {
                console.log(
                    `User disconnected: ${socket.id}`
                );
            }
        );
    }
);

const PORT = Number(
    process.env.PORT || 5000
);

httpServer.listen(
    PORT,
    () => {
        console.log(
            `Server running on http://localhost:${PORT}`
        );

        console.log(
            `Allowed client origins: ${allowedOrigins.join(
                ", "
            )}`
        );
    }
);