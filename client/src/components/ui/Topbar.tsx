import type { ReactNode } from "react";

interface TopbarProps {
    title: string;
    description?: string;
    action?: ReactNode;
}

export const Topbar = ({ title, description, action }: TopbarProps) => {
    return (
        <header className="flex items-start justify-between gap-6 mb-8">
            <div>
                <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                    {title}
                </h2>

                {description && (
                    <p className="text-sm text-text-secondary mt-1 leading-6">
                        {description}
                    </p>
                )}
            </div>

            {action && <div className="flex items-center gap-3">{action}</div>}
        </header>
    );
};