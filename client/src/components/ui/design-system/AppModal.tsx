
import {
    useEffect,
    useId,
    useRef,
} from "react";

import type {
    ReactNode,
} from "react";

import {
    createPortal,
} from "react-dom";

import {
    AnimatePresence,
    motion,
} from "framer-motion";

import {
    X,
} from "lucide-react";

import styled, {
    css,
} from "styled-components";

export type AppModalSize =
    | "sm"
    | "md"
    | "lg"
    | "xl";

interface AppModalProps {
    open: boolean;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    icon?: ReactNode;

    size?: AppModalSize;

    busy?: boolean;

    closeOnEscape?: boolean;
    closeOnBackdrop?: boolean;

    onClose: () => void;
}

const sizeStyles: Record<
    AppModalSize,
    ReturnType<typeof css>
> = {
    sm: css`
        max-width: 28rem;
    `,

    md: css`
        max-width: 36rem;
    `,

    lg: css`
        max-width: 48rem;
    `,

    xl: css`
        max-width: 64rem;
    `,
};

const Overlay = styled(
    motion.div
)`
    position: fixed;
    inset: 0;
    z-index: 100;

    display: flex;
    align-items: flex-end;
    justify-content: center;

    background:
        rgba(
            0,
            0,
            0,
            0.74
        );

    backdrop-filter:
        blur(8px);

    -webkit-backdrop-filter:
        blur(8px);

    @media (
        min-width: 640px
    ) {
        align-items: center;
        padding: 1rem;
    }
`;

const Panel = styled(
    motion.section
) <{
    $size: AppModalSize;
}>`
    width: 100%;
    max-height:
        min(
            92dvh,
            56rem
        );

    overflow-y: auto;
    overscroll-behavior:
        contain;

    border:
        1px solid
        var(
            --color-border
        );

    border-radius:
        1.35rem
        1.35rem
        0
        0;

    background:
        linear-gradient(
            180deg,
            rgba(
                99,
                102,
                241,
                0.045
            ),
            transparent
            30%
        ),
        var(
            --color-bg-secondary
        );

    box-shadow:
        0 30px 100px
        rgba(
            0,
            0,
            0,
            0.62
        );

    ${({ $size }) =>
        sizeStyles[
        $size
        ]}

    @media (
        min-width: 640px
    ) {
        border-radius:
            1.25rem;
    }

    &:focus {
        outline: none;
    }
`;

const CloseButton =
    styled.button`
        display: inline-flex;

        width: 2.75rem;
        height: 2.75rem;

        flex: 0 0 auto;

        align-items: center;
        justify-content: center;

        border:
            1px solid
            var(
                --color-border
            );

        border-radius:
            0.8rem;

        background:
            var(
                --color-bg-tertiary
            );

        color:
            var(
                --color-text-secondary
            );

        cursor: pointer;

        transition:
            transform 160ms ease,
            border-color 160ms ease,
            color 160ms ease,
            background-color 160ms ease;

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

        &:active:not(
            :disabled
        ) {
            transform:
                scale(
                    0.94
                );
        }

        &:disabled {
            cursor:
                not-allowed;

            opacity: 0.45;
        }

        @media (
            hover: hover
        ) {
            &:hover:not(
                :disabled
            ) {
                border-color:
                    var(
                        --color-border-hover
                    );

                color:
                    var(
                        --color-text-primary
                    );

                background:
                    var(
                        --color-bg-hover
                    );
            }
        }

        @media (
            prefers-reduced-motion:
                reduce
        ) {
            transition: none;

            &:active {
                transform: none;
            }
        }
    `;

const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
].join(",");

const getFocusableElements = (
    panel: HTMLElement
) => {
    return Array.from(
        panel.querySelectorAll<HTMLElement>(
            focusableSelectors
        )
    );
};

export const AppModal = ({
    open,
    title,
    description,
    children,
    footer,
    icon,

    size = "md",

    busy = false,

    closeOnEscape = true,
    closeOnBackdrop = true,

    onClose,
}: AppModalProps) => {
    const titleId =
        useId();

    const descriptionId =
        useId();

    const panelRef =
        useRef<HTMLElement | null>(
            null
        );

    const closeButtonRef =
        useRef<HTMLButtonElement | null>(
            null
        );

    const previouslyFocusedRef =
        useRef<HTMLElement | null>(
            null
        );

    useEffect(() => {
        if (!open) {
            return;
        }

        previouslyFocusedRef.current =
            document.activeElement instanceof
                HTMLElement
                ? document.activeElement
                : null;

        const previousOverflow =
            document.body.style
                .overflow;

        document.body.style.overflow =
            "hidden";

        const focusTimer =
            window.setTimeout(
                () => {
                    const panel =
                        panelRef.current;

                    if (
                        panel?.contains(
                            document.activeElement
                        )
                    ) {
                        return;
                    }

                    closeButtonRef
                        .current
                        ?.focus();
                },
                0
            );

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (
                event.key ===
                "Escape" &&
                closeOnEscape &&
                !busy
            ) {
                onClose();
                return;
            }

            if (
                event.key !==
                "Tab"
            ) {
                return;
            }

            const panel =
                panelRef.current;

            if (!panel) {
                return;
            }

            const focusableElements =
                getFocusableElements(
                    panel
                );

            if (
                focusableElements.length ===
                0
            ) {
                event.preventDefault();

                panel.focus();
                return;
            }

            const firstElement =
                focusableElements[0];

            const lastElement =
                focusableElements[
                focusableElements.length -
                1
                ];

            const focusIsInside =
                document.activeElement instanceof
                    HTMLElement &&
                panel.contains(
                    document.activeElement
                );

            if (!focusIsInside) {
                event.preventDefault();

                (
                    event.shiftKey
                        ? lastElement
                        : firstElement
                ).focus();

                return;
            }

            if (
                event.shiftKey &&
                document.activeElement ===
                firstElement
            ) {
                event.preventDefault();

                lastElement.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement ===
                lastElement
            ) {
                event.preventDefault();

                firstElement.focus();
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.clearTimeout(
                focusTimer
            );

            document.body.style.overflow =
                previousOverflow;

            window.removeEventListener(
                "keydown",
                handleKeyDown
            );

            previouslyFocusedRef
                .current
                ?.focus();
        };
    }, [
        open,
        busy,
        closeOnEscape,
        onClose,
    ]);

    if (
        typeof document ===
        "undefined"
    ) {
        return null;
    }

    return createPortal(
        <AnimatePresence>
            {open && (
                <Overlay
                    initial={{
                        opacity: 0,
                    }}
                    animate={{
                        opacity: 1,
                    }}
                    exit={{
                        opacity: 0,
                    }}
                    transition={{
                        duration:
                            0.18,
                    }}
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget &&
                            closeOnBackdrop &&
                            !busy
                        ) {
                            onClose();
                        }
                    }}
                >
                    <Panel
                        ref={
                            panelRef
                        }
                        $size={size}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={
                            titleId
                        }
                        aria-describedby={
                            description
                                ? descriptionId
                                : undefined
                        }
                        aria-busy={
                            busy
                        }
                        tabIndex={-1}
                        initial={{
                            opacity: 0,
                            y: 24,
                            scale:
                                0.985,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            y: 18,
                            scale:
                                0.985,
                        }}
                        transition={{
                            duration:
                                0.22,

                            ease: [
                                0.22,
                                1,
                                0.36,
                                1,
                            ],
                        }}
                    >
                        <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6 sm:py-5">
                            <div className="flex min-w-0 items-start gap-3">
                                {icon && (
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-[#A5B4FC]">
                                        {
                                            icon
                                        }
                                    </div>
                                )}

                                <div className="min-w-0">
                                    <h2
                                        id={
                                            titleId
                                        }
                                        className="text-base font-bold text-text-primary sm:text-lg"
                                    >
                                        {
                                            title
                                        }
                                    </h2>

                                    {description && (
                                        <p
                                            id={
                                                descriptionId
                                            }
                                            className="mt-1 text-xs leading-5 text-text-secondary sm:text-sm"
                                        >
                                            {
                                                description
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>

                            <CloseButton
                                ref={
                                    closeButtonRef
                                }
                                type="button"
                                onClick={
                                    onClose
                                }
                                disabled={
                                    busy
                                }
                                aria-label={`Close ${title} dialog`}
                            >
                                <X
                                    size={
                                        18
                                    }
                                    aria-hidden="true"
                                />
                            </CloseButton>
                        </header>

                        <div className="px-4 py-5 sm:px-6">
                            {
                                children
                            }
                        </div>

                        {footer && (
                            <footer className="border-t border-border px-4 py-4 sm:px-6">
                                {
                                    footer
                                }
                            </footer>
                        )}
                    </Panel>
                </Overlay>
            )}
        </AnimatePresence>,
        document.body
    );
};

