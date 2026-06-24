import type {
    ReactNode,
} from "react";

import {
    NotificationBell,
} from "../../features/notifications/NotificationBell";

interface TopbarProps {
    title: string;
    description?: string;
    action?: ReactNode;
}

export const Topbar = ({
    title,
    description,
    action,
}: TopbarProps) => {
    return (
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <h2 className="text-2xl font-bold tracking-tight text-text-primary">
                    {title}
                </h2>

                {description && (
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-text-secondary">
                        {description}
                    </p>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-3 self-end sm:self-start">
                <NotificationBell />

                {action}
            </div>
        </header>
    );
};