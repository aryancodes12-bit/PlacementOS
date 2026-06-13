import { useEffect, useState } from "react";
import {
    CheckCircle2,
    Circle,
    Clock,
    Code2,
    ExternalLink,
    Flame,
    Plus,
    Search,
    Trash2,
} from "lucide-react";

import { AppLayout } from "../components/ui/AppLayout";
import { AddProblemModal } from "../components/dsa/AddProblemModal";
import { dsaService } from "../services/dsa.service";

import type {
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
    "Math",
];

const difficultyStyle = {
    EASY: "bg-success-muted text-success",
    MEDIUM: "bg-warning-muted text-warning",
    HARD: "bg-danger-muted text-danger",
};

const statusIcon = {
    SOLVED: <CheckCircle2 size={15} className="text-success" />,
    ATTEMPTED: <Clock size={15} className="text-warning" />,
    UNSOLVED: <Circle size={15} className="text-text-tertiary" />,
};

export const DSATrackerPage = () => {
    const [problems, setProblems] = useState<DSAProblem[]>([]);
    const [stats, setStats] = useState<DSAStats | null>(null);
    const [streak, setStreak] = useState(0);

    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [search, setSearch] = useState("");
    const [topicFilter, setTopicFilter] = useState("All");
    const [difficultyFilter, setDifficultyFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    const fetchProblems = async () => {
        setLoading(true);

        try {
            const { data } = await dsaService.getAll({
                ...(topicFilter !== "All" && { topic: topicFilter }),
                ...(difficultyFilter !== "All" && { difficulty: difficultyFilter }),
                ...(statusFilter !== "All" && { status: statusFilter }),
                ...(search.trim() && { search: search.trim() }),
            });

            setProblems(data.problems);
            setStats(data.stats);
        } catch (error) {
            console.error("Failed to fetch DSA problems:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStreak = async () => {
        try {
            const { data } = await dsaService.getStreak();
            setStreak(data.currentStreak);
        } catch (error) {
            console.error("Failed to fetch streak:", error);
        }
    };

    useEffect(() => {
        fetchProblems();
    }, [topicFilter, difficultyFilter, statusFilter, search]);

    useEffect(() => {
        fetchStreak();
    }, []);

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm("Delete this problem?");
        if (!confirmed) return;

        try {
            await dsaService.delete(id);
            await fetchProblems();
        } catch (error) {
            console.error("Failed to delete problem:", error);
        }
    };

    const handleStatusToggle = async (problem: DSAProblem) => {
        const nextStatus = {
            UNSOLVED: "ATTEMPTED",
            ATTEMPTED: "SOLVED",
            SOLVED: "UNSOLVED",
        }[problem.status] as DSAStatus;

        try {
            await dsaService.update(problem.id, {
                status: nextStatus,
            });

            await fetchProblems();
            await fetchStreak();
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    return (
        <AppLayout
            title="DSA Tracker"
            description="Track solved problems, weak topics, difficulty distribution, and placement prep consistency."
            action={
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-brand hover:bg-brand-hover text-white px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2"
                >
                    <Plus size={15} />
                    Add Problem
                </button>
            }
        >
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
                    {[
                        { label: "Total", value: stats.total, color: "text-text-primary" },
                        { label: "Solved", value: stats.solved, color: "text-success" },
                        {
                            label: "Attempted",
                            value: stats.attempted,
                            color: "text-warning",
                        },
                        {
                            label: "Unsolved",
                            value: stats.unsolved,
                            color: "text-text-tertiary",
                        },
                        {
                            label: "Streak",
                            value: `${streak}d`,
                            color: "text-warning",
                            icon: true,
                        },
                    ].map(({ label, value, color, icon }) => (
                        <div
                            key={label}
                            className="bg-bg-secondary border border-border rounded-2xl p-4"
                        >
                            <div className="flex items-center gap-2">
                                {icon && <Flame size={18} className="text-warning" />}
                                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                            </div>

                            <p className="text-xs text-text-tertiary uppercase tracking-wide mt-1">
                                {label}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {stats && (
                <div className="bg-bg-secondary border border-border rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-6 flex-wrap">
                        <p className="text-xs text-text-tertiary uppercase tracking-wide">
                            Difficulty Distribution
                        </p>

                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-success" />
                            <span className="text-xs text-text-secondary">
                                Easy: {stats.byDifficulty.easy}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-warning" />
                            <span className="text-xs text-text-secondary">
                                Medium: {stats.byDifficulty.medium}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-danger" />
                            <span className="text-xs text-text-secondary">
                                Hard: {stats.byDifficulty.hard}
                            </span>
                        </div>

                        <div className="flex-1 min-w-48 h-2 bg-bg-tertiary rounded-full overflow-hidden flex">
                            {stats.total > 0 && (
                                <>
                                    <div
                                        className="h-full bg-success"
                                        style={{
                                            width: `${(stats.byDifficulty.easy / stats.total) * 100}%`,
                                        }}
                                    />
                                    <div
                                        className="h-full bg-warning"
                                        style={{
                                            width: `${(stats.byDifficulty.medium / stats.total) * 100
                                                }%`,
                                        }}
                                    />
                                    <div
                                        className="h-full bg-danger"
                                        style={{
                                            width: `${(stats.byDifficulty.hard / stats.total) * 100}%`,
                                        }}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="relative">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                    />

                    <input
                        className="bg-bg-secondary border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand transition w-60"
                        placeholder="Search problems..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    className="bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-brand transition"
                    value={topicFilter}
                    onChange={(e) => setTopicFilter(e.target.value)}
                >
                    {TOPICS.map((topic) => (
                        <option key={topic} value={topic}>
                            {topic}
                        </option>
                    ))}
                </select>

                <select
                    className="bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-brand transition"
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                >
                    <option value="All">All Difficulty</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                </select>

                <select
                    className="bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-brand transition"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="All">All Status</option>
                    <option value="SOLVED">Solved</option>
                    <option value="ATTEMPTED">Attempted</option>
                    <option value="UNSOLVED">Unsolved</option>
                </select>

                <span className="text-xs text-text-tertiary ml-auto">
                    {problems.length} problems
                </span>
            </div>

            <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 px-4 py-3 border-b border-border text-xs font-medium text-text-tertiary uppercase tracking-wide">
                    <div className="col-span-1">Status</div>
                    <div className="col-span-4">Problem</div>
                    <div className="col-span-2">Topic</div>
                    <div className="col-span-2">Difficulty</div>
                    <div className="col-span-2">Platform</div>
                    <div className="col-span-1 text-right">Action</div>
                </div>

                {loading ? (
                    <div className="p-3 space-y-2">
                        {[1, 2, 3, 4, 5].map((item) => (
                            <div
                                key={item}
                                className="h-14 bg-bg-tertiary rounded-xl animate-pulse"
                            />
                        ))}
                    </div>
                ) : problems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Code2 size={34} className="text-border-hover" />

                        <div className="text-center">
                            <p className="text-sm font-medium text-text-primary">
                                No DSA problems found
                            </p>
                            <p className="text-xs text-text-tertiary mt-1">
                                Add your first problem to start tracking preparation.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowModal(true)}
                            className="text-brand text-sm hover:underline"
                        >
                            Add your first problem
                        </button>
                    </div>
                ) : (
                    problems.map((problem, index) => (
                        <div
                            key={problem.id}
                            className={`grid grid-cols-12 px-4 py-3.5 items-center hover:bg-bg-tertiary transition-colors ${index !== problems.length - 1 ? "border-b border-border" : ""
                                }`}
                        >
                            <div className="col-span-1">
                                <button
                                    onClick={() => handleStatusToggle(problem)}
                                    className="hover:scale-110 transition-transform"
                                    title="Click to change status"
                                >
                                    {statusIcon[problem.status]}
                                </button>
                            </div>

                            <div className="col-span-4 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-text-primary truncate">
                                        {problem.title}
                                    </p>

                                    {problem.problemUrl && (
                                        <a
                                            href={problem.problemUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-text-tertiary hover:text-brand transition"
                                        >
                                            <ExternalLink size={13} />
                                        </a>
                                    )}
                                </div>

                                {problem.notes && (
                                    <p className="text-xs text-text-tertiary truncate mt-0.5">
                                        {problem.notes}
                                    </p>
                                )}
                            </div>

                            <div className="col-span-2">
                                <span className="text-xs text-text-secondary bg-bg-tertiary px-2.5 py-1 rounded-lg">
                                    {problem.topic}
                                </span>
                            </div>

                            <div className="col-span-2">
                                <span
                                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${difficultyStyle[problem.difficulty]
                                        }`}
                                >
                                    {problem.difficulty}
                                </span>
                            </div>

                            <div className="col-span-2">
                                <span className="text-xs text-text-tertiary">
                                    {problem.platform || "—"}
                                </span>
                            </div>

                            <div className="col-span-1 flex justify-end">
                                <button
                                    onClick={() => handleDelete(problem.id)}
                                    className="text-text-tertiary hover:text-danger transition-colors p-1"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <AddProblemModal
                    onClose={() => setShowModal(false)}
                    onAdded={async () => {
                        await fetchProblems();
                        await fetchStreak();
                    }}
                />
            )}
        </AppLayout>
    );
};