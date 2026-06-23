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
    protect,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(protect);

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

router.patch(
    "/:id/read",
    markRead
);

export default router;