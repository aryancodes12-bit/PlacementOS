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

export type InterviewQuestionStatus =
    | "SOLVED"
    | "PARTIAL"
    | "FAILED"
    | "SKIPPED";

export type InterviewSourceType =
    | "MANUAL"
    | "AUDIO"
    | "VIDEO";

export type InterviewAnalysisStatus =
    | "DRAFT"
    | "ANALYZED";

export interface InterviewQuestionReplay {
    id?: string;
    question: string;
    userAnswer?: string | null;
    missedPoints: string[];
    interviewerFeedback?: string | null;
    confidenceScore?: number | null;
    status: InterviewQuestionStatus;
}

export interface InterviewAiQuestionBreakdown {
    question: string;
    candidateAnswer?: string;
    expectedAnswerChecklist?: string[];
    missedPoints?: string[];
    likelyGap?: string;
    practiceTask?: string;
}

export interface InterviewAiSummary {
    summary?: string;
    executiveDiagnosis?: string;

    strengths?: string[];
    weaknesses?: string[];

    missedConcepts?: string[];
    repeatedRiskTopics?: string[];
    rootCauses?: string[];

    confidenceScore?: number | null;
    communicationScore?: number | null;
    technicalScore?: number | null;

    confidenceDiagnosis?: string;
    communicationDiagnosis?: string;
    technicalDiagnosis?: string;

    questionBreakdown?: InterviewAiQuestionBreakdown[];

    answerFramework?: string[];
    nextActions?: string[];
    revisionPlan?: string[];
    mockDrills?: string[];

    companyReadinessNote?: string;
    estimatedReadinessScore?: number | null;
}

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
    questionReplays?: InterviewQuestionReplay[];

    topics: string[];
    conceptsMissed: string[];

    whatWentWell?: string | null;
    whatWentWrong?: string | null;
    feedback?: string | null;

    overallScore?: number | null;
    confidenceScore?: number | null;
    communicationScore?: number | null;
    technicalScore?: number | null;

    aiSummary?: InterviewAiSummary | null;

    actionPlan?: string | null;
    nextActions: string[];

    analysisStatus: InterviewAnalysisStatus;

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
    questionReplays?: InterviewQuestionReplay[];

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

    mostRepeatedTopics: Array<{
        name: string;
        count: number;
    }>;

    mostMissedConcepts: Array<{
        name: string;
        count: number;
    }>;

    companyBreakdown: Array<{
        company: string;
        count: number;
    }>;

    resultBreakdown: Array<{
        result: string;
        count: number;
    }>;

    roundBreakdown: Array<{
        roundType: string;
        count: number;
    }>;

    recentInterviews: InterviewReplay[];
    nextActions: string[];
}

export interface InterviewFilters {
    company?: string;
    roundType?: string;
    result?: string;
    search?: string;
}

export interface InterviewsResponse {
    interviews: InterviewReplay[];
}

export interface InterviewResponse {
    interview: InterviewReplay;
}

export interface InterviewUploadResponse {
    message?: string;
    transcript?: string;
    analysis?: InterviewAiSummary;
    interview: InterviewReplay;
}

export const interviewService = {
    getAll: (filters?: InterviewFilters) =>
        api.get<InterviewsResponse>(
            "/interviews",
            {
                params: filters,
            }
        ),

    getStats: () =>
        api.get<InterviewStats>(
            "/interviews/stats"
        ),

    getById: (id: string) =>
        api.get<InterviewResponse>(
            `/interviews/${id}`
        ),

    create: (
        data: CreateInterviewInput
    ) =>
        api.post<InterviewResponse>(
            "/interviews",
            data
        ),

    uploadAudio: (
        data: FormData
    ) =>
        api.post<InterviewUploadResponse>(
            "/interviews/audio",
            data
        ),

    uploadVideo: (
        data: FormData
    ) =>
        api.post<InterviewUploadResponse>(
            "/interviews/video",
            data
        ),

    update: (
        id: string,
        data: Partial<CreateInterviewInput>
    ) =>
        api.put<InterviewResponse>(
            `/interviews/${id}`,
            data
        ),

    analyze: (id: string) =>
        api.post<InterviewResponse>(
            `/interviews/${id}/analyze`
        ),

    delete: (id: string) =>
        api.delete<{
            message?: string;
        }>(
            `/interviews/${id}`
        ),
};
