import api from "./api";

export interface ResumeSectionFeedback {
    section: string;
    score: number;
    diagnosis: string;
    fixes: string[];
}

export interface ResumeProjectImprovement {
    projectName: string;
    problem: string;
    improvement: string;
    rewrittenBullet: string;
}

export interface ResumeKeywordGroups {
    technical: string[];
    tools: string[];
    roleSpecific: string[];
}

export interface ResumeAIAnalysis {
    atsScore: number;
    roleFitScore: number;
    keywordScore: number;
    projectScore: number;
    readabilityScore: number;

    summary: string;
    recruiterVerdict: string;

    topStrengths: string[];
    criticalIssues: string[];

    missingKeywords: ResumeKeywordGroups;

    sectionFeedback: ResumeSectionFeedback[];
    projectImprovements: ResumeProjectImprovement[];

    suggestedBullets: string[];
    actionPlan: string[];
}

export interface Resume {
    id: string;
    userId: string;

    fileUrl: string;
    fileName?: string | null;
    fileSize?: number | null;

    targetRole?: string | null;
    version: number;

    atsScore?: number | null;
    roleFitScore?: number | null;
    keywordScore?: number | null;
    projectScore?: number | null;
    readabilityScore?: number | null;

    extractedText?: string | null;
    aiAnalysis?: ResumeAIAnalysis | null;
    analysisStatus: "PENDING" | "ANALYZED" | "FAILED";

    createdAt: string;
    updatedAt: string;
}

export const resumeService = {
    getAll: () => api.get<{ resumes: Resume[] }>("/resume"),

    getLatest: () => api.get<{ resume: Resume | null }>("/resume/latest"),

    upload: (formData: FormData) => api.post("/resume", formData),

    viewPdf: (id: string) =>
        api.get(`/resume/${id}/view`, {
            responseType: "blob",
        }),

    delete: (id: string) => api.delete(`/resume/${id}`),
};