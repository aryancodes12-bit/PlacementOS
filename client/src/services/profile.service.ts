
import api from "./api";

export interface ProfileUser {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
    createdAt: string;
}

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

    user?: ProfileUser;
}

export interface UpdateProfileInput {
    skills: string[];
    targetCompanies: string[];
    bio: string;
    linkedinUrl: string;
    githubUrl: string;
    college: string;
    graduationYear: number | null;
}

export interface ProfileResponse {
    success: boolean;
    message?: string;

    data: {
        profile: UserProfile | null;
        readiness?: unknown;
    };
}

export const profileService = {
    getMe: () =>
        api.get<ProfileResponse>("/profile/me"),

    updateMe: (data: UpdateProfileInput) =>
        api.put<ProfileResponse>("/profile/me", data),
};

