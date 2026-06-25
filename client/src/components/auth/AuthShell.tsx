import type {
    ReactNode,
} from "react";

import {
    ArrowLeft,
    CheckCircle2,
    ShieldCheck,
    Target,
} from "lucide-react";

import {
    Link,
} from "react-router-dom";

import {
    BrandLogo,
} from "../ui/BrandLogo";

interface AuthShellProps {
    title: string;
    description: string;
    children: ReactNode;
}

const benefits = [
    "Personalised daily preparation plan",
    "DSA, resume, and interview intelligence",
    "Transparent placement-readiness score",
];

export const AuthShell = ({
    title,
    description,
    children,
}: AuthShellProps) => {
    return (
        <div className="min-h-screen bg-[#050816] text-white">
            <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
                <section className="relative hidden overflow-hidden border-r border-white/[0.07] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_38%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.12),transparent_35%)]" />

                    <div className="relative z-10">
                        <Link
                            to="/"
                            aria-label="Go to PlacementOS home"
                            className="inline-flex items-center rounded-xl transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            <BrandLogo
                                variant="loader"
                                priority
                                className="items-start text-left"
                            />
                        </Link>

                        <div className="mt-24 max-w-xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-200">
                                <Target
                                    size={13}
                                    aria-hidden="true"
                                />
                                Prepare with clarity
                            </div>

                            <h1 className="mt-6 text-5xl font-bold leading-[1.08] tracking-[-0.04em]">
                                Your placement preparation,
                                organised into one system.
                            </h1>

                            <p className="mt-6 max-w-lg text-base leading-8 text-slate-400">
                                Track preparation evidence,
                                understand readiness gaps, and
                                execute a focused daily plan.
                            </p>

                            <div className="mt-9 space-y-4">
                                {benefits.map(
                                    (benefit) => (
                                        <div
                                            key={benefit}
                                            className="flex items-center gap-3 text-sm text-slate-300"
                                        >
                                            <CheckCircle2
                                                size={16}
                                                className="text-emerald-400"
                                                aria-hidden="true"
                                            />

                                            {benefit}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500">
                        <ShieldCheck
                            size={14}
                            className="text-emerald-400"
                            aria-hidden="true"
                        />
                        Secure authentication and user-controlled data
                    </div>
                </section>

                <main className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 sm:py-10">
                    <div className="w-full max-w-md">
                        <div className="mb-8 flex items-center justify-between gap-3 lg:hidden">
                            <Link
                                to="/"
                                aria-label="Go to PlacementOS home"
                                className="min-w-0 rounded-xl transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                <BrandLogo
                                    variant="auth"
                                    priority
                                />
                            </Link>

                            <Link
                                to="/"
                                className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-indigo-400/30 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                <ArrowLeft
                                    size={14}
                                    aria-hidden="true"
                                />
                                Home
                            </Link>
                        </div>

                        <div className="mb-7">
                            <h1 className="text-3xl font-bold tracking-tight">
                                {title}
                            </h1>

                            <p className="mt-2 text-sm leading-6 text-slate-400">
                                {description}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/[0.08] bg-[#0d1323]/90 p-6 shadow-2xl shadow-black/30 sm:p-8">
                            {children}
                        </div>

                        <div className="mt-6 flex justify-center gap-5 text-xs text-slate-500">
                            <Link
                                to="/terms"
                                className="transition hover:text-white"
                            >
                                Terms
                            </Link>

                            <Link
                                to="/privacy"
                                className="transition hover:text-white"
                            >
                                Privacy
                            </Link>

                            <a
                                href="mailto:aryanjaiswal3080@gmail.com?subject=PlacementOS%20support"
                                className="transition hover:text-white"
                            >
                                Support
                            </a>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
