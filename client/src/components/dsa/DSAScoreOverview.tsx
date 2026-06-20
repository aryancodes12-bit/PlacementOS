import {
    BrainCircuit,
    CheckCircle2,
    Layers3,
    RefreshCw,
    Target,
} from "lucide-react";

import type { DSAAnalytics } from "../../services/dsa.service";

interface DSAScoreOverviewProps {
    analytics: DSAAnalytics | null;
    loading?: boolean;
}

const ProgressRow = ({
    label,
    value,
    max,
    icon: Icon,
}: {
    label: string;
    value: number;
    max: number;
    icon: typeof Target;
}) => {
    const percentage =
        max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Icon size={13} className="text-text-tertiary" />
                    <span className="text-xs text-text-secondary">{label}</span>
                </div>

                <span className="text-xs font-semibold text-text-primary">
                    {value}/{max}
                </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
                <div
                    className="h-full rounded-full bg-brand transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export const DSAScoreOverview = ({
    analytics,
    loading = false,
}: DSAScoreOverviewProps) => {
    if (loading || !analytics) {
        return (
            <div className="h-full min-h-64 animate-pulse rounded-2xl border border-border bg-bg-secondary" />
        );
    }

    const { scoreBreakdown } = analytics;

    return (
        <div className="h-full rounded-2xl border border-border bg-bg-secondary p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <BrainCircuit size={17} className="text-brand" />
                        <h2 className="text-sm font-semibold text-text-primary">
                            DSA Readiness Score
                        </h2>
                    </div>

                    <p className="mt-1 text-xs text-text-tertiary">
                        Based on solved problems, pattern breadth, and revision discipline.
                    </p>
                </div>

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-brand/30 bg-brand-muted">
                    <span className="text-2xl font-bold text-brand">
                        {analytics.dsaScore}
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                <ProgressRow
                    label="Problem solving"
                    value={scoreBreakdown.solvingProgress.points}
                    max={scoreBreakdown.solvingProgress.maxPoints}
                    icon={CheckCircle2}
                />

                <ProgressRow
                    label="Pattern coverage"
                    value={scoreBreakdown.patternCoverage.points}
                    max={scoreBreakdown.patternCoverage.maxPoints}
                    icon={Layers3}
                />

                <ProgressRow
                    label="Revision discipline"
                    value={scoreBreakdown.revisionDiscipline.points}
                    max={scoreBreakdown.revisionDiscipline.maxPoints}
                    icon={RefreshCw}
                />
            </div>

            <div className="mt-5 border-t border-border pt-4">
                <p className="text-xs font-medium text-text-secondary">
                    Today’s target
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-bg-tertiary px-2.5 py-1 text-xs text-text-secondary">
                        {analytics.dailyTarget.newProblems} new problems
                    </span>

                    <span className="rounded-lg bg-bg-tertiary px-2.5 py-1 text-xs text-text-secondary">
                        {analytics.dailyTarget.revisions} revisions
                    </span>

                    {analytics.dailyTarget.focusPatterns.map((pattern) => (
                        <span
                            key={pattern}
                            className="rounded-lg bg-brand-muted px-2.5 py-1 text-xs text-brand"
                        >
                            {pattern}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};