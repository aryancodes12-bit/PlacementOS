import { BarChart3 } from "lucide-react";

import type { DSATopicProgress } from "../../services/dsa.service";

interface TopicProgressCardProps {
    topics: DSATopicProgress[];
    loading?: boolean;
}

export const TopicProgressCard = ({
    topics,
    loading = false,
}: TopicProgressCardProps) => {
    return (
        <div className="h-full rounded-2xl border border-border bg-bg-secondary p-5">
            <div className="mb-4">
                <div className="flex items-center gap-2">
                    <BarChart3 size={17} className="text-brand" />
                    <h2 className="text-sm font-semibold text-text-primary">
                        Topic Progress
                    </h2>
                </div>

                <p className="mt-1 text-xs text-text-tertiary">
                    Solved coverage across your tracked topics.
                </p>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((item) => (
                        <div
                            key={item}
                            className="h-11 animate-pulse rounded-xl bg-bg-tertiary"
                        />
                    ))}
                </div>
            ) : topics.length === 0 ? (
                <div className="flex min-h-44 items-center justify-center rounded-xl border border-border bg-bg-tertiary px-6 text-center">
                    <p className="text-sm text-text-tertiary">
                        Add problems to generate topic-level progress.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {topics.slice(0, 8).map((topic) => (
                        <div key={topic.topic}>
                            <div className="mb-1.5 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-medium text-text-primary">
                                        {topic.topic}
                                    </p>
                                    <p className="text-[11px] text-text-tertiary">
                                        {topic.solved} solved · {topic.total} tracked
                                    </p>
                                </div>

                                <span className="text-xs font-semibold text-text-secondary">
                                    {topic.percentage}%
                                </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-bg-tertiary">
                                <div
                                    className="h-full rounded-full bg-brand transition-all duration-500"
                                    style={{ width: `${topic.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};