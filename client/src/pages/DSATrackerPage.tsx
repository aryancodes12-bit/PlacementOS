import { useState, useEffect } from 'react'
import { AppLayout } from '../components/ui/AppLayout'
import { AddProblemModal } from '../components/dsa/AddProblemModal'
import { dsaService, DSAProblem, DSAStats } from '../services/dsa.service'
import {
    Plus, Search, Trash2, CheckCircle2,
    Circle, Clock, Flame, Code2
} from 'lucide-react'

const TOPICS = [
    'All', 'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue',
    'Trees', 'Graphs', 'Dynamic Programming', 'Recursion',
    'Binary Search', 'Sorting', 'Hashing', 'Greedy', 'Math'
]

const difficultyStyle = {
    EASY: 'bg-[#22C55E15] text-[#22C55E]',
    MEDIUM: 'bg-[#F59E0B15] text-[#F59E0B]',
    HARD: 'bg-[#EF444415] text-[#EF4444]',
}

const statusIcon = {
    SOLVED: <CheckCircle2 size={15} className="text-[#22C55E]" />,
    ATTEMPTED: <Clock size={15} className="text-[#F59E0B]" />,
    UNSOLVED: <Circle size={15} className="text-[#5A5A72]" />,
}

export const DSATrackerPage = () => {
    const [problems, setProblems] = useState<DSAProblem[]>([])
    const [stats, setStats] = useState<DSAStats | null>(null)
    const [streak, setStreak] = useState(0)
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [search, setSearch] = useState('')
    const [topicFilter, setTopicFilter] = useState('All')
    const [diffFilter, setDiffFilter] = useState('All')
    const [statusFilter, setStatusFilter] = useState('All')

    const fetchProblems = async () => {
        setLoading(true)
        try {
            const { data } = await dsaService.getAll({
                ...(topicFilter !== 'All' && { topic: topicFilter }),
                ...(diffFilter !== 'All' && { difficulty: diffFilter }),
                ...(statusFilter !== 'All' && { status: statusFilter }),
                ...(search.trim() && { search: search.trim() }),
            })
            setProblems(data.problems)
            setStats(data.stats)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchStreak = async () => {
        try {
            const { data } = await dsaService.getStreak()
            setStreak(data.currentStreak)
        } catch { }
    }

    useEffect(() => {
        fetchProblems()
    }, [topicFilter, diffFilter, statusFilter, search])

    useEffect(() => {
        fetchStreak()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this problem?')) return
        try {
            await dsaService.delete(id)
            setProblems(prev => prev.filter(p => p.id !== id))
        } catch { }
    }

    const handleStatusToggle = async (problem: DSAProblem) => {
        const next = {
            UNSOLVED: 'ATTEMPTED',
            ATTEMPTED: 'SOLVED',
            SOLVED: 'UNSOLVED',
        }[problem.status] as DSAProblem['status']

        try {
            const { data } = await dsaService.update(problem.id, { status: next })
            setProblems(prev =>
                prev.map(p => p.id === problem.id ? data.problem : p)
            )
        } catch { }
    }

    return (
        <AppLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-[#F1F1F5]">DSA Tracker</h2>
                    <p className="text-[#9090A8] text-sm mt-0.5">
                        Track your problem solving progress
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2.5
                     rounded-xl text-sm font-medium transition flex items-center
                     gap-2 cursor-pointer"
                >
                    <Plus size={15} />
                    Add Problem
                </button>
            </div>

            {/* Stat Cards */}
            {stats && (
                <div className="grid grid-cols-5 gap-3 mb-6">
                    {[
                        { label: 'Total', value: stats.total, color: 'text-[#F1F1F5]' },
                        { label: 'Solved', value: stats.solved, color: 'text-[#22C55E]' },
                        { label: 'Attempted', value: stats.attempted, color: 'text-[#F59E0B]' },
                        { label: 'Unsolved', value: stats.unsolved, color: 'text-[#5A5A72]' },
                        { label: '🔥 Streak', value: `${streak}d`, color: 'text-[#F59E0B]' },
                    ].map(({ label, value, color }) => (
                        <div key={label}
                            className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-4">
                            <p className={`text-2xl font-bold ${color}`}>{value}</p>
                            <p className="text-xs text-[#5A5A72] uppercase tracking-wide mt-1">
                                {label}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Difficulty breakdown */}
            {stats && (
                <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-6">
                        <p className="text-xs text-[#5A5A72] uppercase tracking-wide">
                            Difficulty
                        </p>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                            <span className="text-xs text-[#9090A8]">
                                Easy: {stats.byDifficulty.easy}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                            <span className="text-xs text-[#9090A8]">
                                Medium: {stats.byDifficulty.medium}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                            <span className="text-xs text-[#9090A8]">
                                Hard: {stats.byDifficulty.hard}
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="flex-1 h-2 bg-[#1A1A24] rounded-full overflow-hidden
                            flex ml-2">
                            {stats.total > 0 && <>
                                <div className="h-full bg-[#22C55E] transition-all"
                                    style={{ width: `${(stats.byDifficulty.easy / stats.total) * 100}%` }} />
                                <div className="h-full bg-[#F59E0B] transition-all"
                                    style={{ width: `${(stats.byDifficulty.medium / stats.total) * 100}%` }} />
                                <div className="h-full bg-[#EF4444] transition-all"
                                    style={{ width: `${(stats.byDifficulty.hard / stats.total) * 100}%` }} />
                            </>}
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                {/* Search */}
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2
                                        text-[#5A5A72]" />
                    <input
                        className="bg-[#111118] border border-[#1E1E2E] rounded-xl
                       pl-9 pr-4 py-2 text-sm text-[#F1F1F5]
                       placeholder-[#5A5A72] focus:outline-none
                       focus:border-[#6366F1] transition w-56"
                        placeholder="Search problems..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Topic filter */}
                <select
                    className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-3 py-2
                     text-sm text-[#9090A8] focus:outline-none focus:border-[#6366F1]
                     transition cursor-pointer"
                    value={topicFilter}
                    onChange={e => setTopicFilter(e.target.value)}
                >
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                {/* Difficulty filter */}
                <select
                    className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-3 py-2
                     text-sm text-[#9090A8] focus:outline-none focus:border-[#6366F1]
                     transition cursor-pointer"
                    value={diffFilter}
                    onChange={e => setDiffFilter(e.target.value)}
                >
                    <option value="All">All Difficulty</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                </select>

                {/* Status filter */}
                <select
                    className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-3 py-2
                     text-sm text-[#9090A8] focus:outline-none focus:border-[#6366F1]
                     transition cursor-pointer"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="All">All Status</option>
                    <option value="SOLVED">Solved</option>
                    <option value="ATTEMPTED">Attempted</option>
                    <option value="UNSOLVED">Unsolved</option>
                </select>

                <span className="text-xs text-[#5A5A72] ml-auto">
                    {problems.length} problems
                </span>
            </div>

            {/* Problems Table */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-12 px-4 py-3 border-b border-[#1E1E2E]
                        text-xs font-medium text-[#5A5A72] uppercase tracking-wide">
                    <div className="col-span-1">Status</div>
                    <div className="col-span-4">Problem</div>
                    <div className="col-span-2">Topic</div>
                    <div className="col-span-2">Difficulty</div>
                    <div className="col-span-2">Platform</div>
                    <div className="col-span-1 text-right">Action</div>
                </div>

                {/* Rows */}
                {loading ? (
                    <div className="space-y-0">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i}
                                className="h-14 bg-[#1A1A24] m-1 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : problems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Code2 size={32} className="text-[#2E2E42]" />
                        <p className="text-[#5A5A72] text-sm">No problems found</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-[#6366F1] text-sm hover:underline cursor-pointer"
                        >
                            Add your first problem
                        </button>
                    </div>
                ) : (
                    problems.map((problem, i) => (
                        <div
                            key={problem.id}
                            className={`grid grid-cols-12 px-4 py-3.5 items-center
                         hover:bg-[#1A1A24] transition-colors duration-100
                         ${i !== problems.length - 1
                                    ? 'border-b border-[#1E1E2E]' : ''}`}
                        >
                            {/* Status icon — click to cycle */}
                            <div className="col-span-1">
                                <button
                                    onClick={() => handleStatusToggle(problem)}
                                    className="cursor-pointer hover:scale-110 transition-transform"
                                    title="Click to change status"
                                >
                                    {statusIcon[problem.status]}
                                </button>
                            </div>

                            {/* Title */}
                            <div className="col-span-4">
                                <p className="text-sm font-medium text-[#F1F1F5] truncate">
                                    {problem.title}
                                </p>
                                {problem.notes && (
                                    <p className="text-xs text-[#5A5A72] truncate mt-0.5">
                                        {problem.notes}
                                    </p>
                                )}
                            </div>

                            {/* Topic */}
                            <div className="col-span-2">
                                <span className="text-xs text-[#9090A8] bg-[#1A1A24]
                                 px-2.5 py-1 rounded-lg">
                                    {problem.topic}
                                </span>
                            </div>

                            {/* Difficulty */}
                            <div className="col-span-2">
                                <span className={`text-xs font-medium px-2.5 py-1
                                  rounded-full ${difficultyStyle[problem.difficulty]}`}>
                                    {problem.difficulty}
                                </span>
                            </div>

                            {/* Platform */}
                            <div className="col-span-2">
                                <span className="text-xs text-[#5A5A72]">
                                    {problem.platform || '—'}
                                </span>
                            </div>

                            {/* Delete */}
                            <div className="col-span-1 flex justify-end">
                                <button
                                    onClick={() => handleDelete(problem.id)}
                                    className="text-[#5A5A72] hover:text-[#EF4444]
                             transition-colors cursor-pointer p-1"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <AddProblemModal
                    onClose={() => setShowModal(false)}
                    onAdded={(problem) => {
                        setProblems(prev => [problem, ...prev])
                        fetchStreak()
                    }}
                />
            )}
        </AppLayout>
    )
}