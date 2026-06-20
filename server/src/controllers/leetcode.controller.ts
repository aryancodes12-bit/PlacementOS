import { Response } from "express";

import type { AuthRequest } from "../middlewares/auth.middleware";

import {
    getLeetCodePreview,
    importLeetCodeProblems,
    LeetCodeServiceError,
} from "../services/leetcode.service";

const handleLeetCodeError = (
    error: unknown,
    res: Response,
    fallbackMessage: string,
    fallbackCode: string
) => {
    if (error instanceof LeetCodeServiceError) {
        return res
            .status(error.statusCode)
            .json({
                message: error.message,
                code: error.code,
            });
    }

    console.error(fallbackCode, error);

    return res.status(500).json({
        message: fallbackMessage,
        code: fallbackCode,
    });
};

export const previewLeetCode = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId = req.user!.id;

        const username = String(
            req.body?.username ?? ""
        );

        const requestedLimit =
            req.body?.limit === undefined
                ? undefined
                : Number(req.body.limit);

        const preview =
            await getLeetCodePreview(
                userId,
                username,
                requestedLimit
            );

        return res.json({
            preview,
        });
    } catch (error) {
        return handleLeetCodeError(
            error,
            res,
            "Failed to preview LeetCode submissions.",
            "LEETCODE_PREVIEW_FAILED"
        );
    }
};

export const importFromLeetCode = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId = req.user!.id;

        const username = String(
            req.body?.username ?? ""
        );

        const result =
            await importLeetCodeProblems(
                userId,
                username,
                req.body?.items
            );

        return res.status(201).json({
            message:
                result.summary.imported > 0
                    ? `${result.summary.imported} LeetCode problem${result.summary.imported === 1
                        ? ""
                        : "s"
                    } imported successfully.`
                    : "No new LeetCode problems were imported.",

            ...result,
        });
    } catch (error) {
        return handleLeetCodeError(
            error,
            res,
            "Failed to import LeetCode problems.",
            "LEETCODE_IMPORT_FAILED"
        );
    }
};