import { prisma } from "../prisma/client";
import {
    getNextRevisionDate,
    refreshDSAReadiness,
} from "./dsa.service";
import { calculateDSAScoreBreakdown } from "./dsaScoring.service";
import { CORE_DSA_PATTERNS } from "../constants/dsa.constants";


const startOfUtcDay = (date: Date) => {
    return new Date(
        Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate()
        )
    );
};

const endOfUtcDay = (date: Date) => {
    const end = startOfUtcDay(date);
    end.setUTCDate(end.getUTCDate() + 1);
    end.setUTCMilliseconds(-1);

    return end;
};

const getDayDifference = (laterDate: Date, earlierDate: Date) => {
    const later = startOfUtcDay(laterDate).getTime();
    const earlier = startOfUtcDay(earlierDate).getTime();

    return Math.max(
        0,
        Math.floor((later - earlier) / (1000 * 60 * 60 * 24))
    );
};

const normalizeLabel = (value: string | null | undefined) => {
    return value?.trim() || "Uncategorized";
};

const calculatePercentage = (value: number, total: number) => {
    if (total <= 0) return 0;

    return Math.round((value / total) * 100);
};

const getCoverageStatus = (
    solved: number,
    total: number
): "STRONG" | "DEVELOPING" | "WEAK" | "NOT_STARTED" => {
    if (total === 0 || solved === 0) {
        return "NOT_STARTED";
    }

    const percentage = calculatePercentage(solved, total);

    if (percentage >= 70) return "STRONG";
    if (percentage >= 40) return "DEVELOPING";

    return "WEAK";
};

export const getDSAAnalytics = async (userId: string) => {
    const [problems, revisions] = await Promise.all([
        prisma.dSAProblem.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        }),

        prisma.dSARevision.findMany({
            where: {
                problem: {
                    userId,
                },
            },
            orderBy: {
                completedAt: "desc",
            },
        }),
    ]);

    const today = new Date();
    const endOfToday = endOfUtcDay(today);

    const solvedProblems = problems.filter(
        (problem) => problem.status === "SOLVED"
    );

    const attemptedProblems = problems.filter(
        (problem) => problem.status === "ATTEMPTED"
    );

    const unsolvedProblems = problems.filter(
        (problem) => problem.status === "UNSOLVED"
    );

    const revisionQueue = solvedProblems
        .filter(
            (problem) =>
                problem.nextRevisionAt !== null &&
                problem.nextRevisionAt <= endOfToday
        )
        .sort((first, second) => {
            const firstDate =
                first.nextRevisionAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

            const secondDate =
                second.nextRevisionAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

            return firstDate - secondDate;
        })
        .map((problem) => ({
            id: problem.id,
            title: problem.title,
            topic: problem.topic,
            pattern: problem.pattern,
            difficulty: problem.difficulty,
            platform: problem.platform,
            problemUrl: problem.problemUrl,
            companies: problem.companies,
            revisionCount: problem.revisionCount,
            solveCount: problem.solveCount,
            nextRevisionAt: problem.nextRevisionAt,
            overdueDays: problem.nextRevisionAt
                ? getDayDifference(today, problem.nextRevisionAt)
                : 0,
        }));

    const topicMap = new Map<
        string,
        {
            topic: string;
            total: number;
            solved: number;
            attempted: number;
            unsolved: number;
        }
    >();

    for (const problem of problems) {
        const topic = normalizeLabel(problem.topic);

        const current = topicMap.get(topic) ?? {
            topic,
            total: 0,
            solved: 0,
            attempted: 0,
            unsolved: 0,
        };

        current.total += 1;

        if (problem.status === "SOLVED") current.solved += 1;
        if (problem.status === "ATTEMPTED") current.attempted += 1;
        if (problem.status === "UNSOLVED") current.unsolved += 1;

        topicMap.set(topic, current);
    }

    const topicProgress = Array.from(topicMap.values())
        .map((topic) => ({
            ...topic,
            percentage: calculatePercentage(topic.solved, topic.total),
        }))
        .sort((first, second) => {
            return second.total - first.total;
        });

    const weakTopics = topicProgress
        .filter(
            (topic) =>
                topic.total >= 2 &&
                topic.percentage < 40
        )
        .sort((first, second) => {
            return first.percentage - second.percentage;
        });

    const patternMap = new Map<
        string,
        {
            pattern: string;
            total: number;
            solved: number;
            attempted: number;
        }
    >();

    for (const corePattern of CORE_DSA_PATTERNS) {
        patternMap.set(corePattern, {
            pattern: corePattern,
            total: 0,
            solved: 0,
            attempted: 0,
        });
    }

    for (const problem of problems) {
        if (!problem.pattern?.trim()) continue;

        const pattern = problem.pattern.trim();

        const current = patternMap.get(pattern) ?? {
            pattern,
            total: 0,
            solved: 0,
            attempted: 0,
        };

        current.total += 1;

        if (problem.status === "SOLVED") {
            current.solved += 1;
        }

        if (problem.status === "ATTEMPTED") {
            current.attempted += 1;
        }

        patternMap.set(pattern, current);
    }

    const patternCoverage = Array.from(patternMap.values())
        .map((pattern) => ({
            ...pattern,
            percentage: calculatePercentage(
                pattern.solved,
                pattern.total
            ),
            status: getCoverageStatus(
                pattern.solved,
                pattern.total
            ),
        }))
        .sort((first, second) => {
            if (first.status === "NOT_STARTED") return 1;
            if (second.status === "NOT_STARTED") return -1;

            return second.percentage - first.percentage;
        });

    const weakPatterns = patternCoverage
        .filter(
            (pattern) =>
                pattern.total > 0 &&
                pattern.percentage < 40
        )
        .sort((first, second) => {
            return first.percentage - second.percentage;
        });

    const patternGaps = patternCoverage
        .filter(
            (pattern) =>
                pattern.total === 0 ||
                pattern.solved === 0
        )
        .map((pattern) => pattern.pattern);

    const completedOnTime = revisions.filter(
        (revision) => !revision.wasOverdue
    ).length;

    const completedLate = revisions.filter(
        (revision) => revision.wasOverdue
    ).length;

    const pendingOverdue = revisionQueue.filter(
        (problem) => problem.overdueDays > 0
    ).length;

    const revisionConsistencyDenominator =
        revisions.length + pendingOverdue;

    const revisionConsistencyPercentage =
        revisionConsistencyDenominator > 0
            ? Math.round(
                (completedOnTime /
                    revisionConsistencyDenominator) *
                100
            )
            : 0;

    const uniqueSolvedPatterns = new Set(
        solvedProblems
            .map((problem) => problem.pattern?.trim())
            .filter(
                (pattern): pattern is string => Boolean(pattern)
            )
    );

    const difficultyDistribution = {
        easy: {
            total: problems.filter(
                (problem) => problem.difficulty === "EASY"
            ).length,
            solved: solvedProblems.filter(
                (problem) => problem.difficulty === "EASY"
            ).length,
        },

        medium: {
            total: problems.filter(
                (problem) => problem.difficulty === "MEDIUM"
            ).length,
            solved: solvedProblems.filter(
                (problem) => problem.difficulty === "MEDIUM"
            ).length,
        },

        hard: {
            total: problems.filter(
                (problem) => problem.difficulty === "HARD"
            ).length,
            solved: solvedProblems.filter(
                (problem) => problem.difficulty === "HARD"
            ).length,
        },
    };

    const focusPatterns = [
        ...weakPatterns.map((pattern) => pattern.pattern),
        ...patternGaps,
    ].slice(0, 3);

    const score = await calculateDSAScoreBreakdown(userId);

    return {
        dsaScore: score.dsaScore,
        scoreBreakdown: score.breakdown,
        summary: {
            total: problems.length,
            solved: solvedProblems.length,
            attempted: attemptedProblems.length,
            unsolved: unsolvedProblems.length,
            revisionDue: revisionQueue.length,
            uniqueTopics: new Set(
                problems.map((problem) => problem.topic.trim())
            ).size,
            uniqueSolvedPatterns: uniqueSolvedPatterns.size,
        },

        topicProgress,
        patternCoverage,
        weakTopics,
        weakPatterns,
        patternGaps,
        revisionQueue,

        revisionConsistency: {
            completed: revisions.length,
            completedOnTime,
            completedLate,
            pendingOverdue,
            percentage: revisionConsistencyPercentage,
        },

        difficultyDistribution,

        dailyTarget: {
            newProblems: problems.length < 20 ? 2 : 3,
            revisions: Math.min(revisionQueue.length, 3),
            focusPatterns,
        },
    };
};

export const getDSARevisionQueue = async (userId: string) => {
    const analytics = await getDSAAnalytics(userId);
    const score = await calculateDSAScoreBreakdown(userId);
    return {
        revisionQueue: analytics.revisionQueue,
        revisionConsistency: analytics.revisionConsistency,
    };
};

export const markDSAProblemRevised = async (
    userId: string,
    problemId: string
) => {
    const existingProblem = await prisma.dSAProblem.findFirst({
        where: {
            id: problemId,
            userId,
        },
    });

    if (!existingProblem) {
        throw new Error("Problem not found");
    }

    if (existingProblem.status !== "SOLVED") {
        throw new Error(
            "Only solved problems can be marked as revised"
        );
    }

    const now = new Date();
    const scheduledFor = existingProblem.nextRevisionAt;

    const wasOverdue =
        scheduledFor !== null &&
        startOfUtcDay(now) >
        startOfUtcDay(scheduledFor);

    const nextRevisionCount =
        existingProblem.revisionCount + 1;

    const nextRevisionAt = getNextRevisionDate(
        nextRevisionCount,
        now
    );

    const intervalDays = getDayDifference(
        nextRevisionAt,
        now
    );

    const result = await prisma.$transaction(
        async (transaction) => {
            const revision =
                await transaction.dSARevision.create({
                    data: {
                        problemId,
                        scheduledFor,
                        completedAt: now,
                        intervalDays,
                        wasOverdue,
                    },
                });

            const problem =
                await transaction.dSAProblem.update({
                    where: {
                        id: problemId,
                    },
                    data: {
                        revisionCount: {
                            increment: 1,
                        },
                        solveCount: {
                            increment: 1,
                        },
                        lastRevisedAt: now,
                        nextRevisionAt,
                    },
                });

            const today = startOfUtcDay(now);

            await transaction.streak.upsert({
                where: {
                    userId_date_activity: {
                        userId,
                        date: today,
                        activity: "dsa",
                    },
                },
                update: {},
                create: {
                    userId,
                    date: today,
                    activity: "dsa",
                },
            });

            return {
                problem,
                revision,
            };
        }
    );

    await refreshDSAReadiness(userId);

    return result;
};