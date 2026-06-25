import type {
    ReactNode,
} from "react";

import styled from "styled-components";

import {
    IconTile,
} from "./IconTile";

import type {
    IconTileTone,
} from "./IconTile";

interface SectionHeaderProps {
    title: string;
    description?: string;
    eyebrow?: string;
    icon?: ReactNode;
    iconTone?: IconTileTone;
    action?: ReactNode;
    compact?: boolean;
}

const Header =
    styled.header<{
        $compact: boolean;
    }>`
        display: flex;
        flex-direction: column;
        gap:
            ${({ $compact }) =>
            $compact
                ? "0.75rem"
                : "1rem"};

        @media (
            min-width: 640px
        ) {
            flex-direction: row;
            align-items:
                flex-start;
            justify-content:
                space-between;
        }
    `;

export const SectionHeader = ({
    title,
    description,
    eyebrow,
    icon,
    iconTone = "brand",
    action,
    compact = false,
}: SectionHeaderProps) => {
    return (
        <Header
            $compact={
                compact
            }
        >
            <div className="flex min-w-0 items-start gap-3">
                {icon && (
                    <IconTile
                        tone={
                            iconTone
                        }
                        size={
                            compact
                                ? "sm"
                                : "md"
                        }
                    >
                        {icon}
                    </IconTile>
                )}

                <div className="min-w-0">
                    {eyebrow && (
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-tertiary">
                            {
                                eyebrow
                            }
                        </p>
                    )}

                    <h2
                        className={[
                            "font-bold tracking-tight text-text-primary",
                            compact
                                ? "text-sm"
                                : "text-base sm:text-lg",
                        ].join(
                            " "
                        )}
                    >
                        {title}
                    </h2>

                    {description && (
                        <p className="mt-1 max-w-3xl text-xs leading-5 text-text-secondary sm:text-sm sm:leading-6">
                            {
                                description
                            }
                        </p>
                    )}
                </div>
            </div>

            {action && (
                <div className="shrink-0">
                    {action}
                </div>
            )}
        </Header>
    );
};