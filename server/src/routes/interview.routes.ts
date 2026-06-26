import {
    Router,
} from "express";

import {
    protect,
    MAX_INTERVIEW_AUDIO_CHUNKS,
    uploadInterviewAudioChunks,
} from "../middlewares/auth.middleware";

import {
    analyzeInterviewWithAI,
    createAudioInterview,
    createInterview,
    createVideoInterview,
    deleteInterview,
    getInterviewById,
    getInterviews,
    getInterviewStats,
    updateInterview,
    createChunkedInterview,
} from "../controllers/interview.controller";

import {
    upload,
    uploadInterviewExtractedAudio,
} from "../middlewares/upload.middleware";

const router =
    Router();

router.use(
    protect
);

router.get(
    "/stats",
    getInterviewStats
);

router.get(
    "/",
    getInterviews
);

router.post(
    "/",
    createInterview
);

router.post(
    "/audio",
    upload.single(
        "audio"
    ),
    createAudioInterview
);

router.post(
    "/video",
    uploadInterviewExtractedAudio.single(
        "audio"
    ),
    createVideoInterview
);
router.post(
    "/chunks",
    uploadInterviewAudioChunks.array(
        "chunks",
        MAX_INTERVIEW_AUDIO_CHUNKS
    ),
    createChunkedInterview
);
router.post(
    "/:id/analyze",
    analyzeInterviewWithAI
);

router.get(
    "/:id",
    getInterviewById
);

router.put(
    "/:id",
    updateInterview
);

router.delete(
    "/:id",
    deleteInterview
);

export default router;