import type {
    NextFunction,
    Response,
} from "express";

import type {
    AuthRequest,
} from "./auth.middleware";

const activeInterviewProcessingUsers =
    new Set<string>();

export const preventConcurrentInterviewProcessing = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const userId =
        req.user?.id;

    if (!userId) {
        return res
            .status(401)
            .json({
                message:
                    "Authentication is required.",
            });
    }

    if (
        activeInterviewProcessingUsers.has(
            userId
        )
    ) {
        return res
            .status(409)
            .json({
                code:
                    "INTERVIEW_PROCESSING_IN_PROGRESS",

                message:
                    "Another interview is already being processed. Please wait for it to finish.",
            });
    }

    activeInterviewProcessingUsers.add(
        userId
    );

    let released =
        false;

    const releaseLock =
        () => {
            if (released) {
                return;
            }

            released =
                true;

            activeInterviewProcessingUsers.delete(
                userId
            );

            res.off(
                "finish",
                releaseLock
            );

            res.off(
                "close",
                releaseLock
            );
        };

    res.once(
        "finish",
        releaseLock
    );

    res.once(
        "close",
        releaseLock
    );

    try {
        next();
    } catch (error) {
        releaseLock();
        throw error;
    }
};