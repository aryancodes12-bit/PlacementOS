import api from "./api";

import type {
    RoadmapStageKind,
} from "../features/roadmap/roadmap.types";

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
}

export interface AddSkillResponse
    extends RoadmapActionResponse {
    data: {
        skill: string;
        skills: string[];
    };
}

export const roadmapService = {
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
};