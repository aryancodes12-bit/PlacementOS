import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import type {
    FormEvent,
    ReactNode,
} from "react";

import {
    BarChart3,
    Building2,
    CalendarDays,
    CheckCircle2,
    Eye,
    Mic,
    Plus,
    Search,
    Target,
    Trash2,
    TrendingUp,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import {
    InterviewErrorBoundary,
} from "../components/interviews/InterviewErrorBoundary";

import {
    InterviewPageSkeleton,
} from "../components/interviews/InterviewPageSkeleton";

import {
    formatInterviewDate,
    formatInterviewEnum,
    getInterviewApiError,
    getInterviewDisplayScores,
    getInterviewResultClasses,
    getInterviewScoreTone,
    INTERVIEW_RESULTS,
    INTERVIEW_ROUND_TYPES,
} from "../components/interviews/interview-ui.utils";

import {
    ActionButton,
} from "../components/ui/design-system/ActionButton";

import {
    EmptyState,
} from "../components/ui/design-system/EmptyState";

import {
    IconTile,
} from "../components/ui/design-system/IconTile";

import type {
    IconTileTone,
} from "../components/ui/design-system/IconTile";

import {
    PageSurface,
} from "../components/ui/design-system/PageSurface";

import {
    SelectField,
    TextField,
} from "../components/ui/design-system/FormControls";

import {
    StatusNotice,
} from "../components/ui/design-system/StatusNotice";

import {
    AppLayout,
} from "../components/ui/AppLayout";

import {
    interviewService,
} from "../services/interview.service";

import type {
    InterviewFilters,
    InterviewReplay,
    InterviewResult,
    InterviewRoundType,
    InterviewStats,
} from "../services/interview.service";

type InterviewListFilters = {
    search: string;
    roundType:
    | InterviewRoundType
    | "";
    result:
    | InterviewResult
    | "";
};

interface StatCardProps {
    helper: string;
    icon: ReactNode;
    label: string;
    tone: IconTileTone;
    value: ReactNode;
}

interface InsightPanelProps {
    children: ReactNode;
    icon: ReactNode;
    title: string;
}

const EMPTY_FILTERS: InterviewListFilters = {
    search: "",
    roundType: "",
    result: "",
};

const roundTypeOptions = [
    {
        label: "All rounds",
        value: "",
    },
    ...INTERVIEW_ROUND_TYPES.map(
        (roundType) => ({
            label:
                formatInterviewEnum(
                    roundType
                ),
            value:
                roundType,
        })
    ),
];

const resultOptions = [
    {
        label: "All results",
        value: "",
    },
    ...INTERVIEW_RESULTS.map(
        (result) => ({
            label:
                formatInterviewEnum(
                    result
                ),
            value:
                result,
        })
    ),
];

const buildInterviewFilters = ({
    search,
    roundType,
    result,
}: InterviewListFilters): InterviewFilters => {
    return {
        search:
            search.trim() ||
            undefined,
        roundType:
            roundType ||
            undefined,
        result:
            result ||
            undefined,
    };
};

const hasFilters = ({
    search,
    roundType,
    result,
}: InterviewListFilters) => {
    return Boolean(
        search.trim() ||
        roundType ||
        result
    );
};

const getCompanyInitial = (
    company: string
) => {
    return (
        company
            .trim()
            .charAt(0)
            .toUpperCase() ||
        "I"
    );
};

const StatCard = ({
    helper,
    icon,
    label,
    tone,
    value,
}: StatCardProps) => {
    return (
        <PageSurface padding="md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                        {
                            label
                        }
                    </p>

                    <p className="mt-3 break-words text-xl font-bold leading-tight text-text-primary sm:text-2xl">
                        {
                            value
                        }
                    </p>

                    <p className="mt-1 text-xs text-text-tertiary">
                        {
                            helper
                        }
                    </p>
                </div>

                <IconTile
                    tone={
                        tone
                    }
                    size="sm"
                >
                    {
                        icon
                    }
                </IconTile>
            </div>
        </PageSurface>
    );
};

const InsightPanel = ({
    children,
    icon,
    title,
}: InsightPanelProps) => {
    return (
        <PageSurface
            as="section"
            padding="lg"
        >
            <div className="mb-4 flex items-center gap-2">
                {
                    icon
                }

                <h3 className="text-sm font-semibold text-text-primary">
                    {
                        title
                    }
                </h3>
            </div>

            {
                children
            }
        </PageSurface>
    );
};

export const InterviewsPage = () => {
    const navigate =
        useNavigate();

    const [interviews, setInterviews] =
        useState<InterviewReplay[]>(
            []
        );

    const [stats, setStats] =
        useState<InterviewStats | null>(
            null
        );

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [filters, setFilters] =
        useState<InterviewListFilters>(
            EMPTY_FILTERS
        );

    const [
        appliedFilters,
        setAppliedFilters,
    ] =
        useState<InterviewListFilters>(
            EMPTY_FILTERS
        );

    const fetchInterviews =
        useCallback(
            async (
                nextFilters:
                InterviewListFilters =
                    EMPTY_FILTERS,
                initialLoad = false
            ) => {
                if (initialLoad) {
                    setLoading(true);
                } else {
                    setRefreshing(true);
                }

                setError("");

                try {
                    const [
                        interviewsResponse,
                        statsResponse,
                    ] =
                        await Promise.all(
                            [
                                interviewService.getAll(
                                    buildInterviewFilters(
                                        nextFilters
                                    )
                                ),
                                interviewService.getStats(),
                            ]
                        );

                    setInterviews(
                        interviewsResponse
                            .data
                            .interviews
                    );
                    setStats(
                        statsResponse
                            .data
                    );
                } catch (
                    fetchError
                ) {
                    console.error(
                        "Failed to fetch interviews:",
                        fetchError
                    );
                    setError(
                        getInterviewApiError(
                            fetchError,
                            "Failed to load interview replays."
                        )
                    );
                } finally {
                    setLoading(false);
                    setRefreshing(false);
                }
            },
            []
        );

    useEffect(
        () => {
            const timeoutId =
                window.setTimeout(
                    () => {
                        void fetchInterviews(
                            EMPTY_FILTERS,
                            true
                        );
                    },
                    0
                );

            return () => {
                window.clearTimeout(
                    timeoutId
                );
            };
        },
        [
            fetchInterviews,
        ]
    );

    const topWeakTopic =
        stats
            ?.mostMissedConcepts
            ?.[0]
            ?.name ||
        stats
            ?.mostRepeatedTopics
            ?.[0]
            ?.name ||
        "No weak topic yet";

    const weaknessItems =
        stats
            ?.mostMissedConcepts
            ?.length
            ? stats.mostMissedConcepts
            : stats?.mostRepeatedTopics ??
            [];

    const hasActiveFilters =
        hasFilters(
            appliedFilters
        );

    const averageConfidenceTone =
        getInterviewScoreTone(
            stats?.averageConfidenceScore
        );

    const averageTechnicalTone =
        getInterviewScoreTone(
            stats?.averageTechnicalScore
        );

    const filteredEmptyCopy =
        hasActiveFilters
            ? {
                title:
                    "No interviews match these filters",
                description:
                    "Try clearing the filters or widening your search to bring older replays back into view.",
                actionLabel:
                    "Clear filters",
            }
            : {
                title:
                    "No interview replays yet",
                description:
                    "Log your first interview to start tracking repeated weak topics, confidence, feedback, and next actions.",
                actionLabel:
                    "Log First Interview",
            };

    const statCards =
        useMemo(
            () => [
                {
                    helper:
                        "Manual and AI-assisted replays",
                    icon: (
                        <Mic
                            size={16}
                            aria-hidden="true"
                        />
                    ),
                    label:
                        "Interviews Logged",
                    tone:
                        "brand" as const,
                    value:
                        stats
                            ?.totalInterviews ??
                        0,
                },
                {
                    helper:
                        averageConfidenceTone.label,
                    icon: (
                        <TrendingUp
                            size={16}
                            aria-hidden="true"
                        />
                    ),
                    label:
                        "Avg Confidence",
                    tone:
                        "success" as const,
                    value:
                        stats
                            ? `${stats.averageConfidenceScore}/10`
                            : "-",
                },
                {
                    helper:
                        averageTechnicalTone.label,
                    icon: (
                        <BarChart3
                            size={16}
                            aria-hidden="true"
                        />
                    ),
                    label:
                        "Avg Technical",
                    tone:
                        "warning" as const,
                    value:
                        stats
                            ? `${stats.averageTechnicalScore}/10`
                            : "-",
                },
                {
                    helper:
                        "Most repeated weak area",
                    icon: (
                        <Target
                            size={16}
                            aria-hidden="true"
                        />
                    ),
                    label:
                        "Weak Topic",
                    tone:
                        "danger" as const,
                    value:
                        topWeakTopic,
                },
            ],
            [
                averageConfidenceTone.label,
                averageTechnicalTone.label,
                stats,
                topWeakTopic,
            ]
        );

    const applyFilters = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        const nextFilters = {
            ...filters,
            search:
                filters.search.trim(),
        };

        setFilters(
            nextFilters
        );
        setAppliedFilters(
            nextFilters
        );
        await fetchInterviews(
            nextFilters
        );
    };

    const clearFilters = async () => {
        const nextFilters = {
            ...EMPTY_FILTERS,
        };

        setFilters(
            nextFilters
        );
        setAppliedFilters(
            nextFilters
        );
        await fetchInterviews(
            nextFilters
        );
    };

    const handleDelete = async (
        interview: InterviewReplay
    ) => {
        const confirmed =
            window.confirm(
                `Delete the ${interview.company} ${interview.role} replay?`
            );

        if (!confirmed) {
            return;
        }

        setRefreshing(true);
        setError("");

        try {
            await interviewService.delete(
                interview.id
            );
            await fetchInterviews(
                appliedFilters
            );
        } catch (
            deleteError
        ) {
            console.error(
                "Failed to delete interview:",
                deleteError
            );
            setError(
                getInterviewApiError(
                    deleteError,
                    "Failed to delete interview replay."
                )
            );
            setRefreshing(false);
        }
    };

    return (
        <AppLayout
            title="Interview Replay"
            description="Turn every mock or real interview into structured feedback, weak-area memory, and next actions."
            action={
                <ActionButton
                    type="button"
                    leadingIcon={
                        <Plus
                            size={16}
                            aria-hidden="true"
                        />
                    }
                    onClick={() =>
                        navigate(
                            "/interviews/new"
                        )
                    }
                >
                    Log Interview
                </ActionButton>
            }
        >
            <InterviewErrorBoundary>
                {loading ? (
                    <InterviewPageSkeleton />
                ) : (
                    <div className="mx-auto max-w-6xl space-y-5">
                        {error && (
                            <StatusNotice tone="error">
                                {
                                    error
                                }
                            </StatusNotice>
                        )}

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {statCards.map(
                                (
                                    card
                                ) => (
                                    <StatCard
                                        key={
                                            card.label
                                        }
                                        {...card}
                                    />
                                )
                            )}
                        </div>

                        <div className="grid grid-cols-12 gap-4">
                            <section className="col-span-12 space-y-4 lg:col-span-8">
                                <form
                                    onSubmit={
                                        applyFilters
                                    }
                                >
                                    <PageSurface padding="md">
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_11rem_11rem]">
                                            <TextField
                                                label="Search"
                                                value={
                                                    filters.search
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setFilters(
                                                        (
                                                            previous
                                                        ) => ({
                                                            ...previous,
                                                            search:
                                                                event.target
                                                                    .value,
                                                        })
                                                    )
                                                }
                                                placeholder="Company or role"
                                                leadingIcon={
                                                    <Search
                                                        size={16}
                                                        aria-hidden="true"
                                                    />
                                                }
                                            />

                                            <SelectField
                                                label="Round"
                                                value={
                                                    filters.roundType
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setFilters(
                                                        (
                                                            previous
                                                        ) => ({
                                                            ...previous,
                                                            roundType:
                                                                event.target
                                                                    .value as InterviewRoundType | "",
                                                        })
                                                    )
                                                }
                                                options={
                                                    roundTypeOptions
                                                }
                                            />

                                            <SelectField
                                                label="Result"
                                                value={
                                                    filters.result
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setFilters(
                                                        (
                                                            previous
                                                        ) => ({
                                                            ...previous,
                                                            result:
                                                                event.target
                                                                    .value as InterviewResult | "",
                                                        })
                                                    )
                                                }
                                                options={
                                                    resultOptions
                                                }
                                            />
                                        </div>

                                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <p
                                                className="text-xs text-text-tertiary"
                                                role="status"
                                                aria-live="polite"
                                            >
                                                {refreshing
                                                    ? "Refreshing interviews..."
                                                    : `${interviews.length} replay${interviews.length === 1
                                                        ? ""
                                                        : "s"} shown`}
                                            </p>

                                            <div className="flex gap-2">
                                                <ActionButton
                                                    type="submit"
                                                    size="sm"
                                                    loading={
                                                        refreshing
                                                    }
                                                    loadingText="Applying..."
                                                >
                                                    Apply
                                                </ActionButton>

                                                <ActionButton
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={
                                                        clearFilters
                                                    }
                                                    disabled={
                                                        refreshing ||
                                                        (!hasFilters(
                                                            filters
                                                        ) &&
                                                            !hasActiveFilters)
                                                    }
                                                >
                                                    Clear
                                                </ActionButton>
                                            </div>
                                        </div>
                                    </PageSurface>
                                </form>

                                {interviews.length ===
                                    0 ? (
                                    <EmptyState
                                        title={
                                            filteredEmptyCopy.title
                                        }
                                        description={
                                            filteredEmptyCopy.description
                                        }
                                        icon={
                                            <Mic
                                                size={24}
                                                aria-hidden="true"
                                            />
                                        }
                                        compact
                                        action={
                                            <ActionButton
                                                type="button"
                                                onClick={
                                                    hasActiveFilters
                                                        ? clearFilters
                                                        : () =>
                                                            navigate(
                                                                "/interviews/new"
                                                            )
                                                }
                                            >
                                                {
                                                    filteredEmptyCopy.actionLabel
                                                }
                                            </ActionButton>
                                        }
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        {interviews.map(
                                            (
                                                interview
                                            ) => {
                                                const scores =
                                                    getInterviewDisplayScores(
                                                        interview
                                                    );

                                                const displayTopics =
                                                    interview.topics
                                                        ?.length >
                                                        0
                                                        ? interview.topics
                                                        : interview
                                                            .aiSummary
                                                            ?.repeatedRiskTopics ??
                                                        [];

                                                return (
                                                    <PageSurface
                                                        key={
                                                            interview.id
                                                        }
                                                        as="article"
                                                        padding="lg"
                                                        className="transition hover:border-border-hover"
                                                    >
                                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                                            <IconTile
                                                                tone="brand"
                                                                size="md"
                                                            >
                                                                <span className="text-sm font-bold">
                                                                    {getCompanyInitial(
                                                                        interview.company
                                                                    )}
                                                                </span>
                                                            </IconTile>

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h3 className="truncate text-base font-semibold text-text-primary">
                                                                        {
                                                                            interview.company
                                                                        }
                                                                    </h3>

                                                                    <span className="text-sm text-text-tertiary">
                                                                        /
                                                                    </span>

                                                                    <p className="text-sm text-text-secondary">
                                                                        {
                                                                            interview.role
                                                                        }
                                                                    </p>

                                                                    <span
                                                                        className={[
                                                                            "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                                                                            getInterviewResultClasses(
                                                                                interview.result
                                                                            ),
                                                                        ].join(
                                                                            " "
                                                                        )}
                                                                    >
                                                                        {formatInterviewEnum(
                                                                            interview.result
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
                                                                    <span className="inline-flex items-center gap-1.5">
                                                                        <CalendarDays
                                                                            size={13}
                                                                            aria-hidden="true"
                                                                        />
                                                                        {formatInterviewDate(
                                                                            interview.date
                                                                        )}
                                                                    </span>

                                                                    <span>
                                                                        {formatInterviewEnum(
                                                                            interview.roundType
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                {displayTopics.length >
                                                                    0 && (
                                                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                                                        {displayTopics
                                                                            .slice(
                                                                                0,
                                                                                5
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    topic
                                                                                ) => (
                                                                                    <span
                                                                                        key={
                                                                                            topic
                                                                                        }
                                                                                        className="rounded-full border border-border bg-bg-tertiary px-2.5 py-1 text-[11px] text-text-secondary"
                                                                                    >
                                                                                        {
                                                                                            topic
                                                                                        }
                                                                                    </span>
                                                                                )
                                                                            )}
                                                                    </div>
                                                                )}

                                                                {interview.conceptsMissed
                                                                    .length >
                                                                    0 && (
                                                                    <div className="mt-4">
                                                                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-danger">
                                                                            Missed Concepts
                                                                        </p>

                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {interview.conceptsMissed.map(
                                                                                (
                                                                                    concept
                                                                                ) => (
                                                                                    <span
                                                                                        key={
                                                                                            concept
                                                                                        }
                                                                                        className="rounded-full border border-danger/10 bg-danger-muted px-2.5 py-1 text-[11px] text-danger"
                                                                                    >
                                                                                        {
                                                                                            concept
                                                                                        }
                                                                                    </span>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                                                                <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-bg-tertiary p-2 text-center">
                                                                    {[
                                                                        {
                                                                            label:
                                                                                "Conf",
                                                                            value:
                                                                                scores.confidence,
                                                                        },
                                                                        {
                                                                            label:
                                                                                "Comm",
                                                                            value:
                                                                                scores.communication,
                                                                        },
                                                                        {
                                                                            label:
                                                                                "Tech",
                                                                            value:
                                                                                scores.technical,
                                                                        },
                                                                    ].map(
                                                                        (
                                                                            score
                                                                        ) => {
                                                                            const tone =
                                                                                getInterviewScoreTone(
                                                                                    score.value
                                                                                );

                                                                            return (
                                                                                <div
                                                                                    key={
                                                                                        score.label
                                                                                    }
                                                                                    className="min-w-12"
                                                                                >
                                                                                    <p
                                                                                        className={[
                                                                                            "text-sm font-bold",
                                                                                            tone.textClass,
                                                                                        ].join(
                                                                                            " "
                                                                                        )}
                                                                                    >
                                                                                        {score.value ??
                                                                                            "-"}
                                                                                    </p>

                                                                                    <p className="mt-0.5 text-[10px] text-text-tertiary">
                                                                                        {
                                                                                            score.label
                                                                                        }
                                                                                    </p>
                                                                                </div>
                                                                            );
                                                                        }
                                                                    )}
                                                                </div>

                                                                <div className="flex gap-2">
                                                                    <ActionButton
                                                                        type="button"
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        leadingIcon={
                                                                            <Eye
                                                                                size={14}
                                                                                aria-hidden="true"
                                                                            />
                                                                        }
                                                                        onClick={() =>
                                                                            navigate(
                                                                                `/interviews/${interview.id}`
                                                                            )
                                                                        }
                                                                    >
                                                                        View
                                                                    </ActionButton>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleDelete(
                                                                                interview
                                                                            )
                                                                        }
                                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-bg-tertiary text-text-tertiary transition hover:border-danger/20 hover:bg-danger-muted hover:text-danger"
                                                                        aria-label={`Delete ${interview.company} interview replay`}
                                                                        title="Delete replay"
                                                                    >
                                                                        <Trash2
                                                                            size={15}
                                                                            aria-hidden="true"
                                                                        />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </PageSurface>
                                                );
                                            }
                                        )}
                                    </div>
                                )}
                            </section>

                            <aside className="col-span-12 space-y-4 lg:col-span-4">
                                <InsightPanel
                                    title="Weakness Memory"
                                    icon={
                                        <Target
                                            size={16}
                                            className="text-danger"
                                            aria-hidden="true"
                                        />
                                    }
                                >
                                    {weaknessItems.length ? (
                                        <div className="space-y-2">
                                            {weaknessItems.map(
                                                (
                                                    item
                                                ) => (
                                                    <div
                                                        key={
                                                            item.name
                                                        }
                                                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-tertiary px-3 py-2"
                                                    >
                                                        <span className="min-w-0 truncate text-sm text-text-secondary">
                                                            {
                                                                item.name
                                                            }
                                                        </span>

                                                        <span className="shrink-0 text-xs font-semibold text-danger">
                                                            {
                                                                item.count
                                                            }
                                                            x
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm leading-6 text-text-tertiary">
                                            Log interviews with missed concepts to see repeated weak areas.
                                        </p>
                                    )}
                                </InsightPanel>

                                <InsightPanel
                                    title="Company-wise Readiness"
                                    icon={
                                        <Building2
                                            size={16}
                                            className="text-brand"
                                            aria-hidden="true"
                                        />
                                    }
                                >
                                    {stats
                                        ?.companyBreakdown
                                        ?.length ? (
                                        <div className="space-y-2">
                                            {stats.companyBreakdown.map(
                                                (
                                                    item
                                                ) => (
                                                    <div
                                                        key={
                                                            item.company
                                                        }
                                                        className="flex items-center justify-between gap-3 text-sm"
                                                    >
                                                        <span className="min-w-0 truncate text-text-secondary">
                                                            {
                                                                item.company
                                                            }
                                                        </span>

                                                        <span className="shrink-0 text-xs text-text-tertiary">
                                                            {
                                                                item.count
                                                            }
                                                            {" "}
                                                            interview
                                                            {item.count >
                                                                1
                                                                ? "s"
                                                                : ""}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm leading-6 text-text-tertiary">
                                            Company readiness appears after you log interviews.
                                        </p>
                                    )}
                                </InsightPanel>

                                <InsightPanel
                                    title="Next Action Plan"
                                    icon={
                                        <CheckCircle2
                                            size={16}
                                            className="text-success"
                                            aria-hidden="true"
                                        />
                                    }
                                >
                                    {stats
                                        ?.nextActions
                                        ?.length ? (
                                        <ol className="space-y-2">
                                            {stats.nextActions
                                                .slice(
                                                    0,
                                                    6
                                                )
                                                .map(
                                                    (
                                                        action,
                                                        index
                                                    ) => (
                                                        <li
                                                            key={`${action}-${index}`}
                                                            className="flex gap-2 text-sm leading-6 text-text-secondary"
                                                        >
                                                            <span className="font-semibold text-brand">
                                                                {index +
                                                                    1}
                                                                .
                                                            </span>

                                                            <span>
                                                                {
                                                                    action
                                                                }
                                                            </span>
                                                        </li>
                                                    )
                                                )}
                                        </ol>
                                    ) : (
                                        <p className="text-sm leading-6 text-text-tertiary">
                                            Analyze an interview with AI to generate your next action plan.
                                        </p>
                                    )}
                                </InsightPanel>
                            </aside>
                        </div>
                    </div>
                )}
            </InterviewErrorBoundary>
        </AppLayout>
    );
};
