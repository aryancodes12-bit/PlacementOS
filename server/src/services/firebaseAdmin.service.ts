import {
    cert,
    getApp,
    getApps,
    initializeApp,
} from "firebase-admin/app";

import {
    getAuth,
} from "firebase-admin/auth";

const FIREBASE_ADMIN_APP_NAME =
    "placementos-firebase-admin";

const getRequiredEnvironmentValue = (
    key: string
): string => {
    const value =
        process.env[key]?.trim();

    if (!value) {
        throw new Error(
            `${key} is missing from server environment variables.`
        );
    }

    return value;
};

const getFirebaseAdminApp = () => {
    const existingApp =
        getApps().find(
            (app) =>
                app.name ===
                FIREBASE_ADMIN_APP_NAME
        );

    if (existingApp) {
        return existingApp;
    }

    const projectId =
        getRequiredEnvironmentValue(
            "FIREBASE_PROJECT_ID"
        );

    const clientEmail =
        getRequiredEnvironmentValue(
            "FIREBASE_CLIENT_EMAIL"
        );

    const privateKey =
        getRequiredEnvironmentValue(
            "FIREBASE_PRIVATE_KEY"
        ).replace(/\\n/g, "\n");

    return initializeApp(
        {
            credential: cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        },
        FIREBASE_ADMIN_APP_NAME
    );
};

export const verifyFirebaseIdToken = (
    idToken: string
) => {
    return getAuth(
        getFirebaseAdminApp()
    ).verifyIdToken(idToken);
};