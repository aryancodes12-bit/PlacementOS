import type {
    RoadmapStageKind,
} from "../features/roadmap/roadmap.types";

import api from "./api";

export interface AddRoadmapTopicInput {
    stageId: string;
    stageTitle: string;
    stageKind: RoadmapStageKind;

    topicId: string;
    topicTitle: string;
}

export interface RoadmapActionResponse {
    success: boolean;
    alreadyAdded: boolean;
    message: string;

    data?: {
        plan?: unknown;
        task?: unknown;
    };
}

export interface AddSkillResponse {
    success: boolean;
    alreadyAdded: boolean;
    message: string;

    data: {
        skill: string;
        skills: string[];
    };
}

export interface RoadmapStatusResponse {
    success: boolean;

    data: {
        dailyPlanTopicIds: string[];
        profileSkills: string[];

        roadmapTaskCount: number;
        maxRoadmapTasks: number;
    };
}

export interface RemoveRoadmapTaskResponse {
    success: boolean;
    alreadyRemoved: boolean;
    message: string;

    data: {
        plan: unknown;
        removedTopicId?: string;
    };
}

export const roadmapService = {
    getStatus: () =>
        api.get<RoadmapStatusResponse>(
            "/roadmap/status"
        ),

    addTopicToDailyPlan: (
        input: AddRoadmapTopicInput
    ) =>
        api.post<RoadmapActionResponse>(
            "/roadmap/daily-plan",
            input
        ),

    addSkillToProfile: (
        skill: string
    ) =>
        api.post<AddSkillResponse>(
            "/roadmap/profile-skill",
            {
                skill,
            }
        ),

    removeTopicFromDailyPlan: (
        topicId: string
    ) =>
        api.delete<RemoveRoadmapTaskResponse>(
            `/daily-plan/roadmap/${encodeURIComponent(
                topicId
            )}`
        ),
};
