import { Router } from "express";

import {
    protect,
} from "../middlewares/auth.middleware";

import {
    addRoadmapSkillToProfile,
    addRoadmapTopicToDailyPlan,
    getRoadmapIntegrationStatus,
} from "../controllers/roadmap.controller";

const router = Router();

router.use(protect);

router.get(
    "/status",
    getRoadmapIntegrationStatus
);

router.post(
    "/daily-plan",
    addRoadmapTopicToDailyPlan
);

router.post(
    "/profile-skill",
    addRoadmapSkillToProfile
);

export default router;
