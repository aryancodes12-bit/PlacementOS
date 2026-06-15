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
import type { Resume } from "../../services/resume.service";
import { resumeService } from "../../services/resume.service";
interface ResumeAnalysisViewProps {
    resume: Resume;
}

const getScoreTone = (score?: number | null) => {
    if (typeof score !== "number") {
        return {
            text: "text-text-tertiary",
            bg: "bg-bg-tertiary",
            label: "Pending",
        };
    }

    if (score >= 75) {
        return {
            text: "text-success",
            bg: "bg-success-muted",
            label: "Strong",
        };
    }

    if (score >= 55) {
        return {
            text: "text-brand",
            bg: "bg-brand-muted",
            label: "Average",
        };
    }

    return {
        text: "text-danger",
        bg: "bg-danger-muted",
        label: "Needs Work",
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
    const tone = getScoreTone(value);

    return (
        <div className="rounded-2xl border border-border bg-bg-secondary p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                        {label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-text-primary">
                        {typeof value === "number" ? value : "--"}
                        <span className="text-sm font-medium text-text-tertiary">/100</span>
                    </p>
                </div>

                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone.bg} ${tone.text}`}
                >
                    {tone.label}
                </span>
            </div>

            <p className="mt-3 text-sm leading-5 text-text-secondary">
                {description}
            </p>
        </div>
    );
};

const SectionCard = ({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) => {
    return (
        <div className="rounded-2xl border border-border bg-bg-secondary p-5">
            <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-muted text-brand">
                    {icon}
                </div>

                <h3 className="text-base font-semibold text-text-primary">{title}</h3>
            </div>

            {children}
        </div>
    );
};

const BulletList = ({
    items,
    tone = "default",
}: {
    items: string[];
    tone?: "default" | "success" | "danger" | "brand";
}) => {
    const dotClass =
        tone === "success"
            ? "text-success"
            : tone === "danger"
                ? "text-danger"
                : tone === "brand"
                    ? "text-brand"
                    : "text-text-tertiary";

    if (!items?.length) {
        return <p className="text-sm text-text-tertiary">No data available.</p>;
    }

    return (
        <ul className="space-y-2.5">
            {items.map((item, index) => (
                <li key={`${item}-${index}`} className="flex items-start gap-2">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass} bg-current`} />
                    <span className="text-sm leading-5 text-text-secondary">{item}</span>
                </li>
            ))}
        </ul>
    );
};

export const ResumeAnalysisView = ({ resume }: ResumeAnalysisViewProps) => {
    const ai = resume.aiAnalysis;
    const handleViewPdf = async () => {
        try {
            const { data } = await resumeService.viewPdf(resume.id);

            const pdfBlob = new Blob([data], {
                type: "application/pdf",
            });

            const pdfUrl = URL.createObjectURL(pdfBlob);

            window.open(pdfUrl, "_blank", "noopener,noreferrer");

            setTimeout(() => {
                URL.revokeObjectURL(pdfUrl);
            }, 60_000);
        } catch (error) {
            console.error("Failed to open PDF:", error);
            alert("Failed to open resume PDF. Please try again.");
        }
    };
    if (!ai) {
        return (
            <div className="rounded-2xl border border-border bg-bg-secondary p-8 text-center">
                <FileText size={34} className="mx-auto text-text-tertiary" />
                <h3 className="mt-3 text-base font-semibold text-text-primary">
                    No analysis available
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                    Upload a resume to generate ATS and role-fit intelligence.
                </p>
            </div>
        );
    }

    const missingTechnical = ai.missingKeywords?.technical ?? [];
    const missingTools = ai.missingKeywords?.tools ?? [];
    const missingRoleSpecific = ai.missingKeywords?.roleSpecific ?? [];

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-bg-secondary p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand">
                                Resume v{resume.version}
                            </span>

                            {resume.targetRole && (
                                <span className="rounded-full bg-bg-tertiary px-3 py-1 text-xs font-medium text-text-secondary">
                                    {resume.targetRole}
                                </span>
                            )}

                            <span className="rounded-full bg-bg-tertiary px-3 py-1 text-xs font-medium text-text-tertiary">
                                {resume.analysisStatus}
                            </span>
                        </div>

                        <h2 className="mt-4 text-2xl font-bold text-text-primary">
                            Resume Intelligence Report
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-text-secondary">
                            {ai.summary}
                        </p>

                        <div className="mt-4 rounded-xl border border-border bg-bg-tertiary px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                                Recruiter Verdict
                            </p>
                            <p className="mt-1 text-sm leading-5 text-text-secondary">
                                {ai.recruiterVerdict}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleViewPdf}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition hover:border-border-hover hover:bg-bg-hover hover:text-text-primary"
                    >
                        View PDF
                        <ExternalLink size={15} />
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <ScoreCard
                    label="ATS Score"
                    value={resume.atsScore}
                    description="Formatting, ATS readability, sections, and recruiter clarity."
                />

                <ScoreCard
                    label="Role Fit"
                    value={resume.roleFitScore}
                    description="How closely the resume matches the selected target role."
                />

                <ScoreCard
                    label="Keywords"
                    value={resume.keywordScore}
                    description="Technical, tool, framework, and role-specific keyword strength."
                />

                <ScoreCard
                    label="Projects"
                    value={resume.projectScore}
                    description="Project depth, technical complexity, architecture, and impact."
                />

                <ScoreCard
                    label="Readability"
                    value={resume.readabilityScore}
                    description="Bullet clarity, grammar, conciseness, and scanability."
                />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <SectionCard
                    title="Top Strengths"
                    icon={<CheckCircle2 size={16} />}
                >
                    <BulletList items={ai.topStrengths ?? []} tone="success" />
                </SectionCard>

                <SectionCard
                    title="Critical Issues"
                    icon={<AlertTriangle size={16} />}
                >
                    <BulletList items={ai.criticalIssues ?? []} tone="danger" />
                </SectionCard>
            </div>

            <SectionCard title="Missing Keywords" icon={<Target size={16} />}>
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-bg-tertiary p-4">
                        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">
                            Technical
                        </p>
                        <BulletList items={missingTechnical} tone="brand" />
                    </div>

                    <div className="rounded-xl border border-border bg-bg-tertiary p-4">
                        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">
                            Tools
                        </p>
                        <BulletList items={missingTools} tone="brand" />
                    </div>

                    <div className="rounded-xl border border-border bg-bg-tertiary p-4">
                        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">
                            Role Specific
                        </p>
                        <BulletList items={missingRoleSpecific} tone="brand" />
                    </div>
                </div>
            </SectionCard>

            <SectionCard
                title="Section-by-Section Feedback"
                icon={<ListChecks size={16} />}
            >
                <div className="space-y-4">
                    {(ai.sectionFeedback ?? []).map((section, index) => {
                        const tone = getScoreTone(section.score);

                        return (
                            <div
                                key={`${section.section}-${index}`}
                                className="rounded-xl border border-border bg-bg-tertiary p-4"
                            >
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-semibold text-text-primary">
                                            {section.section}
                                        </h4>
                                        <p className="mt-1 text-sm leading-5 text-text-secondary">
                                            {section.diagnosis}
                                        </p>
                                    </div>

                                    <span className={`text-sm font-bold ${tone.text}`}>
                                        {section.score}/100
                                    </span>
                                </div>

                                <div className="mb-3 h-2 overflow-hidden rounded-full bg-bg-primary">
                                    <div
                                        className={`h-full rounded-full ${tone.bg}`}
                                        style={{ width: `${Math.min(100, Math.max(0, section.score))}%` }}
                                    />
                                </div>

                                <BulletList items={section.fixes ?? []} tone="brand" />
                            </div>
                        );
                    })}
                </div>
            </SectionCard>

            <SectionCard title="Project Improvements" icon={<TrendingUp size={16} />}>
                <div className="space-y-4">
                    {(ai.projectImprovements ?? []).length === 0 ? (
                        <p className="text-sm text-text-tertiary">
                            No project improvement suggestions available.
                        </p>
                    ) : (
                        ai.projectImprovements.map((project, index) => (
                            <div
                                key={`${project.projectName}-${index}`}
                                className="rounded-xl border border-border bg-bg-tertiary p-4"
                            >
                                <h4 className="text-sm font-semibold text-text-primary">
                                    {project.projectName}
                                </h4>

                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                                            Problem
                                        </p>
                                        <p className="mt-1 text-sm leading-5 text-text-secondary">
                                            {project.problem}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                                            Improvement
                                        </p>
                                        <p className="mt-1 text-sm leading-5 text-text-secondary">
                                            {project.improvement}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-xl border border-border bg-bg-secondary p-4">
                                    <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                                        Rewritten Bullet
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-text-primary">
                                        {project.rewrittenBullet}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </SectionCard>

            <div className="grid gap-5 lg:grid-cols-2">
                <SectionCard title="Suggested Resume Bullets" icon={<Sparkles size={16} />}>
                    <BulletList items={ai.suggestedBullets ?? []} tone="brand" />
                </SectionCard>

                <SectionCard title="Action Plan" icon={<Lightbulb size={16} />}>
                    <BulletList items={ai.actionPlan ?? []} tone="brand" />
                </SectionCard>
            </div>
        </div>
    );
};