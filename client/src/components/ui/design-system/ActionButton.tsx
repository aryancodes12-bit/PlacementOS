import type {
    ButtonHTMLAttributes,
    ComponentProps,
    ReactNode,
} from "react";

import {
    Loader2,
} from "lucide-react";

import {
    Link,
} from "react-router-dom";

import styled, {
    css,
} from "styled-components";

export type ActionVariant =
    | "primary"
    | "secondary"
    | "ghost"
    | "danger";

export type ActionSize =
    | "sm"
    | "md"
    | "lg";

interface SharedActionProps {
    variant?: ActionVariant;
    size?: ActionSize;
    fullWidth?: boolean;
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
}

interface ActionButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    SharedActionProps {
    loading?: boolean;
    loadingText?: string;
}

interface ActionLinkProps
    extends ComponentProps<
        typeof Link
    >,
    SharedActionProps { }

const variantStyles = {
    primary: css`
        border-color:
            transparent;

        background:
            var(
                --color-brand
            );

        color: #ffffff;

        box-shadow:
            0 9px 25px
            rgba(
                99,
                102,
                241,
                0.2
            );

        @media (hover: hover) {
            &:hover {
                background:
                    var(
                        --color-brand-hover
                    );

                box-shadow:
                    0 12px 30px
                    rgba(
                        99,
                        102,
                        241,
                        0.28
                    );
            }
        }
    `,

    secondary: css`
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

        @media (hover: hover) {
            &:hover {
                border-color:
                    var(
                        --color-border-hover
                    );

                color:
                    var(
                        --color-text-primary
                    );
            }
        }
    `,

    ghost: css`
        border-color:
            transparent;

        background:
            transparent;

        color:
            var(
                --color-text-secondary
            );

        @media (hover: hover) {
            &:hover {
                background:
                    var(
                        --color-bg-hover
                    );

                color:
                    var(
                        --color-text-primary
                    );
            }
        }
    `,

    danger: css`
        border-color:
            rgba(
                239,
                68,
                68,
                0.3
            );

        background:
            rgba(
                239,
                68,
                68,
                0.08
            );

        color:
            var(
                --color-danger
            );

        @media (hover: hover) {
            &:hover {
                border-color:
                    rgba(
                        239,
                        68,
                        68,
                        0.58
                    );

                background:
                    rgba(
                        239,
                        68,
                        68,
                        0.13
                    );
            }
        }
    `,
};

const sizeStyles = {
    sm: css`
        min-height: 2.5rem;
        padding:
            0.6rem 0.85rem;
        font-size: 0.8rem;
    `,

    md: css`
        min-height: 2.75rem;
        padding:
            0.7rem 1rem;
        font-size: 0.875rem;
    `,

    lg: css`
        min-height: 3rem;
        padding:
            0.8rem 1.25rem;
        font-size: 0.9rem;
    `,
};

const sharedActionStyles = css<{
    $variant:
    ActionVariant;
    $size:
    ActionSize;
    $fullWidth:
    boolean;
}>`
    display: inline-flex;
    width:
        ${({ $fullWidth }) =>
        $fullWidth
            ? "100%"
            : "auto"};

    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    border-width: 1px;
    border-style: solid;
    border-radius: 0.8rem;

    font-weight: 650;
    line-height: 1;
    text-align: center;
    text-decoration: none;
    white-space: nowrap;

    cursor: pointer;

    transition:
        transform 160ms ease,
        background-color 160ms ease,
        border-color 160ms ease,
        color 160ms ease,
        box-shadow 160ms ease,
        opacity 160ms ease;

    ${({ $variant }) =>
        variantStyles[
        $variant
        ]}

    ${({ $size }) =>
        sizeStyles[
        $size
        ]}

    &:focus-visible {
        outline:
            2px solid
            rgba(
                129,
                140,
                248,
                0.9
            );

        outline-offset:
            2px;
    }

    &:active {
        transform:
            scale(0.975);
    }

    &:disabled,
    &[aria-disabled="true"] {
        cursor:
            not-allowed;

        opacity: 0.45;

        transform: none;
    }

    @media (hover: hover) {
        &:hover:not(:disabled) {
            transform:
                translateY(-1px);
        }
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

const StyledButton =
    styled.button<{
        $variant:
        ActionVariant;
        $size:
        ActionSize;
        $fullWidth:
        boolean;
    }>`
        ${sharedActionStyles}
    `;

const StyledLink =
    styled(Link) <{
        $variant:
        ActionVariant;
        $size:
        ActionSize;
        $fullWidth:
        boolean;
    }>`
        ${sharedActionStyles}
    `;

export const ActionButton = ({
    children,
    variant = "primary",
    size = "md",
    fullWidth = false,
    loading = false,
    loadingText = "Please wait...",
    leadingIcon,
    trailingIcon,
    disabled,
    ...rest
}: ActionButtonProps) => {
    return (
        <StyledButton
            $variant={variant}
            $size={size}
            $fullWidth={
                fullWidth
            }
            disabled={
                disabled ||
                loading
            }
            aria-busy={
                loading
            }
            {...rest}
        >
            {loading ? (
                <Loader2
                    size={16}
                    className="animate-spin"
                    aria-hidden="true"
                />
            ) : (
                leadingIcon
            )}

            <span>
                {loading
                    ? loadingText
                    : children}
            </span>

            {!loading &&
                trailingIcon}
        </StyledButton>
    );
};

export const ActionLink = ({
    children,
    variant = "secondary",
    size = "md",
    fullWidth = false,
    leadingIcon,
    trailingIcon,
    ...rest
}: ActionLinkProps) => {
    return (
        <StyledLink
            $variant={variant}
            $size={size}
            $fullWidth={
                fullWidth
            }
            {...rest}
        >
            {leadingIcon}

            <span>
                {children}
            </span>

            {trailingIcon}
        </StyledLink>
    );
};