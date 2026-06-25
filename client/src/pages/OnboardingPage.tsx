import {
    useEffect,
    useRef,
    useState,
} from "react";
import {
    BrandLogo,
} from "../components/ui/BrandLogo";
import type {
    ReactNode,
} from "react";



import {

    ArrowRight,
    BarChart3,
    CalendarCheck2,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Code2,
    FileText,
    Gauge,
    LockKeyhole,
    Menu,
    Mic2,
    Play,
    RotateCcw,
    ShieldCheck,
    Sparkles,
    Target,
    TrendingUp,
    UploadCloud,
    Check,
    X,
    Zap,
} from "lucide-react";

import {
    Link,
} from "react-router-dom";

import {
    useAuthStore,
} from "../store/authStore";

interface RevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}
type PlaygroundTab =
    | "dsa"
    | "resume"
    | "interview"
    | "planner";

interface ResumeScanResult {
    score: number;
    matchRate: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    advice: string;
}

interface RecordingResult {
    rating: string;
    pacing: string;

    fillers: {
        um: number;
        like: number;
        right: number;
    };

    feedback: string;
}
const features = [
    {
        icon: Code2,
        title: "DSA intelligence",
        description:
            "Track solved problems, patterns, companies, revision intervals, and weak areas from one focused workspace.",
        metric: "Pattern-aware tracking",
    },
    {
        icon: FileText,
        title: "Resume intelligence",
        description:
            "Analyse ATS compatibility, role fit, project quality, keywords, and readability before applying.",
        metric: "Evidence-based scoring",
    },
    {
        icon: Mic2,
        title: "Interview Replay",
        description:
            "Record interview experiences, replay questions, analyse answers, and convert mistakes into action items.",
        metric: "AI-assisted reflection",
    },
    {
        icon: CalendarCheck2,
        title: "Daily preparation plan",
        description:
            "Receive a personalised daily plan using your revision queue, preparation gaps, and recent activity.",
        metric: "Adaptive execution",
    },
    {
        icon: Gauge,
        title: "Placement readiness",
        description:
            "Understand your readiness through weighted DSA, interview, and resume performance instead of guesswork.",
        metric: "One readiness signal",
    },
    {
        icon: ShieldCheck,
        title: "Privacy controls",
        description:
            "Review stored data, submit feedback, contact support, and permanently delete your account history.",
        metric: "User-controlled data",
    },
];

const stats = [
    {
        value: "45%",
        label: "DSA contribution",
        description:
            "Problem solving, pattern coverage, and revision discipline.",
    },
    {
        value: "30%",
        label: "Interview contribution",
        description:
            "Technical, communication, and confidence performance.",
    },
    {
        value: "25%",
        label: "Resume contribution",
        description:
            "ATS quality, role fit, keywords, and project strength.",
    },
    {
        value: "1",
        label: "Focused daily plan",
        description:
            "A clear preparation plan generated around current gaps.",
    },
];

const benefits = [
    {
        icon: Target,
        title: "Know exactly what to improve",
        description:
            "PlacementOS converts scattered preparation activity into visible weaknesses, priorities, and next actions.",
    },
    {
        icon: TrendingUp,
        title: "Measure progress over time",
        description:
            "Readiness history helps you understand whether your preparation is actually improving.",
    },
    {
        icon: Zap,
        title: "Reduce decision fatigue",
        description:
            "Instead of choosing between dozens of preparation tasks, start with a focused daily plan.",
    },
];

const navigationItems = [
    {
        label: "Features",
        href: "#features",
    },
    {
        label: "How it works",
        href: "#how-it-works",
    },
    {
        label: "Readiness",
        href: "#readiness",
    },
    {
        label: "Privacy",
        href: "#privacy",
    },
];

const Reveal = ({
    children,
    className = "",
    delay = 0,
}: RevealProps) => {
    const elementRef =
        useRef<HTMLDivElement | null>(null);

    const [visible, setVisible] =
        useState(false);

    useEffect(() => {
        const element = elementRef.current;

        if (!element) {
            return;
        }

        const prefersReducedMotion =
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;

        if (
            prefersReducedMotion ||
            !("IntersectionObserver" in window)
        ) {
            setVisible(true);
            return;
        }

        const observer =
            new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setVisible(true);
                        observer.disconnect();
                    }
                },
                {
                    threshold: 0.12,
                    rootMargin: "0px 0px -40px 0px",
                }
            );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div
            ref={elementRef}
            style={{
                transitionDelay: `${delay}ms`,
            }}
            className={[
                "transition-all duration-700 ease-out",
                visible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-6 opacity-0",
                className,
            ].join(" ")}
        >
            {children}
        </div>
    );
};

const Logo = () => {
    return (
        <Link
            to="/"
            className="inline-flex items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            aria-label="PlacementOS home"
        >
            <BrandLogo
                variant="navbar"
                priority
            />
        </Link>
    );
};
export const HeroScoreSimulator = () => {
    const [dsa, setDsa] = useState(68);
    const [interview, setInterview] = useState(72);
    const [resume, setResume] = useState(84);

    const readinessScore = Math.round(
        dsa * 0.45 + interview * 0.3 + resume * 0.25
    );

    const getDynamicTasks = () => {
        const minVal = Math.min(dsa, interview, resume);
        if (minVal === dsa) {
            return [
                "Solve 2 Medium Sliding Window problems",
                "Review Heap data structure patterns",
                "Revise weak DSA tags (Graphs/Trees)",
            ];
        } else if (minVal === interview) {
            return [
                "Replay one technical answer recording",
                "Practice STAR method for past projects",
                "Review behavioral questions template",
            ];
        } else {
            return [
                "Improve resume work experience metrics",
                "Align keywords with software engineer role",
                "Verify resume formatting and readability",
            ];
        }
    };

    const handleReset = () => {
        setDsa(68);
        setInterview(72);
        setResume(84);
    };

    return (
        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div
                className="absolute inset-10 rounded-full bg-indigo-500/20 blur-[90px]"
                aria-hidden="true"
            />

            <div className="relative rounded-[28px] border border-white/10 bg-[#0d1222]/90 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl transition hover:border-indigo-500/20">
                <div className="rounded-[22px] border border-white/[0.07] bg-[#090d19] p-5 sm:p-6">
                    <div className="flex items-center justify-between border-b border-white/[0.07] pb-5">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Interactive Simulator
                            </p>
                            <h3 className="mt-1 text-base font-bold text-white">
                                Placement Readiness
                            </h3>
                        </div>

                        <div className="flex flex-col items-end">
                            <div className="flex items-end gap-1.5">
                                <span className="text-4xl font-extrabold tracking-tight text-indigo-400">
                                    {readinessScore}
                                </span>
                                <span className="pb-1 text-sm text-slate-500">
                                    / 100
                                </span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-0.5">
                                Weighted Score
                            </span>
                        </div>
                    </div>

                    <div className="mt-5 space-y-4">
                        <div>
                            <div className="flex justify-between text-xs font-medium mb-1.5">
                                <span className="text-indigo-300">
                                    DSA Prep (45%)
                                </span>
                                <span className="text-white font-semibold">
                                    {dsa}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={dsa}
                                onChange={(e) =>
                                    setDsa(Number(e.target.value))
                                }
                                className="w-full h-1.5 rounded-full bg-white/[0.08] appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                                aria-label="DSA Preparation Score"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-medium mb-1.5">
                                <span className="text-violet-300">
                                    Interview Prep (30%)
                                </span>
                                <span className="text-white font-semibold">
                                    {interview}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={interview}
                                onChange={(e) =>
                                    setInterview(Number(e.target.value))
                                }
                                className="w-full h-1.5 rounded-full bg-white/[0.08] appearance-none cursor-pointer accent-violet-500 focus:outline-none"
                                aria-label="Interview Preparation Score"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-medium mb-1.5">
                                <span className="text-emerald-300">
                                    Resume ATS (25%)
                                </span>
                                <span className="text-white font-semibold">
                                    {resume}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={resume}
                                onChange={(e) =>
                                    setResume(Number(e.target.value))
                                }
                                className="w-full h-1.5 rounded-full bg-white/[0.08] appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                                aria-label="Resume ATS Score"
                            />
                        </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                        <button
                            onClick={handleReset}
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-indigo-400 transition"
                        >
                            <RotateCcw size={10} />
                            Reset variables
                        </button>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles
                                    size={14}
                                    className="text-indigo-300 animate-pulse"
                                />
                                <p className="text-xs font-semibold text-white">
                                    Today&apos;s Recommended Plan
                                </p>
                            </div>
                            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9px] font-semibold text-indigo-300 uppercase tracking-wider">
                                Adaptive
                            </span>
                        </div>

                        <div className="mt-3 space-y-2">
                            {getDynamicTasks().map((task, idx) => (
                                <div
                                    key={task}
                                    className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-[#090d19] px-3 py-2.5 transition duration-300 hover:border-white/10"
                                >
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-[10px] font-bold text-indigo-300">
                                        {idx + 1}
                                    </span>
                                    <span className="text-xs text-slate-300">
                                        {task}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-400/10 bg-emerald-500/[0.06] px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            <TrendingUp
                                size={14}
                                className="text-emerald-400"
                            />
                            <span className="text-xs font-medium text-emerald-200">
                                Readiness rating
                            </span>
                        </div>
                        <span className="text-xs font-bold text-emerald-400">
                            {readinessScore > 80
                                ? "Highly Competitive"
                                : readinessScore > 65
                                    ? "Getting Ready"
                                    : "Needs Improvement"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PlatformPlayground = () => {
    const [
        activeTab,
        setActiveTab,
    ] = useState<PlaygroundTab>("dsa");
    const playgroundTabs = [
        {
            id: "dsa",
            label: "DSA Intelligence",
            icon: Code2,
        },
        {
            id: "resume",
            label: "Resume AI",
            icon: FileText,
        },
        {
            id: "interview",
            label: "Interview Sandbox",
            icon: Mic2,
        },
        {
            id: "planner",
            label: "Daily Planner",
            icon: CalendarCheck2,
        },
    ] as const;
    const [dsaProblems, setDsaProblems] = useState([
        {
            id: 1,
            title: "Two Sum (Array Hash)",
            difficulty: "Easy",
            solved: true,
        },
        {
            id: 2,
            title: "Course Schedule (Graphs)",
            difficulty: "Medium",
            solved: false,
        },
        {
            id: 3,
            title: "LRU Cache (Design)",
            difficulty: "Hard",
            solved: false,
        },
    ]);
    const solvedCount = dsaProblems.filter((p) => p.solved).length;
    const dsaProgress = Math.round((solvedCount / dsaProblems.length) * 100);

    const toggleDsaProblem = (id: number) => {
        setDsaProblems(
            dsaProblems.map((p) =>
                p.id === id ? { ...p, solved: !p.solved } : p
            )
        );
    };

    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [
        scanResult,
        setScanResult,
    ] = useState<ResumeScanResult | null>(
        null
    );

    const runResumeScan = () => {
        setIsScanning(true);
        setScanProgress(0);
        setScanResult(null);

        const interval = setInterval(() => {
            setScanProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsScanning(false);
                    setScanResult({
                        score: 83,
                        matchRate: 88,
                        matchedKeywords: [
                            "React",
                            "TypeScript",
                            "Node.js",
                            "SQL",
                            "Git",
                        ],
                        missingKeywords: ["Docker", "Redis", "CI/CD"],
                        advice: "Your descriptions are action-oriented, but backend deployment keywords are missing. Add Redis or Docker experience details.",
                    });
                    return 100;
                }
                return prev + 5;
            });
        }, 80);
    };

    const [isRecording, setIsRecording] = useState(false);
    const [
        recordingResult,
        setRecordingResult,
    ] = useState<RecordingResult | null>(
        null
    );
    const [waveHeight, setWaveHeight] = useState<number[]>([
        12, 24, 18, 32, 10, 22, 15, 28, 8,
    ]);

    useEffect(() => {
        let interval:
            | ReturnType<typeof setInterval>
            | undefined;
        if (isRecording) {
            interval = setInterval(() => {
                setWaveHeight(
                    Array.from(
                        { length: 12 },
                        () => Math.floor(Math.random() * 35) + 5
                    )
                );
            }, 150);
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isRecording]);

    const startRecording = () => {
        setIsRecording(true);
        setRecordingResult(null);

        setTimeout(() => {
            setIsRecording(false);
            setRecordingResult({
                rating: "4.4/5.0",
                pacing: "140 Words Per Minute (Optimal)",
                fillers: { um: 2, like: 1, right: 0 },
                feedback:
                    "Excellent explanation of index optimization using the STAR method. Pacing is smooth. Try to pause instead of using the filler 'um'.",
            });
        }, 3000);
    };

    const [plannerTasks, setPlannerTasks] = useState([
        {
            id: 1,
            text: "Solve 1 Medium Binary Tree problem",
            completed: false,
        },
        {
            id: 2,
            text: "Improve resume project achievements",
            completed: false,
        },
        {
            id: 3,
            text: "Replay one behavioral answer",
            completed: false,
        },
    ]);
    const plannerProgress = Math.round(
        (plannerTasks.filter((t) => t.completed).length /
            plannerTasks.length) *
        100
    );

    const togglePlannerTask = (id: number) => {
        setPlannerTasks(
            plannerTasks.map((t) =>
                t.id === id ? { ...t, completed: !t.completed } : t
            )
        );
    };

    return (
        <div className="w-full">
            <div className="flex flex-wrap gap-2 justify-center border-b border-white/[0.07] pb-6 mb-8">
                {playgroundTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() =>
                                setActiveTab(tab.id)
                            }
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${isActive
                                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]"
                                }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
                <div className="space-y-4 text-left">
                    {activeTab === "dsa" && (
                        <>
                            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                                <Code2 size={18} />
                            </div>
                            <h3 className="text-2xl font-bold text-white">
                                Complete DSA preparation tracking
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Never forget patterns. Track problems by
                                patterns (Two Pointers, Graph DFS, Sliding
                                Window) instead of random LeetCode lists.
                                PlacementOS reminds you when it's time to
                                revise.
                            </p>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2
                                        size={14}
                                        className="text-emerald-400"
                                    />
                                    <span>
                                        Track by 18 key patterns, not just list
                                        size
                                    </span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2
                                        size={14}
                                        className="text-emerald-400"
                                    />
                                    <span>
                                        Built-in spaced repetition reminders
                                    </span>
                                </li>
                            </ul>
                        </>
                    )}

                    {activeTab === "resume" && (
                        <>
                            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                                <FileText size={18} />
                            </div>
                            <h3 className="text-2xl font-bold text-white">
                                AI-Powered ATS compatibility analysis
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Get immediate keyword feedback and structural
                                scoring. Our analyzer extracts terms and
                                identifies missing core keywords that automated
                                screening systems search for.
                            </p>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2
                                        size={14}
                                        className="text-emerald-400"
                                    />
                                    <span>
                                        Real-time ATS keyword matching and
                                        parsing
                                    </span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2
                                        size={14}
                                        className="text-emerald-400"
                                    />
                                    <span>
                                        Actionable suggestions for project
                                        bullet points
                                    </span>
                                </li>
                            </ul>
                        </>
                    )}

                    {activeTab === "interview" && (
                        <>
                            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300">
                                <Mic2 size={18} />
                            </div>
                            <h3 className="text-2xl font-bold text-white">
                                Sandbox interview communication replay
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Record your audio, replay your answer, and
                                receive analysis on structural clarity, filler
                                word usage (like 'um', 'basically'), and
                                communication pacing (words per minute).
                            </p>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2
                                        size={14}
                                        className="text-emerald-400"
                                    />
                                    <span>
                                        Automated vocal filler tracking and
                                        analysis
                                    </span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2
                                        size={14}
                                        className="text-emerald-400"
                                    />
                                    <span>
                                        Speech pacing and clarity guidelines
                                    </span>
                                </li>
                            </ul>
                        </>
                    )}

                    {activeTab === "planner" && (
                        <>
                            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300">
                                <CalendarCheck2 size={18} />
                            </div>
                            <h3 className="text-2xl font-bold text-white">
                                An adaptive preparation checklist
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Decision fatigue ruins discipline. PlacementOS
                                converts all weak marks, upcoming reviews, and
                                resume revisions into 3 simple daily tasks.
                                Complete them to progress.
                            </p>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2
                                        size={14}
                                        className="text-emerald-400"
                                    />
                                    <span>
                                        Personalized priorities generated each
                                        morning
                                    </span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2
                                        size={14}
                                        className="text-emerald-400"
                                    />
                                    <span>
                                        Maintains preparation streak without
                                        effort
                                    </span>
                                </li>
                            </ul>
                        </>
                    )}
                </div>

                <div className="relative rounded-2xl border border-white/10 bg-[#0d1222]/90 p-5 shadow-2xl backdrop-blur-xl">
                    {activeTab === "dsa" && (
                        <div>
                            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3 mb-4">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    DSA Pattern tracker
                                </span>
                                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
                                    {dsaProgress}% completed
                                </span>
                            </div>

                            <p className="text-xs text-slate-400 mb-3 text-left">
                                Check off solved problems to simulate tracking:
                            </p>
                            <div className="space-y-2">
                                {dsaProblems.map((problem) => (
                                    <button
                                        key={problem.id}
                                        onClick={() =>
                                            toggleDsaProblem(problem.id)
                                        }
                                        className="flex w-full items-center justify-between rounded-xl border border-white/[0.05] bg-[#090d19] px-4 py-3 hover:border-white/10 text-left transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${problem.solved
                                                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-400"
                                                    : "border-white/20"
                                                    }`}
                                            >
                                                {problem.solved && (
                                                    <Check size={10} />
                                                )}
                                            </div>
                                            <span
                                                className={`text-xs sm:text-sm ${problem.solved
                                                    ? "text-slate-500 line-through"
                                                    : "text-slate-200"
                                                    }`}
                                            >
                                                {problem.title}
                                            </span>
                                        </div>
                                        <span
                                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${problem.difficulty === "Easy"
                                                ? "text-emerald-400 bg-emerald-500/10"
                                                : problem.difficulty ===
                                                    "Medium"
                                                    ? "text-amber-400 bg-amber-500/10"
                                                    : "text-rose-400 bg-rose-500/10"
                                                }`}
                                        >
                                            {problem.difficulty}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "resume" && (
                        <div>
                            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3 mb-4">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    ATS Resume scanner
                                </span>
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                                    AI feedback
                                </span>
                            </div>

                            {!isScanning && !scanResult && (
                                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-[#090d19] p-6 text-center">
                                    <UploadCloud
                                        size={32}
                                        className="text-slate-500 mb-2"
                                    />
                                    <p className="text-xs text-slate-300 font-medium">
                                        Select a resume file to analyze
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-1 mb-4">
                                        Supports PDF & DOCX format
                                    </p>
                                    <button
                                        onClick={runResumeScan}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition"
                                    >
                                        <Play size={10} />
                                        Simulate Scan
                                    </button>
                                </div>
                            )}

                            {isScanning && (
                                <div className="py-6 flex flex-col items-center justify-center text-center">
                                    <div className="relative w-full max-w-xs h-1 bg-white/[0.08] rounded-full overflow-hidden mb-4">
                                        <div
                                            className="absolute top-0 bottom-0 left-0 bg-emerald-400 rounded-full transition-all duration-75"
                                            style={{
                                                width: `${scanProgress}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-300 font-semibold animate-pulse">
                                        Analyzing resume keywords and metrics...
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        {scanProgress}% compiled
                                    </p>
                                </div>
                            )}

                            {scanResult && (
                                <div className="space-y-3 text-left">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Resume Score
                                            </p>
                                            <p className="text-2xl font-bold text-white">
                                                {scanResult.score}%
                                            </p>
                                        </div>
                                        <button
                                            onClick={runResumeScan}
                                            className="text-[10px] font-semibold text-indigo-400 hover:underline inline-flex items-center gap-1"
                                        >
                                            <RotateCcw size={8} /> Rescan
                                        </button>
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-[11px] font-semibold text-slate-400">
                                            Matched Keywords
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {scanResult.matchedKeywords.map(
                                                (kw: string) => (
                                                    <span
                                                        key={kw}
                                                        className="text-[9px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                                                    >
                                                        {kw}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-[11px] font-semibold text-slate-400">
                                            Missing Keywords (Actionable)
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {scanResult.missingKeywords.map(
                                                (kw: string) => (
                                                    <span
                                                        key={kw}
                                                        className="text-[9px] font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/15"
                                                    >
                                                        +{kw}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                                        <p className="text-[10px] font-semibold text-amber-400">
                                            AI Advice:
                                        </p>
                                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                                            {scanResult.advice}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "interview" && (
                        <div>
                            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3 mb-4">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Interview Sandbox
                                </span>
                                <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-full">
                                    Audio logic
                                </span>
                            </div>

                            <div className="rounded-xl border border-white/[0.05] bg-[#090d19] p-3 mb-4 text-left">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Question Card:
                                </p>
                                <p className="text-xs text-slate-200 mt-1 font-semibold leading-relaxed">
                                    &ldquo;Tell me about a time you optimized a
                                    slow database query. What was the
                                    impact?&rdquo;
                                </p>
                            </div>

                            {!isRecording && !recordingResult && (
                                <div className="py-6 flex flex-col items-center justify-center text-center">
                                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                                        Simulate answering this question using
                                        voice analysis
                                    </p>
                                    <button
                                        onClick={startRecording}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-400 transition"
                                    >
                                        <Mic2 size={13} />
                                        Start Answer (3s)
                                    </button>
                                </div>
                            )}

                            {isRecording && (
                                <div className="py-6 flex flex-col items-center justify-center text-center">
                                    <div className="flex items-end justify-center gap-1 h-9 mb-4">
                                        {waveHeight.map((h, i) => (
                                            <div
                                                key={i}
                                                className="w-1.5 bg-violet-400 rounded-full transition-all duration-150"
                                                style={{ height: `${h}px` }}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-rose-400 font-semibold animate-pulse inline-flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                                        Recording simulated speech...
                                    </p>
                                </div>
                            )}

                            {recordingResult && (
                                <div className="space-y-3 text-left">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Communication Score
                                            </p>
                                            <p className="text-xl font-bold text-white">
                                                {recordingResult.rating}
                                            </p>
                                        </div>
                                        <button
                                            onClick={startRecording}
                                            className="text-[10px] font-semibold text-indigo-400 hover:underline inline-flex items-center gap-1"
                                        >
                                            <RotateCcw size={8} /> Try again
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-xl bg-white/[0.025] border border-white/[0.04] p-2.5">
                                            <p className="text-[9px] text-slate-500 font-semibold">
                                                Pacing
                                            </p>
                                            <p className="text-xs text-slate-200 font-medium mt-0.5 leading-tight">
                                                {recordingResult.pacing}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-white/[0.025] border border-white/[0.04] p-2.5">
                                            <p className="text-[9px] text-slate-500 font-semibold">
                                                Filler Words
                                            </p>
                                            <p className="text-xs text-amber-400 font-medium mt-0.5">
                                                um: {recordingResult.fillers.um}
                                                x, like:{" "}
                                                {recordingResult.fillers.like}x
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                                        <p className="text-[10px] font-semibold text-indigo-300">
                                            Speech Structure Analysis:
                                        </p>
                                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                                            {recordingResult.feedback}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "planner" && (
                        <div>
                            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3 mb-4">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Daily Preparation Checklist
                                </span>
                                <span className="text-xs font-bold text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full">
                                    {plannerProgress}% completed
                                </span>
                            </div>

                            <p className="text-xs text-slate-400 mb-3 text-left">
                                Toggle tasks to simulate daily focus:
                            </p>
                            <div className="space-y-2">
                                {plannerTasks.map((task) => (
                                    <button
                                        key={task.id}
                                        onClick={() =>
                                            togglePlannerTask(task.id)
                                        }
                                        className="flex w-full items-center gap-3 rounded-xl border border-white/[0.05] bg-[#090d19] px-4 py-3 hover:border-white/10 text-left transition"
                                    >
                                        <div
                                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${task.completed
                                                ? "border-pink-400 bg-pink-500/20 text-pink-400"
                                                : "border-white/20"
                                                }`}
                                        >
                                            {task.completed && (
                                                <Check size={10} />
                                            )}
                                        </div>
                                        <span
                                            className={`text-xs sm:text-sm ${task.completed
                                                ? "text-slate-500 line-through"
                                                : "text-slate-200"
                                                }`}
                                        >
                                            {task.text}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const AssessmentWizard = () => {
    const [step, setStep] = useState(0);
    const [dsa, setDsa] = useState<number | null>(null);
    const [resume, setResume] = useState<number | null>(null);
    const [interview, setInterview] = useState<number | null>(null);

    const handleStart = () => {
        setStep(1);
        setDsa(null);
        setResume(null);
        setInterview(null);
    };

    const handleDsaSelect = (score: number) => {
        setDsa(score);
        setStep(2);
    };

    const handleResumeSelect = (score: number) => {
        setResume(score);
        setStep(3);
    };

    const handleInterviewSelect = (score: number) => {
        setInterview(score);
        setStep(4);
    };

    const finalScore =
        dsa !== null && resume !== null && interview !== null
            ? Math.round(dsa * 0.45 + interview * 0.3 + resume * 0.25)
            : 0;

    const getAnalysis = () => {
        if (finalScore >= 80) {
            return {
                title: "Highly Competitive",
                text: "Your skills are robust! Your resume is formatted correctly and you have solid DSA fundamentals. Focus on mock live settings and maintaining consistency.",
                focus: "Polishing niche DSA structures (Graphs/DP) and behavioral interview replay",
                color: "text-emerald-400 border-emerald-400/20 bg-emerald-500/10",
            };
        } else if (finalScore >= 60) {
            return {
                title: "Moderate Placement Fit",
                text: "You are on the right track but have gaps that might fail resume screening or technical panels. Focus on adding metrics to your projects and expanding your pattern-solving in DSA.",
                focus: "Quantifying project impact on resume & practicing specific DSA patterns (Sliding Window, Trees)",
                color: "text-amber-400 border-amber-400/20 bg-amber-500/10",
            };
        } else {
            return {
                title: "Requires Action",
                text: "Your preparation score suggests significant risk in campus placement drives. You need structured, regular tracking for both DSA problems and communication rehearsals.",
                focus: "Building foundational patterns and optimizing resume from scratch",
                color: "text-rose-400 border-rose-400/20 bg-rose-500/10",
            };
        }
    };

    const analysis = getAnalysis();

    return (
        <div className="mx-auto max-w-2xl rounded-[28px] border border-white/10 bg-[#0d1222]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {step === 0 && (
                <div className="text-center py-6">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 mb-4">
                        <Gauge size={22} className="text-indigo-300" />
                    </div>
                    <h3 className="text-xl font-bold text-white sm:text-2xl">
                        Placement Readiness Calculator
                    </h3>
                    <p className="mt-3 text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
                        Answer three short questions about your current
                        preparation level. We will generate a placement report
                        card and highlight your core blockers.
                    </p>
                    <button
                        onClick={handleStart}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 transition"
                    >
                        Start Assessment
                        <ArrowRight size={15} />
                    </button>
                </div>
            )}

            {step === 1 && (
                <div className="text-left">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                            Step 1 of 3 (DSA)
                        </span>
                        <div className="w-16 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-1/3" />
                        </div>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-4">
                        How many Data Structures & Algorithms (DSA) questions
                        have you solved?
                    </h4>
                    <div className="space-y-2">
                        {[
                            { label: "Beginner: Under 50 problems solved", score: 40 },
                            {
                                label: "Intermediate: 50 - 150 problems solved",
                                score: 65,
                            },
                            {
                                label: "Advanced: 150 - 300 problems (comfortable with patterns)",
                                score: 85,
                            },
                            {
                                label: "Veteran: 300+ problems solved on LeetCode/GFG",
                                score: 98,
                            },
                        ].map((opt) => (
                            <button
                                key={opt.label}
                                onClick={() => handleDsaSelect(opt.score)}
                                className="w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 hover:border-indigo-400/20 hover:bg-indigo-500/5 transition text-xs sm:text-sm font-medium text-slate-200"
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="text-left">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                            Step 2 of 3 (Resume)
                        </span>
                        <div className="w-16 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-2/3" />
                        </div>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-4">
                        How optimized is your resume for ATS screening?
                    </h4>
                    <div className="space-y-2">
                        {[
                            {
                                label: "Generic resume (unoptimized template, no metrics)",
                                score: 45,
                            },
                            {
                                label: "Somewhat tailored (lists details, but lacks quantitative metrics)",
                                score: 70,
                            },
                            {
                                label: "Highly optimized (specifically tailored, quantified accomplishments)",
                                score: 92,
                            },
                        ].map((opt) => (
                            <button
                                key={opt.label}
                                onClick={() => handleResumeSelect(opt.score)}
                                className="w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 hover:border-indigo-400/20 hover:bg-indigo-500/5 transition text-xs sm:text-sm font-medium text-slate-200"
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="text-left">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                            Step 3 of 3 (Interviews)
                        </span>
                        <div className="w-16 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-full" />
                        </div>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-4">
                        How comfortable are you explaining technical structures
                        under pressure?
                    </h4>
                    <div className="space-y-2">
                        {[
                            {
                                label: "Freeze or struggle to articulate structure and code logic",
                                score: 35,
                            },
                            {
                                label: "Can explain code, but struggle with pacing and structural clarity",
                                score: 65,
                            },
                            {
                                label: "Confidently speak, frame answers using STAR framework",
                                score: 90,
                            },
                        ].map((opt) => (
                            <button
                                key={opt.label}
                                onClick={() => handleInterviewSelect(opt.score)}
                                className="w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 hover:border-indigo-400/20 hover:bg-indigo-500/5 transition text-xs sm:text-sm font-medium text-slate-200"
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="text-center">
                    <h4 className="text-xl font-bold text-white mb-1">
                        Your Placement Readiness Assessment
                    </h4>
                    <p className="text-xs text-slate-500 mb-6">
                        Estimated assessment output
                    </p>

                    <div className="flex items-center justify-center gap-6 mb-6">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                Readiness Score
                            </p>
                            <span className="text-5xl font-extrabold text-indigo-400">
                                {finalScore}
                            </span>
                            <span className="text-sm text-slate-500">
                                {" "}
                                / 100
                            </span>
                        </div>

                        <div
                            className={`rounded-xl border px-3 py-2 text-xs font-semibold ${analysis.color}`}
                        >
                            {analysis.title}
                        </div>
                    </div>

                    <div className="grid gap-3 grid-cols-3 mb-6">
                        <div className="rounded-xl border border-white/[0.05] bg-[#090d19] p-3 text-center">
                            <span className="text-[10px] text-slate-500">
                                DSA Prep
                            </span>
                            <p className="text-base font-bold text-indigo-300 mt-1">
                                {dsa}%
                            </p>
                        </div>
                        <div className="rounded-xl border border-white/[0.05] bg-[#090d19] p-3 text-center">
                            <span className="text-[10px] text-slate-500">
                                Resume ATS
                            </span>
                            <p className="text-base font-bold text-emerald-300 mt-1">
                                {resume}%
                            </p>
                        </div>
                        <div className="rounded-xl border border-white/[0.05] bg-[#090d19] p-3 text-center">
                            <span className="text-[10px] text-slate-500">
                                Interview
                            </span>
                            <p className="text-base font-bold text-violet-300 mt-1">
                                {interview}%
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-left mb-6">
                        <p className="text-xs font-bold text-slate-300">
                            Detailed Feedback:
                        </p>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                            {analysis.text}
                        </p>
                        <p className="text-xs font-semibold text-amber-400 mt-3">
                            Immediate Area of Focus:
                        </p>
                        <p className="text-xs text-slate-300 mt-1">
                            {analysis.focus}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={handleStart}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-5 py-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.05] transition"
                        >
                            <RotateCcw size={11} />
                            Retake Quiz
                        </button>
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 transition"
                        >
                            Save Score & Get Custom Roadmap
                            <ArrowRight size={13} />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export const FAQSection = () => {
    const [expanded, setExpanded] = useState<number | null>(null);

    const faqs = [
        {
            q: "How does the Placement Readiness Score work?",
            a: "The score is a weighted index: 45% DSA solving consistency, 30% mock interview communication, and 25% resume ATS score. It provides a real-time predictive signal of whether you can clear screenings and panels.",
        },
        {
            q: "Can I use PlacementOS if I am preparing off-campus?",
            a: "Absolutely. While campus drives have distinct patterns, off-campus hiring at top product companies requires the same preparation: robust DSA patterns, targeted resumes, and clear, structured communication.",
        },
        {
            q: "Is PlacementOS really free for students?",
            a: "Yes! PlacementOS provides a free core workspace covering DSA tracking, resume building suggestions, interview rehearsals, and the adaptive daily plan to ensure students can prepare effectively without financial barriers.",
        },
        {
            q: "How does the AI analyze my resume and interviews?",
            a: "Our AI processes your resume by replicating applicant tracking system (ATS) filters to flag missing industry keywords. For interviews, it transcribes audio, measures speech pacing, and calculates filler word frequency to highlight communication issues.",
        },
    ];

    const toggle = (idx: number) => {
        setExpanded(expanded === idx ? null : idx);
    };

    return (
        <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((faq, idx) => {
                const isExpanded = expanded === idx;
                return (
                    <div
                        key={idx}
                        className="rounded-2xl border border-white/[0.07] bg-[#0b1020]/70 transition-colors duration-200 hover:border-white/10"
                    >
                        <button
                            onClick={() => toggle(idx)}
                            className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold text-white focus:outline-none"
                            aria-expanded={isExpanded}
                        >
                            <span>{faq.q}</span>
                            <span className="ml-4 shrink-0 text-slate-400">
                                {isExpanded ? (
                                    <ChevronUp size={16} />
                                ) : (
                                    <ChevronDown size={16} />
                                )}
                            </span>
                        </button>
                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded
                                ? "max-h-40 border-t border-white/[0.05]"
                                : "max-h-0"
                                }`}
                        >
                            <p className="px-6 py-4 text-xs leading-relaxed text-slate-400">
                                {faq.a}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const StudentSuccessStories = () => {
    const stories = [
        {
            name: "Rohan Sharma",
            role: "Software Engineer",
            company: "Microsoft",
            quote: "I was stuck solving Leetcode questions without any structure. PlacementOS's daily preparation plan helped me focus on patterns. My readiness score went from 42 to 85, and I felt so confident in my live interviews.",
            avatar: "RS",
        },
        {
            name: "Sneha Reddy",
            role: "Associate Developer",
            company: "Adobe",
            quote: "The resume intelligence tool was a game-changer for me. It pointed out that my projects lacked metrics. After adding quantified impact, I got shortlisted for 4 campus drives in two weeks!",
            avatar: "SR",
        },
        {
            name: "Aman Gupta",
            role: "SDE",
            company: "Amazon",
            quote: "Interview Replay let me see how often I said 'um' and 'like' when explaining graph algorithms. Reviewing my own recordings helped me structure my thoughts using the STAR method.",
            avatar: "AG",
        },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-3">
            {stories.map((story) => (
                <div
                    key={story.name}
                    className="flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-[#0b1020]/80 p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/25 hover:bg-[#0e1427] hover:shadow-xl text-left"
                >
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-[10px] font-bold text-indigo-300">
                            Placed at {story.company}
                        </div>
                        <p className="text-xs leading-relaxed text-slate-300 italic">
                            &ldquo;{story.quote}&rdquo;
                        </p>
                    </div>

                    <div className="mt-6 flex items-center gap-3 border-t border-white/[0.05] pt-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-xs font-bold text-white">
                            {story.avatar}
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-white">
                                {story.name}
                            </h4>
                            <p className="text-[10px] text-slate-500">
                                {story.role} @ {story.company}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const OnboardingPage = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const primaryHref = isAuthenticated ? "/dashboard" : "/register";

    const primaryLabel = isAuthenticated
        ? "Open dashboard"
        : "Start preparing free";

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
            <a
                href="#main-content"
                className="sr-only z-[100] rounded-lg bg-white px-4 py-2 text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
            >
                Skip to main content
            </a>

            <div
                className="pointer-events-none fixed inset-0 onboarding-grid opacity-50"
                aria-hidden="true"
            />

            <div
                className="pointer-events-none fixed left-[-180px] top-[-160px] h-[460px] w-[460px] rounded-full bg-indigo-600/20 blur-[120px]"
                aria-hidden="true"
            />

            <div
                className="pointer-events-none fixed bottom-[-220px] right-[-170px] h-[520px] w-[520px] rounded-full bg-violet-600/15 blur-[140px]"
                aria-hidden="true"
            />

            <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#050816]/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between overflow-hidden px-5 lg:px-8">
                    <Logo />

                    <nav
                        className="hidden items-center gap-7 md:flex"
                        aria-label="Primary navigation"
                    >
                        {navigationItems.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                className="text-sm font-medium text-slate-400 transition hover:text-white focus:outline-none focus-visible:text-white"
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>

                    <div className="hidden items-center gap-3 md:flex">
                        {!isAuthenticated && (
                            <Link
                                to="/login"
                                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                Sign in
                            </Link>
                        )}

                        <Link
                            to={primaryHref}
                            className="group inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 active:translate-y-0"
                        >
                            {primaryLabel}

                            <ArrowRight
                                size={15}
                                className="transition-transform group-hover:translate-x-0.5"
                                aria-hidden="true"
                            />
                        </Link>
                    </div>

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen((current) => !current)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:text-white md:hidden"
                        aria-expanded={mobileMenuOpen}
                        aria-label={
                            mobileMenuOpen
                                ? "Close navigation menu"
                                : "Open navigation menu"
                        }
                    >
                        {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <nav
                        className="border-t border-white/[0.06] bg-[#080b18] px-5 py-4 md:hidden"
                        aria-label="Mobile navigation"
                    >
                        <div className="space-y-1">
                            {navigationItems.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block rounded-xl px-3 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.05] hover:text-white"
                                >
                                    {item.label}
                                </a>
                            ))}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            {!isAuthenticated && (
                                <Link
                                    to="/login"
                                    className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-slate-200"
                                >
                                    Sign in
                                </Link>
                            )}

                            <Link
                                to={primaryHref}
                                className={[
                                    "rounded-xl bg-indigo-500 px-4 py-3 text-center text-sm font-semibold text-white",
                                    isAuthenticated ? "col-span-2" : "",
                                ].join(" ")}
                            >
                                {primaryLabel}
                            </Link>
                        </div>
                    </nav>
                )}
            </header>

            <main id="main-content">
                <section className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-16 px-5 pb-20 pt-28 lg:grid-cols-[1.04fr_0.96fr] lg:px-8 lg:pt-24">
                    <div className="relative z-10 text-left">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-200">
                            <Sparkles size={13} aria-hidden="true" />
                            Your placement preparation command centre
                        </div>

                        <h1 className="max-w-4xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-white sm:text-5xl lg:text-7xl">
                            Stop guessing.
                            <br />
                            Start preparing with
                            <span className="relative ml-3 inline-block text-indigo-400">
                                clarity.
                                <span
                                    className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400"
                                    aria-hidden="true"
                                />
                            </span>
                        </h1>

                        <p className="mt-7 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
                            PlacementOS brings DSA, resume intelligence,
                            interview replay, readiness scoring, and daily
                            planning into one personalised workspace built for
                            campus placements.
                        </p>

                        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                            <Link
                                to={primaryHref}
                                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 active:translate-y-0"
                            >
                                {primaryLabel}

                                <ArrowRight
                                    size={16}
                                    className="transition-transform group-hover:translate-x-1"
                                    aria-hidden="true"
                                />
                            </Link>

                            <a
                                href="#features"
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                            >
                                Explore the platform
                                <ChevronRight size={16} aria-hidden="true" />
                            </a>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                            {[
                                "No credit card",
                                "Privacy controls",
                                "Built for students",
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="flex items-center gap-2 text-xs font-medium text-slate-400"
                                >
                                    <CheckCircle2
                                        size={14}
                                        className="text-emerald-400"
                                        aria-hidden="true"
                                    />

                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <HeroScoreSimulator />
                </section>

                <section
                    id="features"
                    className="relative border-y border-white/[0.06] bg-white/[0.015] py-24"
                >
                    <div className="mx-auto max-w-7xl px-5 lg:px-8">
                        <Reveal>
                            <div className="mx-auto max-w-3xl text-center mb-12">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                                    One operating system
                                </p>

                                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    Interactive Platform Playground
                                </h2>

                                <p className="mt-5 text-base leading-7 text-slate-400">
                                    Click, scan, or speak below to experience
                                    how PlacementOS connects prep data into one
                                    unified operating workspace.
                                </p>
                            </div>
                        </Reveal>

                        <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map(
                                (
                                    feature,
                                    index
                                ) => {
                                    const Icon =
                                        feature.icon;

                                    return (
                                        <Reveal
                                            key={
                                                feature.title
                                            }
                                            delay={
                                                index *
                                                70
                                            }
                                            className="h-full"
                                        >
                                            <article className="group h-full rounded-2xl border border-white/[0.07] bg-[#0b1020]/80 p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-indigo-400/25 hover:bg-[#0e1427]">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
                                                    <Icon
                                                        size={
                                                            20
                                                        }
                                                        aria-hidden="true"
                                                    />
                                                </div>

                                                <h3 className="mt-5 text-base font-semibold text-white">
                                                    {
                                                        feature.title
                                                    }
                                                </h3>

                                                <p className="mt-3 text-sm leading-6 text-slate-400">
                                                    {
                                                        feature.description
                                                    }
                                                </p>

                                                <div className="mt-5 border-t border-white/[0.06] pt-4">
                                                    <span className="inline-flex rounded-full border border-indigo-400/15 bg-indigo-500/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-300">
                                                        {
                                                            feature.metric
                                                        }
                                                    </span>
                                                </div>
                                            </article>
                                        </Reveal>
                                    );
                                }
                            )}
                        </div>

                        <Reveal>
                            <PlatformPlayground />
                        </Reveal>
                    </div>
                </section>

                <section id="how-it-works" className="py-24">
                    <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
                        <Reveal>
                            <div className="text-left">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                                    From activity to action
                                </p>

                                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    Preparation becomes a measurable workflow
                                </h2>

                                <p className="mt-5 max-w-xl text-base leading-8 text-slate-400">
                                    PlacementOS continuously connects your
                                    preparation evidence with your current
                                    readiness and daily priorities.
                                </p>

                                <div className="mt-9 space-y-5">
                                    {[
                                        {
                                            number: "01",
                                            title: "Capture preparation activity",
                                            text: "Track DSA, resumes, interviews, revisions, and profile goals.",
                                        },
                                        {
                                            number: "02",
                                            title: "Analyse gaps",
                                            text: "Weighted scoring highlights weak patterns, low-quality evidence, and readiness blockers.",
                                        },
                                        {
                                            number: "03",
                                            title: "Execute the next plan",
                                            text: "A focused daily plan converts analysis into clear actions.",
                                        },
                                    ].map((step) => (
                                        <div
                                            key={step.number}
                                            className="flex gap-4"
                                        >
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-xs font-bold text-indigo-300">
                                                {step.number}
                                            </span>

                                            <div>
                                                <h3 className="font-semibold text-white">
                                                    {step.title}
                                                </h3>

                                                <p className="mt-1 text-sm leading-6 text-slate-400">
                                                    {step.text}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Reveal>

                        <Reveal delay={120}>
                            <div className="rounded-[28px] border border-white/[0.08] bg-[#0a0f1e] p-5 sm:p-7 text-left">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            Preparation loop
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Evidence-driven progression
                                        </p>
                                    </div>

                                    <BarChart3
                                        size={20}
                                        className="text-indigo-300"
                                        aria-hidden="true"
                                    />
                                </div>

                                <div className="mt-7 space-y-3">
                                    {[
                                        {
                                            label: "Track",
                                            detail: "Problems, resumes, interviews",
                                            percentage: 100,
                                        },
                                        {
                                            label: "Analyse",
                                            detail: "Scores, gaps, missed patterns",
                                            percentage: 82,
                                        },
                                        {
                                            label: "Plan",
                                            detail: "Prioritised daily actions",
                                            percentage: 68,
                                        },
                                        {
                                            label: "Improve",
                                            detail: "Readiness history",
                                            percentage: 52,
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.label}
                                            className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-white">
                                                        {item.label}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {item.detail}
                                                    </p>
                                                </div>

                                                <span className="text-xs font-semibold text-indigo-300">
                                                    {item.percentage}%
                                                </span>
                                            </div>

                                            <div className="mt-3 h-1.5 rounded-full bg-white/[0.06]">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400"
                                                    style={{
                                                        width: `${item.percentage}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>
                <section className="border-y border-white/[0.06] bg-[#070b16] py-24">
                    <div className="mx-auto max-w-7xl px-5 lg:px-8">
                        <Reveal>
                            <div className="mx-auto max-w-3xl text-center">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                                    Why PlacementOS
                                </p>

                                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    Turn preparation into focused progress
                                </h2>

                                <p className="mt-5 text-base leading-7 text-slate-400">
                                    PlacementOS removes uncertainty by showing what matters, what changed, and what to work on next.
                                </p>
                            </div>
                        </Reveal>

                        <div className="mt-12 grid gap-5 md:grid-cols-3">
                            {benefits.map(
                                (
                                    benefit,
                                    index
                                ) => {
                                    const Icon =
                                        benefit.icon;

                                    return (
                                        <Reveal
                                            key={
                                                benefit.title
                                            }
                                            delay={
                                                index *
                                                100
                                            }
                                            className="h-full"
                                        >
                                            <article className="h-full rounded-2xl border border-white/[0.07] bg-[#0b1020] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-indigo-400/25">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
                                                    <Icon
                                                        size={
                                                            20
                                                        }
                                                        aria-hidden="true"
                                                    />
                                                </div>

                                                <h3 className="mt-5 text-lg font-semibold text-white">
                                                    {
                                                        benefit.title
                                                    }
                                                </h3>

                                                <p className="mt-3 text-sm leading-6 text-slate-400">
                                                    {
                                                        benefit.description
                                                    }
                                                </p>
                                            </article>
                                        </Reveal>
                                    );
                                }
                            )}
                        </div>
                    </div>
                </section>
                <section
                    id="readiness"
                    className="border-y border-white/[0.06] bg-white/[0.015] py-24"
                >
                    <div className="mx-auto max-w-7xl px-5 lg:px-8">
                        <Reveal>
                            <div className="max-w-3xl text-left">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                                    Transparent readiness
                                </p>

                                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    One score, backed by real preparation
                                    evidence
                                </h2>

                                <p className="mt-5 text-base leading-8 text-slate-400">
                                    The readiness score is intentionally
                                    transparent, so students understand exactly
                                    where improvement is required.
                                </p>
                            </div>
                        </Reveal>

                        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {stats.map((stat, index) => (
                                <Reveal key={stat.label} delay={index * 80}>
                                    <div className="h-full rounded-2xl border border-white/[0.07] bg-[#0b1020] p-6 text-left">
                                        <p className="text-4xl font-bold tracking-tight text-indigo-300">
                                            {stat.value}
                                        </p>

                                        <h3 className="mt-4 text-sm font-semibold text-white">
                                            {stat.label}
                                        </h3>

                                        <p className="mt-2 text-xs leading-5 text-slate-500">
                                            {stat.description}
                                        </p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-24 border-b border-white/[0.06]">
                    <div className="mx-auto max-w-7xl px-5 lg:px-8">
                        <Reveal>
                            <div className="mx-auto max-w-3xl text-center mb-12">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                                    Assessment Tool
                                </p>
                                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    Evaluate your preparation status
                                </h2>
                                <p className="mt-5 text-base leading-7 text-slate-400">
                                    Receive a specialized checklist highlighting
                                    strengths and deficiencies.
                                </p>
                            </div>
                        </Reveal>
                        <Reveal>
                            <AssessmentWizard />
                        </Reveal>
                    </div>
                </section>

                <section className="py-24 bg-white/[0.01]">
                    <div className="mx-auto max-w-7xl px-5 lg:px-8">
                        <Reveal>
                            <div className="mx-auto max-w-3xl text-center mb-12">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                                    Social Proof
                                </p>
                                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    Illustrative student outcomes
                                </h2>
                                <p className="mt-5 text-base leading-7 text-slate-400">
                                    See how peers optimized their preparation
                                    and landed offers at product giants.
                                </p>
                            </div>
                        </Reveal>
                        <Reveal>
                            <StudentSuccessStories />
                        </Reveal>
                    </div>
                </section>

                <section id="privacy" className="py-24">
                    <div className="mx-auto max-w-7xl px-5 lg:px-8">
                        <Reveal>
                            <div className="grid gap-8 rounded-[28px] border border-emerald-400/10 bg-gradient-to-br from-emerald-500/[0.08] via-[#0b1020] to-indigo-500/[0.08] p-7 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center text-left">
                                <div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10">
                                        <LockKeyhole
                                            size={21}
                                            className="text-emerald-300"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <h2 className="mt-5 text-2xl font-bold text-white sm:text-3xl">
                                        Your preparation data stays under your
                                        control
                                    </h2>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    {[
                                        "Review stored account data",
                                        "Delete database history",
                                        "Submit private feedback",
                                        "Contact application support",
                                    ].map((item) => (
                                        <div
                                            key={item}
                                            className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/10 px-4 py-4 text-sm text-slate-300"
                                        >
                                            <CheckCircle2
                                                size={15}
                                                className="shrink-0 text-emerald-400"
                                                aria-hidden="true"
                                            />

                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>

                <section className="py-24 border-y border-white/[0.06] bg-[#080c18]">
                    <div className="mx-auto max-w-7xl px-5 lg:px-8">
                        <Reveal>
                            <div className="mx-auto max-w-3xl text-center mb-12">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                                    FAQ
                                </p>
                                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    Frequently Asked Questions
                                </h2>
                                <p className="mt-5 text-base leading-7 text-slate-400">
                                    Got questions? We have answers to help clarify
                                    your placement journey.
                                </p>
                            </div>
                        </Reveal>
                        <Reveal>
                            <FAQSection />
                        </Reveal>
                    </div>
                </section>

                <section className="py-24">
                    <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
                        <Reveal>
                            <BrandLogo
                                variant="loader"
                                className="mx-auto"
                            />

                            <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-5xl">
                                Build placement readiness,
                                <br />
                                not preparation anxiety.
                            </h2>

                            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-400">
                                Start with your current level. PlacementOS will
                                help organise, measure, and improve the work
                                that follows.
                            </p>

                            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                                <Link
                                    to={primaryHref}
                                    className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                                >
                                    {primaryLabel}

                                    <ArrowRight
                                        size={16}
                                        className="transition-transform group-hover:translate-x-1"
                                        aria-hidden="true"
                                    />
                                </Link>

                                {!isAuthenticated && (
                                    <Link
                                        to="/login"
                                        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-7 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.05] hover:text-white"
                                    >
                                        I already have an account
                                    </Link>
                                )}
                            </div>
                        </Reveal>
                    </div>
                </section>
            </main>

            <footer className="bg-[#050816]">
                <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
                    <div className="flex flex-col justify-between gap-8 border-b border-white/[0.07] pb-8 md:flex-row md:items-center text-left">
                        <div>
                            <Logo />

                            <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                                A personal placement operating system for
                                structured, evidence-driven preparation.
                            </p>
                        </div>

                        <nav
                            className="flex flex-wrap gap-x-6 gap-y-3"
                            aria-label="Footer navigation"
                        >
                            <Link
                                to="/terms"
                                className="text-sm text-slate-500 transition hover:text-white"
                            >
                                Terms
                            </Link>

                            <Link
                                to="/privacy"
                                className="text-sm text-slate-500 transition hover:text-white"
                            >
                                Privacy
                            </Link>

                            <a
                                href="mailto:aryanjaiswal3080@gmail.com?subject=PlacementOS%20support"
                                className="text-sm text-slate-500 transition hover:text-white"
                            >
                                Support
                            </a>

                            <a
                                href="#features"
                                className="text-sm text-slate-500 transition hover:text-white"
                            >
                                Features
                            </a>
                        </nav>
                    </div>

                    <div className="flex flex-col justify-between gap-3 pt-6 text-xs text-slate-600 sm:flex-row text-left">
                        <p>
                            © {new Date().getFullYear()} PlacementOS. Built for placement preparation.
                        </p>

                        <p>
                            Designed with accessibility, privacy, and
                            performance in mind.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
