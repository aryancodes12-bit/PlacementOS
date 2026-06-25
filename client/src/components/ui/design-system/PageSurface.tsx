import type {
    ElementType,
    HTMLAttributes,
    ReactNode,
} from "react";

import styled, {
    css,
} from "styled-components";

export type PageSurfaceVariant =
    | "default"
    | "subtle"
    | "highlight"
    | "interactive"
    | "danger";

export type PageSurfacePadding =
    | "none"
    | "sm"
    | "md"
    | "lg";

interface PageSurfaceProps
    extends HTMLAttributes<HTMLElement> {
    children: ReactNode;
    as?: ElementType;
    variant?: PageSurfaceVariant;
    padding?: PageSurfacePadding;
}

const variantStyles = {
    default: css`
        border-color:
            var(--color-border);

        background:
            linear-gradient(
                180deg,
                rgba(
                    255,
                    255,
                    255,
                    0.018
                ),
                transparent 36%
            ),
            var(
                --color-bg-secondary
            );
    `,

    subtle: css`
        border-color:
            var(--color-border);

        background:
            var(
                --color-bg-tertiary
            );

        box-shadow: none;
    `,

    highlight: css`
        border-color:
            rgba(
                99,
                102,
                241,
                0.24
            );

        background:
            linear-gradient(
                145deg,
                rgba(
                    99,
                    102,
                    241,
                    0.12
                ),
                rgba(
                    139,
                    92,
                    246,
                    0.04
                )
            ),
            var(
                --color-bg-secondary
            );
    `,

    interactive: css`
        border-color:
            var(--color-border);

        background:
            var(
                --color-bg-tertiary
            );

        cursor: pointer;

        transition:
            transform 180ms ease,
            border-color 180ms ease,
            background-color 180ms ease,
            box-shadow 180ms ease;

        @media (hover: hover) {
            &:hover {
                transform:
                    translateY(-2px);

                border-color:
                    rgba(
                        99,
                        102,
                        241,
                        0.36
                    );

                background:
                    rgba(
                        99,
                        102,
                        241,
                        0.055
                    );

                box-shadow:
                    0 14px 34px
                    rgba(
                        0,
                        0,
                        0,
                        0.17
                    );
            }
        }

        &:active {
            transform:
                scale(0.99);
        }
    `,

    danger: css`
        border-color:
            rgba(
                239,
                68,
                68,
                0.28
            );

        background:
            linear-gradient(
                145deg,
                rgba(
                    239,
                    68,
                    68,
                    0.065
                ),
                transparent
            ),
            var(
                --color-bg-secondary
            );
    `,
};

const paddingStyles = {
    none: css`
        padding: 0;
    `,

    sm: css`
        padding: 0.9rem;
    `,

    md: css`
        padding: 1rem;

        @media (
            min-width: 640px
        ) {
            padding: 1.25rem;
        }
    `,

    lg: css`
        padding: 1.1rem;

        @media (
            min-width: 640px
        ) {
            padding: 1.5rem;
        }
    `,
};

const StyledSurface =
    styled.section<{
        $variant:
        PageSurfaceVariant;
        $padding:
        PageSurfacePadding;
    }>`
        position: relative;
        min-width: 0;
        overflow: hidden;

        border-width: 1px;
        border-style: solid;
        border-radius: 1rem;

        box-shadow:
            0 1px 0
                rgba(
                    255,
                    255,
                    255,
                    0.025
                )
                inset,
            0 18px 42px
                rgba(
                    0,
                    0,
                    0,
                    0.11
                );

        ${({ $variant }) =>
            variantStyles[
            $variant
            ]}

        ${({ $padding }) =>
            paddingStyles[
            $padding
            ]}

        &:focus-visible {
            outline:
                2px solid
                rgba(
                    129,
                    140,
                    248,
                    0.85
                );

            outline-offset:
                2px;
        }

        @media (
            prefers-reduced-motion:
                reduce
        ) {
            transition: none;

            &:hover,
            &:active {
                transform: none;
            }
        }
    `;

export const PageSurface = ({
    children,
    as = "section",
    variant = "default",
    padding = "md",
    ...rest
}: PageSurfaceProps) => {
    return (
        <StyledSurface
            as={as}
            $variant={variant}
            $padding={padding}
            {...rest}
        >
            {children}
        </StyledSurface>
    );
};