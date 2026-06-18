import { useEffect, useState } from "react";
import {
    Code2,
    FileText,
    Loader2,
    Mic,
    RefreshCw,
    Sparkles,
    Target,
} from "lucide-react";
import { AppLayout } from "../components/ui/AppLayout";
import { dailyPlanService } from "../services/dsa.service";

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

export const DailyPlanPage = () => {
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
        <AppLayout
            title="Daily AI Plan"
            description="Your personalized placement preparation plan based on DSA, resume, interviews, and readiness."
            action={
                <button
                    onClick={handleRegenerate}
                    disabled={regenerating || loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-60"
                >
                    <RefreshCw size={15} className={regenerating ? "animate-spin" : ""} />
                    Regenerate
                </button>
            }
        >
            {loading || regenerating ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="h-40 animate-pulse rounded-2xl border border-border bg-bg-secondary"
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-5">
                    {plan?.greeting && (
                        <div className="rounded-2xl border border-border bg-bg-secondary p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-muted text-brand">
                                    <Sparkles size={18} />
                                </div>

                                <div>
                                    <h2 className="text-base font-semibold text-text-primary">
                                        Coach Summary
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                                        {plan.greeting}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {plan?.focusMessage && (
                        <div className="rounded-2xl border border-border bg-bg-secondary p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-muted text-brand">
                                    <Target size={18} />
                                </div>

                                <div>
                                    <h2 className="text-base font-semibold text-text-primary">
                                        Today’s Main Focus
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                                        {plan.focusMessage}
                                    </p>
                                    <p className="mt-3 text-xs text-text-tertiary">
                                        Estimated time: {plan.totalTime || "—"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-5 lg:grid-cols-3">
                        {(plan?.categories ?? []).map((category: any, index: number) => {
                            const Icon = iconMap[category.icon] || Sparkles;
                            const tone = toneMap[category.color] || toneMap.brand;

                            return (
                                <div
                                    key={`${category.name}-${index}`}
                                    className="rounded-2xl border border-border bg-bg-secondary p-5"
                                >
                                    <div className="mb-4 flex items-center gap-3">
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}
                                        >
                                            <Icon size={17} />
                                        </div>

                                        <div>
                                            <h3 className="text-base font-semibold text-text-primary">
                                                {category.name}
                                            </h3>
                                            <p className="text-xs text-text-tertiary">
                                                {(category.items ?? []).length} tasks
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {(category.items ?? []).map((item: any, itemIndex: number) => (
                                            <div
                                                key={`${item.task}-${itemIndex}`}
                                                className="rounded-xl border border-border bg-bg-tertiary px-4 py-3"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="text-sm font-semibold leading-5 text-text-primary">
                                                        {item.task}
                                                    </p>

                                                    {item.duration && (
                                                        <span className="shrink-0 rounded-full bg-bg-secondary px-2 py-1 text-[10px] text-text-tertiary">
                                                            {item.duration}
                                                        </span>
                                                    )}
                                                </div>

                                                {item.reason && (
                                                    <p className="mt-2 text-xs leading-5 text-text-secondary">
                                                        {item.reason}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {!plan && (
                        <div className="rounded-2xl border border-border bg-bg-secondary p-8 text-center">
                            <Loader2 className="mx-auto animate-spin text-text-tertiary" />
                            <p className="mt-3 text-sm text-text-secondary">
                                Daily plan is not available yet.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </AppLayout>
    );
};