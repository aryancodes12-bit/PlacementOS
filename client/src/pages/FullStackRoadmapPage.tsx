import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowLeft,
    BookOpen,
    Clock3,
    Search,
    Sparkles,
    Target,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import "@xyflow/react/dist/style.css";

import {
    AppLayout,
} from "../components/ui/AppLayout";

import {
    RoadmapCanvas,
} from "../features/roadmap/components/RoadmapCanvas";

import {
    RoadmapMobileList,
} from "../features/roadmap/components/RoadmapMobileList";

import {
    RoadmapSkeleton,
} from "../features/roadmap/components/RoadmapSkeleton";

import {
    RoadmapStageDrawer,
} from "../features/roadmap/components/RoadmapStageDrawer";

import type {
    RoadmapFlowEdge,
    RoadmapFlowNode,
    RoadmapStage,
    RoadmapStageKind,
} from "../features/roadmap/roadmap.types";

type ActiveKind =
    | RoadmapStageKind
    | "ALL";

interface RoadmapData {
    stages: RoadmapStage[];
    nodes: RoadmapFlowNode[];
    edges: RoadmapFlowEdge[];
}

const FILTERS: Array<{
    value: ActiveKind;
    label: string;
}> = [
        {
            value: "ALL",
            label: "All",
        },
        {
            value: "FOUNDATION",
            label: "Foundations",
        },
        {
            value: "FRONTEND",
            label: "Frontend",
        },
        {
            value: "BACKEND",
            label: "Backend",
        },
        {
            value: "DATABASE",
            label: "Database",
        },
        {
            value: "SECURITY",
            label: "Security",
        },
        {
            value: "QUALITY",
            label: "Testing",
        },
        {
            value: "DELIVERY",
            label: "DevOps",
        },
        {
            value: "CAREER",
            label: "Placement",
        },
    ];

export const FullStackRoadmapPage =
    () => {
        const navigate = useNavigate();

        const [
            roadmapData,
            setRoadmapData,
        ] = useState<RoadmapData | null>(
            null
        );

        const [loadError, setLoadError] =
            useState("");

        const [query, setQuery] =
            useState("");

        const [
            activeKind,
            setActiveKind,
        ] =
            useState<ActiveKind>("ALL");

        const [
            selectedStage,
            setSelectedStage,
        ] =
            useState<RoadmapStage | null>(
                null
            );

        const [
            focusStageId,
            setFocusStageId,
        ] = useState<string | null>(
            null
        );

        useEffect(() => {
            let active = true;

            const loadRoadmap =
                async () => {
                    try {
                        const module =
                            await import(
                                "../features/roadmap/data/fullStackRoadmap.data"
                            );

                        if (!active) return;

                        setRoadmapData({
                            stages:
                                module.fullStackRoadmapStages,

                            nodes:
                                module.createRoadmapNodes(),

                            edges:
                                module.createRoadmapEdges(),
                        });
                    } catch (error) {
                        console.error(
                            "Roadmap loading failed:",
                            error
                        );

                        if (active) {
                            setLoadError(
                                "The roadmap could not be loaded. Refresh the page and try again."
                            );
                        }
                    }
                };

            void loadRoadmap();

            return () => {
                active = false;
            };
        }, []);

        const topicCount = useMemo(
            () =>
                roadmapData?.stages.reduce(
                    (total, stage) =>
                        total +
                        stage.topics.length,
                    0
                ) ?? 0,
            [roadmapData]
        );

        const focusStage = (
            stage: RoadmapStage
        ) => {
            setSelectedStage(stage);
            setFocusStageId(stage.id);
        };

        return (
            <AppLayout>
                <div className="mx-auto max-w-[1500px]">
                    <header className="relative overflow-hidden rounded-2xl border border-border bg-bg-secondary p-6 sm:p-8">
                        <div className="pointer-events-none absolute right-[-80px] top-[-120px] h-72 w-72 rounded-full bg-brand/10 blur-3xl" />

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                            className="relative inline-flex items-center gap-2 text-xs font-medium text-text-tertiary transition hover:text-text-primary"
                        >
                            <ArrowLeft
                                size={14}
                            />
                            Back to Dashboard
                        </button>

                        <div className="relative mt-5 flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
                            <div className="max-w-4xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-muted px-3 py-1.5 text-[11px] font-semibold text-brand">
                                    <Sparkles
                                        size={13}
                                    />
                                    Placement-focused learning path
                                </div>

                                <h1 className="mt-4 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                                    Full-Stack Developer:
                                    Zero to Hero
                                </h1>

                                <p className="mt-4 max-w-3xl text-sm leading-7 text-text-tertiary sm:text-base">
                                    Move from web
                                    fundamentals to React,
                                    Node.js, PostgreSQL,
                                    authentication, deployment,
                                    system design, and
                                    placement-ready project
                                    presentation.
                                </p>

                                <div className="mt-5 flex flex-wrap gap-3">
                                    <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-tertiary px-3 py-2 text-xs text-text-secondary">
                                        <Target
                                            size={14}
                                            className="text-brand"
                                        />

                                        {roadmapData?.stages
                                            .length ??
                                            15}{" "}
                                        stages
                                    </span>

                                    <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-tertiary px-3 py-2 text-xs text-text-secondary">
                                        <BookOpen
                                            size={14}
                                            className="text-brand"
                                        />

                                        {topicCount ||
                                            "90+"}{" "}
                                        topics
                                    </span>

                                    <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-tertiary px-3 py-2 text-xs text-text-secondary">
                                        <Clock3
                                            size={14}
                                            className="text-brand"
                                        />

                                        Zero to placement-grade
                                    </span>
                                </div>
                            </div>

                            <div className="w-full xl:max-w-sm">
                                <label
                                    htmlFor="roadmap-search"
                                    className="mb-2 block text-xs font-medium text-text-secondary"
                                >
                                    Search roadmap
                                </label>

                                <div className="relative">
                                    <Search
                                        size={16}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
                                    />

                                    <input
                                        id="roadmap-search"
                                        type="search"
                                        value={query}
                                        onChange={(
                                            event
                                        ) =>
                                            setQuery(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="React, authentication, Docker..."
                                        className="w-full rounded-xl border border-border bg-bg-tertiary py-3 pl-11 pr-4 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
                                    />
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
                        {FILTERS.map(
                            (filter) => (
                                <button
                                    key={
                                        filter.value
                                    }
                                    type="button"
                                    onClick={() =>
                                        setActiveKind(
                                            filter.value
                                        )
                                    }
                                    className={[
                                        "shrink-0 rounded-xl border px-3.5 py-2 text-xs font-medium transition",
                                        activeKind ===
                                            filter.value
                                            ? "border-brand/30 bg-brand-muted text-brand"
                                            : "border-border bg-bg-secondary text-text-tertiary hover:border-border-hover hover:text-text-primary",
                                    ].join(
                                        " "
                                    )}
                                >
                                    {
                                        filter.label
                                    }
                                </button>
                            )
                        )}
                    </div>

                    <div className="mt-3">
                        {loadError ? (
                            <div className="rounded-2xl border border-danger/20 bg-danger-muted p-6 text-sm text-danger">
                                {loadError}
                            </div>
                        ) : !roadmapData ? (
                            <RoadmapSkeleton />
                        ) : (
                            <>
                                <div className="hidden lg:block">
                                    <RoadmapCanvas
                                        baseNodes={
                                            roadmapData.nodes
                                        }
                                        edges={
                                            roadmapData.edges
                                        }
                                        query={query}
                                        activeKind={
                                            activeKind
                                        }
                                        focusStageId={
                                            focusStageId
                                        }
                                        onStageSelect={
                                            focusStage
                                        }
                                    />
                                </div>

                                <div className="lg:hidden">
                                    <RoadmapMobileList
                                        stages={
                                            roadmapData.stages
                                        }
                                        query={query}
                                        activeKind={
                                            activeKind
                                        }
                                        onStageSelect={
                                            focusStage
                                        }
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <RoadmapStageDrawer
                    stage={selectedStage}
                    onClose={() =>
                        setSelectedStage(null)
                    }
                />
            </AppLayout>
        );
    };