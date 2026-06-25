import {
    PageSurface,
} from "../ui/design-system/PageSurface";

import {
    Skeleton,
    SkeletonText,
} from "../ui/design-system/Skeleton";

interface InterviewPageSkeletonProps {
    variant?:
    | "list"
    | "detail";
}

export const InterviewPageSkeleton = ({
    variant = "list",
}: InterviewPageSkeletonProps) => {
    if (
        variant === "detail"
    ) {
        return (
            <div
                className="grid gap-4"
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <span className="sr-only">
                    Loading interview replay
                </span>

                <PageSurface padding="lg">
                    <Skeleton
                        width="28%"
                        height="1.9rem"
                    />

                    <Skeleton
                        width="18%"
                        height="0.85rem"
                        className="mt-3"
                    />

                    <Skeleton
                        width="42%"
                        height="0.75rem"
                        className="mt-5"
                    />
                </PageSurface>

                <div className="grid gap-3 sm:grid-cols-3">
                    {Array.from({
                        length: 3,
                    }).map(
                        (_, index) => (
                            <PageSurface
                                key={
                                    index
                                }
                                padding="md"
                            >
                                <Skeleton
                                    width="60%"
                                    height="0.7rem"
                                />

                                <Skeleton
                                    width="42%"
                                    height="2rem"
                                    className="mt-3"
                                />

                                <Skeleton
                                    height="0.5rem"
                                    className="mt-4"
                                />
                            </PageSurface>
                        )
                    )}
                </div>

                {Array.from({
                    length: 3,
                }).map(
                    (_, index) => (
                        <PageSurface
                            key={
                                index
                            }
                            padding="lg"
                        >
                            <Skeleton
                                width="30%"
                                height="1rem"
                            />

                            <div className="mt-5">
                                <SkeletonText
                                    lines={4}
                                    lastLineWidth="68%"
                                />
                            </div>
                        </PageSurface>
                    )
                )}
            </div>
        );
    }

    return (
        <div
            className="grid gap-4"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <span className="sr-only">
                Loading interviews
            </span>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({
                    length: 4,
                }).map(
                    (_, index) => (
                        <PageSurface
                            key={
                                index
                            }
                            padding="md"
                        >
                            <Skeleton
                                width="65%"
                                height="0.7rem"
                            />

                            <Skeleton
                                width="40%"
                                height="2rem"
                                className="mt-3"
                            />

                            <Skeleton
                                width="72%"
                                height="0.6rem"
                                className="mt-3"
                            />
                        </PageSurface>
                    )
                )}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
                <div className="grid gap-3">
                    {Array.from({
                        length: 3,
                    }).map(
                        (_, index) => (
                            <PageSurface
                                key={
                                    index
                                }
                                padding="lg"
                            >
                                <div className="flex gap-4">
                                    <Skeleton
                                        width="2.75rem"
                                        height="2.75rem"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <Skeleton
                                            width="38%"
                                            height="1rem"
                                        />

                                        <Skeleton
                                            width="24%"
                                            height="0.7rem"
                                            className="mt-2"
                                        />

                                        <div className="mt-4">
                                            <SkeletonText
                                                lines={2}
                                                lastLineWidth="55%"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </PageSurface>
                        )
                    )}
                </div>

                <div className="grid gap-4">
                    <PageSurface padding="lg">
                        <Skeleton
                            width="52%"
                            height="1rem"
                        />

                        <div className="mt-5">
                            <SkeletonText
                                lines={4}
                                lastLineWidth="70%"
                            />
                        </div>
                    </PageSurface>

                    <PageSurface padding="lg">
                        <Skeleton
                            width="45%"
                            height="1rem"
                        />

                        <div className="mt-5">
                            <SkeletonText
                                lines={3}
                                lastLineWidth="62%"
                            />
                        </div>
                    </PageSurface>
                </div>
            </div>
        </div>
    );
};