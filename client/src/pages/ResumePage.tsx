import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertCircle,
    Clock,
    FileText,
    RefreshCw,
    Trash2,
    Upload,
    WifiOff,
} from "lucide-react";

import {
    isAxiosError,
} from "axios";

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
    PageSurface,
} from "../components/ui/design-system/PageSurface";

import {
    SectionHeader,
} from "../components/ui/design-system/SectionHeader";

import {
    Skeleton,
} from "../components/ui/design-system/Skeleton";

import {
    StatusNotice,
} from "../components/ui/design-system/StatusNotice";

import {
    ResumeAnalysisSkeleton,
} from "../components/resume/ResumeAnalysisSkeleton";

import {
    ResumeAnalysisView,
} from "../components/resume/ResumeAnalysisView";

import {
    ResumeErrorBoundary,
} from "../components/resume/ResumeErrorBoundary";

import {
    UploadResumeModal,
} from "../components/resume/UploadResumeModal";

import {
    resumeService,
} from "../services/resume.service";

import type {
    Resume,
} from "../services/resume.service";

interface ApiErrorResponse {
    message?: string;
}

const getScoreTone = (
    score?: number | null
) => {
    if (
        typeof score !==
        "number"
    ) {
        return "text-text-tertiary";
    }

    if (score >= 75) {
        return "text-success";
    }

    if (score >= 55) {
        return "text-[#A5B4FC]";
    }

    return "text-danger";
};

const formatDate = (
    date: string
) => {
    return new Date(
        date
    ).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
        }
    );
};

const formatFileSize = (
    size?: number | null
) => {
    if (!size) {
        return "Unknown size";
    }

    return `${(
        size /
        1024 /
        1024
    ).toFixed(2)} MB`;
};

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

const ResumeVersionCard = ({
    resume,
    selected,
    deleting,
    mobile = false,
    onSelect,
    onDelete,
}: {
    resume: Resume;
    selected: boolean;
    deleting: boolean;
    mobile?: boolean;
    onSelect: () => void;
    onDelete: () => void;
}) => {
    const scoreTone =
        getScoreTone(
            resume.atsScore
        );

    return (
        <div
            className={[
                "group relative rounded-xl border text-left transition duration-200",
                mobile
                    ? "w-[17rem] shrink-0 snap-start"
                    : "w-full",
                selected
                    ? "border-brand/55 bg-brand/10 shadow-[0_0_0_1px_rgba(99,102,241,0.10)]"
                    : "border-border bg-bg-tertiary hover:border-border-hover hover:bg-bg-hover",
            ].join(
                " "
            )}
        >
            <button
                type="button"
                onClick={
                    onSelect
                }
                aria-pressed={
                    selected
                }
                className="w-full rounded-xl p-3 pr-11 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/70"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-text-primary">
                                Version{" "}
                                {
                                    resume.version
                                }
                            </p>

                            <span
                                className={[
                                    "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                                    resume.analysisStatus ===
                                        "ANALYZED"
                                        ? "border-success/20 bg-success/10 text-success"
                                        : resume.analysisStatus ===
                                            "FAILED"
                                            ? "border-danger/20 bg-danger/10 text-danger"
                                            : "border-warning/20 bg-warning/10 text-warning",
                                ].join(
                                    " "
                                )}
                            >
                                {
                                    resume.analysisStatus
                                }
                            </span>
                        </div>

                        <p className="mt-1 truncate text-xs text-text-secondary">
                            {resume.fileName ||
                                "Resume PDF"}
                        </p>

                        <p className="mt-2 text-[11px] text-text-tertiary">
                            {formatDate(
                                resume.createdAt
                            )}{" "}
                            ·{" "}
                            {formatFileSize(
                                resume.fileSize
                            )}
                        </p>
                    </div>

                    <span
                        className={[
                            "shrink-0 text-lg font-black",
                            scoreTone,
                        ].join(
                            " "
                        )}
                    >
                        {typeof resume.atsScore ===
                            "number"
                            ? resume.atsScore
                            : "--"}
                    </span>
                </div>

                {resume.targetRole && (
                    <p className="mt-3 truncate rounded-lg border border-border bg-bg-secondary/70 px-2.5 py-1.5 text-xs text-text-secondary">
                        {
                            resume.targetRole
                        }
                    </p>
                )}
            </button>

            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    onDelete();
                }}
                disabled={deleting}
                aria-label={`Delete resume version ${resume.version}`}
                className={[
                    "absolute right-2 top-2",
                    "inline-flex h-9 w-9 items-center justify-center",
                    "rounded-lg border border-border",
                    "bg-bg-secondary/90 text-text-tertiary",
                    "opacity-100 shadow-sm backdrop-blur-sm",
                    "transition duration-150",
                    "hover:border-danger/40 hover:bg-danger/10 hover:text-danger",
                    "active:scale-95",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/70",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                ].join(" ")}
            >
                <Trash2
                    size={14}
                    className={
                        deleting
                            ? "animate-pulse"
                            : ""
                    }
                    aria-hidden="true"
                />
            </button>
        </div>
    );
};

const ResumePageContent = () => {
    const [
        resumes,
        setResumes,
    ] = useState<Resume[]>(
        []
    );

    const [
        selectedResume,
        setSelectedResume,
    ] = useState<Resume | null>(
        null
    );

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        isDeletingId,
        setIsDeletingId,
    ] = useState<string | null>(
        null
    );

    const [
        pendingDeleteResume,
        setPendingDeleteResume,
    ] = useState<Resume | null>(
        null
    );

    const [
        showUploadModal,
        setShowUploadModal,
    ] = useState(false);

    const [
        error,
        setError,
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

    const sortedResumes =
        useMemo(
            () =>
                [...resumes].sort(
                    (
                        first,
                        second
                    ) =>
                        new Date(
                            second.createdAt
                        ).getTime() -
                        new Date(
                            first.createdAt
                        ).getTime()
                ),
            [resumes]
        );

    const fetchResumes =
        async (
            showLoading = true
        ) => {
            try {
                if (showLoading) {
                    setIsLoading(
                        true
                    );
                }

                setError("");

                const { data } =
                    await resumeService
                        .getAll();

                const nextResumes =
                    data.resumes;

                setResumes(
                    nextResumes
                );

                setSelectedResume(
                    (current) => {
                        if (
                            nextResumes.length ===
                            0
                        ) {
                            return null;
                        }

                        if (!current) {
                            return nextResumes[0];
                        }

                        return (
                            nextResumes.find(
                                (
                                    resume
                                ) =>
                                    resume.id ===
                                    current.id
                            ) ??
                            nextResumes[0]
                        );
                    }
                );
            } catch (fetchError) {
                setError(
                    getErrorMessage(
                        fetchError,
                        "Failed to load resume intelligence reports."
                    )
                );
            } finally {
                if (showLoading) {
                    setIsLoading(
                        false
                    );
                }
            }
        };

    useEffect(() => {
        void fetchResumes();

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

    const handleUploaded = (
        resume: Resume
    ) => {
        setResumes(
            (previous) => [
                resume,
                ...previous.filter(
                    (
                        item
                    ) =>
                        item.id !==
                        resume.id
                ),
            ]
        );

        setSelectedResume(
            resume
        );

        setError("");
    };

    const handleDelete =
        async () => {
            if (
                !pendingDeleteResume
            ) {
                return;
            }

            if (!isOnline) {
                setError(
                    "You are offline. Reconnect before deleting a resume."
                );
                return;
            }

            const resumeId =
                pendingDeleteResume.id;

            try {
                setIsDeletingId(
                    resumeId
                );

                setError("");

                await resumeService
                    .delete(
                        resumeId
                    );

                setResumes(
                    (previous) => {
                        const updated =
                            previous.filter(
                                (
                                    resume
                                ) =>
                                    resume.id !==
                                    resumeId
                            );

                        setSelectedResume(
                            (
                                current
                            ) =>
                                current?.id ===
                                    resumeId
                                    ? updated[0] ??
                                    null
                                    : current
                        );

                        return updated;
                    }
                );

                setPendingDeleteResume(
                    null
                );
            } catch (deleteError) {
                setError(
                    getErrorMessage(
                        deleteError,
                        "Failed to delete resume version."
                    )
                );
            } finally {
                setIsDeletingId(
                    null
                );
            }
        };

    return (
        <AppLayout
            title="Resume Intelligence"
            description="ATS score, role fit, keyword gaps, project depth, and an actionable improvement plan."
        >
            <div className="mx-auto grid w-full max-w-[1500px] gap-4 sm:gap-5">
                <PageSurface padding="md">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <SectionHeader
                            title="Resume workspace"
                            description={`${resumes.length} saved ${resumes.length ===
                                1
                                ? "version"
                                : "versions"
                                }. Select a report to compare progress.`}
                            icon={
                                <FileText
                                    size={19}
                                    aria-hidden="true"
                                />
                            }
                            compact
                        />

                        <div className="grid grid-cols-2 gap-2 sm:flex">
                            <ActionButton
                                type="button"
                                variant="secondary"
                                loading={
                                    isLoading
                                }
                                loadingText="Loading..."
                                leadingIcon={
                                    <RefreshCw
                                        size={15}
                                        aria-hidden="true"
                                    />
                                }
                                disabled={
                                    !isOnline
                                }
                                onClick={() =>
                                    void fetchResumes()
                                }
                            >
                                Refresh
                            </ActionButton>

                            <ActionButton
                                type="button"
                                leadingIcon={
                                    <Upload
                                        size={16}
                                        aria-hidden="true"
                                    />
                                }
                                disabled={
                                    !isOnline
                                }
                                onClick={() =>
                                    setShowUploadModal(
                                        true
                                    )
                                }
                            >
                                Upload
                            </ActionButton>
                        </div>
                    </div>
                </PageSurface>

                {!isOnline && (
                    <StatusNotice
                        tone="warning"
                        title="You are offline"
                    >
                        <span className="inline-flex items-start gap-2">
                            <WifiOff
                                size={16}
                                className="mt-0.5 shrink-0"
                                aria-hidden="true"
                            />

                            Existing reports remain visible, but uploads, refreshes, PDF viewing, and deletion may fail until the connection returns.
                        </span>
                    </StatusNotice>
                )}

                {error && (
                    <StatusNotice
                        tone="error"
                        dismissible
                        onDismiss={() =>
                            setError("")
                        }
                    >
                        <span className="inline-flex items-start gap-2">
                            <AlertCircle
                                size={16}
                                className="mt-0.5 shrink-0"
                                aria-hidden="true"
                            />

                            {error}
                        </span>
                    </StatusNotice>
                )}

                {isLoading ? (
                    <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            {Array.from({
                                length: 3,
                            }).map(
                                (
                                    _,
                                    index
                                ) => (
                                    <Skeleton
                                        key={
                                            index
                                        }
                                        height="7rem"
                                    />
                                )
                            )}
                        </div>

                        <ResumeAnalysisSkeleton />
                    </div>
                ) : resumes.length ===
                    0 ? (
                    <EmptyState
                        title="Upload your first resume"
                        description="Generate ATS, role-fit, keyword, project, readability, and recruiter-focused improvement intelligence."
                        icon={
                            <FileText
                                size={30}
                                aria-hidden="true"
                            />
                        }
                        action={
                            <ActionButton
                                type="button"
                                leadingIcon={
                                    <Upload
                                        size={16}
                                        aria-hidden="true"
                                    />
                                }
                                disabled={
                                    !isOnline
                                }
                                onClick={() =>
                                    setShowUploadModal(
                                        true
                                    )
                                }
                            >
                                Upload First Resume
                            </ActionButton>
                        }
                    />
                ) : (
                    <>
                        <section className="lg:hidden">
                            <div className="mb-3 flex items-center gap-2">
                                <Clock
                                    size={15}
                                    className="text-[#A5B4FC]"
                                    aria-hidden="true"
                                />

                                <h2 className="text-sm font-bold text-text-primary">
                                    Version history
                                </h2>
                            </div>

                            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
                                {sortedResumes.map(
                                    (
                                        resume
                                    ) => (
                                        <ResumeVersionCard
                                            key={
                                                resume.id
                                            }
                                            resume={
                                                resume
                                            }
                                            selected={
                                                selectedResume?.id ===
                                                resume.id
                                            }
                                            deleting={
                                                isDeletingId ===
                                                resume.id
                                            }
                                            mobile
                                            onSelect={() =>
                                                setSelectedResume(
                                                    resume
                                                )
                                            }
                                            onDelete={() =>
                                                setPendingDeleteResume(
                                                    resume
                                                )
                                            }
                                        />
                                    )
                                )}
                            </div>
                        </section>

                        <div className="grid min-w-0 gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
                            <aside className="hidden lg:block">
                                <PageSurface
                                    padding="md"
                                    className="sticky top-6"
                                >
                                    <div className="mb-4 flex items-center gap-2">
                                        <Clock
                                            size={15}
                                            className="text-[#A5B4FC]"
                                            aria-hidden="true"
                                        />

                                        <h2 className="text-sm font-bold text-text-primary">
                                            Version history
                                        </h2>
                                    </div>

                                    <div className="grid gap-2">
                                        {sortedResumes.map(
                                            (
                                                resume
                                            ) => (
                                                <ResumeVersionCard
                                                    key={
                                                        resume.id
                                                    }
                                                    resume={
                                                        resume
                                                    }
                                                    selected={
                                                        selectedResume?.id ===
                                                        resume.id
                                                    }
                                                    deleting={
                                                        isDeletingId ===
                                                        resume.id
                                                    }
                                                    onSelect={() =>
                                                        setSelectedResume(
                                                            resume
                                                        )
                                                    }
                                                    onDelete={() =>
                                                        setPendingDeleteResume(
                                                            resume
                                                        )
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                </PageSurface>
                            </aside>

                            <main className="min-w-0">
                                {selectedResume ? (
                                    <ResumeAnalysisView
                                        resume={
                                            selectedResume
                                        }
                                    />
                                ) : (
                                    <EmptyState
                                        compact
                                        title="Select a resume version"
                                        description="Choose a saved version to view its analysis report."
                                        icon={
                                            <FileText
                                                size={28}
                                                aria-hidden="true"
                                            />
                                        }
                                    />
                                )}
                            </main>
                        </div>
                    </>
                )}
            </div>

            {showUploadModal && (
                <UploadResumeModal
                    onClose={() =>
                        setShowUploadModal(
                            false
                        )
                    }
                    onUploaded={
                        handleUploaded
                    }
                />
            )}

            <AppModal
                open={
                    Boolean(
                        pendingDeleteResume
                    )
                }
                title="Delete resume version?"
                description={
                    pendingDeleteResume
                        ? `Version ${pendingDeleteResume.version} and its analysis report will be permanently removed.`
                        : undefined
                }
                size="sm"
                busy={
                    Boolean(
                        isDeletingId
                    )
                }
                icon={
                    <Trash2
                        size={19}
                        aria-hidden="true"
                    />
                }
                onClose={() =>
                    setPendingDeleteResume(
                        null
                    )
                }
                footer={
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <ActionButton
                            type="button"
                            variant="secondary"
                            disabled={
                                Boolean(
                                    isDeletingId
                                )
                            }
                            onClick={() =>
                                setPendingDeleteResume(
                                    null
                                )
                            }
                        >
                            Cancel
                        </ActionButton>

                        <ActionButton
                            type="button"
                            variant="danger"
                            loading={
                                Boolean(
                                    isDeletingId
                                )
                            }
                            loadingText="Deleting..."
                            leadingIcon={
                                <Trash2
                                    size={16}
                                    aria-hidden="true"
                                />
                            }
                            disabled={
                                !isOnline
                            }
                            onClick={() =>
                                void handleDelete()
                            }
                        >
                            Delete version
                        </ActionButton>
                    </div>
                }
            >
                <StatusNotice
                    tone="error"
                >
                    This operation cannot be undone. The stored file and generated intelligence report for this version will be removed.
                </StatusNotice>
            </AppModal>
        </AppLayout>
    );
};

export const ResumePage = () => {
    return (
        <ResumeErrorBoundary>
            <ResumePageContent />
        </ResumeErrorBoundary>
    );
};
