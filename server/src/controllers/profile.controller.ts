
import { Response } from "express";

import { prisma } from "../prisma/client";
import type { AuthRequest } from "../middlewares/auth.middleware";

import { updateReadiness } from "../services/readiness.service";

const MAX_SKILLS = 30;
const MAX_COMPANIES = 20;
const MAX_BIO_LENGTH = 500;
const MAX_COLLEGE_LENGTH = 120;

class ProfileValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ProfileValidationError";
    }
}

const normalizeStringList = (
    value: unknown,
    fieldName: string,
    maximumItems: number,
    maximumItemLength = 80
): string[] | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (!Array.isArray(value)) {
        throw new ProfileValidationError(`${fieldName} must be an array.`);
    }

    if (value.length > maximumItems) {
        throw new ProfileValidationError(
            `${fieldName} can contain at most ${maximumItems} items.`
        );
    }

    const uniqueValues = new Map<string, string>();

    for (const item of value) {
        if (typeof item !== "string") {
            throw new ProfileValidationError(
                `Every ${fieldName.toLowerCase()} item must be text.`
            );
        }

        const normalizedItem = item.trim();

        if (!normalizedItem) {
            continue;
        }

        if (normalizedItem.length > maximumItemLength) {
            throw new ProfileValidationError(
                `Each ${fieldName.toLowerCase()} item must be ${maximumItemLength} characters or fewer.`
            );
        }

        const comparisonKey = normalizedItem.toLowerCase();

        if (!uniqueValues.has(comparisonKey)) {
            uniqueValues.set(comparisonKey, normalizedItem);
        }
    }

    return Array.from(uniqueValues.values());
};

const normalizeOptionalText = (
    value: unknown,
    fieldName: string,
    maximumLength: number
): string | null | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (typeof value !== "string") {
        throw new ProfileValidationError(`${fieldName} must be text.`);
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
        return null;
    }

    if (normalizedValue.length > maximumLength) {
        throw new ProfileValidationError(
            `${fieldName} must be ${maximumLength} characters or fewer.`
        );
    }

    return normalizedValue;
};

const normalizeProfessionalUrl = (
    value: unknown,
    provider: "linkedin" | "github"
): string | null | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (typeof value !== "string") {
        throw new ProfileValidationError(
            `${provider === "linkedin" ? "LinkedIn" : "GitHub"} URL must be text.`
        );
    }

    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return null;
    }

    const valueWithProtocol = /^https?:\/\//i.test(trimmedValue)
        ? trimmedValue
        : `https://${trimmedValue}`;

    let parsedUrl: URL;

    try {
        parsedUrl = new URL(valueWithProtocol);
    } catch {
        throw new ProfileValidationError(
            `Enter a valid ${provider === "linkedin" ? "LinkedIn" : "GitHub"} profile URL.`
        );
    }

    const hostname = parsedUrl.hostname
        .toLowerCase()
        .replace(/^www\./, "");

    const pathSegments = parsedUrl.pathname
        .split("/")
        .filter(Boolean);

    if (provider === "linkedin") {
        const validLinkedInProfile =
            hostname === "linkedin.com" &&
            pathSegments.length === 2 &&
            pathSegments[0].toLowerCase() === "in" &&
            Boolean(pathSegments[1]);

        if (!validLinkedInProfile) {
            throw new ProfileValidationError(
                "LinkedIn URL must be a personal profile such as linkedin.com/in/username."
            );
        }

        return `https://www.linkedin.com/in/${pathSegments[1]}`;
    }

    const validGitHubProfile =
        hostname === "github.com" &&
        pathSegments.length === 1 &&
        Boolean(pathSegments[0]);

    if (!validGitHubProfile) {
        throw new ProfileValidationError(
            "GitHub URL must be a user profile such as github.com/username."
        );
    }

    return `https://github.com/${pathSegments[0]}`;
};

const normalizeGraduationYear = (
    value: unknown
): number | null | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null || value === "") {
        return null;
    }

    const graduationYear = Number(value);
    const currentYear = new Date().getFullYear();

    if (!Number.isInteger(graduationYear)) {
        throw new ProfileValidationError(
            "Graduation year must be a valid whole number."
        );
    }

    if (
        graduationYear < currentYear - 1 ||
        graduationYear > currentYear + 10
    ) {
        throw new ProfileValidationError(
            `Graduation year must be between ${currentYear - 1} and ${currentYear + 10}.`
        );
    }

    return graduationYear;
};

const profileInclude = {
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
} as const;

export const getMyProfile = async (
    req: AuthRequest,
    res: Response
) => {
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
            include: profileInclude,
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
            message: "Failed to load profile.",
        });
    }
};

export const updateMyProfile = async (
    req: AuthRequest,
    res: Response
) => {
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
        } = req.body ?? {};

        const normalizedSkills = normalizeStringList(
            skills,
            "Skills",
            MAX_SKILLS
        );

        const normalizedTargetCompanies = normalizeStringList(
            targetCompanies,
            "Target companies",
            MAX_COMPANIES
        );

        const normalizedBio = normalizeOptionalText(
            bio,
            "Bio",
            MAX_BIO_LENGTH
        );

        const normalizedLinkedInUrl = normalizeProfessionalUrl(
            linkedinUrl,
            "linkedin"
        );

        const normalizedGitHubUrl = normalizeProfessionalUrl(
            githubUrl,
            "github"
        );

        const normalizedCollege = normalizeOptionalText(
            college,
            "College",
            MAX_COLLEGE_LENGTH
        );

        const normalizedGraduationYear =
            normalizeGraduationYear(graduationYear);

        const updateData = {
            ...(normalizedSkills !== undefined && {
                skills: normalizedSkills,
            }),

            ...(normalizedTargetCompanies !== undefined && {
                targetCompanies: normalizedTargetCompanies,
            }),

            ...(normalizedBio !== undefined && {
                bio: normalizedBio,
            }),

            ...(normalizedLinkedInUrl !== undefined && {
                linkedinUrl: normalizedLinkedInUrl,
            }),

            ...(normalizedGitHubUrl !== undefined && {
                githubUrl: normalizedGitHubUrl,
            }),

            ...(normalizedCollege !== undefined && {
                college: normalizedCollege,
            }),

            ...(normalizedGraduationYear !== undefined && {
                graduationYear: normalizedGraduationYear,
            }),
        };

        const profile = await prisma.profile.upsert({
            where: {
                userId: req.user.id,
            },

            update: updateData,

            create: {
                userId: req.user.id,
                skills: normalizedSkills ?? [],
                targetCompanies: normalizedTargetCompanies ?? [],
                bio: normalizedBio ?? null,
                linkedinUrl: normalizedLinkedInUrl ?? null,
                githubUrl: normalizedGitHubUrl ?? null,
                college: normalizedCollege ?? null,
                graduationYear: normalizedGraduationYear ?? null,
            },

            include: profileInclude,
        });

        let readiness = null;

        try {
            readiness = await updateReadiness(req.user.id);
        } catch (readinessError) {
            console.error(
                "Profile saved but readiness refresh failed:",
                readinessError
            );
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                profile,
                readiness,
            },
        });
    } catch (error) {
        if (error instanceof ProfileValidationError) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Update profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update profile.",
        });
    }
};

