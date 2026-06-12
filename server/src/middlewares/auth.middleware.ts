import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../services/auth.service'
import { prisma } from '../prisma/client'

// Request object extend karo — userId attach karne ke liye
export interface AuthRequest extends Request {
    user?: {
        id: string
        role: string
        email: string
    }
}

// Protect — login hona zaroori hai
export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Not authorized, no token' })
        }

        const token = authHeader.split(' ')[1]
        const decoded = verifyAccessToken(token)

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, email: true }
        })

        if (!user) {
            return res.status(401).json({ message: 'User not found' })
        }

        req.user = user
        next()
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' })
    }
}

// Role check — admin only routes ke liye
export const adminOnly = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Access denied — Admins only' })
    }
    next()
}