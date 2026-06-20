import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
    getDSAAnalytics,
    getDSARevisionQueue,
    markDSAProblemRevised,
} from "../services/dsaAnalytics.service";

export const getAnalytics = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId = req.user!.id;

        const analytics = await getDSAAnalytics(userId);

        return res.status(200).json({
            analytics,
        });
    } catch (error) {
        console.error("getDSAAnalytics error:", error);

        return res.status(500).json({
            message: "Failed to fetch DSA analytics",
        });
    }
};

export const getRevisionQueue = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId = req.user!.id;

        const revisionData =
            await getDSARevisionQueue(userId);

        return res.status(200).json(revisionData);
    } catch (error) {
        console.error("getRevisionQueue error:", error);

        return res.status(500).json({
            message: "Failed to fetch revision queue",
        });
    }
};

export const reviseProblem = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId = req.user!.id;
        const rawId = req.params.id;
        const id = Array.isArray(rawId)
            ? rawId[0]
            : rawId;

        if (!id) {
            return res.status(400).json({
                message: "Problem id is required",
            });
        }

        const result = await markDSAProblemRevised(
            userId,
            id
        );

        return res.status(200).json({
            message: "Problem marked as revised",
            problem: result.problem,
            revision: result.revision,
        });
    } catch (error: any) {
        console.error("reviseProblem error:", error);

        if (
            error.message === "Problem not found"
        ) {
            return res.status(404).json({
                message: error.message,
            });
        }

        if (
            error.message ===
            "Only solved problems can be marked as revised"
        ) {
            return res.status(400).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Failed to revise problem",
        });
    }
};