import type {
    Prisma,
} from "@prisma/client";

import {
    Router,
    type Response,
} from "express";

import type {
    AuthRequest,
} from "../middlewares/auth.middleware";

import {
    protect,
} from "../middlewares/auth.middleware";

import {
    prisma,
} from "../prisma/client";

import {
    generateDailyPlan,
} from "../services/dailyplan.service";
import {
    publishDailyPlanReadyNotification,
} from "../services/dailyPlanNotification.service";
import {
    getDailyPlanDateKey,
} from "../utils/dailyPlanDate";

import {
    calculateDailyPlanTotalTime,
} from "../utils/dailyPlanTime";

const router = Router();

router.use(protect);

interface StoredPlanItem {
    task?: string;
    reason?: string;
    duration?: string;

    source?: string;
    roadmapStageId?: string;
    roadmapTopicId?: string;

    [key: string]: unknown;
}

interface StoredPlanCategory {
    name?: string;
    icon?: string;
    color?: string;
    items?: StoredPlanItem[];

    [key: string]: unknown;
}

interface StoredPlan {
    greeting?: string;
    categories?: StoredPlanCategory[];
    totalTime?: string;
    focusMessage?: string;
    baseFocusMessage?: string;

    [key: string]: unknown;
}

const cloneJson = <T>(
    value: T
): T => {
    return JSON.parse(
        JSON.stringify(value)
    ) as T;
};

const synchronizePlanSummary = (
    plan: StoredPlan
): StoredPlan => {
    if (
        !Array.isArray(
            plan.categories
        )
    ) {
        plan.categories = [];
    }

    plan.totalTime =
        calculateDailyPlanTotalTime(
            plan.categories
        );

    const roadmapTopicTitles =
        plan.categories
            .flatMap((category) =>
                Array.isArray(
                    category.items
                )
                    ? category.items
                    : []
            )
            .filter(
                (item) =>
                    item?.source ===
                    "ROADMAP"
            )
            .map((item) =>
                String(item.task || "")
                    .replace(
                        /^Study\s+/i,
                        ""
                    )
                    .trim()
            )
            .filter(Boolean)
            .slice(0, 5);

    if (
        roadmapTopicTitles.length === 1
    ) {
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
        typeof plan.baseFocusMessage ===
        "string" &&
        plan.baseFocusMessage.trim()
    ) {
        plan.focusMessage =
            plan.baseFocusMessage;
    } else {
        plan.focusMessage =
            "Complete the highest-priority tasks in today’s plan.";
    }

    return plan;
};

const mergeRoadmapTasks = (
    generatedPlan: unknown,
    previousPlan: unknown
): StoredPlan => {
    const mergedPlan =
        cloneJson(
            generatedPlan
        ) as StoredPlan;

    const previous =
        cloneJson(
            previousPlan
        ) as StoredPlan;

    if (
        !Array.isArray(
            mergedPlan.categories
        )
    ) {
        mergedPlan.categories = [];
    }

    mergedPlan.baseFocusMessage =
        typeof mergedPlan.focusMessage ===
            "string"
            ? mergedPlan.focusMessage
            : undefined;

    if (
        !Array.isArray(
            previous?.categories
        )
    ) {
        return synchronizePlanSummary(
            mergedPlan
        );
    }

    for (
        const previousCategory
        of previous.categories
    ) {
        const roadmapItems =
            Array.isArray(
                previousCategory.items
            )
                ? previousCategory.items.filter(
                    (item) =>
                        item?.source ===
                        "ROADMAP"
                )
                : [];

        if (
            roadmapItems.length === 0
        ) {
            continue;
        }

        const categoryName =
            String(
                previousCategory.name ||
                "Interview"
            );

        let targetCategory =
            mergedPlan.categories.find(
                (category) =>
                    category.name ===
                    categoryName
            );

        if (!targetCategory) {
            targetCategory = {
                name: categoryName,

                icon:
                    previousCategory.icon ||
                    "mic",

                color:
                    previousCategory.color ||
                    "warning",

                items: [],
            };

            mergedPlan.categories.push(
                targetCategory
            );
        }

        if (
            !Array.isArray(
                targetCategory.items
            )
        ) {
            targetCategory.items = [];
        }

        for (
            const roadmapItem
            of roadmapItems
        ) {
            const alreadyPresent =
                targetCategory.items.some(
                    (item) =>
                        Boolean(
                            roadmapItem
                                .roadmapTopicId
                        ) &&
                        item.roadmapTopicId ===
                        roadmapItem
                            .roadmapTopicId
                );

            if (!alreadyPresent) {
                targetCategory.items.push(
                    roadmapItem
                );
            }
        }
    }

    return synchronizePlanSummary(
        mergedPlan
    );
};

router.get(
    "/",
    async (
        req: AuthRequest,
        res: Response
    ) => {
        try {
            const userId =
                req.user!.id;

            const createdDate =
                getDailyPlanDateKey();

            const cachedPlan =
                await prisma.dailyPlan.findUnique(
                    {
                        where: {
                            userId_createdDate:
                            {
                                userId,
                                createdDate,
                            },
                        },
                    }
                );

            if (cachedPlan) {
                return res
                    .status(200)
                    .json({
                        plan:
                            cachedPlan.plan,

                        cached: true,
                    });
            }

            const plan =
                await generateDailyPlan(
                    userId
                );

            await prisma.dailyPlan.create({
                data: {
                    userId,
                    createdDate,

                    plan:
                        plan as unknown as Prisma.InputJsonValue,
                },
            });

            /*
             * Notify only after the plan has been
             * successfully persisted.
             */
            await publishDailyPlanReadyNotification({
                userId,
                createdDate,
            });

            return res
                .status(200)
                .json({
                    plan,
                    cached: false,
                });
        } catch (error: unknown) {
            console.error(
                "getDailyPlan error:",
                error
            );

            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to generate daily plan";

            return res
                .status(500)
                .json({
                    message,
                });
        }
    }
);

router.delete(
    "/roadmap/:topicId",
    async (
        req: AuthRequest,
        res: Response
    ) => {
        try {
            const userId =
                req.user!.id;

            const topicId =
                String(
                    req.params.topicId ||
                    ""
                ).trim();

            if (
                !topicId ||
                topicId.length > 100
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Invalid roadmap topic.",
                    });
            }

            const createdDate =
                getDailyPlanDateKey();

            const existingRecord =
                await prisma.dailyPlan.findUnique(
                    {
                        where: {
                            userId_createdDate:
                            {
                                userId,
                                createdDate,
                            },
                        },
                    }
                );

            if (!existingRecord) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Today’s daily plan was not found.",
                    });
            }

            const plan =
                cloneJson(
                    existingRecord.plan
                ) as StoredPlan;

            if (
                !Array.isArray(
                    plan.categories
                )
            ) {
                plan.categories = [];
            }

            let removed = false;

            plan.categories =
                plan.categories
                    .map((category) => {
                        if (
                            !Array.isArray(
                                category.items
                            )
                        ) {
                            return category;
                        }

                        const filteredItems =
                            category.items.filter(
                                (item) => {
                                    const matches =
                                        item.source ===
                                        "ROADMAP" &&
                                        item
                                            .roadmapTopicId ===
                                        topicId;

                                    if (matches) {
                                        removed =
                                            true;
                                    }

                                    return !matches;
                                }
                            );

                        return {
                            ...category,
                            items:
                                filteredItems,
                        };
                    })
                    .filter(
                        (category) =>
                            !Array.isArray(
                                category.items
                            ) ||
                            category.items
                                .length > 0
                    );

            if (!removed) {
                return res
                    .status(200)
                    .json({
                        success: true,
                        alreadyRemoved:
                            true,

                        message:
                            "This roadmap task is already absent.",

                        data: {
                            plan:
                                synchronizePlanSummary(
                                    plan
                                ),
                        },
                    });
            }

            synchronizePlanSummary(plan);

            const updatedRecord =
                await prisma.dailyPlan.update({
                    where: {
                        userId_createdDate:
                        {
                            userId,
                            createdDate,
                        },
                    },

                    data: {
                        plan:
                            plan as unknown as Prisma.InputJsonValue,
                    },
                });

            return res
                .status(200)
                .json({
                    success: true,
                    alreadyRemoved:
                        false,

                    message:
                        "Roadmap task removed from today’s plan.",

                    data: {
                        plan:
                            updatedRecord.plan,

                        removedTopicId:
                            topicId,
                    },
                });
        } catch (error) {
            console.error(
                "Remove roadmap task error:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Failed to remove the roadmap task.",
                });
        }
    }
);

router.post(
    "/regenerate",
    async (
        req: AuthRequest,
        res: Response
    ) => {
        try {
            const userId =
                req.user!.id;

            const createdDate =
                getDailyPlanDateKey();

            const existingRecord =
                await prisma.dailyPlan.findUnique(
                    {
                        where: {
                            userId_createdDate:
                            {
                                userId,
                                createdDate,
                            },
                        },
                    }
                );

            const generatedPlan =
                await generateDailyPlan(
                    userId
                );

            const plan =
                existingRecord
                    ? mergeRoadmapTasks(
                        generatedPlan,
                        existingRecord.plan
                    )
                    : synchronizePlanSummary(
                        cloneJson(
                            generatedPlan
                        ) as StoredPlan
                    );

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

            return res
                .status(200)
                .json({
                    plan,
                    cached: false,
                });
        } catch (error: unknown) {
            console.error(
                "regenerateDailyPlan error:",
                error
            );

            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to regenerate daily plan";

            return res
                .status(500)
                .json({
                    message,
                });
        }
    }
);

export default router;
