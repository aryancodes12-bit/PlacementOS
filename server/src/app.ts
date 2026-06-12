import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "PlacementOS API is running",
    });
});

app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Server healthy",
    });
});

app.use("/api/auth", authRoutes);

export default app;