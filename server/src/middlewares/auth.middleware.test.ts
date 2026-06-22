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
    verifyAccessToken: vi.fn(),
    userFindUnique: vi.fn(),
}));

vi.mock(
    "../services/auth.service",
    () => ({
        verifyAccessToken:
            mocks.verifyAccessToken,
    })
);

vi.mock(
    "../prisma/client",
    () => ({
        prisma: {
            user: {
                findUnique:
                    mocks.userFindUnique,
            },
        },
    })
);

import {
    adminOnly,
    protect,
    type AuthRequest,
} from "./auth.middleware";

const app = express();

app.get(
    "/protected",
    protect,
    (req, res) => {
        const authRequest =
            req as AuthRequest;

        return res.status(200).json({
            success: true,
            user: authRequest.user,
        });
    }
);

app.get(
    "/admin",
    protect,
    adminOnly,
    (_req, res) => {
        return res.status(200).json({
            success: true,
            message: "Admin access granted.",
        });
    }
);

describe(
    "authentication middleware",
    () => {
        beforeEach(() => {
            vi.clearAllMocks();

            mocks.verifyAccessToken
                .mockReturnValue({
                    userId: "user-1",
                    role: "STUDENT",
                });

            mocks.userFindUnique
                .mockResolvedValue({
                    id: "user-1",
                    role: "STUDENT",
                    email:
                        "student@example.com",
                });
        });

        it(
            "rejects a request without an Authorization header",
            async () => {
                const response =
                    await request(app)
                        .get("/protected")
                        .expect(401);

                expect(
                    response.body
                ).toEqual({
                    message:
                        "Not authorized, no token",
                });

                expect(
                    mocks.verifyAccessToken
                ).not.toHaveBeenCalled();

                expect(
                    mocks.userFindUnique
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "rejects a non-Bearer Authorization header",
            async () => {
                const response =
                    await request(app)
                        .get("/protected")
                        .set(
                            "Authorization",
                            "Token invalid-format"
                        )
                        .expect(401);

                expect(
                    response.body.message
                ).toBe(
                    "Not authorized, no token"
                );
            }
        );

        it(
            "rejects an invalid or expired access token",
            async () => {
                mocks.verifyAccessToken
                    .mockImplementation(() => {
                        throw new Error(
                            "Token expired"
                        );
                    });

                const response =
                    await request(app)
                        .get("/protected")
                        .set(
                            "Authorization",
                            "Bearer expired-token"
                        )
                        .expect(401);

                expect(
                    response.body.message
                ).toBe(
                    "Not authorized, token failed"
                );

                expect(
                    mocks.userFindUnique
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "rejects a token whose user no longer exists",
            async () => {
                mocks.userFindUnique
                    .mockResolvedValue(null);

                const response =
                    await request(app)
                        .get("/protected")
                        .set(
                            "Authorization",
                            "Bearer valid-token"
                        )
                        .expect(401);

                expect(
                    response.body.message
                ).toBe(
                    "User not found"
                );

                expect(
                    mocks.userFindUnique
                ).toHaveBeenCalledWith({
                    where: {
                        id: "user-1",
                    },

                    select: {
                        id: true,
                        role: true,
                        email: true,
                    },
                });
            }
        );

        it(
            "attaches the authenticated user to the request",
            async () => {
                const response =
                    await request(app)
                        .get("/protected")
                        .set(
                            "Authorization",
                            "Bearer valid-token"
                        )
                        .expect(200);

                expect(
                    response.body
                ).toEqual({
                    success: true,

                    user: {
                        id: "user-1",
                        role: "STUDENT",
                        email:
                            "student@example.com",
                    },
                });
            }
        );

        it(
            "blocks a non-admin user from an admin route",
            async () => {
                const response =
                    await request(app)
                        .get("/admin")
                        .set(
                            "Authorization",
                            "Bearer student-token"
                        )
                        .expect(403);

                expect(
                    response.body.message
                ).toBe(
                    "Access denied — Admins only"
                );
            }
        );

        it(
            "allows an admin user through the admin middleware",
            async () => {
                mocks.userFindUnique
                    .mockResolvedValue({
                        id: "admin-1",
                        role: "ADMIN",
                        email:
                            "admin@example.com",
                    });

                const response =
                    await request(app)
                        .get("/admin")
                        .set(
                            "Authorization",
                            "Bearer admin-token"
                        )
                        .expect(200);

                expect(
                    response.body
                ).toEqual({
                    success: true,
                    message:
                        "Admin access granted.",
                });
            }
        );
    }
);