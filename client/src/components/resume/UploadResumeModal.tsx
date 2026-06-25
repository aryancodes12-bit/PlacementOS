import {
    useEffect,
    useRef,
    useState,
} from "react";

import type {
    DragEvent,
} from "react";

import {
    AlertCircle,
    CheckCircle2,
    FileText,
    ShieldCheck,
    Sparkles,
    Target,
    UploadCloud,
    WifiOff,
} from "lucide-react";

import {
    isAxiosError,
} from "axios";

import {
    ActionButton,
} from "../ui/design-system/ActionButton";

import {
    AppModal,
} from "../ui/design-system/AppModal";

import {
    PageSurface,
} from "../ui/design-system/PageSurface";

import {
    StatusNotice,
} from "../ui/design-system/StatusNotice";

import {
    TextField,
} from "../ui/design-system/FormControls";

import {
    resumeService,
} from "../../services/resume.service";

import type {
    Resume,
} from "../../services/resume.service";

import {
    ResumeAnalysisSkeleton,
} from "./ResumeAnalysisSkeleton";

interface UploadResumeModalProps {
    onClose: () => void;
    onUploaded: (resume: Resume) => void;
}

interface ApiErrorResponse {
    message?: string;
}

type UploadPhase =
    | "uploading"
    | "extracting"
    | "analyzing"
    | "finalizing";

const MAX_FILE_SIZE =
    50 * 1024 * 1024;

const ANALYSIS_STAGES: Array<{
    phase: UploadPhase;
    title: string;
    description: string;
}> = [
        {
            phase: "uploading",
            title: "Uploading securely",
            description:
                "Sending the selected resume to the protected analysis service.",
        },
        {
            phase: "extracting",
            title: "Reading resume content",
            description:
                "Extracting experience, projects, education, sections, and technical terms.",
        },
        {
            phase: "analyzing",
            title: "Running AI analysis",
            description:
                "Evaluating ATS quality, role fit, keywords, projects, and readability.",
        },
        {
            phase: "finalizing",
            title: "Preparing your report",
            description:
                "Saving scores and generating the focused improvement plan.",
        },
    ];

const getErrorMessage = (
    error: unknown
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
            "Resume upload or analysis failed. Please retry."
        );
    }

    return "Resume upload or analysis failed. Please retry.";
};

const isSupportedPdf = (
    file: File
) => {
    return (
        file.type ===
        "application/pdf" ||
        file.name
            .toLowerCase()
            .endsWith(".pdf")
    );
};

export const UploadResumeModal = ({
    onClose,
    onUploaded,
}: UploadResumeModalProps) => {
    const fileInputRef =
        useRef<HTMLInputElement | null>(
            null
        );

    const stageTimerRef =
        useRef<ReturnType<typeof setInterval> | null>(
            null
        );

    const [
        resumeFile,
        setResumeFile,
    ] = useState<File | null>(
        null
    );

    const [
        targetRole,
        setTargetRole,
    ] = useState(
        "Full Stack Developer"
    );

    const [
        error,
        setError,
    ] = useState("");

    const [
        isUploading,
        setIsUploading,
    ] = useState(false);

    const [
        dragActive,
        setDragActive,
    ] = useState(false);

    const [
        stageIndex,
        setStageIndex,
    ] = useState(0);

    const [
        isOnline,
        setIsOnline,
    ] = useState(
        () =>
            typeof navigator ===
            "undefined" ||
            navigator.onLine
    );

    const currentStage =
        ANALYSIS_STAGES[
        Math.min(
            stageIndex,
            ANALYSIS_STAGES.length -
            1
        )
        ];

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

            if (
                stageTimerRef.current
            ) {
                clearInterval(
                    stageTimerRef.current
                );
            }
        };
    }, []);

    const handleFileChange = (
        file?: File | null
    ) => {
        setError("");

        if (!file) {
            return;
        }

        if (
            !isSupportedPdf(file)
        ) {
            setResumeFile(null);

            setError(
                "Unsupported file type. The current PlacementOS analysis service accepts PDF resumes only."
            );
            return;
        }

        if (
            file.size === 0
        ) {
            setResumeFile(null);

            setError(
                "The selected PDF is empty. Choose a valid resume file."
            );
            return;
        }

        if (
            file.size >
            MAX_FILE_SIZE
        ) {
            setResumeFile(null);

            setError(
                "Resume size must be below 50 MB."
            );
            return;
        }

        setResumeFile(file);
    };

    const handleDrop = (
        event: DragEvent<HTMLButtonElement>
    ) => {
        event.preventDefault();

        setDragActive(false);

        if (isUploading) {
            return;
        }

        handleFileChange(
            event.dataTransfer
                .files?.[0]
        );
    };

    const handleUpload =
        async () => {
            if (!resumeFile) {
                setError(
                    "Select a resume PDF before starting analysis."
                );
                return;
            }

            if (!isOnline) {
                setError(
                    "You are offline. Reconnect before uploading your resume."
                );
                return;
            }

            try {
                setIsUploading(true);
                setError("");
                setStageIndex(0);

                stageTimerRef.current =
                    setInterval(
                        () => {
                            setStageIndex(
                                (
                                    current
                                ) =>
                                    Math.min(
                                        current +
                                        1,
                                        ANALYSIS_STAGES.length -
                                        2
                                    )
                            );
                        },
                        1_350
                    );

                const formData =
                    new FormData();

                formData.append(
                    "resume",
                    resumeFile
                );

                if (
                    targetRole.trim()
                ) {
                    formData.append(
                        "targetRole",
                        targetRole.trim()
                    );
                }

                const { data } =
                    await resumeService
                        .upload(
                            formData
                        );

                if (
                    stageTimerRef.current
                ) {
                    clearInterval(
                        stageTimerRef.current
                    );

                    stageTimerRef.current =
                        null;
                }

                setStageIndex(
                    ANALYSIS_STAGES.length -
                    1
                );

                await new Promise(
                    (resolve) => {
                        window.setTimeout(
                            resolve,
                            300
                        );
                    }
                );

                onUploaded(
                    data.resume
                );

                onClose();
            } catch (uploadError) {
                setError(
                    getErrorMessage(
                        uploadError
                    )
                );

                setStageIndex(0);
            } finally {
                if (
                    stageTimerRef.current
                ) {
                    clearInterval(
                        stageTimerRef.current
                    );

                    stageTimerRef.current =
                        null;
                }

                setIsUploading(false);
            }
        };

    const footer =
        isUploading
            ? undefined
            : (
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <ActionButton
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </ActionButton>

                    <ActionButton
                        type="button"
                        disabled={
                            !resumeFile ||
                            !isOnline
                        }
                        leadingIcon={
                            <Sparkles
                                size={16}
                                aria-hidden="true"
                            />
                        }
                        onClick={() =>
                            void handleUpload()
                        }
                    >
                        Upload & Analyze
                    </ActionButton>
                </div>
            );

    return (
        <AppModal
            open
            title="Upload and analyze"
            description="Generate ATS, role-fit, keyword, project, and readability intelligence."
            size="md"
            busy={isUploading}
            icon={
                <Sparkles
                    size={19}
                    aria-hidden="true"
                />
            }
            footer={footer}
            onClose={onClose}
        >
            {isUploading ? (
                <div className="grid gap-4">
                    <PageSurface
                        as="div"
                        variant="highlight"
                        padding="md"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-[#A5B4FC]">
                                <Sparkles
                                    size={18}
                                    className="animate-pulse"
                                    aria-hidden="true"
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-text-primary">
                                    {
                                        currentStage.title
                                    }
                                </p>

                                <p className="mt-1 text-xs leading-5 text-text-secondary">
                                    {
                                        currentStage.description
                                    }
                                </p>

                                <div className="mt-4 grid grid-cols-4 gap-2">
                                    {ANALYSIS_STAGES.map(
                                        (
                                            stage,
                                            index
                                        ) => (
                                            <span
                                                key={
                                                    stage.phase
                                                }
                                                className={[
                                                    "h-1.5 rounded-full transition-colors duration-300",
                                                    index <=
                                                        stageIndex
                                                        ? "bg-brand"
                                                        : "bg-bg-hover",
                                                ].join(
                                                    " "
                                                )}
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </PageSurface>

                    <ResumeAnalysisSkeleton
                        compact
                        message={
                            currentStage.description
                        }
                    />

                    <StatusNotice
                        tone="info"
                    >
                        <span className="inline-flex items-start gap-2">
                            <ShieldCheck
                                size={16}
                                className="mt-0.5 shrink-0 text-success"
                                aria-hidden="true"
                            />

                            Keep this window open while the report is being generated. Duplicate uploads are disabled.
                        </span>
                    </StatusNotice>
                </div>
            ) : (
                <div className="grid gap-5">
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

                                Reconnect before uploading a resume.
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

                    <TextField
                        label="Target role"
                        value={targetRole}
                        maxLength={100}
                        leadingIcon={
                            <Target
                                size={16}
                                aria-hidden="true"
                            />
                        }
                        placeholder="Full Stack Developer, Backend Developer, SDE Intern"
                        onChange={(
                            event
                        ) =>
                            setTargetRole(
                                event.target.value
                            )
                        }
                    />

                    <div>
                        <p className="mb-2 text-sm font-semibold text-text-secondary">
                            Resume file
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            onDragEnter={(
                                event
                            ) => {
                                event.preventDefault();
                                setDragActive(
                                    true
                                );
                            }}
                            onDragOver={(
                                event
                            ) =>
                                event.preventDefault()
                            }
                            onDragLeave={(
                                event
                            ) => {
                                event.preventDefault();
                                setDragActive(
                                    false
                                );
                            }}
                            onDrop={
                                handleDrop
                            }
                            className={[
                                "w-full rounded-2xl border-2 border-dashed px-5 py-7 text-center",
                                "outline-none transition duration-200",
                                "focus-visible:ring-2 focus-visible:ring-brand/70",
                                "active:scale-[0.99]",
                                dragActive
                                    ? "scale-[1.01] border-brand bg-brand/10"
                                    : resumeFile
                                        ? "border-brand/55 bg-brand/10"
                                        : "border-border bg-bg-tertiary hover:border-brand/50 hover:bg-brand/5",
                            ].join(
                                " "
                            )}
                        >
                            <input
                                ref={
                                    fileInputRef
                                }
                                type="file"
                                accept="application/pdf,.pdf"
                                className="hidden"
                                onChange={(
                                    event
                                ) => {
                                    handleFileChange(
                                        event
                                            .target
                                            .files?.[0]
                                    );

                                    event.target.value =
                                        "";
                                }}
                            />

                            {resumeFile ? (
                                <div className="grid gap-3">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-[#A5B4FC]">
                                        <FileText
                                            size={22}
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-text-primary">
                                            {
                                                resumeFile.name
                                            }
                                        </p>

                                        <p className="mt-1 text-xs text-text-tertiary">
                                            {(
                                                resumeFile.size /
                                                1024 /
                                                1024
                                            ).toFixed(
                                                2
                                            )}{" "}
                                            MB · PDF
                                        </p>
                                    </div>

                                    <span className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                                        <CheckCircle2
                                            size={13}
                                            aria-hidden="true"
                                        />
                                        Ready to analyze
                                    </span>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-bg-secondary text-text-secondary">
                                        <UploadCloud
                                            size={23}
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <div>
                                        <p className="text-sm font-bold text-text-primary">
                                            Drop your resume here or browse
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-text-tertiary">
                                            PDF only, up to 50 MB. Text-based PDFs provide the best result.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </button>
                    </div>

                    <PageSurface
                        as="div"
                        variant="subtle"
                        padding="sm"
                    >
                        <p className="text-xs leading-5 text-text-secondary">
                            PlacementOS extracts resume text, evaluates ATS quality and role fit, detects missing keywords, scores project depth, and generates a focused action plan.
                        </p>
                    </PageSurface>
                </div>
            )}
        </AppModal>
    );
};
