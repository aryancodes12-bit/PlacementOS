import { Router } from "express";

import {
    protect,
} from "../middlewares/auth.middleware";

import {
    addRoadmapSkillToProfile,
    addRoadmapTopicToDailyPlan,
} from "../controllers/roadmap.controller";

const router = Router();

router.use(protect);

router.post(
    "/daily-plan",
    addRoadmapTopicToDailyPlan
);

router.post(
    "/profile-skill",
    addRoadmapSkillToProfile
);

export default router;