import {
    useEffect,
    useRef,
    useState,
} from "react";

import type {
    ReactNode,
} from "react";

import {
    Activity,
    ArrowRight,
    BarChart3,
    CalendarCheck2,
    CheckCircle2,
    ChevronRight,
    Code2,
    FileText,
    Gauge,
    LockKeyhole,
    Menu,
    Mic2,
    ShieldCheck,
    Sparkles,
    Target,
    TrendingUp,
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
            className="inline-flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            aria-label="PlacementOS home"
        >
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-indigo-400/30 bg-indigo-500/10">
                <Sparkles
                    size={18}
                    className="text-indigo-300"
                    aria-hidden="true"
                />

                <span className="absolute inset-0 onboarding-logo-shine" />
            </div>

            <span className="text-lg font-bold tracking-tight text-white">
                Placement
                <span className="text-indigo-400">
                    OS
                </span>
            </span>
        </Link>
    );
};

export const OnboardingPage = () => {
    const isAuthenticated =
        useAuthStore(
            (state) => state.isAuthenticated
        );

    const [mobileMenuOpen, setMobileMenuOpen] =
        useState(false);

    const primaryHref = isAuthenticated
        ? "/dashboard"
        : "/register";

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
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
                    <Logo />

                    <nav
                        className="hidden items-center gap-7 md:flex"
                        aria-label="Primary navigation"
                    >
                        {navigationItems.map(
                            (item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className="text-sm font-medium text-slate-400 transition hover:text-white focus:outline-none focus-visible:text-white"
                                >
                                    {item.label}
                                </a>
                            )
                        )}
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
                        onClick={() =>
                            setMobileMenuOpen(
                                (current) => !current
                            )
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:text-white md:hidden"
                        aria-expanded={mobileMenuOpen}
                        aria-label={
                            mobileMenuOpen
                                ? "Close navigation menu"
                                : "Open navigation menu"
                        }
                    >
                        {mobileMenuOpen ? (
                            <X size={19} />
                        ) : (
                            <Menu size={19} />
                        )}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <nav
                        className="border-t border-white/[0.06] bg-[#080b18] px-5 py-4 md:hidden"
                        aria-label="Mobile navigation"
                    >
                        <div className="space-y-1">
                            {navigationItems.map(
                                (item) => (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        onClick={() =>
                                            setMobileMenuOpen(
                                                false
                                            )
                                        }
                                        className="block rounded-xl px-3 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.05] hover:text-white"
                                    >
                                        {item.label}
                                    </a>
                                )
                            )}
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
                                    isAuthenticated
                                        ? "col-span-2"
                                        : "",
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
                    <div className="relative z-10">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-200">
                            <Sparkles
                                size={13}
                                aria-hidden="true"
                            />

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
                            PlacementOS brings DSA,
                            resume intelligence,
                            interview replay, readiness
                            scoring, and daily planning
                            into one personalised
                            workspace built for campus
                            placements.
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

                                <ChevronRight
                                    size={16}
                                    aria-hidden="true"
                                />
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

                    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
                        <div
                            className="absolute inset-10 rounded-full bg-indigo-500/20 blur-[90px]"
                            aria-hidden="true"
                        />

                        <div className="relative onboarding-float rounded-[28px] border border-white/10 bg-[#0d1222]/90 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
                            <div className="rounded-[22px] border border-white/[0.07] bg-[#090d19] p-5 sm:p-6">
                                <div className="flex items-center justify-between border-b border-white/[0.07] pb-5">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                                            Placement readiness
                                        </p>

                                        <div className="mt-2 flex items-end gap-2">
                                            <span className="text-4xl font-bold tracking-tight text-white">
                                                74
                                            </span>

                                            <span className="pb-1 text-sm text-slate-500">
                                                / 100
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
                                        <Activity
                                            size={21}
                                            className="text-indigo-300"
                                            aria-hidden="true"
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                                    {[
                                        {
                                            label: "DSA",
                                            value: "68",
                                            color: "bg-indigo-400",
                                        },
                                        {
                                            label: "Interview",
                                            value: "72",
                                            color: "bg-violet-400",
                                        },
                                        {
                                            label: "Resume",
                                            value: "84",
                                            color: "bg-emerald-400",
                                        },
                                    ].map((metric) => (
                                        <div
                                            key={metric.label}
                                            className="rounded-xl border border-white/[0.06] bg-white/[0.035] p-3 sm:p-4"
                                        >
                                            <p className="text-[11px] text-slate-500">
                                                {metric.label}
                                            </p>

                                            <p className="mt-1 text-lg font-semibold text-white">
                                                {metric.value}
                                            </p>

                                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                                                <div
                                                    className={`h-full rounded-full ${metric.color}`}
                                                    style={{
                                                        width: `${metric.value}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles
                                                size={15}
                                                className="text-indigo-300"
                                                aria-hidden="true"
                                            />

                                            <p className="text-sm font-semibold text-white">
                                                Today&apos;s focused plan
                                            </p>
                                        </div>

                                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold text-indigo-300">
                                            3 tasks
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-2.5">
                                        {[
                                            "Revise Two Pointers pattern",
                                            "Improve resume project impact",
                                            "Replay one technical answer",
                                        ].map(
                                            (
                                                task,
                                                index
                                            ) => (
                                                <div
                                                    key={task}
                                                    className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-[#090d19] px-3 py-3"
                                                >
                                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-[10px] font-bold text-indigo-300">
                                                        {index +
                                                            1}
                                                    </span>

                                                    <span className="text-xs text-slate-300 sm:text-sm">
                                                        {task}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-400/10 bg-emerald-500/[0.06] px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp
                                            size={15}
                                            className="text-emerald-400"
                                            aria-hidden="true"
                                        />

                                        <span className="text-xs font-medium text-emerald-200">
                                            Readiness improved
                                            this week
                                        </span>
                                    </div>

                                    <span className="text-sm font-bold text-emerald-400">
                                        +6
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="features"
                    className="relative border-y border-white/[0.06] bg-white/[0.015] py-24"
                >
                    <div className="mx-auto max-w-7xl px-5 lg:px-8">
                        <Reveal>
                            <div className="mx-auto max-w-3xl text-center">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                                    One operating system
                                </p>

                                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    Everything required to
                                    become placement-ready
                                </h2>

                                <p className="mt-5 text-base leading-7 text-slate-400">
                                    Each module shares context
                                    with the others, creating a
                                    preparation system instead
                                    of disconnected trackers.
                                </p>
                            </div>
                        </Reveal>

                        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {features.map(
                                (feature, index) => {
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
                                        >
                                            <article className="group h-full rounded-2xl border border-white/[0.07] bg-[#0b1020]/80 p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/25 hover:bg-[#0e1427] hover:shadow-xl hover:shadow-indigo-950/20">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 transition group-hover:scale-105 group-hover:bg-indigo-500/15">
                                                    <Icon
                                                        size={
                                                            19
                                                        }
                                                        className="text-indigo-300"
                                                        aria-hidden="true"
                                                    />
                                                </div>

                                                <h3 className="mt-5 text-lg font-semibold text-white">
                                                    {
                                                        feature.title
                                                    }
                                                </h3>

                                                <p className="mt-3 text-sm leading-6 text-slate-400">
                                                    {
                                                        feature.description
                                                    }
                                                </p>

                                                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-indigo-300">
                                                    <CheckCircle2
                                                        size={
                                                            13
                                                        }
                                                        aria-hidden="true"
                                                    />

                                                    {
                                                        feature.metric
                                                    }
                                                </div>
                                            </article>
                                        </Reveal>
                                    );
                                }
                            )}
                        </div>
                    </div>
                </section>

                <section
                    id="how-it-works"
                    className="py-24"
                >
                    <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
                        <Reveal>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                                    From activity to action
                                </p>

                                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    Preparation becomes a
                                    measurable workflow
                                </h2>

                                <p className="mt-5 max-w-xl text-base leading-8 text-slate-400">
                                    PlacementOS continuously
                                    connects your preparation
                                    evidence with your current
                                    readiness and daily
                                    priorities.
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
                                            key={
                                                step.number
                                            }
                                            className="flex gap-4"
                                        >
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-xs font-bold text-indigo-300">
                                                {
                                                    step.number
                                                }
                                            </span>

                                            <div>
                                                <h3 className="font-semibold text-white">
                                                    {
                                                        step.title
                                                    }
                                                </h3>

                                                <p className="mt-1 text-sm leading-6 text-slate-400">
                                                    {
                                                        step.text
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Reveal>

                        <Reveal delay={120}>
                            <div className="rounded-[28px] border border-white/[0.08] bg-[#0a0f1e] p-5 sm:p-7">
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
                                            key={
                                                item.label
                                            }
                                            className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-white">
                                                        {
                                                            item.label
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {
                                                            item.detail
                                                        }
                                                    </p>
                                                </div>

                                                <span className="text-xs font-semibold text-indigo-300">
                                                    {
                                                        item.percentage
                                                    }
                                                    %
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

                <section
                    id="readiness"
                    className="border-y border-white/[0.06] bg-white/[0.015] py-24"
                >
                    <div className="mx-auto max-w-7xl px-5 lg:px-8">
                        <Reveal>
                            <div className="max-w-3xl">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                                    Transparent readiness
                                </p>

                                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    One score, backed by real
                                    preparation evidence
                                </h2>

                                <p className="mt-5 text-base leading-8 text-slate-400">
                                    The readiness score is
                                    intentionally transparent,
                                    so students understand
                                    exactly where improvement is
                                    required.
                                </p>
                            </div>
                        </Reveal>

                        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {stats.map(
                                (stat, index) => (
                                    <Reveal
                                        key={
                                            stat.label
                                        }
                                        delay={
                                            index *
                                            80
                                        }
                                    >
                                        <div className="h-full rounded-2xl border border-white/[0.07] bg-[#0b1020] p-6">
                                            <p className="text-4xl font-bold tracking-tight text-indigo-300">
                                                {
                                                    stat.value
                                                }
                                            </p>

                                            <h3 className="mt-4 text-sm font-semibold text-white">
                                                {
                                                    stat.label
                                                }
                                            </h3>

                                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                                {
                                                    stat.description
                                                }
                                            </p>
                                        </div>
                                    </Reveal>
                                )
                            )}
                        </div>
                    </div>
                </section>

                <section className="py-24">
                    <div className="mx-auto max-w-7xl px-5 lg:px-8">
                        <div className="grid gap-4 lg:grid-cols-3">
                            {benefits.map(
                                (benefit, index) => {
                                    const Icon =
                                        benefit.icon;

                                    return (
                                        <Reveal
                                            key={
                                                benefit.title
                                            }
                                            delay={
                                                index *
                                                90
                                            }
                                        >
                                            <div className="h-full rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent p-6">
                                                <Icon
                                                    size={
                                                        22
                                                    }
                                                    className="text-indigo-300"
                                                    aria-hidden="true"
                                                />

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
                                            </div>
                                        </Reveal>
                                    );
                                }
                            )}
                        </div>
                    </div>
                </section>

                <section
                    id="privacy"
                    className="pb-24"
                >
                    <div className="mx-auto max-w-7xl px-5 lg:px-8">
                        <Reveal>
                            <div className="grid gap-8 rounded-[28px] border border-emerald-400/10 bg-gradient-to-br from-emerald-500/[0.08] via-[#0b1020] to-indigo-500/[0.08] p-7 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                                <div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10">
                                        <LockKeyhole
                                            size={21}
                                            className="text-emerald-300"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <h2 className="mt-5 text-2xl font-bold text-white sm:text-3xl">
                                        Your preparation data
                                        stays under your control
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

                <section className="border-y border-white/[0.06] bg-[#080c18] py-24">
                    <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
                        <Reveal>
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
                                <Sparkles
                                    size={24}
                                    className="text-indigo-300"
                                    aria-hidden="true"
                                />
                            </div>

                            <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-5xl">
                                Build placement readiness,
                                not preparation anxiety.
                            </h2>

                            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-400">
                                Start with your current level.
                                PlacementOS will help organise,
                                measure, and improve the work
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
                                        I already have an
                                        account
                                    </Link>
                                )}
                            </div>
                        </Reveal>
                    </div>
                </section>
            </main>

            <footer className="bg-[#050816]">
                <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
                    <div className="flex flex-col justify-between gap-8 border-b border-white/[0.07] pb-8 md:flex-row md:items-center">
                        <div>
                            <Logo />

                            <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                                A personal placement operating
                                system for structured,
                                evidence-driven preparation.
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

                    <div className="flex flex-col justify-between gap-3 pt-6 text-xs text-slate-600 sm:flex-row">
                        <p>
                            © {new Date().getFullYear()}{" "}
                            PlacementOS. Built for placement
                            preparation.
                        </p>

                        <p>
                            Designed with accessibility,
                            privacy, and performance in mind.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};