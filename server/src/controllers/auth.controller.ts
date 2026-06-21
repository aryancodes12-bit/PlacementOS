import {
    createHash,
    randomBytes,
} from "crypto";

import type {
    Request,
    Response,
} from "express";

import { prisma } from "../prisma/client";

import {
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    hashPassword,
    verifyRefreshToken,
} from "../services/auth.service";

import {
    sendVerificationEmail,
} from "../services/emailVerification.service";

import {
    getFirebaseAdminAuth,
} from "../services/firebaseAdmin.service";

import type {
    AuthRequest,
} from "../middlewares/auth.middleware";

const EMAIL_REGEX =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;

const VERIFICATION_TOKEN_TTL_MS =
    30 * 60 * 1000;

const RESEND_COOLDOWN_MS =
    60 * 1000;

const normalizeEmail = (
    value: unknown
): string => {
    return String(value || "")
        .trim()
        .toLowerCase();
};

const normalizeName = (
    value: unknown
): string => {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ");
};

const createTokenHash = (
    token: string
): string => {
    return createHash("sha256")
        .update(token)
        .digest("hex");
};

const createVerificationToken = () => {
    const rawToken =
        randomBytes(32).toString("hex");

    return {
        rawToken,
        tokenHash:
            createTokenHash(rawToken),
        expiresAt: new Date(
            Date.now() +
            VERIFICATION_TOKEN_TTL_MS
        ),
    };
};

const issueVerificationEmail = async (
    user: {
        id: string;
        name: string;
        email: string;
    }
) => {
    const {
        rawToken,
        tokenHash,
        expiresAt,
    } = createVerificationToken();

    await prisma.user.update({
        where: {
            id: user.id,
        },

        data: {
            emailVerificationTokenHash:
                tokenHash,

            emailVerificationExpiresAt:
                expiresAt,

            emailVerificationSentAt:
                new Date(),
        },
    });

    try {
        await sendVerificationEmail({
            email: user.email,
            name: user.name,
            token: rawToken,
        });
    } catch (error) {
        /*
         * Sending failed, so do not pretend that an email
         * was successfully sent or enforce a false cooldown.
         */
        try {
            await prisma.user.update({
                where: {
                    id: user.id,
                },

                data: {
                    emailVerificationTokenHash:
                        null,

                    emailVerificationExpiresAt:
                        null,

                    emailVerificationSentAt:
                        null,
                },
            });
        } catch (cleanupError) {
            console.error(
                "Verification state cleanup failed:",
                cleanupError
            );
        }

        throw error;
    }
};
const createAuthResponse = (
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        avatarUrl: string | null;
        emailVerified: boolean;
    }
) => {
    const accessToken =
        generateAccessToken(
            user.id,
            user.role
        );

    const refreshToken =
        generateRefreshToken(user.id);

    return {
        accessToken,
        refreshToken,

        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
            emailVerified:
                user.emailVerified,
        },
    };
};

// ─────────────────────────────────────────────
// Register with email and password
// ─────────────────────────────────────────────

export const register = async (
    req: Request,
    res: Response
) => {
    const name = normalizeName(
        req.body?.name
    );

    const email = normalizeEmail(
        req.body?.email
    );

    const password = String(
        req.body?.password || ""
    );

    try {
        if (
            name.length < 2 ||
            name.length > 80
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name must contain between 2 and 80 characters.",
            });
        }

        if (
            email.length > 254 ||
            !EMAIL_REGEX.test(email)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Enter a valid email address.",
            });
        }

        if (
            !PASSWORD_REGEX.test(password)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must contain 8–128 characters, including uppercase, lowercase, and a number.",
            });
        }

        const existingUser =
            await prisma.user.findUnique({
                where: {
                    email,
                },
            });

        if (existingUser) {
            if (
                !existingUser.emailVerified
            ) {
                return res.status(409).json({
                    success: false,
                    code: "EMAIL_NOT_VERIFIED",
                    message:
                        "This account already exists but its email is not verified.",
                });
            }

            return res.status(409).json({
                success: false,
                code: "EMAIL_ALREADY_REGISTERED",
                message:
                    "An account with this email already exists.",
            });
        }

        const hashedPassword =
            await hashPassword(password);

        const user =
            await prisma.user.create({
                data: {
                    name,
                    email,
                    password:
                        hashedPassword,

                    emailVerified: false,

                    profile: {
                        create: {},
                    },
                },

                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            });

        try {
            await issueVerificationEmail(
                user
            );
        } catch (emailError) {
            console.error(
                "Initial verification email failed:",
                emailError
            );

            return res.status(503).json({
                success: false,
                code: "VERIFICATION_EMAIL_FAILED",
                message:
                    "Your account was created, but the verification email could not be sent. Use resend verification to try again.",
                email,
            });
        }

        return res.status(201).json({
            success: true,
            message:
                "Account created. Check your inbox to verify your email.",
            email,
        });
    } catch (error) {
        console.error(
            "Register error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Registration failed. Please try again.",
        });
    }
};

// ─────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────

export const login = async (
    req: Request,
    res: Response
) => {
    try {
        const email = normalizeEmail(
            req.body?.email
        );

        const password = String(
            req.body?.password || ""
        );

        if (
            !EMAIL_REGEX.test(email) ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required.",
            });
        }

        const user =
            await prisma.user.findUnique({
                where: {
                    email,
                },
            });

        if (!user || !user.password) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password.",
            });
        }

        const passwordMatches =
            await comparePassword(
                password,
                user.password
            );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password.",
            });
        }

        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                code: "EMAIL_NOT_VERIFIED",
                message:
                    "Verify your email before signing in.",
                email: user.email,
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Login successful.",
            ...createAuthResponse(user),
        });
    } catch (error) {
        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Login failed. Please try again.",
        });
    }
};

// ─────────────────────────────────────────────
// Verify email token
// ─────────────────────────────────────────────

export const verifyEmail = async (
    req: Request,
    res: Response
) => {
    try {
        const token = String(
            req.body?.token || ""
        ).trim();

        if (
            !/^[a-f0-9]{64}$/i.test(token)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid verification link.",
            });
        }

        const tokenHash =
            createTokenHash(token);

        const user =
            await prisma.user.findFirst({
                where: {
                    emailVerified: false,

                    emailVerificationTokenHash:
                        tokenHash,

                    emailVerificationExpiresAt:
                    {
                        gt: new Date(),
                    },
                },

                select: {
                    id: true,
                    email: true,
                },
            });

        if (!user) {
            return res.status(400).json({
                success: false,
                code: "INVALID_OR_EXPIRED_TOKEN",
                message:
                    "This verification link is invalid or has expired.",
            });
        }

        await prisma.user.update({
            where: {
                id: user.id,
            },

            data: {
                emailVerified: true,

                emailVerificationTokenHash:
                    null,

                emailVerificationExpiresAt:
                    null,

                emailVerificationSentAt:
                    null,
            },
        });

        return res.status(200).json({
            success: true,
            message:
                "Email verified successfully. You can now sign in.",
            email: user.email,
        });
    } catch (error) {
        console.error(
            "Verify email error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Email verification failed.",
        });
    }
};

// ─────────────────────────────────────────────
// Resend verification email
// ─────────────────────────────────────────────

export const resendVerification = async (
    req: Request,
    res: Response
) => {
    const email = normalizeEmail(
        req.body?.email
    );

    try {
        /*
         * Generic success responses reduce
         * email-account enumeration.
         */
        const genericResponse = {
            success: true,
            message:
                "If an unverified account exists, a new verification email will be sent.",
        };

        if (!EMAIL_REGEX.test(email)) {
            return res
                .status(202)
                .json(genericResponse);
        }

        const user =
            await prisma.user.findUnique({
                where: {
                    email,
                },

                select: {
                    id: true,
                    name: true,
                    email: true,
                    emailVerified: true,
                    emailVerificationSentAt:
                        true,
                },
            });

        if (
            !user ||
            user.emailVerified
        ) {
            return res
                .status(202)
                .json(genericResponse);
        }

        if (
            user.emailVerificationSentAt &&
            Date.now() -
            user
                .emailVerificationSentAt
                .getTime() <
            RESEND_COOLDOWN_MS
        ) {
            return res.status(429).json({
                success: false,
                code: "RESEND_COOLDOWN",
                message:
                    "Please wait one minute before requesting another email.",
            });
        }

        await issueVerificationEmail(user);

        return res
            .status(202)
            .json(genericResponse);
    } catch (error) {
        console.error(
            "Resend verification error:",
            error
        );

        return res.status(503).json({
            success: false,
            message:
                "Verification email could not be sent. Please try again later.",
        });
    }
};

// ─────────────────────────────────────────────
// Firebase Google authentication
// ─────────────────────────────────────────────

export const firebaseGoogleAuth = async (
    req: Request,
    res: Response
) => {
    try {
        const idToken = String(
            req.body?.idToken || ""
        ).trim();

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message:
                    "Firebase ID token is required.",
            });
        }

        const decodedToken =
            await getFirebaseAdminAuth()
                .verifyIdToken(
                    idToken,
                    true
                );

        const provider =
            decodedToken.firebase
                ?.sign_in_provider;

        if (provider !== "google.com") {
            return res.status(400).json({
                success: false,
                message:
                    "Only Google authentication is supported.",
            });
        }

        const email = normalizeEmail(
            decodedToken.email
        );

        if (
            !email ||
            !decodedToken.email_verified
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Google did not provide a verified email address.",
            });
        }

        const firebaseUid =
            decodedToken.uid;

        const decodedName =
            normalizeName(
                decodedToken.name
            );

        const name =
            decodedName ||
            email.split("@")[0] ||
            "PlacementOS User";

        const picture =
            typeof decodedToken.picture ===
                "string"
                ? decodedToken.picture
                : null;

        let user =
            await prisma.user.findUnique({
                where: {
                    email,
                },
            });

        if (!user) {
            user =
                await prisma.user.create({
                    data: {
                        email,
                        name:
                            name.slice(0, 80),

                        firebaseUid,
                        avatarUrl: picture,
                        emailVerified: true,

                        profile: {
                            create: {},
                        },
                    },
                });
        } else {
            if (
                user.firebaseUid &&
                user.firebaseUid !==
                firebaseUid
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This email is already linked to another authentication identity.",
                });
            }

            user =
                await prisma.user.update({
                    where: {
                        id: user.id,
                    },

                    data: {
                        firebaseUid,
                        emailVerified: true,

                        avatarUrl:
                            picture ||
                            user.avatarUrl,

                        emailVerificationTokenHash:
                            null,

                        emailVerificationExpiresAt:
                            null,

                        emailVerificationSentAt:
                            null,
                    },
                });
        }

        return res.status(200).json({
            success: true,
            message:
                "Google authentication successful.",
            ...createAuthResponse(user),
        });
    } catch (error: any) {
        console.error(
            "Firebase Google auth error:",
            error
        );

        const firebaseErrorCode =
            error?.code;

        if (
            firebaseErrorCode ===
            "auth/id-token-expired" ||
            firebaseErrorCode ===
            "auth/argument-error" ||
            firebaseErrorCode ===
            "auth/id-token-revoked"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Google authentication expired or was invalid. Please try again.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Google authentication failed.",
        });
    }
};

// ─────────────────────────────────────────────
// Refresh access token
// ─────────────────────────────────────────────

export const refreshToken = async (
    req: Request,
    res: Response
) => {
    try {
        const suppliedRefreshToken =
            String(
                req.body?.refreshToken ||
                ""
            );

        if (!suppliedRefreshToken) {
            return res.status(400).json({
                success: false,
                message:
                    "Refresh token required.",
            });
        }

        const decoded =
            verifyRefreshToken(
                suppliedRefreshToken
            );

        const user =
            await prisma.user.findUnique({
                where: {
                    id: decoded.userId,
                },
            });

        if (
            !user ||
            !user.emailVerified
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Session is no longer valid.",
            });
        }

        const newAccessToken =
            generateAccessToken(
                user.id,
                user.role
            );

        return res.status(200).json({
            success: true,
            accessToken:
                newAccessToken,
        });
    } catch {
        return res.status(401).json({
            success: false,
            message:
                "Invalid refresh token.",
        });
    }
};

// ─────────────────────────────────────────────
// Current authenticated user
// ─────────────────────────────────────────────

export const getMe = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const user =
            await prisma.user.findUnique({
                where: {
                    id: req.user.id,
                },

                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    plan: true,
                    avatarUrl: true,
                    emailVerified: true,
                    createdAt: true,
                    updatedAt: true,

                    profile: {
                        select: {
                            id: true,
                            skills: true,
                            targetCompanies:
                                true,
                            bio: true,
                            linkedinUrl: true,
                            githubUrl: true,
                            college: true,
                            graduationYear:
                                true,
                        },
                    },
                },
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message:
                    "User not found.",
            });
        }

        return res.status(200).json({
            success: true,

            data: {
                user,
            },
        });
    } catch (error) {
        console.error(
            "Get me error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};