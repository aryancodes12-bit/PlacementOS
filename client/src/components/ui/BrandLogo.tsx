
import type {
    HTMLAttributes,
} from "react";

import logo from "../../assets/logo.jpeg";

export type BrandLogoVariant =
    | "navbar"
    | "sidebar"
    | "auth"
    | "loader";

interface BrandLogoProps
    extends HTMLAttributes<HTMLDivElement> {
    variant?: BrandLogoVariant;
    priority?: boolean;
}

const imageVariantClasses: Record<
    Exclude<
        BrandLogoVariant,
        "sidebar"
    >,
    string
> = {
    navbar:
        "h-10 w-[132px] rounded-xl p-1.5",

    auth:
        "h-16 w-40 rounded-2xl p-2",

    loader:
        "h-20 w-44 rounded-2xl p-2.5",
};

export const BrandLogo = ({
    variant = "navbar",
    priority = false,
    className = "",
    ...rest
}: BrandLogoProps) => {
    if (
        variant === "sidebar"
    ) {
        return (
            <div
                className={[
                    "inline-flex min-w-0 items-center gap-3",
                    className,
                ].join(" ")}
                {...rest}
            >
                <div
                    className={[
                        "relative flex h-10 w-10 shrink-0",
                        "items-center justify-center overflow-hidden",
                        "rounded-xl border border-indigo-400/25",
                        "bg-gradient-to-br from-indigo-500 to-violet-600",
                        "shadow-[0_8px_24px_rgba(99,102,241,0.24)]",
                    ].join(" ")}
                    aria-hidden="true"
                >
                    <span className="text-[13px] font-black tracking-[-0.04em] text-white">
                        OS
                    </span>

                    <span className="pointer-events-none absolute inset-x-1 bottom-1 h-px bg-white/25" />
                </div>

                <div className="min-w-0">
                    <p className="truncate text-[15px] font-black tracking-[-0.035em] text-text-primary">
                        Placement
                        <span className="text-indigo-400">
                            OS
                        </span>
                    </p>

                    <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[0.15em] text-text-tertiary">
                        Preparation workspace
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={[
                "inline-flex items-center justify-center",
                "overflow-hidden border border-black/10",
                "bg-white shadow-sm",
                imageVariantClasses[
                variant
                ],
                className,
            ].join(" ")}
            {...rest}
        >
            <img
                src={logo}
                alt="PlacementOS"
                loading={
                    priority
                        ? "eager"
                        : "lazy"
                }
                decoding="async"
                fetchPriority={
                    priority
                        ? "high"
                        : "auto"
                }
                draggable={false}
                className="block h-full w-full object-contain"
            />
        </div>
    );
};
