import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { NotificationBell } from "../../features/notifications/NotificationBell";

interface TopbarProps {
    title: string;
    description?: string;
    action?: ReactNode;
    onOpenNavigation?: () => void;
}

export const Topbar = ({
    title,
    description,
    action,
    onOpenNavigation,
}: TopbarProps) => {
    return (
        <header className="app-shell-topbar mb-5 border-b border-border/80 bg-bg-primary/92 px-4 py-3 backdrop-blur-xl sm:mb-7 sm:px-6 lg:static lg:mx-0 lg:mb-8 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
            <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 lg:flex lg:justify-between">
                <div className="contents lg:flex lg:min-w-0 lg:items-start lg:gap-3">
                    <button
                        type="button"
                        onClick={onOpenNavigation}
                        aria-label="Open navigation menu"
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-secondary text-text-secondary outline-none transition duration-200 hover:border-border-hover hover:text-text-primary active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/70 lg:hidden"
                    >
                        <Menu size={20} aria-hidden="true" />
                    </button>
                    <div className="min-w-0 pt-0.5 lg:pt-0">
                        <h1 className="truncate text-lg font-bold tracking-tight text-text-primary sm:text-2xl">{title}</h1>
                        {description && (
                            <p className="mt-1 max-w-3xl text-xs leading-5 text-text-secondary sm:text-sm sm:leading-6">{description}</p>
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3 lg:self-start">
                    <NotificationBell />
                    <div className="hidden lg:block">
                        {action}
                    </div>
                </div>

                {action && (
                    <div className="topbar-mobile-action col-span-3 flex justify-end lg:hidden">
                        {action}
                    </div>
                )}
            </div>
        </header>
    );
};
