import { CheckCircle2, Circle, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfileCompletionCardProps {
    completedItems: string[];
    missingItems: string[];
}

export const ProfileCompletionCard = ({
    completedItems,
    missingItems,
}: ProfileCompletionCardProps) => {
    const navigate = useNavigate();

    const total = completedItems.length + missingItems.length;
    const percentage = total === 0 ? 0 : Math.round((completedItems.length / total) * 100);

    return (
        <div className="bg-bg-secondary border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                        Profile Completion
                    </h3>
                    <p className="text-xs text-text-tertiary mt-1">
                        Complete your setup to improve readiness accuracy.
                    </p>
                </div>

                <div className="w-9 h-9 rounded-xl bg-brand-muted border border-brand/10 flex items-center justify-center">
                    <UserRound size={16} className="text-brand" />
                </div>
            </div>

            <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-secondary">Progress</span>
                    <span className="text-xs font-semibold text-text-primary">
                        {percentage}%
                    </span>
                </div>

                <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-brand rounded-full transition-all duration-700"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            <div className="space-y-2 mb-5">
                {completedItems.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 size={13} className="text-success" />
                        <span className="text-text-secondary">{item}</span>
                    </div>
                ))}

                {missingItems.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs">
                        <Circle size={13} className="text-text-tertiary" />
                        <span className="text-text-tertiary">{item}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={() => navigate("/profile")}
                className="w-full bg-bg-tertiary hover:bg-bg-hover border border-border hover:border-border-hover text-text-secondary hover:text-text-primary px-4 py-2 rounded-xl text-sm transition-all"
            >
                Update profile
            </button>
        </div>
    );
};