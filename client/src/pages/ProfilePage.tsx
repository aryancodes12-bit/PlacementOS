
import {
    useEffect,
    useMemo,
    useState,
} from "react";

import type {
    FormEvent,
    KeyboardEvent,
} from "react";

import {
    Building2,
    CheckCircle2,
    Code2,
    ExternalLink,
    GraduationCap,

    Plus,
    Save,
    UserRound,
    X,
} from "lucide-react";

import { AppLayout } from "../components/ui/AppLayout";

import {
    profileService,
} from "../services/profile.service";

import type {
    ProfileUser,
    UserProfile,
} from "../services/profile.service";

interface ProfileForm {
    skills: string[];
    targetCompanies: string[];

    bio: string;
    linkedinUrl: string;
    githubUrl: string;
    college: string;
    graduationYear: string;
}

interface TagInputProps {
    label: string;
    value: string[];
    onChange: (value: string[]) => void;
    placeholder: string;
    suggestions: string[];
    maximumItems: number;
    helperText: string;
}

const EMPTY_FORM: ProfileForm = {
    skills: [],
    targetCompanies: [],
    bio: "",
    linkedinUrl: "",
    githubUrl: "",
    college: "",
    graduationYear: "",
};

const SKILL_SUGGESTIONS = [
    "Java",
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Express",
    "MongoDB",
    "PostgreSQL",
    "SQL",
    "Git",
    "REST APIs",
    "Docker",
];

const COMPANY_SUGGESTIONS = [
    "Amazon",
    "Microsoft",
    "JPMorgan Chase",
    "Infosys",
    "Accenture",
    "TCS",
];

const inputClass =
    "w-full rounded-xl border border-border bg-bg-tertiary px-4 py-3 " +
    "text-sm text-text-primary placeholder-text-tertiary transition " +
    "focus:border-brand focus:outline-none";

const labelClass =
    "mb-1.5 block text-sm font-medium text-text-secondary";

const normalizeUniqueTags = (
    currentValues: string[],
    rawValues: string[],
    maximumItems: number
) => {
    const uniqueValues = new Map<string, string>();

    [...currentValues, ...rawValues].forEach((value) => {
        const normalizedValue = value.trim();

        if (!normalizedValue) {
            return;
        }

        const comparisonKey = normalizedValue.toLowerCase();

        if (!uniqueValues.has(comparisonKey)) {
            uniqueValues.set(comparisonKey, normalizedValue);
        }
    });

    return Array.from(uniqueValues.values()).slice(
        0,
        maximumItems
    );
};

const TagInput = ({
    label,
    value,
    onChange,
    placeholder,
    suggestions,
    maximumItems,
    helperText,
}: TagInputProps) => {
    const [draft, setDraft] = useState("");

    const addDraftValues = () => {
        const valuesToAdd = draft
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

        if (valuesToAdd.length === 0) {
            setDraft("");
            return;
        }

        onChange(
            normalizeUniqueTags(
                value,
                valuesToAdd,
                maximumItems
            )
        );

        setDraft("");
    };

    const handleKeyDown = (
        event: KeyboardEvent<HTMLInputElement>
    ) => {
        if (
            event.key === "Enter" ||
            event.key === ","
        ) {
            event.preventDefault();
            addDraftValues();
        }

        if (
            event.key === "Backspace" &&
            !draft &&
            value.length > 0
        ) {
            onChange(value.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(
            value.filter(
                (tag) => tag !== tagToRemove
            )
        );
    };

    const addSuggestion = (suggestion: string) => {
        onChange(
            normalizeUniqueTags(
                value,
                [suggestion],
                maximumItems
            )
        );
    };

    const availableSuggestions =
        suggestions.filter(
            (suggestion) =>
                !value.some(
                    (tag) =>
                        tag.toLowerCase() ===
                        suggestion.toLowerCase()
                )
        );

    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-text-secondary">
                    {label}
                </label>

                <span className="text-xs text-text-tertiary">
                    {value.length}/{maximumItems}
                </span>
            </div>

            <div className="rounded-xl border border-border bg-bg-tertiary p-3 transition focus-within:border-brand">
                {value.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {value.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-muted px-2.5 py-1.5 text-xs font-medium text-brand"
                            >
                                {tag}

                                <button
                                    type="button"
                                    onClick={() =>
                                        removeTag(tag)
                                    }
                                    className="transition hover:text-danger"
                                    aria-label={`Remove ${tag}`}
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <input
                        value={draft}
                        onChange={(event) =>
                            setDraft(event.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        onBlur={addDraftValues}
                        disabled={
                            value.length >= maximumItems
                        }
                        className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder-text-tertiary outline-none disabled:cursor-not-allowed"
                        placeholder={
                            value.length >= maximumItems
                                ? "Maximum items added"
                                : placeholder
                        }
                    />

                    <button
                        type="button"
                        onMouseDown={(event) =>
                            event.preventDefault()
                        }
                        onClick={addDraftValues}
                        disabled={
                            !draft.trim() ||
                            value.length >= maximumItems
                        }
                        className="rounded-lg border border-border p-1.5 text-text-tertiary transition hover:border-brand/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Add ${label.toLowerCase()}`}
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </div>

            <p className="mt-1.5 text-xs text-text-tertiary">
                {helperText}
            </p>

            {availableSuggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {availableSuggestions
                        .slice(0, 8)
                        .map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() =>
                                    addSuggestion(suggestion)
                                }
                                disabled={
                                    value.length >= maximumItems
                                }
                                className="rounded-lg border border-border px-2 py-1 text-[11px] text-text-tertiary transition hover:border-brand/40 hover:text-brand disabled:opacity-40"
                            >
                                + {suggestion}
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
};

const profileToForm = (
    profile?: UserProfile | null
): ProfileForm => ({
    skills: profile?.skills ?? [],
    targetCompanies:
        profile?.targetCompanies ?? [],

    bio: profile?.bio ?? "",
    linkedinUrl: profile?.linkedinUrl ?? "",
    githubUrl: profile?.githubUrl ?? "",
    college: profile?.college ?? "",

    graduationYear:
        profile?.graduationYear?.toString() ?? "",
});

const normalizeUrlForSubmission = (
    value: string,
    provider: "linkedin" | "github"
) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return {
            value: "",
            error: "",
        };
    }

    const valueWithProtocol =
        /^https?:\/\//i.test(trimmedValue)
            ? trimmedValue
            : `https://${trimmedValue}`;

    try {
        const parsedUrl = new URL(valueWithProtocol);

        const hostname = parsedUrl.hostname
            .toLowerCase()
            .replace(/^www\./, "");

        const segments = parsedUrl.pathname
            .split("/")
            .filter(Boolean);

        if (provider === "linkedin") {
            const valid =
                hostname === "linkedin.com" &&
                segments.length === 2 &&
                segments[0].toLowerCase() === "in";

            if (!valid) {
                return {
                    value: "",
                    error:
                        "Use a personal LinkedIn URL such as linkedin.com/in/username.",
                };
            }

            return {
                value: `https://www.linkedin.com/in/${segments[1]}`,
                error: "",
            };
        }

        const valid =
            hostname === "github.com" &&
            segments.length === 1;

        if (!valid) {
            return {
                value: "",
                error:
                    "Use a GitHub profile URL such as github.com/username.",
            };
        }

        return {
            value: `https://github.com/${segments[0]}`,
            error: "",
        };
    } catch {
        return {
            value: "",
            error: `Enter a valid ${provider === "linkedin"
                ? "LinkedIn"
                : "GitHub"
                } URL.`,
        };
    }
};

const getProfileCompletion = (
    form: ProfileForm
) => {
    let score = 0;

    if (form.skills.length > 0) score += 20;
    if (form.targetCompanies.length > 0) score += 15;
    if (form.bio.trim().length >= 20) score += 15;
    if (form.linkedinUrl.trim()) score += 10;
    if (form.githubUrl.trim()) score += 10;
    if (form.college.trim()) score += 15;
    if (form.graduationYear.trim()) score += 15;

    return score;
};

export const ProfilePage = () => {
    const [form, setForm] =
        useState<ProfileForm>(EMPTY_FORM);

    const [initialForm, setInitialForm] =
        useState<ProfileForm>(EMPTY_FORM);

    const [user, setUser] =
        useState<ProfileUser | null>(null);

    const [loading, setLoading] =
        useState(false);

    const [pageLoading, setPageLoading] =
        useState(true);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const [fieldErrors, setFieldErrors] =
        useState<Record<string, string>>({});

    const currentYear =
        new Date().getFullYear();

    const completion = useMemo(
        () => getProfileCompletion(form),
        [form]
    );

    const isDirty = useMemo(
        () =>
            JSON.stringify(form) !==
            JSON.stringify(initialForm),
        [form, initialForm]
    );

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setPageLoading(true);
                setError("");

                const { data } =
                    await profileService.getMe();

                const profile =
                    data.data.profile;

                const nextForm =
                    profileToForm(profile);

                setForm(nextForm);
                setInitialForm(nextForm);
                setUser(profile?.user ?? null);
            } catch (err: any) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load profile."
                );
            } finally {
                setPageLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const updateField = <
        Key extends keyof ProfileForm
    >(
        key: Key,
        value: ProfileForm[Key]
    ) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));

        setMessage("");

        setFieldErrors((current) => ({
            ...current,
            [key]: "",
        }));
    };

    const handleSubmit = async (
        event: FormEvent
    ) => {
        event.preventDefault();

        const linkedInResult =
            normalizeUrlForSubmission(
                form.linkedinUrl,
                "linkedin"
            );

        const gitHubResult =
            normalizeUrlForSubmission(
                form.githubUrl,
                "github"
            );

        const nextFieldErrors: Record<
            string,
            string
        > = {};

        if (linkedInResult.error) {
            nextFieldErrors.linkedinUrl =
                linkedInResult.error;
        }

        if (gitHubResult.error) {
            nextFieldErrors.githubUrl =
                gitHubResult.error;
        }

        if (form.bio.length > 500) {
            nextFieldErrors.bio =
                "Bio must be 500 characters or fewer.";
        }

        const graduationYear =
            form.graduationYear.trim()
                ? Number(form.graduationYear)
                : null;

        if (
            graduationYear !== null &&
            (
                !Number.isInteger(graduationYear) ||
                graduationYear <
                currentYear - 1 ||
                graduationYear >
                currentYear + 10
            )
        ) {
            nextFieldErrors.graduationYear =
                `Use a year between ${currentYear - 1} and ${currentYear + 10}.`;
        }

        if (
            Object.keys(nextFieldErrors)
                .length > 0
        ) {
            setFieldErrors(nextFieldErrors);
            setError(
                "Correct the highlighted fields before saving."
            );
            return;
        }

        setLoading(true);
        setMessage("");
        setError("");
        setFieldErrors({});

        try {
            const { data } =
                await profileService.updateMe({
                    skills: form.skills,
                    targetCompanies:
                        form.targetCompanies,

                    bio: form.bio.trim(),

                    linkedinUrl:
                        linkedInResult.value,

                    githubUrl:
                        gitHubResult.value,

                    college:
                        form.college.trim(),

                    graduationYear,
                });

            const savedProfile =
                data.data.profile;

            const savedForm =
                profileToForm(savedProfile);

            setForm(savedForm);
            setInitialForm(savedForm);
            setUser(savedProfile?.user ?? user);

            setMessage(
                data.message ||
                "Profile updated successfully."
            );
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Profile update failed."
            );
        } finally {
            setLoading(false);
        }
    };

    const linkedInPreview =
        normalizeUrlForSubmission(
            form.linkedinUrl,
            "linkedin"
        );

    const gitHubPreview =
        normalizeUrlForSubmission(
            form.githubUrl,
            "github"
        );

    return (
        <AppLayout
            title="Profile"
            description="Build the placement context used for personalized readiness, resume, and interview insights."
        >
            {pageLoading ? (
                <div className="mx-auto grid max-w-6xl grid-cols-12 gap-5">
                    <div className="col-span-12 h-72 animate-pulse rounded-2xl border border-border bg-bg-secondary lg:col-span-4" />
                    <div className="col-span-12 h-[650px] animate-pulse rounded-2xl border border-border bg-bg-secondary lg:col-span-8" />
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="mx-auto grid max-w-6xl grid-cols-12 gap-5"
                >
                    <aside className="col-span-12 lg:col-span-4">
                        <div className="space-y-5 rounded-2xl border border-border bg-bg-secondary p-6 lg:sticky lg:top-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-muted text-brand">
                                    <UserRound size={22} />
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-text-primary">
                                        {user?.name ||
                                            "Student Profile"}
                                    </p>

                                    <p className="truncate text-xs text-text-tertiary">
                                        {user?.email ||
                                            "Complete your placement profile"}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-medium text-text-secondary">
                                        Profile completion
                                    </p>

                                    <p className="text-sm font-bold text-brand">
                                        {completion}%
                                    </p>
                                </div>

                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-tertiary">
                                    <div
                                        className="h-full rounded-full bg-brand transition-all duration-500"
                                        style={{
                                            width: `${completion}%`,
                                        }}
                                    />
                                </div>

                                <p className="mt-2 text-xs leading-5 text-text-tertiary">
                                    Completion helps you maintain useful placement context. It does not artificially increase your readiness score.
                                </p>
                            </div>

                            <div className="space-y-3 border-t border-border pt-5">
                                <div className="flex items-start gap-3">
                                    <Building2
                                        size={16}
                                        className="mt-0.5 text-text-tertiary"
                                    />

                                    <div>
                                        <p className="text-xs font-medium text-text-secondary">
                                            Target companies
                                        </p>

                                        <p className="mt-1 text-xs text-text-tertiary">
                                            {form
                                                .targetCompanies
                                                .length > 0
                                                ? `${form.targetCompanies.length} companies selected`
                                                : "No companies selected"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <GraduationCap
                                        size={16}
                                        className="mt-0.5 text-text-tertiary"
                                    />

                                    <div>
                                        <p className="text-xs font-medium text-text-secondary">
                                            Academic context
                                        </p>

                                        <p className="mt-1 text-xs text-text-tertiary">
                                            {form.college ||
                                                "College not added"}
                                            {form.graduationYear
                                                ? ` · ${form.graduationYear}`
                                                : ""}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {linkedInPreview.value &&
                                    !linkedInPreview.error && (
                                        <a
                                            href={
                                                linkedInPreview.value
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-medium text-text-secondary transition hover:border-brand/40 hover:text-brand"
                                        >
                                            <UserRound size={14} />
                                            LinkedIn
                                            <ExternalLink size={11} />
                                        </a>
                                    )}

                                {gitHubPreview.value &&
                                    !gitHubPreview.error && (
                                        <a
                                            href={
                                                gitHubPreview.value
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-medium text-text-secondary transition hover:border-brand/40 hover:text-brand"
                                        >
                                            <Code2 size={14} />
                                            GitHub
                                            <ExternalLink size={11} />
                                        </a>
                                    )}
                            </div>
                        </div>
                    </aside>

                    <main className="col-span-12 lg:col-span-8">
                        <div className="space-y-7 rounded-2xl border border-border bg-bg-secondary p-6 md:p-8">
                            <div>
                                <h2 className="text-lg font-semibold text-text-primary">
                                    Placement Profile
                                </h2>

                                <p className="mt-1 text-sm text-text-tertiary">
                                    Skills and target companies personalize your preparation. Academic details and professional links complete your recruiter-facing profile.
                                </p>
                            </div>

                            {message && (
                                <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success-muted px-4 py-3 text-sm text-success">
                                    <CheckCircle2 size={16} />
                                    {message}
                                </div>
                            )}

                            {error && (
                                <div className="rounded-xl border border-danger/20 bg-danger-muted px-4 py-3 text-sm text-danger">
                                    {error}
                                </div>
                            )}

                            <section className="space-y-5">
                                <div>
                                    <h3 className="text-sm font-semibold text-text-primary">
                                        Placement preferences
                                    </h3>

                                    <p className="mt-1 text-xs text-text-tertiary">
                                        These fields directly improve personalization in readiness and Daily Plan recommendations.
                                    </p>
                                </div>

                                <TagInput
                                    label="Skills"
                                    value={form.skills}
                                    onChange={(value) =>
                                        updateField(
                                            "skills",
                                            value
                                        )
                                    }
                                    placeholder="Type a skill and press Enter"
                                    suggestions={
                                        SKILL_SUGGESTIONS
                                    }
                                    maximumItems={30}
                                    helperText="Add individual technologies rather than broad labels such as MERN Stack."
                                />

                                <TagInput
                                    label="Target companies"
                                    value={
                                        form.targetCompanies
                                    }
                                    onChange={(value) =>
                                        updateField(
                                            "targetCompanies",
                                            value
                                        )
                                    }
                                    placeholder="Type a company and press Enter"
                                    suggestions={
                                        COMPANY_SUGGESTIONS
                                    }
                                    maximumItems={20}
                                    helperText="Company targets help tailor preparation priorities and readiness matching."
                                />
                            </section>

                            <section className="border-t border-border pt-7">
                                <div className="mb-5">
                                    <h3 className="text-sm font-semibold text-text-primary">
                                        About you
                                    </h3>

                                    <p className="mt-1 text-xs text-text-tertiary">
                                        Add concise context about your interests, strengths, and placement goals.
                                    </p>
                                </div>

                                <label className={labelClass}>
                                    Bio
                                </label>

                                <textarea
                                    value={form.bio}
                                    maxLength={500}
                                    onChange={(event) =>
                                        updateField(
                                            "bio",
                                            event.target.value
                                        )
                                    }
                                    className={`${inputClass} min-h-36 resize-none`}
                                    placeholder="IT student focused on full-stack development, backend systems, and campus placements..."
                                />

                                <div className="mt-1.5 flex items-center justify-between gap-3">
                                    <p className="text-xs text-danger">
                                        {fieldErrors.bio}
                                    </p>

                                    <p className="text-xs text-text-tertiary">
                                        {form.bio.length}/500
                                    </p>
                                </div>
                            </section>

                            <section className="border-t border-border pt-7">
                                <div className="mb-5">
                                    <h3 className="text-sm font-semibold text-text-primary">
                                        Professional presence
                                    </h3>

                                    <p className="mt-1 text-xs text-text-tertiary">
                                        These links provide recruiters with professional and project evidence. PlacementOS does not scrape either platform.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div>
                                        <label className={labelClass}>
                                            LinkedIn profile
                                        </label>

                                        <div className="relative">
                                            <UserRound
                                                size={15}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
                                            />
                                            <input
                                                value={
                                                    form.linkedinUrl
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateField(
                                                        "linkedinUrl",
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                className={`${inputClass} pl-10`}
                                                placeholder="linkedin.com/in/username"
                                            />
                                        </div>

                                        {fieldErrors.linkedinUrl && (
                                            <p className="mt-1.5 text-xs text-danger">
                                                {
                                                    fieldErrors.linkedinUrl
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            GitHub profile
                                        </label>

                                        <div className="relative">
                                            <Code2 size={15}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
                                            />

                                            <input
                                                value={
                                                    form.githubUrl
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateField(
                                                        "githubUrl",
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                className={`${inputClass} pl-10`}
                                                placeholder="github.com/username"
                                            />
                                        </div>

                                        {fieldErrors.githubUrl && (
                                            <p className="mt-1.5 text-xs text-danger">
                                                {
                                                    fieldErrors.githubUrl
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="border-t border-border pt-7">
                                <div className="mb-5">
                                    <h3 className="text-sm font-semibold text-text-primary">
                                        Academic details
                                    </h3>

                                    <p className="mt-1 text-xs text-text-tertiary">
                                        Add enough context for internship and campus-placement preparation.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div>
                                        <label className={labelClass}>
                                            College
                                        </label>

                                        <input
                                            value={form.college}
                                            maxLength={120}
                                            onChange={(event) =>
                                                updateField(
                                                    "college",
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            className={inputClass}
                                            placeholder="TCET Mumbai"
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            Graduation year
                                        </label>

                                        <input
                                            type="number"
                                            min={currentYear - 1}
                                            max={currentYear + 10}
                                            value={
                                                form.graduationYear
                                            }
                                            onChange={(event) =>
                                                updateField(
                                                    "graduationYear",
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            className={inputClass}
                                            placeholder="2028"
                                        />

                                        {fieldErrors.graduationYear && (
                                            <p className="mt-1.5 text-xs text-danger">
                                                {
                                                    fieldErrors.graduationYear
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
                                <p className="text-xs text-text-tertiary">
                                    {isDirty
                                        ? "You have unsaved profile changes."
                                        : "Your profile is up to date."}
                                </p>

                                <button
                                    type="submit"
                                    disabled={
                                        loading ||
                                        !isDirty
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Save size={15} />

                                    {loading
                                        ? "Saving..."
                                        : "Save profile"}
                                </button>
                            </div>
                        </div>
                    </main>
                </form>
            )}
        </AppLayout>
    );
};

