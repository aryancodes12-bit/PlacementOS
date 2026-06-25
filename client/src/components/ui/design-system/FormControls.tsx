
import {
    forwardRef,
    useId,
} from "react";

import type {
    InputHTMLAttributes,
    ReactNode,
    SelectHTMLAttributes,
    TextareaHTMLAttributes,
} from "react";

import styled, {
    css,
} from "styled-components";

interface SharedFieldProps {
    label: string;
    description?: string;
    error?: string;
    required?: boolean;

    leadingIcon?: ReactNode;

    containerClassName?: string;
}

interface TextFieldProps
    extends Omit<
        InputHTMLAttributes<HTMLInputElement>,
        "size"
    >,
    SharedFieldProps { }

interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface SelectFieldProps
    extends SelectHTMLAttributes<HTMLSelectElement>,
    SharedFieldProps {
    options: SelectOption[];
    placeholder?: string;
}

interface TextAreaFieldProps
    extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    SharedFieldProps {
    characterCount?: number;
    maxCharacterCount?: number;
}

const controlStyles = css<{
    $hasError: boolean;
    $hasLeadingIcon: boolean;
}>`
    width: 100%;
    min-height: 2.9rem;

    border:
        1px solid
        ${({ $hasError }) =>
        $hasError
            ? "rgba(239, 68, 68, 0.62)"
            : "var(--color-border)"};

    border-radius:
        0.8rem;

    background:
        var(
            --color-bg-tertiary
        );

    padding:
        0.75rem
        0.9rem;

    padding-left:
        ${({ $hasLeadingIcon }) =>
        $hasLeadingIcon
            ? "2.65rem"
            : "0.9rem"};

    color:
        var(
            --color-text-primary
        );

    font-size: 0.875rem;
    line-height: 1.4;

    transition:
        border-color 160ms ease,
        box-shadow 160ms ease,
        background-color 160ms ease;

    &::placeholder {
        color:
            var(
                --color-text-tertiary
            );
    }

    &:hover:not(
        :disabled
    ) {
        border-color:
            ${({ $hasError }) =>
        $hasError
            ? "rgba(239, 68, 68, 0.75)"
            : "var(--color-border-hover)"};
    }

    &:focus {
        outline: none;

        border-color:
            ${({ $hasError }) =>
        $hasError
            ? "var(--color-danger)"
            : "rgba(129, 140, 248, 0.82)"};

        box-shadow:
            0 0 0 3px
            ${({ $hasError }) =>
        $hasError
            ? "rgba(239, 68, 68, 0.10)"
            : "rgba(99, 102, 241, 0.12)"};
    }

    &:disabled {
        cursor:
            not-allowed;

        opacity: 0.48;
    }

    @media (
        prefers-reduced-motion:
            reduce
    ) {
        transition: none;
    }
`;

const InputControl =
    styled.input<{
        $hasError: boolean;
        $hasLeadingIcon:
        boolean;
    }>`
        ${controlStyles}
    `;

const SelectControl =
    styled.select<{
        $hasError: boolean;
        $hasLeadingIcon:
        boolean;
    }>`
        ${controlStyles}

        cursor: pointer;

        &:disabled {
            cursor:
                not-allowed;
        }
    `;

const TextAreaControl =
    styled.textarea<{
        $hasError: boolean;
        $hasLeadingIcon:
        boolean;
    }>`
        ${controlStyles}

        min-height: 9rem;
        resize: vertical;
    `;

const FieldContainer =
    styled.div`
        min-width: 0;
    `;

const FieldLabel =
    styled.label`
        display: block;

        margin-bottom:
            0.4rem;

        color:
            var(
                --color-text-secondary
            );

        font-size:
            0.875rem;

        font-weight:
            650;
    `;

const FieldDescription =
    styled.p`
        margin-top:
            0.4rem;

        color:
            var(
                --color-text-tertiary
            );

        font-size:
            0.75rem;

        line-height:
            1.45;
    `;

const FieldError =
    styled.p`
        margin-top:
            0.4rem;

        color:
            var(
                --color-danger
            );

        font-size:
            0.75rem;

        line-height:
            1.45;
    `;

const LeadingIcon =
    styled.span`
        position: absolute;

        left: 0.85rem;
        top: 50%;

        display: inline-flex;

        transform:
            translateY(
                -50%
            );

        color:
            var(
                --color-text-tertiary
            );

        pointer-events:
            none;
    `;

const FieldHeader =
    styled.div`
        display: flex;
        align-items:
            center;
        justify-content:
            space-between;
        gap: 0.75rem;

        margin-bottom:
            0.4rem;
    `;

const Counter =
    styled.span`
        flex: 0 0 auto;

        color:
            var(
                --color-text-tertiary
            );

        font-size:
            0.75rem;
    `;

const buildDescribedBy = (
    descriptionId:
        string | undefined,
    errorId:
        string | undefined,
    external:
        string | undefined
) => {
    return [
        descriptionId,
        errorId,
        external,
    ]
        .filter(Boolean)
        .join(" ") ||
        undefined;
};

export const TextField =
    forwardRef<
        HTMLInputElement,
        TextFieldProps
    >(
        (
            {
                label,
                description,
                error,
                required = false,
                leadingIcon,
                containerClassName = "",
                id,
                "aria-describedby":
                ariaDescribedBy,
                ...rest
            },
            ref
        ) => {
            const generatedId =
                useId();

            const fieldId =
                id ||
                generatedId;

            const descriptionId =
                description
                    ? `${fieldId}-description`
                    : undefined;

            const errorId =
                error
                    ? `${fieldId}-error`
                    : undefined;

            return (
                <FieldContainer
                    className={
                        containerClassName
                    }
                >
                    <FieldLabel
                        htmlFor={
                            fieldId
                        }
                    >
                        {label}

                        {required && (
                            <span
                                aria-hidden="true"
                                className="ml-1 text-danger"
                            >
                                *
                            </span>
                        )}
                    </FieldLabel>

                    <div className="relative">
                        {leadingIcon && (
                            <LeadingIcon>
                                {
                                    leadingIcon
                                }
                            </LeadingIcon>
                        )}

                        <InputControl
                            ref={ref}
                            id={
                                fieldId
                            }
                            required={
                                required
                            }
                            aria-invalid={
                                Boolean(
                                    error
                                )
                            }
                            aria-describedby={buildDescribedBy(
                                descriptionId,
                                errorId,
                                ariaDescribedBy
                            )}
                            $hasError={
                                Boolean(
                                    error
                                )
                            }
                            $hasLeadingIcon={
                                Boolean(
                                    leadingIcon
                                )
                            }
                            {...rest}
                        />
                    </div>

                    {description && (
                        <FieldDescription
                            id={
                                descriptionId
                            }
                        >
                            {
                                description
                            }
                        </FieldDescription>
                    )}

                    {error && (
                        <FieldError
                            id={
                                errorId
                            }
                            role="alert"
                        >
                            {error}
                        </FieldError>
                    )}
                </FieldContainer>
            );
        }
    );

TextField.displayName =
    "TextField";

export const SelectField =
    forwardRef<
        HTMLSelectElement,
        SelectFieldProps
    >(
        (
            {
                label,
                description,
                error,
                required = false,
                leadingIcon,
                containerClassName = "",
                options,
                placeholder,
                id,
                "aria-describedby":
                ariaDescribedBy,
                ...rest
            },
            ref
        ) => {
            const generatedId =
                useId();

            const fieldId =
                id ||
                generatedId;

            const descriptionId =
                description
                    ? `${fieldId}-description`
                    : undefined;

            const errorId =
                error
                    ? `${fieldId}-error`
                    : undefined;

            return (
                <FieldContainer
                    className={
                        containerClassName
                    }
                >
                    <FieldLabel
                        htmlFor={
                            fieldId
                        }
                    >
                        {label}

                        {required && (
                            <span
                                aria-hidden="true"
                                className="ml-1 text-danger"
                            >
                                *
                            </span>
                        )}
                    </FieldLabel>

                    <div className="relative">
                        {leadingIcon && (
                            <LeadingIcon>
                                {
                                    leadingIcon
                                }
                            </LeadingIcon>
                        )}

                        <SelectControl
                            ref={ref}
                            id={
                                fieldId
                            }
                            required={
                                required
                            }
                            aria-invalid={
                                Boolean(
                                    error
                                )
                            }
                            aria-describedby={buildDescribedBy(
                                descriptionId,
                                errorId,
                                ariaDescribedBy
                            )}
                            $hasError={
                                Boolean(
                                    error
                                )
                            }
                            $hasLeadingIcon={
                                Boolean(
                                    leadingIcon
                                )
                            }
                            {...rest}
                        >
                            {placeholder && (
                                <option
                                    value=""
                                    disabled
                                >
                                    {
                                        placeholder
                                    }
                                </option>
                            )}

                            {options.map(
                                (
                                    option
                                ) => (
                                    <option
                                        key={
                                            option.value
                                        }
                                        value={
                                            option.value
                                        }
                                        disabled={
                                            option.disabled
                                        }
                                    >
                                        {
                                            option.label
                                        }
                                    </option>
                                )
                            )}
                        </SelectControl>
                    </div>

                    {description && (
                        <FieldDescription
                            id={
                                descriptionId
                            }
                        >
                            {
                                description
                            }
                        </FieldDescription>
                    )}

                    {error && (
                        <FieldError
                            id={
                                errorId
                            }
                            role="alert"
                        >
                            {error}
                        </FieldError>
                    )}
                </FieldContainer>
            );
        }
    );

SelectField.displayName =
    "SelectField";

export const TextAreaField =
    forwardRef<
        HTMLTextAreaElement,
        TextAreaFieldProps
    >(
        (
            {
                label,
                description,
                error,
                required = false,
                containerClassName = "",
                characterCount,
                maxCharacterCount,
                id,
                "aria-describedby":
                ariaDescribedBy,
                ...rest
            },
            ref
        ) => {
            const generatedId =
                useId();

            const fieldId =
                id ||
                generatedId;

            const descriptionId =
                description
                    ? `${fieldId}-description`
                    : undefined;

            const errorId =
                error
                    ? `${fieldId}-error`
                    : undefined;

            return (
                <FieldContainer
                    className={
                        containerClassName
                    }
                >
                    <FieldHeader>
                        <FieldLabel
                            htmlFor={
                                fieldId
                            }
                            style={{
                                marginBottom:
                                    0,
                            }}
                        >
                            {label}

                            {required && (
                                <span
                                    aria-hidden="true"
                                    className="ml-1 text-danger"
                                >
                                    *
                                </span>
                            )}
                        </FieldLabel>

                        {typeof characterCount ===
                            "number" &&
                            typeof maxCharacterCount ===
                            "number" && (
                                <Counter>
                                    {
                                        characterCount
                                    }
                                    /
                                    {
                                        maxCharacterCount
                                    }
                                </Counter>
                            )}
                    </FieldHeader>

                    <TextAreaControl
                        ref={ref}
                        id={
                            fieldId
                        }
                        required={
                            required
                        }
                        aria-invalid={
                            Boolean(
                                error
                            )
                        }
                        aria-describedby={buildDescribedBy(
                            descriptionId,
                            errorId,
                            ariaDescribedBy
                        )}
                        $hasError={
                            Boolean(
                                error
                            )
                        }
                        $hasLeadingIcon={
                            false
                        }
                        {...rest}
                    />

                    {description && (
                        <FieldDescription
                            id={
                                descriptionId
                            }
                        >
                            {
                                description
                            }
                        </FieldDescription>
                    )}

                    {error && (
                        <FieldError
                            id={
                                errorId
                            }
                            role="alert"
                        >
                            {error}
                        </FieldError>
                    )}
                </FieldContainer>
            );
        }
    );

TextAreaField.displayName =
    "TextAreaField";

