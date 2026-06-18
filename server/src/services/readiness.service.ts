import { prisma } from "../prisma/client";

type ReadinessScores = {
    dsaScore: number;
    resumeScore: number;
    interviewScore: number;
    aptitudeScore: number;
};

type CompanyRule = {
    name: string;
    minOverall: number;
    minDsa?: number;
    minInterview?: number;
    minResume?: number;
};

export const DEFAULT_COMPANY_RULES: CompanyRule[] = [
    {
        name: "TCS",
        minOverall: 40,
    },
    {
        name: "Infosys",
        minOverall: 45,
    },
    {
        name: "Wipro",
        minOverall: 45,
    },
    {
        name: "Accenture",
        minOverall: 50,
    },
    {
        name: "Cognizant",
        minOverall: 50,
    },
    {
        name: "Capgemini",
        minOverall: 50,
    },
    {
        name: "HCL",
        minOverall: 45,
    },
    {
        name: "JPMorgan",
        minOverall: 65,
        minDsa: 50,
        minInterview: 55,
        minResume: 60,
    },
    {
        name: "Goldman Sachs",
        minOverall: 70,
        minDsa: 60,
        minInterview: 60,
        minResume: 65,
    },
    {
        name: "Microsoft",
        minOverall: 80,
        minDsa: 75,
        minInterview: 70,
        minResume: 70,
    },
    {
        name: "Amazon",
        minOverall: 75,
        minDsa: 70,
        minInterview: 65,
        minResume: 65,
    },
    {
        name: "Google",
        minOverall: 85,
        minDsa: 80,
        minInterview: 75,
        minResume: 75,
    },
    {
        name: "Atlassian",
        minOverall: 75,
        minDsa: 70,
        minInterview: 65,
        minResume: 65,
    },
    {
        name: "Flipkart",
        minOverall: 70,
        minDsa: 65,
        minInterview: 60,
        minResume: 60,
    },
    {
        name: "Swiggy",
        minOverall: 65,
        minDsa: 55,
        minInterview: 55,
        minResume: 55,
    },
    {
        name: "Zomato",
        minOverall: 65,
        minDsa: 55,
        minInterview: 55,
        minResume: 55,
    },
];

const clampScore = (value: unknown) => {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) return 0;

    return Math.max(0, Math.min(100, numericValue));
};

const normalizeCompanyName = (company: string) => {
    return company.trim().replace(/\s+/g, " ");
};

const uniqueStrings = (items: string[]) => {
    return Array.from(
        new Set(items.map((item) => item.trim()).filter(Boolean))
    );
};

export const calculateWeightedReadiness = (scores: ReadinessScores) => {
    const dsaScore = clampScore(scores.dsaScore);
    const resumeScore = clampScore(scores.resumeScore);
    const interviewScore = clampScore(scores.interviewScore);
    const aptitudeScore = clampScore(scores.aptitudeScore);

    return Math.round(
        dsaScore * 0.4 +
        interviewScore * 0.3 +
        resumeScore * 0.2 +
        aptitudeScore * 0.1
    );
};

export const matchCompanies = (
    scores: ReadinessScores,
    customCompanies: string[] = []
) => {
    const overallScore = calculateWeightedReadiness(scores);

    const customRules: CompanyRule[] = uniqueStrings(customCompanies)
        .filter(
            (company) =>
                !DEFAULT_COMPANY_RULES.some(
                    (rule) =>
                        rule.name.toLowerCase() === normalizeCompanyName(company).toLowerCase()
                )
        )
        .map((company) => ({
            name: normalizeCompanyName(company),
            minOverall: 60,
            minDsa: 45,
            minInterview: 45,
            minResume: 50,
        }));

    const allRules = [...DEFAULT_COMPANY_RULES, ...customRules];

    const readyFor: string[] = [];
    const improveFor: string[] = [];

    allRules.forEach((rule) => {
        const isReady =
            overallScore >= rule.minOverall &&
            scores.dsaScore >= (rule.minDsa ?? 0) &&
            scores.interviewScore >= (rule.minInterview ?? 0) &&
            scores.resumeScore >= (rule.minResume ?? 0);

        if (isReady) {
            readyFor.push(rule.name);
        } else {
            improveFor.push(rule.name);
        }
    });

    return {
        readyFor,
        improveFor,
    };
};

export const generateImprovementTips = (scores: ReadinessScores) => {
    const tips: string[] = [];

    if (scores.dsaScore < 30) {
        tips.push(
            "Start DSA consistency: solve 2 easy-to-medium problems daily from Arrays, Strings, HashMap, and Two Pointers."
        );
    } else if (scores.dsaScore < 60) {
        tips.push(
            "Increase DSA depth: add medium problems and revise patterns where you repeatedly get stuck."
        );
    } else if (scores.dsaScore < 80) {
        tips.push(
            "Move toward interview-level DSA: practice timed medium problems and explain time-space complexity out loud."
        );
    }

    if (scores.resumeScore <= 0) {
        tips.push(
            "Upload your resume to generate ATS score, missing keywords, and project improvement suggestions."
        );
    } else if (scores.resumeScore < 70) {
        tips.push(
            "Improve resume shortlist chances: fix missing keywords and rewrite weak project bullets from Resume Intelligence."
        );
    } else if (scores.resumeScore < 85) {
        tips.push(
            "Polish your resume: add stronger quantified outcomes and align skills with target companies."
        );
    }

    if (scores.interviewScore <= 0) {
        tips.push(
            "Log your first mock interview replay to identify communication, confidence, and technical gaps."
        );
    } else if (scores.interviewScore < 60) {
        tips.push(
            "Improve interview conversion: practice structured answers using STAR and explain one project end-to-end daily."
        );
    } else if (scores.interviewScore < 80) {
        tips.push(
            "Sharpen interview performance: target recurring missed concepts from your Interview Replay reports."
        );
    }

    if (scores.aptitudeScore < 40) {
        tips.push(
            "Start aptitude basics: spend 15 minutes daily on percentages, ratios, averages, and logical reasoning."
        );
    }

    if (tips.length === 0) {
        tips.push(
            "Strong progress. Focus on company-specific prep, mock interviews, and timed DSA practice."
        );
    }

    return tips.slice(0, 5);
};

const shouldCreateHistorySnapshot = async (
    userId: string,
    scores: ReadinessScores & { overallScore: number }
) => {
    const latestSnapshot = await prisma.readinessHistory.findFirst({
        where: {
            userId,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    if (!latestSnapshot) return true;

    return (
        Math.round(latestSnapshot.overallScore) !== Math.round(scores.overallScore) ||
        Math.round(latestSnapshot.dsaScore) !== Math.round(scores.dsaScore) ||
        Math.round(latestSnapshot.resumeScore) !== Math.round(scores.resumeScore) ||
        Math.round(latestSnapshot.interviewScore) !==
        Math.round(scores.interviewScore) ||
        Math.round(latestSnapshot.aptitudeScore) !== Math.round(scores.aptitudeScore)
    );
};

export const ensureReadinessScore = async (userId: string) => {
    return prisma.readinessScore.upsert({
        where: {
            userId,
        },
        update: {},
        create: {
            userId,
            dsaScore: 0,
            resumeScore: 0,
            interviewScore: 0,
            aptitudeScore: 0,
            overallScore: 0,
            readyFor: [],
            improveFor: [],
        },
    });
};

export const updateReadiness = async (userId: string) => {
    const current = await ensureReadinessScore(userId);

    const scores: ReadinessScores = {
        dsaScore: clampScore(current.dsaScore),
        resumeScore: clampScore(current.resumeScore),
        interviewScore: clampScore(current.interviewScore),
        aptitudeScore: clampScore(current.aptitudeScore),
    };

    const overallScore = calculateWeightedReadiness(scores);

    const profile = await prisma.profile.findUnique({
        where: {
            userId,
        },
    });

    const { readyFor, improveFor } = matchCompanies(
        scores,
        profile?.targetCompanies ?? []
    );

    const updated = await prisma.readinessScore.update({
        where: {
            userId,
        },
        data: {
            overallScore,
            readyFor,
            improveFor,
        },
    });

    const createSnapshot = await shouldCreateHistorySnapshot(userId, {
        ...scores,
        overallScore,
    });

    if (createSnapshot) {
        await prisma.readinessHistory.create({
            data: {
                userId,
                overallScore,
                dsaScore: scores.dsaScore,
                resumeScore: scores.resumeScore,
                interviewScore: scores.interviewScore,
                aptitudeScore: scores.aptitudeScore,
            },
        });
    }

    return {
        ...updated,
        improvementTips: generateImprovementTips(scores),
    };
};

export const getReadinessHistory = async (userId: string) => {
    return prisma.readinessHistory.findMany({
        where: {
            userId,
        },
        orderBy: {
            createdAt: "asc",
        },
        take: 50,
    });
};