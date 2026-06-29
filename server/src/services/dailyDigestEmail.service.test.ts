import {
    NotificationType,
} from "@prisma/client";

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
    sendEmailJsTemplate:
        vi.fn(),
}));

vi.mock(
    "./emailJs.service",
    () => ({
        sendEmailJsTemplate:
            mocks.sendEmailJsTemplate,
    })
);

import {
    sendDailyDigestEmail,
} from "./dailyDigestEmail.service";

describe(
    "Daily digest email service",
    () => {
        beforeEach(() => {
            vi.clearAllMocks();

            process.env.EMAILJS_DIGEST_TEMPLATE_ID =
                "digest-template";
            process.env.CLIENT_URL =
                "https://placementos.test/";
        });

        it(
            "builds a specific priority message and next step from reminder evidence",
            async () => {
                await sendDailyDigestEmail({
                    toEmail:
                        "student@example.com",

                    toName:
                        "Aarav",

                    localDate:
                        "2026-06-24",

                    timezone:
                        "Asia/Kolkata",

                    now:
                        new Date(
                            "2026-06-24T04:30:00.000Z"
                        ),

                    reminders: [
                        {
                            type:
                                NotificationType
                                    .DSA_REVISION_DUE,

                            title:
                                "DSA revisions are due",

                            message:
                                "2 tracked problems are due for revision.",

                            link:
                                "/dsa",

                            dedupeKey:
                                "DSA_REVISION_DUE:2026-06-24",

                            emailLine:
                                "2 tracked problems are due or overdue for revision.",

                            metadata: {
                                localDate:
                                    "2026-06-24",

                                timezone:
                                    "Asia/Kolkata",

                                dueCount:
                                    2,
                            },
                        },
                    ],
                });

                expect(
                    mocks.sendEmailJsTemplate
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        templateId:
                            "digest-template",

                        templateParams:
                            expect.objectContaining({
                                subject:
                                    expect.stringContaining(
                                        "PlacementOS daily digest -"
                                    ),

                                dashboard_url:
                                    "https://placementos.test/dashboard",

                                priority_title:
                                    "Clear DSA revision first",

                                priority_message:
                                    "Start with 2 problems due for spaced revision before adding new work.",

                                focus_message:
                                    "Start with 2 problems due for spaced revision before adding new work.",

                                next_step:
                                    expect.stringContaining(
                                        "mistake pattern"
                                    ),
                            }),
                    })
                );
            }
        );
    }
);
