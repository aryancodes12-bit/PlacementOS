import placementOsLogo from "../../assets/logo.jpeg";

type BrandLogoVariant =
    | "navbar"
    | "sidebar"
    | "auth"
    | "hero"
    | "loader";

interface BrandLogoProps {
    variant?: BrandLogoVariant;
    className?: string;
    priority?: boolean;
}

const variantClasses: Record<
    BrandLogoVariant,
    string
> = {
    navbar:
        "h-10 w-28 rounded-lg",

    sidebar:
        "h-[76px] w-full rounded-xl",

    auth:
        "h-28 w-56 rounded-2xl",

    hero:
        "h-40 w-80 rounded-2xl",

    loader:
        "h-20 w-40 rounded-xl",
};

export const BrandLogo = ({
    variant = "navbar",
    className = "",
    priority = false,
}: BrandLogoProps) => {
    return (
        <div
            className={[
                "flex shrink-0 items-center justify-center",
                "overflow-hidden bg-white",
                "border border-slate-200/80",
                variantClasses[variant],
                className,
            ].join(" ")}
        >
            <img
                src={placementOsLogo}
                alt="PlacementOS — Know Your Placement Readiness"
                loading={
                    priority
                        ? "eager"
                        : "lazy"
                }
                fetchPriority={
                    priority
                        ? "high"
                        : "auto"
                }
                draggable={false}
                className="h-full w-full object-contain p-1"
            />
        </div>
    );
};