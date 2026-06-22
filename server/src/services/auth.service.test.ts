import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";

import {
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    hashPassword,
    verifyAccessToken,
    verifyRefreshToken,
} from "./auth.service";

const ACCESS_SECRET =
    "access-secret-abcdefghijklmnopqrstuvwxyz-1234567890";

const REFRESH_SECRET =
    "refresh-secret-abcdefghijklmnopqrstuvwxyz-1234567890";

describe(
    "authentication service",
    () => {
        beforeEach(() => {
            process.env.JWT_SECRET =
                ACCESS_SECRET;

            process.env.JWT_REFRESH_SECRET =
                REFRESH_SECRET;
        });

        it(
            "hashes passwords using bcrypt cost 12",
            async () => {
                const password =
                    "StrongPass1";

                const hash =
                    await hashPassword(
                        password
                    );

                expect(hash).not.toBe(
                    password
                );

                expect(
                    bcrypt.getRounds(
                        hash
                    )
                ).toBe(12);

                await expect(
                    comparePassword(
                        password,
                        hash
                    )
                ).resolves.toBe(true);

                await expect(
                    comparePassword(
                        "WrongPass1",
                        hash
                    )
                ).resolves.toBe(false);
            }
        );

        it(
            "rejects invalid password lengths before hashing",
            async () => {
                await expect(
                    hashPassword("Short1")
                ).rejects.toThrow(
                    "Password must contain between 8 and 128 characters."
                );
            }
        );

        it(
            "generates and verifies a typed access token",
            () => {
                const token =
                    generateAccessToken(
                        "user-1",
                        "STUDENT"
                    );

                const payload =
                    verifyAccessToken(
                        token
                    );

                expect(payload).toMatchObject({
                    userId: "user-1",
                    role: "STUDENT",
                    tokenType:
                        "access",
                    iss:
                        "placementos-api",
                    aud:
                        "placementos-client",
                });

                expect(
                    payload.exp! -
                    payload.iat!
                ).toBe(15 * 60);
            }
        );

        it(
            "generates and verifies a typed refresh token",
            () => {
                const token =
                    generateRefreshToken(
                        "user-1"
                    );

                const payload =
                    verifyRefreshToken(
                        token
                    );

                expect(payload).toMatchObject({
                    userId: "user-1",
                    tokenType:
                        "refresh",
                    iss:
                        "placementos-api",
                    aud:
                        "placementos-client",
                });

                expect(
                    payload.exp! -
                    payload.iat!
                ).toBe(
                    7 * 24 * 60 * 60
                );
            }
        );

        it(
            "rejects a refresh token as an access token",
            () => {
                const refreshToken =
                    generateRefreshToken(
                        "user-1"
                    );

                expect(() =>
                    verifyAccessToken(
                        refreshToken
                    )
                ).toThrow();
            }
        );

        it(
            "rejects token-type confusion even when both secrets are accidentally equal",
            () => {
                process.env.JWT_SECRET =
                    ACCESS_SECRET;

                process.env
                    .JWT_REFRESH_SECRET =
                    ACCESS_SECRET;

                const accessToken =
                    generateAccessToken(
                        "user-1",
                        "STUDENT"
                    );

                expect(() =>
                    verifyRefreshToken(
                        accessToken
                    )
                ).toThrow(
                    "Invalid refresh token payload."
                );
            }
        );

        it(
            "rejects tokens signed with an unapproved algorithm or secret",
            () => {
                const forgedToken =
                    jwt.sign(
                        {
                            userId:
                                "user-1",

                            role:
                                "ADMIN",

                            tokenType:
                                "access",
                        },

                        "different-secret-abcdefghijklmnopqrstuvwxyz-1234567890",

                        {
                            algorithm:
                                "HS256",

                            expiresIn:
                                "15m",

                            issuer:
                                "placementos-api",

                            audience:
                                "placementos-client",
                        }
                    );

                expect(() =>
                    verifyAccessToken(
                        forgedToken
                    )
                ).toThrow();
            }
        );

        it(
            "fails clearly when an access-token secret is missing",
            () => {
                delete process.env
                    .JWT_SECRET;

                expect(() =>
                    generateAccessToken(
                        "user-1",
                        "STUDENT"
                    )
                ).toThrow(
                    "JWT_SECRET is missing from server environment variables."
                );
            }
        );

        it(
            "rejects weak JWT secrets",
            () => {
                process.env.JWT_SECRET =
                    "too-short";

                expect(() =>
                    generateAccessToken(
                        "user-1",
                        "STUDENT"
                    )
                ).toThrow(
                    "JWT_SECRET must contain at least 32 characters."
                );
            }
        );
    }
);