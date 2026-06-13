import { Router, Response } from "express";
import { prisma } from "../prisma/client";
import { protect, AuthRequest } from "../middlewares/auth.middleware";

const router = Router();

router.get("/me", protect, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        let score = await prisma.readinessScore.findUnique({
            where: {
                userId,
            },
        });

        if (!score) {
            score = await prisma.readinessScore.create({
                data: {
                    userId,
                    dsaScore: 0,
                    resumeScore: 0,
                    interviewScore: 0,
                    aptitudeScore: 0,
                    overallScore: 0,
                    readyFor: [],
                    improveFor: [],
                },
            });
        }

        const overallScore = Math.round(
            (score.dsaScore +
                score.resumeScore +
                score.interviewScore +
                score.aptitudeScore) /
            4
        );

        const companies = [
            { name: "TCS", minScore: 40 },
            { name: "Infosys", minScore: 45 },
            { name: "Accenture", minScore: 50 },
            { name: "Wipro", minScore: 45 },
            { name: "Cognizant", minScore: 50 },
            { name: "JPMorgan", minScore: 65 },
            { name: "Amazon", minScore: 75 },
            { name: "Atlassian", minScore: 75 },
            { name: "Microsoft", minScore: 80 },
            { name: "Google", minScore: 85 },
        ];

        const readyFor = companies
            .filter((company) => overallScore >= company.minScore)
            .map((company) => company.name);

        const improveFor = companies
            .filter((company) => overallScore < company.minScore)
            .map((company) => company.name);

        const updatedScore = await prisma.readinessScore.update({
            where: {
                userId,
            },
            data: {
                overallScore,
                readyFor,
                improveFor,
            },
        });

        return res.status(200).json(updatedScore);
    } catch (error) {
        console.error("readiness error:", error);

        return res.status(500).json({
            message: "Failed to fetch readiness score",
        });
    }
});

export default router;