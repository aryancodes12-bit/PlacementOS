import {
    useEffect,
    useState,
} from "react";

import {
    Check,
    Cookie,
    Settings2,
    ShieldCheck,
    X,
} from "lucide-react";

import {
    acceptAllCookies,
    getCookieConsent,
    OPEN_COOKIE_SETTINGS_EVENT,
    rejectOptionalCookies,
    saveCookieConsent,
} from "./cookieConsent.service";

interface ToggleProps {
    checked: boolean;
    disabled?: boolean;
    label: string;
    description: string;
    onChange?: (
        checked: boolean
    ) => void;
}

const ConsentToggle = ({
    checked,
    disabled = false,
    label,
    description,
    onChange,
}: ToggleProps) => {
    return (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-bg-tertiary p-4">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">
                        {label}
                    </p>

                    {disabled && (
                        <span className="rounded-full bg-success-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-success">
                            Always active
                        </span>
                    )}
                </div>

                <p className="mt-1 text-xs leading-5 text-text-secondary">
                    {description}
                </p>
            </div>

            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={`${label} cookies`}
                disabled={disabled}
                onClick={() =>
                    onChange?.(!checked)
                }
                className={[
                    "relative mt-0.5 h-6 w-11 shrink-0 overflow-hidden rounded-full transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    checked
                        ? "bg-brand"
                        : "bg-border",
                    disabled
                        ? "cursor-not-allowed opacity-70"
                        : "cursor-pointer",
                ].join(" ")}
            >
                <span
                    className={[
                        "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                        checked
                            ? "translate-x-5"
                            : "translate-x-0",
                    ].join(" ")}
                />
            </button>
        </div>
    );
};

export const CookieConsent = () => {
    const [
        showBanner,
        setShowBanner,
    ] = useState(false);

    const [
        showSettings,
        setShowSettings,
    ] = useState(false);

    const [
        preferencesEnabled,
        setPreferencesEnabled,
    ] = useState(false);

    const [
        analyticsEnabled,
        setAnalyticsEnabled,
    ] = useState(false);

    useEffect(() => {
        const existingConsent =
            getCookieConsent();

        if (!existingConsent) {
            setShowBanner(true);
        } else {
            setPreferencesEnabled(
                existingConsent.preferences
            );

            setAnalyticsEnabled(
                existingConsent.analytics
            );
        }

        const openSettings = () => {
            const currentConsent =
                getCookieConsent();

            setPreferencesEnabled(
                currentConsent
                    ?.preferences ??
                false
            );

            setAnalyticsEnabled(
                currentConsent
                    ?.analytics ??
                false
            );

            setShowBanner(false);
            setShowSettings(true);
        };

        window.addEventListener(
            OPEN_COOKIE_SETTINGS_EVENT,
            openSettings
        );

        return () => {
            window.removeEventListener(
                OPEN_COOKIE_SETTINGS_EVENT,
                openSettings
            );
        };
    }, []);

    useEffect(() => {
        if (!showSettings) {
            return;
        }

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (
                event.key ===
                "Escape"
            ) {
                setShowSettings(
                    false
                );
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [showSettings]);

    const handleAcceptAll = () => {
        acceptAllCookies();

        setPreferencesEnabled(true);
        setAnalyticsEnabled(true);

        setShowBanner(false);
        setShowSettings(false);
    };

    const handleRejectOptional =
        () => {
            rejectOptionalCookies();

            setPreferencesEnabled(
                false
            );

            setAnalyticsEnabled(
                false
            );

            setShowBanner(false);
            setShowSettings(false);
        };

    const handleSaveSettings =
        () => {
            saveCookieConsent({
                preferences:
                    preferencesEnabled,

                analytics:
                    analyticsEnabled,
            });

            setShowSettings(false);
            setShowBanner(false);
        };

    return (
        <>
            {showBanner && (
                <section
                    role="dialog"
                    aria-modal="false"
                    aria-labelledby="cookie-consent-title"
                    className="fixed inset-x-3 bottom-3 z-[200] mx-auto max-w-4xl rounded-2xl border border-border bg-bg-secondary/95 p-5 shadow-2xl backdrop-blur-xl sm:bottom-5 sm:p-6"
                >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex max-w-2xl items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-brand">
                                <Cookie size={20} />
                            </div>

                            <div>
                                <h2
                                    id="cookie-consent-title"
                                    className="text-base font-semibold text-text-primary"
                                >
                                    Your privacy preferences
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-text-secondary">
                                    PlacementOS uses necessary storage to keep the application secure and functional. Optional preferences and analytics are only enabled with your choice.
                                </p>

                                <a
                                    href="/privacy"
                                    className="mt-2 inline-block text-xs font-medium text-brand underline-offset-4 hover:underline"
                                >
                                    Read privacy policy
                                </a>
                            </div>
                        </div>

                        <div className="grid shrink-0 gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowBanner(
                                        false
                                    );

                                    setShowSettings(
                                        true
                                    );
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-tertiary px-4 py-2.5 text-sm font-medium text-text-primary transition hover:border-brand/40 active:scale-[0.98]"
                            >
                                <Settings2 size={15} />
                                Customize
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleRejectOptional
                                }
                                className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition hover:bg-bg-tertiary hover:text-text-primary active:scale-[0.98]"
                            >
                                Necessary only
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleAcceptAll
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98]"
                            >
                                <Check size={15} />
                                Accept all
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {showSettings && (
                <>
                    <button
                        type="button"
                        aria-label="Close cookie preferences"
                        onClick={() =>
                            setShowSettings(
                                false
                            )
                        }
                        className="fixed inset-0 z-[210] bg-black/60 backdrop-blur-sm"
                    />

                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cookie-settings-title"
                        className="fixed left-1/2 top-1/2 z-[220] max-h-[90vh] w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-bg-secondary p-4 shadow-2xl sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-brand">
                                    <ShieldCheck size={18} />
                                </div>

                                <div>
                                    <h2
                                        id="cookie-settings-title"
                                        className="text-lg font-semibold text-text-primary"
                                    >
                                        Cookie preferences
                                    </h2>

                                    <p className="mt-1 text-sm leading-6 text-text-secondary">
                                        Select which optional storage PlacementOS may use.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowSettings(
                                        false
                                    )
                                }
                                aria-label="Close cookie preferences"
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-tertiary transition hover:bg-bg-tertiary hover:text-text-primary"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="mt-6 space-y-3">
                            <ConsentToggle
                                checked
                                disabled
                                label="Necessary"
                                description="Required for security, authentication, consent preferences, and essential application functionality."
                            />

                            <ConsentToggle
                                checked={
                                    preferencesEnabled
                                }
                                onChange={
                                    setPreferencesEnabled
                                }
                                label="Preferences"
                                description="Remembers optional interface preferences such as display and navigation choices."
                            />

                            <ConsentToggle
                                checked={
                                    analyticsEnabled
                                }
                                onChange={
                                    setAnalyticsEnabled
                                }
                                label="Analytics"
                                description="Allows privacy-conscious product analytics. PlacementOS currently does not load analytics scripts."
                            />
                        </div>

                        <div className="mt-6 grid gap-2 sm:grid-cols-3">
                            <button
                                type="button"
                                onClick={
                                    handleRejectOptional
                                }
                                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition hover:bg-bg-tertiary active:scale-[0.98]"
                            >
                                Necessary only
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleSaveSettings
                                }
                                className="rounded-xl border border-brand/30 bg-brand-muted px-4 py-2.5 text-sm font-semibold text-brand transition hover:border-brand/50 active:scale-[0.98]"
                            >
                                Save choices
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleAcceptAll
                                }
                                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98]"
                            >
                                Accept all
                            </button>
                        </div>
                    </section>
                </>
            )}
        </>
    );
};
