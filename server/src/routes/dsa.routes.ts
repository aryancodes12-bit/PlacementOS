import { Router } from "express";
import {
    addProblem,
    deleteProblem,
    getProblems,
    getStreak,
    updateProblem,
} from "../controllers/dsa.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.use(protect);

router.get("/", getProblems);
router.post("/", addProblem);
router.put("/:id", updateProblem);
router.delete("/:id", deleteProblem);
router.get("/streak", getStreak);

export default router;