
import {
    useEffect,
    useMemo,
    useState,
} from "react";

import type { FormEvent } from "react";

import { useNavigate } from "react-router-dom";
import {
    openCookieSettings,
} from "../features/cookie-consent/cookieConsent.service";
import {
    AlertTriangle,
    Bug,
    CheckCircle2,
    Cookie,
    Database,
    ExternalLink,
    Loader2,
    Mail,
    MessageSquare,
    Settings,
    Star,
    Trash2,
    X,
} from "lucide-react";

import { AppLayout } from "../components/ui/AppLayout";

import {
    settingsService,
} from "../services/settings.service";

import type {
    FeedbackType,
    SettingsOverview,
} from "../services/settings.service";

import { useAuthStore } from "../store/authStore";

interface FeedbackForm {
    type: FeedbackType;
    subject: string;
    message: string;
    rating: number | null;
}

const EMPTY_FEEDBACK_FORM: FeedbackForm = {
    type: "SUGGESTION",
    subject: "",
    message: "",
    rating: null,
};

const inputClass =
    "w-full rounded-xl border border-border bg-bg-tertiary px-4 py-3 " +
    "text-sm text-text-primary placeholder-text-tertiary transition " +
    "focus:border-brand focus:outline-none";

const labelClass =
    "mb-1.5 block text-sm font-medium text-text-secondary";

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

const formatDate = (value: string) => {
    return new Date(value).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric",
        }
    );
};

const dataLabels: Record<string, string> = {
    dsaProblems: "DSA problems",
    revisions: "DSA revisions",
    resumes: "Resume versions",
    interviews: "Interview sessions",
    dailyPlans: "Daily plans",
    readinessHistory: "Readiness records",
    payments: "Payment records",
    feedback: "Feedback entries",
};

export const SettingsPage = () => {
    const navigate = useNavigate();
    const logout = useAuthStore(
        (state) => state.logout
    );

    const [overview, setOverview] =
        useState<SettingsOverview | null>(null);

    const [pageLoading, setPageLoading] =
        useState(true);

    const [pageError, setPageError] =
        useState("");

    const [feedbackForm, setFeedbackForm] =
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

    const [deleting, setDeleting] =
        useState(false);

    const [deleteError, setDeleteError] =
        useState("");

    const requiredDeleteText =
        "DELETE MY ACCOUNT";

    const supportEmail =
        overview?.support.email ||
        import.meta.env.VITE_SUPPORT_EMAIL ||
        "";

    const canDelete =
        deleteConfirmation ===
        requiredDeleteText;

    const feedbackCharacters =
        feedbackForm.message.length;

    const dataEntries = useMemo(() => {
        if (!overview) return [];

        return Object.entries(
            overview.dataSummary
        );
    }, [overview]);

    const loadOverview = async () => {
        try {
            setPageLoading(true);
            setPageError("");

            const { data } =
                await settingsService.getOverview();

            setOverview(data.data);
        } catch (error: any) {
            setPageError(
                error.response?.data?.message ||
                "Failed to load settings."
            );
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        loadOverview();
    }, []);

    const updateFeedback = <
        Key extends keyof FeedbackForm
    >(
        key: Key,
        value: FeedbackForm[Key]
    ) => {
        setFeedbackForm((current) => ({
            ...current,
            [key]: value,
        }));

        setFeedbackMessage("");
        setFeedbackError("");
    };

    const openBugReport = () => {
        setFeedbackForm((current) => ({
            ...current,
            type: "BUG_REPORT",
            subject:
                current.subject ||
                "Bug in PlacementOS",
        }));

        window.setTimeout(() => {
            document
                .getElementById(
                    "settings-feedback-form"
                )
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
        }, 0);
    };

    const handleFeedbackSubmit = async (
        event: FormEvent
    ) => {
        event.preventDefault();

        const subject =
            feedbackForm.subject.trim();

        const message =
            feedbackForm.message.trim();

        if (subject.length < 4) {
            setFeedbackError(
                "Subject must contain at least 4 characters."
            );
            return;
        }

        if (message.length < 10) {
            setFeedbackError(
                "Message must contain at least 10 characters."
            );
            return;
        }

        setFeedbackSubmitting(true);
        setFeedbackError("");
        setFeedbackMessage("");

        try {
            const { data } =
                await settingsService.submitFeedback(
                    {
                        type: feedbackForm.type,
                        subject,
                        message,
                        rating:
                            feedbackForm.rating,
                        pageUrl:
                            window.location.href,
                    }
                );

            setFeedbackMessage(data.message);
            setFeedbackForm(
                EMPTY_FEEDBACK_FORM
            );

            await loadOverview();
        } catch (error: any) {
            setFeedbackError(
                error.response?.data?.message ||
                "Failed to submit feedback."
            );
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!canDelete) {
            setDeleteError(
                `Type ${requiredDeleteText} exactly.`
            );
            return;
        }

        setDeleting(true);
        setDeleteError("");

        try {
            await settingsService.deleteAccount();

            logout();

            navigate("/login", {
                replace: true,
            });
        } catch (error: any) {
            setDeleteError(
                error.response?.data?.message ||
                "Failed to delete account."
            );

            setDeleting(false);
        }
    };

    const closeDeleteModal = () => {
        if (deleting) return;

        setShowDeleteModal(false);
        setDeleteConfirmation("");
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

    return (
        <AppLayout
            title="Settings"
            description="Manage your account, privacy, data, support, and feedback preferences."
        >
            {pageLoading ? (
                <div className="space-y-5">
                    <div className="h-48 animate-pulse rounded-2xl border border-border bg-bg-secondary" />
                    <div className="h-64 animate-pulse rounded-2xl border border-border bg-bg-secondary" />
                    <div className="h-96 animate-pulse rounded-2xl border border-border bg-bg-secondary" />
                </div>
            ) : pageError ? (
                <div className="rounded-2xl border border-danger/20 bg-danger-muted p-5">
                    <p className="text-sm text-danger">
                        {pageError}
                    </p>

                    <button
                        type="button"
                        onClick={loadOverview}
                        className="mt-3 text-sm font-medium text-danger underline"
                    >
                        Retry
                    </button>
                </div>
            ) : overview ? (
                <div className="mx-auto max-w-6xl space-y-5">
                    <section className="rounded-2xl border border-border bg-bg-secondary p-6">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-muted text-brand">
                                    <Settings size={21} />
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold text-text-primary">
                                        {
                                            overview
                                                .account
                                                .name
                                        }
                                    </h2>

                                    <p className="mt-1 text-sm text-text-tertiary">
                                        {
                                            overview
                                                .account
                                                .email
                                        }
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="rounded-lg bg-bg-tertiary px-2.5 py-1 text-xs font-medium text-text-secondary">
                                            {
                                                overview
                                                    .account
                                                    .role
                                            }
                                        </span>

                                        <span className="rounded-lg bg-brand-muted px-2.5 py-1 text-xs font-medium text-brand">
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

                            <div className="text-left md:text-right">
                                <p className="text-xs uppercase tracking-wide text-text-tertiary">
                                    Member since
                                </p>

                                <p className="mt-1 text-sm font-medium text-text-secondary">
                                    {formatDate(
                                        overview
                                            .account
                                            .createdAt
                                    )}
                                </p>

                                <p className="mt-2 text-xs text-text-tertiary">
                                    PlacementOS v1.0
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-border bg-bg-secondary p-6">
                        <div className="flex items-start gap-3">
                            <Database
                                size={18}
                                className="mt-0.5 text-brand"
                            />

                            <div>
                                <h2 className="text-base font-semibold text-text-primary">
                                    Your stored data
                                </h2>

                                <p className="mt-1 text-sm text-text-tertiary">
                                    Summary of the data currently associated with your PlacementOS account.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                            {dataEntries.map(
                                ([key, value]) => (
                                    <div
                                        key={key}
                                        className="rounded-xl border border-border bg-bg-tertiary p-4"
                                    >
                                        <p className="text-2xl font-bold text-text-primary">
                                            {value}
                                        </p>

                                        <p className="mt-1 text-xs text-text-tertiary">
                                            {dataLabels[
                                                key
                                            ] || key}
                                        </p>
                                    </div>
                                )
                            )}
                        </div>

                        <div className="mt-5 rounded-xl border border-border bg-bg-tertiary p-4">
                            <h3 className="text-sm font-semibold text-text-primary">
                                Privacy information
                            </h3>

                            <div className="mt-3 space-y-2 text-xs leading-5 text-text-tertiary">
                                <p>
                                    • Deleting your account removes your profile, DSA history, revisions, resumes, interviews, readiness history, daily plans, payments, and feedback records from the PlacementOS database.
                                </p>

                                <p>
                                    • Uploaded Cloudinary files are not currently removed automatically with database deletion.
                                </p>

                                <p>
                                    • External payment-provider records may remain with the provider according to its legal and operational requirements.
                                </p>

                                <p>
                                    • PlacementOS does not sell your profile or preparation data.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                        <div className="rounded-2xl border border-border bg-bg-secondary p-6">
                            <Mail
                                size={19}
                                className="text-brand"
                            />

                            <h2 className="mt-4 text-base font-semibold text-text-primary">
                                Contact owner
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-text-tertiary">
                                Contact the PlacementOS owner for account, privacy, or application support.
                            </p>

                            {supportEmail ? (
                                <a
                                    href={`mailto:${supportEmail}?subject=${mailSubject}&body=${mailBody}`}
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition hover:border-brand/40 hover:text-brand"
                                >
                                    Email owner
                                    <ExternalLink
                                        size={13}
                                    />
                                </a>
                            ) : (
                                <p className="mt-5 rounded-xl bg-warning-muted px-3 py-2.5 text-xs text-warning">
                                    Support email has not been configured yet.
                                </p>
                            )}
                        </div>
                        <section className="rounded-2xl border border-border bg-bg-secondary p-6">
                            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-brand">
                                        <Cookie size={18} />
                                    </div>

                                    <div>
                                        <h2 className="text-base font-semibold text-text-primary">
                                            Cookie preferences
                                        </h2>

                                        <p className="mt-1 max-w-3xl text-sm leading-6 text-text-tertiary">
                                            Review or change the optional storage categories PlacementOS may use. Necessary storage remains active for security and core application functionality.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={openCookieSettings}
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-brand/25 bg-brand-muted px-4 py-2.5 text-sm font-medium text-brand transition hover:border-brand/50 active:scale-[0.98]"
                                >
                                    <Cookie size={15} />
                                    Manage preferences
                                </button>
                            </div>
                        </section>
                        <div className="rounded-2xl border border-border bg-bg-secondary p-6">
                            <Bug
                                size={19}
                                className="text-warning"
                            />

                            <h2 className="mt-4 text-base font-semibold text-text-primary">
                                Report a bug
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-text-tertiary">
                                Report unexpected behaviour with page and browser context attached automatically.
                            </p>

                            <button
                                type="button"
                                onClick={openBugReport}
                                className="mt-5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition hover:border-brand/40 hover:text-brand"
                            >
                                Create bug report
                            </button>
                        </div>

                        <div className="rounded-2xl border border-border bg-bg-secondary p-6">
                            <MessageSquare
                                size={19}
                                className="text-success"
                            />

                            <h2 className="mt-4 text-base font-semibold text-text-primary">
                                Feedback loop
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-text-tertiary">
                                Submit suggestions, feature requests, and product feedback directly inside PlacementOS.
                            </p>

                            <p className="mt-5 text-xs text-text-tertiary">
                                {
                                    overview
                                        .dataSummary
                                        .feedback
                                }{" "}
                                submissions from this account
                            </p>
                        </div>
                    </section>

                    <section
                        id="settings-feedback-form"
                        className="scroll-mt-6 rounded-2xl border border-border bg-bg-secondary p-6"
                    >
                        <div className="flex items-start gap-3">
                            <MessageSquare
                                size={18}
                                className="mt-0.5 text-brand"
                            />

                            <div>
                                <h2 className="text-base font-semibold text-text-primary">
                                    Send feedback
                                </h2>

                                <p className="mt-1 text-sm text-text-tertiary">
                                    Your message will be stored for review by the PlacementOS owner.
                                </p>
                            </div>
                        </div>

                        {feedbackMessage && (
                            <div className="mt-5 flex items-center gap-2 rounded-xl border border-success/20 bg-success-muted px-4 py-3 text-sm text-success">
                                <CheckCircle2
                                    size={16}
                                />
                                {feedbackMessage}
                            </div>
                        )}

                        {feedbackError && (
                            <div className="mt-5 rounded-xl border border-danger/20 bg-danger-muted px-4 py-3 text-sm text-danger">
                                {feedbackError}
                            </div>
                        )}

                        <form
                            onSubmit={
                                handleFeedbackSubmit
                            }
                            className="mt-5 space-y-5"
                        >
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div>
                                    <label
                                        className={
                                            labelClass
                                        }
                                    >
                                        Feedback type
                                    </label>

                                    <select
                                        className={
                                            inputClass
                                        }
                                        value={
                                            feedbackForm.type
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
                                    >
                                        {FEEDBACK_TYPES.map(
                                            (
                                                option
                                            ) => (
                                                <option
                                                    key={
                                                        option.value
                                                    }
                                                    value={
                                                        option.value
                                                    }
                                                >
                                                    {
                                                        option.label
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        className={
                                            labelClass
                                        }
                                    >
                                        Rating{" "}
                                        <span className="text-text-tertiary">
                                            (optional)
                                        </span>
                                    </label>

                                    <div className="flex h-[46px] items-center gap-2 rounded-xl border border-border bg-bg-tertiary px-4">
                                        {[1, 2, 3, 4, 5].map(
                                            (
                                                rating
                                            ) => (
                                                <button
                                                    key={
                                                        rating
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        updateFeedback(
                                                            "rating",
                                                            feedbackForm.rating ===
                                                                rating
                                                                ? null
                                                                : rating
                                                        )
                                                    }
                                                    className={
                                                        feedbackForm.rating !==
                                                            null &&
                                                            rating <=
                                                            feedbackForm.rating
                                                            ? "text-warning"
                                                            : "text-text-tertiary"
                                                    }
                                                    aria-label={`${rating} star rating`}
                                                >
                                                    <Star
                                                        size={
                                                            18
                                                        }
                                                        fill={
                                                            feedbackForm.rating !==
                                                                null &&
                                                                rating <=
                                                                feedbackForm.rating
                                                                ? "currentColor"
                                                                : "none"
                                                        }
                                                    />
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label
                                    className={
                                        labelClass
                                    }
                                >
                                    Subject
                                </label>

                                <input
                                    className={
                                        inputClass
                                    }
                                    maxLength={120}
                                    value={
                                        feedbackForm.subject
                                    }
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
                                    placeholder="Briefly describe your feedback"
                                />
                            </div>

                            <div>
                                <div className="mb-1.5 flex items-center justify-between gap-3">
                                    <label className="text-sm font-medium text-text-secondary">
                                        Message
                                    </label>

                                    <span className="text-xs text-text-tertiary">
                                        {
                                            feedbackCharacters
                                        }
                                        /2000
                                    </span>
                                </div>

                                <textarea
                                    className={`${inputClass} min-h-40 resize-none`}
                                    maxLength={2000}
                                    value={
                                        feedbackForm.message
                                    }
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
                                    placeholder="Explain the issue, suggestion, or request in enough detail to act on it."
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={
                                        feedbackSubmitting
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {feedbackSubmitting ? (
                                        <Loader2
                                            size={
                                                15
                                            }
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <MessageSquare
                                            size={
                                                15
                                            }
                                        />
                                    )}

                                    {feedbackSubmitting
                                        ? "Submitting..."
                                        : "Submit feedback"}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="rounded-2xl border border-danger/30 bg-bg-secondary p-6">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                            <div className="flex items-start gap-3">
                                <AlertTriangle
                                    size={19}
                                    className="mt-0.5 text-danger"
                                />

                                <div>
                                    <h2 className="text-base font-semibold text-danger">
                                        Delete account
                                    </h2>

                                    <p className="mt-1 max-w-3xl text-sm leading-6 text-text-tertiary">
                                        Permanently delete this account and its PlacementOS database history. This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowDeleteModal(
                                        true
                                    )
                                }
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger-muted px-4 py-2.5 text-sm font-medium text-danger transition hover:border-danger/60"
                            >
                                <Trash2 size={15} />
                                Delete my account
                            </button>
                        </div>
                    </section>
                </div>
            ) : null}

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-danger/30 bg-bg-secondary shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle
                                    size={18}
                                    className="text-danger"
                                />

                                <h2 className="text-base font-semibold text-text-primary">
                                    Permanently delete account
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeDeleteModal
                                }
                                disabled={deleting}
                                className="text-text-tertiary transition hover:text-text-primary disabled:opacity-50"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4 px-6 py-5">
                            <div className="rounded-xl border border-danger/20 bg-danger-muted p-4 text-sm leading-6 text-danger">
                                Your profile and application history will be removed from the PlacementOS database. Cloud-hosted media and external provider records may require separate cleanup.
                            </div>

                            <div>
                                <label
                                    className={
                                        labelClass
                                    }
                                >
                                    Type{" "}
                                    <span className="font-bold text-text-primary">
                                        {
                                            requiredDeleteText
                                        }
                                    </span>{" "}
                                    to confirm
                                </label>

                                <input
                                    autoFocus
                                    className={
                                        inputClass
                                    }
                                    value={
                                        deleteConfirmation
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
                                    placeholder={
                                        requiredDeleteText
                                    }
                                />
                            </div>

                            {deleteError && (
                                <p className="text-sm text-danger">
                                    {deleteError}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
                            <button
                                type="button"
                                onClick={
                                    closeDeleteModal
                                }
                                disabled={deleting}
                                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition hover:border-border-hover hover:text-text-primary disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleDeleteAccount
                                }
                                disabled={
                                    deleting ||
                                    !canDelete
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-danger px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {deleting ? (
                                    <Loader2
                                        size={15}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Trash2
                                        size={15}
                                    />
                                )}

                                {deleting
                                    ? "Deleting..."
                                    : "Delete permanently"}
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
};

