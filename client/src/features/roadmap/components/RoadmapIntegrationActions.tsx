import {
    useEffect,
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

    initialAdded?: boolean;
    limitReached?: boolean;
    statusLoading?: boolean;

    onAdded?: (
        alreadyAdded: boolean
    ) => void;
}

interface RoadmapSkillActionProps {
    skill: string;
    initialAdded?: boolean;
    statusLoading?: boolean;

    onAdded?: (
        alreadyAdded: boolean
    ) => void;
}

type ActionState =
    | "IDLE"
    | "LOADING"
    | "SUCCESS"
    | "EXISTS"
    | "ERROR";

const getErrorMessage = (
    error: unknown,
    fallback: string
) => {
    if (
        typeof error === "object" &&
        error !== null
    ) {
        const candidate = error as {
            response?: {
                data?: {
                    message?: unknown;
                };
            };
            message?: unknown;
        };

        const responseMessage =
            candidate.response?.data
                ?.message;

        if (
            typeof responseMessage ===
            "string"
        ) {
            return responseMessage;
        }

        if (
            typeof candidate.message ===
            "string"
        ) {
            return candidate.message;
        }
    }

    return fallback;
};

export const RoadmapTopicAction = ({
    stage,
    topic,
    initialAdded = false,
    limitReached = false,
    statusLoading = false,
    onAdded,
}: RoadmapTopicActionProps) => {
    const [status, setStatus] =
        useState<ActionState>(
            initialAdded
                ? "EXISTS"
                : "IDLE"
        );

    const [message, setMessage] =
        useState("");

    useEffect(() => {
        setStatus((current) => {
            if (initialAdded) {
                return current ===
                    "SUCCESS"
                    ? current
                    : "EXISTS";
            }

            return current === "EXISTS"
                ? "IDLE"
                : current;
        });
    }, [initialAdded]);

    const completed =
        status === "SUCCESS" ||
        status === "EXISTS";

    const blockedByLimit =
        limitReached && !completed;

    const handleAdd = async () => {
        if (
            status === "LOADING" ||
            completed ||
            blockedByLimit ||
            statusLoading
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
            onAdded?.(
                data.alreadyAdded
            );
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

    const buttonLabel =
        statusLoading
            ? "Checking..."
            : status === "LOADING"
                ? "Adding..."
                : status === "EXISTS"
                    ? "Already in plan"
                    : status === "SUCCESS"
                        ? "Added to plan"
                        : blockedByLimit
                            ? "Daily plan full"
                            : "Add to Daily Plan";

    return (
        <div className="mt-3">
            <button
                type="button"
                onClick={handleAdd}
                disabled={
                    status === "LOADING" ||
                    completed ||
                    blockedByLimit ||
                    statusLoading
                }
                title={
                    blockedByLimit
                        ? "Remove a roadmap task from today’s plan before adding another."
                        : undefined
                }
                className={[
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-semibold transition",
                    completed
                        ? "cursor-default border-success/20 bg-success-muted text-success"
                        : blockedByLimit
                            ? "cursor-not-allowed border-border bg-bg-tertiary text-text-tertiary"
                            : "border-brand/20 bg-brand-muted text-brand hover:border-brand/40",
                    status === "LOADING" ||
                        statusLoading
                        ? "cursor-wait opacity-70"
                        : "",
                ].join(" ")}
            >
                {status === "LOADING" ||
                    statusLoading ? (
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

                {buttonLabel}
            </button>

            {(message ||
                blockedByLimit) && (
                    <p
                        aria-live="polite"
                        className={[
                            "mt-2 text-[10px] leading-4",
                            status === "ERROR"
                                ? "text-danger"
                                : "text-text-tertiary",
                        ].join(" ")}
                    >
                        {message ||
                            "Today’s roadmap task limit has been reached."}
                    </p>
                )}
        </div>
    );
};

export const RoadmapSkillAction = ({
    skill,
    initialAdded = false,
    statusLoading = false,
    onAdded,
}: RoadmapSkillActionProps) => {
    const [status, setStatus] =
        useState<ActionState>(
            initialAdded
                ? "EXISTS"
                : "IDLE"
        );

    const [message, setMessage] =
        useState("");

    useEffect(() => {
        setStatus((current) => {
            if (initialAdded) {
                return current ===
                    "SUCCESS"
                    ? current
                    : "EXISTS";
            }

            return current === "EXISTS"
                ? "IDLE"
                : current;
        });
    }, [initialAdded]);

    const completed =
        status === "SUCCESS" ||
        status === "EXISTS";

    const handleAdd = async () => {
        if (
            status === "LOADING" ||
            completed ||
            statusLoading
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
            onAdded?.(
                data.alreadyAdded
            );
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

    return (
        <div>
            <button
                type="button"
                onClick={handleAdd}
                disabled={
                    status === "LOADING" ||
                    completed ||
                    statusLoading
                }
                title={message || undefined}
                className={[
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                    completed
                        ? "cursor-default border-success/20 bg-success-muted text-success"
                        : "border-indigo-400/15 bg-indigo-500/10 text-indigo-300 hover:border-indigo-400/35",
                    statusLoading
                        ? "cursor-wait opacity-70"
                        : "",
                ].join(" ")}
            >
                {status === "LOADING" ||
                    statusLoading ? (
                    <Loader2
                        size={12}
                        className="animate-spin"
                    />
                ) : completed ? (
                    <Check size={12} />
                ) : (
                    <Plus size={12} />
                )}

                {completed
                    ? `${skill} · In profile`
                    : skill}
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
