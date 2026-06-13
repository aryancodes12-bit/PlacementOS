import { ArrowRight } from "lucide-react";
import { AppLayout } from "./AppLayout";

interface ComingSoonPageProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const ComingSoonPage = ({
    title,
    description,
    actionLabel,
    onAction,
}: ComingSoonPageProps) => {
    return (
        <AppLayout>
            <div className="max-w-3xl">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
                    <p className="text-sm text-text-secondary mt-1">{description}</p>
                </div>

                <div className="bg-bg-secondary border border-border rounded-2xl p-8 shadow-card">
                    <p className="text-sm font-semibold text-text-primary">
                        This module is coming next.
                    </p>

                    <p className="text-sm text-text-tertiary mt-2 leading-6">
                        This page is intentionally kept as a placeholder until the backend API,
                        database model, and frontend workflow are connected.
                    </p>

                    {actionLabel && onAction && (
                        <button
                            onClick={onAction}
                            className="mt-6 bg-brand hover:bg-brand-hover text-white font-medium px-4 py-2 rounded-xl transition-all duration-200 text-sm flex items-center gap-2"
                        >
                            {actionLabel}
                            <ArrowRight size={14} />
                        </button>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};