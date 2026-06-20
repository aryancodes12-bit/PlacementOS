
import { useState } from "react";
import { Save, X } from "lucide-react";

import { dsaService } from "../../services/dsa.service";

import type {
    CreateDSAProblemInput,
    DSAProblem,
    DSADifficulty,
    DSAStatus,
} from "../../services/dsa.service";

const TOPICS = [
    "Arrays",
    "Strings",
    "Linked List",
    "Stack",
    "Queue",
    "Trees",
    "Graphs",
    "Dynamic Programming",
    "Recursion",
    "Binary Search",
    "Sorting",
    "Hashing",
    "Greedy",
    "Backtracking",
    "Heap",
    "Trie",
    "Math",
];

const PATTERNS = [
    "HashMap",
    "Two Pointers",
    "Sliding Window",
    "Binary Search",
    "Prefix Sum",
    "Stack",
    "Queue",
    "Linked List",
    "Trees",
    "Graphs",
    "Dynamic Programming",
    "Backtracking",
];

interface AddProblemModalProps {
    onClose: () => void;

    /**
     * Retained for compatibility with the current page.
     */
    onAdded?: (problem: DSAProblem) => void;

    /**
     * Used by the upgraded page for both add and edit.
     */
    onSaved?: (problem: DSAProblem) => void;

    /**
     * When provided, the modal works in edit mode.
     */
    problem?: DSAProblem | null;
}

const uniqueCompanies = (value: string) => {
    return Array.from(
        new Set(
            value
                .split(",")
                .map((company) => company.trim())
                .filter(Boolean)
        )
    );
};

export const AddProblemModal = ({
    onClose,
    onAdded,
    onSaved,
    problem = null,
}: AddProblemModalProps) => {
    const isEditing = Boolean(problem);

    const [form, setForm] =
        useState<CreateDSAProblemInput>({
            title: problem?.title ?? "",
            topic: problem?.topic ?? "Arrays",
            pattern: problem?.pattern ?? "",
            difficulty:
                problem?.difficulty ?? "MEDIUM",
            status:
                problem?.status ?? "UNSOLVED",
            platform: problem?.platform ?? "",
            problemUrl: problem?.problemUrl ?? "",
            companies: problem?.companies ?? [],
            notes: problem?.notes ?? "",
        });

    const [companiesText, setCompaniesText] =
        useState(
            problem?.companies?.join(", ") ?? ""
        );

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const inputClass =
        "w-full rounded-xl border border-border bg-bg-tertiary px-4 py-2.5 " +
        "text-sm text-text-primary placeholder-text-tertiary " +
        "transition focus:border-brand focus:outline-none";

    const labelClass =
        "mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary";

    const updateForm = <
        Key extends keyof CreateDSAProblemInput
    >(
        key: Key,
        value: CreateDSAProblemInput[Key]
    ) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const handleSubmit = async () => {
        const normalizedTitle =
            form.title.trim();

        const normalizedTopic =
            form.topic.trim();

        if (!normalizedTitle) {
            setError(
                "Problem title is required"
            );
            return;
        }

        if (!normalizedTopic) {
            setError("Topic is required");
            return;
        }

        setLoading(true);
        setError("");

        const payload: CreateDSAProblemInput = {
            title: normalizedTitle,
            topic: normalizedTopic,
            pattern: form.pattern?.trim() || "",
            difficulty: form.difficulty,
            status: form.status,
            platform:
                form.platform?.trim() || "",
            problemUrl:
                form.problemUrl?.trim() || "",
            companies:
                uniqueCompanies(companiesText),
            notes: form.notes?.trim() || "",
        };

        try {
            const response =
                problem
                    ? await dsaService.update(
                        problem.id,
                        payload
                    )
                    : await dsaService.add(
                        payload
                    );

            const savedProblem =
                response.data.problem;

            onAdded?.(savedProblem);
            onSaved?.(savedProblem);

            onClose();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                `Failed to ${isEditing ? "update" : "add"
                } problem`
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-bg-secondary shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg-secondary px-6 py-4">
                    <div>
                        <h3 className="text-base font-semibold text-text-primary">
                            {isEditing
                                ? "Edit DSA Problem"
                                : "Add DSA Problem"}
                        </h3>

                        <p className="mt-0.5 text-xs text-text-tertiary">
                            Track topic, pattern, companies,
                            status and revision readiness.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-text-tertiary transition hover:text-text-primary"
                        aria-label="Close problem form"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4 px-6 py-5">
                    {error && (
                        <div className="rounded-xl border border-danger/10 bg-danger-muted px-4 py-2.5 text-sm text-danger">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className={labelClass}>
                            Problem title
                        </label>

                        <input
                            className={inputClass}
                            placeholder="Two Sum, LRU Cache, Number of Islands"
                            value={form.title}
                            onChange={(event) =>
                                updateForm(
                                    "title",
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                            <label className={labelClass}>
                                Topic
                            </label>

                            <select
                                className={inputClass}
                                value={form.topic}
                                onChange={(event) =>
                                    updateForm(
                                        "topic",
                                        event.target.value
                                    )
                                }
                            >
                                {TOPICS.map((topic) => (
                                    <option
                                        key={topic}
                                        value={topic}
                                    >
                                        {topic}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>
                                Pattern
                            </label>

                            <input
                                list="dsa-pattern-options"
                                className={inputClass}
                                placeholder="HashMap, Sliding Window..."
                                value={form.pattern ?? ""}
                                onChange={(event) =>
                                    updateForm(
                                        "pattern",
                                        event.target.value
                                    )
                                }
                            />

                            <datalist id="dsa-pattern-options">
                                {PATTERNS.map((pattern) => (
                                    <option
                                        key={pattern}
                                        value={pattern}
                                    />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                            <label className={labelClass}>
                                Difficulty
                            </label>

                            <select
                                className={inputClass}
                                value={form.difficulty}
                                onChange={(event) =>
                                    updateForm(
                                        "difficulty",
                                        event.target
                                            .value as DSADifficulty
                                    )
                                }
                            >
                                <option value="EASY">
                                    Easy
                                </option>
                                <option value="MEDIUM">
                                    Medium
                                </option>
                                <option value="HARD">
                                    Hard
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>
                                Status
                            </label>

                            <select
                                className={inputClass}
                                value={form.status}
                                onChange={(event) =>
                                    updateForm(
                                        "status",
                                        event.target
                                            .value as DSAStatus
                                    )
                                }
                            >
                                <option value="UNSOLVED">
                                    Unsolved
                                </option>
                                <option value="ATTEMPTED">
                                    Attempted
                                </option>
                                <option value="SOLVED">
                                    Solved
                                </option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                            <label className={labelClass}>
                                Platform
                            </label>

                            <input
                                className={inputClass}
                                placeholder="LeetCode, GFG, CodeStudio"
                                value={form.platform ?? ""}
                                onChange={(event) =>
                                    updateForm(
                                        "platform",
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Problem link
                            </label>

                            <input
                                className={inputClass}
                                placeholder="https://leetcode.com/problems/two-sum/"
                                value={form.problemUrl ?? ""}
                                onChange={(event) =>
                                    updateForm(
                                        "problemUrl",
                                        event.target.value
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>
                            Company tags
                        </label>

                        <input
                            className={inputClass}
                            placeholder="Amazon, Google, Microsoft"
                            value={companiesText}
                            onChange={(event) =>
                                setCompaniesText(
                                    event.target.value
                                )
                            }
                        />

                        <p className="mt-1.5 text-xs text-text-tertiary">
                            Separate multiple companies using
                            commas.
                        </p>
                    </div>

                    <div>
                        <label className={labelClass}>
                            Notes
                        </label>

                        <textarea
                            className={`${inputClass} min-h-24 resize-none`}
                            placeholder="Approach, mistakes, complexity, revision notes..."
                            value={form.notes ?? ""}
                            onChange={(event) =>
                                updateForm(
                                    "notes",
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    {problem?.source === "LEETCODE" && (
                        <div className="rounded-xl border border-brand/20 bg-brand-muted px-4 py-3 text-xs text-brand">
                            Imported from LeetCode. Your pattern,
                            company tags and notes remain editable.
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 flex gap-3 border-t border-border bg-bg-secondary px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 rounded-xl border border-border bg-transparent py-2.5 text-sm font-medium text-text-secondary transition hover:border-border-hover hover:text-text-primary disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Save size={15} />

                        {loading
                            ? isEditing
                                ? "Saving..."
                                : "Adding..."
                            : isEditing
                                ? "Save Changes"
                                : "Add Problem"}
                    </button>
                </div>
            </div>
        </div>
    );
};

