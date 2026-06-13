import { useState } from 'react'
import { X } from 'lucide-react'
import { dsaService, DSAProblem } from '../../services/dsa.service'

const TOPICS = [
    'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue',
    'Trees', 'Graphs', 'Dynamic Programming', 'Recursion',
    'Binary Search', 'Sorting', 'Hashing', 'Greedy', 'Math'
]

interface Props {
    onClose: () => void
    onAdded: (problem: DSAProblem) => void
}

export const AddProblemModal = ({ onClose, onAdded }: Props) => {
    const [form, setForm] = useState({
        title: '',
        topic: 'Arrays',
        difficulty: 'MEDIUM',
        status: 'UNSOLVED',
        platform: '',
        notes: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
        if (!form.title.trim()) {
            setError('Problem title required')
            return
        }
        setLoading(true)
        setError('')
        try {
            const { data } = await dsaService.add(form)
            onAdded(data.problem)
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to add problem')
        } finally {
            setLoading(false)
        }
    }

    const inputClass =
        'w-full bg-[#1A1A24] border border-[#1E1E2E] rounded-xl px-4 py-2.5 ' +
        'text-[#F1F1F5] text-sm focus:outline-none focus:border-[#6366F1] transition'

    const labelClass =
        'text-xs font-medium text-[#9090A8] mb-1.5 block uppercase tracking-wide'

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center
                    justify-center z-50 p-4">
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl
                      w-full max-w-md shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4
                        border-b border-[#1E1E2E]">
                    <h3 className="text-base font-semibold text-[#F1F1F5]">
                        Add DSA Problem
                    </h3>
                    <button onClick={onClose}
                        className="text-[#5A5A72] hover:text-[#F1F1F5] transition">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="bg-[#EF444415] border border-[#EF444430]
                            text-[#EF4444] text-sm rounded-xl px-4 py-2.5">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className={labelClass}>Problem Title</label>
                        <input
                            className={inputClass}
                            placeholder="e.g. Two Sum, LRU Cache"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                        />
                    </div>

                    {/* Topic + Difficulty */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Topic</label>
                            <select
                                className={inputClass}
                                value={form.topic}
                                onChange={e => setForm({ ...form, topic: e.target.value })}
                            >
                                {TOPICS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Difficulty</label>
                            <select
                                className={inputClass}
                                value={form.difficulty}
                                onChange={e => setForm({ ...form, difficulty: e.target.value })}
                            >
                                <option value="EASY">Easy</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HARD">Hard</option>
                            </select>
                        </div>
                    </div>

                    {/* Status + Platform */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Status</label>
                            <select
                                className={inputClass}
                                value={form.status}
                                onChange={e => setForm({ ...form, status: e.target.value })}
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
                                placeholder="LeetCode, GFG..."
                                value={form.platform}
                                onChange={e => setForm({ ...form, platform: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className={labelClass}>Notes (optional)</label>
                        <textarea
                            className={inputClass + ' resize-none'}
                            rows={2}
                            placeholder="Approach, time complexity..."
                            value={form.notes}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#1E1E2E] flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 bg-transparent border border-[#1E1E2E]
                       hover:border-[#2E2E42] text-[#9090A8] hover:text-[#F1F1F5]
                       rounded-xl py-2.5 text-sm font-medium transition cursor-pointer">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50
                       text-white rounded-xl py-2.5 text-sm font-medium
                       transition cursor-pointer">
                        {loading ? 'Adding...' : 'Add Problem'}
                    </button>
                </div>
            </div>
        </div>
    )
}