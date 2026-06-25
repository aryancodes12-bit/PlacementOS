import {
    FileSearch,
    Sparkles,
} from "lucide-react";

import {
    PageSurface,
} from "../ui/design-system/PageSurface";

import {
    Skeleton,
    SkeletonText,
} from "../ui/design-system/Skeleton";

interface ResumeAnalysisSkeletonProps {
    compact?: boolean;
    message?: string;
}

export const ResumeAnalysisSkeleton = ({
    compact = false,
    message = "Analyzing resume structure, keywords, role fit, projects, and readability.",
}: ResumeAnalysisSkeletonProps) => {
    if (compact) {
        return (
            <PageSurface
                as="div"
                variant="highlight"
                padding="md"
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-[#A5B4FC]">
                        <Sparkles
                            size={19}
                            className="animate-pulse"
                            aria-hidden="true"
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-text-primary">
                            Resume Intelligence is working
                        </p>

                        <p className="mt-1 text-xs leading-5 text-text-secondary">
                            {message}
                        </p>

                        <div className="mt-4">
                            <SkeletonText
                                lines={2}
                                lastLineWidth="76%"
                            />
                        </div>
                    </div>
                </div>
            </PageSurface>
        );
    }

    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="grid min-w-0 gap-4"
        >
            <span className="sr-only">
                {message}
            </span>

            <PageSurface padding="lg">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-[#A5B4FC]">
                        <FileSearch
                            size={20}
                            aria-hidden="true"
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <Skeleton
                            width="26%"
                            height="0.72rem"
                        />

                        <Skeleton
                            width="54%"
                            height="1.8rem"
                            className="mt-3"
                        />

                        <div className="mt-4">
                            <SkeletonText
                                lines={3}
                                lastLineWidth="68%"
                            />
                        </div>
                    </div>
                </div>
            </PageSurface>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                {Array.from({
                    length: 5,
                }).map((_, index) => (
                    <PageSurface
                        key={index}
                        as="div"
                        padding="md"
                    >
                        <Skeleton
                            width="62%"
                            height="0.68rem"
                        />

                        <Skeleton
                            width="48%"
                            height="2rem"
                            className="mt-3"
                        />

                        <Skeleton
                            height="0.55rem"
                            className="mt-4"
                        />
                    </PageSurface>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {Array.from({
                    length: 2,
                }).map((_, index) => (
                    <PageSurface
                        key={index}
                        as="div"
                        padding="lg"
                    >
                        <Skeleton
                            width="38%"
                            height="1rem"
                        />

                        <div className="mt-5">
                            <SkeletonText
                                lines={4}
                                lastLineWidth="72%"
                            />
                        </div>
                    </PageSurface>
                ))}
            </div>

            <PageSurface padding="lg">
                <Skeleton
                    width="28%"
                    height="1rem"
                />

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {Array.from({
                        length: 3,
                    }).map((_, index) => (
                        <Skeleton
                            key={index}
                            height="7rem"
                        />
                    ))}
                </div>
            </PageSurface>
        </div>
    );
};
