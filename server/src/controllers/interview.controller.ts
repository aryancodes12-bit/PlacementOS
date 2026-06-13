import { Response } from "express";
import { prisma } from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";

const normalizeEnum = (value: unknown, fallback: string) => {
    if (!value) return fallback;
    return String(value).trim().toUpperCase().replace(/\s+/g, "_");
};

const toStringArray = (value: unknown): string[] => {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value
            .map((item) => String(item).trim())
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};

const clampScore = (score: unknown): number | null => {
    if (score === undefined || score === null || score === "") return null;

    const numericScore = Number(score);

    if (Number.isNaN(numericScore)) return null;

    return Math.max(0, Math.min(10, numericScore));
};

const average = (values: number[]) => {
    if (values.length === 0) return 0;

    const sum = values.reduce((acc, value) => acc + value, 0);
    return Number((sum / values.length).toFixed(1));
};

const groupCount = (items: string[]) => {
    return items.reduce((acc, item) => {
        acc[item] = (acc[item] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
};

const getTopItems = (items: string[], limit = 5) => {
    return Object.entries(groupCount(items))
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
};

const updateInterviewReadiness = async (userId: string) => {
    const interviews = await prisma.interviewSession.findMany({
        where: {
            userId,
        },
    });

    const scoreValues = interviews
        .map((interview) => {
            const scores = [
                interview.confidenceScore,
                interview.communicationScore,
                interview.technicalScore,
            ].filter((score): score is number => typeof score === "number");

            if (scores.length === 0) return null;

            return average(scores);
        })
        .filter((score): score is number => typeof score === "number");

    const interviewScore =
        scoreValues.length === 0 ? 0 : Math.round(average(scoreValues) * 10);

    const existingScore = await prisma.readinessScore.findUnique({
        where: {
            userId,
        },
    });

    const dsaScore = existingScore?.dsaScore ?? 0;
    const resumeScore = existingScore?.resumeScore ?? 0;
    const aptitudeScore = existingScore?.aptitudeScore ?? 0;

    const overallScore = Math.round(
        (dsaScore + resumeScore + interviewScore + aptitudeScore) / 4
    );

    await prisma.readinessScore.upsert({
        where: {
            userId,
        },
        update: {
            interviewScore,
            overallScore,
        },
        create: {
            userId,
            dsaScore: 0,
            resumeScore: 0,
            interviewScore,
            aptitudeScore: 0,
            overallScore,
            readyFor: [],
            improveFor: [],
        },
    });
};

export const createInterview = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const {
            company,
            role,
            roundType,
            date,
            result,
            sourceType,
            notes,
            questionsAsked,
            topics,
            conceptsMissed,
            whatWentWell,
            whatWentWrong,
            feedback,
            confidenceScore,
            communicationScore,
            technicalScore,
            overallScore,
            nextActions,
        } = req.body;

        if (!company || !role || !date) {
            return res.status(400).json({
                message: "Company, role, and date are required",
            });
        }

        const normalizedRoundType = normalizeEnum(roundType, "TECHNICAL");
        const normalizedResult = normalizeEnum(result, "PENDING");
        const normalizedSourceType = normalizeEnum(sourceType, "MANUAL");

        const validRoundTypes = [
            "HR",
            "TECHNICAL",
            "MANAGERIAL",
            "APTITUDE",
            "GROUP_DISCUSSION",
            "SYSTEM_DESIGN",
            "CODING",
            "OTHER",
        ];

        const validResults = [
            "PENDING",
            "SELECTED",
            "REJECTED",
            "ON_HOLD",
            "NO_RESPONSE",
        ];

        const validSourceTypes = ["MANUAL", "AUDIO", "VIDEO"];

        if (!validRoundTypes.includes(normalizedRoundType)) {
            return res.status(400).json({
                message: "Invalid round type",
            });
        }

        if (!validResults.includes(normalizedResult)) {
            return res.status(400).json({
                message: "Invalid interview result",
            });
        }

        if (!validSourceTypes.includes(normalizedSourceType)) {
            return res.status(400).json({
                message: "Invalid source type",
            });
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                message: "Invalid interview date",
            });
        }

        const interview = await prisma.interviewSession.create({
            data: {
                userId,
                company: String(company).trim(),
                role: String(role).trim(),
                roundType: normalizedRoundType as any,
                date: parsedDate,
                result: normalizedResult as any,
                sourceType: normalizedSourceType as any,

                notes: notes || null,
                questionsAsked: toStringArray(questionsAsked),
                topics: toStringArray(topics),
                conceptsMissed: toStringArray(conceptsMissed),

                whatWentWell: whatWentWell || null,
                whatWentWrong: whatWentWrong || null,
                feedback: feedback || null,

                confidenceScore: clampScore(confidenceScore),
                communicationScore: clampScore(communicationScore),
                technicalScore: clampScore(technicalScore),
                overallScore: clampScore(overallScore),

                nextActions: toStringArray(nextActions),
                analysisStatus: "DRAFT",
            },
        });

        await updateInterviewReadiness(userId);

        return res.status(201).json({
            message: "Interview replay created successfully",
            interview,
        });
    } catch (error) {
        console.error("createInterview error:", error);

        return res.status(500).json({
            message: "Failed to create interview replay",
        });
    }
};

export const getInterviews = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { company, roundType, result, search } = req.query;

        const interviews = await prisma.interviewSession.findMany({
            where: {
                userId,
                ...(company && {
                    company: {
                        contains: company as string,
                        mode: "insensitive",
                    },
                }),
                ...(roundType && {
                    roundType: normalizeEnum(roundType, "TECHNICAL") as any,
                }),
                ...(result && {
                    result: normalizeEnum(result, "PENDING") as any,
                }),
                ...(search && {
                    OR: [
                        {
                            company: {
                                contains: search as string,
                                mode: "insensitive",
                            },
                        },
                        {
                            role: {
                                contains: search as string,
                                mode: "insensitive",
                            },
                        },
                    ],
                }),
            },
            orderBy: {
                date: "desc",
            },
        });

        return res.status(200).json({
            interviews,
        });
    } catch (error) {
        console.error("getInterviews error:", error);

        return res.status(500).json({
            message: "Failed to fetch interviews",
        });
    }
};

export const getInterviewById = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const idParam = req.params.id;
        const id = Array.isArray(idParam) ? idParam[0] : idParam;

        if (!id) {
            return res.status(400).json({
                message: "Interview id is required",
            });
        }

        const interview = await prisma.interviewSession.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!interview) {
            return res.status(404).json({
                message: "Interview replay not found",
            });
        }

        return res.status(200).json({
            interview,
        });
    } catch (error) {
        console.error("getInterviewById error:", error);

        return res.status(500).json({
            message: "Failed to fetch interview replay",
        });
    }
};

export const updateInterview = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const idParam = req.params.id;
        const id = Array.isArray(idParam) ? idParam[0] : idParam;

        if (!id) {
            return res.status(400).json({
                message: "Interview id is required",
            });
        }

        const existingInterview = await prisma.interviewSession.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!existingInterview) {
            return res.status(404).json({
                message: "Interview replay not found",
            });
        }

        const {
            company,
            role,
            roundType,
            date,
            result,
            notes,
            questionsAsked,
            topics,
            conceptsMissed,
            whatWentWell,
            whatWentWrong,
            feedback,
            confidenceScore,
            communicationScore,
            technicalScore,
            overallScore,
            nextActions,
        } = req.body;

        const updatedInterview = await prisma.interviewSession.update({
            where: {
                id,
            },
            data: {
                ...(company !== undefined && { company: String(company).trim() }),
                ...(role !== undefined && { role: String(role).trim() }),
                ...(roundType !== undefined && {
                    roundType: normalizeEnum(roundType, "TECHNICAL") as any,
                }),
                ...(date !== undefined && { date: new Date(date) }),
                ...(result !== undefined && {
                    result: normalizeEnum(result, "PENDING") as any,
                }),
                ...(notes !== undefined && { notes }),
                ...(questionsAsked !== undefined && {
                    questionsAsked: toStringArray(questionsAsked),
                }),
                ...(topics !== undefined && { topics: toStringArray(topics) }),
                ...(conceptsMissed !== undefined && {
                    conceptsMissed: toStringArray(conceptsMissed),
                }),
                ...(whatWentWell !== undefined && { whatWentWell }),
                ...(whatWentWrong !== undefined && { whatWentWrong }),
                ...(feedback !== undefined && { feedback }),
                ...(confidenceScore !== undefined && {
                    confidenceScore: clampScore(confidenceScore),
                }),
                ...(communicationScore !== undefined && {
                    communicationScore: clampScore(communicationScore),
                }),
                ...(technicalScore !== undefined && {
                    technicalScore: clampScore(technicalScore),
                }),
                ...(overallScore !== undefined && {
                    overallScore: clampScore(overallScore),
                }),
                ...(nextActions !== undefined && {
                    nextActions: toStringArray(nextActions),
                }),
            },
        });

        await updateInterviewReadiness(userId);

        return res.status(200).json({
            message: "Interview replay updated successfully",
            interview: updatedInterview,
        });
    } catch (error) {
        console.error("updateInterview error:", error);

        return res.status(500).json({
            message: "Failed to update interview replay",
        });
    }
};

export const deleteInterview = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const idParam = req.params.id;
        const id = Array.isArray(idParam) ? idParam[0] : idParam;

        if (!id) {
            return res.status(400).json({
                message: "Interview id is required",
            });
        }

        const existingInterview = await prisma.interviewSession.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!existingInterview) {
            return res.status(404).json({
                message: "Interview replay not found",
            });
        }

        await prisma.interviewSession.delete({
            where: {
                id,
            },
        });

        await updateInterviewReadiness(userId);

        return res.status(200).json({
            message: "Interview replay deleted successfully",
        });
    } catch (error) {
        console.error("deleteInterview error:", error);

        return res.status(500).json({
            message: "Failed to delete interview replay",
        });
    }
};

export const getInterviewStats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const interviews = await prisma.interviewSession.findMany({
            where: {
                userId,
            },
            orderBy: {
                date: "desc",
            },
        });

        const totalInterviews = interviews.length;

        const confidenceScores = interviews
            .map((interview) => interview.confidenceScore)
            .filter((score): score is number => typeof score === "number");

        const communicationScores = interviews
            .map((interview) => interview.communicationScore)
            .filter((score): score is number => typeof score === "number");

        const technicalScores = interviews
            .map((interview) => interview.technicalScore)
            .filter((score): score is number => typeof score === "number");

        const allTopics = interviews.flatMap((interview) => interview.topics);
        const allMissedConcepts = interviews.flatMap(
            (interview) => interview.conceptsMissed
        );

        const companyBreakdown = Object.entries(
            interviews.reduce((acc, interview) => {
                acc[interview.company] = (acc[interview.company] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        ).map(([company, count]) => ({ company, count }));

        const resultBreakdown = Object.entries(
            interviews.reduce((acc, interview) => {
                acc[interview.result] = (acc[interview.result] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        ).map(([result, count]) => ({ result, count }));

        const roundBreakdown = Object.entries(
            interviews.reduce((acc, interview) => {
                acc[interview.roundType] = (acc[interview.roundType] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        ).map(([roundType, count]) => ({ roundType, count }));

        const recentInterviews = interviews.slice(0, 5);

        const nextActions = interviews
            .flatMap((interview) => interview.nextActions)
            .filter(Boolean)
            .slice(0, 8);

        return res.status(200).json({
            totalInterviews,
            averageConfidenceScore: average(confidenceScores),
            averageCommunicationScore: average(communicationScores),
            averageTechnicalScore: average(technicalScores),
            mostRepeatedTopics: getTopItems(allTopics, 5),
            mostMissedConcepts: getTopItems(allMissedConcepts, 5),
            companyBreakdown,
            resultBreakdown,
            roundBreakdown,
            recentInterviews,
            nextActions,
        });
    } catch (error) {
        console.error("getInterviewStats error:", error);

        return res.status(500).json({
            message: "Failed to fetch interview stats",
        });
    }
};