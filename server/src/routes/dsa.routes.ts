import { Router } from "express";
import {
    addProblem,
    deleteProblem,
    getProblems,
    getStreak,
    updateProblem,
} from "../controllers/dsa.controller";
import {
    getAnalytics,
    getRevisionQueue,
    reviseProblem,
} from "../controllers/dsaAnalytics.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.use(protect);

router.get("/analytics", getAnalytics);
router.get("/revisions", getRevisionQueue);
router.get("/streak", getStreak);

router.get("/", getProblems);
router.post("/", addProblem);

router.patch("/:id/revise", reviseProblem);
router.put("/:id", updateProblem);
router.patch("/:id", updateProblem);
router.delete("/:id", deleteProblem);

export default router;