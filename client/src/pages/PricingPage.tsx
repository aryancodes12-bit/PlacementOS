import {
    BadgeCheck,
    BarChart3,
    Check,
    Crown,
    HelpCircle,
    Minus,
    ShieldCheck,
    Sparkles,
    Zap,
} from "lucide-react";
import { AppLayout } from "../components/ui/AppLayout";

const freeFeatures = [
    "DSA tracker",
    "Basic dashboard",
    "Resume upload",
    "Limited interview replay tracking",
];

const premiumFeatures = [
    "Unlimited AI Daily Plan generation",
    "Resume Intelligence with ATS insights",
    "Interview Replay Intelligence",
    "Company readiness analysis",
    "Priority AI improvement tips",
    "Premium SaaS-ready profile badge",
];

const comparisonRows = [
    {
        feature: "DSA Tracker and revision queue",
        free: "included",
        premium: "included",
    },
    {
        feature: "Placement readiness dashboard",
        free: "included",
        premium: "included",
    },
    {
        feature: "Full-stack roadmap",
        free: "included",
        premium: "included",
    },
    {
        feature: "Basic AI Daily Plan",
        free: "included",
        premium: "included",
    },
    {
        feature: "Resume Intelligence",
        free: "Limited",
        premium: "Higher limits",
    },
    {
        feature: "Audio/video Interview Replay",
        free: "Limited",
        premium: "Higher limits",
    },
    {
        feature: "Advanced question-level feedback",
        free: "none",
        premium: "included",
    },
    {
        feature: "Resume version comparison",
        free: "none",
        premium: "included",
    },
    {
        feature: "Complete readiness history",
        free: "none",
        premium: "included",
    },
    {
        feature: "Advanced weakness analytics",
        free: "none",
        premium: "included",
    },
    {
        feature: "Priority AI processing",
        free: "none",
        premium: "included",
    },
    {
        feature: "Exportable preparation reports",
        free: "none",
        premium: "included",
    },
];

const trustBadges = [
    "Free during public beta",
    "No payment required",
    "Premium coming later",
];

const betaNotes = [
    {
        title: "What you can use today",
        description:
            "Core preparation tools remain available for beta users while PlacementOS validates the learning workflow.",
    },
    {
        title: "What premium will add",
        description:
            "Advanced AI workflows, deeper readiness insights, and higher usage limits will be introduced after beta.",
    },
    {
        title: "How pricing will work",
        description:
            "Plan details will be announced before billing is enabled, so users can choose before anything changes.",
    },
];

const faqs = [
    {
        question: "Is PlacementOS free right now?",
        answer: "Yes. PlacementOS is currently free during public beta.",
    },
    {
        question: "When will Premium subscriptions launch?",
        answer: "Premium subscriptions will be introduced later for advanced AI-powered workflows and higher usage limits.",
    },
    {
        question: "Will beta users lose access without warning?",
        answer: "No. Core beta access stays free, and paid plan details will be communicated before billing is enabled.",
    },
    {
        question: "What should I use now?",
        answer: "Use the free beta plan to track DSA practice, manage preparation, upload resumes, and review interview progress.",
    },
];

const renderComparisonValue = (value: string) => {
    if (value === "included") {
        return (
            <span className="inline-flex items-center justify-center gap-2 text-success">
                <Check size={15} />
                <span className="sr-only">Included</span>
            </span>
        );
    }

    if (value === "none") {
        return (
            <span className="inline-flex items-center justify-center gap-2 text-text-tertiary">
                <Minus size={15} />
                <span className="sr-only">Not included</span>
            </span>
        );
    }

    return <span className="text-text-secondary">{value}</span>;
};

export const PricingPage = () => {
    return (
        <AppLayout
            title="Pricing"
            description="PlacementOS is free during public beta. Premium subscriptions are planned for later."
        >
            <div className="mb-5 rounded-2xl border border-success/30 bg-success/10 px-5 py-4 text-sm text-success">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-bold text-text-primary">Free during public beta</p>
                        <p className="mt-1 text-text-secondary">
                            PlacementOS is currently free during public beta. Premium subscriptions will be introduced
                            later for advanced AI-powered workflows and higher usage limits.
                        </p>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                        <ShieldCheck size={14} />
                        No payment needed
                    </span>
                </div>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-3">
                {trustBadges.map((badge) => (
                    <div
                        key={badge}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-sm font-medium text-text-secondary"
                    >
                        <BadgeCheck size={17} className="text-brand" />
                        {badge}
                    </div>
                ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-bg-secondary p-6">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-tertiary text-text-secondary">
                            <Zap size={18} />
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-text-primary">Free</h2>
                            <p className="text-sm text-text-tertiary">For basic preparation tracking.</p>
                        </div>
                    </div>

                    <p className="mb-6 text-3xl font-bold text-text-primary">Free</p>

                    <div className="space-y-3">
                        {freeFeatures.map((feature) => (
                            <div key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                                <Check size={15} className="text-success" />
                                {feature}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 rounded-xl border border-border bg-bg-tertiary px-4 py-3 text-sm text-text-tertiary">
                        Active for all beta users.
                    </div>
                </div>

                <div className="rounded-2xl border border-brand/40 bg-bg-secondary p-6 shadow-[0_0_40px_rgba(99,102,241,0.12)]">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-muted text-brand">
                                <Crown size={18} />
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-text-primary">Premium</h2>
                                    <span className="rounded-full bg-brand-muted px-2 py-0.5 text-xs font-medium text-brand">
                                        Planned
                                    </span>
                                </div>
                                <p className="text-sm text-text-tertiary">For serious placement preparation.</p>
                            </div>
                        </div>
                    </div>

                    <p className="mb-1 text-3xl font-bold text-text-primary">Coming soon</p>
                    <p className="mb-6 text-sm text-text-tertiary">
                        Pricing will be announced before paid access begins.
                    </p>

                    <div className="space-y-3">
                        {premiumFeatures.map((feature) => (
                            <div key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                                <Check size={15} className="text-success" />
                                {feature}
                            </div>
                        ))}
                    </div>

                    <button
                        disabled
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Sparkles size={16} />
                        Premium Coming Later
                    </button>

                    <p className="mt-3 text-center text-xs text-text-tertiary">
                        Beta users can keep using PlacementOS free while premium plans are being prepared.
                    </p>
                </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
                <section className="rounded-2xl border border-border bg-bg-secondary p-6">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
                                Included features
                            </p>
                            <h2 className="mt-2 text-xl font-bold text-text-primary">Free vs Premium</h2>
                        </div>
                        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-bg-tertiary px-3 py-1 text-xs font-medium text-text-tertiary">
                            <BarChart3 size={14} />
                            Beta roadmap
                        </span>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border">
                        <div className="grid grid-cols-[1.4fr_0.65fr_0.75fr] bg-bg-tertiary text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary">
                            <div className="px-4 py-3">Feature</div>
                            <div className="px-4 py-3 text-center">Free</div>
                            <div className="px-4 py-3 text-center">Premium</div>
                        </div>

                        <div className="divide-y divide-border">
                            {comparisonRows.map((row) => (
                                <div
                                    key={row.feature}
                                    className="grid grid-cols-[1.4fr_0.65fr_0.75fr] items-center text-sm"
                                >
                                    <div className="px-4 py-3 font-medium text-text-secondary">{row.feature}</div>
                                    <div className="px-4 py-3 text-center">{renderComparisonValue(row.free)}</div>
                                    <div className="px-4 py-3 text-center">{renderComparisonValue(row.premium)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="space-y-5">
                    <section className="rounded-2xl border border-border bg-bg-secondary p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Beta access</p>
                        <div className="mt-5 space-y-4">
                            {betaNotes.map((note) => (
                                <div key={note.title} className="rounded-xl border border-border bg-bg-tertiary p-4">
                                    <p className="text-sm font-semibold text-text-primary">{note.title}</p>
                                    <p className="mt-2 text-sm leading-6 text-text-tertiary">{note.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-border bg-bg-secondary p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Plan promise</p>
                        <div className="mt-5 rounded-xl border border-border bg-bg-tertiary p-4">
                            <p className="text-sm leading-6 text-text-secondary">
                                The beta plan is designed to keep placement preparation practical and accessible.
                                Premium will focus on heavier AI analysis, automation, and usage-intensive workflows
                                once those features are ready for broader release.
                            </p>
                        </div>
                    </section>
                </div>
            </div>

            <section className="mt-5 rounded-2xl border border-border bg-bg-secondary p-6">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-muted text-brand">
                        <HelpCircle size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">FAQ</p>
                        <h2 className="text-xl font-bold text-text-primary">Pricing questions</h2>
                    </div>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq) => (
                        <details
                            key={faq.question}
                            className="group rounded-xl border border-border bg-bg-tertiary px-4 py-3"
                        >
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-text-primary">
                                {faq.question}
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-text-tertiary transition group-open:rotate-45 group-open:text-brand">
                                    <Check size={14} />
                                </span>
                            </summary>
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-text-tertiary">{faq.answer}</p>
                        </details>
                    ))}
                </div>
            </section>
        </AppLayout>
    );
};
