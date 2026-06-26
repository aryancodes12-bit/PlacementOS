import {
    Router,
} from "express";

import {
    protect,
} from "../middlewares/auth.middleware";

import {
    preventConcurrentInterviewProcessing,
} from "../middlewares/interviewProcessingLock.middleware";

import {
    analyzeInterviewWithAI,
    createAudioInterview,
    createChunkedInterview,
    createInterview,
    createVideoInterview,
    deleteInterview,
    getInterviewById,
    getInterviews,
    getInterviewStats,
    updateInterview,
} from "../controllers/interview.controller";

import {
    MAX_INTERVIEW_AUDIO_CHUNKS,
    upload,
    uploadInterviewAudioChunks,
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
    preventConcurrentInterviewProcessing,
    upload.single(
        "audio"
    ),
    createAudioInterview
);

router.post(
    "/video",
    preventConcurrentInterviewProcessing,
    uploadInterviewExtractedAudio.single(
        "audio"
    ),
    createVideoInterview
);

router.post(
    "/chunks",
    preventConcurrentInterviewProcessing,
    uploadInterviewAudioChunks.array(
        "chunks",
        MAX_INTERVIEW_AUDIO_CHUNKS
    ),
    createChunkedInterview
);

router.post(
    "/:id/analyze",
    preventConcurrentInterviewProcessing,
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