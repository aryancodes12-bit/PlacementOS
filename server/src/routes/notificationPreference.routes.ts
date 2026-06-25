
import {
    Router,
} from "express";

import {
    getNotificationPreference,
    updateNotificationPreferences,
} from "../controllers/notificationPreference.controller";

import {
    protect,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(protect);

router.get(
    "/",
    getNotificationPreference
);

router.patch(
    "/",
    updateNotificationPreferences
);

export default router;

