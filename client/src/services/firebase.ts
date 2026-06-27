import {
    FirebaseError,
    getApp,
    getApps,
    initializeApp,
} from "firebase/app";

import {
    GoogleAuthProvider,
    getAuth,
    getRedirectResult,
    signInWithPopup,

    signOut,
} from "firebase/auth";

const GOOGLE_REDIRECT_KEY =
    "placementos_google_redirect_pending";

const getFirebaseConfiguration = () => {
    const configuration = {
        apiKey:
            import.meta.env
                .VITE_FIREBASE_API_KEY,

        authDomain:
            import.meta.env
                .VITE_FIREBASE_AUTH_DOMAIN,

        projectId:
            import.meta.env
                .VITE_FIREBASE_PROJECT_ID,

        appId:
            import.meta.env
                .VITE_FIREBASE_APP_ID,

        messagingSenderId:
            import.meta.env
                .VITE_FIREBASE_MESSAGING_SENDER_ID,
    };

    const missingConfiguration =
        Object.entries(configuration)
            .filter(
                ([, value]) =>
                    !String(value || "").trim()
            )
            .map(([key]) => key);

    if (missingConfiguration.length > 0) {
        throw new Error(
            `Firebase configuration missing: ${missingConfiguration.join(", ")}`
        );
    }

    return configuration;
};

const getFirebaseAuthClient = () => {
    const firebaseApp =
        getApps().length > 0
            ? getApp()
            : initializeApp(
                getFirebaseConfiguration()
            );

    return getAuth(firebaseApp);
};

const createGoogleProvider = () => {
    const provider =
        new GoogleAuthProvider();

    provider.setCustomParameters({
        prompt: "select_account",
    });

    return provider;
};

const finishFirebaseAuthentication =
    async (
        firebaseUser: {
            getIdToken: (
                forceRefresh?: boolean
            ) => Promise<string>;
        }
    ) => {
        const auth =
            getFirebaseAuthClient();

        const idToken =
            await firebaseUser.getIdToken(
                true
            );

        await signOut(auth);

        return idToken;
    };

export const beginGoogleAuthentication =
    async (): Promise<
        string | null
    > => {
        const auth =
            getFirebaseAuthClient();

        const provider =
            createGoogleProvider();

        const result =
            await signInWithPopup(
                auth,
                provider
            );

        return finishFirebaseAuthentication(
            result.user
        );
    };

export const hasPendingGoogleRedirect =
    () => {
        return (
            sessionStorage.getItem(
                GOOGLE_REDIRECT_KEY
            ) === "true"
        );
    };

export const consumeGoogleRedirect =
    async (): Promise<
        string | null
    > => {
        if (!hasPendingGoogleRedirect()) {
            return null;
        }

        sessionStorage.removeItem(
            GOOGLE_REDIRECT_KEY
        );

        const auth =
            getFirebaseAuthClient();

        const result =
            await getRedirectResult(auth);

        if (!result) {
            return null;
        }

        return finishFirebaseAuthentication(
            result.user
        );
    };

export const getGoogleAuthErrorMessage = (
    error: unknown
): string => {
    if (!(error instanceof FirebaseError)) {
        return error instanceof Error
            ? error.message
            : "Google authentication failed.";
    }

    switch (error.code) {
        case "auth/popup-closed-by-user":
        case "auth/cancelled-popup-request":
            return "Google sign-in was cancelled.";

        case "auth/popup-blocked":
            return "The browser blocked the Google sign-in popup.";

        case "auth/network-request-failed":
            return "Network error. Check your internet connection.";

        case "auth/account-exists-with-different-credential":
            return "An account already exists with this email using another sign-in method.";

        case "auth/unauthorized-domain":
            return "This domain is not authorized in Firebase Authentication.";

        default:
            return "Google authentication failed. Please try again.";
    }
};