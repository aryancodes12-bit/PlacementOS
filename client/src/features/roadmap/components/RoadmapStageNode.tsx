import {
    BookOpen,
    CheckCircle2,
    Clock3,
    Layers3,
} from "lucide-react";

import {
    Handle,
    Position,
} from "@xyflow/react";

import type {
    NodeProps,
} from "@xyflow/react";

import type {
    RoadmapFlowNode,
    RoadmapStageKind,
} from "../roadmap.types";

const KIND_STYLES: Record<
    RoadmapStageKind,
    string
> = {
    FOUNDATION:
        "border-sky-400/25 bg-sky-500/10 text-sky-300",

    FRONTEND:
        "border-indigo-400/25 bg-indigo-500/10 text-indigo-300",

    BACKEND:
        "border-violet-400/25 bg-violet-500/10 text-violet-300",

    DATABASE:
        "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",

    SECURITY:
        "border-rose-400/25 bg-rose-500/10 text-rose-300",

    QUALITY:
        "border-amber-400/25 bg-amber-500/10 text-amber-300",

    DELIVERY:
        "border-cyan-400/25 bg-cyan-500/10 text-cyan-300",

    CAREER:
        "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-300",
};

const handleClass =
    "!h-2.5 !w-2.5 !border-2 !border-[#0b1020] !bg-indigo-400";

export const RoadmapStageNode = ({
    data,
    selected,
}: NodeProps<RoadmapFlowNode>) => {
    const {
        stage,
        isDimmed,
        isHighlighted,
    } = data;

    return (
        <article
            className={[
                "relative w-[300px] rounded-2xl border bg-[#0d1323] p-5 shadow-xl transition-all duration-300",
                selected
                    ? "border-indigo-400 shadow-indigo-950/40"
                    : "border-white/[0.08]",
                isHighlighted
                    ? "ring-2 ring-indigo-400/60"
                    : "",
                isDimmed
                    ? "opacity-25 grayscale"
                    : "opacity-100",
            ].join(" ")}
        >
            <Handle
                id="left-target"
                type="target"
                position={Position.Left}
                className={handleClass}
            />

            <Handle
                id="right-target"
                type="target"
                position={Position.Right}
                className={handleClass}
            />

            <Handle
                id="top-target"
                type="target"
                position={Position.Top}
                className={handleClass}
            />

            <Handle
                id="left-source"
                type="source"
                position={Position.Left}
                className={handleClass}
            />

            <Handle
                id="right-source"
                type="source"
                position={Position.Right}
                className={handleClass}
            />

            <Handle
                id="bottom-source"
                type="source"
                position={Position.Bottom}
                className={handleClass}
            />

            <div className="flex items-start justify-between gap-3">
                <div>
                    <span
                        className={[
                            "inline-flex rounded-lg border px-2 py-1 text-[10px] font-bold tracking-wide",
                            KIND_STYLES[
                            stage.kind
                            ],
                        ].join(" ")}
                    >
                        {stage.eyebrow}
                    </span>

                    <h3 className="mt-3 text-base font-semibold leading-6 text-white">
                        {stage.shortTitle}
                    </h3>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10">
                    <Layers3
                        size={16}
                        className="text-indigo-300"
                    />
                </div>
            </div>

            <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-400">
                {stage.summary}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2 py-1 text-[10px] text-slate-400">
                    <BookOpen size={11} />
                    {stage.topics.length} topics
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2 py-1 text-[10px] text-slate-400">
                    <Clock3 size={11} />
                    {stage.estimatedTime}
                </span>
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3 text-[10px] font-medium text-indigo-300">
                <CheckCircle2 size={12} />
                Open stage details
            </div>
        </article>
    );
};