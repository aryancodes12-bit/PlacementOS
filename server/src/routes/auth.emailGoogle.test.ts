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

const genericResendResponse = {
    success: true,

    message:
        "If an unverified account exists, a new verification email will be sent.",
};

const existingUser = {
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
    "email verification security",
    () => {
        beforeEach(() => {
            vi.clearAllMocks();

            mocks.generateAccessToken
                .mockReturnValue(
                    "access-token"
                );

            mocks.generateRefreshToken
                .mockReturnValue(
                    "refresh-token"
                );

            mocks.userUpdate
                .mockResolvedValue({});

            mocks.sendVerificationEmail
                .mockResolvedValue(
                    undefined
                );
        });

        it(
            "returns a generic response for an invalid resend email",
            async () => {
                const response =
                    await request(app)
                        .post(
                            "/api/auth/resend-verification"
                        )
                        .send({
                            email:
                                "not-an-email",
                        })
                        .expect(202);

                expect(
                    response.body
                ).toEqual(
                    genericResendResponse
                );

                expect(
                    mocks.userFindUnique
                ).not.toHaveBeenCalled();

                expect(
                    mocks.sendVerificationEmail
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "does not reveal whether an account exists or is already verified",
            async () => {
                mocks.userFindUnique
                    .mockResolvedValue({
                        ...existingUser,
                        emailVerificationSentAt:
                            null,
                    });

                const response =
                    await request(app)
                        .post(
                            "/api/auth/resend-verification"
                        )
                        .send({
                            email:
                                "aryan@example.com",
                        })
                        .expect(202);

                expect(
                    response.body
                ).toEqual(
                    genericResendResponse
                );

                expect(
                    mocks.sendVerificationEmail
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "enforces the one-minute resend cooldown",
            async () => {
                mocks.userFindUnique
                    .mockResolvedValue({
                        id: "user-1",
                        name:
                            "Aryan Jaiswal",
                        email:
                            "aryan@example.com",

                        emailVerified:
                            false,

                        emailVerificationSentAt:
                            new Date(
                                Date.now() -
                                10_000
                            ),
                    });

                const response =
                    await request(app)
                        .post(
                            "/api/auth/resend-verification"
                        )
                        .send({
                            email:
                                "aryan@example.com",
                        })
                        .expect(429);

                expect(
                    response.body
                ).toMatchObject({
                    success: false,
                    code:
                        "RESEND_COOLDOWN",

                    message:
                        "Please wait one minute before requesting another email.",
                });

                expect(
                    mocks.userUpdate
                ).not.toHaveBeenCalled();

                expect(
                    mocks.sendVerificationEmail
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "sends a fresh token after the cooldown has expired",
            async () => {
                mocks.userFindUnique
                    .mockResolvedValue({
                        id: "user-1",
                        name:
                            "Aryan Jaiswal",
                        email:
                            "aryan@example.com",

                        emailVerified:
                            false,

                        emailVerificationSentAt:
                            new Date(
                                Date.now() -
                                61_000
                            ),
                    });

                const response =
                    await request(app)
                        .post(
                            "/api/auth/resend-verification"
                        )
                        .send({
                            email:
                                "ARYAN@example.com",
                        })
                        .expect(202);

                expect(
                    response.body
                ).toEqual(
                    genericResendResponse
                );

                expect(
                    mocks.userUpdate
                ).toHaveBeenCalledWith({
                    where: {
                        id: "user-1",
                    },

                    data: {
                        emailVerificationTokenHash:
                            expect.stringMatching(
                                /^[a-f0-9]{64}$/
                            ),

                        emailVerificationExpiresAt:
                            expect.any(Date),

                        emailVerificationSentAt:
                            expect.any(Date),
                    },
                });

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
            "cleans stored verification state when email delivery fails",
            async () => {
                mocks.userFindUnique
                    .mockResolvedValue({
                        id: "user-1",
                        name:
                            "Aryan Jaiswal",
                        email:
                            "aryan@example.com",

                        emailVerified:
                            false,

                        emailVerificationSentAt:
                            null,
                    });

                mocks.sendVerificationEmail
                    .mockRejectedValue(
                        new Error(
                            "Email provider unavailable"
                        )
                    );

                const response =
                    await request(app)
                        .post(
                            "/api/auth/resend-verification"
                        )
                        .send({
                            email:
                                "aryan@example.com",
                        })
                        .expect(503);

                expect(
                    response.body
                ).toEqual({
                    success: false,

                    message:
                        "Verification email could not be sent. Please try again later.",
                });

                expect(
                    mocks.userUpdate
                ).toHaveBeenCalledTimes(
                    2
                );

                expect(
                    mocks.userUpdate
                ).toHaveBeenLastCalledWith({
                    where: {
                        id: "user-1",
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
            }
        );
    }
);

describe(
    "Firebase Google account linking",
    () => {
        beforeEach(() => {
            vi.clearAllMocks();

            mocks.generateAccessToken
                .mockReturnValue(
                    "access-token"
                );

            mocks.generateRefreshToken
                .mockReturnValue(
                    "refresh-token"
                );

            mocks.verifyFirebaseIdToken
                .mockResolvedValue({
                    uid:
                        "firebase-google-1",

                    email:
                        "aryan@example.com",

                    email_verified:
                        true,

                    name:
                        "Aryan Jaiswal",

                    picture:
                        "https://example.com/avatar.png",

                    firebase: {
                        sign_in_provider:
                            "google.com",
                    },
                });
        });

        it(
            "creates a new PlacementOS user from a verified Google identity",
            async () => {
                mocks.userFindUnique
                    .mockResolvedValueOnce(
                        null
                    )
                    .mockResolvedValueOnce(
                        null
                    );

                mocks.userCreate
                    .mockResolvedValue({
                        ...existingUser,

                        password: null,

                        firebaseUid:
                            "firebase-google-1",

                        avatarUrl:
                            "https://example.com/avatar.png",
                    });

                const response =
                    await request(app)
                        .post(
                            "/api/auth/firebase/google"
                        )
                        .send({
                            idToken:
                                "valid-firebase-token",
                        })
                        .expect(200);

                expect(
                    response.body
                ).toMatchObject({
                    success: true,

                    message:
                        "Google authentication successful.",

                    accessToken:
                        "access-token",

                    refreshToken:
                        "refresh-token",

                    user: {
                        id: "user-1",
                        email:
                            "aryan@example.com",

                        emailVerified:
                            true,

                        avatarUrl:
                            "https://example.com/avatar.png",
                    },
                });

                expect(
                    mocks.userCreate
                ).toHaveBeenCalledWith({
                    data: {
                        email:
                            "aryan@example.com",

                        name:
                            "Aryan Jaiswal",

                        firebaseUid:
                            "firebase-google-1",

                        avatarUrl:
                            "https://example.com/avatar.png",

                        emailVerified:
                            true,

                        profile: {
                            create: {},
                        },
                    },
                });
            }
        );

        it(
            "links Google authentication to an existing email account",
            async () => {
                mocks.userFindUnique
                    .mockResolvedValueOnce(
                        null
                    )
                    .mockResolvedValueOnce(
                        existingUser
                    );

                mocks.userUpdate
                    .mockResolvedValue({
                        ...existingUser,

                        firebaseUid:
                            "firebase-google-1",

                        avatarUrl:
                            "https://example.com/avatar.png",

                        emailVerified:
                            true,
                    });

                const response =
                    await request(app)
                        .post(
                            "/api/auth/firebase/google"
                        )
                        .send({
                            idToken:
                                "valid-firebase-token",
                        })
                        .expect(200);

                expect(
                    response.body.success
                ).toBe(true);

                expect(
                    mocks.userUpdate
                ).toHaveBeenCalledWith({
                    where: {
                        id: "user-1",
                    },

                    data: {
                        firebaseUid:
                            "firebase-google-1",

                        emailVerified:
                            true,

                        avatarUrl:
                            "https://example.com/avatar.png",

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
            "rejects linking when the email already belongs to another Firebase identity",
            async () => {
                mocks.userFindUnique
                    .mockResolvedValueOnce(
                        null
                    )
                    .mockResolvedValueOnce({
                        ...existingUser,

                        firebaseUid:
                            "different-firebase-uid",
                    });

                const response =
                    await request(app)
                        .post(
                            "/api/auth/firebase/google"
                        )
                        .send({
                            idToken:
                                "valid-firebase-token",
                        })
                        .expect(409);

                expect(
                    response.body
                        .message
                ).toBe(
                    "This email is already linked to another authentication identity."
                );

                expect(
                    mocks.userUpdate
                ).not.toHaveBeenCalled();

                expect(
                    mocks.userCreate
                ).not.toHaveBeenCalled();
            }
        );
    }
);