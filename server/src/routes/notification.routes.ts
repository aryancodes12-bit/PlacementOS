
import {
    clearReadNotifications,
    deleteNotification,
} from "../controllers/notificationDeletion.controller";

import {
    maybeCleanupExpiredNotifications,
} from "../services/notificationDeletion.service";










import {
    Router,
} from "express";

import {
    getNotifications,
    getUnreadCount,
    markAllRead,
    markRead,
} from "../controllers/notification.controller";

import {
    createTestNotification,
} from "../controllers/notification.dev.controller";

import {
    protect,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(protect);
router.use(
    async (
        _req,
        _res,
        next
    ) => {
        try {
            await maybeCleanupExpiredNotifications();
        } catch (error) {
            /*
             * Retention cleanup failure must not
             * block normal notification requests.
             */
            if (
                process.env.NODE_ENV !==
                "test"
            ) {
                console.error(
                    "Notification retention cleanup failed:",
                    error
                );
            }
        }

        next();
    }
);
router.get(
    "/",
    getNotifications
);

router.get(
    "/unread-count",
    getUnreadCount
);

router.patch(
    "/read-all",
    markAllRead
);
router.delete(
    "/read",
    clearReadNotifications
);

router.delete(
    "/:id",
    deleteNotification
);

router.patch(
    "/:id/read",
    markRead
);

/*
 * This endpoint is mounted only outside
 * production and cannot be used on the
 * deployed production server.
 */
if (
    process.env.NODE_ENV !==
    "production"
) {
    router.post(
        "/test",
        createTestNotification
    );
}

router.patch(
    "/:id/read",
    markRead
);

export default router;

