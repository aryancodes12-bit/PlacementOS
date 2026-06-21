import {
    cert,
    getApps,
    initializeApp,
} from "firebase-admin/app";

import {
    getAuth,
} from "firebase-admin/auth";

const FIREBASE_APP_NAME =
    "placementos-auth";

const requireEnvironmentVariable = (
    key: string
): string => {
    const value = process.env[key]?.trim();

    if (!value) {
        throw new Error(
            `Missing required environment variable: ${key}`
        );
    }

    return value;
};

export const getFirebaseAdminAuth = () => {
    const existingApp = getApps().find(
        (app) => app.name === FIREBASE_APP_NAME
    );

    if (existingApp) {
        return getAuth(existingApp);
    }

    const projectId = requireEnvironmentVariable(
        "FIREBASE_PROJECT_ID"
    );

    const clientEmail = requireEnvironmentVariable(
        "FIREBASE_CLIENT_EMAIL"
    );

    const privateKey = requireEnvironmentVariable(
        "FIREBASE_PRIVATE_KEY"
    ).replace(/\\n/g, "\n");

    const firebaseApp = initializeApp(
        {
            credential: cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        },
        FIREBASE_APP_NAME
    );

    return getAuth(firebaseApp);
};