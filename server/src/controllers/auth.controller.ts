import { Request, Response } from 'express'
import { prisma } from '../prisma/client'
import {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} from '../services/auth.service'
import { OAuth2Client } from 'google-auth-library'
import { AuthRequest } from "../middlewares/auth.middleware";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// ─── Register ────────────────────────────────────────────────────
export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields required' })
        }

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return res.status(400).json({ message: 'Email already registered' })
        }

        const hashed = await hashPassword(password)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashed,
                profile: { create: {} }  // empty profile auto-create
            }
        })

        const accessToken = generateAccessToken(user.id, user.role)
        const refreshToken = generateRefreshToken(user.id)

        res.status(201).json({
            message: 'Registered successfully',
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })
    } catch (error) {
        console.error('Register error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}

// ─── Login ───────────────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' })
        }

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.password) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        const isMatch = await comparePassword(password, user.password)
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        const accessToken = generateAccessToken(user.id, user.role)
        const refreshToken = generateRefreshToken(user.id)

        res.json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}

// ─── Google OAuth ────────────────────────────────────────────────
export const googleAuth = async (req: Request, res: Response) => {
    try {
        const { idToken } = req.body

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        })

        const payload = ticket.getPayload()
        if (!payload) {
            return res.status(400).json({ message: 'Invalid Google token' })
        }

        const { sub: googleId, email, name, picture } = payload

        // User already exists?
        let user = await prisma.user.findFirst({
            where: { OR: [{ googleId }, { email }] }
        })

        if (!user) {
            // New user — create with profile
            user = await prisma.user.create({
                data: {
                    googleId,
                    email: email!,
                    name: name!,
                    avatarUrl: picture,
                    profile: { create: {} }
                }
            })
        } else if (!user.googleId) {
            // Existing email user — link Google account
            user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId, avatarUrl: picture }
            })
        }

        const accessToken = generateAccessToken(user.id, user.role)
        const refreshToken = generateRefreshToken(user.id)

        res.json({
            message: 'Google login successful',
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl
            }
        })
    } catch (error) {
        console.error('Google auth error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}

// ─── Refresh Token ───────────────────────────────────────────────
export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token required' })
        }

        const decoded = verifyRefreshToken(refreshToken)
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        })

        if (!user) {
            return res.status(401).json({ message: 'User not found' })
        }

        const newAccessToken = generateAccessToken(user.id, user.role)

        res.json({ accessToken: newAccessToken })
    } catch (error) {
        res.status(401).json({ message: 'Invalid refresh token' })
    }
}

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
                profile: {
                    select: {
                        id: true,
                        skills: true,
                        targetCompanies: true,
                        bio: true,
                        linkedinUrl: true,
                        githubUrl: true,
                        college: true,
                        graduationYear: true,
                    },
                },
            },
        });

        return res.status(200).json({
            success: true,
            data: {
                user,
            },
        });
    } catch (error) {
        console.error("Get me error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};