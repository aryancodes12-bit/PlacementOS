import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import {
    render,
    screen,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import {
    roadmapService,
} from "../../../services/roadmap.service";

import {
    RoadmapSkillAction,
    RoadmapTopicAction,
} from "./RoadmapIntegrationActions";

import type {
    RoadmapStage,
    RoadmapTopic,
} from "../roadmap.types";

vi.mock(
    "../../../services/roadmap.service",
    () => ({
        roadmapService: {
            addTopicToDailyPlan:
                vi.fn(),

            addSkillToProfile:
                vi.fn(),
        },
    })
);

const topic: RoadmapTopic = {
    id: "relational-model",
    title:
        "Relational modelling",

    description:
        "Learn tables, keys and relationships.",

    estimatedTime: "10 hours",
};

const stage: RoadmapStage = {
    id: "stage-database",
    order: 8,
    slug:
        "postgresql-prisma",

    title:
        "PostgreSQL and Prisma",

    shortTitle: "Database",
    eyebrow: "Stage 8",

    summary:
        "Learn relational databases.",

    whyItMatters:
        "Correct modelling supports reliable applications.",

    estimatedTime:
        "4–6 weeks",

    difficulty:
        "INTERMEDIATE",

    kind: "DATABASE",

    topics: [topic],

    skills: [
        "PostgreSQL",
    ],

    checkpoint:
        "Design a relational database.",
};

describe(
    "Roadmap integration actions",
    () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it(
            "adds a roadmap topic to today's plan",
            async () => {
                vi.mocked(
                    roadmapService
                        .addTopicToDailyPlan
                ).mockResolvedValue({
                    data: {
                        success: true,
                        alreadyAdded:
                            false,

                        message:
                            "Relational modelling was added to today’s plan.",
                    },

                    status: 200,
                    statusText: "OK",
                    headers: {},
                    config: {},
                } as never);

                const user =
                    userEvent.setup();

                render(
                    <RoadmapTopicAction
                        stage={stage}
                        topic={topic}
                    />
                );

                await user.click(
                    screen.getByRole(
                        "button",
                        {
                            name: /add to daily plan/i,
                        }
                    )
                );

                expect(
                    roadmapService
                        .addTopicToDailyPlan
                ).toHaveBeenCalledWith({
                    stageId:
                        "stage-database",

                    stageTitle:
                        "PostgreSQL and Prisma",

                    stageKind:
                        "DATABASE",

                    topicId:
                        "relational-model",

                    topicTitle:
                        "Relational modelling",
                });

                expect(
                    await screen.findByRole(
                        "button",
                        {
                            name: /added to plan/i,
                        }
                    )
                ).toBeDisabled();
            }
        );

        it(
            "shows persisted topic state without sending another request",
            async () => {
                const user =
                    userEvent.setup();

                render(
                    <RoadmapTopicAction
                        stage={stage}
                        topic={topic}
                        initialAdded
                    />
                );

                const button =
                    screen.getByRole(
                        "button",
                        {
                            name: /already in plan/i,
                        }
                    );

                expect(
                    button
                ).toBeDisabled();

                await user.click(button);

                expect(
                    roadmapService
                        .addTopicToDailyPlan
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "adds a profile skill",
            async () => {
                vi.mocked(
                    roadmapService
                        .addSkillToProfile
                ).mockResolvedValue({
                    data: {
                        success: true,
                        alreadyAdded:
                            false,

                        message:
                            "PostgreSQL was added to your profile.",

                        data: {
                            skill:
                                "PostgreSQL",

                            skills: [
                                "PostgreSQL",
                            ],
                        },
                    },

                    status: 200,
                    statusText: "OK",
                    headers: {},
                    config: {},
                } as never);

                const user =
                    userEvent.setup();

                render(
                    <RoadmapSkillAction
                        skill="PostgreSQL"
                    />
                );

                await user.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                "PostgreSQL",
                        }
                    )
                );

                expect(
                    roadmapService
                        .addSkillToProfile
                ).toHaveBeenCalledWith(
                    "PostgreSQL"
                );

                expect(
                    await screen.findByRole(
                        "button",
                        {
                            name:
                                /postgresql.*in profile/i,
                        }
                    )
                ).toBeDisabled();
            }
        );
    }
);