import { Clock3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const RecentActivity = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-bg-secondary border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-brand-muted flex items-center justify-center">
                    <Clock3 size={14} className="text-brand" />
                </div>

                <h3 className="text-sm font-semibold text-text-primary">
                    Recent Activity
                </h3>
            </div>

            <div className="bg-bg-tertiary border border-border rounded-xl p-5">
                <p className="text-sm font-semibold text-text-primary">
                    No activity yet
                </p>

                <p className="text-xs text-text-tertiary mt-1 leading-5">
                    Start by completing your profile, uploading your resume, or logging your
                    first interview replay.
                </p>

                <button
                    onClick={() => navigate("/profile")}
                    className="mt-4 bg-brand hover:bg-brand-hover text-white font-medium px-4 py-2 rounded-xl transition-all duration-200 text-sm"
                >
                    Complete profile
                </button>
            </div>
        </div>
    );
};