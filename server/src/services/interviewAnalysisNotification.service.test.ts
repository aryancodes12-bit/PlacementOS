
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
    publishInterviewAnalysisReadyNotification,
} from "./interviewAnalysisNotification.service";

describe(
    "Interview analysis notification service",
    () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it(
            "creates and emits an interview-analysis-ready notification",
            async () => {
                const notification = {
                    id:
                        "notification-1",

                    userId:
                        "user-1",

                    type:
                        NotificationType
                            .INTERVIEW_ANALYSIS_READY,

                    title:
                        "Interview AI analysis is ready",

                    message:
                        "Analysis ready",

                    link:
                        "/interviews/interview-1",

                    isRead: false,
                    readAt: null,

                    emailEligible:
                        false,

                    emailSentAt:
                        null,

                    dedupeKey:
                        "INTERVIEW_ANALYSIS_READY:interview-1:2026-06-24T10:00:00.000Z",

                    metadata: {
                        interviewId:
                            "interview-1",
                    },

                    createdAt:
                        new Date(
                            "2026-06-24T10:00:00.000Z"
                        ),

                    updatedAt:
                        new Date(
                            "2026-06-24T10:00:00.000Z"
                        ),
                };

                const realtimePayload = {
                    id:
                        "notification-1",

                    type:
                        "INTERVIEW_ANALYSIS_READY",

                    title:
                        "Interview AI analysis is ready",

                    message:
                        "Analysis ready",

                    link:
                        "/interviews/interview-1",

                    isRead: false,

                    createdAt:
                        "2026-06-24T10:00:00.000Z",
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
                    await publishInterviewAnalysisReadyNotification(
                        {
                            userId:
                                "user-1",

                            interviewId:
                                "interview-1",

                            company:
                                "Microsoft",

                            role:
                                "Software Engineer",

                            sourceType:
                                "MANUAL",

                            analysisCompletedAt:
                                "2026-06-24T10:00:00.000Z",
                        }
                    );

                expect(
                    mocks.createNotification
                ).toHaveBeenCalledWith({
                    userId:
                        "user-1",

                    type:
                        NotificationType
                            .INTERVIEW_ANALYSIS_READY,

                    title:
                        "Interview AI analysis is ready",

                    message:
                        expect.stringContaining(
                            "Microsoft Software Engineer"
                        ),

                    link:
                        "/interviews/interview-1",

                    dedupeKey:
                        "INTERVIEW_ANALYSIS_READY:interview-1:2026-06-24T10:00:00.000Z",

                    emailEligible:
                        false,

                    metadata: {
                        interviewId:
                            "interview-1",

                        company:
                            "Microsoft",

                        role:
                            "Software Engineer",

                        sourceType:
                            "MANUAL",

                        analysisCompletedAt:
                            "2026-06-24T10:00:00.000Z",

                        source:
                            "interview-analysis",
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
            "does not fail the analysis workflow when notification creation fails",
            async () => {
                mocks.createNotification
                    .mockRejectedValue(
                        new Error(
                            "Notification database unavailable"
                        )
                    );

                const result =
                    await publishInterviewAnalysisReadyNotification(
                        {
                            userId:
                                "user-1",

                            interviewId:
                                "interview-1",

                            company:
                                "Example Company",

                            role:
                                "Developer",

                            sourceType:
                                "AUDIO",

                            analysisCompletedAt:
                                "2026-06-24T10:00:00.000Z",
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

