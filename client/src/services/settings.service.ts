
import api from "./api";

export type FeedbackType =
    | "BUG_REPORT"
    | "FEATURE_REQUEST"
    | "SUGGESTION"
    | "CONTACT_OWNER"
    | "OTHER";

export interface SettingsAccount {
    id: string;
    name: string;
    email: string;
    role: string;
    plan: "FREE" | "PREMIUM";
    avatarUrl?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface SettingsDataSummary {
    dsaProblems: number;
    revisions: number;
    resumes: number;
    interviews: number;
    dailyPlans: number;
    readinessHistory: number;
    payments: number;
    feedback: number;
}

export interface SettingsPrivacy {
    databaseDeletionSupported: boolean;
    cloudMediaCleanupSupported: boolean;
    externalPaymentRecordsControlledByProvider: boolean;
}

export interface SettingsOverview {
    account: SettingsAccount;
    dataSummary: SettingsDataSummary;
    privacy: SettingsPrivacy;

    support: {
        email: string;
    };
}

export interface SettingsOverviewResponse {
    success: boolean;

    data: SettingsOverview;
}

export interface SubmitFeedbackInput {
    type: FeedbackType;
    subject: string;
    message: string;
    rating?: number | null;
    pageUrl?: string;
}

export interface FeedbackResponse {
    success: boolean;
    message: string;

    data: {
        feedback: {
            id: string;
            type: FeedbackType;
            status: "OPEN" | "REVIEWED" | "RESOLVED";
            subject: string;
            rating?: number | null;
            createdAt: string;
        };
    };
}

export interface DeleteAccountResponse {
    success: boolean;
    message: string;
}

export const settingsService = {
    getOverview: () =>
        api.get<SettingsOverviewResponse>(
            "/settings/overview"
        ),

    submitFeedback: (
        data: SubmitFeedbackInput
    ) =>
        api.post<FeedbackResponse>(
            "/settings/feedback",
            data
        ),

    deleteAccount: () =>
        api.delete<DeleteAccountResponse>(
            "/settings/account",
            {
                data: {
                    confirm: true,
                },
            }
        ),
};

