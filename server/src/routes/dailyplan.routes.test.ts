import express from "express";
import request from "supertest";

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
    dailyPlanFindUnique: vi.fn(),
    dailyPlanCreate: vi.fn(),
    dailyPlanUpdate: vi.fn(),
    dailyPlanUpsert: vi.fn(),

    generateDailyPlan: vi.fn(),
}));

vi.mock(
    "../middlewares/auth.middleware",
    () => ({
        protect: (
            req: {
                user?: {
                    id: string;
                };
            },
            _res: unknown,
            next: () => void
        ) => {
            req.user = {
                id: "test-user-1",
            };

            next();
        },
    })
);

vi.mock(
    "../prisma/client",
    () => ({
        prisma: {
            dailyPlan: {
                findUnique:
                    mocks.dailyPlanFindUnique,

                create:
                    mocks.dailyPlanCreate,

                update:
                    mocks.dailyPlanUpdate,

                upsert:
                    mocks.dailyPlanUpsert,
            },
        },
    })
);

vi.mock(
    "../services/dailyplan.service",
    () => ({
        generateDailyPlan:
            mocks.generateDailyPlan,
    })
);

vi.mock(
    "../utils/dailyPlanDate",
    () => ({
        getDailyPlanDateKey: () =>
            "2026-06-22",
    })
);

import dailyPlanRoutes from "./dailyplan.routes";

const app = express();

app.use(express.json());

app.use(
    "/api/daily-plan",
    dailyPlanRoutes
);

const createPlanWithRoadmapTasks =
    () => ({
        greeting:
            "Continue your placement preparation.",

        categories: [
            {
                name: "DSA",
                icon: "code",
                color: "brand",

                items: [
                    {
                        task:
                            "Practice arrays",

                        reason:
                            "Improve implementation speed.",

                        duration:
                            "30 min",
                    },
                ],
            },

            {
                name: "Interview",
                icon: "mic",
                color: "warning",

                items: [
                    {
                        task:
                            "Study Relational modelling",

                        reason:
                            "Selected from roadmap.",

                        duration:
                            "30 min",

                        source:
                            "ROADMAP",

                        roadmapStageId:
                            "stage-database",

                        roadmapTopicId:
                            "relational-modelling",
                    },

                    {
                        task:
                            "Study Query optimisation",

                        reason:
                            "Selected from roadmap.",

                        duration:
                            "30 min",

                        source:
                            "ROADMAP",

                        roadmapStageId:
                            "stage-database",

                        roadmapTopicId:
                            "query-optimisation",
                    },
                ],
            },
        ],

        totalTime:
            "1 hour 30 min",

        focusMessage:
            "Today’s roadmap focuses: Relational modelling, Query optimisation.",

        baseFocusMessage:
            "Practice arrays and revise mistakes.",
    });

const generatedAiPlan = {
    greeting:
        "Here is your refreshed plan.",

    categories: [
        {
            name: "DSA",
            icon: "code",
            color: "brand",

            items: [
                {
                    task:
                        "Solve two array problems",

                    reason:
                        "Improve array pattern recognition.",

                    duration:
                        "45 min",
                },
            ],
        },

        {
            name: "Resume",
            icon: "file",
            color: "success",

            items: [
                {
                    task:
                        "Improve project descriptions",

                    reason:
                        "Make resume impact clearer.",

                    duration:
                        "30 min",
                },
            ],
        },
    ],

    totalTime:
        "1 hour 15 min",

    focusMessage:
        "Improve array problem-solving accuracy.",
};

describe(
    "Daily Plan roadmap integration",
    () => {
        beforeEach(() => {
            vi.clearAllMocks();

            mocks.dailyPlanUpdate
                .mockImplementation(
                    async (
                        args: any
                    ) => ({
                        plan:
                            args.data.plan,
                    })
                );

            mocks.dailyPlanUpsert
                .mockImplementation(
                    async (
                        args: any
                    ) => ({
                        plan:
                            args.update
                                ?.plan ??
                            args.create
                                .plan,
                    })
                );

            mocks.dailyPlanCreate
                .mockImplementation(
                    async (
                        args: any
                    ) => ({
                        plan:
                            args.data.plan,
                    })
                );

            mocks.generateDailyPlan
                .mockResolvedValue(
                    structuredClone(
                        generatedAiPlan
                    )
                );
        });

        it(
            "removes one roadmap task and recalculates the plan summary",
            async () => {
                mocks.dailyPlanFindUnique
                    .mockResolvedValue({
                        plan:
                            createPlanWithRoadmapTasks(),
                    });

                const response =
                    await request(app)
                        .delete(
                            "/api/daily-plan/roadmap/relational-modelling"
                        )
                        .expect(200);

                expect(
                    response.body.success
                ).toBe(true);

                expect(
                    response.body
                        .alreadyRemoved
                ).toBe(false);

                expect(
                    response.body.data
                        .removedTopicId
                ).toBe(
                    "relational-modelling"
                );

                const updatedPlan =
                    response.body.data.plan;

                expect(
                    updatedPlan.totalTime
                ).toBe("1 hour");

                expect(
                    updatedPlan.focusMessage
                ).toBe(
                    "Today’s roadmap focus: Query optimisation."
                );

                const allItems =
                    updatedPlan.categories
                        .flatMap(
                            (
                                category: any
                            ) =>
                                category.items ??
                                []
                        );

                expect(
                    allItems.some(
                        (
                            item: any
                        ) =>
                            item.roadmapTopicId ===
                            "relational-modelling"
                    )
                ).toBe(false);

                expect(
                    allItems.some(
                        (
                            item: any
                        ) =>
                            item.roadmapTopicId ===
                            "query-optimisation"
                    )
                ).toBe(true);

                expect(
                    mocks.dailyPlanUpdate
                ).toHaveBeenCalledOnce();
            }
        );

        it(
            "restores the original AI focus after removing the final roadmap task",
            async () => {
                const plan =
                    createPlanWithRoadmapTasks();

                plan.categories[1].items =
                    [
                        plan.categories[1]
                            .items[0],
                    ];

                plan.totalTime =
                    "1 hour";

                plan.focusMessage =
                    "Today’s roadmap focus: Relational modelling.";

                mocks.dailyPlanFindUnique
                    .mockResolvedValue({
                        plan,
                    });

                const response =
                    await request(app)
                        .delete(
                            "/api/daily-plan/roadmap/relational-modelling"
                        )
                        .expect(200);

                const updatedPlan =
                    response.body.data.plan;

                expect(
                    updatedPlan.totalTime
                ).toBe("30 min");

                expect(
                    updatedPlan.focusMessage
                ).toBe(
                    "Practice arrays and revise mistakes."
                );

                const roadmapTasks =
                    updatedPlan.categories
                        .flatMap(
                            (
                                category: any
                            ) =>
                                category.items ??
                                []
                        )
                        .filter(
                            (
                                item: any
                            ) =>
                                item.source ===
                                "ROADMAP"
                        );

                expect(
                    roadmapTasks
                ).toHaveLength(0);

                expect(
                    updatedPlan.categories.some(
                        (
                            category: any
                        ) =>
                            category.name ===
                            "Interview" &&
                            category.items
                                .length === 0
                    )
                ).toBe(false);
            }
        );

        it(
            "returns alreadyRemoved when the roadmap task is absent",
            async () => {
                mocks.dailyPlanFindUnique
                    .mockResolvedValue({
                        plan:
                            createPlanWithRoadmapTasks(),
                    });

                const response =
                    await request(app)
                        .delete(
                            "/api/daily-plan/roadmap/non-existent-topic"
                        )
                        .expect(200);

                expect(
                    response.body.success
                ).toBe(true);

                expect(
                    response.body
                        .alreadyRemoved
                ).toBe(true);

                expect(
                    response.body.message
                ).toBe(
                    "This roadmap task is already absent."
                );

                expect(
                    mocks.dailyPlanUpdate
                ).not
                    .toHaveBeenCalled();
            }
        );

        it(
            "returns 404 when today's Daily Plan does not exist",
            async () => {
                mocks.dailyPlanFindUnique
                    .mockResolvedValue(
                        null
                    );

                const response =
                    await request(app)
                        .delete(
                            "/api/daily-plan/roadmap/relational-modelling"
                        )
                        .expect(404);

                expect(
                    response.body.success
                ).toBe(false);

                expect(
                    response.body.message
                ).toBe(
                    "Today’s daily plan was not found."
                );

                expect(
                    mocks.dailyPlanUpdate
                ).not
                    .toHaveBeenCalled();
            }
        );

        it(
            "preserves roadmap tasks when the Daily Plan is regenerated",
            async () => {
                mocks.dailyPlanFindUnique
                    .mockResolvedValue({
                        plan:
                            createPlanWithRoadmapTasks(),
                    });

                const response =
                    await request(app)
                        .post(
                            "/api/daily-plan/regenerate"
                        )
                        .expect(200);

                const regeneratedPlan =
                    response.body.plan;

                const allItems =
                    regeneratedPlan.categories
                        .flatMap(
                            (
                                category: any
                            ) =>
                                category.items ??
                                []
                        );

                expect(
                    allItems
                ).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            task:
                                "Solve two array problems",

                            duration:
                                "45 min",
                        }),

                        expect.objectContaining({
                            task:
                                "Improve project descriptions",

                            duration:
                                "30 min",
                        }),

                        expect.objectContaining({
                            roadmapTopicId:
                                "relational-modelling",

                            source:
                                "ROADMAP",
                        }),

                        expect.objectContaining({
                            roadmapTopicId:
                                "query-optimisation",

                            source:
                                "ROADMAP",
                        }),
                    ])
                );

                expect(
                    regeneratedPlan.totalTime
                ).toBe(
                    "2 hours 15 min"
                );

                expect(
                    regeneratedPlan.focusMessage
                ).toBe(
                    "Today’s roadmap focuses: Relational modelling, Query optimisation."
                );

                expect(
                    regeneratedPlan.baseFocusMessage
                ).toBe(
                    "Improve array problem-solving accuracy."
                );

                expect(
                    mocks.generateDailyPlan
                ).toHaveBeenCalledWith(
                    "test-user-1"
                );

                expect(
                    mocks.dailyPlanUpsert
                ).toHaveBeenCalledOnce();
            }
        );

        it(
            "does not duplicate roadmap tasks already present in a regenerated plan",
            async () => {
                mocks.dailyPlanFindUnique
                    .mockResolvedValue({
                        plan:
                            createPlanWithRoadmapTasks(),
                    });

                mocks.generateDailyPlan
                    .mockResolvedValue({
                        ...structuredClone(
                            generatedAiPlan
                        ),

                        categories: [
                            ...structuredClone(
                                generatedAiPlan
                                    .categories
                            ),

                            {
                                name:
                                    "Interview",

                                icon: "mic",

                                color:
                                    "warning",

                                items: [
                                    {
                                        task:
                                            "Study Relational modelling",

                                        reason:
                                            "Already generated.",

                                        duration:
                                            "30 min",

                                        source:
                                            "ROADMAP",

                                        roadmapStageId:
                                            "stage-database",

                                        roadmapTopicId:
                                            "relational-modelling",
                                    },
                                ],
                            },
                        ],
                    });

                const response =
                    await request(app)
                        .post(
                            "/api/daily-plan/regenerate"
                        )
                        .expect(200);

                const roadmapTasks =
                    response.body.plan
                        .categories
                        .flatMap(
                            (
                                category: any
                            ) =>
                                category.items ??
                                []
                        )
                        .filter(
                            (
                                item: any
                            ) =>
                                item.roadmapTopicId ===
                                "relational-modelling"
                        );

                expect(
                    roadmapTasks
                ).toHaveLength(1);
            }
        );
    }
);