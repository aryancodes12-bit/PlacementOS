import {
    timingSafeEqual,
} from "crypto";

import type {
    Request,
    Response,
} from "express";

import {
    runNotificationAutomation,
} from "../services/notificationAutomation.service";

let automationRunning = false;

const secureCompare = (
    receivedValue: string,
    expectedValue: string
): boolean => {
    const receivedBuffer =
        Buffer.from(receivedValue);

    const expectedBuffer =
        Buffer.from(expectedValue);

    if (
        receivedBuffer.length !==
        expectedBuffer.length
    ) {
        return false;
    }

    return timingSafeEqual(
        receivedBuffer,
        expectedBuffer
    );
};

const getConfiguredJobSecret = () => {
    const secret =
        process.env
            .NOTIFICATION_JOB_SECRET
            ?.trim();

    if (!secret) {
        throw new Error(
            "NOTIFICATION_JOB_SECRET is not configured."
        );
    }

    return secret;
};

const getRequestSecret = (
    req: Request
): string => {
    const headerValue =
        req.headers[
        "x-notification-job-secret"
        ];

    if (
        typeof headerValue ===
        "string"
    ) {
        return headerValue.trim();
    }

    if (
        Array.isArray(headerValue)
    ) {
        return (
            headerValue[0]?.trim() ??
            ""
        );
    }

    return "";
};

const parseNowOverride = (
    value: unknown
):
    | {
        success: true;
        now: Date;
    }
    | {
        success: false;
        message: string;
    } => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return {
            success: true,
            now: new Date(),
        };
    }

    if (
        process.env.NODE_ENV ===
        "production"
    ) {
        return {
            success: false,
            message:
                "Custom automation time is disabled in production.",
        };
    }

    if (
        typeof value !== "string"
    ) {
        return {
            success: false,
            message:
                "now must be a valid ISO date string.",
        };
    }

    const now =
        new Date(value);

    if (
        Number.isNaN(
            now.getTime()
        )
    ) {
        return {
            success: false,
            message:
                "now must be a valid ISO date string.",
        };
    }

    return {
        success: true,
        now,
    };
};

export const runNotificationAutomationController =
    async (
        req: Request,
        res: Response
    ) => {
        res.setHeader(
            "Cache-Control",
            "no-store"
        );

        let expectedSecret:
            string;

        try {
            expectedSecret =
                getConfiguredJobSecret();
        } catch (error) {
            console.error(
                "Notification automation configuration error:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Notification automation is not configured.",
                });
        }

        const requestSecret =
            getRequestSecret(req);

        if (
            !requestSecret ||
            !secureCompare(
                requestSecret,
                expectedSecret
            )
        ) {
            return res
                .status(401)
                .json({
                    success: false,
                    message:
                        "Invalid notification job secret.",
                });
        }

        if (automationRunning) {
            return res
                .status(409)
                .json({
                    success: false,
                    message:
                        "Notification automation is already running.",
                });
        }

        const parsedNow =
            parseNowOverride(
                req.body?.now
            );

        if (!parsedNow.success) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        parsedNow.message,
                });
        }

        automationRunning = true;

        try {
            const summary =
                await runNotificationAutomation(
                    parsedNow.now
                );

            return res
                .status(200)
                .json({
                    success: true,

                    message:
                        "Notification automation completed.",

                    data: {
                        summary,
                    },
                });
        } catch (error) {
            console.error(
                "Notification automation failure:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Notification automation failed.",
                });
        } finally {
            automationRunning =
                false;
        }
    };