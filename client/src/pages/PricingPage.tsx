import { useEffect, useState } from "react";
import { Check, Crown, Loader2, Sparkles, Zap } from "lucide-react";
import { AppLayout } from "../components/ui/AppLayout";
import { paymentService } from "../services/payment.service";
import { useAuthStore } from "../store/authStore";

declare global {
    interface Window {
        Razorpay: any;
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

export const PricingPage = () => {
    const { user } = useAuthStore();

    const [plan, setPlan] = useState<"FREE" | "PREMIUM">("FREE");
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);

    const fetchSubscription = async () => {
        try {
            const { data } = await paymentService.getSubscription();
            setPlan(data.plan ?? "FREE");
        } catch (error) {
            console.error("Failed to fetch subscription:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async () => {
        try {
            setPaying(true);

            const scriptLoaded = await loadRazorpayScript();

            if (!scriptLoaded) {
                alert("Razorpay checkout failed to load. Check your internet connection.");
                return;
            }

            const { data } = await paymentService.createPremiumOrder();

            const options = {
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
                handler: async (response: {
                    razorpay_order_id: string;
                    razorpay_payment_id: string;
                    razorpay_signature: string;
                }) => {
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

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error("Failed to start payment:", error);
            alert("Failed to start payment. Please try again.");
        } finally {
            setPaying(false);
        }
    };

    useEffect(() => {
        fetchSubscription();
    }, []);

    return (
        <AppLayout
            title="Premium"
            description="Upgrade PlacementOS with premium AI placement preparation tools."
        >
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
                        {[
                            "DSA tracker",
                            "Basic dashboard",
                            "Resume upload",
                            "Limited interview replay tracking",
                        ].map((feature) => (
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
                        {[
                            "Unlimited AI Daily Plan generation",
                            "Resume Intelligence with ATS insights",
                            "Interview Replay Intelligence",
                            "Company readiness analysis",
                            "Priority AI improvement tips",
                            "Premium SaaS-ready profile badge",
                        ].map((feature) => (
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
        </AppLayout>
    );
};