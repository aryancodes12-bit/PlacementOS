
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
    createNotification:
        vi.fn(),

    emitNotificationToUser:
        vi.fn(),

    toRealtimeNotification:
        vi.fn(),
}));

vi.mock(
    "./notification.service",
    () => ({
        createNotification:
            mocks.createNotification,
    })
);

vi.mock(
    "../realtime/socket",
    () => ({
        emitNotificationToUser:
            mocks.emitNotificationToUser,

        toRealtimeNotification:
            mocks.toRealtimeNotification,
    })
);

import {
    publishResumeAnalysisReadyNotification,
} from "./resumeAnalysisNotification.service";

describe(
    "Resume analysis notification service",
    () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it(
            "creates and emits a resume-analysis-ready notification",
            async () => {
                const notification = {
                    id:
                        "notification-1",

                    userId:
                        "user-1",

                    type:
                        NotificationType
                            .RESUME_ANALYSIS_READY,

                    title:
                        "Resume AI analysis is ready",

                    message:
                        "Resume analyzed.",

                    link:
                        "/resume",

                    isRead: false,
                    readAt: null,

                    emailEligible:
                        false,

                    emailSentAt:
                        null,

                    dedupeKey:
                        "RESUME_ANALYSIS_READY:resume-1",

                    metadata: {
                        resumeId:
                            "resume-1",
                    },

                    createdAt:
                        new Date(
                            "2026-06-24T12:00:00.000Z"
                        ),

                    updatedAt:
                        new Date(
                            "2026-06-24T12:00:00.000Z"
                        ),
                };

                const realtimePayload = {
                    id:
                        "notification-1",

                    type:
                        "RESUME_ANALYSIS_READY",

                    title:
                        "Resume AI analysis is ready",

                    message:
                        "Resume analyzed.",

                    link:
                        "/resume",

                    isRead: false,

                    createdAt:
                        "2026-06-24T12:00:00.000Z",
                };

                mocks.createNotification
                    .mockResolvedValue(
                        notification
                    );

                mocks.toRealtimeNotification
                    .mockReturnValue(
                        realtimePayload
                    );

                mocks.emitNotificationToUser
                    .mockReturnValue(true);

                const result =
                    await publishResumeAnalysisReadyNotification(
                        {
                            userId:
                                "user-1",

                            resumeId:
                                "resume-1",

                            fileName:
                                "Aryan_Resume.pdf",

                            targetRole:
                                "Full Stack Developer",

                            atsScore:
                                85,
                        }
                    );

                expect(
                    mocks.createNotification
                ).toHaveBeenCalledWith({
                    userId:
                        "user-1",

                    type:
                        NotificationType
                            .RESUME_ANALYSIS_READY,

                    title:
                        "Resume AI analysis is ready",

                    message:
                        expect.stringContaining(
                            "85/100"
                        ),

                    link:
                        "/resume",

                    dedupeKey:
                        "RESUME_ANALYSIS_READY:resume-1",

                    emailEligible:
                        false,

                    metadata: {
                        resumeId:
                            "resume-1",

                        fileName:
                            "Aryan_Resume.pdf",

                        targetRole:
                            "Full Stack Developer",

                        atsScore:
                            85,

                        source:
                            "resume-analysis",
                    },
                });

                expect(
                    mocks.toRealtimeNotification
                ).toHaveBeenCalledWith(
                    notification
                );

                expect(
                    mocks.emitNotificationToUser
                ).toHaveBeenCalledWith(
                    "user-1",
                    realtimePayload
                );

                expect(result).toEqual({
                    notification,
                    emitted: true,
                });
            }
        );

        it(
            "does not fail resume processing when notification creation fails",
            async () => {
                mocks.createNotification
                    .mockRejectedValue(
                        new Error(
                            "Notification database unavailable"
                        )
                    );

                const result =
                    await publishResumeAnalysisReadyNotification(
                        {
                            userId:
                                "user-1",

                            resumeId:
                                "resume-1",

                            fileName:
                                "Resume.pdf",

                            targetRole:
                                null,

                            atsScore:
                                70,
                        }
                    );

                expect(result).toBeNull();

                expect(
                    mocks.emitNotificationToUser
                ).not.toHaveBeenCalled();
            }
        );
    }
);

