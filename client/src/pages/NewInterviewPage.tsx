import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

import { AppLayout } from "../components/ui/AppLayout";
import { interviewService } from "../services/interview.service";

import type {
    CreateInterviewInput,
    InterviewResult,
    InterviewRoundType,
} from "../services/interview.service";

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

const toArray = (value: string) => {
    return value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
};

const toScore = (value: string) => {
    if (!value) return null;

    const score = Number(value);

    if (Number.isNaN(score)) return null;

    return Math.max(0, Math.min(10, score));
};

export const NewInterviewPage = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        company: "",
        role: "",
        roundType: "TECHNICAL" as InterviewRoundType,
        date: new Date().toISOString().split("T")[0],
        result: "PENDING" as InterviewResult,

        questionsAsked: "",
        topics: "",
        conceptsMissed: "",

        whatWentWell: "",
        whatWentWrong: "",
        feedback: "",

        confidenceScore: "",
        communicationScore: "",
        technicalScore: "",

        nextActions: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const inputClass =
        "w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 " +
        "text-text-primary placeholder-text-tertiary text-sm " +
        "focus:outline-none focus:border-brand transition";

    const labelClass =
        "text-xs font-medium text-text-secondary mb-1.5 block uppercase tracking-wide";

    const handleSubmit = async () => {
        if (!form.company.trim()) {
            setError("Company is required");
            return;
        }

        if (!form.role.trim()) {
            setError("Role is required");
            return;
        }

        if (!form.date) {
            setError("Interview date is required");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const payload: CreateInterviewInput = {
                company: form.company.trim(),
                role: form.role.trim(),
                roundType: form.roundType,
                date: form.date,
                result: form.result,

                questionsAsked: toArray(form.questionsAsked),
                topics: toArray(form.topics),
                conceptsMissed: toArray(form.conceptsMissed),

                whatWentWell: form.whatWentWell.trim(),
                whatWentWrong: form.whatWentWrong.trim(),
                feedback: form.feedback.trim(),

                confidenceScore: toScore(form.confidenceScore),
                communicationScore: toScore(form.communicationScore),
                technicalScore: toScore(form.technicalScore),

                nextActions: toArray(form.nextActions),
            };

            await interviewService.create(payload);

            navigate("/interviews");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to log interview");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout
            title="Log Interview"
            description="Capture questions, weak topics, feedback, scores, and next actions from a mock or real interview."
            action={
                <button
                    onClick={() => navigate("/interviews")}
                    className="bg-bg-secondary hover:bg-bg-hover border border-border hover:border-border-hover text-text-secondary hover:text-text-primary px-4 py-2 rounded-xl text-sm transition flex items-center gap-2"
                >
                    <ArrowLeft size={15} />
                    Back
                </button>
            }
        >
            <div className="max-w-5xl mx-auto">
                {error && (
                    <div className="mb-4 bg-danger-muted border border-danger/10 text-danger text-sm rounded-xl px-4 py-3">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-12 gap-4">
                    <section className="col-span-12 lg:col-span-8 bg-bg-secondary border border-border rounded-2xl p-6 space-y-5">
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary">
                                Interview Details
                            </h3>
                            <p className="text-sm text-text-tertiary mt-1">
                                Start with company, role, round, and result.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Company</label>
                                <input
                                    className={inputClass}
                                    placeholder="TCS, Infosys, Amazon, JPMorgan"
                                    value={form.company}
                                    onChange={(e) =>
                                        setForm({ ...form, company: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Role</label>
                                <input
                                    className={inputClass}
                                    placeholder="Java Developer Intern, SDE Intern"
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Round Type</label>
                                <select
                                    className={inputClass}
                                    value={form.roundType}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            roundType: e.target.value as InterviewRoundType,
                                        })
                                    }
                                >
                                    {roundTypes.map((round) => (
                                        <option key={round} value={round}>
                                            {formatEnum(round)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Result</label>
                                <select
                                    className={inputClass}
                                    value={form.result}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            result: e.target.value as InterviewResult,
                                        })
                                    }
                                >
                                    {results.map((result) => (
                                        <option key={result} value={result}>
                                            {formatEnum(result)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Date</label>
                                <input
                                    type="date"
                                    className={inputClass}
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="border-t border-border pt-5">
                            <h3 className="text-lg font-semibold text-text-primary">
                                Replay Memory
                            </h3>
                            <p className="text-sm text-text-tertiary mt-1">
                                Add one item per line. This powers repeated weak-topic detection.
                            </p>
                        </div>

                        <div>
                            <label className={labelClass}>Questions Asked</label>
                            <textarea
                                className={`${inputClass} resize-none min-h-28`}
                                placeholder={`Explain OOP pillars\nDifference between SQL and NoSQL\nWrite logic for palindrome`}
                                value={form.questionsAsked}
                                onChange={(e) =>
                                    setForm({ ...form, questionsAsked: e.target.value })
                                }
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Topics Covered</label>
                                <textarea
                                    className={`${inputClass} resize-none min-h-24`}
                                    placeholder={`Java\nOOP\nDBMS`}
                                    value={form.topics}
                                    onChange={(e) =>
                                        setForm({ ...form, topics: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Concepts Missed</label>
                                <textarea
                                    className={`${inputClass} resize-none min-h-24`}
                                    placeholder={`SQL Indexing\nNormalization\nTime Complexity`}
                                    value={form.conceptsMissed}
                                    onChange={(e) =>
                                        setForm({ ...form, conceptsMissed: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="border-t border-border pt-5">
                            <h3 className="text-lg font-semibold text-text-primary">
                                Reflection
                            </h3>
                            <p className="text-sm text-text-tertiary mt-1">
                                Capture what happened so the system can guide your next prep.
                            </p>
                        </div>

                        <div>
                            <label className={labelClass}>What Went Well</label>
                            <textarea
                                className={`${inputClass} resize-none min-h-24`}
                                placeholder="Explained OOP concepts clearly. Good communication in HR intro."
                                value={form.whatWentWell}
                                onChange={(e) =>
                                    setForm({ ...form, whatWentWell: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <label className={labelClass}>What Went Wrong</label>
                            <textarea
                                className={`${inputClass} resize-none min-h-24`}
                                placeholder="Could not explain indexing properly. Struggled in SQL examples."
                                value={form.whatWentWrong}
                                onChange={(e) =>
                                    setForm({ ...form, whatWentWrong: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Feedback</label>
                            <textarea
                                className={`${inputClass} resize-none min-h-24`}
                                placeholder="Revise DBMS indexing and practice SQL examples before next interview."
                                value={form.feedback}
                                onChange={(e) =>
                                    setForm({ ...form, feedback: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Next Actions</label>
                            <textarea
                                className={`${inputClass} resize-none min-h-28`}
                                placeholder={`Revise SQL indexing\nPractice 3 DBMS interview questions\nSolve 2 Java OOP coding problems`}
                                value={form.nextActions}
                                onChange={(e) =>
                                    setForm({ ...form, nextActions: e.target.value })
                                }
                            />
                        </div>
                    </section>

                    <aside className="col-span-12 lg:col-span-4 space-y-4">
                        <div className="bg-bg-secondary border border-border rounded-2xl p-5">
                            <h3 className="text-base font-semibold text-text-primary">
                                Self Scores
                            </h3>
                            <p className="text-sm text-text-tertiary mt-1 mb-4">
                                Rate yourself from 0 to 10.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>Confidence Score</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        className={inputClass}
                                        placeholder="6"
                                        value={form.confidenceScore}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                confidenceScore: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Communication Score</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        className={inputClass}
                                        placeholder="7"
                                        value={form.communicationScore}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                communicationScore: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Technical Score</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        className={inputClass}
                                        placeholder="5"
                                        value={form.technicalScore}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                technicalScore: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-brand-muted border border-brand/10 rounded-2xl p-5">
                            <h3 className="text-base font-semibold text-text-primary">
                                Why this matters
                            </h3>
                            <p className="text-sm text-text-secondary mt-2 leading-6">
                                PlacementOS will use your interview logs to detect repeated weak
                                topics, average confidence, company-wise readiness, and next
                                action plans.
                            </p>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-4 py-3 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2"
                        >
                            <Save size={16} />
                            {loading ? "Saving Interview..." : "Save Interview Replay"}
                        </button>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
};