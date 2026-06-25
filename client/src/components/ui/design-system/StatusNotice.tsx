import type {
    HTMLAttributes,
    ReactNode,
} from "react";

import {
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    Info,
    X,
} from "lucide-react";

import styled, {
    css,
} from "styled-components";

export type StatusNoticeTone =
    | "success"
    | "error"
    | "warning"
    | "info";

interface StatusNoticeProps
    extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    tone?: StatusNoticeTone;
    title?: string;
    action?: ReactNode;
    dismissible?: boolean;
    onDismiss?: () => void;
}

const toneStyles = {
    success: css`
        border-color:
            rgba(
                34,
                197,
                94,
                0.24
            );

        background:
            rgba(
                34,
                197,
                94,
                0.085
            );

        color:
            var(
                --color-success
            );
    `,

    error: css`
        border-color:
            rgba(
                239,
                68,
                68,
                0.25
            );

        background:
            rgba(
                239,
                68,
                68,
                0.085
            );

        color:
            var(
                --color-danger
            );
    `,

    warning: css`
        border-color:
            rgba(
                245,
                158,
                11,
                0.25
            );

        background:
            rgba(
                245,
                158,
                11,
                0.085
            );

        color:
            var(
                --color-warning
            );
    `,

    info: css`
        border-color:
            rgba(
                99,
                102,
                241,
                0.25
            );

        background:
            rgba(
                99,
                102,
                241,
                0.085
            );

        color: #a5b4fc;
    `,
};

const Notice =
    styled.div<{
        $tone:
        StatusNoticeTone;
    }>`
        display: flex;
        min-width: 0;
        align-items:
            flex-start;
        gap: 0.7rem;

        border-width: 1px;
        border-style: solid;
        border-radius: 0.9rem;

        padding:
            0.85rem 0.95rem;

        font-size: 0.875rem;
        line-height: 1.45;

        ${({ $tone }) =>
            toneStyles[
            $tone
            ]}
    `;

const iconMap = {
    success:
        CheckCircle2,
    error:
        AlertCircle,
    warning:
        AlertTriangle,
    info:
        Info,
};

export const StatusNotice = ({
    children,
    tone = "info",
    title,
    action,
    dismissible = false,
    onDismiss,
    ...rest
}: StatusNoticeProps) => {
    const Icon =
        iconMap[tone];

    const role =
        tone === "error"
            ? "alert"
            : "status";

    return (
        <Notice
            $tone={tone}
            role={role}
            aria-live={
                tone === "error"
                    ? "assertive"
                    : "polite"
            }
            {...rest}
        >
            <Icon
                size={18}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
            />

            <div className="min-w-0 flex-1">
                {title && (
                    <p className="font-bold">
                        {title}
                    </p>
                )}

                <div
                    className={
                        title
                            ? "mt-1 text-text-secondary"
                            : ""
                    }
                >
                    {children}
                </div>

                {action && (
                    <div className="mt-3">
                        {action}
                    </div>
                )}
            </div>

            {dismissible &&
                onDismiss && (
                    <button
                        type="button"
                        onClick={
                            onDismiss
                        }
                        aria-label="Dismiss message"
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition hover:bg-black/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                    >
                        <X
                            size={15}
                            aria-hidden="true"
                        />
                    </button>
                )}
        </Notice>
    );
};