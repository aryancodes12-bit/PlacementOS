import {
    ArrowRight,
    CheckCircle2,
    Circle,
    Code2,
    FileText,
    Mic,
    Sparkles,
    UserRound,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

interface StarterPlanCardProps {
    hasProfileDetails: boolean;
    hasDsaActivity: boolean;
    hasResumeActivity: boolean;
    hasInterviewActivity: boolean;
}

export const StarterPlanCard = ({
    hasProfileDetails,
    hasDsaActivity,
    hasResumeActivity,
    hasInterviewActivity,
}: StarterPlanCardProps) => {
    const navigate = useNavigate();

    const steps = [
        {
            title: "Complete your placement profile",
            description:
                "Add your skills, college, graduation year, and target companies.",
            duration: "10 min",
            route: "/profile",
            icon: UserRound,
            completed: hasProfileDetails,
        },
        {
            title: "Add your first DSA problem",
            description:
                "Import from LeetCode or manually track one problem to begin pattern analysis.",
            duration: "15 min",
            route: "/dsa",
            icon: Code2,
            completed: hasDsaActivity,
        },
        {
            title: "Upload your current resume",
            description:
                "Create your first ATS, keyword, project, and role-fit baseline.",
            duration: "15 min",
            route: "/resume",
            icon: FileText,
            completed: hasResumeActivity,
        },
        {
            title: "Log a mock or past interview",
            description:
                "Give PlacementOS evidence for communication, confidence, and technical analysis.",
            duration: "20 min",
            route: "/interviews/new",
            icon: Mic,
            completed: hasInterviewActivity,
        },
    ];

    const completedCount = steps.filter(
        (step) => step.completed
    ).length;

    const progress =
        (completedCount / steps.length) * 100;

    const nextStep =
        steps.find((step) => !step.completed) ??
        steps[0];

    return (
        <section className="h-full rounded-2xl border border-border bg-bg-secondary p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/15 bg-brand-muted">
                        <Sparkles
                            size={18}
                            className="text-brand"
                        />
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-text-primary">
                                Getting Started Plan
                            </h3>

                            <span className="rounded-full border border-brand/15 bg-brand-muted px-2 py-0.5 text-[10px] font-semibold text-brand">
                                STARTER
                            </span>
                        </div>

                        <p className="mt-1 text-xs leading-5 text-text-tertiary">
                            Build your preparation baseline before
                            personalised AI recommendations begin.
                        </p>
                    </div>
                </div>

                <span className="shrink-0 text-xs font-medium text-text-tertiary">
                    {completedCount}/{steps.length}
                </span>
            </div>

            <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-[11px] text-text-tertiary">
                    <span>Setup progress</span>
                    <span>
                        {Math.round(progress)}%
                    </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
                    <div
                        className="h-full rounded-full bg-brand transition-all duration-500"
                        style={{
                            width: `${progress}%`,
                        }}
                    />
                </div>
            </div>

            <div className="mt-5 space-y-2.5">
                {steps.map((step) => {
                    const Icon = step.icon;

                    return (
                        <button
                            key={step.title}
                            type="button"
                            onClick={() =>
                                navigate(step.route)
                            }
                            className="group flex w-full items-start gap-3 rounded-xl border border-border bg-bg-tertiary px-4 py-3 text-left transition hover:border-border-hover hover:bg-bg-hover"
                        >
                            <div
                                className={[
                                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                                    step.completed
                                        ? "border-success/15 bg-success-muted text-success"
                                        : "border-brand/15 bg-brand-muted text-brand",
                                ].join(" ")}
                            >
                                <Icon size={15} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    {step.completed ? (
                                        <CheckCircle2
                                            size={14}
                                            className="shrink-0 text-success"
                                        />
                                    ) : (
                                        <Circle
                                            size={14}
                                            className="shrink-0 text-text-tertiary"
                                        />
                                    )}

                                    <p
                                        className={[
                                            "text-sm font-medium",
                                            step.completed
                                                ? "text-text-secondary line-through"
                                                : "text-text-primary",
                                        ].join(" ")}
                                    >
                                        {step.title}
                                    </p>
                                </div>

                                <p className="mt-1 text-xs leading-5 text-text-tertiary">
                                    {step.description}
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <span className="hidden text-[11px] text-text-tertiary sm:block">
                                    {step.duration}
                                </span>

                                <ArrowRight
                                    size={14}
                                    className="text-text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
                                />
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-brand/10 bg-brand-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-semibold text-text-primary">
                        Your next step
                    </p>

                    <p className="mt-1 text-xs text-text-tertiary">
                        {nextStep.title}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        navigate(nextStep.route)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-hover"
                >
                    Start now
                    <ArrowRight size={13} />
                </button>
            </div>
        </section>
    );
};