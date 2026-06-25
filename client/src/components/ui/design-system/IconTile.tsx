import type {
    HTMLAttributes,
    ReactNode,
} from "react";

import styled, {
    css,
} from "styled-components";

export type IconTileTone =
    | "brand"
    | "success"
    | "warning"
    | "danger"
    | "neutral";

export type IconTileSize =
    | "sm"
    | "md"
    | "lg";

interface IconTileProps
    extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    tone?: IconTileTone;
    size?: IconTileSize;
}

const toneStyles = {
    brand: css`
        border-color:
            rgba(
                99,
                102,
                241,
                0.22
            );

        background:
            rgba(
                99,
                102,
                241,
                0.12
            );

        color: #a5b4fc;
    `,

    success: css`
        border-color:
            rgba(
                34,
                197,
                94,
                0.22
            );

        background:
            rgba(
                34,
                197,
                94,
                0.1
            );

        color:
            var(
                --color-success
            );
    `,

    warning: css`
        border-color:
            rgba(
                245,
                158,
                11,
                0.23
            );

        background:
            rgba(
                245,
                158,
                11,
                0.1
            );

        color:
            var(
                --color-warning
            );
    `,

    danger: css`
        border-color:
            rgba(
                239,
                68,
                68,
                0.23
            );

        background:
            rgba(
                239,
                68,
                68,
                0.1
            );

        color:
            var(
                --color-danger
            );
    `,

    neutral: css`
        border-color:
            var(
                --color-border
            );

        background:
            var(
                --color-bg-tertiary
            );

        color:
            var(
                --color-text-secondary
            );
    `,
};

const sizeStyles = {
    sm: css`
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 0.7rem;
    `,

    md: css`
        width: 2.75rem;
        height: 2.75rem;
        border-radius: 0.85rem;
    `,

    lg: css`
        width: 3.25rem;
        height: 3.25rem;
        border-radius: 1rem;
    `,
};

const Tile =
    styled.div<{
        $tone:
        IconTileTone;
        $size:
        IconTileSize;
    }>`
        display: inline-flex;
        flex: 0 0 auto;

        align-items: center;
        justify-content: center;

        border-width: 1px;
        border-style: solid;

        ${({ $tone }) =>
            toneStyles[
            $tone
            ]}

        ${({ $size }) =>
            sizeStyles[
            $size
            ]}
    `;

export const IconTile = ({
    children,
    tone = "brand",
    size = "md",
    ...rest
}: IconTileProps) => {
    return (
        <Tile
            $tone={tone}
            $size={size}
            {...rest}
        >
            {children}
        </Tile>
    );
};