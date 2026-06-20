
import { Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
    getNextRevisionDate,
    refreshDSAReadiness,
} from "../services/dsa.service";

const VALID_DIFFICULTIES = new Set(["EASY", "MEDIUM", "HARD"]);
const VALID_STATUSES = new Set(["UNSOLVED", "ATTEMPTED", "SOLVED"]);

const normalizeRequiredString = (value: unknown) => {
    return typeof value === "string" ? value.trim() : "";
};

const normalizeOptionalString = (value: unknown) => {
    if (typeof value !== "string") return null;

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
};

const normalizeStringArray = (value: unknown) => {
    if (!Array.isArray(value)) return [];

    return Array.from(
        new Set(
            value
                .filter((item): item is string => typeof item === "string")
                .map((item) => item.trim())
                .filter(Boolean)
        )
    );
};

const normalizeDifficulty = (value: unknown) => {
    if (typeof value !== "string") return null;

    const normalized = value.trim().toUpperCase();

    return VALID_DIFFICULTIES.has(normalized)
        ? (normalized as "EASY" | "MEDIUM" | "HARD")
        : null;
};

const normalizeStatus = (value: unknown) => {
    if (typeof value !== "string") return null;

    const normalized = value.trim().toUpperCase();

    return VALID_STATUSES.has(normalized)
        ? (normalized as "UNSOLVED" | "ATTEMPTED" | "SOLVED")
        : null;
};

const groupByString = (
    items: Array<Record<string, unknown>>,
    key: string
) => {
    return items.reduce<Record<string, number>>((accumulator, item) => {
        const rawValue = item[key];

        if (typeof rawValue !== "string") return accumulator;

        const value = rawValue.trim();

        if (!value) return accumulator;

        accumulator[value] = (accumulator[value] ?? 0) + 1;

        return accumulator;
    }, {});
};

const getTodayDate = () => {
    const now = new Date();

    return new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    );
};

const getEndOfToday = () => {
    const endOfToday = getTodayDate();

    endOfToday.setUTCDate(endOfToday.getUTCDate() + 1);
    endOfToday.setUTCMilliseconds(-1);

    return endOfToday;
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
    streaks: Array<{
        date: Date;
    }>
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
        currentStreak += 1;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    return currentStreak;
};

/**
 * Backward-compatible export in case another file imports this
 * function from the controller.
 */
export const updateDSAReadiness = refreshDSAReadiness;

export const getProblems = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId = req.user!.id;

        const {
            topic,
            pattern,
            difficulty,
            status,
            company,
            search,
            revisionDue: revisionDueFilter,
        } = req.query;

        const normalizedDifficulty = difficulty
            ? normalizeDifficulty(difficulty)
            : null;

        const normalizedStatus = status
            ? normalizeStatus(status)
            : null;

        if (difficulty && !normalizedDifficulty) {
            return res.status(400).json({
                message: "Invalid difficulty filter",
            });
        }

        if (status && !normalizedStatus) {
            return res.status(400).json({
                message: "Invalid status filter",
            });
        }

        const where: Prisma.DSAProblemWhereInput = {
            userId,
            ...(topic && {
                topic: {
                    equals: String(topic),
                    mode: "insensitive",
                },
            }),
            ...(pattern && {
                pattern: {
                    equals: String(pattern),
                    mode: "insensitive",
                },
            }),
            ...(normalizedDifficulty && {
                difficulty: normalizedDifficulty,
            }),
            ...(normalizedStatus && {
                status: normalizedStatus,
            }),
            ...(company && {
                companies: {
                    has: String(company),
                },
            }),
            ...(revisionDueFilter === "true" && {
                status: "SOLVED",
                nextRevisionAt: {
                    lte: getEndOfToday(),
                },
            }),
            ...(search && {
                OR: [
                    {
                        title: {
                            contains: String(search),
                            mode: "insensitive",
                        },
                    },
                    {
                        topic: {
                            contains: String(search),
                            mode: "insensitive",
                        },
                    },
                    {
                        pattern: {
                            contains: String(search),
                            mode: "insensitive",
                        },
                    },
                ],
            }),
        };

        const [problems, allProblems] = await Promise.all([
            prisma.dSAProblem.findMany({
                where,
                orderBy: [
                    {
                        nextRevisionAt: "asc",
                    },
                    {
                        createdAt: "desc",
                    },
                ],
            }),

            prisma.dSAProblem.findMany({
                where: {
                    userId,
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
        ]);

        const revisionDueCount = allProblems.filter(
            (problem) =>
                problem.status === "SOLVED" &&
                problem.nextRevisionAt !== null &&
                problem.nextRevisionAt <= getEndOfToday()
        ).length;

        const stats = {
            total: allProblems.length,

            solved: allProblems.filter(
                (problem) => problem.status === "SOLVED"
            ).length,

            attempted: allProblems.filter(
                (problem) => problem.status === "ATTEMPTED"
            ).length,

            unsolved: allProblems.filter(
                (problem) => problem.status === "UNSOLVED"
            ).length,

            revisionDue: revisionDueCount,

            byTopic: groupByString(
                allProblems as unknown as Array<Record<string, unknown>>,
                "topic"
            ),

            byPattern: groupByString(
                allProblems as unknown as Array<Record<string, unknown>>,
                "pattern"
            ),

            byDifficulty: {
                easy: allProblems.filter(
                    (problem) => problem.difficulty === "EASY"
                ).length,

                medium: allProblems.filter(
                    (problem) => problem.difficulty === "MEDIUM"
                ).length,

                hard: allProblems.filter(
                    (problem) => problem.difficulty === "HARD"
                ).length,
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

export const addProblem = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId = req.user!.id;

        const {
            title,
            topic,
            pattern,
            difficulty,
            status,
            platform,
            problemUrl,
            companies,
            notes,
        } = req.body;

        const normalizedTitle = normalizeRequiredString(title);
        const normalizedTopic = normalizeRequiredString(topic);
        const normalizedDifficulty = normalizeDifficulty(difficulty);
        const normalizedStatus = status
            ? normalizeStatus(status)
            : "UNSOLVED";

        if (
            !normalizedTitle ||
            !normalizedTopic ||
            !normalizedDifficulty
        ) {
            return res.status(400).json({
                message: "Title, topic, and valid difficulty are required",
            });
        }

        if (!normalizedStatus) {
            return res.status(400).json({
                message: "Invalid problem status",
            });
        }

        const now = new Date();
        const isSolved = normalizedStatus === "SOLVED";

        const problem = await prisma.dSAProblem.create({
            data: {
                userId,
                title: normalizedTitle,
                topic: normalizedTopic,
                pattern: normalizeOptionalString(pattern),
                difficulty: normalizedDifficulty,
                status: normalizedStatus,

                platform: normalizeOptionalString(platform),
                problemUrl: normalizeOptionalString(problemUrl),

                source: "MANUAL",
                externalId: null,
                importedAt: null,

                companies: normalizeStringArray(companies),
                notes: normalizeOptionalString(notes),

                solveCount: isSolved ? 1 : 0,
                solvedAt: isSolved ? now : null,

                revisionCount: 0,
                lastRevisedAt: null,
                nextRevisionAt: isSolved
                    ? getNextRevisionDate(0, now)
                    : null,
            },
        });

        await Promise.all([
            updateStreak(userId, "dsa"),
            refreshDSAReadiness(userId),
        ]);

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

export const updateProblem = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId = req.user!.id;
        const rawId = req.params.id;
        const id = Array.isArray(rawId) ? rawId[0] : rawId;

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

        const {
            title,
            topic,
            pattern,
            difficulty,
            status,
            platform,
            problemUrl,
            companies,
            notes,
        } = req.body;

        const normalizedDifficulty =
            difficulty !== undefined
                ? normalizeDifficulty(difficulty)
                : undefined;

        const normalizedStatus =
            status !== undefined
                ? normalizeStatus(status)
                : undefined;

        if (difficulty !== undefined && !normalizedDifficulty) {
            return res.status(400).json({
                message: "Invalid difficulty",
            });
        }

        if (status !== undefined && !normalizedStatus) {
            return res.status(400).json({
                message: "Invalid problem status",
            });
        }

        if (
            title !== undefined &&
            !normalizeRequiredString(title)
        ) {
            return res.status(400).json({
                message: "Title cannot be empty",
            });
        }

        if (
            topic !== undefined &&
            !normalizeRequiredString(topic)
        ) {
            return res.status(400).json({
                message: "Topic cannot be empty",
            });
        }

        const nextStatus =
            normalizedStatus ?? existingProblem.status;

        const becameSolved =
            existingProblem.status !== "SOLVED" &&
            nextStatus === "SOLVED";

        const leftSolvedState =
            existingProblem.status === "SOLVED" &&
            nextStatus !== "SOLVED";

        const now = new Date();

        const updateData: Prisma.DSAProblemUncheckedUpdateInput = {
            ...(title !== undefined && {
                title: normalizeRequiredString(title),
            }),

            ...(topic !== undefined && {
                topic: normalizeRequiredString(topic),
            }),

            ...(pattern !== undefined && {
                pattern: normalizeOptionalString(pattern),
            }),

            ...(normalizedDifficulty && {
                difficulty: normalizedDifficulty,
            }),

            ...(normalizedStatus && {
                status: normalizedStatus,
            }),

            ...(platform !== undefined && {
                platform: normalizeOptionalString(platform),
            }),

            ...(problemUrl !== undefined && {
                problemUrl: normalizeOptionalString(problemUrl),
            }),

            ...(companies !== undefined && {
                companies: normalizeStringArray(companies),
            }),

            ...(notes !== undefined && {
                notes: normalizeOptionalString(notes),
            }),
        };

        if (becameSolved) {
            updateData.solvedAt = now;
            updateData.solveCount = {
                increment: 1,
            };
            updateData.nextRevisionAt = getNextRevisionDate(
                existingProblem.revisionCount,
                now
            );
        }

        if (leftSolvedState) {
            updateData.solvedAt = null;
            updateData.nextRevisionAt = null;
        }

        const updatedProblem = await prisma.dSAProblem.update({
            where: {
                id,
            },
            data: updateData,
        });

        await Promise.all([
            updateStreak(userId, "dsa"),
            refreshDSAReadiness(userId),
        ]);

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

export const deleteProblem = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId = req.user!.id;
        const rawId = req.params.id;
        const id = Array.isArray(rawId) ? rawId[0] : rawId;

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
            select: {
                id: true,
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

        await refreshDSAReadiness(userId);

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

export const getStreak = async (
    req: AuthRequest,
    res: Response
) => {
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
