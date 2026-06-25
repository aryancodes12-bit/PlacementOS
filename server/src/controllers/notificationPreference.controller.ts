
import type {
    Response,
} from "express";

import type {
    AuthRequest,
} from "../middlewares/auth.middleware";

import {
    getOrCreateNotificationPreference,
    type NotificationPreferencePatch,
    updateNotificationPreference,
} from "../services/notificationPreference.service";

const ALLOWED_FIELDS = new Set([
    "emailDigestEnabled",
    "streakRiskEnabled",
    "dsaRevisionEnabled",
    "resumeStaleEnabled",
    "interviewInactiveEnabled",
    "digestHour",
    "digestMinute",
    "timezone",
]);

const BOOLEAN_FIELDS = [
    "emailDigestEnabled",
    "streakRiskEnabled",
    "dsaRevisionEnabled",
    "resumeStaleEnabled",
    "interviewInactiveEnabled",
] as const;

const isValidTimezone = (
    timezone: string
): boolean => {
    try {
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone:
                    timezone,
            }
        ).format(new Date());

        return true;
    } catch {
        return false;
    }
};

const parsePreferencePatch = (
    value: unknown
):
    | {
        success: true;
        data: NotificationPreferencePatch;
    }
    | {
        success: false;
        message: string;
    } => {
    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        return {
            success: false,
            message:
                "Request body must be an object.",
        };
    }

    const body =
        value as Record<
            string,
            unknown
        >;

    const unexpectedFields =
        Object.keys(body).filter(
            (field) =>
                !ALLOWED_FIELDS.has(
                    field
                )
        );

    if (
        unexpectedFields.length > 0
    ) {
        return {
            success: false,
            message:
                `Unsupported preference field: ${unexpectedFields[0]}.`,
        };
    }

    const patch:
        NotificationPreferencePatch = {};

    for (
        const field
        of BOOLEAN_FIELDS
    ) {
        if (
            body[field] ===
            undefined
        ) {
            continue;
        }

        if (
            typeof body[field] !==
            "boolean"
        ) {
            return {
                success: false,
                message:
                    `${field} must be a boolean.`,
            };
        }

        patch[field] =
            body[field];
    }

    if (
        body.digestHour !==
        undefined
    ) {
        if (
            !Number.isInteger(
                body.digestHour
            ) ||
            Number(
                body.digestHour
            ) < 0 ||
            Number(
                body.digestHour
            ) > 23
        ) {
            return {
                success: false,
                message:
                    "digestHour must be an integer between 0 and 23.",
            };
        }

        patch.digestHour =
            Number(
                body.digestHour
            );
    }

    if (
        body.digestMinute !==
        undefined
    ) {
        if (
            !Number.isInteger(
                body.digestMinute
            ) ||
            Number(
                body.digestMinute
            ) < 0 ||
            Number(
                body.digestMinute
            ) > 59
        ) {
            return {
                success: false,
                message:
                    "digestMinute must be an integer between 0 and 59.",
            };
        }

        patch.digestMinute =
            Number(
                body.digestMinute
            );
    }

    if (
        body.timezone !==
        undefined
    ) {
        if (
            typeof body.timezone !==
            "string"
        ) {
            return {
                success: false,
                message:
                    "timezone must be a string.",
            };
        }

        const timezone =
            body.timezone.trim();

        if (
            !timezone ||
            timezone.length > 100 ||
            !isValidTimezone(
                timezone
            )
        ) {
            return {
                success: false,
                message:
                    "Provide a valid IANA timezone such as Asia/Kolkata.",
            };
        }

        patch.timezone =
            timezone;
    }

    if (
        Object.keys(patch)
            .length === 0
    ) {
        return {
            success: false,
            message:
                "Provide at least one notification preference.",
        };
    }

    return {
        success: true,
        data: patch,
    };
};

export const getNotificationPreference =
    async (
        req: AuthRequest,
        res: Response
    ) => {
        try {
            const userId =
                req.user!.id;

            const preferences =
                await getOrCreateNotificationPreference(
                    userId
                );

            return res
                .status(200)
                .json({
                    success: true,

                    data: {
                        preferences,
                    },
                });
        } catch (error) {
            console.error(
                "Get notification preferences error:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,

                    message:
                        "Failed to load notification preferences.",
                });
        }
    };

export const updateNotificationPreferences =
    async (
        req: AuthRequest,
        res: Response
    ) => {
        try {
            const parsed =
                parsePreferencePatch(
                    req.body
                );

            if (!parsed.success) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            parsed.message,
                    });
            }

            const userId =
                req.user!.id;

            const preferences =
                await updateNotificationPreference(
                    userId,
                    parsed.data
                );

            return res
                .status(200)
                .json({
                    success: true,

                    message:
                        "Notification preferences updated.",

                    data: {
                        preferences,
                    },
                });
        } catch (error) {
            console.error(
                "Update notification preferences error:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,

                    message:
                        "Failed to update notification preferences.",
                });
        }
    };

