import { Response } from "express";
import { prisma } from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { uploadToCloudinary } from "../services/cloudinary.service";
import {
    analyzeResumeIntelligence,
    extractTextFromPDF,
} from "../services/resume.service";
import axios from "axios";
const updateResumeReadiness = async (userId: string, resumeScore: number) => {
    const current = await prisma.readinessScore.findUnique({
        where: {
            userId,
        },
    });

    const dsaScore = current?.dsaScore ?? 0;
    const interviewScore = current?.interviewScore ?? 0;
    const aptitudeScore = current?.aptitudeScore ?? 0;

    const overallScore = Math.round(
        (dsaScore + resumeScore + interviewScore + aptitudeScore) / 4
    );

    await prisma.readinessScore.upsert({
        where: {
            userId,
        },
        update: {
            resumeScore,
            overallScore,
        },
        create: {
            userId,
            dsaScore: 0,
            resumeScore,
            interviewScore: 0,
            aptitudeScore: 0,
            overallScore,
            readyFor: [],
            improveFor: [],
        },
    });
};

export const getResumes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const resumes = await prisma.resume.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            resumes,
        });
    } catch (error) {
        console.error("getResumes error:", error);

        return res.status(500).json({
            message: "Failed to fetch resumes",
        });
    }
};

export const getLatestResume = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const resume = await prisma.resume.findFirst({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            resume,
        });
    } catch (error) {
        console.error("getLatestResume error:", error);

        return res.status(500).json({
            message: "Failed to fetch latest resume",
        });
    }
};

export const uploadResume = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { targetRole } = req.body;

        if (!req.file) {
            return res.status(400).json({
                message: "Resume PDF is required",
            });
        }

        const isPdf =
            req.file.mimetype === "application/pdf" ||
            /\.pdf$/i.test(req.file.originalname);

        if (!isPdf) {
            return res.status(400).json({
                message: "Only PDF resumes are allowed",
            });
        }

        const resumeText = await extractTextFromPDF(req.file.buffer);

        if (resumeText.trim().length < 80) {
            return res.status(400).json({
                message:
                    "Could not extract readable text from this PDF. Please upload a text-based resume PDF, not a scanned image.",
            });
        }

        const uploadedResume = await uploadToCloudinary(
            req.file.buffer,
            "placementos/resumes",
            "raw",
            {
                fileName: req.file.originalname,
            }
        );

        const profile = await prisma.profile.findUnique({
            where: {
                userId,
            },
        });

        const analysis = await analyzeResumeIntelligence({
            resumeText,
            targetRole: targetRole ? String(targetRole).trim() : null,
            userSkills: profile?.skills ?? [],
            targetCompanies: profile?.targetCompanies ?? [],
        });

        const previousCount = await prisma.resume.count({
            where: {
                userId,
            },
        });

        const resume = await prisma.resume.create({
            data: {
                userId,
                fileUrl: uploadedResume.url,
                fileName: req.file.originalname,
                fileSize: req.file.size,

                targetRole: targetRole ? String(targetRole).trim() : null,
                version: previousCount + 1,

                atsScore: analysis.atsScore,
                roleFitScore: analysis.roleFitScore,
                keywordScore: analysis.keywordScore,
                projectScore: analysis.projectScore,
                readabilityScore: analysis.readabilityScore,

                extractedText: resumeText.slice(0, 20000),
                aiAnalysis: analysis as any,
                analysisStatus: "ANALYZED",
            },
        });

        await updateResumeReadiness(userId, analysis.atsScore);

        return res.status(201).json({
            message: "Resume uploaded and analyzed successfully",
            analysis,
            resume,
        });
    } catch (error: any) {
        console.error("uploadResume error:", error);

        return res.status(500).json({
            message: error.message || "Failed to upload and analyze resume",
        });
    }
};
export const viewResumePdf = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const resumeId = String(req.params.id);

        const resume = await prisma.resume.findFirst({
            where: {
                id: resumeId,
                userId,
            },
        });

        if (!resume) {
            return res.status(404).json({
                message: "Resume not found",
            });
        }

        const pdfResponse = await axios.get<ArrayBuffer>(resume.fileUrl, {
            responseType: "arraybuffer",
        });

        const pdfBuffer = Buffer.from(pdfResponse.data);

        const safeFileName =
            resume.fileName?.replace(/[^a-zA-Z0-9._-]/g, "_") || "resume.pdf";

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `inline; filename="${safeFileName}"`
        );
        res.setHeader("Content-Length", String(pdfBuffer.length));

        return res.send(pdfBuffer);
    } catch (error: any) {
        console.error("viewResumePdf error:", error);

        return res.status(500).json({
            message: error.message || "Failed to load resume PDF",
        });
    }
};
export const deleteResume = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const resumeId = String(req.params.id);

        const existingResume = await prisma.resume.findFirst({
            where: {
                id: resumeId,
                userId,
            },
        });

        if (!existingResume) {
            return res.status(404).json({
                message: "Resume version not found",
            });
        }

        await prisma.resume.delete({
            where: {
                id: resumeId,
            },
        });

        const latestResume = await prisma.resume.findFirst({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        await updateResumeReadiness(userId, latestResume?.atsScore ?? 0);

        return res.status(200).json({
            message: "Resume version deleted successfully",
        });
    } catch (error) {
        console.error("deleteResume error:", error);

        return res.status(500).json({
            message: "Failed to delete resume version",
        });
    }
};