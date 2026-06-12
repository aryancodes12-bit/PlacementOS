import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 12)
}

export const comparePassword = async (
    password: string,
    hashed: string
): Promise<boolean> => {
    return bcrypt.compare(password, hashed)
}

export const generateAccessToken = (userId: string, role: string): string => {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '15m' })
}

export const generateRefreshToken = (userId: string): string => {
    return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
}

export const verifyRefreshToken = (token: string) => {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string }
}