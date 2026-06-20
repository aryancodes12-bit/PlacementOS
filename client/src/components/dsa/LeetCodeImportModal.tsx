import { useMemo, useState } from "react";
import {
    CheckCircle2,
    Download,
    ExternalLink,
    Loader2,
    RefreshCw,
    X,
} from "lucide-react";

import { dsaService } from "../../services/dsa.service";

import type {
    DSADifficulty,
    LeetCodeImportResult,
    LeetCodePreview,
    LeetCodePreviewSubmission,
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
    "General",
];

const PATTERNS = [
    "",
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

type EditableSubmission = Omit<
    LeetCodePreviewSubmission,
    "difficulty"
> & {
    difficulty: DSADifficulty;
    topic: string;
    pattern: string;
    selected: boolean;
    skipReason?: string;
};

interface LeetCodeImportModalProps {
    onClose: () => void;
    onImported: () => Promise<void> | void;
}

const extractUsername = (value: string) => {
    const trimmed = value.trim();

    const profileMatch = trimmed.match(
        /leetcode\.com\/u\/([^/?#]+)/i
    );

    if (profileMatch?.[1]) {
        return profileMatch[1];
    }

    return trimmed
        .replace(/^@/, "")
        .replace(/\/+$/, "");
};

const formatAcceptedDate = (
    value: string | null
) => {
    if (!value) return "Date unavailable";

    return new Date(value).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
        }
    );
};

const difficultyStyle: Record<
    DSADifficulty,
    string
> = {
    EASY: "text-success",
    MEDIUM: "text-warning",
    HARD: "text-danger",
};

export const LeetCodeImportModal = ({
    onClose,
    onImported,
}: LeetCodeImportModalProps) => {
    const [usernameInput, setUsernameInput] =
        useState("");

    const [preview, setPreview] =
        useState<LeetCodePreview | null>(null);

    const [rows, setRows] = useState<
        EditableSubmission[]
    >([]);

    const [previewing, setPreviewing] =
        useState(false);

    const [importing, setImporting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [result, setResult] =
        useState<LeetCodeImportResult | null>(
            null
        );

    const inputClass =
        "w-full rounded-xl border border-border bg-bg-tertiary px-3 py-2.5 " +
        "text-sm text-text-primary placeholder-text-tertiary " +
        "transition focus:border-brand focus:outline-none";

    const importableRows = useMemo(
        () =>
            rows.filter(
                (row) =>
                    !row.alreadyImported &&
                    !row.skipReason
            ),
        [rows]
    );

    const selectedRows = useMemo(
        () =>
            importableRows.filter(
                (row) => row.selected
            ),
        [importableRows]
    );

    const allImportableSelected =
        importableRows.length > 0 &&
        importableRows.every(
            (row) => row.selected
        );

    const updateRow = (
        externalId: string,
        changes: Partial<EditableSubmission>
    ) => {
        setRows((current) =>
            current.map((row) =>
                row.externalId === externalId
                    ? {
                        ...row,
                        ...changes,
                    }
                    : row
            )
        );
    };

    const handlePreview = async () => {
        const username =
            extractUsername(usernameInput);

        if (!username) {
            setError(
                "Enter a LeetCode username or profile URL."
            );
            return;
        }

        setPreviewing(true);
        setError("");
        setResult(null);

        try {
            const { data } =
                await dsaService.previewLeetCode({
                    username,
                    limit: 20,
                });

            setUsernameInput(data.preview.username);
            setPreview(data.preview);

            setRows(
                data.preview.submissions.map(
                    (submission) => ({
                        ...submission,

                        difficulty:
                            submission.difficulty ??
                            "MEDIUM",

                        topic:
                            submission.suggestedTopic ||
                            "General",

                        pattern:
                            submission.suggestedPattern ??
                            "",

                        selected: false,
                    })
                )
            );
        } catch (err: any) {
            setPreview(null);
            setRows([]);

            setError(
                err.response?.data?.message ||
                "Failed to fetch LeetCode preview."
            );
        } finally {
            setPreviewing(false);
        }
    };

    const toggleSelectAll = () => {
        const nextSelected =
            !allImportableSelected;

        setRows((current) =>
            current.map((row) =>
                row.alreadyImported ||
                    row.skipReason
                    ? row
                    : {
                        ...row,
                        selected: nextSelected,
                    }
            )
        );
    };

    const handleImport = async () => {
        if (selectedRows.length === 0) {
            setError(
                "Select at least one problem to import."
            );
            return;
        }

        const username =
            extractUsername(usernameInput);

        setImporting(true);
        setError("");
        setResult(null);

        try {
            const { data } =
                await dsaService.importLeetCode({
                    username,

                    items: selectedRows.map(
                        (row) => ({
                            externalId:
                                row.externalId,

                            topic:
                                row.topic.trim() ||
                                "General",

                            pattern:
                                row.pattern.trim() ||
                                null,

                            difficulty:
                                row.difficulty,

                            notes:
                                "Imported from LeetCode accepted submissions.",
                        })
                    ),
                });

            setResult(data);

            const importedIds = new Set(
                data.imported
                    .map(
                        (problem) =>
                            problem.externalId
                    )
                    .filter(
                        (
                            externalId
                        ): externalId is string =>
                            Boolean(externalId)
                    )
            );

            const skippedReasons = new Map(
                data.skipped.map((item) => [
                    item.externalId,
                    item.reason,
                ])
            );

            setRows((current) =>
                current.map((row) => {
                    if (
                        importedIds.has(
                            row.externalId
                        )
                    ) {
                        return {
                            ...row,
                            selected: false,
                            alreadyImported: true,
                        };
                    }

                    const skipReason =
                        skippedReasons.get(
                            row.externalId
                        );

                    if (skipReason) {
                        return {
                            ...row,
                            selected: false,
                            skipReason,
                        };
                    }

                    return row;
                })
            );

            setPreview((current) =>
                current
                    ? {
                        ...current,
                        importableCount:
                            Math.max(
                                0,
                                current.importableCount -
                                data.summary.imported -
                                data.summary.skipped
                            ),
                    }
                    : current
            );

            await onImported();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Failed to import selected problems."
            );
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-bg-secondary shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Download
                                size={18}
                                className="text-brand"
                            />

                            <h2 className="text-base font-semibold text-text-primary">
                                Import from LeetCode
                            </h2>
                        </div>

                        <p className="mt-1 text-xs text-text-tertiary">
                            Preview recent accepted
                            submissions and choose which
                            problems to track.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={importing}
                        className="text-text-tertiary transition hover:text-text-primary disabled:opacity-50"
                        aria-label="Close LeetCode import"
                    >
                        <X size={19} />
                    </button>
                </div>

                <div className="overflow-y-auto">
                    <div className="space-y-5 p-6">
                        <div className="flex flex-col gap-3 md:flex-row">
                            <input
                                className={`${inputClass} flex-1`}
                                placeholder="LeetCode username or profile URL"
                                value={usernameInput}
                                onChange={(event) =>
                                    setUsernameInput(
                                        event.target.value
                                    )
                                }
                                onKeyDown={(event) => {
                                    if (
                                        event.key === "Enter" &&
                                        !previewing
                                    ) {
                                        handlePreview();
                                    }
                                }}
                            />

                            <button
                                type="button"
                                onClick={handlePreview}
                                disabled={
                                    previewing || importing
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {previewing ? (
                                    <Loader2
                                        size={15}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <RefreshCw size={15} />
                                )}

                                {previewing
                                    ? "Fetching..."
                                    : preview
                                        ? "Refresh Preview"
                                        : "Preview"}
                            </button>
                        </div>

                        <p className="text-xs text-text-tertiary">
                            This is a best-effort integration.
                            PlacementOS remains fully usable
                            without LeetCode.
                        </p>

                        {error && (
                            <div className="rounded-xl border border-danger/20 bg-danger-muted px-4 py-3 text-sm text-danger">
                                {error}
                            </div>
                        )}

                        {result && (
                            <div className="rounded-xl border border-success/20 bg-success-muted px-4 py-3">
                                <p className="text-sm font-medium text-success">
                                    {result.message}
                                </p>

                                <p className="mt-1 text-xs text-text-secondary">
                                    Imported{" "}
                                    {result.summary.imported} ·
                                    Skipped{" "}
                                    {result.summary.skipped}
                                    {result.readiness
                                        ? ` · DSA score ${result.readiness.dsaScore}/100`
                                        : ""}
                                </p>
                            </div>
                        )}

                        {preview && (
                            <>
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                                    {[
                                        {
                                            label: "Total solved",
                                            value:
                                                preview.solvedStats
                                                    .total,
                                        },
                                        {
                                            label: "Easy",
                                            value:
                                                preview.solvedStats
                                                    .easy,
                                        },
                                        {
                                            label: "Medium",
                                            value:
                                                preview.solvedStats
                                                    .medium,
                                        },
                                        {
                                            label: "Hard",
                                            value:
                                                preview.solvedStats
                                                    .hard,
                                        },
                                        {
                                            label: "Importable",
                                            value:
                                                rows.filter(
                                                    (row) =>
                                                        !row.alreadyImported &&
                                                        !row.skipReason
                                                ).length,
                                        },
                                    ].map((stat) => (
                                        <div
                                            key={stat.label}
                                            className="rounded-xl border border-border bg-bg-tertiary p-3"
                                        >
                                            <p className="text-xl font-bold text-text-primary">
                                                {stat.value}
                                            </p>

                                            <p className="mt-1 text-xs uppercase tracking-wide text-text-tertiary">
                                                {stat.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">
                                            Recent accepted
                                            submissions
                                        </p>

                                        <p className="mt-1 text-xs text-text-tertiary">
                                            Edit topic and pattern
                                            before importing.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={toggleSelectAll}
                                        disabled={
                                            importableRows.length ===
                                            0
                                        }
                                        className="text-xs font-medium text-brand transition hover:underline disabled:text-text-tertiary disabled:no-underline"
                                    >
                                        {allImportableSelected
                                            ? "Clear selection"
                                            : "Select all importable"}
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {rows.map((row) => {
                                        const disabled =
                                            row.alreadyImported ||
                                            Boolean(row.skipReason);

                                        return (
                                            <div
                                                key={row.externalId}
                                                className={`rounded-xl border p-4 transition ${row.selected
                                                    ? "border-brand bg-brand-muted/30"
                                                    : "border-border bg-bg-tertiary"
                                                    } ${disabled
                                                        ? "opacity-70"
                                                        : ""
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            row.selected
                                                        }
                                                        disabled={disabled}
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateRow(
                                                                row.externalId,
                                                                {
                                                                    selected:
                                                                        event
                                                                            .target
                                                                            .checked,
                                                                }
                                                            )
                                                        }
                                                        className="mt-1 h-4 w-4 accent-brand"
                                                    />

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="truncate text-sm font-semibold text-text-primary">
                                                                        {row.title}
                                                                    </p>

                                                                    <a
                                                                        href={
                                                                            row.problemUrl
                                                                        }
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="shrink-0 text-text-tertiary transition hover:text-brand"
                                                                    >
                                                                        <ExternalLink
                                                                            size={
                                                                                13
                                                                            }
                                                                        />
                                                                    </a>
                                                                </div>

                                                                <p className="mt-1 text-xs text-text-tertiary">
                                                                    Accepted{" "}
                                                                    {formatAcceptedDate(
                                                                        row.acceptedAt
                                                                    )}
                                                                </p>
                                                            </div>

                                                            {row.alreadyImported ? (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-success-muted px-2.5 py-1 text-xs font-medium text-success">
                                                                    <CheckCircle2
                                                                        size={12}
                                                                    />
                                                                    Imported
                                                                </span>
                                                            ) : row.skipReason ? (
                                                                <span className="rounded-full bg-warning-muted px-2.5 py-1 text-xs font-medium text-warning">
                                                                    {row.skipReason
                                                                        .replaceAll(
                                                                            "_",
                                                                            " "
                                                                        )
                                                                        .toLowerCase()}
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    className={`text-xs font-semibold ${difficultyStyle[row.difficulty]}`}
                                                                >
                                                                    {
                                                                        row.difficulty
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                                                            <div>
                                                                <label className="mb-1 block text-[10px] uppercase tracking-wide text-text-tertiary">
                                                                    Topic
                                                                </label>

                                                                <select
                                                                    className={inputClass}
                                                                    value={
                                                                        row.topic
                                                                    }
                                                                    disabled={
                                                                        disabled
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) =>
                                                                        updateRow(
                                                                            row.externalId,
                                                                            {
                                                                                topic:
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                            }
                                                                        )
                                                                    }
                                                                >
                                                                    {TOPICS.map(
                                                                        (
                                                                            topic
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    topic
                                                                                }
                                                                                value={
                                                                                    topic
                                                                                }
                                                                            >
                                                                                {
                                                                                    topic
                                                                                }
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </div>

                                                            <div>
                                                                <label className="mb-1 block text-[10px] uppercase tracking-wide text-text-tertiary">
                                                                    Pattern
                                                                </label>

                                                                <select
                                                                    className={inputClass}
                                                                    value={
                                                                        row.pattern
                                                                    }
                                                                    disabled={
                                                                        disabled
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) =>
                                                                        updateRow(
                                                                            row.externalId,
                                                                            {
                                                                                pattern:
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                            }
                                                                        )
                                                                    }
                                                                >
                                                                    {PATTERNS.map(
                                                                        (
                                                                            pattern
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    pattern ||
                                                                                    "none"
                                                                                }
                                                                                value={
                                                                                    pattern
                                                                                }
                                                                            >
                                                                                {pattern ||
                                                                                    "No pattern"}
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </div>

                                                            <div>
                                                                <label className="mb-1 block text-[10px] uppercase tracking-wide text-text-tertiary">
                                                                    Difficulty
                                                                </label>

                                                                <select
                                                                    className={inputClass}
                                                                    value={
                                                                        row.difficulty
                                                                    }
                                                                    disabled={
                                                                        disabled
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) =>
                                                                        updateRow(
                                                                            row.externalId,
                                                                            {
                                                                                difficulty:
                                                                                    event
                                                                                        .target
                                                                                        .value as DSADifficulty,
                                                                            }
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
                                                        </div>

                                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                                            {row.tags
                                                                .slice(0, 6)
                                                                .map(
                                                                    (tag) => (
                                                                        <span
                                                                            key={
                                                                                tag
                                                                            }
                                                                            className="rounded-md bg-bg-secondary px-2 py-1 text-[10px] text-text-tertiary"
                                                                        >
                                                                            {tag}
                                                                        </span>
                                                                    )
                                                                )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border bg-bg-secondary px-6 py-4">
                    <p className="text-xs text-text-tertiary">
                        {selectedRows.length} problem
                        {selectedRows.length === 1
                            ? ""
                            : "s"}{" "}
                        selected
                    </p>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={importing}
                            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition hover:border-border-hover hover:text-text-primary disabled:opacity-50"
                        >
                            Close
                        </button>

                        <button
                            type="button"
                            onClick={handleImport}
                            disabled={
                                importing ||
                                selectedRows.length === 0
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {importing ? (
                                <Loader2
                                    size={15}
                                    className="animate-spin"
                                />
                            ) : (
                                <Download size={15} />
                            )}

                            {importing
                                ? "Importing..."
                                : `Import ${selectedRows.length}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};