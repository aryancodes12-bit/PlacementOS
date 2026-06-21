import type {
    Edge,
    Node,
} from "@xyflow/react";

export type RoadmapStageKind =
    | "FOUNDATION"
    | "FRONTEND"
    | "BACKEND"
    | "DATABASE"
    | "SECURITY"
    | "QUALITY"
    | "DELIVERY"
    | "CAREER";

export type RoadmapDifficulty =
    | "BEGINNER"
    | "INTERMEDIATE"
    | "ADVANCED";

export interface RoadmapTopic {
    id: string;
    title: string;
    description: string;
    estimatedTime: string;
    placementFocus?: boolean;
}

export interface RoadmapStage {
    id: string;
    order: number;
    slug: string;

    title: string;
    shortTitle: string;
    eyebrow: string;

    summary: string;
    whyItMatters: string;

    estimatedTime: string;
    difficulty: RoadmapDifficulty;
    kind: RoadmapStageKind;

    topics: RoadmapTopic[];
    skills: string[];

    checkpoint: string;
    project?: string;
}

export interface RoadmapNodeData {
    stage: RoadmapStage;
    isDimmed?: boolean;
    isHighlighted?: boolean;

    [key: string]: unknown;
}

export type RoadmapFlowNode = Node<
    RoadmapNodeData,
    "roadmapStage"
>;

export type RoadmapFlowEdge = Edge;