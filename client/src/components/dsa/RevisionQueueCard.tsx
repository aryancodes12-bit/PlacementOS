import {
    CalendarClock,
    Check,
    ExternalLink,
    RefreshCw,
} from "lucide-react";

import type {
    DSARevisionConsistency,
    DSARevisionQueueItem,
} from "../../services/dsa.service";

interface RevisionQueueCardProps {
    revisionQueue: DSARevisionQueueItem[];
    consistency: DSARevisionConsistency | null;
    revisingId?: string | null;
    loading?: boolean;
    onRevise: (problemId: string) => void;
}

const formatDueDate = (value?: string | null) => {
    if (!value) return "Not scheduled";

    return new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
    });
};

export const RevisionQueueCard = ({
    revisionQueue,
    consistency,
    revisingId,
    loading = false,
    onRevise,
}: RevisionQueueCardProps) => {
    return (
        <div className="h-full rounded-2xl border border-border bg-bg-secondary p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <CalendarClock size={17} className="text-warning" />
                        <h2 className="text-sm font-semibold text-text-primary">
                            Revision Queue
                        </h2>
                    </div>

                    <p className="mt-1 text-xs text-text-tertiary">
                        Problems due for spaced repetition.
                    </p>
                </div>

                {consistency && (
                    <div className="rounded-lg bg-bg-tertiary px-2.5 py-1 text-xs">
                        <span className="text-text-tertiary">Consistency </span>
                        <span className="font-semibold text-text-primary">
                            {consistency.percentage}%
                        </span>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="h-20 animate-pulse rounded-xl bg-bg-tertiary"
                        />
                    ))}
                </div>
            ) : revisionQueue.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-border bg-bg-tertiary px-6 text-center">
                    <Check size={25} className="text-success" />

                    <p className="mt-3 text-sm font-medium text-text-primary">
                        Revision queue is clear
                    </p>

                    <p className="mt-1 text-xs leading-5 text-text-tertiary">
                        Solved problems will appear here when their next revision becomes
                        due.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {revisionQueue.slice(0, 5).map((problem) => (
                        <div
                            key={problem.id}
                            className="rounded-xl border border-border bg-bg-tertiary p-3"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate text-sm font-semibold text-text-primary">
                                            {problem.title}
                                        </p>

                                        {problem.problemUrl && (
                                            <a
                                                href={problem.problemUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-text-tertiary transition hover:text-brand"
                                            >
                                                <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </div>

                                    <p className="mt-1 text-xs text-text-tertiary">
                                        {problem.pattern || problem.topic} · Due{" "}
                                        {formatDueDate(problem.nextRevisionAt)}
                                    </p>

                                    {problem.overdueDays > 0 && (
                                        <p className="mt-1 text-xs font-medium text-danger">
                                            {problem.overdueDays} day
                                            {problem.overdueDays === 1 ? "" : "s"} overdue
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onRevise(problem.id)}
                                    disabled={revisingId === problem.id}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-brand-hover disabled:opacity-50"
                                >
                                    <RefreshCw
                                        size={12}
                                        className={
                                            revisingId === problem.id ? "animate-spin" : ""
                                        }
                                    />

                                    Revised
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};