import {
    Router,
    type Response,
} from "express";
import {
    calculateDailyPlanTotalTime,
} from "../utils/dailyPlanTime";
import type {
    Prisma,
} from "@prisma/client";

import {
    prisma,
} from "../prisma/client";

import {
    protect,
} from "../middlewares/auth.middleware";

import type {
    AuthRequest,
} from "../middlewares/auth.middleware";

import {
    generateDailyPlan,
} from "../services/dailyplan.service";

import {
    getDailyPlanDateKey,
} from "../utils/dailyPlanDate";

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

    [key: string]: unknown;
}

const cloneJson = <T>(
    value: T
): T => {
    return JSON.parse(
        JSON.stringify(value)
    ) as T;
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

    if (
        !Array.isArray(
            previous?.categories
        )
    ) {
        return mergedPlan;
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
                        item
                            .roadmapTopicId ===
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
    mergedPlan.totalTime =
        calculateDailyPlanTotalTime(
            mergedPlan.categories ?? []
        );

    const mergedRoadmapTasks =
        (mergedPlan.categories ?? [])
            .flatMap((category) =>
                Array.isArray(category.items)
                    ? category.items
                    : []
            )
            .filter(
                (item) =>
                    item?.source === "ROADMAP"
            );

    const roadmapTopicTitles =
        mergedRoadmapTasks
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

    if (roadmapTopicTitles.length === 1) {
        mergedPlan.focusMessage =
            `Today’s roadmap focus: ${roadmapTopicTitles[0]}.`;
    }

    if (roadmapTopicTitles.length > 1) {
        mergedPlan.focusMessage =
            `Today’s roadmap focuses: ${roadmapTopicTitles.join(
                ", "
            )}.`;
    }

    return mergedPlan;
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

            /*
             * Read the existing plan first so manually
             * selected roadmap topics survive regeneration.
             */
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
                    : generatedPlan;

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