import "dotenv/config";
import notificationAutomationRoutes from "./routes/notificationAutomation.routes";
import express from "express";
import cors, {
    type CorsOptions,
} from "cors";
import cookieParser from "cookie-parser";
import notificationRoutes from "./routes/notification.routes";
import authRoutes from "./routes/auth.routes";
import dailyPlanRoutes from "./routes/dailyplan.routes";
import dsaRoutes from "./routes/dsa.routes";
import healthRoutes from "./routes/health.routes";
import interviewRoutes from "./routes/interview.routes";
import paymentRoutes from "./routes/payment.routes";
import profileRoutes from "./routes/profile.routes";
import readinessRoutes from "./routes/readiness.routes";
import resumeRoutes from "./routes/resume.routes";
import roadmapRoutes from "./routes/roadmap.routes";
import settingsRoutes from "./routes/settings.routes";
import notificationPreferenceRoutes from "./routes/notificationPreference.routes";
export const normalizeOrigin = (
    origin: string
): string => {
    return origin
        .trim()
        .replace(/\/+$/, "");
};

export const allowedOrigins =
    Array.from(
        new Set(
            [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:51212",
                process.env.CLIENT_URL,
            ]
                .filter(
                    (
                        origin
                    ): origin is string =>
                        typeof origin ===
                        "string" &&
                        origin.trim().length >
                        0
                )
                .map(normalizeOrigin)
        )
    );

export const corsOptions: CorsOptions =
{
    origin: (
        origin,
        callback
    ) => {
        /*
         * Postman, curl, automated tests,
         * native clients, and server-to-server
         * requests may omit the Origin header.
         */
        if (!origin) {
            callback(null, true);
            return;
        }

        const normalizedOrigin =
            normalizeOrigin(origin);

        if (
            allowedOrigins.includes(
                normalizedOrigin
            )
        ) {
            callback(null, true);
            return;
        }

        callback(
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

export const app = express();

/*
 * Do not expose the Express framework name
 * through the X-Powered-By header.
 */
app.disable("x-powered-by");

/*
 * Global middleware must be registered
 * before every application route.
 */
app.use(cors(corsOptions));

app.use(
    express.json({
        limit: "1mb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb",
    })
);

app.use(cookieParser());

app.get("/", (_req, res) => {
    return res.status(200).json({
        success: true,
        message:
            "PlacementOS API is running",
    });
});

/*
 * Public and protected API routes.
 */
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);

app.use(
    "/api/profile",
    profileRoutes
);

app.use("/api/dsa", dsaRoutes);

app.use(
    "/api/readiness",
    readinessRoutes
);

app.use(
    "/api/resume",
    resumeRoutes
);

app.use(
    "/api/interviews",
    interviewRoutes
);

app.use(
    "/api/daily-plan",
    dailyPlanRoutes
);
app.use(
    "/api/notifications",
    notificationRoutes
);
app.use(
    "/api/notification-preferences",
    notificationPreferenceRoutes
); app.use(
    "/api/internal/notification-automation",
    notificationAutomationRoutes
);
app.use(
    "/api/roadmap",
    roadmapRoutes
);

app.use(
    "/api/payments",
    paymentRoutes
);

app.use(
    "/api/settings",
    settingsRoutes
);

/*
 * Unknown API endpoint.
 */
app.use("/api", (_req, res) => {
    return res.status(404).json({
        success: false,
        message:
            "API route not found.",
    });
});

/*
 * Central Express error handler.
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
            message:
                "Internal server error.",
        });
    }
);

export default app;