import { Response } from "express";
import { prisma } from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";

export const getMyProfile = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const profile = await prisma.profile.findUnique({
            where: {
                userId: req.user.id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        avatarUrl: true,
                        createdAt: true,
                    },
                },
            },
        });

        return res.status(200).json({
            success: true,
            data: {
                profile,
            },
        });
    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const {
            skills,
            targetCompanies,
            bio,
            linkedinUrl,
            githubUrl,
            college,
            graduationYear,
        } = req.body;

        const profile = await prisma.profile.upsert({
            where: {
                userId: req.user.id,
            },
            update: {
                skills: Array.isArray(skills) ? skills : undefined,
                targetCompanies: Array.isArray(targetCompanies)
                    ? targetCompanies
                    : undefined,
                bio,
                linkedinUrl,
                githubUrl,
                college,
                graduationYear:
                    typeof graduationYear === "number" ? graduationYear : undefined,
            },
            create: {
                userId: req.user.id,
                skills: Array.isArray(skills) ? skills : [],
                targetCompanies: Array.isArray(targetCompanies) ? targetCompanies : [],
                bio,
                linkedinUrl,
                githubUrl,
                college,
                graduationYear:
                    typeof graduationYear === "number" ? graduationYear : undefined,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                profile,
            },
        });
    } catch (error) {
        console.error("Update profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};