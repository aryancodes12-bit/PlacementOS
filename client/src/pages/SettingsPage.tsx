
import {
    Component,
    useEffect,
    useMemo,
    useState,
} from "react";

import type {
    ErrorInfo,
    FormEvent,
    ReactNode,
} from "react";

import {
    isAxiosError,
} from "axios";

import {
    useNavigate,
} from "react-router-dom";

import {
    AlertTriangle,
    BellRing,
    Bug,
    Clock3,
    Cookie,
    Database,
    ExternalLink,
    Mail,
    MessageSquare,
    Save,
    Settings,
    Star,
    Trash2,
} from "lucide-react";

import {
    AppLayout,
} from "../components/ui/AppLayout";


import {
    ActionButton,
} from "../components/ui/design-system/ActionButton";

import {
    AppModal,
} from "../components/ui/design-system/AppModal";

import {
    EmptyState,
} from "../components/ui/design-system/EmptyState";

import {
    IconTile,
} from "../components/ui/design-system/IconTile";

import {
    PageSurface,
} from "../components/ui/design-system/PageSurface";

import {
    SectionHeader,
} from "../components/ui/design-system/SectionHeader";

import {
    SelectField,
    TextAreaField,
    TextField,
} from "../components/ui/design-system/FormControls";

import {
    Skeleton,
} from "../components/ui/design-system/Skeleton";

import {
    StatusNotice,
} from "../components/ui/design-system/StatusNotice";

import {
    ToggleSwitch,
} from "../components/ui/design-system/ToggleSwitch";



import {
    openCookieSettings,
} from "../features/cookie-consent/cookieConsent.service";

import {
    notificationPreferenceService,
} from "../features/notifications/notificationPreference.service";

import type {
    NotificationPreference,
    NotificationPreferenceUpdate,
} from "../features/notifications/notificationPreference.types";

import {
    settingsService,
} from "../services/settings.service";

import type {
    FeedbackType,
    SettingsOverview,
} from "../services/settings.service";

import {
    useAuthStore,
} from "../store/authStore";

interface FeedbackForm {
    type: FeedbackType;
    subject: string;
    message: string;
    rating: number | null;
}

interface ApiErrorResponse {
    message?: string;
}

interface SettingsBoundaryProps {
    children: ReactNode;
}

interface SettingsBoundaryState {
    hasError: boolean;
}

const EMPTY_FEEDBACK_FORM: FeedbackForm = {
    type: "SUGGESTION",
    subject: "",
    message: "",
    rating: null,
};

const FEEDBACK_TYPES: Array<{
    value: FeedbackType;
    label: string;
}> = [
        {
            value: "SUGGESTION",
            label: "Suggestion",
        },
        {
            value: "BUG_REPORT",
            label: "Bug report",
        },
        {
            value: "FEATURE_REQUEST",
            label: "Feature request",
        },
        {
            value: "CONTACT_OWNER",
            label: "Contact owner",
        },
        {
            value: "OTHER",
            label: "Other",
        },
    ];

const NOTIFICATION_TIMEZONES = [
    {
        value: "Asia/Kolkata",
        label: "India — Asia/Kolkata",
    },
    {
        value: "UTC",
        label: "UTC",
    },
    {
        value: "Asia/Dubai",
        label: "Dubai — Asia/Dubai",
    },
    {
        value: "Europe/London",
        label: "London — Europe/London",
    },
    {
        value: "America/New_York",
        label: "New York — America/New_York",
    },
    {
        value: "America/Los_Angeles",
        label: "Los Angeles — America/Los_Angeles",
    },
];

const DATA_LABELS: Record<string, string> = {
    dsaProblems: "DSA problems",
    revisions: "DSA revisions",
    resumes: "Resume versions",
    interviews: "Interview sessions",
    dailyPlans: "Daily plans",
    readinessHistory: "Readiness records",
    payments: "Payment records",
    feedback: "Feedback entries",
};

const REQUIRED_DELETE_TEXT =
    "DELETE MY ACCOUNT";

const getErrorMessage = (
    error: unknown,
    fallback: string
) => {
    if (
        isAxiosError<ApiErrorResponse>(
            error
        )
    ) {
        return (
            error.response
                ?.data
                ?.message ||
            fallback
        );
    }

    return fallback;
};

const formatDate = (
    value: string
) => {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Unknown";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric",
        }
    );
};

const getEditablePreferences = (
    preferences: NotificationPreference
): NotificationPreferenceUpdate => {
    return {
        emailDigestEnabled:
            preferences.emailDigestEnabled,

        streakRiskEnabled:
            preferences.streakRiskEnabled,

        dsaRevisionEnabled:
            preferences.dsaRevisionEnabled,

        resumeStaleEnabled:
            preferences.resumeStaleEnabled,

        interviewInactiveEnabled:
            preferences.interviewInactiveEnabled,

        digestHour:
            preferences.digestHour,

        digestMinute:
            preferences.digestMinute,

        timezone:
            preferences.timezone,
    };
};

const getDigestTimeValue = (
    hour: number,
    minute: number
) => {
    return `${String(
        hour
    ).padStart(
        2,
        "0"
    )}:${String(
        minute
    ).padStart(
        2,
        "0"
    )}`;
};

const SettingsPageSkeleton = () => {
    return (
        <div
            role="status"
            aria-label="Loading settings"
            className="grid gap-4"
        >
            <PageSurface>
                <div className="flex items-start gap-3">
                    <Skeleton
                        width="2.75rem"
                        height="2.75rem"
                    />

                    <div className="flex-1">
                        <Skeleton
                            width="32%"
                            height="0.75rem"
                        />

                        <Skeleton
                            width="48%"
                            height="1.5rem"
                            className="mt-3"
                        />

                        <Skeleton
                            width="55%"
                            height="0.75rem"
                            className="mt-3"
                        />
                    </div>
                </div>
            </PageSurface>

            <PageSurface>
                <Skeleton
                    width="28%"
                    height="1rem"
                />

                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {Array.from({
                        length: 8,
                    }).map(
                        (_, index) => (
                            <Skeleton
                                key={index}
                                height="5.4rem"
                            />
                        )
                    )}
                </div>
            </PageSurface>

            <PageSurface>
                <Skeleton
                    width="36%"
                    height="1rem"
                />

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {Array.from({
                        length: 4,
                    }).map(
                        (_, index) => (
                            <Skeleton
                                key={index}
                                height="6rem"
                            />
                        )
                    )}
                </div>
            </PageSurface>
        </div>
    );
};

const RatingPicker = ({
    value,
    onChange,
}: {
    value: number | null;
    onChange: (
        rating: number | null
    ) => void;
}) => {
    return (
        <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-text-secondary">
                Rating{" "}
                <span className="font-normal text-text-tertiary">
                    (optional)
                </span>
            </legend>

            <div className="flex min-h-12 items-center gap-1 rounded-xl border border-border bg-bg-tertiary px-2">
                {[
                    1,
                    2,
                    3,
                    4,
                    5,
                ].map(
                    (rating) => {
                        const active =
                            value !== null &&
                            rating <= value;

                        return (
                            <button
                                key={rating}
                                type="button"
                                onClick={() =>
                                    onChange(
                                        value === rating
                                            ? null
                                            : rating
                                    )
                                }
                                aria-label={`${rating} star rating`}
                                aria-pressed={
                                    value === rating
                                }
                                className={[
                                    "inline-flex h-11 w-11 items-center justify-center rounded-xl",
                                    "outline-none transition duration-150",
                                    "active:scale-90",
                                    "focus-visible:ring-2 focus-visible:ring-warning/70",
                                    active
                                        ? "bg-warning/10 text-warning"
                                        : "text-text-tertiary hover:bg-warning/5 hover:text-warning",
                                ].join(
                                    " "
                                )}
                            >
                                <Star
                                    size={18}
                                    fill={
                                        active
                                            ? "currentColor"
                                            : "none"
                                    }
                                    aria-hidden="true"
                                />
                            </button>
                        );
                    }
                )}
            </div>
        </fieldset>
    );
};

class SettingsPageErrorBoundary extends Component<
    SettingsBoundaryProps,
    SettingsBoundaryState
> {
    public state: SettingsBoundaryState = {
        hasError: false,
    };

    public static getDerivedStateFromError():
        SettingsBoundaryState {
        return {
            hasError: true,
        };
    }

    public componentDidCatch(
        error: Error,
        info: ErrorInfo
    ) {
        console.error(
            "Settings page render error:",
            {
                error,
                componentStack:
                    info.componentStack,
            }
        );
    }

    public render() {
        if (
            this.state.hasError
        ) {
            return (
                <AppLayout
                    title="Settings"
                    description="Manage account, privacy, notifications, and support."
                >
                    <EmptyState
                        title="Settings could not be displayed"
                        description="A rendering error occurred. Reload the page to restore the settings workspace."
                        icon={
                            <AlertTriangle
                                size={23}
                                aria-hidden="true"
                            />
                        }
                        iconTone="danger"
                        action={
                            <ActionButton
                                type="button"
                                onClick={() =>
                                    window.location.reload()
                                }
                            >
                                Reload page
                            </ActionButton>
                        }
                    />
                </AppLayout>
            );
        }

        return this.props.children;
    }
}

const SettingsPageContent = () => {
    const navigate =
        useNavigate();

    const logout =
        useAuthStore(
            (state) =>
                state.logout
        );

    const [
        overview,
        setOverview,
    ] =
        useState<SettingsOverview | null>(
            null
        );

    const [
        pageLoading,
        setPageLoading,
    ] = useState(true);

    const [
        pageError,
        setPageError,
    ] = useState("");

    const [
        feedbackForm,
        setFeedbackForm,
    ] =
        useState<FeedbackForm>(
            EMPTY_FEEDBACK_FORM
        );

    const [
        feedbackSubmitting,
        setFeedbackSubmitting,
    ] = useState(false);

    const [
        feedbackMessage,
        setFeedbackMessage,
    ] = useState("");

    const [
        feedbackError,
        setFeedbackError,
    ] = useState("");

    const [
        showDeleteModal,
        setShowDeleteModal,
    ] = useState(false);

    const [
        deleteConfirmation,
        setDeleteConfirmation,
    ] = useState("");

    const [
        deleting,
        setDeleting,
    ] = useState(false);

    const [
        deleteError,
        setDeleteError,
    ] = useState("");

    const [
        notificationPreferences,
        setNotificationPreferences,
    ] =
        useState<NotificationPreference | null>(
            null
        );

    const [
        savedNotificationPreferences,
        setSavedNotificationPreferences,
    ] =
        useState<NotificationPreference | null>(
            null
        );

    const [
        notificationPreferencesLoading,
        setNotificationPreferencesLoading,
    ] = useState(true);

    const [
        notificationPreferencesSaving,
        setNotificationPreferencesSaving,
    ] = useState(false);

    const [
        notificationPreferencesMessage,
        setNotificationPreferencesMessage,
    ] = useState("");

    const [
        notificationPreferencesError,
        setNotificationPreferencesError,
    ] = useState("");

    const [
        isOnline,
        setIsOnline,
    ] = useState(
        () =>
            typeof navigator ===
            "undefined" ||
            navigator.onLine
    );

    const supportEmail =
        overview?.support.email ||
        import.meta.env
            .VITE_SUPPORT_EMAIL ||
        "";

    const canDelete =
        deleteConfirmation ===
        REQUIRED_DELETE_TEXT;

    const feedbackCharacters =
        feedbackForm.message.length;

    const dataEntries =
        useMemo(() => {
            if (!overview) {
                return [];
            }

            return Object.entries(
                overview.dataSummary
            ) as Array<
                [
                    string,
                    number,
                ]
            >;
        }, [overview]);

    const notificationPreferencesChanged =
        useMemo(() => {
            if (
                !notificationPreferences ||
                !savedNotificationPreferences
            ) {
                return false;
            }

            return (
                JSON.stringify(
                    getEditablePreferences(
                        notificationPreferences
                    )
                ) !==
                JSON.stringify(
                    getEditablePreferences(
                        savedNotificationPreferences
                    )
                )
            );
        }, [
            notificationPreferences,
            savedNotificationPreferences,
        ]);

    useEffect(() => {
        const handleOnline =
            () => setIsOnline(true);

        const handleOffline =
            () => setIsOnline(false);

        window.addEventListener(
            "online",
            handleOnline
        );

        window.addEventListener(
            "offline",
            handleOffline
        );

        return () => {
            window.removeEventListener(
                "online",
                handleOnline
            );

            window.removeEventListener(
                "offline",
                handleOffline
            );
        };
    }, []);

    useEffect(() => {
        let active = true;

        const loadInitialSettings =
            async () => {
                setPageLoading(true);

                setNotificationPreferencesLoading(
                    true
                );

                const [
                    overviewResult,
                    preferencesResult,
                ] =
                    await Promise.allSettled(
                        [
                            settingsService
                                .getOverview(),

                            notificationPreferenceService
                                .getPreferences(),
                        ]
                    );

                if (!active) {
                    return;
                }

                if (
                    overviewResult.status ===
                    "fulfilled"
                ) {
                    setOverview(
                        overviewResult
                            .value
                            .data
                            .data
                    );

                    setPageError("");
                } else {
                    setPageError(
                        getErrorMessage(
                            overviewResult.reason,
                            "Failed to load settings."
                        )
                    );
                }

                if (
                    preferencesResult.status ===
                    "fulfilled"
                ) {
                    const preferences =
                        preferencesResult
                            .value
                            .data
                            .data
                            .preferences;

                    setNotificationPreferences(
                        preferences
                    );

                    setSavedNotificationPreferences(
                        preferences
                    );

                    setNotificationPreferencesError(
                        ""
                    );
                } else {
                    setNotificationPreferencesError(
                        getErrorMessage(
                            preferencesResult.reason,
                            "Failed to load notification preferences."
                        )
                    );
                }

                setPageLoading(false);

                setNotificationPreferencesLoading(
                    false
                );
            };

        void loadInitialSettings();

        return () => {
            active = false;
        };
    }, []);

    const loadOverview =
        async (
            showLoading = true
        ) => {
            try {
                if (showLoading) {
                    setPageLoading(
                        true
                    );
                }

                setPageError("");

                const { data } =
                    await settingsService
                        .getOverview();

                setOverview(
                    data.data
                );
            } catch (error) {
                setPageError(
                    getErrorMessage(
                        error,
                        "Failed to load settings."
                    )
                );
            } finally {
                if (showLoading) {
                    setPageLoading(
                        false
                    );
                }
            }
        };

    const loadNotificationPreferences =
        async () => {
            try {
                setNotificationPreferencesLoading(
                    true
                );

                setNotificationPreferencesError(
                    ""
                );

                const { data } =
                    await notificationPreferenceService
                        .getPreferences();

                const preferences =
                    data.data.preferences;

                setNotificationPreferences(
                    preferences
                );

                setSavedNotificationPreferences(
                    preferences
                );
            } catch (error) {
                setNotificationPreferencesError(
                    getErrorMessage(
                        error,
                        "Failed to load notification preferences."
                    )
                );
            } finally {
                setNotificationPreferencesLoading(
                    false
                );
            }
        };

    const updateNotificationPreference = <
        Key extends keyof NotificationPreferenceUpdate
    >(
        key: Key,
        value:
            NotificationPreferenceUpdate[Key]
    ) => {
        setNotificationPreferences(
            (current) => {
                if (!current) {
                    return current;
                }

                return {
                    ...current,
                    [key]: value,
                };
            }
        );

        setNotificationPreferencesMessage(
            ""
        );

        setNotificationPreferencesError(
            ""
        );
    };

    const handleSaveNotificationPreferences =
        async () => {
            if (
                !notificationPreferences
            ) {
                return;
            }

            if (!isOnline) {
                setNotificationPreferencesError(
                    "You are offline. Reconnect before saving preferences."
                );
                return;
            }

            setNotificationPreferencesSaving(
                true
            );

            setNotificationPreferencesMessage(
                ""
            );

            setNotificationPreferencesError(
                ""
            );

            try {
                const { data } =
                    await notificationPreferenceService
                        .updatePreferences(
                            getEditablePreferences(
                                notificationPreferences
                            )
                        );

                setNotificationPreferences(
                    data.data.preferences
                );

                setSavedNotificationPreferences(
                    data.data.preferences
                );

                setNotificationPreferencesMessage(
                    data.message ||
                    "Notification preferences saved."
                );
            } catch (error) {
                setNotificationPreferencesError(
                    getErrorMessage(
                        error,
                        "Failed to save notification preferences."
                    )
                );
            } finally {
                setNotificationPreferencesSaving(
                    false
                );
            }
        };

    const updateFeedback = <
        Key extends keyof FeedbackForm
    >(
        key: Key,
        value:
            FeedbackForm[Key]
    ) => {
        setFeedbackForm(
            (current) => ({
                ...current,
                [key]: value,
            })
        );

        setFeedbackMessage("");
        setFeedbackError("");
    };

    const openBugReport =
        () => {
            setFeedbackForm(
                (current) => ({
                    ...current,
                    type:
                        "BUG_REPORT",
                    subject:
                        current.subject ||
                        "Bug in PlacementOS",
                })
            );

            window.setTimeout(
                () => {
                    document
                        .getElementById(
                            "settings-feedback-form"
                        )
                        ?.scrollIntoView(
                            {
                                behavior:
                                    "smooth",
                                block:
                                    "start",
                            }
                        );
                },
                0
            );
        };

    const handleFeedbackSubmit =
        async (
            event: FormEvent
        ) => {
            event.preventDefault();

            const subject =
                feedbackForm.subject.trim();

            const message =
                feedbackForm.message.trim();

            if (
                subject.length < 4
            ) {
                setFeedbackError(
                    "Subject must contain at least 4 characters."
                );
                return;
            }

            if (
                message.length < 10
            ) {
                setFeedbackError(
                    "Message must contain at least 10 characters."
                );
                return;
            }

            if (!isOnline) {
                setFeedbackError(
                    "You are offline. Reconnect before submitting feedback."
                );
                return;
            }

            setFeedbackSubmitting(
                true
            );

            setFeedbackError("");
            setFeedbackMessage("");

            try {
                const { data } =
                    await settingsService
                        .submitFeedback(
                            {
                                type:
                                    feedbackForm.type,
                                subject,
                                message,
                                rating:
                                    feedbackForm.rating,
                                pageUrl:
                                    window.location.href,
                            }
                        );

                setFeedbackMessage(
                    data.message
                );

                setFeedbackForm(
                    EMPTY_FEEDBACK_FORM
                );

                await loadOverview(
                    false
                );
            } catch (error) {
                setFeedbackError(
                    getErrorMessage(
                        error,
                        "Failed to submit feedback."
                    )
                );
            } finally {
                setFeedbackSubmitting(
                    false
                );
            }
        };

    const handleDeleteAccount =
        async () => {
            if (!canDelete) {
                setDeleteError(
                    `Type ${REQUIRED_DELETE_TEXT} exactly.`
                );
                return;
            }

            if (!isOnline) {
                setDeleteError(
                    "You are offline. Reconnect before deleting your account."
                );
                return;
            }

            setDeleting(true);
            setDeleteError("");

            try {
                await settingsService
                    .deleteAccount();

                logout();

                navigate(
                    "/login",
                    {
                        replace: true,
                    }
                );
            } catch (error) {
                setDeleteError(
                    getErrorMessage(
                        error,
                        "Failed to delete account."
                    )
                );

                setDeleting(false);
            }
        };

    const closeDeleteModal =
        () => {
            if (deleting) {
                return;
            }

            setShowDeleteModal(
                false
            );

            setDeleteConfirmation(
                ""
            );

            setDeleteError("");
        };

    const mailSubject =
        encodeURIComponent(
            "PlacementOS support request"
        );

    const mailBody =
        encodeURIComponent(
            `Hello,\n\nI need help with PlacementOS.\n\nPage: ${window.location.href}\n`
        );

    const fatalPageError =
        !overview &&
        Boolean(pageError);

    return (
        <AppLayout
            title="Settings"
            description="Manage account, privacy, notifications, support, and data preferences."
        >
            <div className="mx-auto grid w-full max-w-[1180px] gap-4 sm:gap-5">
                {!isOnline && (
                    <StatusNotice
                        tone="warning"
                        title="You are offline"
                    >
                        Existing data remains visible, but saving, feedback submission, and account deletion are temporarily disabled.
                    </StatusNotice>
                )}

                {pageLoading &&
                    !overview ? (
                    <SettingsPageSkeleton />
                ) : fatalPageError ? (
                    <EmptyState
                        title="Settings could not be loaded"
                        description={
                            pageError
                        }
                        icon={
                            <AlertTriangle
                                size={23}
                                aria-hidden="true"
                            />
                        }
                        iconTone="danger"
                        action={
                            <ActionButton
                                type="button"
                                disabled={!isOnline}
                                onClick={() =>
                                    void loadOverview()
                                }
                            >
                                Retry
                            </ActionButton>
                        }
                    />
                ) : overview ? (
                    <>
                        {pageError && (
                            <StatusNotice
                                tone="warning"
                                dismissible
                                onDismiss={() =>
                                    setPageError("")
                                }
                            >
                                {pageError}
                            </StatusNotice>
                        )}

                        <PageSurface
                            variant="highlight"
                            padding="lg"
                        >
                            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                                    <IconTile>
                                        <Settings
                                            size={20}
                                            aria-hidden="true"
                                        />
                                    </IconTile>

                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-tertiary">
                                            Account workspace
                                        </p>

                                        <h2 className="mt-1 truncate text-xl font-bold text-text-primary">
                                            {
                                                overview
                                                    .account
                                                    .name
                                            }
                                        </h2>

                                        <p className="mt-1 break-all text-sm text-text-secondary">
                                            {
                                                overview
                                                    .account
                                                    .email
                                            }
                                        </p>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="rounded-full border border-border bg-bg-tertiary px-3 py-1 text-xs font-semibold text-text-secondary">
                                                {
                                                    overview
                                                        .account
                                                        .role
                                                }
                                            </span>

                                            <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-[#A5B4FC]">
                                                {
                                                    overview
                                                        .account
                                                        .plan
                                                }{" "}
                                                plan
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-border bg-bg-tertiary/70 px-4 py-3 text-left sm:text-right">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-tertiary">
                                        Member since
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-text-primary">
                                        {formatDate(
                                            overview
                                                .account
                                                .createdAt
                                        )}
                                    </p>

                                    <p className="mt-1 text-xs text-text-tertiary">
                                        PlacementOS v1.0
                                    </p>
                                </div>
                            </div>
                        </PageSurface>

                        <PageSurface padding="lg">
                            <SectionHeader
                                title="Your stored data"
                                description="A concise view of the preparation data associated with this account."
                                icon={
                                    <Database
                                        size={19}
                                        aria-hidden="true"
                                    />
                                }
                            />

                            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                                {dataEntries.map(
                                    ([
                                        key,
                                        value,
                                    ]) => (
                                        <PageSurface
                                            key={key}
                                            as="div"
                                            variant="interactive"
                                            padding="sm"
                                        >
                                            <p className="text-2xl font-black tracking-tight text-text-primary">
                                                {
                                                    value
                                                }
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-text-tertiary">
                                                {DATA_LABELS[
                                                    key
                                                ] ||
                                                    key}
                                            </p>
                                        </PageSurface>
                                    )
                                )}
                            </div>

                            <PageSurface
                                as="div"
                                variant="subtle"
                                className="mt-5"
                            >
                                <h3 className="text-sm font-bold text-text-primary">
                                    Privacy information
                                </h3>

                                <ul className="mt-3 grid gap-2 text-xs leading-5 text-text-secondary">
                                    <li className="flex gap-2">
                                        <span className="text-brand">
                                            •
                                        </span>

                                        Deleting your account removes profile, DSA, revision, resume, interview, readiness, daily-plan, payment, feedback, and notification records from the PlacementOS database.
                                    </li>

                                    <li className="flex gap-2">
                                        <span className="text-brand">
                                            •
                                        </span>

                                        Uploaded Cloudinary files are not currently removed automatically with database deletion.
                                    </li>

                                    <li className="flex gap-2">
                                        <span className="text-brand">
                                            •
                                        </span>

                                        External payment-provider records may remain according to the provider&apos;s operational and legal requirements.
                                    </li>

                                    <li className="flex gap-2">
                                        <span className="text-brand">
                                            •
                                        </span>

                                        PlacementOS does not sell your profile or preparation data.
                                    </li>
                                </ul>
                            </PageSurface>
                        </PageSurface>

                        <PageSurface padding="lg">
                            <SectionHeader
                                title="Notification preferences"
                                description="Choose reminder categories and whether PlacementOS sends one combined preparation digest."
                                icon={
                                    <BellRing
                                        size={19}
                                        aria-hidden="true"
                                    />
                                }
                                action={
                                    <span className="inline-flex rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                                        Realtime alerts active
                                    </span>
                                }
                            />

                            {notificationPreferencesLoading ? (
                                <div className="mt-5 grid gap-3">
                                    <Skeleton
                                        height="5.5rem"
                                    />

                                    <div className="grid gap-3 md:grid-cols-2">
                                        <Skeleton
                                            height="6rem"
                                        />

                                        <Skeleton
                                            height="6rem"
                                        />

                                        <Skeleton
                                            height="6rem"
                                        />

                                        <Skeleton
                                            height="6rem"
                                        />
                                    </div>
                                </div>
                            ) : notificationPreferencesError &&
                                !notificationPreferences ? (
                                <StatusNotice
                                    tone="error"
                                    className="mt-5"
                                    action={
                                        <ActionButton
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            disabled={!isOnline}
                                            onClick={() =>
                                                void loadNotificationPreferences()
                                            }
                                        >
                                            Retry preferences
                                        </ActionButton>
                                    }
                                >
                                    {
                                        notificationPreferencesError
                                    }
                                </StatusNotice>
                            ) : notificationPreferences ? (
                                <div className="mt-5 grid gap-5">
                                    {notificationPreferencesMessage && (
                                        <StatusNotice
                                            tone="success"
                                            dismissible
                                            onDismiss={() =>
                                                setNotificationPreferencesMessage(
                                                    ""
                                                )
                                            }
                                        >
                                            {
                                                notificationPreferencesMessage
                                            }
                                        </StatusNotice>
                                    )}

                                    {notificationPreferencesError && (
                                        <StatusNotice
                                            tone="error"
                                            dismissible
                                            onDismiss={() =>
                                                setNotificationPreferencesError(
                                                    ""
                                                )
                                            }
                                        >
                                            {
                                                notificationPreferencesError
                                            }
                                        </StatusNotice>
                                    )}

                                    <ToggleSwitch
                                        label="Daily email digest"
                                        description="Receive at most one combined email with applicable streak, DSA, resume, and interview reminders."
                                        checked={
                                            notificationPreferences
                                                .emailDigestEnabled
                                        }
                                        disabled={
                                            notificationPreferencesSaving ||
                                            !isOnline
                                        }
                                        onChange={(
                                            checked
                                        ) =>
                                            updateNotificationPreference(
                                                "emailDigestEnabled",
                                                checked
                                            )
                                        }
                                    />

                                    <div>
                                        <h3 className="text-sm font-bold text-text-primary">
                                            Reminder categories
                                        </h3>

                                        <p className="mt-1 text-xs leading-5 text-text-tertiary">
                                            These controls affect scheduled in-app reminders and email-digest inclusion.
                                        </p>

                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                            <ToggleSwitch
                                                label="Streak-risk reminders"
                                                description="Alert me when the day is ending without recorded preparation activity."
                                                checked={
                                                    notificationPreferences
                                                        .streakRiskEnabled
                                                }
                                                disabled={
                                                    notificationPreferencesSaving ||
                                                    !isOnline
                                                }
                                                onChange={(
                                                    checked
                                                ) =>
                                                    updateNotificationPreference(
                                                        "streakRiskEnabled",
                                                        checked
                                                    )
                                                }
                                            />

                                            <ToggleSwitch
                                                label="DSA revision reminders"
                                                description="Alert me when tracked problems are due or overdue for revision."
                                                checked={
                                                    notificationPreferences
                                                        .dsaRevisionEnabled
                                                }
                                                disabled={
                                                    notificationPreferencesSaving ||
                                                    !isOnline
                                                }
                                                onChange={(
                                                    checked
                                                ) =>
                                                    updateNotificationPreference(
                                                        "dsaRevisionEnabled",
                                                        checked
                                                    )
                                                }
                                            />

                                            <ToggleSwitch
                                                label="Resume reminders"
                                                description="Alert me when my latest resume has not been updated recently."
                                                checked={
                                                    notificationPreferences
                                                        .resumeStaleEnabled
                                                }
                                                disabled={
                                                    notificationPreferencesSaving ||
                                                    !isOnline
                                                }
                                                onChange={(
                                                    checked
                                                ) =>
                                                    updateNotificationPreference(
                                                        "resumeStaleEnabled",
                                                        checked
                                                    )
                                                }
                                            />

                                            <ToggleSwitch
                                                label="Interview-practice reminders"
                                                description="Alert me when no interview practice has been recorded recently."
                                                checked={
                                                    notificationPreferences
                                                        .interviewInactiveEnabled
                                                }
                                                disabled={
                                                    notificationPreferencesSaving ||
                                                    !isOnline
                                                }
                                                onChange={(
                                                    checked
                                                ) =>
                                                    updateNotificationPreference(
                                                        "interviewInactiveEnabled",
                                                        checked
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <PageSurface
                                        as="div"
                                        variant="subtle"
                                    >
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <TextField
                                                label="Digest time"
                                                type="time"
                                                leadingIcon={
                                                    <Clock3
                                                        size={16}
                                                        aria-hidden="true"
                                                    />
                                                }
                                                disabled={
                                                    !notificationPreferences
                                                        .emailDigestEnabled ||
                                                    notificationPreferencesSaving ||
                                                    !isOnline
                                                }
                                                value={getDigestTimeValue(
                                                    notificationPreferences
                                                        .digestHour,
                                                    notificationPreferences
                                                        .digestMinute
                                                )}
                                                onChange={(
                                                    event
                                                ) => {
                                                    if (
                                                        !event
                                                            .target
                                                            .value
                                                    ) {
                                                        return;
                                                    }

                                                    const [
                                                        hourText,
                                                        minuteText,
                                                    ] =
                                                        event.target.value.split(
                                                            ":"
                                                        );

                                                    const hour =
                                                        Number(
                                                            hourText
                                                        );

                                                    const minute =
                                                        Number(
                                                            minuteText
                                                        );

                                                    if (
                                                        Number.isNaN(
                                                            hour
                                                        ) ||
                                                        Number.isNaN(
                                                            minute
                                                        )
                                                    ) {
                                                        return;
                                                    }

                                                    updateNotificationPreference(
                                                        "digestHour",
                                                        hour
                                                    );

                                                    updateNotificationPreference(
                                                        "digestMinute",
                                                        minute
                                                    );
                                                }}
                                            />

                                            <SelectField
                                                label="Timezone"
                                                disabled={
                                                    !notificationPreferences
                                                        .emailDigestEnabled ||
                                                    notificationPreferencesSaving ||
                                                    !isOnline
                                                }
                                                value={
                                                    notificationPreferences
                                                        .timezone
                                                }
                                                options={
                                                    NOTIFICATION_TIMEZONES
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateNotificationPreference(
                                                        "timezone",
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />
                                        </div>
                                    </PageSurface>

                                    <div className="flex flex-col justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
                                        <p className="max-w-2xl text-xs leading-5 text-text-tertiary">
                                            AI-completion notifications remain available inside PlacementOS even when email digest is disabled.
                                        </p>

                                        <ActionButton
                                            type="button"
                                            loading={
                                                notificationPreferencesSaving
                                            }
                                            loadingText="Saving..."
                                            leadingIcon={
                                                <Save
                                                    size={16}
                                                    aria-hidden="true"
                                                />
                                            }
                                            disabled={
                                                !notificationPreferencesChanged ||
                                                !isOnline
                                            }
                                            onClick={() =>
                                                void handleSaveNotificationPreferences()
                                            }
                                        >
                                            Save preferences
                                        </ActionButton>
                                    </div>
                                </div>
                            ) : null}
                        </PageSurface>

                        <div className="grid gap-4 md:grid-cols-2">
                            <PageSurface padding="lg">
                                <SectionHeader
                                    title="Contact owner"
                                    description="Contact the PlacementOS owner for account, privacy, or application support."
                                    icon={
                                        <Mail
                                            size={19}
                                            aria-hidden="true"
                                        />
                                    }
                                    compact
                                />

                                {supportEmail ? (
                                    <a
                                        href={`mailto:${supportEmail}?subject=${mailSubject}&body=${mailBody}`}
                                        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg-tertiary px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:-translate-y-0.5 hover:border-brand/40 hover:text-[#A5B4FC] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70 sm:w-auto"
                                    >
                                        Email owner

                                        <ExternalLink
                                            size={14}
                                            aria-hidden="true"
                                        />
                                    </a>
                                ) : (
                                    <StatusNotice
                                        tone="warning"
                                        className="mt-5"
                                    >
                                        Support email has not been configured yet.
                                    </StatusNotice>
                                )}
                            </PageSurface>

                            <PageSurface padding="lg">
                                <SectionHeader
                                    title="Cookie preferences"
                                    description="Review optional storage categories used by PlacementOS. Necessary storage remains active."
                                    icon={
                                        <Cookie
                                            size={19}
                                            aria-hidden="true"
                                        />
                                    }
                                    compact
                                />

                                <ActionButton
                                    type="button"
                                    variant="secondary"
                                    className="mt-5"
                                    leadingIcon={
                                        <Cookie
                                            size={15}
                                            aria-hidden="true"
                                        />
                                    }
                                    onClick={
                                        openCookieSettings
                                    }
                                >
                                    Manage preferences
                                </ActionButton>
                            </PageSurface>

                            <PageSurface padding="lg">
                                <SectionHeader
                                    title="Report a bug"
                                    description="Create a bug report with current page and browser context attached automatically."
                                    icon={
                                        <Bug
                                            size={19}
                                            aria-hidden="true"
                                        />
                                    }
                                    iconTone="warning"
                                    compact
                                />

                                <ActionButton
                                    type="button"
                                    variant="secondary"
                                    className="mt-5"
                                    onClick={
                                        openBugReport
                                    }
                                >
                                    Create bug report
                                </ActionButton>
                            </PageSurface>

                            <PageSurface padding="lg">
                                <SectionHeader
                                    title="Feedback loop"
                                    description="Submit suggestions and feature requests directly inside PlacementOS."
                                    icon={
                                        <MessageSquare
                                            size={19}
                                            aria-hidden="true"
                                        />
                                    }
                                    iconTone="success"
                                    compact
                                />

                                <p className="mt-5 text-xs font-semibold text-text-tertiary">
                                    {
                                        overview
                                            .dataSummary
                                            .feedback
                                    }{" "}
                                    submissions from this account
                                </p>
                            </PageSurface>
                        </div>

                        <PageSurface
                            id="settings-feedback-form"
                            className="scroll-mt-24"
                            padding="lg"
                        >
                            <SectionHeader
                                title="Send feedback"
                                description="Your message is stored for review by the PlacementOS owner."
                                icon={
                                    <MessageSquare
                                        size={19}
                                        aria-hidden="true"
                                    />
                                }
                            />

                            <div
                                aria-live="polite"
                                className="mt-5 grid gap-3 empty:hidden"
                            >
                                {feedbackMessage && (
                                    <StatusNotice
                                        tone="success"
                                        dismissible
                                        onDismiss={() =>
                                            setFeedbackMessage(
                                                ""
                                            )
                                        }
                                    >
                                        {
                                            feedbackMessage
                                        }
                                    </StatusNotice>
                                )}

                                {feedbackError && (
                                    <StatusNotice
                                        tone="error"
                                        dismissible
                                        onDismiss={() =>
                                            setFeedbackError(
                                                ""
                                            )
                                        }
                                    >
                                        {
                                            feedbackError
                                        }
                                    </StatusNotice>
                                )}
                            </div>

                            <form
                                onSubmit={
                                    handleFeedbackSubmit
                                }
                                className="mt-5 grid gap-5"
                                noValidate
                            >
                                <div className="grid gap-5 md:grid-cols-2">
                                    <SelectField
                                        label="Feedback type"
                                        value={
                                            feedbackForm.type
                                        }
                                        options={
                                            FEEDBACK_TYPES
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateFeedback(
                                                "type",
                                                event
                                                    .target
                                                    .value as FeedbackType
                                            )
                                        }
                                    />

                                    <RatingPicker
                                        value={
                                            feedbackForm.rating
                                        }
                                        onChange={(
                                            rating
                                        ) =>
                                            updateFeedback(
                                                "rating",
                                                rating
                                            )
                                        }
                                    />
                                </div>

                                <TextField
                                    label="Subject"
                                    value={
                                        feedbackForm.subject
                                    }
                                    maxLength={120}
                                    description="Minimum 4 characters."
                                    placeholder="Briefly describe your feedback"
                                    onChange={(
                                        event
                                    ) =>
                                        updateFeedback(
                                            "subject",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                />

                                <TextAreaField
                                    label="Message"
                                    value={
                                        feedbackForm.message
                                    }
                                    maxLength={2000}
                                    characterCount={
                                        feedbackCharacters
                                    }
                                    maxCharacterCount={
                                        2000
                                    }
                                    description="Minimum 10 characters. Do not include passwords or private credentials."
                                    placeholder="Explain the issue, suggestion, or request in enough detail to act on it."
                                    onChange={(
                                        event
                                    ) =>
                                        updateFeedback(
                                            "message",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                />

                                <div className="flex justify-end">
                                    <ActionButton
                                        type="submit"
                                        loading={
                                            feedbackSubmitting
                                        }
                                        loadingText="Submitting..."
                                        leadingIcon={
                                            <MessageSquare
                                                size={16}
                                                aria-hidden="true"
                                            />
                                        }
                                        disabled={!isOnline}
                                    >
                                        Submit feedback
                                    </ActionButton>
                                </div>
                            </form>
                        </PageSurface>

                        <PageSurface
                            variant="danger"
                            padding="lg"
                        >
                            <SectionHeader
                                title="Delete account"
                                description="Permanently delete this account and its PlacementOS database history. This action cannot be undone."
                                icon={
                                    <AlertTriangle
                                        size={19}
                                        aria-hidden="true"
                                    />
                                }
                                iconTone="danger"
                                action={
                                    <ActionButton
                                        type="button"
                                        variant="danger"
                                        leadingIcon={
                                            <Trash2
                                                size={16}
                                                aria-hidden="true"
                                            />
                                        }
                                        onClick={() =>
                                            setShowDeleteModal(
                                                true
                                            )
                                        }
                                    >
                                        Delete my account
                                    </ActionButton>
                                }
                            />
                        </PageSurface>
                    </>
                ) : null}
            </div>

            <AppModal
                open={
                    showDeleteModal
                }
                title="Permanently delete account"
                description="This action cannot be reversed."
                size="sm"
                busy={deleting}
                icon={
                    <AlertTriangle
                        size={19}
                        aria-hidden="true"
                    />
                }
                onClose={
                    closeDeleteModal
                }
                footer={
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <ActionButton
                            type="button"
                            variant="secondary"
                            disabled={
                                deleting
                            }
                            onClick={
                                closeDeleteModal
                            }
                        >
                            Cancel
                        </ActionButton>

                        <ActionButton
                            type="button"
                            variant="danger"
                            loading={
                                deleting
                            }
                            loadingText="Deleting..."
                            leadingIcon={
                                <Trash2
                                    size={16}
                                    aria-hidden="true"
                                />
                            }
                            disabled={
                                !canDelete ||
                                !isOnline
                            }
                            onClick={() =>
                                void handleDeleteAccount()
                            }
                        >
                            Delete permanently
                        </ActionButton>
                    </div>
                }
            >
                <div className="grid gap-4">
                    <StatusNotice
                        tone="error"
                    >
                        Your profile and application history will be removed from the PlacementOS database. Cloud-hosted media and external-provider records may require separate cleanup.
                    </StatusNotice>

                    <TextField
                        autoFocus
                        label={`Type ${REQUIRED_DELETE_TEXT} to confirm`}
                        value={
                            deleteConfirmation
                        }
                        placeholder={
                            REQUIRED_DELETE_TEXT
                        }
                        autoComplete="off"
                        error={
                            deleteError ||
                            undefined
                        }
                        onChange={(
                            event
                        ) => {
                            setDeleteConfirmation(
                                event
                                    .target
                                    .value
                            );

                            setDeleteError(
                                ""
                            );
                        }}
                    />
                </div>
            </AppModal>
        </AppLayout>
    );
};

export const SettingsPage = () => {
    return (
        <SettingsPageErrorBoundary>
            <SettingsPageContent />
        </SettingsPageErrorBoundary>
    );
};
