import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    CheckCircle2,
    MessageSquare,
    RefreshCw,
    Sparkles,
    Target,
    TrendingUp,
} from "lucide-react";
import { AppLayout } from "../components/ui/AppLayout";
import { interviewService } from "../services/interview.service";

import type { InterviewReplay } from "../services/interview.service";

const formatEnum = (value: string) => {
    return value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
};

const ScoreBox = ({
    label,
    value,
}: {
    label: string;
    value?: number | null;
}) => {
    return (
        <div className="bg-bg-tertiary border border-border rounded-2xl p-4">
            <p className="text-2xl font-bold text-text-primary">
                {value ?? "-"}
                {value !== null && value !== undefined ? "/10" : ""}
            </p>
            <p className="text-xs text-text-tertiary uppercase tracking-wide mt-1">
                {label}
            </p>
        </div>
    );
};

const Section = ({
    title,
    icon,
    children,
}: {
    title: string;
    icon: ReactNode;
    children: ReactNode;
}) => {
    return (
        <section className="bg-bg-secondary border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                {icon}
                <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
            </div>

            {children}
        </section>
    );
};

export const InterviewDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [interview, setInterview] = useState<InterviewReplay | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState("");

    useEffect(() => {
        const fetchInterview = async () => {
            if (!id) return;

            try {
                const { data } = await interviewService.getById(id);
                setInterview(data.interview);
            } catch (error) {
                console.error("Failed to fetch interview:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInterview();
    }, [id]);

    const handleAnalyze = async () => {
        if (!id) return;

        setAnalyzing(true);
        setAnalysisError("");

        try {
            const { data } = await interviewService.analyze(id);
            setInterview(data.interview);
        } catch (err: any) {
            console.error("Failed to analyze interview:", err);
            setAnalysisError(
                err.response?.data?.message || "Failed to analyze interview with AI"
            );
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) {
        return (
            <AppLayout title="Interview Replay" description="Loading interview...">
                <div className="bg-bg-secondary border border-border rounded-2xl p-6 text-text-secondary">
                    Loading interview replay...
                </div>
            </AppLayout>
        );
    }
    if (!interview) {
        return (
            <AppLayout title="Interview Replay" description="Interview not found.">
                <div className="bg-bg-secondary border border-border rounded-2xl p-8">
                    <p className="text-text-primary font-semibold">
                        Interview replay not found.
                    </p>
                    <button
                        onClick={() => navigate("/interviews")}
                        className="mt-4 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-sm transition"
                    >
                        Back to Interviews
                    </button>
                </div>
            </AppLayout>
        );
    }
    const ai = interview.aiSummary as any;

    const questionReplays = interview.questionReplays ?? [];

    const questionConfidenceScores = questionReplays
        .map((question: any) => question.confidenceScore)
        .filter((score: any): score is number => typeof score === "number");

    const averageQuestionConfidence =
        questionConfidenceScores.length > 0
            ? Number(
                (
                    questionConfidenceScores.reduce((sum, score) => sum + score, 0) /
                    questionConfidenceScores.length
                ).toFixed(1)
            )
            : null;

    const statusToScore: Record<string, number> = {
        SOLVED: 9,
        PARTIAL: 5,
        FAILED: 2,
        SKIPPED: 0,
    };

    const questionTechnicalScores = questionReplays.map(
        (question: any) => statusToScore[question.status] ?? 0
    );

    const derivedTechnicalScore =
        questionTechnicalScores.length > 0
            ? Number(
                (
                    questionTechnicalScores.reduce((sum, score) => sum + score, 0) /
                    questionTechnicalScores.length
                ).toFixed(1)
            )
            : null;

    const displayConfidence =
        interview.confidenceScore ?? averageQuestionConfidence ?? null;
    const displayConfidence =
        interview.confidenceScore ??
        ai?.confidenceScore ??
        averageQuestionConfidence ??
        null;

    const displayCommunication =
        interview.communicationScore ??
        ai?.communicationScore ??
        null;

    const displayTechnical =
        interview.technicalScore ??
        ai?.technicalScore ??
        derivedTechnicalScore ??
        null;
    const displayCommunication =
        interview.communicationScore ??
        (interview.aiSummary ? 6 : null);

    const displayTechnical =
        interview.technicalScore ?? derivedTechnicalScore ?? null;
    return (
        <AppLayout
            title={`${interview.company} Interview Replay`}
            description="Review questions, weak areas, feedback, scores, and next actions."
            action={
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm transition flex items-center gap-2"
                    >
                        {analyzing ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                        {interview.analysisStatus === "ANALYZED"
                            ? analyzing
                                ? "Re-analyzing..."
                                : "Re-analyze with AI"
                            : analyzing
                                ? "Analyzing..."
                                : "Analyze with AI"}
                    </button>

                    <button
                        onClick={() => navigate("/interviews")}
                        className="bg-bg-secondary hover:bg-bg-hover border border-border hover:border-border-hover text-text-secondary hover:text-text-primary px-4 py-2 rounded-xl text-sm transition flex items-center gap-2"
                    >
                        <ArrowLeft size={15} />
                        Back
                    </button>
                </div>
            }
        >
            <div className="max-w-6xl mx-auto space-y-4">
                <section className="bg-bg-secondary border border-border rounded-2xl p-6">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-2xl font-bold text-text-primary">
                                    {interview.company}
                                </h2>

                                <span className="bg-brand-muted border border-brand/10 text-brand text-xs px-3 py-1 rounded-full">
                                    {formatEnum(interview.result)}
                                </span>
                            </div>

                            <p className="text-text-secondary mt-1">{interview.role}</p>

                            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-text-tertiary">
                                <span className="flex items-center gap-2">
                                    <Building2 size={14} />
                                    {formatEnum(interview.roundType)}
                                </span>

                                <span className="flex items-center gap-2">
                                    <CalendarDays size={14} />
                                    {new Date(interview.date).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ScoreBox label="Confidence" value={displayConfidence} />
                    <ScoreBox label="Communication" value={displayCommunication} />
                    <ScoreBox label="Technical" value={displayTechnical} />
                </section>
                {analysisError && (
                    <div className="bg-danger-muted border border-danger/10 text-danger text-sm rounded-xl px-4 py-3">
                        {analysisError}
                    </div>
                )}

                {interview.aiSummary ? (
                    <section className="bg-brand-muted border border-brand/10 rounded-2xl p-5">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles size={17} className="text-brand" />
                                <h3 className="text-base font-semibold text-text-primary">
                                    PlacementOS AI Analysis
                                </h3>
                            </div>

                            <span className="bg-bg-secondary border border-border text-text-secondary text-xs px-3 py-1 rounded-full">
                                {interview.overallScore ?? "-"}
                                {interview.overallScore !== null && interview.overallScore !== undefined
                                    ? "/10 readiness"
                                    : ""}
                            </span>
                        </div>

                        {(() => {
                            const ai = interview.aiSummary as any;
                            const scores = {
                                confidence: interview.confidenceScore ?? ai?.confidenceScore ?? null,
                                communication: interview.communicationScore ?? ai?.communicationScore ?? null,
                                technical: interview.technicalScore ?? ai?.technicalScore ?? null,
                            };
                            return (
                                <div className="space-y-5">
                                    {ai.summary && (
                                        <p className="text-sm text-text-secondary leading-6">
                                            {ai.summary}
                                        </p>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-bg-secondary border border-border rounded-xl p-4">
                                            <p className="text-xs uppercase tracking-wide text-success mb-3">
                                                Strengths
                                            </p>

                                            {ai.strengths?.length ? (
                                                <ul className="space-y-2">
                                                    {ai.strengths.map((item: string, index: number) => (
                                                        <li
                                                            key={`${item}-${index}`}
                                                            className="text-sm text-text-secondary flex gap-2"
                                                        >
                                                            <span className="text-success">✓</span>
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-text-tertiary">No strengths found.</p>
                                            )}
                                        </div>

                                        <div className="bg-bg-secondary border border-border rounded-xl p-4">
                                            <p className="text-xs uppercase tracking-wide text-danger mb-3">
                                                Weaknesses
                                            </p>

                                            {ai.weaknesses?.length ? (
                                                <ul className="space-y-2">
                                                    {ai.weaknesses.map((item: string, index: number) => (
                                                        <li
                                                            key={`${item}-${index}`}
                                                            className="text-sm text-text-secondary flex gap-2"
                                                        >
                                                            <span className="text-danger">•</span>
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-text-tertiary">No weaknesses found.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="bg-bg-secondary border border-border rounded-xl p-4">
                                            <p className="text-xs uppercase tracking-wide text-brand mb-2">
                                                Confidence
                                            </p>
                                            <p className="text-sm text-text-secondary leading-6">
                                                {ai.confidenceDiagnosis || "No diagnosis available."}
                                            </p>
                                        </div>

                                        <div className="bg-bg-secondary border border-border rounded-xl p-4">
                                            <p className="text-xs uppercase tracking-wide text-brand mb-2">
                                                Communication
                                            </p>
                                            <p className="text-sm text-text-secondary leading-6">
                                                {ai.communicationDiagnosis || "No diagnosis available."}
                                            </p>
                                        </div>

                                        <div className="bg-bg-secondary border border-border rounded-xl p-4">
                                            <p className="text-xs uppercase tracking-wide text-brand mb-2">
                                                Technical
                                            </p>
                                            <p className="text-sm text-text-secondary leading-6">
                                                {ai.technicalDiagnosis || "No diagnosis available."}
                                            </p>
                                        </div>
                                    </div>

                                    {ai.revisionPlan?.length > 0 && (
                                        <div className="bg-bg-secondary border border-border rounded-xl p-4">
                                            <p className="text-xs uppercase tracking-wide text-warning mb-3">
                                                3-Day Revision Plan
                                            </p>

                                            <ol className="space-y-2">
                                                {ai.revisionPlan.map((item: string, index: number) => (
                                                    <li
                                                        key={`${item}-${index}`}
                                                        className="text-sm text-text-secondary flex gap-2"
                                                    >
                                                        <span className="text-warning font-semibold">
                                                            {index + 1}.
                                                        </span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}

                                    {ai.companyReadinessNote && (
                                        <div className="bg-bg-secondary border border-border rounded-xl p-4">
                                            <p className="text-xs uppercase tracking-wide text-brand mb-2">
                                                Company Readiness Note
                                            </p>
                                            <p className="text-sm text-text-secondary leading-6">
                                                {ai.companyReadinessNote}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </section>
                ) : (
                    <section className="bg-bg-secondary border border-border rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles size={17} className="text-brand" />
                                    <h3 className="text-base font-semibold text-text-primary">
                                        PlacementOS AI Analysis
                                    </h3>
                                </div>

                                <p className="text-sm text-text-secondary leading-6">
                                    Analyze this replay to generate strengths, weaknesses, missed
                                    concepts, company readiness, and a focused revision plan.
                                </p>
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={analyzing}
                                className="bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm transition flex items-center gap-2"
                            >
                                {analyzing ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                                {analyzing ? "Analyzing..." : "Analyze"}
                            </button>
                        </div>
                    </section>
                )}
                <div className="grid grid-cols-12 gap-4">
                    <main className="col-span-12 lg:col-span-8 space-y-4">
                        <Section
                            title="Question-level Replay"
                            icon={<MessageSquare size={16} className="text-brand" />}
                        >
                            {questionReplays.length > 0 ? (
                                <div className="space-y-4">
                                    {questionReplays.map((question: any, index: number) => (
                                        <div
                                            key={question.id || `${question.question}-${index}`}
                                            className="bg-bg-tertiary border border-border rounded-2xl p-4 space-y-4"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-xs uppercase tracking-wide text-text-tertiary mb-1">
                                                        Question {index + 1}
                                                    </p>
                                                    <h4 className="text-sm font-semibold text-text-primary leading-6">
                                                        {question.question}
                                                    </h4>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="bg-brand-muted border border-brand/10 text-brand text-[11px] px-2.5 py-1 rounded-full">
                                                        {question.status
                                                            ?.toLowerCase()
                                                            .split("_")
                                                            .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
                                                            .join(" ")}
                                                    </span>

                                                    {question.confidenceScore !== null &&
                                                        question.confidenceScore !== undefined && (
                                                            <span className="bg-bg-secondary border border-border text-text-secondary text-[11px] px-2.5 py-1 rounded-full">
                                                                {question.confidenceScore}/10 confidence
                                                            </span>
                                                        )}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs uppercase tracking-wide text-success mb-1.5">
                                                    My Answer
                                                </p>
                                                <p className="text-sm text-text-secondary bg-bg-secondary border border-border rounded-xl px-4 py-3 leading-6">
                                                    {question.userAnswer || "No answer added."}
                                                </p>
                                            </div>

                                            {question.missedPoints?.length > 0 && (
                                                <div>
                                                    <p className="text-xs uppercase tracking-wide text-danger mb-2">
                                                        Missed Points
                                                    </p>

                                                    <div className="flex flex-wrap gap-2">
                                                        {question.missedPoints.map((point: string) => (
                                                            <span
                                                                key={point}
                                                                className="bg-danger-muted border border-danger/10 text-danger text-xs px-3 py-1.5 rounded-full"
                                                            >
                                                                {point}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <p className="text-xs uppercase tracking-wide text-warning mb-1.5">
                                                    Interviewer Feedback
                                                </p>
                                                <p className="text-sm text-text-secondary bg-bg-secondary border border-border rounded-xl px-4 py-3 leading-6">
                                                    {question.interviewerFeedback || "No feedback added."}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : interview.questionsAsked.length ? (
                                <ol className="space-y-2">
                                    {interview.questionsAsked.map((question, index) => (
                                        <li
                                            key={`${question}-${index}`}
                                            className="bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-secondary"
                                        >
                                            <span className="text-brand font-semibold mr-2">
                                                {index + 1}.
                                            </span>
                                            {question}
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p className="text-sm text-text-tertiary">No questions added.</p>
                            )}
                        </Section>

                        {(interview.whatWentWell || interview.whatWentWrong || interview.feedback) && (
                            <Section
                                title="Reflection"
                                icon={<TrendingUp size={16} className="text-success" />}
                            >
                                <div className="space-y-4">
                                    {interview.whatWentWell && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-success mb-1.5">
                                                What went well
                                            </p>
                                            <p className="text-sm text-text-secondary bg-bg-tertiary border border-border rounded-xl px-4 py-3">
                                                {interview.whatWentWell}
                                            </p>
                                        </div>
                                    )}

                                    {interview.whatWentWrong && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-danger mb-1.5">
                                                What went wrong
                                            </p>
                                            <p className="text-sm text-text-secondary bg-bg-tertiary border border-border rounded-xl px-4 py-3">
                                                {interview.whatWentWrong}
                                            </p>
                                        </div>
                                    )}

                                    {interview.feedback && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-warning mb-1.5">
                                                Feedback
                                            </p>
                                            <p className="text-sm text-text-secondary bg-bg-tertiary border border-border rounded-xl px-4 py-3">
                                                {interview.feedback}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Section>
                        )}
                    </main>

                    <aside className="col-span-12 lg:col-span-4 space-y-4">
                        <Section
                            title="Topics Covered"
                            icon={<Target size={16} className="text-brand" />}
                        >
                            {(() => {
                                const ai = interview.aiSummary as any;

                                const displayTopics =
                                    interview.topics?.length > 0
                                        ? interview.topics
                                        : ai?.repeatedRiskTopics ?? [];

                                return displayTopics.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {displayTopics.map((topic: string) => (
                                            <span
                                                key={topic}
                                                className="bg-bg-tertiary border border-border text-text-secondary text-xs px-3 py-1.5 rounded-full"
                                            >
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-text-tertiary">No topics added.</p>
                                );
                            })()}
                        </Section>

                        <Section
                            title="Missed Concepts"
                            icon={<Target size={16} className="text-danger" />}
                        >
                            {interview.conceptsMissed.length ? (
                                <div className="flex flex-wrap gap-2">
                                    {interview.conceptsMissed.map((concept) => (
                                        <span
                                            key={concept}
                                            className="bg-danger-muted border border-danger/10 text-danger text-xs px-3 py-1.5 rounded-full"
                                        >
                                            {concept}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-text-tertiary">
                                    No missed concepts added.
                                </p>
                            )}
                        </Section>

                        <Section
                            title="Next Action Plan"
                            icon={<CheckCircle2 size={16} className="text-success" />}
                        >
                            {(() => {
                                const ai = interview.aiSummary as any;

                                const questionPracticeTasks = Array.isArray(ai?.questionBreakdown)
                                    ? ai.questionBreakdown
                                        .map((item: any) => item.practiceTask)
                                        .filter(Boolean)
                                    : [];

                                const nextActionItems =
                                    questionPracticeTasks.length > 0
                                        ? questionPracticeTasks
                                        : interview.nextActions;

                                return nextActionItems.length ? (
                                    <ol className="space-y-2">
                                        {nextActionItems.slice(0, 5).map((action: string, index: number) => (
                                            <li
                                                key={`${action}-${index}`}
                                                className="flex gap-2 text-sm text-text-secondary"
                                            >
                                                <span className="text-brand font-semibold">
                                                    {index + 1}.
                                                </span>
                                                <span>{action}</span>
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="text-sm text-text-tertiary">
                                        Analyze this interview to generate next actions.
                                    </p>
                                );
                            })()}
                        </Section>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
};