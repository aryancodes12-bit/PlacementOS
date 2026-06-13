import api from "./api";

export type DSADifficulty = "EASY" | "MEDIUM" | "HARD";
export type DSAStatus = "UNSOLVED" | "ATTEMPTED" | "SOLVED";

export interface DSAProblem {
    id: string;
    title: string;
    topic: string;
    difficulty: DSADifficulty;
    status: DSAStatus;
    platform?: string | null;
    problemUrl?: string | null;
    notes?: string | null;
    solvedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDSAProblemInput {
    title: string;
    topic: string;
    difficulty: DSADifficulty;
    status: DSAStatus;
    platform?: string;
    problemUrl?: string;
    notes?: string;
}

export interface DSAStats {
    total: number;
    solved: number;
    attempted: number;
    unsolved: number;
    byTopic: Record<string, number>;
    byDifficulty: {
        easy: number;
        medium: number;
        hard: number;
    };
}

export const dsaService = {
    getAll: (filters?: {
        topic?: string;
        difficulty?: string;
        status?: string;
        search?: string;
    }) => api.get("/dsa", { params: filters }),

    add: (data: CreateDSAProblemInput) => api.post("/dsa", data),

    update: (id: string, data: Partial<CreateDSAProblemInput>) =>
        api.put(`/dsa/${id}`, data),

    delete: (id: string) => api.delete(`/dsa/${id}`),

    getStreak: () => api.get("/dsa/streak"),
};

export const readinessService = {
    getMe: () => api.get("/readiness/me"),
};