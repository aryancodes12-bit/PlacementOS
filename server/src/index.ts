import "dotenv/config";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import roadmapRoutes from "./routes/roadmap.routes";
import authRoutes from "./routes/auth.routes";
import dailyPlanRoutes from "./routes/dailyplan.routes";
import dsaRoutes from "./routes/dsa.routes";
import healthRoutes from "./routes/health.routes";
import interviewRoutes from "./routes/interview.routes";
import paymentRoutes from "./routes/payment.routes";
import profileRoutes from "./routes/profile.routes";
import readinessRoutes from "./routes/readiness.routes";
import resumeRoutes from "./routes/resume.routes";
import settingsRoutes from "./routes/settings.routes";



const app = express();
const httpServer = createServer(app);

const normalizeOrigin = (origin: string) => {
    return origin.trim().replace(/\/+$/, "");
};

const allowedOrigins = Array.from(
    new Set(
        [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:51212",
            process.env.CLIENT_URL,
        ]
            .filter(
                (origin): origin is string =>
                    typeof origin === "string" &&
                    origin.trim().length > 0
            )
            .map(normalizeOrigin)
    )
);

const corsOptions = {
    origin: (
        origin: string | undefined,
        callback: (
            error: Error | null,
            allow?: boolean
        ) => void
    ) => {
        /*
         * Requests from Postman, curl and server-to-server
         * clients may not include an Origin header.
         */
        if (!origin) {
            return callback(null, true);
        }

        const normalizedRequestOrigin =
            normalizeOrigin(origin);

        if (
            allowedOrigins.includes(
                normalizedRequestOrigin
            )
        ) {
            return callback(null, true);
        }

        return callback(
            new Error(
                `CORS blocked origin: ${origin}`
            )
        );
    },

    credentials: true,

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization",
    ],

    optionsSuccessStatus: 204,
};

/*
 * CORS must be registered before every route,
 * including authenticated routes.
 */
app.use(cors(corsOptions));

/*
 * Body and cookie parsers must also be registered
 * before application routes.
 */
app.use(express.json());
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(cookieParser());
app.use("/api/roadmap", roadmapRoutes);
const io = new Server(httpServer, {
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
});

app.get("/", (_req, res) => {
    return res.status(200).json({
        success: true,
        message: "PlacementOS API is running",
    });
});

/*
 * Public and protected route modules.
 * Their own middleware decides authentication,
 * but global CORS always runs first.
 */
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/dsa", dsaRoutes);
app.use("/api/readiness", readinessRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/daily-plan", dailyPlanRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/settings", settingsRoutes);

/*
 * JSON response for unknown API routes.
 */
app.use("/api", (_req, res) => {
    return res.status(404).json({
        success: false,
        message: "API route not found.",
    });
});

/*
 * Handle rejected origins and unexpected Express errors.
 */
app.use(
    (
        error: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
    ) => {
        if (
            error.message.startsWith(
                "CORS blocked origin:"
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "This application origin is not allowed.",
            });
        }

        console.error(
            "Unhandled server error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
);

io.on("connection", (socket) => {
    console.log(
        `User connected: ${socket.id}`
    );

    socket.on("disconnect", () => {
        console.log(
            `User disconnected: ${socket.id}`
        );
    });
});

const PORT = Number(
    process.env.PORT || 5000
);

httpServer.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );

    console.log(
        `Allowed client origins: ${allowedOrigins.join(", ")}`
    );
});

export { io };
