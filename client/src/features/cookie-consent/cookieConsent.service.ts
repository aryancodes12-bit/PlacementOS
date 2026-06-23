import type {
    CookieConsentPreferences,
} from "./cookieConsent.types";

const COOKIE_NAME =
    "placementos_cookie_consent";

const CONSENT_VERSION = 1;

const COOKIE_MAX_AGE_SECONDS =
    180 * 24 * 60 * 60;

export const COOKIE_CONSENT_CHANGED_EVENT =
    "placementos:cookie-consent-changed";

export const OPEN_COOKIE_SETTINGS_EVENT =
    "placementos:open-cookie-settings";

const isConsentPreferences = (
    value: unknown
): value is CookieConsentPreferences => {
    if (
        !value ||
        typeof value !== "object"
    ) {
        return false;
    }

    const consent =
        value as Partial<CookieConsentPreferences>;

    return (
        consent.version ===
        CONSENT_VERSION &&
        consent.necessary === true &&
        typeof consent.preferences ===
        "boolean" &&
        typeof consent.analytics ===
        "boolean" &&
        typeof consent.decidedAt ===
        "string"
    );
};

const getCookieValue = (
    name: string
): string | null => {
    const prefix =
        `${encodeURIComponent(name)}=`;

    const cookieParts =
        document.cookie
            .split(";")
            .map((cookie) =>
                cookie.trim()
            );

    const match =
        cookieParts.find((cookie) =>
            cookie.startsWith(prefix)
        );

    if (!match) {
        return null;
    }

    return match.slice(
        prefix.length
    );
};

export const getCookieConsent =
    (): CookieConsentPreferences | null => {
        try {
            const encodedValue =
                getCookieValue(
                    COOKIE_NAME
                );

            if (!encodedValue) {
                return null;
            }

            const decodedValue =
                decodeURIComponent(
                    encodedValue
                );

            const parsed =
                JSON.parse(decodedValue);

            return isConsentPreferences(
                parsed
            )
                ? parsed
                : null;
        } catch {
            return null;
        }
    };

export const saveCookieConsent = (
    preferences: Pick<
        CookieConsentPreferences,
        "preferences" | "analytics"
    >
): CookieConsentPreferences => {
    const consent:
        CookieConsentPreferences = {
        version:
            CONSENT_VERSION,

        necessary: true,

        preferences:
            preferences.preferences,

        analytics:
            preferences.analytics,

        decidedAt:
            new Date().toISOString(),
    };

    const secureAttribute =
        window.location.protocol ===
            "https:"
            ? "; Secure"
            : "";

    document.cookie = [
        `${encodeURIComponent(
            COOKIE_NAME
        )}=${encodeURIComponent(
            JSON.stringify(consent)
        )}`,

        "Path=/",

        `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,

        "SameSite=Lax",

        secureAttribute,
    ]
        .filter(Boolean)
        .join("; ");

    window.dispatchEvent(
        new CustomEvent(
            COOKIE_CONSENT_CHANGED_EVENT,
            {
                detail: consent,
            }
        )
    );

    return consent;
};

export const acceptAllCookies =
    (): CookieConsentPreferences => {
        return saveCookieConsent({
            preferences: true,
            analytics: true,
        });
    };

export const rejectOptionalCookies =
    (): CookieConsentPreferences => {
        return saveCookieConsent({
            preferences: false,
            analytics: false,
        });
    };

export const hasCookieConsentFor = (
    category:
        | "necessary"
        | "preferences"
        | "analytics"
): boolean => {
    if (category === "necessary") {
        return true;
    }

    const consent =
        getCookieConsent();

    return Boolean(
        consent?.[category]
    );
};

export const openCookieSettings =
    (): void => {
        window.dispatchEvent(
            new Event(
                OPEN_COOKIE_SETTINGS_EVENT
            )
        );
    };