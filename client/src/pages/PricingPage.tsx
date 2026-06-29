import { useEffect, useState } from "react";
import {
    BadgeCheck,
    BarChart3,
    Check,
    Crown,
    HelpCircle,
    Loader2,
    Minus,
    ShieldCheck,
    Sparkles,
    Zap,
} from "lucide-react";
import { AppLayout } from "../components/ui/AppLayout";
import { paymentService } from "../services/payment.service";
import { useAuthStore } from "../store/authStore";

type SubscriptionPlan = "FREE" | "PREMIUM";

type RazorpayPaymentResponse = {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill: {
        name: string;
        email: string;
    };
    theme: {
        color: string;
    };
    handler: (response: RazorpayPaymentResponse) => Promise<void>;
};

type RazorpayCheckout = {
    open: () => void;
};

type RazorpayConstructor = new (options: RazorpayCheckoutOptions) => RazorpayCheckout;

declare global {
    interface Window {
        Razorpay?: RazorpayConstructor;
    }
}

const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

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
    "Razorpay test checkout",
    "No real transactions",
    "Demo SaaS payment flow",
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
        question: "Will this charge real money?",
        answer: "No. This page is wired for Razorpay test mode and clearly marked as a demo flow.",
    },
    {
        question: "What changes after upgrading?",
        answer: "The current visual flow shows Premium as a one-time demo plan with higher AI limits and advanced readiness insights.",
    },
    {
        question: "Can recruiters safely test the button?",
        answer: "Yes. The page explains that no real transactions are deducted while using Razorpay test keys.",
    },
    {
        question: "Is the comparison table live data?",
        answer: "No. It is static frontend content for clarity during portfolio reviews and product demos.",
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
    const { user } = useAuthStore();

    const [plan, setPlan] = useState<SubscriptionPlan>("FREE");
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);

    const handleUpgrade = async () => {
        try {
            setPaying(true);

            const scriptLoaded = await loadRazorpayScript();

            if (!scriptLoaded) {
                alert("Razorpay checkout failed to load. Check your internet connection.");
                return;
            }

            const { data } = await paymentService.createPremiumOrder();

            const Razorpay = window.Razorpay;

            if (!Razorpay) {
                alert("Razorpay checkout failed to initialize.");
                return;
            }

            const options: RazorpayCheckoutOptions = {
                key: data.keyId,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "PlacementOS",
                description: "PlacementOS Premium Plan",
                order_id: data.order.id,
                prefill: {
                    name: user?.name ?? "",
                    email: user?.email ?? "",
                },
                theme: {
                    color: "#6366F1",
                },
                handler: async (response) => {
                    try {
                        await paymentService.verifyPayment(response);
                        setPlan("PREMIUM");
                        alert("Payment successful. Premium unlocked.");
                    } catch (error) {
                        console.error("Payment verification failed:", error);
                        alert("Payment verification failed. Please contact support.");
                    }
                },
            };

            const razorpay = new Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error("Failed to start payment:", error);
            alert("Failed to start payment. Please try again.");
        } finally {
            setPaying(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const syncSubscription = async () => {
            try {
                const { data } = await paymentService.getSubscription();

                if (!isMounted) {
                    return;
                }

                setPlan(data.plan ?? "FREE");
            } catch (error) {
                console.error("Failed to fetch subscription:", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void syncSubscription();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <AppLayout
            title="Premium"
            description="Upgrade PlacementOS with premium AI placement preparation tools."
        >
            <div className="mb-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-bold text-amber-50">Demo Mode - No real transactions</p>
                        <p className="mt-1 text-amber-100/80">
                            Razorpay checkout runs with test keys for portfolio review and recruiter demos.
                        </p>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-50">
                        <ShieldCheck size={14} />
                        Test checkout only
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

                    <p className="mb-6 text-3xl font-bold text-text-primary">₹0</p>

                    <div className="space-y-3">
                        {freeFeatures.map((feature) => (
                            <div key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                                <Check size={15} className="text-success" />
                                {feature}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 rounded-xl border border-border bg-bg-tertiary px-4 py-3 text-sm text-text-tertiary">
                        Current starter plan.
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
                                        Recommended
                                    </span>
                                </div>
                                <p className="text-sm text-text-tertiary">For serious placement preparation.</p>
                            </div>
                        </div>
                    </div>

                    <p className="mb-1 text-3xl font-bold text-text-primary">₹199</p>
                    <p className="mb-6 text-sm text-text-tertiary">One-time test plan for demo SaaS flow.</p>

                    <div className="space-y-3">
                        {premiumFeatures.map((feature) => (
                            <div key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                                <Check size={15} className="text-success" />
                                {feature}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleUpgrade}
                        disabled={loading || paying || plan === "PREMIUM"}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading || paying ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Processing...
                            </>
                        ) : plan === "PREMIUM" ? (
                            <>
                                <Sparkles size={16} />
                                Premium Active
                            </>
                        ) : (
                            <>
                                <Crown size={16} />
                                Upgrade to Premium
                            </>
                        )}
                    </button>

                    <p className="mt-3 text-center text-xs text-text-tertiary">
                        Test mode only. No real money is deducted with Razorpay test keys.
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
                            Static comparison
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
                                    <p className="mt-2 text-sm leading-6 text-text-secondary">{note.description}</p>
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
                        <h2 className="text-xl font-bold text-text-primary">Premium demo questions</h2>
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
