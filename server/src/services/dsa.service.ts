import { prisma } from "../prisma/client";
import { updateReadiness } from "./readiness.service";
import { calculateDSAScoreBreakdown } from "./dsaScoring.service";
import { REVISION_INTERVAL_DAYS } from "../constants/dsa.constants";

const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);

    return result;
};

export const getNextRevisionDate = (
    revisionCount: number,
    baseDate = new Date()
) => {
    const safeRevisionCount = Math.max(
        0,
        revisionCount
    );

    const intervalIndex = Math.min(
        safeRevisionCount,
        REVISION_INTERVAL_DAYS.length - 1
    );

    return addDays(
        baseDate,
        REVISION_INTERVAL_DAYS[intervalIndex]
    );
};

export const refreshDSAReadiness = async (
    userId: string
) => {
    const scoringResult =
        await calculateDSAScoreBreakdown(userId);

    await prisma.readinessScore.upsert({
        where: {
            userId,
        },
        update: {
            dsaScore: scoringResult.dsaScore,
        },
        create: {
            userId,
            dsaScore: scoringResult.dsaScore,
            resumeScore: 0,
            interviewScore: 0,
            aptitudeScore: 0,
            overallScore: 0,
            readyFor: [],
            improveFor: [],
        },
    });

    const readiness = await updateReadiness(userId);

    return {
        readiness,
        dsaScore: scoringResult.dsaScore,
        breakdown: scoringResult.breakdown,
    };
};