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
    dailyPlanUpsert: vi.fn(),

    profileFindUnique: vi.fn(),
    profileUpsert: vi.fn(),

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

                upsert:
                    mocks.dailyPlanUpsert,
            },

            profile: {
                findUnique:
                    mocks.profileFindUnique,

                upsert:
                    mocks.profileUpsert,
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

import roadmapRoutes from "./roadmap.routes";

const app = express();

app.use(express.json());

app.use(
    "/api/roadmap",
    roadmapRoutes
);

const basePlan = {
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
    ],

    totalTime: "30 min",

    focusMessage:
        "Practice arrays and revise mistakes.",
};

const topicPayload = {
    stageId:
        "stage-database",

    stageTitle:
        "PostgreSQL and Prisma",

    stageKind:
        "DATABASE",

    topicId:
        "relational-modelling",

    topicTitle:
        "Relational modelling",
};

describe(
    "Roadmap API integration",
    () => {
        beforeEach(() => {
            vi.clearAllMocks();

            mocks.generateDailyPlan
                .mockResolvedValue(
                    structuredClone(
                        basePlan
                    )
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

            mocks.profileUpsert
                .mockImplementation(
                    async (
                        args: any
                    ) => ({
                        skills:
                            args.update
                                ?.skills ??
                            args.create
                                .skills,
                    })
                );
        });

        it(
            "adds a roadmap topic to today's Daily Plan",
            async () => {
                mocks.dailyPlanFindUnique
                    .mockResolvedValue(
                        null
                    );

                const response =
                    await request(app)
                        .post(
                            "/api/roadmap/daily-plan"
                        )
                        .send(
                            topicPayload
                        )
                        .expect(200);

                expect(
                    response.body.success
                ).toBe(true);

                expect(
                    response.body
                        .alreadyAdded
                ).toBe(false);

                expect(
                    response.body.data
                        .task
                ).toMatchObject({
                    task:
                        "Study Relational modelling",

                    duration:
                        "30 min",

                    source:
                        "ROADMAP",

                    roadmapStageId:
                        "stage-database",

                    roadmapTopicId:
                        "relational-modelling",
                });

                expect(
                    response.body.data
                        .plan.totalTime
                ).toBe("1 hour");

                expect(
                    response.body.data
                        .plan
                        .focusMessage
                ).toBe(
                    "Today’s roadmap focus: Relational modelling."
                );

                expect(
                    response.body.data
                        .plan
                        .baseFocusMessage
                ).toBe(
                    "Practice arrays and revise mistakes."
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
            "does not add the same roadmap topic twice",
            async () => {
                mocks.dailyPlanFindUnique
                    .mockResolvedValue({
                        plan: {
                            ...structuredClone(
                                basePlan
                            ),

                            categories: [
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
                                    ],
                                },
                            ],
                        },
                    });

                const response =
                    await request(app)
                        .post(
                            "/api/roadmap/daily-plan"
                        )
                        .send(
                            topicPayload
                        )
                        .expect(200);

                expect(
                    response.body.success
                ).toBe(true);

                expect(
                    response.body
                        .alreadyAdded
                ).toBe(true);

                expect(
                    response.body.message
                ).toBe(
                    "This roadmap topic is already in today’s plan."
                );

                expect(
                    mocks.generateDailyPlan
                ).not
                    .toHaveBeenCalled();

                expect(
                    mocks.dailyPlanUpsert
                ).not
                    .toHaveBeenCalled();
            }
        );

        it(
            "enforces the five-roadmap-task daily limit",
            async () => {
                const roadmapItems =
                    Array.from(
                        {
                            length: 5,
                        },
                        (
                            _item,
                            index
                        ) => ({
                            task:
                                `Study Topic ${index + 1}`,

                            reason:
                                "Selected from roadmap.",

                            duration:
                                "30 min",

                            source:
                                "ROADMAP",

                            roadmapStageId:
                                "stage-database",

                            roadmapTopicId:
                                `topic-${index + 1}`,
                        })
                    );

                mocks.dailyPlanFindUnique
                    .mockResolvedValue({
                        plan: {
                            ...structuredClone(
                                basePlan
                            ),

                            categories: [
                                {
                                    name:
                                        "Interview",

                                    icon: "mic",

                                    color:
                                        "warning",

                                    items:
                                        roadmapItems,
                                },
                            ],
                        },
                    });

                const response =
                    await request(app)
                        .post(
                            "/api/roadmap/daily-plan"
                        )
                        .send(
                            topicPayload
                        )
                        .expect(400);

                expect(
                    response.body.success
                ).toBe(false);

                expect(
                    response.body.message
                ).toBe(
                    "You can add up to 5 roadmap topics to one daily plan."
                );

                expect(
                    mocks.dailyPlanUpsert
                ).not
                    .toHaveBeenCalled();
            }
        );

        it(
            "rejects an invalid roadmap stage category",
            async () => {
                const response =
                    await request(app)
                        .post(
                            "/api/roadmap/daily-plan"
                        )
                        .send({
                            ...topicPayload,

                            stageKind:
                                "INVALID_STAGE",
                        })
                        .expect(400);

                expect(
                    response.body
                        .success
                ).toBe(false);

                expect(
                    response.body
                        .message
                ).toBe(
                    "Invalid roadmap stage category."
                );

                expect(
                    mocks.dailyPlanFindUnique
                ).not
                    .toHaveBeenCalled();
            }
        );

        it(
            "returns persisted roadmap and profile status",
            async () => {
                mocks.dailyPlanFindUnique
                    .mockResolvedValue({
                        plan: {
                            ...structuredClone(
                                basePlan
                            ),

                            categories: [
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
                                                "Selected from roadmap.",

                                            duration:
                                                "30 min",

                                            source:
                                                "ROADMAP",

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

                                            roadmapTopicId:
                                                "query-optimisation",
                                        },
                                    ],
                                },
                            ],
                        },
                    });

                mocks.profileFindUnique
                    .mockResolvedValue({
                        skills: [
                            "PostgreSQL",
                            "Prisma",
                        ],
                    });

                const response =
                    await request(app)
                        .get(
                            "/api/roadmap/status"
                        )
                        .expect(200);

                expect(
                    response.body
                ).toMatchObject({
                    success: true,

                    data: {
                        dailyPlanTopicIds:
                            [
                                "relational-modelling",
                                "query-optimisation",
                            ],

                        profileSkills:
                            [
                                "PostgreSQL",
                                "Prisma",
                            ],

                        roadmapTaskCount:
                            2,

                        maxRoadmapTasks:
                            5,
                    },
                });
            }
        );

        it(
            "adds a new roadmap skill to the profile",
            async () => {
                mocks.profileFindUnique
                    .mockResolvedValue({
                        skills: [
                            "React",
                        ],
                    });

                const response =
                    await request(app)
                        .post(
                            "/api/roadmap/profile-skill"
                        )
                        .send({
                            skill:
                                "PostgreSQL",
                        })
                        .expect(200);

                expect(
                    response.body.success
                ).toBe(true);

                expect(
                    response.body
                        .alreadyAdded
                ).toBe(false);

                expect(
                    response.body.data
                        .skills
                ).toEqual([
                    "React",
                    "PostgreSQL",
                ]);

                expect(
                    mocks.profileUpsert
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: {
                            userId:
                                "test-user-1",
                        },

                        update: {
                            skills: [
                                "React",
                                "PostgreSQL",
                            ],
                        },
                    })
                );
            }
        );

        it(
            "protects profile skills from case-insensitive duplicates",
            async () => {
                mocks.profileFindUnique
                    .mockResolvedValue({
                        skills: [
                            "PostgreSQL",
                        ],
                    });

                const response =
                    await request(app)
                        .post(
                            "/api/roadmap/profile-skill"
                        )
                        .send({
                            skill:
                                "postgresql",
                        })
                        .expect(200);

                expect(
                    response.body
                        .alreadyAdded
                ).toBe(true);

                expect(
                    response.body.data
                        .skills
                ).toEqual([
                    "PostgreSQL",
                ]);

                expect(
                    mocks.profileUpsert
                ).not
                    .toHaveBeenCalled();
            }
        );
    }
);