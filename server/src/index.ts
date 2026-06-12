import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import healthRoutes from "./routes/health.routes";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:51212",
    process.env.CLIENT_URL,
].filter(Boolean) as string[];

const corsOptions = {
    origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
    ) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
};

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    },
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "PlacementOS API is running",
    });
});

app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

export { io };