import {
    Router,
} from "express";

import {
    runNotificationAutomationController,
} from "../controllers/notificationAutomation.controller";

const router = Router();

router.post(
    "/run",
    runNotificationAutomationController
);

export default router;