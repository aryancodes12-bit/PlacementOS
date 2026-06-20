import { Router } from "express";

import { protect } from "../middlewares/auth.middleware";

import {
    deleteMyAccount,
    getSettingsOverview,
    submitFeedback,
} from "../controllers/settings.controller";

const router = Router();

router.use(protect);

router.get("/overview", getSettingsOverview);
router.post("/feedback", submitFeedback);
router.delete("/account", deleteMyAccount);

export default router;