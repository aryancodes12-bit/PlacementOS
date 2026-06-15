import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import {
    analyzeInterviewWithAI,
    createInterview,
    deleteInterview,
    getInterviewById,
    getInterviews,
    getInterviewStats,
    updateInterview,
    createAudioInterview,
    createVideoInterview,
} from "../controllers/interview.controller";
import { upload } from "../middlewares/upload.middleware";
const router = Router();

router.use(protect);

router.get("/stats", getInterviewStats);
router.get("/", getInterviews);
router.post("/", createInterview);
router.post("/audio", upload.single("audio"), createAudioInterview);
router.post("/video", upload.single("video"), createVideoInterview);
router.post("/:id/analyze", analyzeInterviewWithAI);
router.get("/:id", getInterviewById);
router.put("/:id", updateInterview);
router.delete("/:id", deleteInterview);

export default router;