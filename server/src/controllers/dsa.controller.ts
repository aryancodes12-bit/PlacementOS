import { Response } from "express";
import { prisma } from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { updateReadiness } from "../services/readiness.service";
const groupBy = <T extends Record<string, any>>(items: T[], key: keyof T) => {
    return items.reduce((acc, item) => {
        const value = item[key] as string;
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
};

const getTodayDate = () => {
    const now = new Date();

    return new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    );
};

const updateStreak = async (userId: string, activity: string) => {
    const today = getTodayDate();

    await prisma.streak.upsert({
        where: {
            userId_date_activity: {
                userId,
                date: today,
                activity,
            },
        },
        update: {},
        create: {
            userId,
            date: today,
            activity,
        },
    });
};

const calculateCurrentStreak = (
    streaks: {
        date: Date;
    }[]
) => {
    if (streaks.length === 0) return 0;

    const toDateKey = (date: Date) => {
        return date.toISOString().split("T")[0];
    };

    const uniqueDates = new Set(
        streaks.map((streak) => toDateKey(new Date(streak.date)))
    );

    let currentStreak = 0;
    const cursor = getTodayDate();

    while (uniqueDates.has(toDateKey(cursor))) {
        currentStreak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    return currentStreak;
};

export const updateDSAReadiness = async (userId: string) => {
    const problems = await prisma.dSAProblem.findMany({
        where: {
            userId,
        },
    });

    const solved = problems.filter((problem) => problem.status === "SOLVED").length;
    const attempted = problems.filter(
        (problem) => problem.status === "ATTEMPTED"
    ).length;

    const dsaScore = Math.min(100, Math.round(solved * 1 + attempted * 0.25));

    const existingScore = await prisma.readinessScore.findUnique({
        where: {
            userId,
        },
    });

    const resumeScore = existingScore?.resumeScore ?? 0;
    const interviewScore = existingScore?.interviewScore ?? 0;
    const aptitudeScore = existingScore?.aptitudeScore ?? 0;

    const overallScore = Math.round(
        (dsaScore + resumeScore + interviewScore + aptitudeScore) / 4
    );

    await prisma.readinessScore.upsert({
        where: {
            userId,
        },
        update: {
            dsaScore,
            overallScore,
            updatedAt: new Date(),
        },
        create: {
            userId,
            dsaScore,
            resumeScore: 0,
            interviewScore: 0,
            aptitudeScore: 0,
            overallScore,
            readyFor: [],
            improveFor: [],
        },
    });
};

export const getProblems = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { topic, difficulty, status, search } = req.query;

        const problems = await prisma.dSAProblem.findMany({
            where: {
                userId,
                ...(topic && {
                    topic: {
                        equals: topic as string,
                        mode: "insensitive",
                    },
                }),
                ...(difficulty && {
                    difficulty: difficulty as any,
                }),
                ...(status && {
                    status: status as any,
                }),
                ...(search && {
                    title: {
                        contains: search as string,
                        mode: "insensitive",
                    },
                }),
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const stats = {
            total: problems.length,
            solved: problems.filter((problem) => problem.status === "SOLVED").length,
            attempted: problems.filter((problem) => problem.status === "ATTEMPTED")
                .length,
            unsolved: problems.filter((problem) => problem.status === "UNSOLVED")
                .length,
            byTopic: groupBy(problems, "topic"),
            byDifficulty: {
                easy: problems.filter((problem) => problem.difficulty === "EASY").length,
                medium: problems.filter((problem) => problem.difficulty === "MEDIUM")
                    .length,
                hard: problems.filter((problem) => problem.difficulty === "HARD").length,
            },
        };

        return res.status(200).json({
            problems,
            stats,
        });
    } catch (error) {
        console.error("getProblems error:", error);

        return res.status(500).json({
            message: "Failed to fetch DSA problems",
        });
    }
};

export const addProblem = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const {
            title,
            topic,
            difficulty,
            status,
            platform,
            problemUrl,
            notes,
        } = req.body;

        if (!title || !topic || !difficulty) {
            return res.status(400).json({
                message: "Title, topic, and difficulty are required",
            });
        }

        const problem = await prisma.dSAProblem.create({
            data: {
                userId,
                title,
                topic,
                difficulty,
                status: status || "UNSOLVED",
                platform: platform || null,
                problemUrl: problemUrl || null,
                notes: notes || null,
                solvedAt: status === "SOLVED" ? new Date() : null,
            },
        });

        await updateStreak(userId, "dsa");
        await updateDSAReadiness(userId);
        await updateReadiness(userId);

        return res.status(201).json({
            message: "Problem added successfully",
            problem,
        });
    } catch (error) {
        console.error("addProblem error:", error);

        return res.status(500).json({
            message: "Failed to add DSA problem",
        });
    }
};

export const updateProblem = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const idParam = req.params.id;
        const id = Array.isArray(idParam) ? idParam[0] : idParam;

        if (!id) {
            return res.status(400).json({
                message: "Problem id is required",
            });
        }

        const {
            title,
            topic,
            difficulty,
            status,
            platform,
            problemUrl,
            notes,
        } = req.body;

        const existingProblem = await prisma.dSAProblem.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!existingProblem) {
            return res.status(404).json({
                message: "Problem not found",
            });
        }

        const updatedProblem = await prisma.dSAProblem.update({
            where: {
                id,
            },
            data: {
                ...(title !== undefined && { title }),
                ...(topic !== undefined && { topic }),
                ...(difficulty !== undefined && { difficulty }),
                ...(platform !== undefined && { platform }),
                ...(problemUrl !== undefined && { problemUrl }),
                ...(notes !== undefined && { notes }),
                ...(status !== undefined && {
                    status,
                    solvedAt:
                        status === "SOLVED"
                            ? existingProblem.solvedAt || new Date()
                            : null,
                }),
            },
        });

        await updateStreak(userId, "dsa");
        await updateDSAReadiness(userId);
        await updateReadiness(userId);

        return res.status(200).json({
            message: "Problem updated successfully",
            problem: updatedProblem,
        });
    } catch (error) {
        console.error("updateProblem error:", error);

        return res.status(500).json({
            message: "Failed to update DSA problem",
        });
    }
};

export const deleteProblem = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const idParam = req.params.id;
        const id = Array.isArray(idParam) ? idParam[0] : idParam;

        if (!id) {
            return res.status(400).json({
                message: "Problem id is required",
            });
        }

        const existingProblem = await prisma.dSAProblem.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!existingProblem) {
            return res.status(404).json({
                message: "Problem not found",
            });
        }

        await prisma.dSAProblem.delete({
            where: {
                id,
            },
        });

        await updateDSAReadiness(userId);
        await updateReadiness(userId);
        return res.status(200).json({
            message: "Problem deleted successfully",
        });
    } catch (error) {
        console.error("deleteProblem error:", error);

        return res.status(500).json({
            message: "Failed to delete DSA problem",
        });
    }
};

export const getStreak = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const streaks = await prisma.streak.findMany({
            where: {
                userId,
                activity: "dsa",
            },
            orderBy: {
                date: "desc",
            },
            take: 30,
        });

        const currentStreak = calculateCurrentStreak(streaks);

        return res.status(200).json({
            streaks,
            currentStreak,
        });
    } catch (error) {
        console.error("getStreak error:", error);

        return res.status(500).json({
            message: "Failed to fetch streak",
        });
    }
};