
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

interface PublishResumeAnalysisReadyInput {
    userId: string;
    resumeId: string;
    fileName: string;
    targetRole: string | null;
    atsScore: number;
}

export const publishResumeAnalysisReadyNotification =
    async ({
        userId,
        resumeId,
        fileName,
        targetRole,
        atsScore,
    }: PublishResumeAnalysisReadyInput) => {
        try {
            /*
             * Every uploaded resume receives a
             * unique ID, so this dedupe key prevents
             * accidental duplicate publication for
             * the same completed analysis.
             */
            const notification =
                await createNotification({
                    userId,

                    type:
                        NotificationType
                            .RESUME_ANALYSIS_READY,

                    title:
                        "Resume AI analysis is ready",

                    message:
                        targetRole
                            ? `${fileName} has been analyzed for ${targetRole}. Your current ATS score is ${atsScore}/100.`
                            : `${fileName} has been analyzed. Your current ATS score is ${atsScore}/100.`,

                    link:
                        "/resume",

                    dedupeKey:
                        `RESUME_ANALYSIS_READY:${resumeId}`,

                    emailEligible:
                        false,

                    metadata: {
                        resumeId,
                        fileName,
                        targetRole,
                        atsScore,

                        source:
                            "resume-analysis",
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
             * Notification delivery must not turn
             * a successful resume upload and AI
             * analysis into a failed API response.
             */
            if (
                process.env.NODE_ENV !==
                "test"
            ) {
                console.error(
                    "Resume analysis notification failed:",
                    error
                );
            }

            return null;
        }
    };

