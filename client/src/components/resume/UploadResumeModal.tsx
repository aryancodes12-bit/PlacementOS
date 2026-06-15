import { useRef, useState } from "react";
import {
    AlertCircle,
    FileText,
    Loader2,
    Sparkles,
    Target,
    UploadCloud,
    X,
} from "lucide-react";
import { resumeService } from "../../services/resume.service";
import type { Resume } from "../../services/resume.service";

interface UploadResumeModalProps {
    onClose: () => void;
    onUploaded: (resume: Resume) => void;
}

export const UploadResumeModal = ({
    onClose,
    onUploaded,
}: UploadResumeModalProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [targetRole, setTargetRole] = useState("Full Stack Developer");
    const [error, setError] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const maxFileSize = 50 * 1024 * 1024;

    const handleFileChange = (file?: File | null) => {
        setError("");

        if (!file) return;

        const isPdf =
            file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

        if (!isPdf) {
            setError("Only PDF resumes are allowed.");
            return;
        }

        if (file.size > maxFileSize) {
            setError("Resume size should be below 50MB.");
            return;
        }

        setResumeFile(file);
    };

    const handleUpload = async () => {
        if (!resumeFile) {
            setError("Please select a resume PDF first.");
            return;
        }

        try {
            setIsUploading(true);
            setError("");

            const formData = new FormData();
            formData.append("resume", resumeFile);

            if (targetRole.trim()) {
                formData.append("targetRole", targetRole.trim());
            }

            const { data } = await resumeService.upload(formData);

            onUploaded(data.resume);
            onClose();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Failed to upload and analyze resume. Please try again."
            );
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="w-full max-w-xl rounded-2xl border border-border bg-bg-secondary shadow-2xl">
                <div className="flex items-start justify-between border-b border-border px-6 py-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-muted text-brand">
                                <Sparkles size={18} />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-text-primary">
                                    Upload Resume
                                </h2>
                                <p className="text-sm text-text-tertiary">
                                    Generate ATS, role-fit, keyword, and project scores.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="rounded-lg p-2 text-text-tertiary transition hover:bg-bg-hover hover:text-text-primary disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-5 px-6 py-5">
                    {error && (
                        <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-muted px-4 py-3 text-sm text-danger">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-tertiary">
                            Target role
                        </label>

                        <div className="relative">
                            <Target
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                            />

                            <input
                                value={targetRole}
                                onChange={(event) => setTargetRole(event.target.value)}
                                placeholder="e.g. Full Stack Developer, Backend Developer, SDE Intern"
                                className="w-full rounded-xl border border-border bg-bg-tertiary py-3 pl-10 pr-4 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-brand"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-tertiary">
                            Resume PDF
                        </label>

                        <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full rounded-2xl border-2 border-dashed px-6 py-8 text-center transition disabled:opacity-60 ${resumeFile
                                ? "border-brand bg-brand-muted"
                                : "border-border bg-bg-tertiary hover:border-brand hover:bg-bg-hover"
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf,.pdf"
                                className="hidden"
                                onChange={(event) => handleFileChange(event.target.files?.[0])}
                            />

                            {resumeFile ? (
                                <div className="space-y-2">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-secondary text-brand">
                                        <FileText size={22} />
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-text-primary">
                                            {resumeFile.name}
                                        </p>
                                        <p className="mt-1 text-xs text-text-tertiary">
                                            {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-secondary text-text-secondary">
                                        <UploadCloud size={22} />
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-text-primary">
                                            Click to upload your resume
                                        </p>
                                        <p className="mt-1 text-xs text-text-tertiary">
                                            PDF only. Text-based resume recommended.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </button>
                    </div>

                    <div className="rounded-xl border border-border bg-bg-tertiary px-4 py-3">
                        <p className="text-xs leading-5 text-text-secondary">
                            PlacementOS will extract resume text, analyze ATS quality, detect
                            missing keywords, score project depth, and create a focused action
                            plan for your target role.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition hover:bg-bg-hover hover:text-text-primary disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Upload & Analyze
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};