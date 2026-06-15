import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CalendarDays,
    Loader2,
    Sparkles,
    Upload,
    Video,
} from "lucide-react";
import { interviewService } from "../../services/interview.service";
import type {
    InterviewResult,
    InterviewRoundType,
} from "../../services/interview.service";

const roundTypes: InterviewRoundType[] = [
    "HR",
    "TECHNICAL",
    "MANAGERIAL",
    "APTITUDE",
    "GROUP_DISCUSSION",
    "SYSTEM_DESIGN",
    "CODING",
    "OTHER",
];

const results: InterviewResult[] = [
    "PENDING",
    "SELECTED",
    "REJECTED",
    "ON_HOLD",
    "NO_RESPONSE",
];

const formatEnum = (value: string) => {
    return value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
};

export const VideoInterviewUploader = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        company: "",
        role: "",
        roundType: "TECHNICAL" as InterviewRoundType,
        date: new Date().toISOString().slice(0, 10),
        result: "PENDING" as InterviewResult,
        topics: "",
        notes: "",
    });

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const updateField = (field: keyof typeof form, value: string) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.company.trim() || !form.role.trim() || !form.date) {
            setError("Company, role, and date are required.");
            return;
        }

        if (!videoFile) {
            setError("Please select a video file.");
            return;
        }

        setUploading(true);
        setError("");

        try {
            const formData = new FormData();

            formData.append("company", form.company.trim());
            formData.append("role", form.role.trim());
            formData.append("roundType", form.roundType);
            formData.append("date", form.date);
            formData.append("result", form.result);
            formData.append("topics", form.topics);
            formData.append("notes", form.notes);
            formData.append("video", videoFile);

            const { data } = await interviewService.uploadVideo(formData);

            navigate(`/interviews/${data.interview.id}`);
        } catch (err: any) {
            console.error("Video upload failed:", err);
            setError(
                err.response?.data?.message ||
                "Failed to upload and analyze video interview."
            );
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <section className="bg-bg-secondary border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Video size={17} className="text-brand" />
                    <h2 className="text-base font-semibold text-text-primary">
                        Upload Video Interview
                    </h2>
                </div>

                <p className="text-sm text-text-secondary leading-6 mb-5">
                    Upload a mock or real interview video. PlacementOS will save the
                    video, transcribe the audio, analyze weak concepts, and generate a
                    question-level replay.
                </p>

                {error && (
                    <div className="bg-danger-muted border border-danger/10 text-danger text-sm rounded-xl px-4 py-3 mb-4">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs uppercase tracking-wide text-text-tertiary">
                            Company
                        </label>
                        <input
                            value={form.company}
                            onChange={(e) => updateField("company", e.target.value)}
                            placeholder="Infosys"
                            className="mt-2 w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand transition"
                        />
                    </div>

                    <div>
                        <label className="text-xs uppercase tracking-wide text-text-tertiary">
                            Role
                        </label>
                        <input
                            value={form.role}
                            onChange={(e) => updateField("role", e.target.value)}
                            placeholder="SWE Intern"
                            className="mt-2 w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand transition"
                        />
                    </div>

                    <div>
                        <label className="text-xs uppercase tracking-wide text-text-tertiary">
                            Round Type
                        </label>
                        <select
                            value={form.roundType}
                            onChange={(e) =>
                                updateField("roundType", e.target.value as InterviewRoundType)
                            }
                            className="mt-2 w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-brand transition"
                        >
                            {roundTypes.map((round) => (
                                <option key={round} value={round}>
                                    {formatEnum(round)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs uppercase tracking-wide text-text-tertiary">
                            Result
                        </label>
                        <select
                            value={form.result}
                            onChange={(e) =>
                                updateField("result", e.target.value as InterviewResult)
                            }
                            className="mt-2 w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-brand transition"
                        >
                            {results.map((item) => (
                                <option key={item} value={item}>
                                    {formatEnum(item)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs uppercase tracking-wide text-text-tertiary">
                            Date
                        </label>
                        <div className="relative mt-2">
                            <CalendarDays
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                            />
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => updateField("date", e.target.value)}
                                className="w-full bg-bg-tertiary border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary focus:outline-none focus:border-brand transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs uppercase tracking-wide text-text-tertiary">
                            Topics
                        </label>
                        <input
                            value={form.topics}
                            onChange={(e) => updateField("topics", e.target.value)}
                            placeholder="Java, OOP, DBMS"
                            className="mt-2 w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand transition"
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="text-xs uppercase tracking-wide text-text-tertiary">
                        Notes
                    </label>
                    <textarea
                        value={form.notes}
                        onChange={(e) => updateField("notes", e.target.value)}
                        placeholder="Optional context about this video interview..."
                        rows={3}
                        className="mt-2 w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand transition resize-none"
                    />
                </div>
            </section>

            <section className="bg-bg-secondary border border-border rounded-2xl p-5">
                <label className="text-xs uppercase tracking-wide text-text-tertiary">
                    Video File
                </label>

                <div className="mt-3 border border-dashed border-border hover:border-brand rounded-2xl p-6 bg-bg-tertiary transition">
                    <input
                        type="file"
                        accept="video/*,.mp4,.webm,.mov"
                        onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                        className="hidden"
                        id="video-upload"
                    />

                    <label
                        htmlFor="video-upload"
                        className="cursor-pointer flex flex-col items-center text-center"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-brand-muted border border-brand/10 flex items-center justify-center mb-3">
                            <Upload size={22} className="text-brand" />
                        </div>

                        <p className="text-sm font-medium text-text-primary">
                            {videoFile ? videoFile.name : "Click to select video file"}
                        </p>

                        <p className="text-xs text-text-tertiary mt-1">
                            MP4, WEBM, or MOV. Keep it short for faster transcription.
                        </p>
                    </label>
                </div>
            </section>

            <div className="flex items-center justify-end gap-3">
                <button
                    type="button"
                    onClick={() => navigate("/interviews")}
                    className="bg-bg-secondary hover:bg-bg-hover border border-border hover:border-border-hover text-text-secondary hover:text-text-primary px-5 py-2.5 rounded-xl text-sm transition"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={uploading}
                    className="bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2"
                >
                    {uploading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Sparkles size={16} />
                    )}
                    {uploading ? "Uploading & analyzing..." : "Upload Video & Analyze"}
                </button>
            </div>
        </form>
    );
};