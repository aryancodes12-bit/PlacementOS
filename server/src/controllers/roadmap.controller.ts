import type { Prisma } from "@prisma/client";
import type { Response } from "express";

import type { AuthRequest } from "../middlewares/auth.middleware";
import { prisma } from "../prisma/client";
import { generateDailyPlan } from "../services/dailyplan.service";
import { getDailyPlanDateKey } from "../utils/dailyPlanDate";
import { calculateDailyPlanTotalTime } from "../utils/dailyPlanTime";

const MAX_ROADMAP_TASKS_PER_DAY = 5;
const MAX_PROFILE_SKILLS = 30;

type RoadmapStageKind =
    | "FOUNDATION"
    | "FRONTEND"
    | "BACKEND"
    | "DATABASE"
    | "SECURITY"
    | "QUALITY"
    | "DELIVERY"
    | "CAREER";

interface DailyPlanItem {
    task: string;
    reason: string;
    duration: string;

    source?: string;
    roadmapStageId?: string;
    roadmapTopicId?: string;
}

interface DailyPlanCategory {
    name: string;
    icon: string;
    color: string;
    items: DailyPlanItem[];
}

interface MutableDailyPlan {
    greeting: string;
    categories: DailyPlanCategory[];
    totalTime: string;
    focusMessage: string;
    baseFocusMessage?: string;

    [key: string]: unknown;
}

const VALID_STAGE_KINDS = new Set<RoadmapStageKind>([
    "FOUNDATION",
    "FRONTEND",
    "BACKEND",
    "DATABASE",
    "SECURITY",
    "QUALITY",
    "DELIVERY",
    "CAREER",
]);

const normalizeText = (
    value: unknown,
    maxLength: number
): string => {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, maxLength);
};

const clonePlan = (
    value: unknown
): MutableDailyPlan => {
    const fallback: MutableDailyPlan = {
        greeting:
            "Continue today with one focused placement preparation session.",
        categories: [],
        totalTime: "30 min",
        focusMessage:
            "Complete the roadmap topic you selected.",
    };

    if (
        !value ||
        typeof value !== "object"
    ) {
        return fallback;
    }

    try {
        const cloned = JSON.parse(
            JSON.stringify(value)
        ) as Partial<MutableDailyPlan>;

        return {
            ...cloned,

            greeting:
                typeof cloned.greeting ===
                    "string"
                    ? cloned.greeting
                    : fallback.greeting,

            categories: Array.isArray(
                cloned.categories
            )
                ? cloned.categories
                : [],

            totalTime:
                typeof cloned.totalTime ===
                    "string"
                    ? cloned.totalTime
                    : fallback.totalTime,

            focusMessage:
                typeof cloned.focusMessage ===
                    "string"
                    ? cloned.focusMessage
                    : fallback.focusMessage,

            baseFocusMessage:
                typeof cloned.baseFocusMessage ===
                    "string"
                    ? cloned.baseFocusMessage
                    : undefined,
        };
    } catch {
        return fallback;
    }
};

const determinePlanCategory = (
    stageKind: RoadmapStageKind,
    topicTitle: string
): Pick<
    DailyPlanCategory,
    "name" | "icon" | "color"
> => {
    const normalizedTitle =
        topicTitle.toLowerCase();

    const isResumeTopic =
        stageKind === "CAREER" &&
        [
            "resume",
            "github",
            "readme",
            "portfolio",
        ].some((keyword) =>
            normalizedTitle.includes(keyword)
        );

    if (isResumeTopic) {
        return {
            name: "Resume",
            icon: "file",
            color: "success",
        };
    }

    return {
        name: "Interview",
        icon: "mic",
        color: "warning",
    };
};

const getRoadmapTasks = (
    plan: MutableDailyPlan
): DailyPlanItem[] => {
    return plan.categories.flatMap(
        (category) =>
            Array.isArray(category.items)
                ? category.items.filter(
                    (item) =>
                        item?.source ===
                        "ROADMAP"
                )
                : []
    );
};

const synchronizeRoadmapSummary = (
    plan: MutableDailyPlan
) => {
    const roadmapTopicTitles =
        getRoadmapTasks(plan)
            .map((item) =>
                item.task
                    .replace(
                        /^Study\s+/i,
                        ""
                    )
                    .trim()
            )
            .filter(Boolean)
            .slice(0, 5);

    if (roadmapTopicTitles.length === 1) {
        plan.focusMessage =
            `Today’s roadmap focus: ${roadmapTopicTitles[0]}.`;
    } else if (
        roadmapTopicTitles.length > 1
    ) {
        plan.focusMessage =
            `Today’s roadmap focuses: ${roadmapTopicTitles.join(
                ", "
            )}.`;
    } else if (
        plan.baseFocusMessage?.trim()
    ) {
        plan.focusMessage =
            plan.baseFocusMessage;
    }

    plan.totalTime =
        calculateDailyPlanTotalTime(
            plan.categories
        );
};

export const addRoadmapTopicToDailyPlan =
    async (
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

            const stageId = normalizeText(
                req.body?.stageId,
                100
            );

            const stageTitle = normalizeText(
                req.body?.stageTitle,
                120
            );

            const topicId = normalizeText(
                req.body?.topicId,
                100
            );

            const topicTitle = normalizeText(
                req.body?.topicTitle,
                160
            );

            const rawStageKind = normalizeText(
                req.body?.stageKind,
                30
            ).toUpperCase();

            if (
                !stageId ||
                !stageTitle ||
                !topicId ||
                topicTitle.length < 2
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Roadmap stage and topic details are required.",
                });
            }

            if (
                !VALID_STAGE_KINDS.has(
                    rawStageKind as RoadmapStageKind
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid roadmap stage category.",
                });
            }

            const stageKind =
                rawStageKind as RoadmapStageKind;

            const userId = req.user.id;
            const createdDate =
                getDailyPlanDateKey();

            const existingRecord =
                await prisma.dailyPlan.findUnique({
                    where: {
                        userId_createdDate: {
                            userId,
                            createdDate,
                        },
                    },
                });

            const basePlan =
                existingRecord?.plan ??
                (await generateDailyPlan(
                    userId
                ));

            const plan = clonePlan(basePlan);
            const roadmapTasks =
                getRoadmapTasks(plan);

            const duplicate =
                roadmapTasks.some(
                    (item) =>
                        item.roadmapTopicId ===
                        topicId
                );

            if (duplicate) {
                return res.status(200).json({
                    success: true,
                    alreadyAdded: true,
                    message:
                        "This roadmap topic is already in today’s plan.",
                    data: {
                        plan,
                    },
                });
            }

            if (
                roadmapTasks.length >=
                MAX_ROADMAP_TASKS_PER_DAY
            ) {
                return res.status(400).json({
                    success: false,
                    code: "ROADMAP_TASK_LIMIT_REACHED",
                    message:
                        "You can add up to 5 roadmap topics to one daily plan.",
                });
            }

            const categoryConfig =
                determinePlanCategory(
                    stageKind,
                    topicTitle
                );

            let category =
                plan.categories.find(
                    (item) =>
                        item.name ===
                        categoryConfig.name
                );

            if (!category) {
                category = {
                    ...categoryConfig,
                    items: [],
                };

                plan.categories.push(category);
            }

            if (!Array.isArray(category.items)) {
                category.items = [];
            }

            if (
                roadmapTasks.length === 0 &&
                !plan.baseFocusMessage
            ) {
                plan.baseFocusMessage =
                    plan.focusMessage;
            }

            const roadmapTask: DailyPlanItem = {
                task: `Study ${topicTitle}`,
                reason:
                    `Selected from ${stageTitle} in the Full-Stack Developer Roadmap. ` +
                    "Complete one focused learning and practice session today.",
                duration: "30 min",

                source: "ROADMAP",
                roadmapStageId: stageId,
                roadmapTopicId: topicId,
            };

            category.items.push(roadmapTask);
            synchronizeRoadmapSummary(plan);

            const savedRecord =
                await prisma.dailyPlan.upsert({
                    where: {
                        userId_createdDate: {
                            userId,
                            createdDate,
                        },
                    },

                    update: {
                        plan:
                            plan as unknown as Prisma.InputJsonValue,
                    },

                    create: {
                        userId,
                        createdDate,

                        plan:
                            plan as unknown as Prisma.InputJsonValue,
                    },
                });

            return res.status(200).json({
                success: true,
                alreadyAdded: false,
                message:
                    `${topicTitle} was added to today’s plan.`,

                data: {
                    plan: savedRecord.plan,
                    task: roadmapTask,
                },
            });
        } catch (error) {
            console.error(
                "Add roadmap topic error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to add the roadmap topic to your daily plan.",
            });
        }
    };

export const getRoadmapIntegrationStatus =
    async (
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
            const createdDate =
                getDailyPlanDateKey();

            const [
                dailyPlanRecord,
                profile,
            ] = await Promise.all([
                prisma.dailyPlan.findUnique({
                    where: {
                        userId_createdDate: {
                            userId,
                            createdDate,
                        },
                    },

                    select: {
                        plan: true,
                    },
                }),

                prisma.profile.findUnique({
                    where: {
                        userId,
                    },

                    select: {
                        skills: true,
                    },
                }),
            ]);

            const plan = clonePlan(
                dailyPlanRecord?.plan
            );

            const dailyPlanTopicIds =
                Array.from(
                    new Set(
                        getRoadmapTasks(plan)
                            .map(
                                (task) =>
                                    task.roadmapTopicId
                            )
                            .filter(
                                (
                                    topicId
                                ): topicId is string =>
                                    Boolean(topicId)
                            )
                    )
                );

            return res.status(200).json({
                success: true,

                data: {
                    dailyPlanTopicIds,
                    profileSkills:
                        profile?.skills ?? [],
                    roadmapTaskCount:
                        dailyPlanTopicIds.length,
                    maxRoadmapTasks:
                        MAX_ROADMAP_TASKS_PER_DAY,
                },
            });
        } catch (error) {
            console.error(
                "Get roadmap integration status error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to load roadmap status.",
            });
        }
    };

export const addRoadmapSkillToProfile =
    async (
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

            const skill = normalizeText(
                req.body?.skill,
                60
            );

            if (skill.length < 2) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Enter a valid skill.",
                });
            }

            const userId = req.user.id;

            const profile =
                await prisma.profile.findUnique({
                    where: {
                        userId,
                    },

                    select: {
                        skills: true,
                    },
                });

            const currentSkills =
                profile?.skills ?? [];

            const existingSkill =
                currentSkills.find(
                    (existing) =>
                        existing.toLowerCase() ===
                        skill.toLowerCase()
                );

            if (existingSkill) {
                return res.status(200).json({
                    success: true,
                    alreadyAdded: true,
                    message:
                        `${existingSkill} is already in your profile.`,

                    data: {
                        skill: existingSkill,
                        skills: currentSkills,
                    },
                });
            }

            if (
                currentSkills.length >=
                MAX_PROFILE_SKILLS
            ) {
                return res.status(400).json({
                    success: false,
                    code: "PROFILE_SKILL_LIMIT_REACHED",
                    message:
                        "Your profile can contain up to 30 skills.",
                });
            }

            const updatedSkills = [
                ...currentSkills,
                skill,
            ];

            const updatedProfile =
                await prisma.profile.upsert({
                    where: {
                        userId,
                    },

                    update: {
                        skills: updatedSkills,
                    },

                    create: {
                        userId,
                        skills: [skill],
                        targetCompanies: [],
                    },

                    select: {
                        skills: true,
                    },
                });

            return res.status(200).json({
                success: true,
                alreadyAdded: false,
                message:
                    `${skill} was added to your profile.`,

                data: {
                    skill,
                    skills:
                        updatedProfile.skills,
                },
            });
        } catch (error) {
            console.error(
                "Add roadmap skill error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to add the skill to your profile.",
            });
        }
    };
