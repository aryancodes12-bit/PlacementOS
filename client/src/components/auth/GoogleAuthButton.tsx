import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Loader2,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import {
    authService,
    getAuthError,
} from "../../services/auth.service";

import {
    beginGoogleAuthentication,
    consumeGoogleRedirect,
    getGoogleAuthErrorMessage,
    hasPendingGoogleRedirect,
} from "../../services/firebase";

import {
    useAuthStore,
} from "../../store/authStore";

interface GoogleAuthButtonProps {
    disabled?: boolean;
    onError: (message: string) => void;
}

export const GoogleAuthButton = ({
    disabled = false,
    onError,
}: GoogleAuthButtonProps) => {
    const navigate = useNavigate();

    const setAuth = useAuthStore(
        (state) => state.setAuth
    );

    const [loading, setLoading] =
        useState(false);

    const redirectHandled =
        useRef(false);

    const exchangeFirebaseToken =
        async (idToken: string) => {
            const { data } =
                await authService.googleAuthentication(
                    idToken
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
        };

    useEffect(() => {
        if (
            redirectHandled.current ||
            !hasPendingGoogleRedirect()
        ) {
            return;
        }

        redirectHandled.current = true;

        const completeRedirect =
            async () => {
                setLoading(true);
                onError("");

                try {
                    const idToken =
                        await consumeGoogleRedirect();

                    if (idToken) {
                        await exchangeFirebaseToken(
                            idToken
                        );
                    }
                } catch (error) {
                    onError(
                        getGoogleAuthErrorMessage(
                            error
                        )
                    );
                } finally {
                    setLoading(false);
                }
            };

        void completeRedirect();
    }, []);

    const handleGoogleAuthentication =
        async () => {
            setLoading(true);
            onError("");

            try {
                const idToken =
                    await beginGoogleAuthentication();

                /*
                 * Redirect mode returns null because
                 * browser navigation is about to occur.
                 */
                if (idToken) {
                    await exchangeFirebaseToken(
                        idToken
                    );
                }
            } catch (error) {
                console.error(
                    "Google authentication error:",
                    error
                );

                const firebaseMessage =
                    getGoogleAuthErrorMessage(
                        error
                    );

                onError(
                    firebaseMessage ||
                    getAuthError(
                        error,
                        "Google authentication failed."
                    )
                );
            } finally {
                setLoading(false);
            }
        };

    return (
        <button
            type="button"
            onClick={
                handleGoogleAuthentication
            }
            disabled={
                disabled || loading
            }
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
            {loading ? (
                <Loader2
                    size={17}
                    className="animate-spin"
                />
            ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#4285F4]">
                    G
                </span>
            )}

            {loading
                ? "Connecting to Google..."
                : "Continue with Google"}
        </button>
    );
};