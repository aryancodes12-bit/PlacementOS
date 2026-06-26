import {
    isAxiosError,
} from "axios";

import type {
    InterviewAiSummary,
    InterviewQuestionReplay,
    InterviewReplay,
    InterviewResult,
    InterviewRoundType,
} from "../../services/interview.service";

interface ApiErrorResponse {
    message?: string;
}

export const INTERVIEW_ROUND_TYPES: InterviewRoundType[] = [
    "HR",
    "TECHNICAL",
    "MANAGERIAL",
    "APTITUDE",
    "GROUP_DISCUSSION",
    "SYSTEM_DESIGN",
    "CODING",
    "OTHER",
];

export const INTERVIEW_RESULTS: InterviewResult[] = [
    "PENDING",
    "SELECTED",
    "REJECTED",
    "ON_HOLD",
    "NO_RESPONSE",
];

export const MAX_INTERVIEW_AUDIO_SIZE_BYTES =
    50 * 1024 * 1024;

export const formatInterviewEnum = (
    value: string
) => {
    return value
        .toLowerCase()
        .split("_")
        .map(
            (part) =>
                part.charAt(0).toUpperCase() +
                part.slice(1)
        )
        .join(" ");
};

export const formatInterviewDate = (
    value: string
) => {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Unknown date";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
        }
    );
};

export const formatMediaSize = (
    size: number
) => {
    return `${(
        size /
        1024 /
        1024
    ).toFixed(2)} MB`;
};

export const toInterviewArray = (
    value: string
) => {
    return value
        .split(/[\n,]/)
        .map(
            (item) =>
                item.trim()
        )
        .filter(Boolean);
};

export const toInterviewScore = (
    value: string
) => {
    if (!value.trim()) {
        return null;
    }

    const score =
        Number(value);

    if (
        Number.isNaN(score)
    ) {
        return null;
    }

    return Math.min(
        10,
        Math.max(
            0,
            score
        )
    );
};

export const getInterviewApiError = (
    error: unknown,
    fallback: string
) => {
    if (
        isAxiosError<ApiErrorResponse>(
            error
        )
    ) {
        return (
            error.response
                ?.data
                ?.message ||
            fallback
        );
    }

    if (
        error instanceof Error &&
        error.message
    ) {
        return error.message;
    }

    return fallback;
};

export const getInterviewResultClasses = (
    result: InterviewResult
) => {
    switch (result) {
        case "SELECTED":
            return "border-success/20 bg-success/10 text-success";

        case "REJECTED":
            return "border-danger/20 bg-danger/10 text-danger";

        case "ON_HOLD":
            return "border-warning/20 bg-warning/10 text-warning";

        case "NO_RESPONSE":
            return "border-border bg-bg-tertiary text-text-secondary";

        default:
            return "border-brand/20 bg-brand/10 text-[#A5B4FC]";
    }
};

export const getInterviewScoreTone = (
    score?: number | null
) => {
    if (
        typeof score !==
        "number"
    ) {
        return {
            label: "No data",
            textClass:
                "text-text-tertiary",
            barClass:
                "bg-text-tertiary",
            badgeClass:
                "border-border bg-bg-tertiary text-text-tertiary",
        };
    }

    if (score >= 8) {
        return {
            label: "Strong",
            textClass:
                "text-success",
            barClass:
                "bg-success",
            badgeClass:
                "border-success/20 bg-success/10 text-success",
        };
    }

    if (score >= 6) {
        return {
            label: "Average",
            textClass:
                "text-[#A5B4FC]",
            barClass:
                "bg-brand",
            badgeClass:
                "border-brand/20 bg-brand/10 text-[#A5B4FC]",
        };
    }

    return {
        label: "Needs work",
        textClass:
            "text-danger",
        barClass:
            "bg-danger",
        badgeClass:
            "border-danger/20 bg-danger/10 text-danger",
    };
};

const averageScores = (
    scores: number[]
) => {
    if (
        scores.length === 0
    ) {
        return null;
    }

    return Number(
        (
            scores.reduce(
                (total, score) =>
                    total + score,
                0
            ) /
            scores.length
        ).toFixed(1)
    );
};

const getDerivedConfidence = (
    questions: InterviewQuestionReplay[]
) => {
    return averageScores(
        questions
            .map(
                (question) =>
                    question.confidenceScore
            )
            .filter(
                (
                    score
                ): score is number =>
                    typeof score ===
                    "number"
            )
    );
};

const getDerivedTechnical = (
    questions: InterviewQuestionReplay[]
) => {
    const statusScores: Record<
        InterviewQuestionReplay["status"],
        number
    > = {
        SOLVED: 9,
        PARTIAL: 5,
        FAILED: 2,
        SKIPPED: 0,
    };

    return averageScores(
        questions.map(
            (question) =>
                statusScores[
                question.status
                ]
        )
    );
};

export const getInterviewDisplayScores = (
    interview: InterviewReplay
) => {
    const ai:
        | InterviewAiSummary
        | null
        | undefined =
        interview.aiSummary;

    const questions =
        interview.questionReplays ??
        [];

    return {
        confidence:
            interview.confidenceScore ??
            ai?.confidenceScore ??
            getDerivedConfidence(
                questions
            ),

        communication:
            interview.communicationScore ??
            ai?.communicationScore ??
            null,

        technical:
            interview.technicalScore ??
            ai?.technicalScore ??
            getDerivedTechnical(
                questions
            ),
    };
};

export const validateInterviewMedia = (
    file: File,
    type:
        | "audio"
        | "video"
) => {
    if (
        file.size === 0
    ) {
        return "The selected file is empty.";
    }

    const fileName =
        file.name
            .trim()
            .toLowerCase();

    if (
        type ===
        "audio"
    ) {
        if (
            file.size >
            MAX_INTERVIEW_AUDIO_SIZE_BYTES
        ) {
            return "Audio file size must be below 50 MB.";
        }

        const supported =
            file.type.startsWith(
                "audio/"
            ) ||
            [
                ".mp3",
                ".wav",
                ".m4a",
                ".webm",
                ".ogg",
            ].some(
                (extension) =>
                    fileName.endsWith(
                        extension
                    )
            );

        return supported
            ? null
            : "Use an MP3, WAV, M4A, WEBM, or OGG audio file.";
    }

    const supported =
        file.type.startsWith(
            "video/"
        ) ||
        [
            ".mp4",
            ".webm",
            ".mov",
        ].some(
            (extension) =>
                fileName.endsWith(
                    extension
                )
        );

    return supported
        ? null
        : "Use an MP4, WEBM, or MOV video file.";
};