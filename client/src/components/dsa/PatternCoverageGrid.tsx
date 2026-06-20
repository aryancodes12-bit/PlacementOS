import { Grid3X3 } from "lucide-react";

import type {
    DSAPatternCoverage,
    PatternCoverageStatus,
} from "../../services/dsa.service";

interface PatternCoverageGridProps {
    patterns: DSAPatternCoverage[];
    loading?: boolean;
    selectedPattern?: string;
    onSelectPattern?: (pattern: string) => void;
}

const toneMap: Record<PatternCoverageStatus, string> = {
    STRONG: "border-success/20 bg-success-muted text-success",
    DEVELOPING: "border-warning/20 bg-warning-muted text-warning",
    WEAK: "border-danger/20 bg-danger-muted text-danger",
    NOT_STARTED: "border-border bg-bg-tertiary text-text-tertiary",
};

const labelMap: Record<PatternCoverageStatus, string> = {
    STRONG: "Strong",
    DEVELOPING: "Developing",
    WEAK: "Weak",
    NOT_STARTED: "Not started",
};

export const PatternCoverageGrid = ({
    patterns,
    loading = false,
    selectedPattern,
    onSelectPattern,
}: PatternCoverageGridProps) => {
    return (
        <div className="rounded-2xl border border-border bg-bg-secondary p-5">
            <div className="mb-4">
                <div className="flex items-center gap-2">
                    <Grid3X3 size={17} className="text-brand" />
                    <h2 className="text-sm font-semibold text-text-primary">
                        Pattern Coverage
                    </h2>
                </div>

                <p className="mt-1 text-xs text-text-tertiary">
                    Build breadth across common interview-solving patterns.
                </p>
            </div>

            {loading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                        <div
                            key={item}
                            className="h-24 animate-pulse rounded-xl bg-bg-tertiary"
                        />
                    ))}
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {patterns.map((pattern) => {
                        const selected = selectedPattern === pattern.pattern;

                        return (
                            <button
                                key={pattern.pattern}
                                type="button"
                                onClick={() => onSelectPattern?.(pattern.pattern)}
                                className={`rounded-xl border p-3 text-left transition hover:border-brand/40 ${selected
                                        ? "border-brand bg-brand-muted"
                                        : "border-border bg-bg-tertiary"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-text-primary">
                                        {pattern.pattern}
                                    </p>

                                    <span
                                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${toneMap[pattern.status]}`}
                                    >
                                        {labelMap[pattern.status]}
                                    </span>
                                </div>

                                <div className="mt-3 flex items-end justify-between gap-2">
                                    <div>
                                        <p className="text-xl font-bold text-text-primary">
                                            {pattern.percentage}%
                                        </p>
                                        <p className="text-[11px] text-text-tertiary">
                                            {pattern.solved}/{pattern.total} solved
                                        </p>
                                    </div>

                                    <div className="h-10 w-1.5 overflow-hidden rounded-full bg-bg-secondary">
                                        <div
                                            className="w-full rounded-full bg-brand"
                                            style={{
                                                height: `${Math.max(4, pattern.percentage)}%`,
                                                marginTop: `${100 - Math.max(4, pattern.percentage)}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};