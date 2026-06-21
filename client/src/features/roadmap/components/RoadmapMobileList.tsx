import {
    ArrowRight,
    BookOpen,
    Clock3,
} from "lucide-react";

import type {
    RoadmapStage,
    RoadmapStageKind,
} from "../roadmap.types";

interface RoadmapMobileListProps {
    stages: RoadmapStage[];
    query: string;

    activeKind:
    | RoadmapStageKind
    | "ALL";

    onStageSelect: (
        stage: RoadmapStage
    ) => void;
}

export const RoadmapMobileList = ({
    stages,
    query,
    activeKind,
    onStageSelect,
}: RoadmapMobileListProps) => {
    const normalizedQuery =
        query.trim().toLowerCase();

    const filteredStages =
        stages.filter((stage) => {
            const kindMatches =
                activeKind === "ALL" ||
                stage.kind === activeKind;

            const searchMatches =
                !normalizedQuery ||
                stage.title
                    .toLowerCase()
                    .includes(
                        normalizedQuery
                    ) ||
                stage.topics.some(
                    (topic) =>
                        topic.title
                            .toLowerCase()
                            .includes(
                                normalizedQuery
                            )
                ) ||
                stage.skills.some(
                    (skill) =>
                        skill
                            .toLowerCase()
                            .includes(
                                normalizedQuery
                            )
                );

            return (
                kindMatches &&
                searchMatches
            );
        });

    if (filteredStages.length === 0) {
        return (
            <div className="rounded-2xl border border-border bg-bg-secondary px-5 py-12 text-center">
                <p className="text-sm font-semibold text-text-primary">
                    No roadmap stage found
                </p>

                <p className="mt-2 text-xs text-text-tertiary">
                    Try another topic, skill, or
                    category.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {filteredStages.map((stage) => (
                <button
                    key={stage.id}
                    type="button"
                    onClick={() =>
                        onStageSelect(stage)
                    }
                    className="group w-full rounded-2xl border border-border bg-bg-secondary p-5 text-left transition hover:border-brand/30 hover:bg-bg-hover"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
                                {stage.eyebrow}
                            </span>

                            <h3 className="mt-2 text-base font-semibold text-text-primary">
                                {stage.title}
                            </h3>

                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-text-tertiary">
                                {stage.summary}
                            </p>
                        </div>

                        <ArrowRight
                            size={16}
                            className="mt-1 shrink-0 text-text-tertiary transition-transform group-hover:translate-x-1 group-hover:text-brand"
                        />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-bg-tertiary px-2 py-1 text-[10px] text-text-tertiary">
                            <BookOpen size={11} />
                            {stage.topics.length} topics
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-bg-tertiary px-2 py-1 text-[10px] text-text-tertiary">
                            <Clock3 size={11} />
                            {stage.estimatedTime}
                        </span>
                    </div>
                </button>
            ))}
        </div>
    );
};