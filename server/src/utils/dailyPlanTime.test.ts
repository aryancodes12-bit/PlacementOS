import {
    describe,
    expect,
    it,
} from "vitest";

import {
    calculateDailyPlanMinutes,
    calculateDailyPlanTotalTime,
    formatPlanDuration,
    parsePlanDurationToMinutes,
} from "./dailyPlanTime";

describe(
    "dailyPlanTime utilities",
    () => {
        describe(
            "parsePlanDurationToMinutes",
            () => {
                it.each([
                    [
                        "30 min",
                        30,
                    ],
                    [
                        "45 minutes",
                        45,
                    ],
                    [
                        "1 hour",
                        60,
                    ],
                    [
                        "2 hours",
                        120,
                    ],
                    [
                        "1 hour 30 min",
                        90,
                    ],
                    [
                        "1.5 hours",
                        90,
                    ],
                    [
                        "",
                        0,
                    ],
                    [
                        undefined,
                        0,
                    ],
                    [
                        "unknown",
                        0,
                    ],
                ])(
                    "parses %s as %i minutes",
                    (
                        duration,
                        expected
                    ) => {
                        expect(
                            parsePlanDurationToMinutes(
                                duration
                            )
                        ).toBe(
                            expected
                        );
                    }
                );
            }
        );

        it(
            "calculates minutes across all categories",
            () => {
                const result =
                    calculateDailyPlanMinutes(
                        [
                            {
                                items: [
                                    {
                                        duration:
                                            "45 min",
                                    },
                                    {
                                        duration:
                                            "30 min",
                                    },
                                ],
                            },

                            {
                                items: [
                                    {
                                        duration:
                                            "1 hour",
                                    },
                                ],
                            },
                        ]
                    );

                expect(result).toBe(
                    135
                );
            }
        );

        it.each([
            [
                0,
                "0 min",
            ],
            [
                30,
                "30 min",
            ],
            [
                60,
                "1 hour",
            ],
            [
                90,
                "1 hour 30 min",
            ],
            [
                120,
                "2 hours",
            ],
            [
                190,
                "3 hours 10 min",
            ],
            [
                240,
                "4 hours",
            ],
        ])(
            "formats %i minutes as %s",
            (
                minutes,
                expected
            ) => {
                expect(
                    formatPlanDuration(
                        minutes
                    )
                ).toBe(
                    expected
                );
            }
        );

        it(
            "calculates and formats a complete plan",
            () => {
                const result =
                    calculateDailyPlanTotalTime(
                        [
                            {
                                items: [
                                    {
                                        duration:
                                            "30 min",
                                    },
                                    {
                                        duration:
                                            "30 min",
                                    },
                                ],
                            },

                            {
                                items: [
                                    {
                                        duration:
                                            "20 min",
                                    },
                                ],
                            },
                        ]
                    );

                expect(result).toBe(
                    "1 hour 20 min"
                );
            }
        );

        it(
            "ignores missing or invalid durations",
            () => {
                const result =
                    calculateDailyPlanMinutes(
                        [
                            {
                                items: [
                                    {
                                        duration:
                                            "",
                                    },
                                    {},
                                    {
                                        duration:
                                            "not available",
                                    },
                                ],
                            },
                        ]
                    );

                expect(result).toBe(
                    0
                );
            }
        );
    }
);