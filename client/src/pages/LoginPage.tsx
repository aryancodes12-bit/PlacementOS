import {
    useState,
} from "react";

import type {
    FormEvent,
} from "react";

import {
    AlertCircle,
    Eye,
    EyeOff,
    Loader2,
    LockKeyhole,
    Mail,
} from "lucide-react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    AuthShell,
} from "../components/auth/AuthShell";

import {
    GoogleAuthButton,
} from "../components/auth/GoogleAuthButton";

import {
    authService,
    getAuthError,
} from "../services/auth.service";

import {
    useAuthStore,
} from "../store/authStore";

const EMAIL_REGEX =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.045] py-3 pl-11 pr-12 text-sm text-white placeholder-slate-600 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/10";

export const LoginPage = () => {
    const navigate = useNavigate();

    const setAuth = useAuthStore(
        (state) => state.setAuth
    );

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [showPassword, setShowPassword] =
        useState(false);

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [verificationRequired, setVerificationRequired] =
        useState(false);

    const handleSubmit = async (
        event: FormEvent
    ) => {
        event.preventDefault();

        const email =
            form.email
                .trim()
                .toLowerCase();

        if (!EMAIL_REGEX.test(email)) {
            setError(
                "Enter a valid email address."
            );
            return;
        }

        if (!form.password) {
            setError(
                "Enter your password."
            );
            return;
        }

        setLoading(true);
        setError("");
        setVerificationRequired(false);

        try {
            const { data } =
                await authService.login(
                    email,
                    form.password
                );

            setAuth(
                data.user,
                data.accessToken
            );

            navigate(
                "/dashboard",
                {
                    replace: true,
                }
            );
        } catch (error: any) {
            console.error(
                "Login error:",
                error?.response?.data ||
                error
            );

            if (
                error?.response?.data
                    ?.code ===
                "EMAIL_NOT_VERIFIED"
            ) {
                setVerificationRequired(
                    true
                );
            }

            setError(
                getAuthError(
                    error,
                    "Login failed."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Welcome back"
            description="Sign in to continue your placement preparation."
        >
            {error && (
                <div
                    role="alert"
                    className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                    <div className="flex items-start gap-2">
                        <AlertCircle
                            size={16}
                            className="mt-0.5 shrink-0"
                        />

                        <span>{error}</span>
                    </div>

                    {verificationRequired && (
                        <Link
                            to={`/verify-email?email=${encodeURIComponent(
                                form.email
                                    .trim()
                                    .toLowerCase()
                            )}`}
                            className="mt-2 inline-block font-semibold text-red-200 underline"
                        >
                            Resend verification email
                        </Link>
                    )}
                </div>
            )}

            <GoogleAuthButton
                disabled={loading}
                onError={setError}
            />

            <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.08]" />

                <span className="text-xs text-slate-600">
                    or use email
                </span>

                <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <div className="mb-5 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-3 text-xs leading-6 text-slate-300">
                <div className="flex items-start gap-2">
                    <Mail
                        size={15}
                        className="mt-0.5 shrink-0 text-indigo-300"
                        aria-hidden="true"
                    />

                    <p>
                        Didn&apos;t receive the verification email? Please
                        check your Spam/Junk folder. If you still can&apos;t
                        find it, click{" "}
                        <Link
                            to={`/verify-email?email=${encodeURIComponent(
                                form.email
                                    .trim()
                                    .toLowerCase()
                            )}`}
                            className="font-semibold text-indigo-200 underline underline-offset-4 transition hover:text-white"
                        >
                            Resend Verification Email
                        </Link>
                        .
                    </p>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-5"
                noValidate
            >
                <div>
                    <label
                        htmlFor="login-email"
                        className="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Email address
                    </label>

                    <div className="relative">
                        <Mail
                            size={17}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                        />

                        <input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            value={form.email}
                            onChange={(event) =>
                                setForm(
                                    (current) => ({
                                        ...current,
                                        email:
                                            event
                                                .target
                                                .value,
                                    })
                                )
                            }
                            className={inputClass}
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="login-password"
                        className="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Password
                    </label>

                    <div className="relative">
                        <LockKeyhole
                            size={17}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                        />

                        <input
                            id="login-password"
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            autoComplete="current-password"
                            value={form.password}
                            onChange={(event) =>
                                setForm(
                                    (current) => ({
                                        ...current,
                                        password:
                                            event
                                                .target
                                                .value,
                                    })
                                )
                            }
                            className={inputClass}
                            placeholder="Enter your password"
                            required
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowPassword(
                                    (current) =>
                                        !current
                                )
                            }
                            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
                            aria-label={
                                showPassword
                                    ? "Hide password"
                                    : "Show password"
                            }
                        >
                            {showPassword ? (
                                <EyeOff
                                    size={17}
                                />
                            ) : (
                                <Eye
                                    size={17}
                                />
                            )}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading && (
                        <Loader2
                            size={16}
                            className="animate-spin"
                        />
                    )}

                    {loading
                        ? "Signing in..."
                        : "Sign in"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
                New to PlacementOS?{" "}
                <Link
                    to="/register"
                    className="font-semibold text-indigo-300 transition hover:text-indigo-200"
                >
                    Create an account
                </Link>
            </p>
        </AuthShell>
    );
};
