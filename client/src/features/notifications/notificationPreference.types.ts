
export interface NotificationPreference {
    id: string;
    userId: string;

    emailDigestEnabled: boolean;

    streakRiskEnabled: boolean;
    dsaRevisionEnabled: boolean;
    resumeStaleEnabled: boolean;
    interviewInactiveEnabled: boolean;

    digestHour: number;
    digestMinute: number;
    timezone: string;

    lastDigestDate: string | null;
    lastDigestSentAt: string | null;

    createdAt: string;
    updatedAt: string;
}

export interface NotificationPreferenceUpdate {
    emailDigestEnabled: boolean;

    streakRiskEnabled: boolean;
    dsaRevisionEnabled: boolean;
    resumeStaleEnabled: boolean;
    interviewInactiveEnabled: boolean;

    digestHour: number;
    digestMinute: number;
    timezone: string;
}

export interface NotificationPreferenceResponse {
    success: boolean;
    message?: string;

    data: {
        preferences: NotificationPreference;
    };
}
