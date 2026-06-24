export interface CookieConsentPreferences {
    version: number;

    necessary: true;
    preferences: boolean;
    analytics: boolean;

    decidedAt: string;
}

export type OptionalCookieCategory =
    | "preferences"
    | "analytics";