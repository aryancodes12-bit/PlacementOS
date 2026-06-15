import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import {
    deleteResume,
    getLatestResume,
    getResumes,
    uploadResume,
    viewResumePdf,
} from "../controllers/resume.controller";

const router = Router();

router.use(protect);

router.get("/", getResumes);
router.get("/latest", getLatestResume);
router.post("/", upload.single("resume"), uploadResume);
router.get("/:id/view", viewResumePdf);
router.delete("/:id", deleteResume);

export default router;