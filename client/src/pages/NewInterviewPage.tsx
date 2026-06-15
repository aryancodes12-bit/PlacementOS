import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    FileAudio,
    PenLine,
    Plus,
    Save,
    Trash2,
    Video,
} from "lucide-react";

import { AppLayout } from "../components/ui/AppLayout";
import { interviewService } from "../services/interview.service";
import { AudioInterviewUploader } from "../components/interviews/AudioInterviewUploader";

import type {
    CreateInterviewInput,
    InterviewQuestionReplay,
    InterviewQuestionStatus,
    InterviewResult,
    InterviewRoundType,
} from "../services/interview.service";
import { VideoInterviewUploader } from "../components/interviews/VideoInterviewUploader";
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

const questionStatuses: InterviewQuestionStatus[] = [
    "SOLVED",
    "PARTIAL",
    "FAILED",
    "SKIPPED",
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
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);
};

const toScore = (value: string) => {
    if (!value) return null;

    const score = Number(value);

    if (Number.isNaN(score)) return null;

    return Math.max(0, Math.min(10, score));
};

type QuestionForm = {
    question: string;
    userAnswer: string;
    missedPoints: string;
    interviewerFeedback: string;
    confidenceScore: string;
    status: InterviewQuestionStatus;
};

const emptyQuestion = (): QuestionForm => ({
    question: "",
    userAnswer: "",
    missedPoints: "",
    interviewerFeedback: "",
    confidenceScore: "",
    status: "PARTIAL",
});

export const NewInterviewPage = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<"manual" | "audio" | "video">("manual");
    const [form, setForm] = useState({
        company: "",
        role: "",
        roundType: "TECHNICAL" as InterviewRoundType,
        date: new Date().toISOString().split("T")[0],
        result: "PENDING" as InterviewResult,

        topics: "",
        conceptsMissed: "",

        whatWentWell: "",
        whatWentWrong: "",
        feedback: "",

        confidenceScore: "",
        communicationScore: "",
        technicalScore: "",
    });

    const [questions, setQuestions] = useState<QuestionForm[]>([
        emptyQuestion(),
    ]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const inputClass =
        "w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 " +
        "text-text-primary placeholder-text-tertiary text-sm " +
        "focus:outline-none focus:border-brand transition";

    const labelClass =
        "text-xs font-medium text-text-secondary mb-1.5 block uppercase tracking-wide";

    const updateQuestion = (
        index: number,
        field: keyof QuestionForm,
        value: string
    ) => {
        setQuestions((prev) =>
            prev.map((question, questionIndex) =>
                questionIndex === index
                    ? {
                        ...question,
                        [field]: value,
                    }
                    : question
            )
        );
    };

    const addQuestion = () => {
        setQuestions((prev) => [...prev, emptyQuestion()]);
    };

    const removeQuestion = (index: number) => {
        setQuestions((prev) => {
            if (prev.length === 1) return prev;
            return prev.filter((_, questionIndex) => questionIndex !== index);
        });
    };

    const buildQuestionReplays = (): InterviewQuestionReplay[] => {
        return questions
            .map((question) => ({
                question: question.question.trim(),
                userAnswer: question.userAnswer.trim() || null,
                missedPoints: toArray(question.missedPoints),
                interviewerFeedback: question.interviewerFeedback.trim() || null,
                confidenceScore: toScore(question.confidenceScore),
                status: question.status,
            }))
            .filter((question) => question.question.length > 0);
    };

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

        const questionReplays = buildQuestionReplays();

        if (questionReplays.length === 0) {
            setError("Add at least one interview question");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const questionLevelMissedPoints = questionReplays.flatMap(
                (question) => question.missedPoints
            );

            const payload: CreateInterviewInput = {
                company: form.company.trim(),
                role: form.role.trim(),
                roundType: form.roundType,
                date: form.date,
                result: form.result,

                questionsAsked: questionReplays.map((question) => question.question),
                questionReplays,

                topics: toArray(form.topics),
                conceptsMissed: Array.from(
                    new Set([...toArray(form.conceptsMissed), ...questionLevelMissedPoints])
                ),

                whatWentWell: form.whatWentWell.trim(),
                whatWentWrong: form.whatWentWrong.trim(),
                feedback: form.feedback.trim(),

                confidenceScore: toScore(form.confidenceScore),
                communicationScore: toScore(form.communicationScore),
                technicalScore: toScore(form.technicalScore),

                nextActions: [],
            };

            await interviewService.create(payload);

            navigate("/interviews");
        } catch (err: any) {
            console.error("Create interview error:", err.response?.data || err);
            setError(err.response?.data?.message || "Failed to log interview");
        } finally {
            setLoading(false);
        }
    };


    return (
        <AppLayout
            title="Log Interview"
            description="Capture question-wise answers, missed points, feedback, scores, and weak areas."
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
            <div className="max-w-6xl mx-auto">
                <section className="bg-bg-secondary border border-border rounded-2xl p-4 mb-5">
                    <p className="text-xs uppercase tracking-wide text-text-tertiary mb-3">
                        Replay Source
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={() => setMode("manual")}
                            className={`border rounded-2xl p-4 text-left transition ${mode === "manual"
                                ? "bg-brand-muted border-brand/20"
                                : "bg-bg-tertiary border-border hover:border-border-hover"
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <PenLine size={16} className="text-brand" />
                                <span className="text-sm font-semibold text-text-primary">
                                    Quick Log
                                </span>
                            </div>
                            <p className="text-xs text-text-tertiary leading-5">
                                Manually add questions, answers, missed points, and feedback.
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMode("audio")}
                            className={`border rounded-2xl p-4 text-left transition ${mode === "audio"
                                ? "bg-brand-muted border-brand/20"
                                : "bg-bg-tertiary border-border hover:border-border-hover"
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <FileAudio size={16} className="text-brand" />
                                <span className="text-sm font-semibold text-text-primary">
                                    Upload Audio
                                </span>
                            </div>
                            <p className="text-xs text-text-tertiary leading-5">
                                Upload audio, auto-transcribe with Groq Whisper, and generate AI replay.
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMode("video")}
                            className={`border rounded-2xl p-4 text-left transition ${mode === "video"
                                ? "bg-brand-muted border-brand/20"
                                : "bg-bg-tertiary border-border hover:border-border-hover"
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Video size={16} className="text-text-tertiary" />
                                <span className="text-sm font-semibold text-text-primary">
                                    Upload Video
                                </span>
                            </div>
                            <p className="text-xs text-text-tertiary leading-5">
                                Upload video, extract transcript, and generate AI replay.
                            </p>
                        </button>
                    </div>
                </section>
                {mode === "audio" ? (
                    <AudioInterviewUploader />
                ) : mode === "video" ? (
                    <VideoInterviewUploader />
                ) : (
                    <>
                        {error && (
                            <div className="mb-4 bg-danger-muted border border-danger/10 text-danger text-sm rounded-xl px-4 py-3">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-12 gap-4">
                            <section className="col-span-12 lg:col-span-8 space-y-4">
                                <div className="bg-bg-secondary border border-border rounded-2xl p-6 space-y-5">
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
                                                onChange={(e) =>
                                                    setForm({ ...form, role: e.target.value })
                                                }
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
                                                onChange={(e) =>
                                                    setForm({ ...form, date: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-bg-secondary border border-border rounded-2xl p-6 space-y-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-text-primary">
                                                Question-level Replay
                                            </h3>
                                            <p className="text-sm text-text-tertiary mt-1">
                                                Add what you answered, what you missed, and what feedback you got.
                                            </p>
                                        </div>

                                        <button
                                            onClick={addQuestion}
                                            className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-sm transition flex items-center gap-2"
                                        >
                                            <Plus size={15} />
                                            Add Question
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {questions.map((question, index) => (
                                            <div
                                                key={index}
                                                className="bg-bg-tertiary border border-border rounded-2xl p-4 space-y-4"
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <p className="text-sm font-semibold text-text-primary">
                                                        Question {index + 1}
                                                    </p>

                                                    <button
                                                        onClick={() => removeQuestion(index)}
                                                        disabled={questions.length === 1}
                                                        className="disabled:opacity-30 disabled:cursor-not-allowed text-text-tertiary hover:text-danger transition"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>

                                                <div>
                                                    <label className={labelClass}>Question Asked</label>
                                                    <textarea
                                                        className={`${inputClass} resize-none min-h-20`}
                                                        placeholder="What is SQL indexing and why is it used?"
                                                        value={question.question}
                                                        onChange={(e) =>
                                                            updateQuestion(index, "question", e.target.value)
                                                        }
                                                    />
                                                </div>

                                                <div>
                                                    <label className={labelClass}>My Answer</label>
                                                    <textarea
                                                        className={`${inputClass} resize-none min-h-24`}
                                                        placeholder="I said indexing makes search faster but could not explain B-tree or tradeoffs."
                                                        value={question.userAnswer}
                                                        onChange={(e) =>
                                                            updateQuestion(index, "userAnswer", e.target.value)
                                                        }
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className={labelClass}>
                                                            Missed Points
                                                        </label>
                                                        <textarea
                                                            className={`${inputClass} resize-none min-h-24`}
                                                            placeholder={`B-tree basics\nClustered vs non-clustered\nIndex tradeoffs`}
                                                            value={question.missedPoints}
                                                            onChange={(e) =>
                                                                updateQuestion(
                                                                    index,
                                                                    "missedPoints",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className={labelClass}>
                                                            Interviewer Feedback
                                                        </label>
                                                        <textarea
                                                            className={`${inputClass} resize-none min-h-24`}
                                                            placeholder="Revise indexing internals and when not to use indexes."
                                                            value={question.interviewerFeedback}
                                                            onChange={(e) =>
                                                                updateQuestion(
                                                                    index,
                                                                    "interviewerFeedback",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className={labelClass}>
                                                            Question Confidence
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="10"
                                                            className={inputClass}
                                                            placeholder="3"
                                                            value={question.confidenceScore}
                                                            onChange={(e) =>
                                                                updateQuestion(
                                                                    index,
                                                                    "confidenceScore",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className={labelClass}>Status</label>
                                                        <select
                                                            className={inputClass}
                                                            value={question.status}
                                                            onChange={(e) =>
                                                                updateQuestion(
                                                                    index,
                                                                    "status",
                                                                    e.target.value as InterviewQuestionStatus
                                                                )
                                                            }
                                                        >
                                                            {questionStatuses.map((status) => (
                                                                <option key={status} value={status}>
                                                                    {formatEnum(status)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-bg-secondary border border-border rounded-2xl p-6 space-y-5">
                                    <div>
                                        <h3 className="text-lg font-semibold text-text-primary">
                                            Overall Replay Context
                                        </h3>
                                        <p className="text-sm text-text-tertiary mt-1">
                                            Add topics, overall reflection, and interviewer feedback.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Topics Covered</label>
                                            <textarea
                                                className={`${inputClass} resize-none min-h-24`}
                                                placeholder={`Java\nOOP\nDBMS\nSQL`}
                                                value={form.topics}
                                                onChange={(e) =>
                                                    setForm({ ...form, topics: e.target.value })
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label className={labelClass}>Overall Missed Concepts</label>
                                            <textarea
                                                className={`${inputClass} resize-none min-h-24`}
                                                placeholder={`SQL Indexing\nTime Complexity Explanation`}
                                                value={form.conceptsMissed}
                                                onChange={(e) =>
                                                    setForm({ ...form, conceptsMissed: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>What Went Well</label>
                                        <textarea
                                            className={`${inputClass} resize-none min-h-24`}
                                            placeholder="I stayed calm and explained basic OOP definitions."
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
                                            placeholder="I struggled when asked for deeper DBMS indexing internals and complexity explanation."
                                            value={form.whatWentWrong}
                                            onChange={(e) =>
                                                setForm({ ...form, whatWentWrong: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Overall Feedback</label>
                                        <textarea
                                            className={`${inputClass} resize-none min-h-24`}
                                            placeholder="Move from definition-level preparation to example and tradeoff-level answers."
                                            value={form.feedback}
                                            onChange={(e) =>
                                                setForm({ ...form, feedback: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                            </section>

                            <aside className="col-span-12 lg:col-span-4 space-y-4">
                                <div className="bg-bg-secondary border border-border rounded-2xl p-5">
                                    <h3 className="text-base font-semibold text-text-primary">
                                        Overall Self Scores
                                    </h3>
                                    <p className="text-sm text-text-tertiary mt-1 mb-4">
                                        Rate the overall interview from 0 to 10.
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
                                                placeholder="4"
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
                                        Why question-level replay matters
                                    </h3>
                                    <p className="text-sm text-text-secondary mt-2 leading-6">
                                        PlacementOS will use every answer, missed point, and feedback
                                        item to generate a sharper AI diagnosis and action plan.
                                    </p>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-4 py-3 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2"
                                >
                                    <Save size={16} />
                                    {loading ? "Saving Interview..." : "Save Question Replay"}
                                </button>
                            </aside>
                        </div>

                    </>
                )}
            </div>
        </AppLayout>
    );
};