import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    Code2,
    FileText,
    Mic,
    RefreshCw,
    Sparkles,
} from "lucide-react";
import { dailyPlanService } from "../../services/dsa.service";
import { DailyPlanSkeleton } from "./DailyPlanSkeleton";

const iconMap: Record<string, any> = {
    code: Code2,
    file: FileText,
    mic: Mic,
};

const toneMap: Record<string, string> = {
    brand: "text-brand bg-brand-muted",
    success: "text-success bg-success-muted",
    warning: "text-warning bg-warning-muted",
};

export const DailyPlanCard = () => {
    const navigate = useNavigate();

    const [plan, setPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);

    const fetchPlan = async () => {
        try {
            setLoading(true);
            const { data } = await dailyPlanService.get();
            setPlan(data.plan);
        } catch (error) {
            console.error("Failed to fetch daily plan:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = async () => {
        try {
            setRegenerating(true);
            const { data } = await dailyPlanService.regenerate();
            setPlan(data.plan);
        } catch (error) {
            console.error("Failed to regenerate daily plan:", error);
        } finally {
            setRegenerating(false);
        }
    };

    useEffect(() => {
        fetchPlan();
    }, []);

    return (
        <div className="h-full rounded-2xl border border-border bg-bg-secondary p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-muted text-brand">
                        <Sparkles size={18} />
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-text-primary">
                                AI Daily Plan
                            </h3>

                            <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[10px] font-medium text-brand">
                                AI
                            </span>
                        </div>

                        <p className="mt-1 text-xs text-text-tertiary">
                            Focused tasks based on your readiness data.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleRegenerate}
                    disabled={regenerating || loading}
                    className="rounded-lg border border-border p-2 text-text-tertiary transition hover:bg-bg-hover hover:text-text-primary disabled:opacity-50"
                    title="Regenerate plan"
                >
                    <RefreshCw
                        size={14}
                        className={regenerating ? "animate-spin" : ""}
                    />
                </button>
            </div>

            {loading || regenerating ? (
                <DailyPlanSkeleton compact />
            ) : (
                <>
                    {plan?.focusMessage && (
                        <div className="mb-4 rounded-xl border border-border bg-bg-tertiary px-4 py-3">
                            <p className="text-sm leading-5 text-text-secondary">
                                🎯 {plan.focusMessage}
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {(plan?.categories ?? []).map((category: any, index: number) => {
                            const Icon = iconMap[category.icon] || Sparkles;
                            const tone = toneMap[category.color] || toneMap.brand;
                            const firstTask = category.items?.[0];

                            if (!firstTask) return null;

                            return (
                                <div
                                    key={`${category.name}-${index}`}
                                    className="rounded-xl border border-border bg-bg-tertiary px-4 py-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tone}`}
                                        >
                                            <Icon size={14} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-text-primary">
                                                    {category.name}
                                                </p>

                                                {firstTask.duration && (
                                                    <span className="shrink-0 text-xs text-text-tertiary">
                                                        {firstTask.duration}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-1 text-sm font-medium leading-5 text-text-primary">
                                                {firstTask.task}
                                            </p>

                                            {firstTask.reason && (
                                                <p className="mt-1 text-xs leading-5 text-text-tertiary">
                                                    {firstTask.reason}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                        <p className="text-xs text-text-tertiary">
                            Total: {plan?.totalTime || "—"}
                        </p>

                        <button
                            onClick={() => navigate("/daily-plan")}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
                        >
                            Full plan
                            <ArrowRight size={12} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
