import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    BarChart3,
    Building2,
    CalendarDays,
    CheckCircle2,

    Mic,
    Plus,
    Search,
    Target,
    Trash2,
    TrendingUp,
} from "lucide-react";

import { AppLayout } from "../components/ui/AppLayout";
import { interviewService } from "../services/interview.service";

import type {
    InterviewReplay,
    InterviewStats,
    InterviewResult,

} from "../services/interview.service";

const formatEnum = (value: string) => {
    return value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
};

const getResultClass = (result: InterviewResult) => {
    if (result === "SELECTED") {
        return "bg-success-muted text-success border-success/10";
    }

    if (result === "REJECTED") {
        return "bg-danger-muted text-danger border-danger/10";
    }

    if (result === "ON_HOLD") {
        return "bg-warning-muted text-warning border-warning/10";
    }

    return "bg-brand-muted text-brand border-brand/10";
};

const getScoreLabel = (score: number) => {
    if (score >= 8) return "Strong";
    if (score >= 6) return "Average";
    if (score > 0) return "Needs work";
    return "No data";
};

export const InterviewsPage = () => {
    const navigate = useNavigate();

    const [interviews, setInterviews] = useState<InterviewReplay[]>([]);
    const [stats, setStats] = useState<InterviewStats | null>(null);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [roundType, setRoundType] = useState("");
    const [result, setResult] = useState("");

    const fetchData = async () => {
        setLoading(true);

        try {
            const [interviewsResponse, statsResponse] = await Promise.all([
                interviewService.getAll({
                    search: search || undefined,
                    roundType: roundType || undefined,
                    result: result || undefined,
                }),
                interviewService.getStats(),
            ]);

            setInterviews(interviewsResponse.data.interviews);
            setStats(statsResponse.data);
        } catch (error) {
            console.error("Failed to fetch interviews:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const applyFilters = async () => {
        await fetchData();
    };

    const clearFilters = async () => {
        setSearch("");
        setRoundType("");
        setResult("");

        setLoading(true);

        try {
            const [interviewsResponse, statsResponse] = await Promise.all([
                interviewService.getAll(),
                interviewService.getStats(),
            ]);

            setInterviews(interviewsResponse.data.interviews);
            setStats(statsResponse.data);
        } catch (error) {
            console.error("Failed to clear filters:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm("Delete this interview replay?");

        if (!confirmed) return;

        try {
            await interviewService.delete(id);
            await fetchData();
        } catch (error) {
            console.error("Failed to delete interview:", error);
        }
    };

    const topWeakTopic =
        stats?.mostMissedConcepts?.[0]?.name ||
        stats?.mostRepeatedTopics?.[0]?.name ||
        "No weak topic yet";

    return (
        <AppLayout
            title="Interview Replay"
            description="Turn every mock or real interview into structured feedback, weak-area memory, and next actions."
            action={
                <button
                    onClick={() => navigate("/interviews/new")}
                    className="bg-brand hover:bg-brand-hover text-white font-medium px-4 py-2 rounded-xl transition-all duration-200 text-sm flex items-center gap-2"
                >
                    <Plus size={15} />
                    Log Interview
                </button>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                <div className="bg-bg-secondary border border-border rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs uppercase tracking-wide text-text-tertiary">
                            Interviews Logged
                        </p>
                        <Mic size={16} className="text-brand" />
                    </div>
                    <p className="text-2xl font-bold text-text-primary">
                        {loading ? "..." : stats?.totalInterviews ?? 0}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">
                        Manual interview replays
                    </p>
                </div>

                <div className="bg-bg-secondary border border-border rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs uppercase tracking-wide text-text-tertiary">
                            Avg Confidence
                        </p>
                        <TrendingUp size={16} className="text-success" />
                    </div>
                    <p className="text-2xl font-bold text-text-primary">
                        {loading ? "..." : `${stats?.averageConfidenceScore ?? 0}/10`}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">
                        {getScoreLabel(stats?.averageConfidenceScore ?? 0)}
                    </p>
                </div>

                <div className="bg-bg-secondary border border-border rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs uppercase tracking-wide text-text-tertiary">
                            Avg Technical
                        </p>
                        <BarChart3 size={16} className="text-warning" />
                    </div>
                    <p className="text-2xl font-bold text-text-primary">
                        {loading ? "..." : `${stats?.averageTechnicalScore ?? 0}/10`}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">
                        {getScoreLabel(stats?.averageTechnicalScore ?? 0)}
                    </p>
                </div>

                <div className="bg-bg-secondary border border-border rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs uppercase tracking-wide text-text-tertiary">
                            Weak Topic
                        </p>
                        <Target size={16} className="text-danger" />
                    </div>
                    <p className="text-base font-bold text-text-primary truncate">
                        {loading ? "..." : topWeakTopic}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">
                        Most repeated weak area
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
                <section className="col-span-12 lg:col-span-8 space-y-4">
                    <div className="bg-bg-secondary border border-border rounded-2xl p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-2 relative">
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                                />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search company or role"
                                    className="w-full bg-bg-tertiary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand transition"
                                />
                            </div>

                            <select
                                value={roundType}
                                onChange={(e) => setRoundType(e.target.value)}
                                className="bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition"
                            >
                                <option value="">All rounds</option>
                                {[
                                    "HR",
                                    "TECHNICAL",
                                    "MANAGERIAL",
                                    "APTITUDE",
                                    "GROUP_DISCUSSION",
                                    "SYSTEM_DESIGN",
                                    "CODING",
                                    "OTHER",
                                ].map((item) => (
                                    <option key={item} value={item}>
                                        {formatEnum(item)}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={result}
                                onChange={(e) => setResult(e.target.value)}
                                className="bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand transition"
                            >
                                <option value="">All results</option>
                                {["PENDING", "SELECTED", "REJECTED", "ON_HOLD", "NO_RESPONSE"].map(
                                    (item) => (
                                        <option key={item} value={item}>
                                            {formatEnum(item)}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={applyFilters}
                                className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition"
                            >
                                Apply
                            </button>
                            <button
                                onClick={clearFilters}
                                className="bg-bg-tertiary hover:bg-bg-hover border border-border text-text-secondary hover:text-text-primary px-4 py-2 rounded-xl text-sm font-medium transition"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="bg-bg-secondary border border-border rounded-2xl p-6 text-text-secondary">
                            Loading interviews...
                        </div>
                    ) : interviews.length === 0 ? (
                        <div className="bg-bg-secondary border border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                            <div className="w-14 h-14 rounded-2xl bg-bg-tertiary border border-border flex items-center justify-center mb-4">
                                <Mic size={24} className="text-text-tertiary" />
                            </div>
                            <h3 className="text-lg font-semibold text-text-primary">
                                No interview replays yet
                            </h3>
                            <p className="text-sm text-text-secondary mt-2 max-w-md">
                                Log your first interview to start tracking repeated weak topics,
                                confidence, feedback, and next actions.
                            </p>
                            <button
                                onClick={() => navigate("/interviews/new")}
                                className="mt-5 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition"
                            >
                                Log First Interview
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {interviews.map((interview) => {
                                const ai = interview.aiSummary as any;

                                const scores = {
                                    confidence: interview.confidenceScore ?? ai?.confidenceScore ?? null,
                                    communication: interview.communicationScore ?? ai?.communicationScore ?? null,
                                    technical: interview.technicalScore ?? ai?.technicalScore ?? null,
                                };

                                const displayTopics =
                                    interview.topics?.length > 0
                                        ? interview.topics
                                        : ai?.repeatedRiskTopics ?? [];

                                return (
                                    <article
                                        key={interview.id}
                                        className="bg-bg-secondary border border-border hover:border-border-hover rounded-2xl p-5 transition"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-11 h-11 rounded-xl bg-brand-muted border border-brand/10 flex items-center justify-center text-brand font-bold">
                                                {interview.company.charAt(0).toUpperCase()}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-base font-semibold text-text-primary">
                                                        {interview.company}
                                                    </h3>
                                                    <span className="text-xs text-text-tertiary">·</span>
                                                    <p className="text-sm text-text-secondary">
                                                        {interview.role}
                                                    </p>
                                                    <span
                                                        className={`text-[11px] px-2 py-0.5 rounded-full border ${getResultClass(
                                                            interview.result
                                                        )}`}
                                                    >
                                                        {formatEnum(interview.result)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 text-xs text-text-tertiary mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <CalendarDays size={12} />
                                                        {new Date(interview.date).toLocaleDateString("en-IN", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </span>
                                                    <span>{formatEnum(interview.roundType)}</span>
                                                </div>

                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {displayTopics.slice(0, 5).map((topic: string) => (
                                                        <span
                                                            key={topic}
                                                            className="bg-bg-tertiary border border-border text-text-secondary text-[11px] px-2.5 py-1 rounded-full"
                                                        >
                                                            {topic}
                                                        </span>
                                                    ))}
                                                </div>

                                                {interview.conceptsMissed.length > 0 && (
                                                    <div className="mt-3">
                                                        <p className="text-[11px] uppercase tracking-wide text-danger mb-1.5">
                                                            Missed Concepts
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {interview.conceptsMissed.map((concept) => (
                                                                <span
                                                                    key={concept}
                                                                    className="bg-danger-muted border border-danger/10 text-danger text-[11px] px-2.5 py-1 rounded-full"
                                                                >
                                                                    {concept}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-3">
                                                <div className="grid grid-cols-3 gap-2 text-center">
                                                    <div>
                                                        <p className="text-sm font-bold text-text-primary">
                                                            {scores.confidence ?? "-"}
                                                        </p>
                                                        <p className="text-[10px] text-text-tertiary">Conf</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-text-primary">
                                                            {scores.communication ?? "-"}
                                                        </p>
                                                        <p className="text-[10px] text-text-tertiary">Comm</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-text-primary">
                                                            {scores.technical ?? "-"}
                                                        </p>
                                                        <p className="text-[10px] text-text-tertiary">Tech</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => navigate(`/interviews/${interview.id}`)}
                                                        className="bg-bg-tertiary hover:bg-bg-hover border border-border text-text-secondary hover:text-text-primary px-3 py-2 rounded-xl text-xs transition"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(interview.id)}
                                                        className="bg-bg-tertiary hover:bg-danger-muted border border-border hover:border-danger/10 text-text-tertiary hover:text-danger p-2 rounded-xl transition"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                <aside className="col-span-12 lg:col-span-4 space-y-4">
                    <div className="bg-bg-secondary border border-border rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Target size={16} className="text-danger" />
                            <h3 className="text-sm font-semibold text-text-primary">
                                Weakness Memory
                            </h3>
                        </div>

                        {stats?.mostMissedConcepts?.length ? (
                            <div className="space-y-2">
                                {stats.mostMissedConcepts.map((item) => (
                                    <div
                                        key={item.name}
                                        className="flex items-center justify-between bg-bg-tertiary border border-border rounded-xl px-3 py-2"
                                    >
                                        <span className="text-sm text-text-secondary">
                                            {item.name}
                                        </span>
                                        <span className="text-xs text-danger">{item.count}x</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-text-tertiary">
                                Log interviews with missed concepts to see repeated weak areas.
                            </p>
                        )}
                    </div>

                    <div className="bg-bg-secondary border border-border rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Building2 size={16} className="text-brand" />
                            <h3 className="text-sm font-semibold text-text-primary">
                                Company-wise Readiness
                            </h3>
                        </div>

                        {stats?.companyBreakdown?.length ? (
                            <div className="space-y-2">
                                {stats.companyBreakdown.map((item) => (
                                    <div
                                        key={item.company}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="text-sm text-text-secondary">
                                            {item.company}
                                        </span>
                                        <span className="text-xs text-text-tertiary">
                                            {item.count} interview{item.count > 1 ? "s" : ""}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-text-tertiary">
                                Company readiness appears after you log interviews.
                            </p>
                        )}
                    </div>

                    <div className="bg-bg-secondary border border-border rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 size={16} className="text-success" />
                            <h3 className="text-sm font-semibold text-text-primary">
                                Next Action Plan
                            </h3>
                        </div>

                        {stats?.nextActions?.length ? (
                            <ul className="space-y-2">
                                {stats.nextActions.slice(0, 6).map((action, index) => (
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
                            </ul>
                        ) : (
                            <p className="text-sm text-text-tertiary">
                                Analyze an interview with AI to generate your next action plan.
                            </p>
                        )}
                    </div>
                </aside>
            </div>
        </AppLayout>
    );
};