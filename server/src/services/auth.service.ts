import bcrypt from "bcryptjs";

import jwt, {
    type Algorithm,
    type JwtPayload,
    type SignOptions,
} from "jsonwebtoken";

const PASSWORD_HASH_ROUNDS = 12;

const ACCESS_TOKEN_EXPIRES_IN:
    SignOptions["expiresIn"] =
    "15m";

const REFRESH_TOKEN_EXPIRES_IN:
    SignOptions["expiresIn"] =
    "7d";

const JWT_ALGORITHM: Algorithm =
    "HS256";

const JWT_ISSUER =
    "placementos-api";

const JWT_AUDIENCE =
    "placementos-client";

export interface AccessTokenPayload
    extends JwtPayload {
    userId: string;
    role: string;
    tokenType: "access";
}

export interface RefreshTokenPayload
    extends JwtPayload {
    userId: string;
    tokenType: "refresh";
}

const getRequiredSecret = (
    key:
        | "JWT_SECRET"
        | "JWT_REFRESH_SECRET"
): string => {
    const value =
        process.env[key]?.trim();

    if (!value) {
        throw new Error(
            `${key} is missing from server environment variables.`
        );
    }

    /*
     * HS256 should use a high-entropy secret.
     * Enforcing 32+ characters prevents weak,
     * accidental development placeholders.
     */
    if (value.length < 32) {
        throw new Error(
            `${key} must contain at least 32 characters.`
        );
    }

    return value;
};

const requireNonEmptyValue = (
    value: string,
    fieldName: string
): string => {
    const normalized =
        value.trim();

    if (!normalized) {
        throw new Error(
            `${fieldName} is required.`
        );
    }

    return normalized;
};

export const hashPassword = async (
    password: string
): Promise<string> => {
    if (
        password.length < 8 ||
        password.length > 128
    ) {
        throw new Error(
            "Password must contain between 8 and 128 characters."
        );
    }

    return bcrypt.hash(
        password,
        PASSWORD_HASH_ROUNDS
    );
};

export const comparePassword = async (
    password: string,
    hashedPassword: string
): Promise<boolean> => {
    if (
        !password ||
        !hashedPassword
    ) {
        return false;
    }

    return bcrypt.compare(
        password,
        hashedPassword
    );
};

export const generateAccessToken = (
    userId: string,
    role: string
): string => {
    const normalizedUserId =
        requireNonEmptyValue(
            userId,
            "User ID"
        );

    const normalizedRole =
        requireNonEmptyValue(
            role,
            "User role"
        );

    return jwt.sign(
        {
            userId:
                normalizedUserId,

            role:
                normalizedRole,

            tokenType:
                "access",
        },

        getRequiredSecret(
            "JWT_SECRET"
        ),

        {
            algorithm:
                JWT_ALGORITHM,

            expiresIn:
                ACCESS_TOKEN_EXPIRES_IN,

            issuer:
                JWT_ISSUER,

            audience:
                JWT_AUDIENCE,
        }
    );
};

export const generateRefreshToken = (
    userId: string
): string => {
    const normalizedUserId =
        requireNonEmptyValue(
            userId,
            "User ID"
        );

    return jwt.sign(
        {
            userId:
                normalizedUserId,

            tokenType:
                "refresh",
        },

        getRequiredSecret(
            "JWT_REFRESH_SECRET"
        ),

        {
            algorithm:
                JWT_ALGORITHM,

            expiresIn:
                REFRESH_TOKEN_EXPIRES_IN,

            issuer:
                JWT_ISSUER,

            audience:
                JWT_AUDIENCE,
        }
    );
};

export const verifyAccessToken = (
    token: string
): AccessTokenPayload => {
    const decoded = jwt.verify(
        token,

        getRequiredSecret(
            "JWT_SECRET"
        ),

        {
            algorithms: [
                JWT_ALGORITHM,
            ],

            issuer:
                JWT_ISSUER,

            audience:
                JWT_AUDIENCE,
        }
    );

    if (
        typeof decoded === "string" ||
        decoded.tokenType !==
        "access" ||
        typeof decoded.userId !==
        "string" ||
        !decoded.userId.trim() ||
        typeof decoded.role !==
        "string" ||
        !decoded.role.trim()
    ) {
        throw new Error(
            "Invalid access token payload."
        );
    }

    return decoded as
        AccessTokenPayload;
};

export const verifyRefreshToken = (
    token: string
): RefreshTokenPayload => {
    const decoded = jwt.verify(
        token,

        getRequiredSecret(
            "JWT_REFRESH_SECRET"
        ),

        {
            algorithms: [
                JWT_ALGORITHM,
            ],

            issuer:
                JWT_ISSUER,

            audience:
                JWT_AUDIENCE,
        }
    );

    if (
        typeof decoded === "string" ||
        decoded.tokenType !==
        "refresh" ||
        typeof decoded.userId !==
        "string" ||
        !decoded.userId.trim()
    ) {
        throw new Error(
            "Invalid refresh token payload."
        );
    }

    return decoded as
        RefreshTokenPayload;
};