import {
    Skeleton,
    SkeletonText,
} from "../ui/design-system/Skeleton";

interface DailyPlanSkeletonProps {
    compact?: boolean;
}

export const DailyPlanSkeleton = ({
    compact = false,
}: DailyPlanSkeletonProps) => {
    if (
        compact
    ) {
        return (
            <div
                className="space-y-3"
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <span className="sr-only">
                    Loading daily plan
                </span>

                <Skeleton
                    width="78%"
                    height="3.9rem"
                    radius="0.75rem"
                />

                {Array.from({
                    length: 3,
                }).map(
                    (_, index) => (
                        <div
                            key={index}
                            className="rounded-xl border border-border bg-bg-tertiary px-4 py-3"
                        >
                            <div className="flex items-start gap-3">
                                <Skeleton
                                    width="1.75rem"
                                    height="1.75rem"
                                    radius="0.5rem"
                                />

                                <div className="min-w-0 flex-1">
                                    <Skeleton
                                        width="45%"
                                        height="0.75rem"
                                    />

                                    <div className="mt-3">
                                        <SkeletonText
                                            lines={2}
                                            lastLineWidth="62%"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                )}
            </div>
        );
    }

    return (
        <div
            className="space-y-5"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <span className="sr-only">
                Loading daily plan
            </span>

            {Array.from({
                length: 2,
            }).map(
                (_, index) => (
                    <div
                        key={index}
                        className="rounded-2xl border border-border bg-bg-secondary p-5"
                    >
                        <div className="flex items-start gap-3">
                            <Skeleton
                                width="2.5rem"
                                height="2.5rem"
                                radius="0.75rem"
                            />

                            <div className="min-w-0 flex-1">
                                <Skeleton
                                    width="34%"
                                    height="1rem"
                                />

                                <div className="mt-4">
                                    <SkeletonText
                                        lines={2}
                                        lastLineWidth="58%"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            )}

            <div className="grid gap-5 lg:grid-cols-3">
                {Array.from({
                    length: 3,
                }).map(
                    (_, columnIndex) => (
                        <div
                            key={columnIndex}
                            className="rounded-2xl border border-border bg-bg-secondary p-5"
                        >
                            <div className="mb-5 flex items-center gap-3">
                                <Skeleton
                                    width="2.25rem"
                                    height="2.25rem"
                                    radius="0.75rem"
                                />

                                <div className="min-w-0 flex-1">
                                    <Skeleton
                                        width="55%"
                                        height="0.95rem"
                                    />

                                    <Skeleton
                                        width="28%"
                                        height="0.65rem"
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                {Array.from({
                                    length: 3,
                                }).map(
                                    (_, itemIndex) => (
                                        <div
                                            key={itemIndex}
                                            className="rounded-xl border border-border bg-bg-tertiary px-4 py-3"
                                        >
                                            <Skeleton
                                                width="70%"
                                                height="0.8rem"
                                            />

                                            <div className="mt-3">
                                                <SkeletonText
                                                    lines={2}
                                                    lastLineWidth="48%"
                                                />
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};
