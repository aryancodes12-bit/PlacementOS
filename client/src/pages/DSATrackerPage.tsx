import { useEffect, useMemo, useState } from "react";
import {
    CheckCircle2,
    CircleDot,
    Clock3,
    Code2,
    Edit3,
    ExternalLink,
    Flame,
    Plus,
    RotateCcw,
    Search,
    Trash2,
    Download,
} from "lucide-react";

import { AppLayout } from "../components/ui/AppLayout";
import { AddProblemModal } from "../components/dsa/AddProblemModal";
import { DSAScoreOverview } from "../components/dsa/DSAScoreOverview";
import { TopicProgressCard } from "../components/dsa/TopicProgressCard";
import { PatternCoverageGrid } from "../components/dsa/PatternCoverageGrid";
import { RevisionQueueCard } from "../components/dsa/RevisionQueueCard";
import { LeetCodeImportModal } from "../components/dsa/LeetCodeImportModal";
import { dsaService } from "../services/dsa.service";

import type {
    DSAAnalytics,
    DSADifficulty,
    DSAProblem,
    DSAStats,
    DSAStatus,
} from "../services/dsa.service";

const TOPICS = [
    "All",
    "Arrays",
    "Strings",
    "Linked List",
    "Stack",
    "Queue",
    "Trees",
    "Graphs",
    "Dynamic Programming",
    "Recursion",
    "Binary Search",
    "Sorting",
    "Hashing",
    "Greedy",
    "Backtracking",
    "Heap",
    "Trie",
    "Math",
];

const statusStyle: Record<DSAStatus, string> = {
    SOLVED: "border-success/20 bg-success-muted text-success",
    ATTEMPTED: "border-warning/20 bg-warning-muted text-warning",
    UNSOLVED: "border-border bg-bg-tertiary text-text-tertiary",
};

const difficultyStyle: Record<DSADifficulty, string> = {
    EASY: "bg-success-muted text-success",
    MEDIUM: "bg-warning-muted text-warning",
    HARD: "bg-danger-muted text-danger",
};

const formatRevisionDate = (value?: string | null) => {
    if (!value) return "Not scheduled";

    return new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
    });
};

export const DSATrackerPage = () => {
    const [problems, setProblems] = useState<DSAProblem[]>([]);
    const [stats, setStats] = useState<DSAStats | null>(null);
    const [analytics, setAnalytics] = useState<DSAAnalytics | null>(null);
    const [streak, setStreak] = useState(0);

    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProblem, setEditingProblem] = useState<DSAProblem | null>(null);
    const [revisingId, setRevisingId] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [topicFilter, setTopicFilter] = useState("All");
    const [patternFilter, setPatternFilter] = useState("All");
    const [difficultyFilter, setDifficultyFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [companyFilter, setCompanyFilter] = useState("");
    const [revisionDueOnly, setRevisionDueOnly] = useState(false);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search]);

    const fetchProblems = async () => {
        try {
            setLoading(true);

            const { data } = await dsaService.getAll({
                ...(topicFilter !== "All" && {
                    topic: topicFilter,
                }),

                ...(patternFilter !== "All" && {
                    pattern: patternFilter,
                }),

                ...(difficultyFilter !== "All" && {
                    difficulty: difficultyFilter as DSADifficulty,
                }),

                ...(statusFilter !== "All" && {
                    status: statusFilter as DSAStatus,
                }),

                ...(companyFilter.trim() && {
                    company: companyFilter.trim(),
                }),

                ...(debouncedSearch && {
                    search: debouncedSearch,
                }),

                ...(revisionDueOnly && {
                    revisionDue: true,
                }),
            });

            setProblems(data.problems);
            setStats(data.stats);
        } catch (error) {
            console.error("Failed to fetch DSA problems:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            setAnalyticsLoading(true);

            const { data } = await dsaService.getAnalytics();

            setAnalytics(data.analytics);
        } catch (error) {
            console.error("Failed to fetch DSA analytics:", error);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const fetchStreak = async () => {
        try {
            const { data } = await dsaService.getStreak();

            setStreak(data.currentStreak);
        } catch (error) {
            console.error("Failed to fetch DSA streak:", error);
        }
    };

    const refreshAll = async () => {
        await Promise.all([
            fetchProblems(),
            fetchAnalytics(),
            fetchStreak(),
        ]);
    };

    useEffect(() => {
        fetchProblems();
    }, [
        topicFilter,
        patternFilter,
        difficultyFilter,
        statusFilter,
        companyFilter,
        revisionDueOnly,
        debouncedSearch,
    ]);

    useEffect(() => {
        Promise.all([fetchAnalytics(), fetchStreak()]);
    }, []);

    const availablePatterns = useMemo(() => {
        const analyticsPatterns =
            analytics?.patternCoverage.map((item) => item.pattern) ?? [];

        return ["All", ...analyticsPatterns];
    }, [analytics]);

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm(
            "Delete this problem and its revision history?"
        );

        if (!confirmed) return;

        try {
            await dsaService.delete(id);
            await refreshAll();
        } catch (error) {
            console.error("Failed to delete DSA problem:", error);
        }
    };

    const handleStatusChange = async (
        problem: DSAProblem,
        nextStatus: DSAStatus
    ) => {
        if (nextStatus === problem.status) return;

        try {
            await dsaService.update(problem.id, {
                status: nextStatus,
            });

            await refreshAll();
        } catch (error) {
            console.error("Failed to update DSA status:", error);
        }
    };

    const handleRevise = async (problemId: string) => {
        try {
            setRevisingId(problemId);

            await dsaService.revise(problemId);

            await refreshAll();
        } catch (error) {
            console.error("Failed to mark problem revised:", error);
        } finally {
            setRevisingId(null);
        }
    };

    const openCreateModal = () => {
        setEditingProblem(null);
        setShowModal(true);
    };

    const openEditModal = (problem: DSAProblem) => {
        setEditingProblem(problem);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProblem(null);
    };
    const [
        showLeetCodeModal,
        setShowLeetCodeModal,
    ] = useState(false);
    const clearFilters = () => {
        setSearch("");
        setDebouncedSearch("");
        setTopicFilter("All");
        setPatternFilter("All");
        setDifficultyFilter("All");
        setStatusFilter("All");
        setCompanyFilter("");
        setRevisionDueOnly(false);
    };

    const filtersActive =
        search.trim().length > 0 ||
        topicFilter !== "All" ||
        patternFilter !== "All" ||
        difficultyFilter !== "All" ||
        statusFilter !== "All" ||
        companyFilter.trim().length > 0 ||
        revisionDueOnly;

    const statCards = [
        {
            label: "Solved",
            value: stats?.solved ?? 0,
            icon: CheckCircle2,
            tone: "text-success bg-success-muted",
        },
        {
            label: "Attempted",
            value: stats?.attempted ?? 0,
            icon: Clock3,
            tone: "text-warning bg-warning-muted",
        },
        {
            label: "Unsolved",
            value: stats?.unsolved ?? 0,
            icon: CircleDot,
            tone: "text-text-secondary bg-bg-tertiary",
        },
        {
            label: "Revision Due",
            value: stats?.revisionDue ?? 0,
            icon: RotateCcw,
            tone:
                (stats?.revisionDue ?? 0) > 0
                    ? "text-danger bg-danger-muted"
                    : "text-brand bg-brand-muted",
        },
    ];

    return (
        <AppLayout
            title="DSA Tracker"
            description="Track patterns, revision discipline, weak topics, and placement-focused DSA readiness."
            action={
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            setShowLeetCodeModal(true)
                        }
                        className="flex items-center gap-2 rounded-xl border border-border bg-bg-secondary px-4 py-2.5 text-sm font-medium text-text-secondary transition hover:border-brand/40 hover:text-brand"
                    >
                        <Download size={15} />
                        Import LeetCode
                    </button>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover"
                    >
                        <Plus size={15} />
                        Add Problem
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 xl:col-span-4">
                        <DSAScoreOverview
                            analytics={analytics}
                            loading={analyticsLoading}
                        />
                    </div>

                    <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-8 xl:grid-cols-4">
                        {statCards.map(({ label, value, icon: Icon, tone }) => (
                            <div
                                key={label}
                                className="rounded-2xl border border-border bg-bg-secondary p-4"
                            >
                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}
                                >
                                    <Icon size={16} />
                                </div>

                                <p className="mt-4 text-2xl font-bold text-text-primary">
                                    {loading ? "..." : value}
                                </p>

                                <p className="mt-1 text-xs uppercase tracking-wide text-text-tertiary">
                                    {label}
                                </p>
                            </div>
                        ))}

                        <div className="rounded-2xl border border-border bg-bg-secondary p-4 sm:col-span-2 xl:col-span-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-muted text-warning">
                                    <Flame size={17} />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-text-primary">
                                        {streak} day DSA streak
                                    </p>

                                    <p className="mt-1 text-xs text-text-tertiary">
                                        Solving, editing, or revising a problem keeps your
                                        preparation streak active.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 xl:col-span-7">
                        <TopicProgressCard
                            topics={analytics?.topicProgress ?? []}
                            loading={analyticsLoading}
                        />
                    </div>

                    <div className="col-span-12 xl:col-span-5">
                        <RevisionQueueCard
                            revisionQueue={analytics?.revisionQueue ?? []}
                            consistency={analytics?.revisionConsistency ?? null}
                            revisingId={revisingId}
                            loading={analyticsLoading}
                            onRevise={handleRevise}
                        />
                    </div>
                </div>

                <PatternCoverageGrid
                    patterns={analytics?.patternCoverage ?? []}
                    loading={analyticsLoading}
                    selectedPattern={
                        patternFilter === "All" ? undefined : patternFilter
                    }
                    onSelectPattern={(pattern) =>
                        setPatternFilter((current) =>
                            current === pattern ? "All" : pattern
                        )
                    }
                />

                <div className="rounded-2xl border border-border bg-bg-secondary p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative min-w-56 flex-1">
                            <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                            />

                            <input
                                className="w-full rounded-xl border border-border bg-bg-tertiary py-2.5 pl-9 pr-4 text-sm text-text-primary placeholder-text-tertiary transition focus:border-brand focus:outline-none"
                                placeholder="Search title, topic, or pattern..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </div>

                        <select
                            className="rounded-xl border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-secondary focus:border-brand focus:outline-none"
                            value={topicFilter}
                            onChange={(event) => setTopicFilter(event.target.value)}
                        >
                            {TOPICS.map((topic) => (
                                <option key={topic} value={topic}>
                                    {topic === "All" ? "All topics" : topic}
                                </option>
                            ))}
                        </select>

                        <select
                            className="rounded-xl border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-secondary focus:border-brand focus:outline-none"
                            value={patternFilter}
                            onChange={(event) => setPatternFilter(event.target.value)}
                        >
                            {availablePatterns.map((pattern) => (
                                <option key={pattern} value={pattern}>
                                    {pattern === "All" ? "All patterns" : pattern}
                                </option>
                            ))}
                        </select>

                        <select
                            className="rounded-xl border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-secondary focus:border-brand focus:outline-none"
                            value={difficultyFilter}
                            onChange={(event) => setDifficultyFilter(event.target.value)}
                        >
                            <option value="All">All difficulties</option>
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                        </select>

                        <select
                            className="rounded-xl border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-secondary focus:border-brand focus:outline-none"
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                        >
                            <option value="All">All statuses</option>
                            <option value="SOLVED">Solved</option>
                            <option value="ATTEMPTED">Attempted</option>
                            <option value="UNSOLVED">Unsolved</option>
                        </select>

                        <input
                            className="w-40 rounded-xl border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:border-brand focus:outline-none"
                            placeholder="Company..."
                            value={companyFilter}
                            onChange={(event) => setCompanyFilter(event.target.value)}
                        />

                        <button
                            type="button"
                            onClick={() => setRevisionDueOnly((current) => !current)}
                            className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${revisionDueOnly
                                ? "border-brand bg-brand-muted text-brand"
                                : "border-border bg-bg-tertiary text-text-secondary hover:border-border-hover"
                                }`}
                        >
                            Revision due
                        </button>

                        {filtersActive && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-xs font-medium text-brand hover:underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border bg-bg-secondary">
                    <div className="overflow-x-auto">
                        <div className="min-w-[1100px]">
                            <div className="grid grid-cols-12 border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">
                                <div className="col-span-2">Status</div>
                                <div className="col-span-3">Problem</div>
                                <div className="col-span-2">Topic & Pattern</div>
                                <div className="col-span-1">Difficulty</div>
                                <div className="col-span-2">Revision</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>

                            {loading ? (
                                <div className="space-y-2 p-3">
                                    {[1, 2, 3, 4].map((item) => (
                                        <div
                                            key={item}
                                            className="h-16 animate-pulse rounded-xl bg-bg-tertiary"
                                        />
                                    ))}
                                </div>
                            ) : problems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Code2 size={34} className="text-border-hover" />

                                    <p className="mt-3 text-sm font-medium text-text-primary">
                                        No matching problems
                                    </p>

                                    <p className="mt-1 text-xs text-text-tertiary">
                                        Add a problem or clear the active filters.
                                    </p>
                                </div>
                            ) : (
                                problems.map((problem, index) => (
                                    <div
                                        key={problem.id}
                                        className={`grid grid-cols-12 items-center px-4 py-3.5 transition hover:bg-bg-tertiary ${index !== problems.length - 1
                                            ? "border-b border-border"
                                            : ""
                                            }`}
                                    >
                                        <div className="col-span-2 pr-3">
                                            <select
                                                value={problem.status}
                                                onChange={(event) =>
                                                    handleStatusChange(
                                                        problem,
                                                        event.target.value as DSAStatus
                                                    )
                                                }
                                                className={`w-full max-w-32 cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none ${statusStyle[problem.status]}`}
                                            >
                                                <option value="UNSOLVED">Unsolved</option>
                                                <option value="ATTEMPTED">Attempted</option>
                                                <option value="SOLVED">Solved</option>
                                            </select>
                                        </div>

                                        <div className="col-span-3 min-w-0 pr-4">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate text-sm font-semibold text-text-primary">
                                                    {problem.title}
                                                </p>

                                                {problem.problemUrl && (
                                                    <a
                                                        href={problem.problemUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="shrink-0 text-text-tertiary transition hover:text-brand"
                                                    >
                                                        <ExternalLink size={13} />
                                                    </a>
                                                )}
                                            </div>

                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {problem.companies.slice(0, 3).map((company) => (
                                                    <span
                                                        key={company}
                                                        className="rounded-md bg-bg-tertiary px-1.5 py-0.5 text-[10px] text-text-tertiary"
                                                    >
                                                        {company}
                                                    </span>
                                                ))}
                                            </div>

                                            {problem.notes && (
                                                <p className="mt-1 truncate text-xs text-text-tertiary">
                                                    {problem.notes}
                                                </p>
                                            )}
                                        </div>

                                        <div className="col-span-2 pr-3">
                                            <p className="text-xs font-medium text-text-secondary">
                                                {problem.topic}
                                            </p>

                                            <p className="mt-1 text-xs text-text-tertiary">
                                                {problem.pattern || "Pattern not assigned"}
                                            </p>
                                        </div>

                                        <div className="col-span-1">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${difficultyStyle[problem.difficulty]}`}
                                            >
                                                {problem.difficulty}
                                            </span>
                                        </div>

                                        <div className="col-span-2">
                                            <p className="text-xs text-text-secondary">
                                                {formatRevisionDate(problem.nextRevisionAt)}
                                            </p>

                                            <p className="mt-1 text-[11px] text-text-tertiary">
                                                {problem.revisionCount} revisions · {problem.solveCount}{" "}
                                                solves
                                            </p>
                                        </div>

                                        <div className="col-span-2 flex justify-end gap-2">
                                            {problem.status === "SOLVED" && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRevise(problem.id)}
                                                    disabled={revisingId === problem.id}
                                                    className="rounded-lg border border-border p-2 text-text-tertiary transition hover:border-brand/40 hover:text-brand disabled:opacity-50"
                                                    title="Mark revised"
                                                >
                                                    <RotateCcw
                                                        size={14}
                                                        className={
                                                            revisingId === problem.id ? "animate-spin" : ""
                                                        }
                                                    />
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => openEditModal(problem)}
                                                className="rounded-lg border border-border p-2 text-text-tertiary transition hover:border-brand/40 hover:text-brand"
                                                title="Edit problem"
                                            >
                                                <Edit3 size={14} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(problem.id)}
                                                className="rounded-lg border border-border p-2 text-text-tertiary transition hover:border-danger/30 hover:text-danger"
                                                title="Delete problem"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border px-4 py-3">
                        <p className="text-xs text-text-tertiary">
                            Showing {problems.length} of {stats?.total ?? 0} tracked problems
                        </p>

                        <p className="text-xs text-text-tertiary">
                            DSA score:{" "}
                            <span className="font-semibold text-brand">
                                {analytics?.dsaScore ?? 0}/100
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {showModal && (
                <AddProblemModal
                    problem={editingProblem}
                    onClose={closeModal}
                    onSaved={async () => {
                        await refreshAll();
                    }}
                />
            )}{showLeetCodeModal && (
                <LeetCodeImportModal
                    onClose={() =>
                        setShowLeetCodeModal(false)
                    }
                    onImported={refreshAll}
                />
            )}
        </AppLayout>
    );
};