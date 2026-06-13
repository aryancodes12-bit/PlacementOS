import { useState } from "react";
import { X } from "lucide-react";

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
    "Math",
];

interface AddProblemModalProps {
    onClose: () => void;
    onAdded: (problem: DSAProblem) => void;
}

export const AddProblemModal = ({ onClose, onAdded }: AddProblemModalProps) => {
    const [form, setForm] = useState<CreateDSAProblemInput>({
        title: "",
        topic: "Arrays",
        difficulty: "MEDIUM",
        status: "UNSOLVED",
        platform: "",
        problemUrl: "",
        notes: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const inputClass =
        "w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 " +
        "text-text-primary placeholder-text-tertiary text-sm " +
        "focus:outline-none focus:border-brand transition";

    const labelClass =
        "text-xs font-medium text-text-secondary mb-1.5 block uppercase tracking-wide";

    const handleSubmit = async () => {
        if (!form.title.trim()) {
            setError("Problem title is required");
            return;
        }

        if (!form.topic.trim()) {
            setError("Topic is required");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const { data } = await dsaService.add({
                ...form,
                title: form.title.trim(),
                topic: form.topic.trim(),
                platform: form.platform?.trim(),
                problemUrl: form.problemUrl?.trim(),
                notes: form.notes?.trim(),
            });

            onAdded(data.problem);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to add problem");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-bg-secondary border border-border rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                        <h3 className="text-base font-semibold text-text-primary">
                            Add DSA Problem
                        </h3>
                        <p className="text-xs text-text-tertiary mt-0.5">
                            Track one problem with topic, difficulty, status, and link.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-text-tertiary hover:text-text-primary transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="bg-danger-muted border border-danger/10 text-danger text-sm rounded-xl px-4 py-2.5">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className={labelClass}>Problem Title</label>
                        <input
                            className={inputClass}
                            placeholder="Two Sum, LRU Cache, Number of Islands"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Topic</label>
                            <select
                                className={inputClass}
                                value={form.topic}
                                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                            >
                                {TOPICS.map((topic) => (
                                    <option key={topic} value={topic}>
                                        {topic}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Difficulty</label>
                            <select
                                className={inputClass}
                                value={form.difficulty}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        difficulty: e.target.value as DSADifficulty,
                                    })
                                }
                            >
                                <option value="EASY">Easy</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HARD">Hard</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Status</label>
                            <select
                                className={inputClass}
                                value={form.status}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        status: e.target.value as DSAStatus,
                                    })
                                }
                            >
                                <option value="UNSOLVED">Unsolved</option>
                                <option value="ATTEMPTED">Attempted</option>
                                <option value="SOLVED">Solved</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Platform</label>
                            <input
                                className={inputClass}
                                placeholder="LeetCode, GFG, CodeStudio"
                                value={form.platform}
                                onChange={(e) =>
                                    setForm({ ...form, platform: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Problem Link</label>
                        <input
                            className={inputClass}
                            placeholder="https://leetcode.com/problems/two-sum/"
                            value={form.problemUrl}
                            onChange={(e) =>
                                setForm({ ...form, problemUrl: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Notes</label>
                        <textarea
                            className={`${inputClass} resize-none min-h-20`}
                            placeholder="Approach, mistakes, time complexity..."
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-border flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-transparent border border-border hover:border-border-hover text-text-secondary hover:text-text-primary rounded-xl py-2.5 text-sm font-medium transition"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-2.5 text-sm font-medium transition"
                    >
                        {loading ? "Adding..." : "Add Problem"}
                    </button>
                </div>
            </div>
        </div>
    );
};