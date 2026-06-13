import api from './api'

export interface DSAProblem {
    id: string
    title: string
    topic: string
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    status: 'UNSOLVED' | 'ATTEMPTED' | 'SOLVED'
    platform?: string
    notes?: string
    solvedAt?: string
    createdAt: string
}

export interface DSAStats {
    total: number
    solved: number
    attempted: number
    unsolved: number
    byTopic: Record<string, number>
    byDifficulty: { easy: number; medium: number; hard: number }
}

export const dsaService = {
    getAll: (filters?: {
        topic?: string; difficulty?: string
        status?: string; search?: string
    }) => api.get('/dsa', { params: filters }),

    add: (data: Partial<DSAProblem>) =>
        api.post('/dsa', data),

    update: (id: string, data: Partial<DSAProblem>) =>
        api.put(`/dsa/${id}`, data),

    delete: (id: string) =>
        api.delete(`/dsa/${id}`),

    getStreak: () =>
        api.get('/dsa/streak'),
}

export const readinessService = {
    getMe: () => api.get('/readiness/me'),
}