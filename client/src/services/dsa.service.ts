
import api from "./api";

export type DSADifficulty = "EASY" | "MEDIUM" | "HARD";

export type DSAStatus =
    | "UNSOLVED"
    | "ATTEMPTED"
    | "SOLVED";

export type DSAProblemSource =
    | "MANUAL"
    | "LEETCODE";

export type PatternCoverageStatus =
    | "STRONG"
    | "DEVELOPING"
    | "WEAK"
    | "NOT_STARTED";

export interface DSAProblem {
    id: string;
    userId: string;

    title: string;
    topic: string;
    pattern?: string | null;
    difficulty: DSADifficulty;
    status: DSAStatus;

    platform?: string | null;
    problemUrl?: string | null;

    source: DSAProblemSource;
    externalId?: string | null;
    importedAt?: string | null;

    companies: string[];
    notes?: string | null;

    solveCount: number;
    solvedAt?: string | null;

    revisionCount: number;
    lastRevisedAt?: string | null;
    nextRevisionAt?: string | null;

    createdAt: string;
    updatedAt: string;
}

export interface CreateDSAProblemInput {
    title: string;
    topic: string;
    pattern?: string;
    difficulty: DSADifficulty;
    status: DSAStatus;

    platform?: string;
    problemUrl?: string;

    companies?: string[];
    notes?: string;
}

export type UpdateDSAProblemInput =
    Partial<CreateDSAProblemInput>;

export interface DSAFilters {
    topic?: string;
    pattern?: string;
    difficulty?: DSADifficulty;
    status?: DSAStatus;
    company?: string;
    search?: string;
    revisionDue?: boolean;
}

export interface DSAStats {
    total: number;
    solved: number;
    attempted: number;
    unsolved: number;
    revisionDue: number;

    byTopic: Record<string, number>;
    byPattern: Record<string, number>;

    byDifficulty: {
        easy: number;
        medium: number;
        hard: number;
    };
}

export interface DSASolvingProgressBreakdown {
    solved: number;
    target: number;
    percentage: number;
    points: number;
    maxPoints: number;
}

export interface DSAPatternScoreBreakdown {
    coveredPatterns: number;
    totalPatterns: number;
    patterns: string[];
    percentage: number;
    points: number;
    maxPoints: number;
}

export interface DSARevisionScoreBreakdown {
    completed: number;
    completedOnTime: number;
    pendingOverdue: number;
    opportunities: number;
    consistencyPercentage: number;
    maturityPercentage: number;
    points: number;
    maxPoints: number;
}

export interface DSAScoreBreakdown {
    solvingProgress: DSASolvingProgressBreakdown;
    patternCoverage: DSAPatternScoreBreakdown;
    revisionDiscipline: DSARevisionScoreBreakdown;
}

export interface DSATopicProgress {
    topic: string;
    total: number;
    solved: number;
    attempted: number;
    unsolved: number;
    percentage: number;
}

export interface DSAPatternCoverage {
    pattern: string;
    total: number;
    solved: number;
    attempted: number;
    percentage: number;
    status: PatternCoverageStatus;
}

export interface DSARevisionQueueItem {
    id: string;
    title: string;
    topic: string;
    pattern?: string | null;
    difficulty: DSADifficulty;

    platform?: string | null;
    problemUrl?: string | null;
    companies: string[];

    revisionCount: number;
    solveCount: number;
    nextRevisionAt?: string | null;
    overdueDays: number;
}

export interface DSARevisionConsistency {
    completed: number;
    completedOnTime: number;
    completedLate: number;
    pendingOverdue: number;
    percentage: number;
}

export interface DSADifficultyDistribution {
    easy: {
        total: number;
        solved: number;
    };
    medium: {
        total: number;
        solved: number;
    };
    hard: {
        total: number;
        solved: number;
    };
}

export interface DSADailyTarget {
    newProblems: number;
    revisions: number;
    focusPatterns: string[];
}

export interface DSAAnalytics {
    dsaScore: number;
    scoreBreakdown: DSAScoreBreakdown;

    summary: {
        total: number;
        solved: number;
        attempted: number;
        unsolved: number;
        revisionDue: number;
        uniqueTopics: number;
        uniqueSolvedPatterns: number;
    };

    topicProgress: DSATopicProgress[];
    patternCoverage: DSAPatternCoverage[];

    weakTopics: DSATopicProgress[];
    weakPatterns: DSAPatternCoverage[];
    patternGaps: string[];

    revisionQueue: DSARevisionQueueItem[];
    revisionConsistency: DSARevisionConsistency;

    difficultyDistribution: DSADifficultyDistribution;
    dailyTarget: DSADailyTarget;
}

export interface DSARevision {
    id: string;
    problemId: string;
    scheduledFor?: string | null;
    completedAt: string;
    intervalDays: number;
    wasOverdue: boolean;
    createdAt: string;
}

export interface DSAProblemsResponse {
    problems: DSAProblem[];
    stats: DSAStats;
}

export interface DSAAnalyticsResponse {
    analytics: DSAAnalytics;
}

export interface DSARevisionQueueResponse {
    revisionQueue: DSARevisionQueueItem[];
    revisionConsistency: DSARevisionConsistency;
}

export interface DSAReviseResponse {
    message: string;
    problem: DSAProblem;
    revision: DSARevision;
}

export const dsaService = {
    getAll: (filters?: DSAFilters) =>
        api.get<DSAProblemsResponse>("/dsa", {
            params: filters,
        }),

    getAnalytics: () =>
        api.get<DSAAnalyticsResponse>("/dsa/analytics"),

    getRevisions: () =>
        api.get<DSARevisionQueueResponse>(
            "/dsa/revisions"
        ),

    add: (data: CreateDSAProblemInput) =>
        api.post<{
            message: string;
            problem: DSAProblem;
        }>("/dsa", data),

    update: (
        id: string,
        data: UpdateDSAProblemInput
    ) =>
        api.patch<{
            message: string;
            problem: DSAProblem;
        }>(`/dsa/${id}`, data),

    revise: (id: string) =>
        api.patch<DSAReviseResponse>(
            `/dsa/${id}/revise`
        ),

    delete: (id: string) =>
        api.delete<{
            message: string;
        }>(`/dsa/${id}`),

    getStreak: () =>
        api.get<{
            currentStreak: number;
            streaks: Array<{
                id: string;
                date: string;
                activity: string;
            }>;
        }>("/dsa/streak"),
};

export const readinessService = {
    getMe: () =>
        api.get("/readiness/me"),

    getHistory: () =>
        api.get("/readiness/history"),

    updateCompanies: (companies: string[]) =>
        api.patch("/readiness/companies", {
            companies,
        }),
};

export const dailyPlanService = {
    get: () =>
        api.get("/daily-plan"),

    regenerate: () =>
        api.post("/daily-plan/regenerate"),
};

