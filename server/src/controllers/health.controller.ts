import { Request, Response } from "express";
import { prisma } from "../prisma/client";

export const healthCheck = (_req: Request, res: Response) => {
    return res.status(200).json({
        success: true,
        message: "PlacementOS backend running 🚀",
    });
};

export const dbHealthCheck = async (_req: Request, res: Response) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        return res.status(200).json({
            success: true,
            message: "Database connected successfully",
        });
    } catch (error) {
        console.error("Database health error:", error);

        return res.status(500).json({
            success: false,
            message: "Database connection failed",
        });
    }
};