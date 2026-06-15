import { useEffect, useState } from "react";
import {
    AlertCircle,
    Clock,
    FileText,
    Loader2,
    RefreshCw,
    Trash2,
    Upload,
} from "lucide-react";
import { AppLayout } from "../components/ui/AppLayout";
import { UploadResumeModal } from "../components/resume/UploadResumeModal";
import { ResumeAnalysisView } from "../components/resume/ResumeAnalysisView";
import { resumeService } from "../services/resume.service";
import type { Resume } from "../services/resume.service";

const getScoreTone = (score?: number | null) => {
    if (typeof score !== "number") {
        return "text-text-tertiary";
    }

    if (score >= 75) return "text-success";
    if (score >= 55) return "text-brand";
    return "text-danger";
};

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const formatFileSize = (size?: number | null) => {
    if (!size) return "Unknown size";

    return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

export const ResumePage = () => {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [error, setError] = useState("");

    const fetchResumes = async () => {
        try {
            setIsLoading(true);
            setError("");

            const { data } = await resumeService.getAll();

            setResumes(data.resumes);

            if (data.resumes.length > 0) {
                setSelectedResume((current) => {
                    if (!current) return data.resumes[0];

                    return (
                        data.resumes.find((resume) => resume.id === current.id) ??
                        data.resumes[0]
                    );
                });
            } else {
                setSelectedResume(null);
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Failed to load resume intelligence reports."
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchResumes();
    }, []);

    const handleUploaded = (resume: Resume) => {
        setResumes((previous) => [resume, ...previous]);
        setSelectedResume(resume);
    };

    const handleDelete = async (resumeId: string) => {
        const confirmDelete = window.confirm(
            "Delete this resume version? This action cannot be undone."
        );

        if (!confirmDelete) return;

        try {
            setIsDeletingId(resumeId);
            setError("");

            await resumeService.delete(resumeId);

            setResumes((previous) => {
                const updated = previous.filter((resume) => resume.id !== resumeId);

                if (selectedResume?.id === resumeId) {
                    setSelectedResume(updated[0] ?? null);
                }

                return updated;
            });
        } catch (err: any) {
            setError(
                err.response?.data?.message || "Failed to delete resume version."
            );
        } finally {
            setIsDeletingId(null);
        }
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-muted text-brand">
                                <FileText size={20} />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-text-primary">
                                    Resume Intelligence
                                </h1>
                                <p className="text-sm text-text-secondary">
                                    ATS score, role fit, keyword gaps, project depth, and resume
                                    action plan.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchResumes}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition hover:border-border-hover hover:bg-bg-hover hover:text-text-primary disabled:opacity-60"
                        >
                            <RefreshCw
                                size={15}
                                className={isLoading ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>

                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover"
                        >
                            <Upload size={15} />
                            Upload Resume
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-muted px-4 py-3 text-sm text-danger">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {isLoading ? (
                    <div className="grid gap-4 lg:grid-cols-12">
                        <div className="space-y-3 lg:col-span-3">
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="h-24 animate-pulse rounded-2xl border border-border bg-bg-secondary"
                                />
                            ))}
                        </div>

                        <div className="space-y-4 lg:col-span-9">
                            <div className="h-48 animate-pulse rounded-2xl border border-border bg-bg-secondary" />
                            <div className="grid gap-4 md:grid-cols-3">
                                {[1, 2, 3].map((item) => (
                                    <div
                                        key={item}
                                        className="h-32 animate-pulse rounded-2xl border border-border bg-bg-secondary"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : resumes.length === 0 ? (
                    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-border bg-bg-secondary px-6 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-bg-tertiary text-text-tertiary">
                            <FileText size={30} />
                        </div>

                        <h2 className="mt-5 text-xl font-semibold text-text-primary">
                            No resume uploaded yet
                        </h2>

                        <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
                            Upload your resume PDF to generate ATS score, role-fit score,
                            keyword gaps, section feedback, and project improvement
                            suggestions.
                        </p>

                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-hover"
                        >
                            <Upload size={16} />
                            Upload First Resume
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-5 lg:grid-cols-12">
                        <aside className="lg:col-span-3">
                            <div className="sticky top-6 rounded-2xl border border-border bg-bg-secondary p-4">
                                <div className="mb-4 flex items-center gap-2">
                                    <Clock size={15} className="text-brand" />
                                    <h2 className="text-sm font-semibold text-text-primary">
                                        Version History
                                    </h2>
                                </div>

                                <div className="space-y-2">
                                    {resumes.map((resume) => {
                                        const isSelected = selectedResume?.id === resume.id;
                                        const scoreTone = getScoreTone(resume.atsScore);

                                        return (
                                            <div
                                                key={resume.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setSelectedResume(resume)}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter" || event.key === " ") {
                                                        setSelectedResume(resume);
                                                    }
                                                }}
                                                className={`w-full cursor-pointer rounded-xl border p-3 text-left transition ${isSelected
                                                    ? "border-brand bg-brand-muted"
                                                    : "border-border bg-bg-tertiary hover:border-border-hover hover:bg-bg-hover"
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-text-primary">
                                                                Version {resume.version}
                                                            </p>

                                                            {resume.analysisStatus === "ANALYZED" && (
                                                                <span className="rounded-full bg-success-muted px-2 py-0.5 text-[10px] font-medium text-success">
                                                                    Analyzed
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p className="mt-1 truncate text-xs text-text-tertiary">
                                                            {resume.fileName || "Resume PDF"}
                                                        </p>

                                                        <p className="mt-1 text-xs text-text-tertiary">
                                                            {formatDate(resume.createdAt)}
                                                        </p>

                                                        <p className="mt-1 text-xs text-text-tertiary">
                                                            {formatFileSize(resume.fileSize)}
                                                        </p>
                                                    </div>

                                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                                        <span className={`text-lg font-bold ${scoreTone}`}>
                                                            {typeof resume.atsScore === "number"
                                                                ? resume.atsScore
                                                                : "--"}
                                                        </span>

                                                        <button
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleDelete(resume.id);
                                                            }}
                                                            disabled={isDeletingId === resume.id}
                                                            className="rounded-lg p-1.5 text-text-tertiary transition hover:bg-danger-muted hover:text-danger disabled:opacity-60"
                                                        >
                                                            {isDeletingId === resume.id ? (
                                                                <Loader2 size={13} className="animate-spin" />
                                                            ) : (
                                                                <Trash2 size={13} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                {resume.targetRole && (
                                                    <div className="mt-3 rounded-lg bg-bg-secondary px-2 py-1 text-xs text-text-secondary">
                                                        {resume.targetRole}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </aside>

                        <main className="lg:col-span-9">
                            {selectedResume ? (
                                <ResumeAnalysisView resume={selectedResume} />
                            ) : (
                                <div className="rounded-2xl border border-border bg-bg-secondary p-8 text-center">
                                    <FileText size={30} className="mx-auto text-text-tertiary" />
                                    <p className="mt-3 text-sm text-text-secondary">
                                        Select a resume version to view analysis.
                                    </p>
                                </div>
                            )}
                        </main>
                    </div>
                )}
            </div>

            {showUploadModal && (
                <UploadResumeModal
                    onClose={() => setShowUploadModal(false)}
                    onUploaded={handleUploaded}
                />
            )}
        </AppLayout>
    );
};