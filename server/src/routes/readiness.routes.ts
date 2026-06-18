import { Router, Response } from "express";
import { prisma } from "../prisma/client";
import { protect, AuthRequest } from "../middlewares/auth.middleware";
import {
    ensureReadinessScore,
    generateImprovementTips,
    getReadinessHistory,
    updateReadiness,
} from "../services/readiness.service";

const router = Router();

router.use(protect);

router.get("/me", async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        await ensureReadinessScore(userId);

        const updatedReadiness = await updateReadiness(userId);

        return res.status(200).json(updatedReadiness);
    } catch (error) {
        console.error("getReadiness error:", error);

        return res.status(500).json({
            message: "Failed to fetch readiness score",
        });
    }
});

router.get("/history", async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const history = await getReadinessHistory(userId);

        return res.status(200).json({
            history,
        });
    } catch (error) {
        console.error("getReadinessHistory error:", error);

        return res.status(500).json({
            message: "Failed to fetch readiness history",
        });
    }
});

router.patch("/companies", async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { companies } = req.body;

        if (!Array.isArray(companies)) {
            return res.status(400).json({
                message: "companies must be an array of strings",
            });
        }

        const cleanCompanies = companies
            .map((company) => String(company).trim())
            .filter(Boolean);

        await prisma.profile.upsert({
            where: {
                userId,
            },
            update: {
                targetCompanies: cleanCompanies,
            },
            create: {
                userId,
                targetCompanies: cleanCompanies,
                skills: [],
            },
        });

        const updatedReadiness = await updateReadiness(userId);

        return res.status(200).json({
            message: "Target companies updated successfully",
            readiness: updatedReadiness,
            readyFor: updatedReadiness.readyFor,
            improveFor: updatedReadiness.improveFor,
        });
    } catch (error) {
        console.error("updateTargetCompanies error:", error);

        return res.status(500).json({
            message: "Failed to update target companies",
        });
    }
});

router.get("/tips", async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const readiness = await prisma.readinessScore.findUnique({
            where: {
                userId,
            },
        });

        const tips = generateImprovementTips({
            dsaScore: readiness?.dsaScore ?? 0,
            resumeScore: readiness?.resumeScore ?? 0,
            interviewScore: readiness?.interviewScore ?? 0,
            aptitudeScore: readiness?.aptitudeScore ?? 0,
        });

        return res.status(200).json({
            tips,
        });
    } catch (error) {
        console.error("getReadinessTips error:", error);

        return res.status(500).json({
            message: "Failed to fetch improvement tips",
        });
    }
});

export default router;