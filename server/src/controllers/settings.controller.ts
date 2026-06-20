import { Response } from "express";

import { prisma } from "../prisma/client";
import type { AuthRequest } from "../middlewares/auth.middleware";

const VALID_FEEDBACK_TYPES = new Set([
    "BUG_REPORT",
    "FEATURE_REQUEST",
    "SUGGESTION",
    "CONTACT_OWNER",
    "OTHER",
]);

const normalizeRequiredText = (
    value: unknown,
    fieldName: string,
    minLength: number,
    maxLength: number
) => {
    if (typeof value !== "string") {
        throw new Error(`${fieldName} is required.`);
    }

    const normalized = value.trim();

    if (normalized.length < minLength) {
        throw new Error(
            `${fieldName} must contain at least ${minLength} characters.`
        );
    }

    if (normalized.length > maxLength) {
        throw new Error(
            `${fieldName} must contain at most ${maxLength} characters.`
        );
    }

    return normalized;
};

const normalizeOptionalText = (
    value: unknown,
    maxLength: number
): string | null => {
    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.trim();

    if (!normalized) {
        return null;
    }

    return normalized.slice(0, maxLength);
};

export const getSettingsOverview = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const userId = req.user.id;

        const [
            user,
            dsaProblems,
            revisions,
            resumes,
            interviews,
            dailyPlans,
            readinessHistory,
            payments,
            feedbackCount,
        ] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    plan: true,
                    avatarUrl: true,
                    createdAt: true,
                    updatedAt: true,
                    profile: {
                        select: {
                            skills: true,
                            targetCompanies: true,
                            bio: true,
                            linkedinUrl: true,
                            githubUrl: true,
                            college: true,
                            graduationYear: true,
                        },
                    },
                },
            }),

            prisma.dSAProblem.count({
                where: { userId },
            }),

            prisma.dSARevision.count({
                where: {
                    problem: {
                        userId,
                    },
                },
            }),

            prisma.resume.count({
                where: { userId },
            }),

            prisma.interviewSession.count({
                where: { userId },
            }),

            prisma.dailyPlan.count({
                where: { userId },
            }),

            prisma.readinessHistory.count({
                where: { userId },
            }),

            prisma.payment.count({
                where: { userId },
            }),

            prisma.feedback.count({
                where: { userId },
            }),
        ]);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Account not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                account: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    plan: user.plan,
                    avatarUrl: user.avatarUrl,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },

                dataSummary: {
                    dsaProblems,
                    revisions,
                    resumes,
                    interviews,
                    dailyPlans,
                    readinessHistory,
                    payments,
                    feedback: feedbackCount,
                },

                privacy: {
                    databaseDeletionSupported: true,
                    cloudMediaCleanupSupported: false,
                    externalPaymentRecordsControlledByProvider: true,
                },

                support: {
                    email: process.env.SUPPORT_EMAIL || "",
                },
            },
        });
    } catch (error) {
        console.error("Get settings overview error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load account settings.",
        });
    }
};

export const submitFeedback = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const rawType = String(req.body?.type || "")
            .trim()
            .toUpperCase();

        if (!VALID_FEEDBACK_TYPES.has(rawType)) {
            return res.status(400).json({
                success: false,
                message: "Select a valid feedback type.",
            });
        }

        const subject = normalizeRequiredText(
            req.body?.subject,
            "Subject",
            4,
            120
        );

        const message = normalizeRequiredText(
            req.body?.message,
            "Message",
            10,
            2000
        );

        let rating: number | null = null;

        if (
            req.body?.rating !== undefined &&
            req.body?.rating !== null &&
            req.body?.rating !== ""
        ) {
            rating = Number(req.body.rating);

            if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: "Rating must be between 1 and 5.",
                });
            }
        }

        const feedback = await prisma.feedback.create({
            data: {
                userId: req.user.id,
                type: rawType as
                    | "BUG_REPORT"
                    | "FEATURE_REQUEST"
                    | "SUGGESTION"
                    | "CONTACT_OWNER"
                    | "OTHER",
                subject,
                message,
                rating,
                pageUrl: normalizeOptionalText(req.body?.pageUrl, 500),
                userAgent: normalizeOptionalText(
                    req.get("user-agent"),
                    500
                ),
            },
            select: {
                id: true,
                type: true,
                status: true,
                subject: true,
                rating: true,
                createdAt: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Feedback submitted successfully.",
            data: {
                feedback,
            },
        });
    } catch (error) {
        if (error instanceof Error && !error.message.includes("Prisma")) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Submit feedback error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit feedback.",
        });
    }
};

export const deleteMyAccount = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (req.body?.confirm !== true) {
            return res.status(400).json({
                success: false,
                message: "Account deletion must be explicitly confirmed.",
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id,
            },
            select: {
                id: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Account not found.",
            });
        }

        /*
         * User deletion cascades through all database records:
         * profile, DSA problems and revisions, resumes,
         * interviews and replays, streaks, readiness,
         * daily plans, payment rows, and feedback.
         */
        await prisma.user.delete({
            where: {
                id: req.user.id,
            },
        });

        return res.status(200).json({
            success: true,
            message:
                "Your PlacementOS account and stored database history were permanently deleted.",
        });
    } catch (error) {
        console.error("Delete account error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete account.",
        });
    }
};