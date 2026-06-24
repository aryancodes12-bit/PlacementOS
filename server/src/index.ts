import "dotenv/config";

import {
    createServer,
} from "http";

import {
    allowedOrigins,
    app,
} from "./app";

import {
    initializeSocketServer,
} from "./realtime/socket";

export const httpServer =
    createServer(app);

export const io =
    initializeSocketServer(
        httpServer,
        allowedOrigins
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