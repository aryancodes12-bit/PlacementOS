import type {
    LucideIcon,
} from "lucide-react";

interface Props {
    title: string;
    value: string | number;
    subtitle: string;
    icon: LucideIcon;
    trend?: {
        value: string;
        positive: boolean;
    };
    color?:
    | "brand"
    | "success"
    | "warning"
    | "danger";
    onClick?: () => void;
}

const colorMap = {
    brand: {
        icon:
            "border-brand/15 bg-brand-muted text-brand",
        trendPositive:
            "border-success/15 bg-success-muted text-success",
        trendNegative:
            "border-danger/15 bg-danger-muted text-danger",
    },
    success: {
        icon:
            "border-success/15 bg-success-muted text-success",
        trendPositive:
            "border-success/15 bg-success-muted text-success",
        trendNegative:
            "border-danger/15 bg-danger-muted text-danger",
    },
    warning: {
        icon:
            "border-warning/15 bg-warning-muted text-warning",
        trendPositive:
            "border-success/15 bg-success-muted text-success",
        trendNegative:
            "border-danger/15 bg-danger-muted text-danger",
    },
    danger: {
        icon:
            "border-danger/15 bg-danger-muted text-danger",
        trendPositive:
            "border-success/15 bg-success-muted text-success",
        trendNegative:
            "border-danger/15 bg-danger-muted text-danger",
    },
};

export const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = "brand",
    onClick,
}: Props) => {
    const tone =
        colorMap[
        color
        ];

    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "group flex h-full min-h-44 w-full flex-col items-start rounded-2xl border border-border bg-bg-secondary p-5 text-left",
                "shadow-[0_1px_0_rgba(255,255,255,0.025)_inset,0_18px_42px_rgba(0,0,0,0.11)]",
                "transition duration-200 hover:-translate-y-0.5 hover:border-border-hover hover:bg-bg-hover/40",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70",
            ].join(" ")}
        >
            <div className="mb-5 flex w-full items-start justify-between gap-3">
                <div
                    className={[
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                        tone.icon,
                    ].join(" ")}
                >
                    <Icon
                        size={17}
                        aria-hidden="true"
                    />
                </div>

                {trend && (
                    <span
                        className={[
                            "shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold",
                            trend.positive
                                ? tone.trendPositive
                                : tone.trendNegative,
                        ].join(" ")}
                    >
                        {trend.positive
                            ? "Up"
                            : "Down"}{" "}
                        {trend.value}
                    </span>
                )}
            </div>

            <p className="break-words text-3xl font-bold leading-tight text-text-primary">
                {value}
            </p>

            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {title}
            </p>

            <p className="mt-2 line-clamp-2 text-sm leading-5 text-text-tertiary">
                {subtitle}
            </p>
        </button>
    );
};
