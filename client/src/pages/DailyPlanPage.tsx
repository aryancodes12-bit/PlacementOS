import {
    useEffect,
    useState,
} from "react";

import {
    AlertCircle,
    CheckCircle2,
    Code2,
    FileText,
    Loader2,
    Map,
    Mic,
    RefreshCw,
    Sparkles,
    Target,
    Trash2,
} from "lucide-react";

import {
    AppLayout,
} from "../components/ui/AppLayout";

import {
    DailyPlanSkeleton,
} from "../components/dashboard/DailyPlanSkeleton";

import {
    dailyPlanService,
} from "../services/dsa.service";

import {
    roadmapService,
} from "../services/roadmap.service";

interface DailyPlanItem {
    task?: string;
    reason?: string;
    duration?: string;

    source?: string;
    roadmapTopicId?: string;
}

interface DailyPlanCategory {
    name?: string;
    icon?: string;
    color?: string;
    items?: DailyPlanItem[];
}

interface DailyPlan {
    greeting?: string;
    focusMessage?: string;
    totalTime?: string;
    categories?: DailyPlanCategory[];
}

interface NotificationState {
    type: "success" | "error";
    message: string;
}

const iconMap: Record<
    string,
    typeof Sparkles
> = {
    code: Code2,
    file: FileText,
    mic: Mic,
};

const toneMap: Record<
    string,
    string
> = {
    brand:
        "text-brand bg-brand-muted",
    success:
        "text-success bg-success-muted",
    warning:
        "text-warning bg-warning-muted",
};

const getErrorMessage = (
    error: unknown,
    fallback: string
) => {
    if (
        typeof error === "object" &&
        error !== null
    ) {
        const candidate = error as {
            response?: {
                data?: {
                    message?: unknown;
                };
            };
            message?: unknown;
        };

        const responseMessage =
            candidate.response?.data
                ?.message;

        if (
            typeof responseMessage ===
            "string"
        ) {
            return responseMessage;
        }

        if (
            typeof candidate.message ===
            "string"
        ) {
            return candidate.message;
        }
    }

    return fallback;
};

export const DailyPlanPage = () => {
    const [plan, setPlan] =
        useState<DailyPlan | null>(
            null
        );

    const [loading, setLoading] =
        useState(true);

    const [
        regenerating,
        setRegenerating,
    ] = useState(false);

    const [
        removingTopicId,
        setRemovingTopicId,
    ] = useState<string | null>(
        null
    );

    const [
        notification,
        setNotification,
    ] = useState<NotificationState | null>(
        null
    );

    const showNotification = (
        nextNotification: NotificationState
    ) => {
        setNotification(
            nextNotification
        );

        window.setTimeout(() => {
            setNotification(null);
        }, 3500);
    };

    const fetchPlan = async () => {
        try {
            setLoading(true);

            const { data } =
                await dailyPlanService.get();

            setPlan(
                data.plan as DailyPlan
            );
        } catch (error) {
            console.error(
                "Failed to fetch daily plan:",
                error
            );

            showNotification({
                type: "error",
                message:
                    getErrorMessage(
                        error,
                        "Failed to load today’s plan."
                    ),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = async () => {
        try {
            setRegenerating(true);

            const { data } =
                await dailyPlanService.regenerate();

            setPlan(
                data.plan as DailyPlan
            );

            showNotification({
                type: "success",
                message:
                    "Daily plan regenerated. Your roadmap tasks were preserved.",
            });
        } catch (error) {
            console.error(
                "Failed to regenerate daily plan:",
                error
            );

            showNotification({
                type: "error",
                message:
                    getErrorMessage(
                        error,
                        "Failed to regenerate today’s plan."
                    ),
            });
        } finally {
            setRegenerating(false);
        }
    };

    const handleRemoveRoadmapTask =
        async (
            topicId: string
        ) => {
            try {
                setRemovingTopicId(
                    topicId
                );

                const { data } =
                    await roadmapService.removeTopicFromDailyPlan(
                        topicId
                    );

                setPlan(
                    data.data
                        .plan as DailyPlan
                );

                showNotification({
                    type: "success",
                    message:
                        data.message,
                });
            } catch (error) {
                showNotification({
                    type: "error",
                    message:
                        getErrorMessage(
                            error,
                            "Failed to remove roadmap task."
                        ),
                });
            } finally {
                setRemovingTopicId(
                    null
                );
            }
        };

    useEffect(() => {
        void fetchPlan();
    }, []);

    return (
        <AppLayout
            title="Daily AI Plan"
            description="Your personalized placement preparation plan based on DSA, resume, interviews, and readiness."
            action={
                <button
                    onClick={
                        handleRegenerate
                    }
                    disabled={
                        regenerating ||
                        loading
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-60"
                >
                    <RefreshCw
                        size={15}
                        className={
                            regenerating
                                ? "animate-spin"
                                : ""
                        }
                    />
                    Regenerate
                </button>
            }
        >
            {notification && (
                <div
                    role="status"
                    className={[
                        "fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border bg-bg-secondary px-4 py-3 shadow-2xl",
                        notification.type ===
                            "success"
                            ? "border-success/20 text-success"
                            : "border-danger/20 text-danger",
                    ].join(" ")}
                >
                    {notification.type ===
                        "success" ? (
                        <CheckCircle2
                            size={17}
                            className="mt-0.5 shrink-0"
                        />
                    ) : (
                        <AlertCircle
                            size={17}
                            className="mt-0.5 shrink-0"
                        />
                    )}

                    <p className="text-xs leading-5">
                        {notification.message}
                    </p>
                </div>
            )}

            {loading || regenerating ? (
                <DailyPlanSkeleton />
            ) : !plan ? (
                <div className="rounded-2xl border border-border bg-bg-secondary p-8 text-center">
                    <AlertCircle className="mx-auto text-text-tertiary" />
                    <p className="mt-3 text-sm text-text-secondary">
                        Daily plan is not available yet.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            void fetchPlan()
                        }
                        className="mt-4 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover"
                    >
                        Try again
                    </button>
                </div>
            ) : (
                <div className="space-y-5">
                    {plan.greeting && (
                        <div className="rounded-2xl border border-border bg-bg-secondary p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-muted text-brand">
                                    <Sparkles
                                        size={18}
                                    />
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

                    {plan.focusMessage && (
                        <div className="rounded-2xl border border-border bg-bg-secondary p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-muted text-brand">
                                    <Target
                                        size={18}
                                    />
                                </div>

                                <div>
                                    <h2 className="text-base font-semibold text-text-primary">
                                        Today’s Main Focus
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                                        {plan.focusMessage}
                                    </p>
                                    <p className="mt-3 text-xs text-text-tertiary">
                                        Estimated time:{" "}
                                        {plan.totalTime ||
                                            "—"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-5 lg:grid-cols-3">
                        {(plan.categories ?? []).map(
                            (
                                category,
                                index
                            ) => {
                                const Icon =
                                    iconMap[
                                    category.icon ||
                                    ""
                                    ] ||
                                    Sparkles;

                                const tone =
                                    toneMap[
                                    category.color ||
                                    ""
                                    ] ||
                                    toneMap.brand;

                                return (
                                    <div
                                        key={`${category.name}-${index}`}
                                        className="rounded-2xl border border-border bg-bg-secondary p-5"
                                    >
                                        <div className="mb-4 flex items-center gap-3">
                                            <div
                                                className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}
                                            >
                                                <Icon
                                                    size={17}
                                                />
                                            </div>

                                            <div>
                                                <h3 className="text-base font-semibold text-text-primary">
                                                    {category.name}
                                                </h3>
                                                <p className="text-xs text-text-tertiary">
                                                    {(category.items ?? [])
                                                        .length}{" "}
                                                    tasks
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {(category.items ?? []).map(
                                                (
                                                    item,
                                                    itemIndex
                                                ) => {
                                                    const isRoadmapTask =
                                                        item.source ===
                                                        "ROADMAP";

                                                    const topicId =
                                                        String(
                                                            item.roadmapTopicId ||
                                                            ""
                                                        );

                                                    const isRemoving =
                                                        removingTopicId ===
                                                        topicId;

                                                    return (
                                                        <div
                                                            key={
                                                                topicId ||
                                                                `${item.task}-${itemIndex}`
                                                            }
                                                            className={[
                                                                "rounded-xl border bg-bg-tertiary px-4 py-3",
                                                                isRoadmapTask
                                                                    ? "border-brand/20"
                                                                    : "border-border",
                                                            ].join(
                                                                " "
                                                            )}
                                                        >
                                                            {isRoadmapTask && (
                                                                <div className="mb-2 flex items-center justify-between gap-3">
                                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-muted px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-brand">
                                                                        <Map
                                                                            size={10}
                                                                        />
                                                                        Roadmap
                                                                    </span>

                                                                    {topicId && (
                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                isRemoving
                                                                            }
                                                                            onClick={() =>
                                                                                void handleRemoveRoadmapTask(
                                                                                    topicId
                                                                                )
                                                                            }
                                                                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-text-tertiary transition hover:bg-danger-muted hover:text-danger disabled:cursor-wait disabled:opacity-50"
                                                                            aria-label={`Remove ${item.task || "roadmap task"} from today's plan`}
                                                                        >
                                                                            {isRemoving ? (
                                                                                <Loader2
                                                                                    size={13}
                                                                                    className="animate-spin"
                                                                                />
                                                                            ) : (
                                                                                <Trash2
                                                                                    size={13}
                                                                                />
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}

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
                                                    );
                                                }
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                </div>
            )}
        </AppLayout>
    );
};
