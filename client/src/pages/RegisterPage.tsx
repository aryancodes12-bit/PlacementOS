import {
    useMemo,
    useState,
} from "react";

import type {
    FormEvent,
} from "react";

import {
    AlertCircle,
    Check,
    Eye,
    EyeOff,
    Loader2,
    LockKeyhole,
    Mail,
    UserRound,
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

const EMAIL_REGEX =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.045] py-3 pl-11 pr-12 text-sm text-white placeholder-slate-600 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/10";

export const RegisterPage = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        acceptedTerms: false,
    });

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmation, setShowConfirmation] =
        useState(false);

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const passwordRequirements =
        useMemo(
            () => [
                {
                    label:
                        "At least 8 characters",
                    valid:
                        form.password
                            .length >= 8,
                },
                {
                    label:
                        "One uppercase letter",
                    valid:
                        /[A-Z]/.test(
                            form.password
                        ),
                },
                {
                    label:
                        "One lowercase letter",
                    valid:
                        /[a-z]/.test(
                            form.password
                        ),
                },
                {
                    label: "One number",
                    valid:
                        /\d/.test(
                            form.password
                        ),
                },
            ],
            [form.password]
        );

    const passwordValid =
        passwordRequirements.every(
            (requirement) =>
                requirement.valid
        );

    const handleSubmit = async (
        event: FormEvent
    ) => {
        event.preventDefault();

        const name =
            form.name
                .trim()
                .replace(/\s+/g, " ");

        const email =
            form.email
                .trim()
                .toLowerCase();

        if (
            name.length < 2 ||
            name.length > 80
        ) {
            setError(
                "Enter your full name."
            );
            return;
        }

        if (!EMAIL_REGEX.test(email)) {
            setError(
                "Enter a valid email address."
            );
            return;
        }

        if (!passwordValid) {
            setError(
                "Your password does not meet the security requirements."
            );
            return;
        }

        if (
            form.password !==
            form.confirmPassword
        ) {
            setError(
                "Passwords do not match."
            );
            return;
        }

        if (!form.acceptedTerms) {
            setError(
                "Accept the Terms and Privacy Policy to continue."
            );
            return;
        }

        setLoading(true);
        setError("");

        try {
            const { data } =
                await authService.register({
                    name,
                    email,
                    password:
                        form.password,
                });

            navigate(
                `/verify-email?sent=1&email=${encodeURIComponent(
                    data.email
                )}`,
                {
                    replace: true,
                }
            );
        } catch (error: any) {
            console.error(
                "Registration error:",
                error?.response?.data ||
                error
            );

            const errorCode =
                error?.response?.data
                    ?.code;

            if (
                errorCode ===
                "EMAIL_NOT_VERIFIED" ||
                errorCode ===
                "VERIFICATION_EMAIL_FAILED"
            ) {
                navigate(
                    `/verify-email?email=${encodeURIComponent(
                        email
                    )}`,
                    {
                        replace: true,
                    }
                );

                return;
            }

            setError(
                getAuthError(
                    error,
                    "Registration failed."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Create your account"
            description="Start building measurable placement readiness."
        >
            {error && (
                <div
                    role="alert"
                    className="mb-5 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                    <AlertCircle
                        size={16}
                        className="mt-0.5 shrink-0"
                    />

                    <span>{error}</span>
                </div>
            )}

            <GoogleAuthButton
                disabled={loading}
                onError={setError}
            />

            <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.08]" />

                <span className="text-xs text-slate-600">
                    or register with email
                </span>

                <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-5"
                noValidate
            >
                <div>
                    <label
                        htmlFor="register-name"
                        className="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Full name
                    </label>

                    <div className="relative">
                        <UserRound
                            size={17}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                        />

                        <input
                            id="register-name"
                            type="text"
                            autoComplete="name"
                            value={form.name}
                            onChange={(event) =>
                                setForm(
                                    (current) => ({
                                        ...current,
                                        name:
                                            event
                                                .target
                                                .value,
                                    })
                                )
                            }
                            className={inputClass}
                            placeholder="Your full name"
                            maxLength={80}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="register-email"
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
                            id="register-email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
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
                        htmlFor="register-password"
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
                            id="register-password"
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            autoComplete="new-password"
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
                            placeholder="Create a secure password"
                            maxLength={128}
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
                            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-white/[0.05] hover:text-white"
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

                    <div className="mt-3 grid grid-cols-2 gap-2">
                        {passwordRequirements.map(
                            (requirement) => (
                                <div
                                    key={
                                        requirement.label
                                    }
                                    className={[
                                        "flex items-center gap-1.5 text-[11px]",
                                        requirement.valid
                                            ? "text-emerald-400"
                                            : "text-slate-600",
                                    ].join(" ")}
                                >
                                    <Check
                                        size={12}
                                    />

                                    {
                                        requirement.label
                                    }
                                </div>
                            )
                        )}
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="confirm-password"
                        className="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Confirm password
                    </label>

                    <div className="relative">
                        <LockKeyhole
                            size={17}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                        />

                        <input
                            id="confirm-password"
                            type={
                                showConfirmation
                                    ? "text"
                                    : "password"
                            }
                            autoComplete="new-password"
                            value={
                                form.confirmPassword
                            }
                            onChange={(event) =>
                                setForm(
                                    (current) => ({
                                        ...current,
                                        confirmPassword:
                                            event
                                                .target
                                                .value,
                                    })
                                )
                            }
                            className={inputClass}
                            placeholder="Repeat your password"
                            required
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmation(
                                    (current) =>
                                        !current
                                )
                            }
                            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-white/[0.05] hover:text-white"
                            aria-label={
                                showConfirmation
                                    ? "Hide confirmation password"
                                    : "Show confirmation password"
                            }
                        >
                            {showConfirmation ? (
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

                <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-slate-500">
                    <input
                        type="checkbox"
                        checked={
                            form.acceptedTerms
                        }
                        onChange={(event) =>
                            setForm(
                                (current) => ({
                                    ...current,
                                    acceptedTerms:
                                        event
                                            .target
                                            .checked,
                                })
                            )
                        }
                        className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/[0.04] accent-indigo-500"
                    />

                    <span>
                        I agree to the{" "}
                        <Link
                            to="/terms"
                            className="text-indigo-300 hover:text-indigo-200"
                        >
                            Terms
                        </Link>{" "}
                        and{" "}
                        <Link
                            to="/privacy"
                            className="text-indigo-300 hover:text-indigo-200"
                        >
                            Privacy Policy
                        </Link>
                        .
                    </span>
                </label>

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
                        ? "Creating account..."
                        : "Create account"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                    to="/login"
                    className="font-semibold text-indigo-300 hover:text-indigo-200"
                >
                    Sign in
                </Link>
            </p>
        </AuthShell>
    );
};