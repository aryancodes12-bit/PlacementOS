import jwt from "jsonwebtoken";

export const generateAccessToken = (userId: string, role: string) => {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
        throw new Error("JWT_ACCESS_SECRET is missing");
    }

    return jwt.sign({ userId, role }, secret, {
        expiresIn: "7d",
    });
};

export const verifyAccessToken = (token: string) => {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
        throw new Error("JWT_ACCESS_SECRET is missing");
    }

    return jwt.verify(token, secret) as {
        userId: string;
        role: string;
    };
};