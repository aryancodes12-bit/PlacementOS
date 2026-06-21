import {
    useState,
} from "react";

import {
    CalendarPlus,
    Check,
    Loader2,
    Plus,
} from "lucide-react";

import {
    roadmapService,
} from "../../../services/roadmap.service";

import type {
    RoadmapStage,
    RoadmapTopic,
} from "../roadmap.types";

interface RoadmapTopicActionProps {
    stage: RoadmapStage;
    topic: RoadmapTopic;
}

interface RoadmapSkillActionProps {
    skill: string;
}

type ActionState =
    | "IDLE"
    | "LOADING"
    | "SUCCESS"
    | "EXISTS"
    | "ERROR";

const getErrorMessage = (
    error: any,
    fallback: string
) => {
    return (
        error?.response?.data?.message ||
        error?.message ||
        fallback
    );
};

export const RoadmapTopicAction = ({
    stage,
    topic,
}: RoadmapTopicActionProps) => {
    const [status, setStatus] =
        useState<ActionState>("IDLE");

    const [message, setMessage] =
        useState("");

    const handleAdd = async () => {
        if (
            status === "LOADING" ||
            status === "SUCCESS" ||
            status === "EXISTS"
        ) {
            return;
        }

        setStatus("LOADING");
        setMessage("");

        try {
            const { data } =
                await roadmapService.addTopicToDailyPlan(
                    {
                        stageId: stage.id,
                        stageTitle:
                            stage.title,
                        stageKind:
                            stage.kind,

                        topicId: topic.id,
                        topicTitle:
                            topic.title,
                    }
                );

            setStatus(
                data.alreadyAdded
                    ? "EXISTS"
                    : "SUCCESS"
            );

            setMessage(data.message);
        } catch (error) {
            setStatus("ERROR");

            setMessage(
                getErrorMessage(
                    error,
                    "Could not add this topic."
                )
            );
        }
    };

    const completed =
        status === "SUCCESS" ||
        status === "EXISTS";

    return (
        <div className="mt-3">
            <button
                type="button"
                onClick={handleAdd}
                disabled={
                    status === "LOADING" ||
                    completed
                }
                className={[
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-semibold transition",
                    completed
                        ? "cursor-default border-success/20 bg-success-muted text-success"
                        : "border-brand/20 bg-brand-muted text-brand hover:border-brand/40",
                    status === "LOADING"
                        ? "cursor-wait opacity-70"
                        : "",
                ].join(" ")}
            >
                {status === "LOADING" ? (
                    <Loader2
                        size={13}
                        className="animate-spin"
                    />
                ) : completed ? (
                    <Check size={13} />
                ) : (
                    <CalendarPlus
                        size={13}
                    />
                )}

                {status === "LOADING"
                    ? "Adding..."
                    : status === "EXISTS"
                        ? "Already in plan"
                        : status ===
                            "SUCCESS"
                            ? "Added to plan"
                            : "Add to Daily Plan"}
            </button>

            {message && (
                <p
                    aria-live="polite"
                    className={[
                        "mt-2 text-[10px] leading-4",
                        status === "ERROR"
                            ? "text-danger"
                            : "text-text-tertiary",
                    ].join(" ")}
                >
                    {message}
                </p>
            )}
        </div>
    );
};

export const RoadmapSkillAction = ({
    skill,
}: RoadmapSkillActionProps) => {
    const [status, setStatus] =
        useState<ActionState>("IDLE");

    const [message, setMessage] =
        useState("");

    const handleAdd = async () => {
        if (
            status === "LOADING" ||
            status === "SUCCESS" ||
            status === "EXISTS"
        ) {
            return;
        }

        setStatus("LOADING");
        setMessage("");

        try {
            const { data } =
                await roadmapService.addSkillToProfile(
                    skill
                );

            setStatus(
                data.alreadyAdded
                    ? "EXISTS"
                    : "SUCCESS"
            );

            setMessage(data.message);
        } catch (error) {
            setStatus("ERROR");

            setMessage(
                getErrorMessage(
                    error,
                    "Could not add this skill."
                )
            );
        }
    };

    const completed =
        status === "SUCCESS" ||
        status === "EXISTS";

    return (
        <div>
            <button
                type="button"
                onClick={handleAdd}
                disabled={
                    status === "LOADING" ||
                    completed
                }
                title={message || undefined}
                className={[
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                    completed
                        ? "cursor-default border-success/20 bg-success-muted text-success"
                        : "border-indigo-400/15 bg-indigo-500/10 text-indigo-300 hover:border-indigo-400/35",
                ].join(" ")}
            >
                {status === "LOADING" ? (
                    <Loader2
                        size={12}
                        className="animate-spin"
                    />
                ) : completed ? (
                    <Check size={12} />
                ) : (
                    <Plus size={12} />
                )}

                {skill}
            </button>

            {status === "ERROR" && (
                <p
                    aria-live="polite"
                    className="mt-1 max-w-40 text-[9px] leading-4 text-danger"
                >
                    {message}
                </p>
            )}
        </div>
    );
};