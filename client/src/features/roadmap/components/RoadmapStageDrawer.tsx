import {
    useEffect,
    useState,
} from "react";

import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Clock3,
    FolderKanban,
    Target,
    X,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import {
    roadmapService,
} from "../../../services/roadmap.service";

import {
    RoadmapSkillAction,
    RoadmapTopicAction,
} from "./RoadmapIntegrationActions";

import type {
    RoadmapStage,
} from "../roadmap.types";

interface RoadmapStageDrawerProps {
    stage: RoadmapStage | null;
    onClose: () => void;
}

export const RoadmapStageDrawer = ({
    stage,
    onClose,
}: RoadmapStageDrawerProps) => {
    const navigate = useNavigate();
    const visible = Boolean(stage);

    const [
        addedTopicIds,
        setAddedTopicIds,
    ] = useState<Set<string>>(
        new Set()
    );

    const [
        profileSkills,
        setProfileSkills,
    ] = useState<Set<string>>(
        new Set()
    );

    const [
        roadmapTaskCount,
        setRoadmapTaskCount,
    ] = useState(0);

    const [
        maxRoadmapTasks,
        setMaxRoadmapTasks,
    ] = useState(5);

    const [
        statusLoading,
        setStatusLoading,
    ] = useState(false);

    const [
        statusError,
        setStatusError,
    ] = useState("");

    useEffect(() => {
        if (!stage) {
            return;
        }

        let active = true;

        const fetchStatus = async () => {
            try {
                setStatusLoading(true);
                setStatusError("");
                setAddedTopicIds(
                    new Set()
                );
                setProfileSkills(
                    new Set()
                );

                const { data } =
                    await roadmapService.getStatus();

                if (!active) {
                    return;
                }

                setAddedTopicIds(
                    new Set(
                        data.data
                            .dailyPlanTopicIds
                    )
                );

                setProfileSkills(
                    new Set(
                        data.data.profileSkills.map(
                            (skill) =>
                                skill
                                    .trim()
                                    .toLowerCase()
                        )
                    )
                );

                setRoadmapTaskCount(
                    data.data
                        .roadmapTaskCount
                );

                setMaxRoadmapTasks(
                    data.data
                        .maxRoadmapTasks
                );
            } catch (error) {
                console.error(
                    "Failed to load roadmap status:",
                    error
                );

                if (active) {
                    setStatusError(
                        "Saved roadmap status could not be loaded."
                    );
                }
            } finally {
                if (active) {
                    setStatusLoading(false);
                }
            }
        };

        void fetchStatus();

        return () => {
            active = false;
        };
    }, [stage?.id]);

    useEffect(() => {
        if (!visible) {
            return;
        }

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [visible, onClose]);

    const limitReached =
        roadmapTaskCount >=
        maxRoadmapTasks;

    return (
        <>
            <button
                type="button"
                aria-label="Close roadmap details"
                onClick={onClose}
                className={[
                    "fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm transition-opacity duration-300",
                    visible
                        ? "pointer-events-auto opacity-100"
                        : "pointer-events-none opacity-0",
                ].join(" ")}
            />

            <aside
                role="dialog"
                aria-modal="true"
                aria-hidden={!visible}
                aria-label="Roadmap stage details"
                className={[
                    "fixed bottom-0 right-0 top-0 z-[80] w-full overflow-y-auto border-l border-white/[0.08] bg-[#090e1c] shadow-2xl transition-transform duration-300 sm:max-w-xl",
                    visible
                        ? "translate-x-0"
                        : "translate-x-full",
                ].join(" ")}
            >
                {stage && (
                    <div className="p-5 sm:p-7">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className="rounded-lg border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-300">
                                    {stage.eyebrow}
                                </span>

                                <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
                                    {stage.title}
                                </h2>

                                <p className="mt-3 text-sm leading-7 text-slate-400">
                                    {stage.summary}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                                aria-label="Close stage details"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                                <Clock3
                                    size={16}
                                    className="text-indigo-300"
                                />

                                <p className="mt-3 text-[11px] uppercase tracking-wide text-slate-600">
                                    Estimated time
                                </p>

                                <p className="mt-1 text-sm font-semibold text-white">
                                    {stage.estimatedTime}
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                                <BookOpen
                                    size={16}
                                    className="text-indigo-300"
                                />

                                <p className="mt-3 text-[11px] uppercase tracking-wide text-slate-600">
                                    Topics
                                </p>

                                <p className="mt-1 text-sm font-semibold text-white">
                                    {stage.topics.length}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
                            {statusLoading ? (
                                <p className="text-xs text-slate-500">
                                    Loading your saved roadmap status...
                                </p>
                            ) : statusError ? (
                                <p className="text-xs text-rose-300">
                                    {statusError}
                                </p>
                            ) : (
                                <p className="text-xs text-slate-400">
                                    {roadmapTaskCount}/
                                    {maxRoadmapTasks}{" "}
                                    roadmap topics selected for today
                                </p>
                            )}
                        </div>

                        <section className="mt-7">
                            <div className="flex items-center gap-2">
                                <Target
                                    size={17}
                                    className="text-indigo-300"
                                />

                                <h3 className="text-sm font-semibold text-white">
                                    Why this stage matters
                                </h3>
                            </div>

                            <p className="mt-3 text-sm leading-7 text-slate-400">
                                {stage.whyItMatters}
                            </p>
                        </section>

                        <section className="mt-7">
                            <h3 className="text-sm font-semibold text-white">
                                Learning path
                            </h3>

                            <div className="mt-4 space-y-3">
                                {stage.topics.map(
                                    (
                                        topic,
                                        index
                                    ) => (
                                        <article
                                            key={
                                                topic.id
                                            }
                                            className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-[11px] font-bold text-indigo-300">
                                                    {index + 1}
                                                </span>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="text-sm font-semibold text-white">
                                                            {topic.title}
                                                        </h4>

                                                        {topic.placementFocus && (
                                                            <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-300">
                                                                INTERVIEW
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="mt-2 text-xs leading-5 text-slate-500">
                                                        {topic.description}
                                                    </p>

                                                    <p className="mt-2 text-[10px] font-medium text-slate-600">
                                                        {topic.estimatedTime}
                                                    </p>

                                                    <RoadmapTopicAction
                                                        stage={stage}
                                                        topic={topic}
                                                        initialAdded={
                                                            addedTopicIds.has(
                                                                topic.id
                                                            )
                                                        }
                                                        limitReached={
                                                            limitReached
                                                        }
                                                        statusLoading={
                                                            statusLoading
                                                        }
                                                        onAdded={(
                                                            alreadyAdded
                                                        ) => {
                                                            setAddedTopicIds(
                                                                (current) => {
                                                                    const next =
                                                                        new Set(
                                                                            current
                                                                        );

                                                                    next.add(
                                                                        topic.id
                                                                    );

                                                                    return next;
                                                                }
                                                            );

                                                            if (!alreadyAdded) {
                                                                setRoadmapTaskCount(
                                                                    (current) =>
                                                                        Math.min(
                                                                            maxRoadmapTasks,
                                                                            current + 1
                                                                        )
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </article>
                                    )
                                )}
                            </div>
                        </section>

                        {stage.skills.length > 0 && (
                            <section className="mt-7">
                                <h3 className="text-sm font-semibold text-white">
                                    Profile-worthy skills
                                </h3>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {stage.skills.map(
                                        (skill) => (
                                            <RoadmapSkillAction
                                                key={skill}
                                                skill={skill}
                                                initialAdded={
                                                    profileSkills.has(
                                                        skill
                                                            .trim()
                                                            .toLowerCase()
                                                    )
                                                }
                                                statusLoading={
                                                    statusLoading
                                                }
                                                onAdded={() => {
                                                    setProfileSkills(
                                                        (current) => {
                                                            const next =
                                                                new Set(
                                                                    current
                                                                );

                                                            next.add(
                                                                skill
                                                                    .trim()
                                                                    .toLowerCase()
                                                            );

                                                            return next;
                                                        }
                                                    );
                                                }}
                                            />
                                        )
                                    )}
                                </div>
                            </section>
                        )}

                        {stage.project && (
                            <section className="mt-7 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.06] p-4">
                                <div className="flex items-center gap-2">
                                    <FolderKanban
                                        size={16}
                                        className="text-emerald-300"
                                    />

                                    <h3 className="text-sm font-semibold text-emerald-200">
                                        Project milestone
                                    </h3>
                                </div>

                                <p className="mt-2 text-sm text-slate-300">
                                    {stage.project}
                                </p>
                            </section>
                        )}

                        <section className="mt-7 rounded-xl border border-white/[0.08] bg-white/[0.035] p-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle2
                                    size={18}
                                    className="mt-0.5 shrink-0 text-emerald-400"
                                />

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Stage checkpoint
                                    </p>

                                    <p className="mt-2 text-sm leading-6 text-white">
                                        {stage.checkpoint}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <div className="mt-7 grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/daily-plan"
                                    )
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                            >
                                Open Daily Plan
                                <ArrowRight
                                    size={15}
                                />
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/profile"
                                    )
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
                            >
                                Open Profile
                            </button>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
};
