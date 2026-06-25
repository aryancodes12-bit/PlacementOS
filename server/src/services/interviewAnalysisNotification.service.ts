
import {
    NotificationType,
} from "@prisma/client";

import {
    emitNotificationToUser,
    toRealtimeNotification,
} from "../realtime/socket";

import {
    createNotification,
} from "./notification.service";

interface PublishInterviewAnalysisReadyInput {
    userId: string;
    interviewId: string;

    company: string;
    role: string;
    sourceType: string;

    analysisCompletedAt:
    | Date
    | string;
}

export const publishInterviewAnalysisReadyNotification =
    async ({
        userId,
        interviewId,
        company,
        role,
        sourceType,
        analysisCompletedAt,
    }: PublishInterviewAnalysisReadyInput) => {
        try {
            const completedAt =
                analysisCompletedAt instanceof
                    Date
                    ? analysisCompletedAt
                    : new Date(
                        analysisCompletedAt
                    );

            const completedAtIso =
                Number.isNaN(
                    completedAt.getTime()
                )
                    ? new Date().toISOString()
                    : completedAt.toISOString();

            /*
             * Every successful analysis or
             * re-analysis represents a separate
             * completion event.
             */
            const notification =
                await createNotification({
                    userId,

                    type:
                        NotificationType
                            .INTERVIEW_ANALYSIS_READY,

                    title:
                        "Interview AI analysis is ready",

                    message:
                        `Your ${company} ${role} interview has been analyzed. Review the scores, missed concepts, diagnosis, and next actions.`,

                    link:
                        `/interviews/${encodeURIComponent(
                            interviewId
                        )}`,

                    dedupeKey:
                        `INTERVIEW_ANALYSIS_READY:${interviewId}:${completedAtIso}`,

                    emailEligible:
                        false,

                    metadata: {
                        interviewId,
                        company,
                        role,
                        sourceType,
                        analysisCompletedAt:
                            completedAtIso,

                        source:
                            "interview-analysis",
                    },
                });

            const emitted =
                emitNotificationToUser(
                    userId,
                    toRealtimeNotification(
                        notification
                    )
                );

            return {
                notification,
                emitted,
            };
        } catch (error) {
            /*
             * A notification failure must not
             * convert a successful AI analysis
             * into a failed API response.
             */
            if (
                process.env.NODE_ENV !==
                "test"
            ) {
                console.error(
                    "Interview analysis notification failed:",
                    error
                );
            }

            return null;
        }
    };

