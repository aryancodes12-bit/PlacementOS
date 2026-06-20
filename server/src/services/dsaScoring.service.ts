import { prisma } from "../prisma/client";
import {
    CORE_DSA_PATTERNS,
    DSA_REVISION_MATURITY_TARGET,
    DSA_SOLVED_TARGET,
} from "../constants/dsa.constants";

const clamp = (value: number, minimum = 0, maximum = 1) => {
    return Math.max(minimum, Math.min(maximum, value));
};

const roundScore = (value: number) => {
    return Math.round(value * 100) / 100;
};

const normalizePattern = (pattern: string) => {
    return pattern.trim().toLowerCase();
};

const getStartOfTodayUtc = () => {
    const now = new Date();

    return new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        )
    );
};

export const calculateDSAScoreBreakdown = async (userId: string) => {
    const [problems, revisions] = await Promise.all([
        prisma.dSAProblem.findMany({
            where: {
                userId,
            },
            select: {
                status: true,
                pattern: true,
                nextRevisionAt: true,
            },
        }),

        prisma.dSARevision.findMany({
            where: {
                problem: {
                    userId,
                },
            },
            select: {
                wasOverdue: true,
            },
        }),
    ]);

    const solvedProblems = problems.filter(
        (problem) => problem.status === "SOLVED"
    );

    /*
     * Section 1: Problem-solving progress — 50 points
     * 100 solved problems unlock the full 50 points.
     */
    const solvingProgressRate = clamp(
        solvedProblems.length / DSA_SOLVED_TARGET
    );

    const solvingProgressPoints = solvingProgressRate * 50;

    /*
     * Section 2: Pattern coverage — 30 points
     * Coverage is based on distinct patterns among solved problems.
     */
    const solvedPatterns = new Set(
        solvedProblems
            .map((problem) => problem.pattern)
            .filter(
                (pattern): pattern is string =>
                    typeof pattern === "string" &&
                    pattern.trim().length > 0
            )
            .map(normalizePattern)
    );

    const corePatternCount = CORE_DSA_PATTERNS.length;

    const coveredPatternCount = Math.min(
        solvedPatterns.size,
        corePatternCount
    );

    const patternCoverageRate = clamp(
        coveredPatternCount / corePatternCount
    );

    const patternCoveragePoints = patternCoverageRate * 30;

    /*
     * Section 3: Revision discipline — 20 points
     *
     * A single successful revision must not instantly award 20 points.
     * The maturity factor gradually unlocks this section over the
     * first 10 revision opportunities.
     */
    const completedRevisions = revisions.length;

    const completedOnTime = revisions.filter(
        (revision) => !revision.wasOverdue
    ).length;

    const startOfToday = getStartOfTodayUtc();

    const pendingOverdue = solvedProblems.filter(
        (problem) =>
            problem.nextRevisionAt !== null &&
            problem.nextRevisionAt < startOfToday
    ).length;

    const revisionOpportunities =
        completedRevisions + pendingOverdue;

    const revisionConsistencyRate =
        revisionOpportunities > 0
            ? completedOnTime / revisionOpportunities
            : 0;

    const revisionMaturityRate = clamp(
        revisionOpportunities /
        DSA_REVISION_MATURITY_TARGET
    );

    const revisionPoints =
        revisionConsistencyRate *
        revisionMaturityRate *
        20;

    const dsaScore = Math.round(
        solvingProgressPoints +
        patternCoveragePoints +
        revisionPoints
    );

    return {
        dsaScore: Math.max(0, Math.min(100, dsaScore)),

        breakdown: {
            solvingProgress: {
                solved: solvedProblems.length,
                target: DSA_SOLVED_TARGET,
                percentage: Math.round(
                    solvingProgressRate * 100
                ),
                points: roundScore(solvingProgressPoints),
                maxPoints: 50,
            },

            patternCoverage: {
                coveredPatterns: coveredPatternCount,
                totalPatterns: corePatternCount,
                patterns: Array.from(solvedPatterns),
                percentage: Math.round(
                    patternCoverageRate * 100
                ),
                points: roundScore(patternCoveragePoints),
                maxPoints: 30,
            },

            revisionDiscipline: {
                completed: completedRevisions,
                completedOnTime,
                pendingOverdue,
                opportunities: revisionOpportunities,
                consistencyPercentage: Math.round(
                    revisionConsistencyRate * 100
                ),
                maturityPercentage: Math.round(
                    revisionMaturityRate * 100
                ),
                points: roundScore(revisionPoints),
                maxPoints: 20,
            },
        },
    };
};