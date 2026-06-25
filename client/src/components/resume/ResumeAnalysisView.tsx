import {
    useState,
} from "react";

import type {
    ReactNode,
} from "react";

import {
    AlertTriangle,
    CheckCircle2,
    ExternalLink,
    FileText,
    Lightbulb,
    ListChecks,
    Sparkles,
    Target,
    TrendingUp,
} from "lucide-react";

import {
    isAxiosError,
} from "axios";

import {
    ActionButton,
} from "../ui/design-system/ActionButton";

import {
    PageSurface,
} from "../ui/design-system/PageSurface";

import {
    SectionHeader,
} from "../ui/design-system/SectionHeader";

import {
    StatusNotice,
} from "../ui/design-system/StatusNotice";

import type {
    Resume,
} from "../../services/resume.service";

import {
    resumeService,
} from "../../services/resume.service";

import {
    ResumeAnalysisSkeleton,
} from "./ResumeAnalysisSkeleton";

interface ResumeAnalysisViewProps {
    resume: Resume;
}

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
        return {
            text:
                "text-text-tertiary",
            badge:
                "border-border bg-bg-tertiary text-text-tertiary",
            bar:
                "bg-text-tertiary",
            label:
                "Pending",
        };
    }

    if (score >= 75) {
        return {
            text:
                "text-success",
            badge:
                "border-success/20 bg-success/10 text-success",
            bar:
                "bg-success",
            label:
                "Strong",
        };
    }

    if (score >= 55) {
        return {
            text:
                "text-[#A5B4FC]",
            badge:
                "border-brand/20 bg-brand/10 text-[#A5B4FC]",
            bar:
                "bg-brand",
            label:
                "Average",
        };
    }

    return {
        text:
            "text-danger",
        badge:
            "border-danger/20 bg-danger/10 text-danger",
        bar:
            "bg-danger",
        label:
            "Needs Work",
    };
};

const ScoreCard = ({
    label,
    value,
    description,
}: {
    label: string;
    value?: number | null;
    description: string;
}) => {
    const tone =
        getScoreTone(value);

    const normalizedScore =
        typeof value ===
            "number"
            ? Math.min(
                100,
                Math.max(
                    0,
                    value
                )
            )
            : 0;

    return (
        <PageSurface
            as="article"
            variant="interactive"
            padding="md"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-text-tertiary sm:text-[11px]">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
                        {typeof value ===
                            "number"
                            ? value
                            : "--"}

                        <span className="ml-1 text-[10px] font-semibold text-text-tertiary sm:text-xs">
                            /100
                        </span>
                    </p>
                </div>

                <span
                    className={[
                        "shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold sm:px-2.5 sm:text-[10px]",
                        tone.badge,
                    ].join(
                        " "
                    )}
                >
                    {tone.label}
                </span>
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-bg-primary">
                <div
                    className={[
                        "h-full rounded-full transition-[width] duration-700",
                        tone.bar,
                    ].join(
                        " "
                    )}
                    style={{
                        width: `${normalizedScore}%`,
                    }}
                />
            </div>

            <p className="mt-3 text-xs leading-5 text-text-secondary">
                {description}
            </p>
        </PageSurface>
    );
};

const AnalysisSection = ({
    title,
    icon,
    children,
}: {
    title: string;
    icon: ReactNode;
    children: ReactNode;
}) => {
    return (
        <PageSurface padding="lg">
            <SectionHeader
                title={title}
                icon={icon}
                compact
            />

            <div className="mt-4">
                {children}
            </div>
        </PageSurface>
    );
};

const BulletList = ({
    items,
    tone = "default",
}: {
    items: string[];
    tone?:
    | "default"
    | "success"
    | "danger"
    | "brand";
}) => {
    const dotClass =
        tone === "success"
            ? "text-success"
            : tone ===
                "danger"
                ? "text-danger"
                : tone ===
                    "brand"
                    ? "text-[#A5B4FC]"
                    : "text-text-tertiary";

    if (
        !items?.length
    ) {
        return (
            <p className="text-sm text-text-tertiary">
                No data available.
            </p>
        );
    }

    return (
        <ul className="grid gap-2.5">
            {items.map(
                (
                    item,
                    index
                ) => (
                    <li
                        key={`${item}-${index}`}
                        className="flex items-start gap-2.5"
                    >
                        <span
                            aria-hidden="true"
                            className={[
                                "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current",
                                dotClass,
                            ].join(
                                " "
                            )}
                        />

                        <span className="min-w-0 text-sm leading-6 text-text-secondary">
                            {item}
                        </span>
                    </li>
                )
            )}
        </ul>
    );
};

const getPdfErrorMessage = (
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
            "Failed to open resume PDF."
        );
    }

    return "Failed to open resume PDF.";
};

export const ResumeAnalysisView = ({
    resume,
}: ResumeAnalysisViewProps) => {
    const ai =
        resume.aiAnalysis;

    const [
        isOpeningPdf,
        setIsOpeningPdf,
    ] = useState(false);

    const [
        pdfError,
        setPdfError,
    ] = useState("");

    const handleViewPdf =
        async () => {
            setPdfError("");

            /*
             * Open the tab synchronously during the click event.
             * This prevents popup blockers from rejecting it after
             * the asynchronous API request finishes.
             */
            const pdfWindow =
                window.open(
                    "",
                    "_blank"
                );

            if (!pdfWindow) {
                setPdfError(
                    "Your browser blocked the PDF window. Allow pop-ups for PlacementOS and try again."
                );

                return;
            }

            pdfWindow.opener =
                null;

            try {
                setIsOpeningPdf(
                    true
                );

                pdfWindow.document.title =
                    "Opening resume PDF...";

                pdfWindow.document.body.innerHTML = `
                <div style="
                    min-height:100vh;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    margin:0;
                    background:#050816;
                    color:#f8fafc;
                    font-family:Arial,sans-serif;
                ">
                    Opening resume PDF...
                </div>
            `;

                const { data } =
                    await resumeService
                        .viewPdf(
                            resume.id
                        );

                const pdfBlob =
                    data instanceof Blob
                        ? data
                        : new Blob(
                            [data],
                            {
                                type:
                                    "application/pdf",
                            }
                        );

                const pdfUrl =
                    URL.createObjectURL(
                        pdfBlob
                    );

                pdfWindow.location.replace(
                    pdfUrl
                );

                window.setTimeout(
                    () => {
                        URL.revokeObjectURL(
                            pdfUrl
                        );
                    },
                    60_000
                );
            } catch (error) {
                pdfWindow.close();

                setPdfError(
                    getPdfErrorMessage(
                        error
                    )
                );
            } finally {
                setIsOpeningPdf(
                    false
                );
            }
        };

    if (
        resume.analysisStatus ===
        "PENDING"
    ) {
        return (
            <ResumeAnalysisSkeleton />
        );
    }

    if (
        resume.analysisStatus ===
        "FAILED"
    ) {
        return (
            <StatusNotice
                tone="error"
                title="Resume analysis failed"
            >
                The resume was stored, but the intelligence report could not be generated. Upload a text-based PDF and retry.
            </StatusNotice>
        );
    }

    if (!ai) {
        return (
            <PageSurface padding="lg">
                <div className="py-6 text-center">
                    <FileText
                        size={34}
                        className="mx-auto text-text-tertiary"
                        aria-hidden="true"
                    />

                    <h3 className="mt-3 text-base font-bold text-text-primary">
                        No analysis available
                    </h3>

                    <p className="mt-1 text-sm text-text-secondary">
                        Upload a resume to generate ATS and role-fit intelligence.
                    </p>
                </div>
            </PageSurface>
        );
    }

    const missingTechnical =
        ai.missingKeywords
            ?.technical ??
        [];

    const missingTools =
        ai.missingKeywords
            ?.tools ??
        [];

    const missingRoleSpecific =
        ai.missingKeywords
            ?.roleSpecific ??
        [];

    return (
        <div className="grid min-w-0 gap-4 sm:gap-5">
            {pdfError && (
                <StatusNotice
                    tone="error"
                    dismissible
                    onDismiss={() =>
                        setPdfError("")
                    }
                >
                    {pdfError}
                </StatusNotice>
            )}

            <PageSurface
                variant="highlight"
                padding="lg"
            >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-bold text-[#A5B4FC]">
                                Resume v{
                                    resume.version
                                }
                            </span>

                            {resume.targetRole && (
                                <span className="max-w-full truncate rounded-full border border-border bg-bg-tertiary px-3 py-1 text-xs font-semibold text-text-secondary">
                                    {
                                        resume.targetRole
                                    }
                                </span>
                            )}

                            <span className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-bold text-success">
                                {
                                    resume.analysisStatus
                                }
                            </span>
                        </div>

                        <h2 className="mt-4 text-2xl font-black tracking-tight text-text-primary">
                            Resume Intelligence Report
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-text-secondary">
                            {ai.summary}
                        </p>

                        <PageSurface
                            as="div"
                            variant="subtle"
                            padding="sm"
                            className="mt-4"
                        >
                            <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-text-tertiary">
                                Recruiter verdict
                            </p>

                            <p className="mt-1 text-sm leading-6 text-text-secondary">
                                {
                                    ai.recruiterVerdict
                                }
                            </p>
                        </PageSurface>
                    </div>

                    <ActionButton
                        type="button"
                        variant="secondary"
                        fullWidth
                        loading={
                            isOpeningPdf
                        }
                        loadingText="Opening..."
                        leadingIcon={
                            <ExternalLink
                                size={15}
                                aria-hidden="true"
                            />
                        }
                        onClick={() =>
                            void handleViewPdf()
                        }
                        className="sm:w-auto"
                    >
                        View PDF
                    </ActionButton>
                </div>
            </PageSurface>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                <ScoreCard
                    label="ATS Score"
                    value={
                        resume.atsScore
                    }
                    description="Formatting, ATS readability, sections, and recruiter clarity."
                />

                <ScoreCard
                    label="Role Fit"
                    value={
                        resume.roleFitScore
                    }
                    description="Alignment with the selected target role."
                />

                <ScoreCard
                    label="Keywords"
                    value={
                        resume.keywordScore
                    }
                    description="Technical, tooling, and role-specific keyword strength."
                />

                <ScoreCard
                    label="Projects"
                    value={
                        resume.projectScore
                    }
                    description="Technical complexity, architecture, and measurable impact."
                />

                <ScoreCard
                    label="Readability"
                    value={
                        resume.readabilityScore
                    }
                    description="Clarity, conciseness, grammar, and scanability."
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <AnalysisSection
                    title="Top Strengths"
                    icon={
                        <CheckCircle2
                            size={17}
                            aria-hidden="true"
                        />
                    }
                >
                    <BulletList
                        items={
                            ai.topStrengths ??
                            []
                        }
                        tone="success"
                    />
                </AnalysisSection>

                <AnalysisSection
                    title="Critical Issues"
                    icon={
                        <AlertTriangle
                            size={17}
                            aria-hidden="true"
                        />
                    }
                >
                    <BulletList
                        items={
                            ai.criticalIssues ??
                            []
                        }
                        tone="danger"
                    />
                </AnalysisSection>
            </div>

            <AnalysisSection
                title="Missing Keywords"
                icon={
                    <Target
                        size={17}
                        aria-hidden="true"
                    />
                }
            >
                <div className="grid gap-3 md:grid-cols-3">
                    {[
                        {
                            label:
                                "Technical",
                            items:
                                missingTechnical,
                        },
                        {
                            label:
                                "Tools",
                            items:
                                missingTools,
                        },
                        {
                            label:
                                "Role Specific",
                            items:
                                missingRoleSpecific,
                        },
                    ].map(
                        (
                            group
                        ) => (
                            <PageSurface
                                key={
                                    group.label
                                }
                                as="div"
                                variant="subtle"
                                padding="sm"
                            >
                                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.13em] text-text-tertiary">
                                    {
                                        group.label
                                    }
                                </p>

                                <BulletList
                                    items={
                                        group.items
                                    }
                                    tone="brand"
                                />
                            </PageSurface>
                        )
                    )}
                </div>
            </AnalysisSection>

            <AnalysisSection
                title="Section-by-Section Feedback"
                icon={
                    <ListChecks
                        size={17}
                        aria-hidden="true"
                    />
                }
            >
                <div className="grid gap-3">
                    {(ai.sectionFeedback ??
                        []).map(
                            (
                                section,
                                index
                            ) => {
                                const tone =
                                    getScoreTone(
                                        section.score
                                    );

                                const normalizedScore =
                                    Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            section.score
                                        )
                                    );

                                return (
                                    <PageSurface
                                        key={`${section.section}-${index}`}
                                        as="article"
                                        variant="subtle"
                                        padding="sm"
                                    >
                                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-bold text-text-primary">
                                                    {
                                                        section.section
                                                    }
                                                </h4>

                                                <p className="mt-1 text-sm leading-6 text-text-secondary">
                                                    {
                                                        section.diagnosis
                                                    }
                                                </p>
                                            </div>

                                            <span
                                                className={[
                                                    "shrink-0 text-sm font-black",
                                                    tone.text,
                                                ].join(
                                                    " "
                                                )}
                                            >
                                                {
                                                    section.score
                                                }
                                                /100
                                            </span>
                                        </div>

                                        <div className="my-3 h-1.5 overflow-hidden rounded-full bg-bg-primary">
                                            <div
                                                className={[
                                                    "h-full rounded-full transition-[width] duration-700",
                                                    tone.bar,
                                                ].join(
                                                    " "
                                                )}
                                                style={{
                                                    width: `${normalizedScore}%`,
                                                }}
                                            />
                                        </div>

                                        <BulletList
                                            items={
                                                section.fixes ??
                                                []
                                            }
                                            tone="brand"
                                        />
                                    </PageSurface>
                                );
                            }
                        )}
                </div>
            </AnalysisSection>

            <AnalysisSection
                title="Project Improvements"
                icon={
                    <TrendingUp
                        size={17}
                        aria-hidden="true"
                    />
                }
            >
                {(ai.projectImprovements ??
                    []).length ===
                    0 ? (
                    <p className="text-sm text-text-tertiary">
                        No project improvement suggestions available.
                    </p>
                ) : (
                    <div className="grid gap-4">
                        {ai.projectImprovements.map(
                            (
                                project,
                                index
                            ) => (
                                <PageSurface
                                    key={`${project.projectName}-${index}`}
                                    as="article"
                                    variant="subtle"
                                    padding="sm"
                                >
                                    <h4 className="text-sm font-bold text-text-primary">
                                        {
                                            project.projectName
                                        }
                                    </h4>

                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-text-tertiary">
                                                Problem
                                            </p>

                                            <p className="mt-1 text-sm leading-6 text-text-secondary">
                                                {
                                                    project.problem
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-text-tertiary">
                                                Improvement
                                            </p>

                                            <p className="mt-1 text-sm leading-6 text-text-secondary">
                                                {
                                                    project.improvement
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-xl border border-brand/15 bg-brand/5 p-4">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#A5B4FC]">
                                            Rewritten bullet
                                        </p>

                                        <p className="mt-2 text-sm leading-6 text-text-primary">
                                            {
                                                project.rewrittenBullet
                                            }
                                        </p>
                                    </div>
                                </PageSurface>
                            )
                        )}
                    </div>
                )}
            </AnalysisSection>

            <div className="grid gap-4 lg:grid-cols-2">
                <AnalysisSection
                    title="Suggested Resume Bullets"
                    icon={
                        <Sparkles
                            size={17}
                            aria-hidden="true"
                        />
                    }
                >
                    <BulletList
                        items={
                            ai.suggestedBullets ??
                            []
                        }
                        tone="brand"
                    />
                </AnalysisSection>

                <AnalysisSection
                    title="Action Plan"
                    icon={
                        <Lightbulb
                            size={17}
                            aria-hidden="true"
                        />
                    }
                >
                    <BulletList
                        items={
                            ai.actionPlan ??
                            []
                        }
                        tone="brand"
                    />
                </AnalysisSection>
            </div>
        </div>
    );
};
