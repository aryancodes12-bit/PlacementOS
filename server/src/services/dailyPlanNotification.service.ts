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

interface PublishDailyPlanReadyInput {
    userId: string;
    createdDate: string;
    plan?: DailyPlanNotificationPlan;
}

interface DailyPlanNotificationPlan {
    greeting?: unknown;
    focusMessage?: unknown;
    totalTime?: unknown;
    categories?: Array<{
        name?: unknown;
        icon?: unknown;
        color?: unknown;
        items?: Array<{
            task?: unknown;
            reason?: unknown;
            duration?: unknown;
        }>;
    }>;
}

const clampText = (
    value: unknown,
    fallback: string,
    maxLength: number
) => {
    const text =
        String(value || "")
            .replace(/\s+/g, " ")
            .trim();

    if (!text) {
        return fallback;
    }

    return text.length > maxLength
        ? `${text
            .slice(
                0,
                maxLength - 1
            )
            .trim()}.`
        : text;
};

const getFirstPlanTask = (
    plan: DailyPlanNotificationPlan | undefined
) => {
    return plan?.categories
        ?.flatMap(
            (category) =>
                category.items || []
        )
        .map((item) =>
            clampText(
                item.task,
                "",
                90
            )
        )
        .find(Boolean);
};

const buildDailyPlanNotificationMessage = (
    plan: DailyPlanNotificationPlan | undefined
) => {
    const focusMessage =
        clampText(
            plan?.focusMessage,
            "Today's focused preparation plan is ready.",
            120
        );

    const totalTime =
        typeof plan?.totalTime === "string"
            ? clampText(
                plan.totalTime,
                "",
                30
            )
            : "";

    const firstTask =
        getFirstPlanTask(plan);

    const timePrefix =
        totalTime
            ? `${totalTime} plan ready. `
            : "";

    const taskSuffix =
        firstTask
            ? ` Start with: ${firstTask}.`
            : "";

    return clampText(
        `${timePrefix}${focusMessage}${taskSuffix}`,
        "Your focused preparation plan is ready. Open Daily Plan to start with the highest-priority task.",
        240
    );
};

export const publishDailyPlanReadyNotification =
    async ({
        userId,
        createdDate,
        plan,
    }: PublishDailyPlanReadyInput) => {
        try {
            /*
             * One notification per user per
             * daily-plan date.
             *
             * createNotification uses the unique
             * userId + dedupeKey constraint, so
             * retries cannot create duplicates.
             */
            const notification =
                await createNotification({
                    userId,

                    type:
                        NotificationType
                            .DAILY_PLAN_READY,

                    title:
                        "Your Daily AI Plan is ready",

                    message:
                        buildDailyPlanNotificationMessage(
                            plan
                        ),

                    link:
                        "/daily-plan",

                    dedupeKey:
                        `DAILY_PLAN_READY:${createdDate}`,

                    emailEligible:
                        false,

                    metadata: {
                        createdDate,

                        source:
                            "daily-plan-generation",
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
             * Notification failure must never
             * make Daily Plan generation fail.
             */
            if (
                process.env.NODE_ENV !==
                "test"
            ) {
                console.error(
                    "Daily Plan ready notification failed:",
                    error
                );
            }

            return null;
        }
    };
