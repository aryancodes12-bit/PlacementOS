import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    ReactFlow,
} from "@xyflow/react";

import type {
    ReactFlowInstance,
} from "@xyflow/react";

import {
    RoadmapStageNode,
} from "./RoadmapStageNode";

import type {
    RoadmapFlowEdge,
    RoadmapFlowNode,
    RoadmapNodeData,
    RoadmapStage,
    RoadmapStageKind,
} from "../roadmap.types";

interface RoadmapCanvasProps {
    baseNodes: RoadmapFlowNode[];
    edges: RoadmapFlowEdge[];

    query: string;
    activeKind:
    | RoadmapStageKind
    | "ALL";

    focusStageId: string | null;

    onStageSelect: (
        stage: RoadmapStage
    ) => void;
}

const nodeTypes = {
    roadmapStage: RoadmapStageNode,
};

const KIND_COLOURS: Record<
    RoadmapStageKind,
    string
> = {
    FOUNDATION: "#38bdf8",
    FRONTEND: "#818cf8",
    BACKEND: "#a78bfa",
    DATABASE: "#34d399",
    SECURITY: "#fb7185",
    QUALITY: "#fbbf24",
    DELIVERY: "#22d3ee",
    CAREER: "#e879f9",
};

export const RoadmapCanvas = ({
    baseNodes,
    edges,
    query,
    activeKind,
    focusStageId,
    onStageSelect,
}: RoadmapCanvasProps) => {
    const [
        flowInstance,
        setFlowInstance,
    ] = useState<
        ReactFlowInstance<
            RoadmapFlowNode,
            RoadmapFlowEdge
        > | null
    >(null);

    const normalizedQuery =
        query.trim().toLowerCase();

    const nodes = useMemo(() => {
        return baseNodes.map((node) => {
            const stage = node.data.stage;

            const queryMatches =
                !normalizedQuery ||
                stage.title
                    .toLowerCase()
                    .includes(
                        normalizedQuery
                    ) ||
                stage.shortTitle
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

            const kindMatches =
                activeKind === "ALL" ||
                stage.kind === activeKind;

            return {
                ...node,

                data: {
                    ...node.data,

                    isDimmed:
                        !queryMatches ||
                        !kindMatches,

                    isHighlighted:
                        Boolean(
                            normalizedQuery &&
                            queryMatches
                        ),
                },
            };
        });
    }, [
        baseNodes,
        normalizedQuery,
        activeKind,
    ]);

    useEffect(() => {
        if (
            !flowInstance ||
            !focusStageId
        ) {
            return;
        }

        const node = nodes.find(
            (item) =>
                item.id === focusStageId
        );

        if (!node) return;

        void flowInstance.setCenter(
            node.position.x + 150,
            node.position.y + 90,
            {
                zoom: 1.08,
                duration: 550,
            }
        );
    }, [
        flowInstance,
        focusStageId,
        nodes,
    ]);

    return (
        <div className="placement-roadmap-flow h-[720px] overflow-hidden rounded-2xl border border-border bg-[#070b17]">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onInit={setFlowInstance}
                onNodeClick={(
                    _event,
                    node
                ) => {
                    onStageSelect(
                        node.data.stage
                    );
                }}
                fitView
                fitViewOptions={{
                    padding: 0.12,
                    minZoom: 0.42,
                    maxZoom: 0.9,
                }}
                minZoom={0.28}
                maxZoom={1.7}
                nodesDraggable={false}
                nodesConnectable={false}
                nodesFocusable
                edgesFocusable={false}
                autoPanOnNodeFocus
                preventScrolling
                ariaLabelConfig={{
                    "node.a11yDescription.default":
                        "Press Enter or Space to select this roadmap stage.",
                }}
            >
                <Background
                    variant={
                        BackgroundVariant.Dots
                    }
                    gap={22}
                    size={1.2}
                    color="#242b42"
                />

                <Controls
                    position="bottom-left"
                    showInteractive={false}
                />

                <MiniMap
                    position="bottom-right"
                    pannable
                    zoomable
                    maskColor="rgba(3, 6, 15, 0.72)"
                    nodeColor={(node) => {
                        const data =
                            node.data as RoadmapNodeData;

                        return KIND_COLOURS[
                            data.stage.kind
                        ];
                    }}
                />
            </ReactFlow>
        </div>
    );
};