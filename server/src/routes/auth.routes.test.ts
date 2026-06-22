import express from "express";
import request from "supertest";

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
    userFindUnique: vi.fn(),
    userFindFirst: vi.fn(),
    userCreate: vi.fn(),
    userUpdate: vi.fn(),

    comparePassword: vi.fn(),
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
    hashPassword: vi.fn(),
    verifyRefreshToken: vi.fn(),

    sendVerificationEmail: vi.fn(),
    verifyFirebaseIdToken: vi.fn(),
}));

/*
 * Authentication behaviour is tested here.
 * Rate limiting gets a dedicated test file next,
 * so it is bypassed for these controller tests.
 */
vi.mock(
    "express-rate-limit",
    () => ({
        rateLimit: () => (
            _req: unknown,
            _res: unknown,
            next: () => void
        ) => {
            next();
        },
    })
);

vi.mock(
    "../middlewares/auth.middleware",
    () => ({
        protect: (
            req: {
                user?: {
                    id: string;
                    role: string;
                    email: string;
                };
            },
            _res: unknown,
            next: () => void
        ) => {
            req.user = {
                id: "user-1",
                role: "STUDENT",
                email:
                    "aryan@example.com",
            };

            next();
        },
    })
);

vi.mock(
    "../prisma/client",
    () => ({
        prisma: {
            user: {
                findUnique:
                    mocks.userFindUnique,

                findFirst:
                    mocks.userFindFirst,

                create:
                    mocks.userCreate,

                update:
                    mocks.userUpdate,
            },
        },
    })
);

vi.mock(
    "../services/auth.service",
    () => ({
        comparePassword:
            mocks.comparePassword,

        generateAccessToken:
            mocks.generateAccessToken,

        generateRefreshToken:
            mocks.generateRefreshToken,

        hashPassword:
            mocks.hashPassword,

        verifyRefreshToken:
            mocks.verifyRefreshToken,
    })
);

vi.mock(
    "../services/emailVerification.service",
    () => ({
        sendVerificationEmail:
            mocks.sendVerificationEmail,
    })
);

vi.mock(
    "../services/firebaseAdmin.service",
    () => ({
        verifyFirebaseIdToken:
            mocks.verifyFirebaseIdToken,
    })
);

import authRoutes from "./auth.routes";

const app = express();

app.use(express.json());

app.use(
    "/api/auth",
    authRoutes
);

const verifiedUser = {
    id: "user-1",
    name: "Aryan Jaiswal",
    email: "aryan@example.com",
    password: "hashed-password",
    role: "STUDENT",
    avatarUrl: null,
    emailVerified: true,
    firebaseUid: null,
};

describe(
    "authentication routes",
    () => {
        beforeEach(() => {
            vi.clearAllMocks();

            mocks.hashPassword
                .mockResolvedValue(
                    "hashed-password"
                );

            mocks.comparePassword
                .mockResolvedValue(true);

            mocks.generateAccessToken
                .mockReturnValue(
                    "access-token"
                );

            mocks.generateRefreshToken
                .mockReturnValue(
                    "refresh-token"
                );

            mocks.sendVerificationEmail
                .mockResolvedValue(
                    undefined
                );

            mocks.userUpdate
                .mockResolvedValue({});
        });

        it(
            "rejects invalid registration input before accessing the database",
            async () => {
                const response =
                    await request(app)
                        .post(
                            "/api/auth/register"
                        )
                        .send({
                            name: "A",
                            email:
                                "not-an-email",
                            password: "weak",
                        })
                        .expect(400);

                expect(
                    response.body.success
                ).toBe(false);

                expect(
                    response.body.message
                ).toBe(
                    "Name must contain between 2 and 80 characters."
                );

                expect(
                    mocks.userFindUnique
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "registers an account and issues a verification email",
            async () => {
                mocks.userFindUnique
                    .mockResolvedValue(null);

                mocks.userCreate
                    .mockResolvedValue({
                        id: "user-1",
                        name:
                            "Aryan Jaiswal",
                        email:
                            "aryan@example.com",
                    });

                const response =
                    await request(app)
                        .post(
                            "/api/auth/register"
                        )
                        .send({
                            name:
                                "  Aryan   Jaiswal  ",

                            email:
                                "ARYAN@example.com",

                            password:
                                "StrongPass1",
                        })
                        .expect(201);

                expect(
                    response.body
                ).toEqual({
                    success: true,

                    message:
                        "Account created. Check your inbox to verify your email.",

                    email:
                        "aryan@example.com",
                });

                expect(
                    mocks.hashPassword
                ).toHaveBeenCalledWith(
                    "StrongPass1"
                );

                expect(
                    mocks.userCreate
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data:
                            expect.objectContaining({
                                name:
                                    "Aryan Jaiswal",

                                email:
                                    "aryan@example.com",

                                password:
                                    "hashed-password",

                                emailVerified:
                                    false,
                            }),
                    })
                );

                expect(
                    mocks.sendVerificationEmail
                ).toHaveBeenCalledWith({
                    email:
                        "aryan@example.com",

                    name:
                        "Aryan Jaiswal",

                    token:
                        expect.stringMatching(
                            /^[a-f0-9]{64}$/
                        ),
                });
            }
        );

        it(
            "returns EMAIL_NOT_VERIFIED when an unverified account already exists",
            async () => {
                mocks.userFindUnique
                    .mockResolvedValue({
                        emailVerified:
                            false,
                    });

                const response =
                    await request(app)
                        .post(
                            "/api/auth/register"
                        )
                        .send({
                            name:
                                "Aryan Jaiswal",

                            email:
                                "aryan@example.com",

                            password:
                                "StrongPass1",
                        })
                        .expect(409);

                expect(
                    response.body.code
                ).toBe(
                    "EMAIL_NOT_VERIFIED"
                );

                expect(
                    mocks.userCreate
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "blocks login until the email is verified",
            async () => {
                mocks.userFindUnique
                    .mockResolvedValue({
                        ...verifiedUser,
                        emailVerified:
                            false,
                    });

                const response =
                    await request(app)
                        .post(
                            "/api/auth/login"
                        )
                        .send({
                            email:
                                "aryan@example.com",

                            password:
                                "StrongPass1",
                        })
                        .expect(403);

                expect(
                    response.body.code
                ).toBe(
                    "EMAIL_NOT_VERIFIED"
                );

                expect(
                    response.body.email
                ).toBe(
                    "aryan@example.com"
                );

                expect(
                    mocks.generateAccessToken
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "returns application tokens after a successful login",
            async () => {
                mocks.userFindUnique
                    .mockResolvedValue(
                        verifiedUser
                    );

                const response =
                    await request(app)
                        .post(
                            "/api/auth/login"
                        )
                        .send({
                            email:
                                "ARYAN@example.com",

                            password:
                                "StrongPass1",
                        })
                        .expect(200);

                expect(
                    response.body
                ).toMatchObject({
                    success: true,
                    message:
                        "Login successful.",

                    accessToken:
                        "access-token",

                    refreshToken:
                        "refresh-token",

                    user: {
                        id: "user-1",
                        name:
                            "Aryan Jaiswal",
                        email:
                            "aryan@example.com",
                        role: "STUDENT",
                        avatarUrl: null,
                        emailVerified:
                            true,
                    },
                });

                expect(
                    mocks.comparePassword
                ).toHaveBeenCalledWith(
                    "StrongPass1",
                    "hashed-password"
                );
            }
        );

        it(
            "rejects a malformed email-verification token",
            async () => {
                const response =
                    await request(app)
                        .post(
                            "/api/auth/verify-email"
                        )
                        .send({
                            token:
                                "invalid-token",
                        })
                        .expect(400);

                expect(
                    response.body.message
                ).toBe(
                    "Invalid verification link."
                );

                expect(
                    mocks.userFindFirst
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "rejects an expired or unknown email-verification token",
            async () => {
                mocks.userFindFirst
                    .mockResolvedValue(null);

                const response =
                    await request(app)
                        .post(
                            "/api/auth/verify-email"
                        )
                        .send({
                            token:
                                "a".repeat(64),
                        })
                        .expect(400);

                expect(
                    response.body.code
                ).toBe(
                    "INVALID_OR_EXPIRED_TOKEN"
                );

                expect(
                    mocks.userUpdate
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "marks an account verified for a valid verification token",
            async () => {
                mocks.userFindFirst
                    .mockResolvedValue({
                        id: "user-1",
                        email:
                            "aryan@example.com",
                    });

                const response =
                    await request(app)
                        .post(
                            "/api/auth/verify-email"
                        )
                        .send({
                            token:
                                "b".repeat(64),
                        })
                        .expect(200);

                expect(
                    response.body
                ).toEqual({
                    success: true,

                    message:
                        "Email verified successfully. You can now sign in.",

                    email:
                        "aryan@example.com",
                });

                expect(
                    mocks.userUpdate
                ).toHaveBeenCalledWith({
                    where: {
                        id: "user-1",
                    },

                    data: {
                        emailVerified:
                            true,

                        emailVerificationTokenHash:
                            null,

                        emailVerificationExpiresAt:
                            null,

                        emailVerificationSentAt:
                            null,
                    },
                });
            }
        );

        it(
            "rejects Google authentication without a Firebase token",
            async () => {
                const response =
                    await request(app)
                        .post(
                            "/api/auth/firebase/google"
                        )
                        .send({})
                        .expect(400);

                expect(
                    response.body.message
                ).toBe(
                    "Firebase ID token is required."
                );

                expect(
                    mocks.verifyFirebaseIdToken
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "does not expose Firebase debug information in production",
            async () => {
                const previousEnvironment =
                    process.env.NODE_ENV;

                process.env.NODE_ENV =
                    "production";

                const firebaseError =
                    Object.assign(
                        new Error(
                            "internal-secret-detail"
                        ),
                        {
                            code:
                                "auth/id-token-expired",
                        }
                    );

                mocks.verifyFirebaseIdToken
                    .mockRejectedValue(
                        firebaseError
                    );

                try {
                    const response =
                        await request(app)
                            .post(
                                "/api/auth/firebase/google"
                            )
                            .send({
                                idToken:
                                    "expired-firebase-token",
                            })
                            .expect(401);

                    expect(
                        response.body
                    ).toEqual({
                        success: false,

                        message:
                            "Your Google session is invalid or expired. Please try again.",
                    });

                    expect(
                        JSON.stringify(
                            response.body
                        )
                    ).not.toContain(
                        "internal-secret-detail"
                    );

                    expect(
                        response.body.debug
                    ).toBeUndefined();
                } finally {
                    if (
                        previousEnvironment ===
                        undefined
                    ) {
                        delete process.env
                            .NODE_ENV;
                    } else {
                        process.env.NODE_ENV =
                            previousEnvironment;
                    }
                }
            }
        );

        it(
            "rejects an invalid refresh token",
            async () => {
                mocks.verifyRefreshToken
                    .mockImplementation(() => {
                        throw new Error(
                            "Invalid refresh token"
                        );
                    });

                const response =
                    await request(app)
                        .post(
                            "/api/auth/refresh"
                        )
                        .send({
                            refreshToken:
                                "invalid-token",
                        })
                        .expect(401);

                expect(
                    response.body
                ).toEqual({
                    success: false,
                    message:
                        "Invalid refresh token.",
                });
            }
        );

        it(
            "issues a new access token for a valid verified session",
            async () => {
                mocks.verifyRefreshToken
                    .mockReturnValue({
                        userId: "user-1",
                    });

                mocks.userFindUnique
                    .mockResolvedValue(
                        verifiedUser
                    );

                const response =
                    await request(app)
                        .post(
                            "/api/auth/refresh"
                        )
                        .send({
                            refreshToken:
                                "valid-refresh-token",
                        })
                        .expect(200);

                expect(
                    response.body
                ).toEqual({
                    success: true,
                    accessToken:
                        "access-token",
                });

                expect(
                    mocks.generateAccessToken
                ).toHaveBeenCalledWith(
                    "user-1",
                    "STUDENT"
                );
            }
        );

        it(
            "returns the current authenticated user",
            async () => {
                const currentUser = {
                    id: "user-1",
                    name:
                        "Aryan Jaiswal",
                    email:
                        "aryan@example.com",
                    role: "STUDENT",
                    plan: "FREE",
                    avatarUrl: null,
                    emailVerified: true,
                    createdAt:
                        new Date(),
                    updatedAt:
                        new Date(),

                    profile: {
                        id: "profile-1",
                        skills: [
                            "React",
                        ],
                        targetCompanies:
                            [],
                        bio: null,
                        linkedinUrl:
                            null,
                        githubUrl: null,
                        college: null,
                        graduationYear:
                            null,
                    },
                };

                mocks.userFindUnique
                    .mockResolvedValue(
                        currentUser
                    );

                const response =
                    await request(app)
                        .get(
                            "/api/auth/me"
                        )
                        .expect(200);

                expect(
                    response.body.success
                ).toBe(true);

                expect(
                    response.body.data.user
                ).toMatchObject({
                    id: "user-1",
                    email:
                        "aryan@example.com",
                    role: "STUDENT",

                    profile: {
                        skills: [
                            "React",
                        ],
                    },
                });
            }
        );
    }
);