import api from "./api";

export type InterviewRoundType =
    | "HR"
    | "TECHNICAL"
    | "MANAGERIAL"
    | "APTITUDE"
    | "GROUP_DISCUSSION"
    | "SYSTEM_DESIGN"
    | "CODING"
    | "OTHER";

export type InterviewResult =
    | "PENDING"
    | "SELECTED"
    | "REJECTED"
    | "ON_HOLD"
    | "NO_RESPONSE";

export type InterviewSourceType = "MANUAL" | "AUDIO" | "VIDEO";

export interface InterviewReplay {
    id: string;
    company: string;
    role: string;
    roundType: InterviewRoundType;
    date: string;
    result: InterviewResult;
    sourceType: InterviewSourceType;

    audioUrl?: string | null;
    videoUrl?: string | null;
    transcript?: string | null;
    notes?: string | null;

    questionsAsked: string[];
    topics: string[];
    conceptsMissed: string[];

    whatWentWell?: string | null;
    whatWentWrong?: string | null;
    feedback?: string | null;

    overallScore?: number | null;
    confidenceScore?: number | null;
    communicationScore?: number | null;
    technicalScore?: number | null;

    aiSummary?: unknown;
    actionPlan?: string | null;
    nextActions: string[];
    analysisStatus: "DRAFT" | "ANALYZED";

    createdAt: string;
    updatedAt: string;
}

export interface CreateInterviewInput {
    company: string;
    role: string;
    roundType: InterviewRoundType;
    date: string;
    result: InterviewResult;

    questionsAsked: string[];
    topics: string[];
    conceptsMissed: string[];

    whatWentWell?: string;
    whatWentWrong?: string;
    feedback?: string;

    confidenceScore?: number | null;
    communicationScore?: number | null;
    technicalScore?: number | null;

    nextActions: string[];
}

export interface InterviewStats {
    totalInterviews: number;
    averageConfidenceScore: number;
    averageCommunicationScore: number;
    averageTechnicalScore: number;

    mostRepeatedTopics: {
        name: string;
        count: number;
    }[];

    mostMissedConcepts: {
        name: string;
        count: number;
    }[];

    companyBreakdown: {
        company: string;
        count: number;
    }[];

    resultBreakdown: {
        result: string;
        count: number;
    }[];

    roundBreakdown: {
        roundType: string;
        count: number;
    }[];

    recentInterviews: InterviewReplay[];
    nextActions: string[];
}

export const interviewService = {
    getAll: (filters?: {
        company?: string;
        roundType?: string;
        result?: string;
        search?: string;
    }) => api.get("/interviews", { params: filters }),

    getStats: () => api.get("/interviews/stats"),

    getById: (id: string) => api.get(`/interviews/${id}`),

    create: (data: CreateInterviewInput) => api.post("/interviews", data),

    update: (id: string, data: Partial<CreateInterviewInput>) =>
        api.put(`/interviews/${id}`, data),

    analyze: (id: string) => api.post(`/interviews/${id}/analyze`),

    delete: (id: string) => api.delete(`/interviews/${id}`),
};