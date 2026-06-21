import {
    useEffect,
    useRef,
    useState,
} from "react";

import type {
    FormEvent,
} from "react";

import {
    AlertCircle,
    CheckCircle2,
    Loader2,
    MailCheck,
    RefreshCw,
} from "lucide-react";

import {
    Link,
    useSearchParams,
} from "react-router-dom";

import {
    AuthShell,
} from "../components/auth/AuthShell";

import {
    authService,
    getAuthError,
} from "../services/auth.service";

type VerificationStatus =
    | "waiting"
    | "verifying"
    | "success"
    | "error";

export const VerifyEmailPage = () => {
    const [searchParams] =
        useSearchParams();

    const initialToken =
        searchParams.get("token") || "";

    const initialEmail =
        searchParams.get("email") || "";

    const sent =
        searchParams.get("sent") === "1";

    const verificationStarted =
        useRef(false);

    const [email, setEmail] =
        useState(initialEmail);

    const [status, setStatus] =
        useState<VerificationStatus>(
            initialToken
                ? "verifying"
                : "waiting"
        );

    const [message, setMessage] =
        useState(
            sent
                ? "We sent a verification link to your email address."
                : "Enter your email to request a new verification link."
        );

    const [resending, setResending] =
        useState(false);

    useEffect(() => {
        if (
            !initialToken ||
            verificationStarted.current
        ) {
            return;
        }

        verificationStarted.current = true;

        /*
         * Remove the secret token from the visible
         * browser URL after reading it.
         */
        window.history.replaceState(
            {},
            document.title,
            "/verify-email"
        );

        const verify = async () => {
            setStatus("verifying");

            try {
                const { data } =
                    await authService.verifyEmail(
                        initialToken
                    );

                setMessage(data.message);
                setStatus("success");
            } catch (error) {
                setMessage(
                    getAuthError(
                        error,
                        "The verification link is invalid or expired."
                    )
                );

                setStatus("error");
            }
        };

        void verify();
    }, [initialToken]);

    const handleResend = async (
        event: FormEvent
    ) => {
        event.preventDefault();

        const normalizedEmail =
            email.trim().toLowerCase();

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                normalizedEmail
            )
        ) {
            setStatus("error");
            setMessage(
                "Enter a valid email address."
            );
            return;
        }

        setResending(true);

        try {
            const { data } =
                await authService.resendVerification(
                    normalizedEmail
                );

            setStatus("waiting");
            setMessage(data.message);
        } catch (error) {
            setStatus("error");

            setMessage(
                getAuthError(
                    error,
                    "Verification email could not be sent."
                )
            );
        } finally {
            setResending(false);
        }
    };

    return (
        <AuthShell
            title="Verify your email"
            description="Email verification protects your account and preparation history."
        >
            <div className="text-center">
                <div
                    className={[
                        "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border",
                        status === "success"
                            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                            : status === "error"
                                ? "border-red-400/20 bg-red-500/10 text-red-300"
                                : "border-indigo-400/20 bg-indigo-500/10 text-indigo-300",
                    ].join(" ")}
                >
                    {status ===
                        "verifying" ? (
                        <Loader2
                            size={25}
                            className="animate-spin"
                        />
                    ) : status ===
                        "success" ? (
                        <CheckCircle2
                            size={26}
                        />
                    ) : status ===
                        "error" ? (
                        <AlertCircle
                            size={26}
                        />
                    ) : (
                        <MailCheck
                            size={26}
                        />
                    )}
                </div>

                <h2 className="mt-5 text-xl font-semibold text-white">
                    {status === "verifying"
                        ? "Verifying your email"
                        : status === "success"
                            ? "Email verified"
                            : "Check your inbox"}
                </h2>

                <p
                    role="status"
                    className="mt-3 text-sm leading-6 text-slate-400"
                >
                    {message}
                </p>
            </div>

            {status === "success" ? (
                <Link
                    to="/login"
                    className="mt-7 flex min-h-12 w-full items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                >
                    Continue to sign in
                </Link>
            ) : status !==
                "verifying" ? (
                <form
                    onSubmit={handleResend}
                    className="mt-7 space-y-4"
                >
                    <div>
                        <label
                            htmlFor="verification-email"
                            className="mb-2 block text-left text-sm font-medium text-slate-300"
                        >
                            Email address
                        </label>

                        <input
                            id="verification-email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(
                                    event.target
                                        .value
                                )
                            }
                            className="w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-indigo-400/60"
                            placeholder="you@example.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={resending}
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-50"
                    >
                        {resending ? (
                            <Loader2
                                size={16}
                                className="animate-spin"
                            />
                        ) : (
                            <RefreshCw
                                size={16}
                            />
                        )}

                        {resending
                            ? "Sending..."
                            : "Resend verification email"}
                    </button>

                    <Link
                        to="/login"
                        className="block text-center text-sm font-medium text-indigo-300 hover:text-indigo-200"
                    >
                        Return to sign in
                    </Link>
                </form>
            ) : null}
        </AuthShell>
    );
};