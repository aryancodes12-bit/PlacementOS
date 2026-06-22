import express, {
    type Request,
    type Response,
} from "express";

import request from "supertest";

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
    register: vi.fn(),
    login: vi.fn(),
    firebaseGoogleAuth: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    refreshToken: vi.fn(),
    getMe: vi.fn(),
}));

vi.mock(
    "../controllers/auth.controller",
    () => ({
        register: mocks.register,
        login: mocks.login,

        firebaseGoogleAuth:
            mocks.firebaseGoogleAuth,

        verifyEmail:
            mocks.verifyEmail,

        resendVerification:
            mocks.resendVerification,

        refreshToken:
            mocks.refreshToken,

        getMe:
            mocks.getMe,
    })
);

vi.mock(
    "../middlewares/auth.middleware",
    () => ({
        protect: (
            _req: Request,
            _res: Response,
            next: () => void
        ) => {
            next();
        },
    })
);

const successfulHandler = (
    _req: Request,
    res: Response
) => {
    return res.status(200).json({
        success: true,
    });
};

const createTestApp = async () => {
    /*
     * auth.routes creates rate-limit stores at
     * module-load time. Reloading the module gives
     * each test an isolated counter.
     */
    vi.resetModules();

    const {
        default: authRoutes,
    } = await import(
        "./auth.routes"
    );

    const app = express();

    app.use(express.json());

    app.use(
        "/api/auth",
        authRoutes
    );

    return app;
};

describe(
    "authentication rate limits",
    () => {
        beforeEach(() => {
            vi.clearAllMocks();

            mocks.register
                .mockImplementation(
                    successfulHandler
                );

            mocks.login
                .mockImplementation(
                    successfulHandler
                );

            mocks.firebaseGoogleAuth
                .mockImplementation(
                    successfulHandler
                );

            mocks.verifyEmail
                .mockImplementation(
                    successfulHandler
                );

            mocks.resendVerification
                .mockImplementation(
                    successfulHandler
                );

            mocks.refreshToken
                .mockImplementation(
                    successfulHandler
                );

            mocks.getMe
                .mockImplementation(
                    successfulHandler
                );
        });

        it(
            "allows twenty credential requests and blocks the twenty-first",
            async () => {
                const app =
                    await createTestApp();

                for (
                    let attempt = 1;
                    attempt <= 20;
                    attempt += 1
                ) {
                    await request(app)
                        .post(
                            "/api/auth/login"
                        )
                        .send({
                            email:
                                "test@example.com",

                            password:
                                "StrongPass1",
                        })
                        .expect(200);
                }

                const blockedResponse =
                    await request(app)
                        .post(
                            "/api/auth/login"
                        )
                        .send({
                            email:
                                "test@example.com",

                            password:
                                "StrongPass1",
                        })
                        .expect(429);

                expect(
                    blockedResponse.body
                ).toEqual({
                    success: false,

                    message:
                        "Too many authentication attempts. Please try again later.",
                });

                expect(
                    mocks.login
                ).toHaveBeenCalledTimes(
                    20
                );
            }
        );

        it(
            "allows eight verification requests and blocks the ninth",
            async () => {
                const app =
                    await createTestApp();

                for (
                    let attempt = 1;
                    attempt <= 8;
                    attempt += 1
                ) {
                    await request(app)
                        .post(
                            "/api/auth/verify-email"
                        )
                        .send({
                            token:
                                "a".repeat(
                                    64
                                ),
                        })
                        .expect(200);
                }

                const blockedResponse =
                    await request(app)
                        .post(
                            "/api/auth/verify-email"
                        )
                        .send({
                            token:
                                "a".repeat(
                                    64
                                ),
                        })
                        .expect(429);

                expect(
                    blockedResponse.body
                ).toEqual({
                    success: false,

                    message:
                        "Too many verification requests. Please try again later.",
                });

                expect(
                    mocks.verifyEmail
                ).toHaveBeenCalledTimes(
                    8
                );
            }
        );

        it(
            "keeps credential and verification limiters independent",
            async () => {
                const app =
                    await createTestApp();

                for (
                    let attempt = 1;
                    attempt <= 8;
                    attempt += 1
                ) {
                    await request(app)
                        .post(
                            "/api/auth/resend-verification"
                        )
                        .send({
                            email:
                                "test@example.com",
                        })
                        .expect(200);
                }

                await request(app)
                    .post(
                        "/api/auth/resend-verification"
                    )
                    .send({
                        email:
                            "test@example.com",
                    })
                    .expect(429);

                /*
                 * Exhausting verification requests must
                 * not consume the credential limiter.
                 */
                await request(app)
                    .post(
                        "/api/auth/login"
                    )
                    .send({
                        email:
                            "test@example.com",

                        password:
                            "StrongPass1",
                    })
                    .expect(200);

                expect(
                    mocks.login
                ).toHaveBeenCalledOnce();
            }
        );
    }
);