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
import {
    importFromLeetCode,
    previewLeetCode,
} from "../controllers/leetcode.controller";

const router = Router();

router.use(protect);
router.get("/analytics", getAnalytics);
router.get("/revisions", getRevisionQueue);
router.get("/streak", getStreak);

router.post(
    "/leetcode/preview",
    previewLeetCode
);

router.get("/", getProblems);
router.post("/", addProblem);

router.patch(
    "/:id/revise",
    reviseProblem
);
router.post(
    "/leetcode/preview",
    previewLeetCode
);

router.post(
    "/leetcode/import",
    importFromLeetCode
);
router.put("/:id", updateProblem);
router.patch("/:id", updateProblem);
router.delete("/:id", deleteProblem);

export default router;