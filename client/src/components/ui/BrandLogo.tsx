
import type {
    HTMLAttributes,
} from "react";

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

const markClasses: Record<
    BrandLogoVariant,
    string
> = {
    navbar:
        "h-10 w-10 rounded-2xl p-1.5",

    sidebar:
        "h-10 w-10 rounded-2xl p-1.5",

    auth:
        "h-12 w-12 rounded-2xl p-1.5",

    loader:
        "h-16 w-16 rounded-3xl p-2",
};

const textClasses: Record<
    BrandLogoVariant,
    string
> = {
    navbar:
        "text-[15px]",

    sidebar:
        "text-[15px]",

    auth:
        "text-base",

    loader:
        "text-lg",
};

const subtitleClasses: Record<
    BrandLogoVariant,
    string
> = {
    navbar:
        "text-[8px]",

    sidebar:
        "text-[9px]",

    auth:
        "text-[9px]",

    loader:
        "text-[10px]",
};

export const BrandLogo = ({
    variant = "navbar",
    priority = false,
    className = "",
    ...rest
}: BrandLogoProps) => {
    return (
        <div
            className={[
                "inline-flex min-w-0 items-center gap-3",
                variant ===
                    "loader"
                    ? "flex-col text-center"
                    : "",
                className,
            ].join(" ")}
            {...rest}
        >
            <div
                className={[
                    "relative flex shrink-0 items-center justify-center overflow-hidden",
                    "border border-indigo-400/25 bg-white shadow-[0_8px_24px_rgba(99,102,241,0.22)]",
                    markClasses[
                variant
                ],
                ].join(" ")}
                aria-hidden="true"
            >
                <img
                    src="/placementos-logo-128.jpeg"
                    alt=""
                    width={64}
                    height={64}
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

            <div className="min-w-0">
                <p
                    className={[
                        "truncate font-black leading-none tracking-[-0.035em] text-text-primary",
                        textClasses[
                        variant
                        ],
                    ].join(" ")}
                >
                    Placement
                    <span className="text-indigo-400">
                        OS
                    </span>
                </p>

                <p
                    className={[
                        "mt-1 truncate font-black uppercase tracking-[0.16em] text-text-primary",
                        subtitleClasses[
                        variant
                        ],
                    ].join(" ")}
                >
                    Preparation workspace
                </p>
            </div>
        </div>
    );
};
