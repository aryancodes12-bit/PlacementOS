import { Response } from "express";
import { prisma } from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { uploadToCloudinary } from "../services/cloudinary.service";
import {
    analyzeInterviewReplay,
    transcribeInterviewAudio,
} from "../services/openaiInterview.service";
import {
    publishInterviewAnalysisReadyNotification,
} from "../services/interviewAnalysisNotification.service";
import { updateReadiness } from "../services/readiness.service";
import {
    InterviewChunkValidationError,
    transcribeInterviewAudioChunks,
} from "../services/interviewChunkTranscription.service";
const normalizeEnum = (value: unknown, fallback: string) => {
    if (!value) return fallback;
    return String(value).trim().toUpperCase().replace(/\s+/g, "_");
};

const toStringArray = (value: unknown): string[] => {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(/[\n,]/)
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
const clampReadinessScore = (value: number) => {
    return Math.max(0, Math.min(100, Math.round(value)));
};

const recalculateInterviewReadiness = async (userId: string) => {
    const interviews = await prisma.interviewSession.findMany({
        where: {
            userId,
        },
        select: {
            overallScore: true,
            confidenceScore: true,
            communicationScore: true,
            technicalScore: true,
        },
    });

    if (interviews.length === 0) {
        await prisma.readinessScore.upsert({
            where: {
                userId,
            },
            update: {
                interviewScore: 0,
            },
            create: {
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

        await updateReadiness(userId);
        return;
    }

    const scores = interviews.map((interview) => {
        if (typeof interview.overallScore === "number") {
            return interview.overallScore * 10;
        }

        const availableScores = [
            interview.confidenceScore,
            interview.communicationScore,
            interview.technicalScore,
        ].filter((score): score is number => typeof score === "number");

        if (availableScores.length === 0) return 0;

        const average =
            availableScores.reduce((sum, score) => sum + score, 0) /
            availableScores.length;

        return average * 10;
    });

    const interviewScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;

    await prisma.readinessScore.upsert({
        where: {
            userId,
        },
        update: {
            interviewScore: clampReadinessScore(interviewScore),
        },
        create: {
            userId,
            dsaScore: 0,
            resumeScore: 0,
            interviewScore: clampReadinessScore(interviewScore),
            aptitudeScore: 0,
            overallScore: 0,
            readyFor: [],
            improveFor: [],
        },
    });

    await updateReadiness(userId);
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

const validQuestionStatuses = ["SOLVED", "PARTIAL", "FAILED", "SKIPPED"];

type QuestionReplayCreateInput = {
    question: string;
    userAnswer: string | null;
    missedPoints: string[];
    interviewerFeedback: string | null;
    confidenceScore: number | null;
    status: any;
};

const toQuestionReplayArray = (value: unknown): QuestionReplayCreateInput[] => {
    if (!value) return [];

    let parsedValue = value;

    if (typeof value === "string") {
        try {
            parsedValue = JSON.parse(value);
        } catch {
            return [];
        }
    }

    if (!Array.isArray(parsedValue)) return [];

    return parsedValue
        .map((item: any): QuestionReplayCreateInput | null => {
            const question = String(item.question || "").trim();

            if (!question) return null;

            const normalizedStatus = normalizeEnum(item.status, "PARTIAL");

            return {
                question,
                userAnswer: item.userAnswer ? String(item.userAnswer).trim() : null,
                missedPoints: toStringArray(item.missedPoints),
                interviewerFeedback: item.interviewerFeedback
                    ? String(item.interviewerFeedback).trim()
                    : null,
                confidenceScore: clampScore(item.confidenceScore),
                status: validQuestionStatuses.includes(normalizedStatus)
                    ? normalizedStatus
                    : "PARTIAL",
            };
        })
        .filter((item): item is QuestionReplayCreateInput => item !== null);
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
            questionReplays,
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

        const parsedQuestionReplays = toQuestionReplayArray(questionReplays);

        const finalQuestionsAsked =
            parsedQuestionReplays.length > 0
                ? parsedQuestionReplays.map((item) => item.question)
                : toStringArray(questionsAsked);

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
                questionsAsked: finalQuestionsAsked,
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

                questionReplays:
                    parsedQuestionReplays.length > 0
                        ? {
                            create: parsedQuestionReplays,
                        }
                        : undefined,
            },
            include: {
                questionReplays: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        await recalculateInterviewReadiness(userId);

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
            include: {
                questionReplays: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
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
            include: {
                questionReplays: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
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
            questionReplays,
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

        const parsedQuestionReplays = toQuestionReplayArray(questionReplays);

        const finalQuestionsAsked =
            parsedQuestionReplays.length > 0
                ? parsedQuestionReplays.map((item) => item.question)
                : questionsAsked !== undefined
                    ? toStringArray(questionsAsked)
                    : undefined;

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
                ...(finalQuestionsAsked !== undefined && {
                    questionsAsked: finalQuestionsAsked,
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
                ...(questionReplays !== undefined && {
                    questionReplays: {
                        deleteMany: {},
                        create: parsedQuestionReplays,
                    },
                }),
            },
            include: {
                questionReplays: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });




        await recalculateInterviewReadiness(
            userId
        );

        return res.status(200).json({
            message: "Interview replay updated successfully",
            interview: updatedInterview,
        });
    } catch (error) {
        console.error("updateInterview error:", error);
        return res.status(500).json({ message: "Failed to update interview replay" });
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

        await recalculateInterviewReadiness(userId);

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

export const analyzeInterviewWithAI = async (
    req: AuthRequest,
    res: Response
) => {
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
            include: {
                questionReplays: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        if (!interview) {
            return res.status(404).json({
                message: "Interview replay not found",
            });
        }

        const previousInterviews = await prisma.interviewSession.findMany({
            where: {
                userId,
                NOT: {
                    id,
                },
            },
            select: {
                conceptsMissed: true,
                topics: true,
            },
            take: 10,
            orderBy: {
                date: "desc",
            },
        });

        const previousWeakTopics = previousInterviews.flatMap((item) => [
            ...item.conceptsMissed,
            ...item.topics,
        ]);

        const analysis = await analyzeInterviewReplay({
            company: interview.company,
            role: interview.role,
            roundType: interview.roundType,
            result: interview.result,
            questionsAsked: interview.questionsAsked,
            topics: interview.topics,
            conceptsMissed: interview.conceptsMissed,
            whatWentWell: interview.whatWentWell,
            whatWentWrong: interview.whatWentWrong,
            feedback: interview.feedback,
            confidenceScore: interview.confidenceScore,
            communicationScore: interview.communicationScore,
            technicalScore: interview.technicalScore,
            previousWeakTopics,
            questionReplays: interview.questionReplays.map((item) => ({
                question: item.question,
                userAnswer: item.userAnswer,
                missedPoints: item.missedPoints,
                interviewerFeedback: item.interviewerFeedback,
                confidenceScore: item.confidenceScore,
                status: item.status,
            })),
        });

        const mergedConceptsMissed = Array.from(
            new Set([...interview.conceptsMissed, ...analysis.missedConcepts])
        );
        const aiQuestionReplayCreateData =
            analysis.questionBreakdown?.length > 0
                ? analysis.questionBreakdown
                    .filter((item) => item.question)
                    .map((item) => ({
                        question: item.question,
                        userAnswer: item.candidateAnswer || null,
                        missedPoints:
                            item.missedPoints?.length > 0
                                ? item.missedPoints
                                : item.likelyGap
                                    ? [item.likelyGap]
                                    : [],
                        interviewerFeedback: item.practiceTask || null,
                        confidenceScore: analysis.confidenceScore,
                        status: "PARTIAL" as any,
                    }))
                : [];

        const shouldRefreshAiQuestionReplays =
            interview.sourceType === "AUDIO" || interview.sourceType === "VIDEO";
        const updatedInterview = await prisma.interviewSession.update({
            where: {
                id,
            },
            data: {
                ...(shouldRefreshAiQuestionReplays &&
                    aiQuestionReplayCreateData.length > 0 && {
                    questionReplays: {
                        deleteMany: {},
                        create: aiQuestionReplayCreateData,
                    },
                }),
                aiSummary: analysis as any,
                conceptsMissed: mergedConceptsMissed,
                nextActions: analysis.nextActions,
                actionPlan: analysis.nextActions.join("\n"),

                confidenceScore: interview.confidenceScore ?? analysis.confidenceScore,
                communicationScore:
                    interview.communicationScore ?? analysis.communicationScore,
                technicalScore: interview.technicalScore ?? analysis.technicalScore,

                overallScore: Math.round(analysis.estimatedReadinessScore / 10),
                analysisStatus: "ANALYZED",
            },
            include: {
                questionReplays: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });


        await recalculateInterviewReadiness(
            userId
        );

        await publishInterviewAnalysisReadyNotification(
            {
                userId,

                interviewId:
                    updatedInterview.id,

                company:
                    updatedInterview.company,

                role:
                    updatedInterview.role,

                sourceType:
                    updatedInterview.sourceType,

                analysisCompletedAt:
                    new Date(),
            }
        );

        return res.status(200).json({
            message:
                "Interview analyzed successfully",

            analysis,

            interview:
                updatedInterview,
        });


    } catch (error: any) {
        console.error("analyzeInterviewWithAI error:", error);

        return res.status(500).json({
            message: error.message || "Failed to analyze interview replay with Groq",
        });
    }
};
export const createAudioInterview = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId = req.user!.id;

        const {
            company,
            role,
            roundType,
            date,
            result,
            topics,
            conceptsMissed,
            notes,
        } = req.body;

        if (!company || !role || !date) {
            return res.status(400).json({
                message: "Company, role, and date are required",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Audio file is required",
            });
        }

        const normalizedRoundType = normalizeEnum(roundType, "TECHNICAL");
        const normalizedResult = normalizeEnum(result, "PENDING");

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                message: "Invalid interview date",
            });
        }

        const uploadedAudio = await uploadToCloudinary(
            req.file.buffer,
            "placementos/interviews/audio",
            "video"
        );

        const transcript = await transcribeInterviewAudio(
            req.file.buffer,
            req.file.originalname
        );

        const analysis = await analyzeInterviewReplay({
            company: String(company).trim(),
            role: String(role).trim(),
            roundType: normalizedRoundType,
            result: normalizedResult,
            transcript,
            questionsAsked: [],
            topics: toStringArray(topics),
            conceptsMissed: toStringArray(conceptsMissed),
            whatWentWell: null,
            whatWentWrong: null,
            feedback: notes || null,
            confidenceScore: null,
            communicationScore: null,
            technicalScore: null,
            previousWeakTopics: [],
            questionReplays: [],
        });

        const questionsAsked =
            analysis.questionBreakdown
                ?.map((item) => item.question)
                .filter(Boolean) ?? [];

        const finalTopics = Array.from(
            new Set([...toStringArray(topics), ...analysis.repeatedRiskTopics])
        );

        const finalMissedConcepts = Array.from(
            new Set([...toStringArray(conceptsMissed), ...analysis.missedConcepts])
        );

        const interview = await prisma.interviewSession.create({
            data: {
                userId,
                company: String(company).trim(),
                role: String(role).trim(),
                roundType: normalizedRoundType as any,
                date: parsedDate,
                result: normalizedResult as any,

                sourceType: "AUDIO",
                audioUrl: uploadedAudio.url,
                transcript,
                notes: notes || null,

                questionsAsked,
                topics: finalTopics,
                conceptsMissed: finalMissedConcepts,

                questionReplays:
                    analysis.questionBreakdown?.length > 0
                        ? {
                            create: analysis.questionBreakdown
                                .filter((item) => item.question)
                                .map((item) => ({
                                    question: item.question,
                                    userAnswer: item.candidateAnswer || null,
                                    missedPoints:
                                        item.missedPoints?.length > 0
                                            ? item.missedPoints
                                            : item.likelyGap
                                                ? [item.likelyGap]
                                                : [],
                                    interviewerFeedback: item.practiceTask || null,
                                    confidenceScore: analysis.confidenceScore,
                                    status: "PARTIAL" as any,
                                })),
                        }
                        : undefined,

                confidenceScore: analysis.confidenceScore,
                communicationScore: analysis.communicationScore,
                technicalScore: analysis.technicalScore,
                overallScore: Math.round(analysis.estimatedReadinessScore / 10),

                aiSummary: analysis as any,
                nextActions: analysis.nextActions,
                actionPlan: analysis.nextActions.join("\n"),
                analysisStatus: "ANALYZED",
            },
            include: {
                questionReplays: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        await recalculateInterviewReadiness(
            userId
        );

        await publishInterviewAnalysisReadyNotification(
            {
                userId,

                interviewId:
                    interview.id,

                company:
                    interview.company,

                role:
                    interview.role,

                sourceType:
                    interview.sourceType,

                analysisCompletedAt:
                    new Date(),
            }
        );

        return res.status(201).json({
            message:
                "Audio interview uploaded, transcribed, and analyzed successfully",

            transcript,
            analysis,
            interview,
        });
    } catch (error: any) {
        console.error("createAudioInterview error:", error);

        return res.status(500).json({
            message:
                error.message ||
                "Failed to upload, transcribe, and analyze audio interview",
        });
    }
};
export const createVideoInterview = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId =
            req.user!.id;

        const {
            company,
            role,
            roundType,
            date,
            result,
            topics,
            conceptsMissed,
            notes,
        } =
            req.body;

        if (
            !company ||
            !role ||
            !date
        ) {
            return res
                .status(400)
                .json({
                    message:
                        "Company, role, and date are required",
                });
        }

        if (!req.file) {
            return res
                .status(400)
                .json({
                    message:
                        "Extracted video audio file is required",
                });
        }

        const isAudioMimeType =
            req.file.mimetype
                .toLowerCase()
                .startsWith(
                    "audio/"
                );

        const hasAudioExtension =
            /\.(mp3|wav|webm|ogg|m4a)$/i.test(
                req.file.originalname
            );

        if (
            !isAudioMimeType &&
            !hasAudioExtension
        ) {
            return res
                .status(400)
                .json({
                    message:
                        "The video endpoint only accepts browser-extracted audio",
                });
        }

        const normalizedRoundType =
            normalizeEnum(
                roundType,
                "TECHNICAL"
            );

        const normalizedResult =
            normalizeEnum(
                result,
                "PENDING"
            );

        const parsedDate =
            new Date(
                date
            );

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return res
                .status(400)
                .json({
                    message:
                        "Invalid interview date",
                });
        }

        /*
         * req.file contains only the locally extracted
         * compressed audio. The original video is never
         * uploaded to this server or Cloudinary.
         */
        const transcript =
            await transcribeInterviewAudio(
                req.file.buffer,
                req.file.originalname
            );

        const analysis =
            await analyzeInterviewReplay({
                company:
                    String(
                        company
                    ).trim(),

                role:
                    String(
                        role
                    ).trim(),

                roundType:
                    normalizedRoundType,

                result:
                    normalizedResult,

                transcript,

                questionsAsked:
                    [],

                topics:
                    toStringArray(
                        topics
                    ),

                conceptsMissed:
                    toStringArray(
                        conceptsMissed
                    ),

                whatWentWell:
                    null,

                whatWentWrong:
                    null,

                feedback:
                    notes ||
                    null,

                confidenceScore:
                    null,

                communicationScore:
                    null,

                technicalScore:
                    null,

                previousWeakTopics:
                    [],

                questionReplays:
                    [],
            });

        const questionsAsked =
            analysis
                .questionBreakdown
                ?.map(
                    (item) =>
                        item.question
                )
                .filter(
                    Boolean
                ) ??
            [];

        const finalTopics =
            Array.from(
                new Set([
                    ...toStringArray(
                        topics
                    ),

                    ...analysis
                        .repeatedRiskTopics,
                ])
            );

        const finalMissedConcepts =
            Array.from(
                new Set([
                    ...toStringArray(
                        conceptsMissed
                    ),

                    ...analysis
                        .missedConcepts,
                ])
            );

        const interview =
            await prisma
                .interviewSession
                .create({
                    data: {
                        userId,

                        company:
                            String(
                                company
                            ).trim(),

                        role:
                            String(
                                role
                            ).trim(),

                        roundType:
                            normalizedRoundType as any,

                        date:
                            parsedDate,

                        result:
                            normalizedResult as any,

                        /*
                         * VIDEO indicates how the interview
                         * was captured. videoUrl intentionally
                         * remains null because the original
                         * video stays on the user's device.
                         */
                        sourceType:
                            "VIDEO",

                        transcript,

                        notes:
                            notes ||
                            null,

                        questionsAsked,

                        topics:
                            finalTopics,

                        conceptsMissed:
                            finalMissedConcepts,

                        questionReplays:
                            analysis
                                .questionBreakdown
                                ?.length >
                                0
                                ? {
                                    create:
                                        analysis
                                            .questionBreakdown
                                            .filter(
                                                (
                                                    item
                                                ) =>
                                                    item.question
                                            )
                                            .map(
                                                (
                                                    item
                                                ) => ({
                                                    question:
                                                        item.question,

                                                    userAnswer:
                                                        item.candidateAnswer ||
                                                        null,

                                                    missedPoints:
                                                        item
                                                            .missedPoints
                                                            ?.length >
                                                            0
                                                            ? item.missedPoints
                                                            : item.likelyGap
                                                                ? [
                                                                    item.likelyGap,
                                                                ]
                                                                : [],

                                                    interviewerFeedback:
                                                        item.practiceTask ||
                                                        null,

                                                    confidenceScore:
                                                        analysis.confidenceScore,

                                                    status:
                                                        "PARTIAL" as any,
                                                })
                                            ),
                                }
                                : undefined,

                        confidenceScore:
                            analysis.confidenceScore,

                        communicationScore:
                            analysis.communicationScore,

                        technicalScore:
                            analysis.technicalScore,

                        overallScore:
                            Math.round(
                                analysis.estimatedReadinessScore /
                                10
                            ),

                        aiSummary:
                            analysis as any,

                        nextActions:
                            analysis.nextActions,

                        actionPlan:
                            analysis.nextActions.join(
                                "\n"
                            ),

                        analysisStatus:
                            "ANALYZED",
                    },

                    include: {
                        questionReplays: {
                            orderBy: {
                                createdAt:
                                    "asc",
                            },
                        },
                    },
                });

        await recalculateInterviewReadiness(
            userId
        );

        await publishInterviewAnalysisReadyNotification({
            userId,

            interviewId:
                interview.id,

            company:
                interview.company,

            role:
                interview.role,

            sourceType:
                interview.sourceType,

            analysisCompletedAt:
                new Date(),
        });

        return res
            .status(201)
            .json({
                message:
                    "Video interview audio transcribed and analyzed successfully",

                transcript,

                analysis,

                interview,
            });
    } catch (
    error: any
    ) {
        console.error(
            "createVideoInterview error:",
            error
        );

        return res
            .status(500)
            .json({
                message:
                    error.message ||
                    "Failed to transcribe and analyze video interview",
            });
    }
}; export const createChunkedInterview = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId =
            req.user!.id;

        const {
            company,
            role,
            roundType,
            date,
            result,
            topics,
            conceptsMissed,
            notes,
            sourceType,
        } =
            req.body;

        if (
            !company ||
            !role ||
            !date
        ) {
            return res
                .status(400)
                .json({
                    message:
                        "Company, role, and date are required",
                });
        }

        const normalizedSourceType =
            normalizeEnum(
                sourceType,
                "AUDIO"
            );

        if (
            normalizedSourceType !==
            "AUDIO" &&
            normalizedSourceType !==
            "VIDEO"
        ) {
            return res
                .status(400)
                .json({
                    message:
                        "Chunked interview source type must be AUDIO or VIDEO",
                });
        }

        const files =
            Array.isArray(
                req.files
            )
                ? req.files
                : [];

        if (
            files.length ===
            0
        ) {
            return res
                .status(400)
                .json({
                    message:
                        "Interview audio chunks are required",
                });
        }

        const normalizedRoundType =
            normalizeEnum(
                roundType,
                "TECHNICAL"
            );

        const normalizedResult =
            normalizeEnum(
                result,
                "PENDING"
            );

        const parsedDate =
            new Date(
                date
            );

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return res
                .status(400)
                .json({
                    message:
                        "Invalid interview date",
                });
        }

        const {
            transcript,
            chunkCount,
        } =
            await transcribeInterviewAudioChunks(
                files
            );

        const analysis =
            await analyzeInterviewReplay({
                company:
                    String(
                        company
                    ).trim(),

                role:
                    String(
                        role
                    ).trim(),

                roundType:
                    normalizedRoundType,

                result:
                    normalizedResult,

                transcript,

                questionsAsked:
                    [],

                topics:
                    toStringArray(
                        topics
                    ),

                conceptsMissed:
                    toStringArray(
                        conceptsMissed
                    ),

                whatWentWell:
                    null,

                whatWentWrong:
                    null,

                feedback:
                    notes ||
                    null,

                confidenceScore:
                    null,

                communicationScore:
                    null,

                technicalScore:
                    null,

                previousWeakTopics:
                    [],

                questionReplays:
                    [],
            });

        const questionsAsked =
            analysis
                .questionBreakdown
                ?.map(
                    (item) =>
                        item.question
                )
                .filter(
                    Boolean
                ) ??
            [];

        const finalTopics =
            Array.from(
                new Set([
                    ...toStringArray(
                        topics
                    ),

                    ...analysis
                        .repeatedRiskTopics,
                ])
            );

        const finalMissedConcepts =
            Array.from(
                new Set([
                    ...toStringArray(
                        conceptsMissed
                    ),

                    ...analysis
                        .missedConcepts,
                ])
            );

        const interview =
            await prisma
                .interviewSession
                .create({
                    data: {
                        userId,

                        company:
                            String(
                                company
                            ).trim(),

                        role:
                            String(
                                role
                            ).trim(),

                        roundType:
                            normalizedRoundType as any,

                        date:
                            parsedDate,

                        result:
                            normalizedResult as any,

                        sourceType:
                            normalizedSourceType as any,

                        /*
                         * Chunked media is not stored remotely.
                         * AUDIO and VIDEO URLs intentionally
                         * remain null.
                         */
                        transcript,

                        notes:
                            notes ||
                            null,

                        questionsAsked,

                        topics:
                            finalTopics,

                        conceptsMissed:
                            finalMissedConcepts,

                        questionReplays:
                            analysis
                                .questionBreakdown
                                ?.length >
                                0
                                ? {
                                    create:
                                        analysis
                                            .questionBreakdown
                                            .filter(
                                                (
                                                    item
                                                ) =>
                                                    item.question
                                            )
                                            .map(
                                                (
                                                    item
                                                ) => ({
                                                    question:
                                                        item.question,

                                                    userAnswer:
                                                        item.candidateAnswer ||
                                                        null,

                                                    missedPoints:
                                                        item
                                                            .missedPoints
                                                            ?.length >
                                                            0
                                                            ? item.missedPoints
                                                            : item.likelyGap
                                                                ? [
                                                                    item.likelyGap,
                                                                ]
                                                                : [],

                                                    interviewerFeedback:
                                                        item.practiceTask ||
                                                        null,

                                                    confidenceScore:
                                                        analysis.confidenceScore,

                                                    status:
                                                        "PARTIAL" as any,
                                                })
                                            ),
                                }
                                : undefined,

                        confidenceScore:
                            analysis.confidenceScore,

                        communicationScore:
                            analysis.communicationScore,

                        technicalScore:
                            analysis.technicalScore,

                        overallScore:
                            Math.round(
                                analysis.estimatedReadinessScore /
                                10
                            ),

                        aiSummary:
                            analysis as any,

                        nextActions:
                            analysis.nextActions,

                        actionPlan:
                            analysis.nextActions.join(
                                "\n"
                            ),

                        analysisStatus:
                            "ANALYZED",
                    },

                    include: {
                        questionReplays: {
                            orderBy: {
                                createdAt:
                                    "asc",
                            },
                        },
                    },
                });

        await recalculateInterviewReadiness(
            userId
        );

        await publishInterviewAnalysisReadyNotification({
            userId,

            interviewId:
                interview.id,

            company:
                interview.company,

            role:
                interview.role,

            sourceType:
                interview.sourceType,

            analysisCompletedAt:
                new Date(),
        });

        return res
            .status(201)
            .json({
                message:
                    `${chunkCount} audio chunks transcribed, combined, and analyzed successfully`,

                chunkCount,

                transcript,

                analysis,

                interview,
            });
    } catch (
    error: unknown
    ) {
        if (
            error instanceof
            InterviewChunkValidationError
        ) {
            return res
                .status(400)
                .json({
                    message:
                        error.message,
                });
        }

        console.error(
            "createChunkedInterview error:",
            error
        );

        const message =
            error instanceof Error
                ? error.message
                : "Failed to process chunked interview audio";

        return res
            .status(500)
            .json({
                message,
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
            include: {
                questionReplays: true,
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

        const allMissedConcepts = interviews.flatMap((interview) => [
            ...interview.conceptsMissed,
            ...interview.questionReplays.flatMap((question) => question.missedPoints),
        ]);

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

