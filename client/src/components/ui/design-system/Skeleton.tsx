import type {
    CSSProperties,
    HTMLAttributes,
} from "react";

import styled, {
    keyframes,
} from "styled-components";

const shimmer =
    keyframes`
        0% {
            background-position:
                200% 0;
        }

        100% {
            background-position:
                -200% 0;
        }
    `;

interface SkeletonProps
    extends HTMLAttributes<HTMLDivElement> {
    width?: string;
    height?: string;
    radius?: string;
}

interface SkeletonTextProps {
    lines?: number;
    gap?: string;
    lastLineWidth?: string;
}

const SkeletonElement =
    styled.div<{
        $width: string;
        $height: string;
        $radius: string;
    }>`
        width:
            ${({ $width }) =>
            $width};

        height:
            ${({ $height }) =>
            $height};

        border-radius:
            ${({ $radius }) =>
            $radius};

        background:
            linear-gradient(
                90deg,
                rgba(
                    255,
                    255,
                    255,
                    0.035
                )
                20%,
                rgba(
                    99,
                    102,
                    241,
                    0.13
                )
                50%,
                rgba(
                    255,
                    255,
                    255,
                    0.035
                )
                80%
            );

        background-size:
            200% 100%;

        animation:
            ${shimmer}
            1.35s linear
            infinite;

        @media (
            prefers-reduced-motion:
                reduce
        ) {
            animation: none;

            background:
                rgba(
                    255,
                    255,
                    255,
                    0.055
                );
        }
    `;

export const Skeleton = ({
    width = "100%",
    height = "1rem",
    radius = "0.75rem",
    ...rest
}: SkeletonProps) => {
    return (
        <SkeletonElement
            aria-hidden="true"
            $width={width}
            $height={height}
            $radius={radius}
            {...rest}
        />
    );
};

export const SkeletonText = ({
    lines = 3,
    gap = "0.6rem",
    lastLineWidth = "72%",
}: SkeletonTextProps) => {
    const safeLines =
        Math.max(
            1,
            lines
        );

    const style: CSSProperties =
    {
        display: "grid",
        gap,
    };

    return (
        <div
            aria-hidden="true"
            style={style}
        >
            {Array.from({
                length:
                    safeLines,
            }).map(
                (
                    _,
                    index
                ) => (
                    <Skeleton
                        key={index}
                        height="0.7rem"
                        width={
                            index ===
                                safeLines -
                                1
                                ? lastLineWidth
                                : "100%"
                        }
                    />
                )
            )}
        </div>
    );
};

export const SkeletonCard = ({
    rows = 3,
}: {
    rows?: number;
}) => {
    return (
        <div
            role="status"
            aria-label="Loading content"
            className="rounded-2xl border border-border bg-bg-secondary p-4 sm:p-5"
        >
            <Skeleton
                width="42%"
                height="1rem"
            />

            <div className="mt-5">
                <SkeletonText
                    lines={rows}
                />
            </div>
        </div>
    );
};