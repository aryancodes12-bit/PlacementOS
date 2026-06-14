import api from "./api";

export interface UserProfile {
    id: string;
    userId: string;
    skills: string[];
    targetCompanies: string[];
    bio?: string | null;
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    college?: string | null;
    graduationYear?: number | null;
}

export const profileService = {
    getMe: () => api.get("/profile/me"),
};