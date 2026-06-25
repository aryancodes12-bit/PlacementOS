
import {
    useId,
} from "react";

import type {
    HTMLAttributes,
} from "react";

import styled from "styled-components";

interface ToggleSwitchProps
    extends Omit<
        HTMLAttributes<HTMLDivElement>,
        "onChange"
    > {
    label: string;
    description?: string;

    checked: boolean;
    disabled?: boolean;

    compact?: boolean;

    id?: string;

    onChange: (
        checked: boolean
    ) => void;
}

const SwitchTrack =
    styled.span<{
        $checked: boolean;
        $disabled: boolean;
    }>`
        position: relative;

        display: inline-flex;

        width: 2.8rem;
        height: 1.55rem;

        flex: 0 0 auto;

        border:
            1px solid
            ${({ $checked }) =>
                $checked
                    ? "rgba(129, 140, 248, 0.72)"
                    : "var(--color-border-hover)"};

        border-radius: 999px;

        background:
            ${({ $checked }) =>
                $checked
                    ? "var(--color-brand)"
                    : "var(--color-bg-primary)"};

        cursor:
            ${({ $disabled }) =>
                $disabled
                    ? "not-allowed"
                    : "pointer"};

        opacity:
            ${({ $disabled }) =>
                $disabled
                    ? 0.45
                    : 1};

        transition:
            background-color 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease;

        &::after {
            content: "";

            position: absolute;

            top: 0.17rem;
            left: 0.18rem;

            width: 1.08rem;
            height: 1.08rem;

            border-radius: 50%;

            background: #ffffff;

            box-shadow:
                0 2px 7px
                rgba(
                    0,
                    0,
                    0,
                    0.28
                );

            transform:
                translateX(
                    ${({ $checked }) =>
            $checked
                ? "1.22rem"
                : "0"}
                );

            transition:
                transform 180ms ease;
        }

        @media (
            prefers-reduced-motion:
                reduce
        ) {
            transition: none;

            &::after {
                transition: none;
            }
        }
    `;

const SwitchInput =
    styled.input`
        position: absolute;

        width: 1px;
        height: 1px;

        margin: -1px;
        padding: 0;

        overflow: hidden;

        border: 0;

        clip:
            rect(
                0 0 0 0
            );

        white-space: nowrap;

        &:focus-visible + ${SwitchTrack} {
            outline:
                2px solid
                rgba(
                    129,
                    140,
                    248,
                    0.9
                );

            outline-offset:
                3px;
        }
    `;

const SwitchControl =
    styled.label<{
        $disabled: boolean;
    }>`
        display: inline-flex;
        flex: 0 0 auto;

        cursor:
            ${({ $disabled }) =>
                $disabled
                    ? "not-allowed"
                    : "pointer"};

        @media (
            hover: hover
        ) {
            &:hover ${SwitchTrack} {
                box-shadow:
                    ${({ $disabled }) =>
                        $disabled
                            ? "none"
                            : "0 0 0 4px rgba(99, 102, 241, 0.1)"};
            }
        }
    `;

export const ToggleSwitch = ({
    label,
    description,

    checked,
    disabled = false,

    compact = false,

    id,

    onChange,

    className = "",
    ...rest
}: ToggleSwitchProps) => {
    const generatedId =
        useId();

    const switchId =
        id ||
        generatedId;

    const descriptionId =
        description
            ? `${switchId}-description`
            : undefined;

    return (
        <div
            className={[
                "flex items-center justify-between gap-4",
                compact
                    ? ""
                    : "rounded-xl border border-border bg-bg-tertiary p-4",
                className,
            ].join(" ")}
            {...rest}
        >
            <div className="min-w-0">
                <label
                    htmlFor={
                        switchId
                    }
                    className="block cursor-pointer text-sm font-semibold text-text-primary"
                >
                    {label}
                </label>

                {description && (
                    <p
                        id={
                            descriptionId
                        }
                        className="mt-1 text-xs leading-5 text-text-tertiary"
                    >
                        {
                            description
                        }
                    </p>
                )}
            </div>

            <SwitchControl
                $disabled={
                    disabled
                }
            >
                <SwitchInput
                    id={switchId}
                    type="checkbox"
                    role="switch"
                    checked={
                        checked
                    }
                    disabled={
                        disabled
                    }
                    aria-describedby={
                        descriptionId
                    }
                    onChange={(
                        event
                    ) =>
                        onChange(
                            event.currentTarget
                                .checked
                        )
                    }
                />

                <SwitchTrack
                    $checked={
                        checked
                    }
                    $disabled={
                        disabled
                    }
                    aria-hidden="true"
                />
            </SwitchControl>
        </div>
    );
};
