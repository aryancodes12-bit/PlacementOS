export const RoadmapSkeleton = () => {
    return (
        <div
            role="status"
            aria-label="Loading full-stack roadmap"
            className="space-y-5"
        >
            <div className="h-24 animate-pulse rounded-2xl border border-border bg-bg-secondary" />

            <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
                <div className="hidden h-[720px] animate-pulse rounded-2xl border border-border bg-bg-secondary lg:block" />

                <div className="h-[720px] animate-pulse rounded-2xl border border-border bg-bg-secondary" />
            </div>
        </div>
    );
};