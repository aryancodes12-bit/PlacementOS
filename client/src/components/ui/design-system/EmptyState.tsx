import type {
    ReactNode,
} from "react";

import {
    PageSurface,
} from "./PageSurface";

import {
    IconTile,
} from "./IconTile";

import type {
    IconTileTone,
} from "./IconTile";

interface EmptyStateProps {
    title: string;
    description: string;
    icon: ReactNode;
    action?: ReactNode;
    secondaryAction?: ReactNode;
    iconTone?: IconTileTone;
    compact?: boolean;
}

export const EmptyState = ({
    title,
    description,
    icon,
    action,
    secondaryAction,
    iconTone = "brand",
    compact = false,
}: EmptyStateProps) => {
    return (
        <PageSurface
            className={[
                "flex flex-col items-center justify-center text-center",
                compact
                    ? "min-h-64"
                    : "min-h-[420px]",
            ].join(" ")}
            padding="lg"
        >
            <IconTile
                tone={iconTone}
                size="lg"
            >
                {icon}
            </IconTile>

            <h2 className="mt-5 text-xl font-bold tracking-tight text-text-primary">
                {title}
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
                {description}
            </p>

            {(action ||
                secondaryAction) && (
                    <div className="mt-6 flex w-full max-w-sm flex-col justify-center gap-3 sm:w-auto sm:max-w-none sm:flex-row">
                        {action}

                        {secondaryAction}
                    </div>
                )}
        </PageSurface>
    );
};