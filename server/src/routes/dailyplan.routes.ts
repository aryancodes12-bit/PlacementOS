import { Router, Response } from "express";
import { prisma } from "../prisma/client";
import { protect, AuthRequest } from "../middlewares/auth.middleware";
import { generateDailyPlan } from "../services/dailyplan.service";

const router = Router();

router.use(protect);

const getTodayKey = () => {
    return new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
};

router.get("/", async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const createdDate = getTodayKey();

        const cachedPlan = await prisma.dailyPlan.findUnique({
            where: {
                userId_createdDate: {
                    userId,
                    createdDate,
                },
            },
        });

        if (cachedPlan) {
            return res.status(200).json({
                plan: cachedPlan.plan,
                cached: true,
            });
        }

        const plan = await generateDailyPlan(userId);

        await prisma.dailyPlan.create({
            data: {
                userId,
                createdDate,
                plan: plan as any,
            },
        });

        return res.status(200).json({
            plan,
            cached: false,
        });
    } catch (error: any) {
        console.error("getDailyPlan error:", error);

        return res.status(500).json({
            message: error.message || "Failed to generate daily plan",
        });
    }
});

router.post("/regenerate", async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const createdDate = getTodayKey();

        const plan = await generateDailyPlan(userId);

        await prisma.dailyPlan.upsert({
            where: {
                userId_createdDate: {
                    userId,
                    createdDate,
                },
            },
            update: {
                plan: plan as any,
            },
            create: {
                userId,
                createdDate,
                plan: plan as any,
            },
        });

        return res.status(200).json({
            plan,
            cached: false,
        });
    } catch (error: any) {
        console.error("regenerateDailyPlan error:", error);

        return res.status(500).json({
            message: error.message || "Failed to regenerate daily plan",
        });
    }
});

export default router;