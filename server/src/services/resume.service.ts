import Groq from "groq-sdk";
import { PDFParse } from "pdf-parse";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export interface ResumeSectionFeedback {
    section: string;
    score: number;
    diagnosis: string;
    fixes: string[];
}

export interface ResumeProjectImprovement {
    projectName: string;
    problem: string;
    improvement: string;
    rewrittenBullet: string;
}

export interface ResumeKeywordGroups {
    technical: string[];
    tools: string[];
    roleSpecific: string[];
}

export interface ResumeAIAnalysis {
    atsScore: number;
    roleFitScore: number;
    keywordScore: number;
    projectScore: number;
    readabilityScore: number;

    summary: string;
    recruiterVerdict: string;

    topStrengths: string[];
    criticalIssues: string[];

    missingKeywords: ResumeKeywordGroups;

    sectionFeedback: ResumeSectionFeedback[];
    projectImprovements: ResumeProjectImprovement[];

    suggestedBullets: string[];
    actionPlan: string[];
}

type ResumeScoreKey =
    | "atsScore"
    | "roleFitScore"
    | "keywordScore"
    | "projectScore"
    | "readabilityScore";

interface ResumeQualitySignals {
    wordCount: number;
    sectionHeadings: string[];
    hasContactInfo: boolean;
    hasLinks: boolean;
    hasEducation: boolean;
    hasSkills: boolean;
    hasProjects: boolean;
    hasExperience: boolean;
    hasCertifications: boolean;
    quantifiedAchievementCount: number;
    actionVerbCount: number;
    technicalKeywordCount: number;
    matchedProfileSkills: string[];
    targetRoleKeywordCount: number;
    estimatedProjectCount: number;
}

const SCORE_KEYS: ResumeScoreKey[] = [
    "atsScore",
    "roleFitScore",
    "keywordScore",
    "projectScore",
    "readabilityScore",
];

const TECHNICAL_KEYWORDS = [
    "javascript",
    "typescript",
    "java",
    "python",
    "c++",
    "c#",
    "react",
    "next.js",
    "node.js",
    "express",
    "spring",
    "django",
    "fastapi",
    "mongodb",
    "mysql",
    "postgresql",
    "redis",
    "prisma",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "git",
    "github",
    "rest",
    "graphql",
    "api",
    "microservices",
    "testing",
    "jest",
    "vitest",
    "tailwind",
    "html",
    "css",
    "sql",
    "data structures",
    "algorithms",
    "machine learning",
    "deployment",
    "ci/cd",
];

const ACTION_VERBS = [
    "built",
    "developed",
    "implemented",
    "designed",
    "created",
    "optimized",
    "improved",
    "reduced",
    "increased",
    "deployed",
    "integrated",
    "automated",
    "led",
    "managed",
    "collaborated",
    "tested",
    "debugged",
    "architected",
];

const SECTION_PATTERNS: Record<string, RegExp> = {
    Education: /^\s*(education|academic|qualification)s?\s*:?$/im,
    Skills: /^\s*(technical\s+skills|skills|technologies|tech\s+stack)\s*:?$/im,
    Projects: /^\s*(projects|academic\s+projects|personal\s+projects)\s*:?$/im,
    Experience:
        /^\s*(experience|work\s+experience|internship|internships|employment)\s*:?$/im,
    Certifications:
        /^\s*(certifications|certificates|courses|achievements)\s*:?$/im,
};

const clampNumber = (
    value: unknown,
    min: number,
    max: number,
    fallback: number
) => {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) return fallback;

    return Math.max(min, Math.min(max, Math.round(numericValue)));
};

const asStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(/[\n,]/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};

const clampScore = (value: number) => clampNumber(value, 0, 100, 50);

const unique = (values: string[]) => Array.from(new Set(values));

const normalizeText = (text: string) => text.toLowerCase().replace(/\s+/g, " ");

const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasKeyword = (normalizedText: string, keyword: string) => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) return false;

    if (/^[a-z0-9]+$/i.test(normalizedKeyword)) {
        return new RegExp(`\\b${escapeRegExp(normalizedKeyword)}\\b`).test(
            normalizedText
        );
    }

    return normalizedText.includes(normalizedKeyword);
};

const countKeywordHits = (text: string, keywords: string[]) => {
    const normalizedText = normalizeText(text);

    return unique(
        keywords
            .map((keyword) => keyword.trim().toLowerCase())
            .filter((keyword) => hasKeyword(normalizedText, keyword))
    ).length;
};

const getMatchedKeywords = (text: string, keywords: string[]) => {
    const normalizedText = normalizeText(text);

    return unique(
        keywords
            .map((keyword) => keyword.trim())
            .filter((keyword) => keyword.length > 1)
            .filter((keyword) => hasKeyword(normalizedText, keyword))
    );
};

const getTargetRoleKeywords = (targetRole?: string | null) => {
    const role = normalizeText(targetRole || "");

    if (!role) return [];

    const keywords = role
        .split(/[^a-z0-9+#.]+/i)
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 2);

    if (role.includes("full stack")) {
        keywords.push("frontend", "backend", "react", "node", "api", "database");
    }

    if (role.includes("backend")) {
        keywords.push("api", "database", "sql", "server", "node", "express");
    }

    if (role.includes("frontend")) {
        keywords.push("react", "javascript", "typescript", "html", "css");
    }

    if (role.includes("data")) {
        keywords.push("python", "sql", "machine learning", "analytics");
    }

    return unique(keywords);
};

const buildResumeQualitySignals = (input: {
    resumeText: string;
    targetRole?: string | null;
    userSkills?: string[];
}): ResumeQualitySignals => {
    const resumeText = input.resumeText;
    const normalizedText = normalizeText(resumeText);
    const sectionHeadings = Object.entries(SECTION_PATTERNS)
        .filter(([, pattern]) => pattern.test(resumeText))
        .map(([section]) => section);
    const quantifiedAchievementCount = (
        resumeText.match(
            /\b\d+(\.\d+)?\s?(%|\+|x|k|ms|s|sec|seconds|users?|requests?|apis?|projects?|problems?|stars?|gpa|cgpa|lpa|months?|weeks?)\b/gi
        ) || []
    ).length;
    const actionVerbCount = countKeywordHits(resumeText, ACTION_VERBS);
    const technicalKeywordCount = countKeywordHits(resumeText, TECHNICAL_KEYWORDS);
    const matchedProfileSkills = getMatchedKeywords(
        resumeText,
        input.userSkills ?? []
    );
    const targetRoleKeywordCount = countKeywordHits(
        resumeText,
        getTargetRoleKeywords(input.targetRole)
    );
    const projectVerbCount = countKeywordHits(resumeText, [
        "project",
        "built",
        "developed",
        "implemented",
        "deployed",
        "github",
    ]);

    return {
        wordCount: resumeText.split(/\s+/).filter(Boolean).length,
        sectionHeadings,
        hasContactInfo:
            /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(resumeText) ||
            /\b\+?\d[\d\s-]{8,}\d\b/.test(resumeText),
        hasLinks:
            normalizedText.includes("github") ||
            normalizedText.includes("linkedin") ||
            /https?:\/\//i.test(resumeText),
        hasEducation: sectionHeadings.includes("Education"),
        hasSkills: sectionHeadings.includes("Skills"),
        hasProjects: sectionHeadings.includes("Projects"),
        hasExperience: sectionHeadings.includes("Experience"),
        hasCertifications: sectionHeadings.includes("Certifications"),
        quantifiedAchievementCount,
        actionVerbCount,
        technicalKeywordCount,
        matchedProfileSkills,
        targetRoleKeywordCount,
        estimatedProjectCount: Math.min(6, Math.max(0, projectVerbCount)),
    };
};

const computeHeuristicScores = (
    signals: ResumeQualitySignals
): Pick<
    ResumeAIAnalysis,
    | "atsScore"
    | "roleFitScore"
    | "keywordScore"
    | "projectScore"
    | "readabilityScore"
> => {
    const hasGoodLength = signals.wordCount >= 250 && signals.wordCount <= 900;
    const isTooShort = signals.wordCount < 180;
    const isTooLong = signals.wordCount > 1100;
    const structureScore =
        Math.min(30, signals.sectionHeadings.length * 6) +
        (signals.hasContactInfo ? 8 : 0) +
        (signals.hasLinks ? 4 : 0);

    return {
        atsScore: clampScore(
            28 +
                structureScore +
                (hasGoodLength ? 12 : isTooShort ? -8 : 4) +
                Math.min(10, signals.quantifiedAchievementCount * 2) +
                Math.min(8, signals.actionVerbCount)
        ),
        roleFitScore: clampScore(
            30 +
                Math.min(20, signals.technicalKeywordCount * 2) +
                Math.min(16, signals.targetRoleKeywordCount * 4) +
                Math.min(14, signals.matchedProfileSkills.length * 4) +
                (signals.hasProjects ? 10 : 0) +
                (signals.hasExperience ? 8 : 0)
        ),
        keywordScore: clampScore(
            25 +
                (signals.hasSkills ? 10 : 0) +
                Math.min(38, signals.technicalKeywordCount * 3) +
                Math.min(18, signals.matchedProfileSkills.length * 4) +
                Math.min(9, signals.targetRoleKeywordCount * 3)
        ),
        projectScore: clampScore(
            22 +
                (signals.hasProjects ? 18 : 0) +
                Math.min(24, signals.estimatedProjectCount * 5) +
                Math.min(18, signals.quantifiedAchievementCount * 3) +
                Math.min(10, signals.technicalKeywordCount)
        ),
        readabilityScore: clampScore(
            36 +
                Math.min(24, signals.sectionHeadings.length * 5) +
                Math.min(14, signals.actionVerbCount * 2) +
                (hasGoodLength ? 14 : 0) -
                (isTooShort ? 8 : 0) -
                (isTooLong ? 10 : 0)
        ),
    };
};

const getSignalBasedStrengths = (signals: ResumeQualitySignals) => {
    const strengths: string[] = [];

    if (signals.technicalKeywordCount >= 8) {
        strengths.push("Resume includes a healthy set of technical keywords.");
    }

    if (signals.hasProjects && signals.estimatedProjectCount >= 2) {
        strengths.push("Projects are visible enough for a recruiter to evaluate.");
    }

    if (signals.quantifiedAchievementCount > 0) {
        strengths.push("Some bullets already include measurable evidence.");
    }

    if (signals.hasLinks) {
        strengths.push("Profile links make project verification easier.");
    }

    return strengths.length > 0
        ? strengths.slice(0, 3)
        : ["Resume has extractable text and can be improved with clearer evidence."];
};

const getSignalBasedIssues = (signals: ResumeQualitySignals) => {
    const issues: string[] = [];

    if (signals.sectionHeadings.length < 4) {
        issues.push("Important resume sections are missing or not clearly labeled.");
    }

    if (signals.quantifiedAchievementCount === 0) {
        issues.push("Bullets lack measurable impact, scale, or outcome numbers.");
    }

    if (signals.technicalKeywordCount < 6) {
        issues.push("Technical keywords are too thin for ATS matching.");
    }

    if (!signals.hasProjects) {
        issues.push("Projects section is missing or not recognizable.");
    }

    if (!signals.hasContactInfo) {
        issues.push("Contact information is missing or not easy to detect.");
    }

    return issues.length > 0
        ? issues.slice(0, 4)
        : ["Add stronger proof of ownership, scale, and technical depth."];
};

const parseKeywordGroups = (value: any): ResumeKeywordGroups => {
    return {
        technical: asStringArray(value?.technical),
        tools: asStringArray(value?.tools),
        roleSpecific: asStringArray(value?.roleSpecific),
    };
};

const parseSectionFeedback = (value: unknown): ResumeSectionFeedback[] => {
    if (!Array.isArray(value)) return [];

    return value.map((item: any) => ({
        section: String(item?.section || "Unknown"),
        score: clampNumber(item?.score, 0, 100, 50),
        diagnosis: String(item?.diagnosis || ""),
        fixes: asStringArray(item?.fixes),
    }));
};

const parseProjectImprovements = (
    value: unknown
): ResumeProjectImprovement[] => {
    if (!Array.isArray(value)) return [];

    return value.map((item: any) => ({
        projectName: String(item?.projectName || "Project"),
        problem: String(item?.problem || ""),
        improvement: String(item?.improvement || ""),
        rewrittenBullet: String(item?.rewrittenBullet || ""),
    }));
};

const fallbackResumeAnalysis = (input?: {
    resumeText: string;
    targetRole?: string | null;
    userSkills?: string[];
}): ResumeAIAnalysis => {
    const signals = input ? buildResumeQualitySignals(input) : null;
    const scores = signals
        ? computeHeuristicScores(signals)
        : {
              atsScore: 50,
              roleFitScore: 50,
              keywordScore: 50,
              projectScore: 50,
              readabilityScore: 50,
          };

    return {
        ...scores,

        summary:
            "Resume analysis was generated with local resume signals because the AI response could not be parsed completely. The highest-impact improvement is to make each major section show role-relevant skills, project depth, and measurable outcomes.",
        recruiterVerdict:
            scores.atsScore >= 75
                ? "Borderline shortlist: the resume has usable structure, but still needs stronger proof and targeting."
                : "Reject risk: the resume needs clearer structure, keywords, and evidence before it is placement-ready.",

        topStrengths: signals ? getSignalBasedStrengths(signals) : [],
        criticalIssues: [
            "AI response could not be parsed correctly.",
            ...(signals ? getSignalBasedIssues(signals) : []),
        ].slice(0, 4),

        missingKeywords: {
            technical: ["data structures", "algorithms", "system design"],
            tools: ["git", "testing", "deployment"],
            roleSpecific: getTargetRoleKeywords(input?.targetRole).slice(0, 5),
        },

        sectionFeedback: [
            {
                section: "Skills",
                score: scores.keywordScore,
                diagnosis:
                    "Skills were scored from detected technical keywords and profile-skill matches.",
                fixes: [
                    "Group skills by languages, frameworks, databases, tools, and fundamentals.",
                    "Keep only skills that are also supported by projects, experience, or coursework.",
                ],
            },
            {
                section: "Projects",
                score: scores.projectScore,
                diagnosis:
                    "Projects were scored from visible project signals, action verbs, technical keywords, and measurable outcomes.",
                fixes: [
                    "Rewrite project bullets with problem, tech stack, implementation detail, and outcome.",
                    "Add real metrics only where you can verify them.",
                ],
            },
        ],
        projectImprovements: [
            {
                projectName: "Most relevant project",
                problem:
                    "Project impact or technical depth is not clear enough from the extracted resume text.",
                improvement:
                    "Add architecture, tools used, your ownership, and measurable result.",
                rewrittenBullet:
                    "Built [project feature] using [confirmed tech stack] to solve [problem], improving [add actual metric] through [implementation detail].",
            },
        ],

        suggestedBullets: [
            "Built [feature] using [confirmed technology] to solve [specific problem], with impact measured by [add actual metric].",
            "Implemented [technical component] for [project name], improving reliability, usability, or performance by [add actual metric].",
            "Integrated [tool/API/database] in [project name] to support [specific user workflow or technical requirement].",
        ],
        actionPlan: [
            "Fix resume structure and section ordering.",
            "Add missing technical keywords that are truthful for the target role.",
            "Rewrite project bullets with technical depth and measurable impact.",
        ],
    };
};

const extractJsonObject = (text: string) => {
    const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
        return cleaned;
    }

    return cleaned.slice(firstBrace, lastBrace + 1);
};

const calibrateCompressedScores = (
    analysis: ResumeAIAnalysis,
    heuristicScores: ReturnType<typeof computeHeuristicScores>
): ResumeAIAnalysis => {
    const scores = SCORE_KEYS.map((key) => analysis[key]);
    const spread = Math.max(...scores) - Math.min(...scores);

    if (spread > 4) return analysis;

    const modelMean =
        scores.reduce((total, score) => total + score, 0) / scores.length;
    const heuristicValues = SCORE_KEYS.map((key) => heuristicScores[key]);
    const heuristicMean =
        heuristicValues.reduce((total, score) => total + score, 0) /
        heuristicValues.length;

    return SCORE_KEYS.reduce(
        (updatedAnalysis, key) => ({
            ...updatedAnalysis,
            [key]: clampScore(
                modelMean + (heuristicScores[key] - heuristicMean) * 0.55
            ),
        }),
        analysis
    );
};

const parseResumeJsonSafely = (
    text: string,
    fallbackAnalysis = fallbackResumeAnalysis(),
    heuristicScores?: ReturnType<typeof computeHeuristicScores>
): ResumeAIAnalysis => {
    try {
        const cleaned = extractJsonObject(text);

        const parsed = JSON.parse(cleaned);

        const analysis = {
            atsScore: clampNumber(parsed.atsScore, 0, 100, 50),
            roleFitScore: clampNumber(parsed.roleFitScore, 0, 100, 50),
            keywordScore: clampNumber(parsed.keywordScore, 0, 100, 50),
            projectScore: clampNumber(parsed.projectScore, 0, 100, 50),
            readabilityScore: clampNumber(parsed.readabilityScore, 0, 100, 50),

            summary: String(parsed.summary || ""),
            recruiterVerdict: String(parsed.recruiterVerdict || ""),

            topStrengths: asStringArray(parsed.topStrengths),
            criticalIssues: asStringArray(parsed.criticalIssues),

            missingKeywords: parseKeywordGroups(parsed.missingKeywords),

            sectionFeedback: parseSectionFeedback(parsed.sectionFeedback),
            projectImprovements: parseProjectImprovements(
                parsed.projectImprovements
            ),

            suggestedBullets: asStringArray(parsed.suggestedBullets),
            actionPlan: asStringArray(parsed.actionPlan),
        };

        return heuristicScores
            ? calibrateCompressedScores(analysis, heuristicScores)
            : analysis;
    } catch {
        return fallbackAnalysis;
    }
};

export const extractTextFromPDF = async (buffer: Buffer): Promise<string> => {
    const parser = new PDFParse({ data: buffer });
    try {
        const data = await parser.getText();
        return data.text
            .replace(/\u0000/g, "")
            .replace(/[ \t]+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    } finally {
        await parser.destroy();
    }
};

export const analyzeResumeIntelligence = async (input: {
    resumeText: string;
    targetRole?: string | null;
    userSkills?: string[];
    targetCompanies?: string[];
}): Promise<ResumeAIAnalysis> => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is missing");
    }

    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const resumeText = input.resumeText.slice(0, 12000);
    const resumeSignals = buildResumeQualitySignals({
        resumeText,
        targetRole: input.targetRole,
        userSkills: input.userSkills,
    });
    const fallbackAnalysis = fallbackResumeAnalysis({
        resumeText,
        targetRole: input.targetRole,
        userSkills: input.userSkills,
    });
    const heuristicScores = computeHeuristicScores(resumeSignals);

    const prompt = {
        task:
            "Analyze this engineering student's resume like a professional ATS reviewer, recruiter, and placement mentor.",
        targetRole:
            input.targetRole ||
            "General software engineering roles: SDE Intern, Full Stack Developer, Backend Developer",
        userContext: {
            skillsFromProfile: input.userSkills ?? [],
            targetCompanies: input.targetCompanies ?? [],
            market:
                "Indian campus placements, internships, service-based companies, product companies, and startups.",
        },
        resumeSignals,
        resumeText,
        scoringRules: {
            atsScore:
                "0-100 score based on ATS readability, section structure, contact details, links, keywords, formatting, quantified impact, and recruiter clarity.",
            roleFitScore:
                "0-100 score based on direct evidence that projects, skills, coursework, and experience match the target role.",
            keywordScore:
                "0-100 score based on relevant technical keywords, tools, frameworks, databases, fundamentals, and role-specific terms that are actually supported in the resume.",
            projectScore:
                "0-100 score based on project quality, complexity, outcomes, architecture, metrics, and clarity.",
            readabilityScore:
                "0-100 score based on concise bullets, grammar, ordering, formatting, and easy scanning.",
        },
        scoreBands: {
            "0-39":
                "Very weak: missing core sections, little role evidence, unreadable, or mostly empty content.",
            "40-54":
                "Weak: basic resume exists but lacks clear keywords, technical proof, metrics, or relevant projects.",
            "55-69":
                "Average campus resume: some sections and projects exist, but proof, depth, and targeting are limited.",
            "70-84":
                "Strong: clear structure, relevant skills, meaningful projects, some metrics, and good role alignment.",
            "85-100":
                "Exceptional: strong verified impact, rich technical depth, excellent role fit, clean ATS structure, and recruiter-ready bullets.",
        },
        calibrationInstructions: [
            "Use resumeSignals as evidence, but do not rely on them blindly. The resume text is the source of truth.",
            "Scores must be differentiated. Do not give the same number to every category unless the resume truly has identical evidence quality across all dimensions.",
            "Avoid safe default scores such as 50, 60, 70, or 75 unless the evidence exactly fits that band.",
            "First decide the score band from evidence, then choose an exact score inside that band.",
            "A resume with no quantified achievements should rarely exceed 74 overall ATS score.",
            "A resume with missing or weak projects should rarely exceed 65 projectScore.",
            "A resume with generic skills not backed by projects should rarely exceed 60 keywordScore or roleFitScore.",
            "A resume with missing contact info, unclear sections, or poor extraction should keep atsScore below 65.",
            "High scores require evidence from the resume text: named technologies, implementation details, links, outcomes, metrics, internships, or achievements.",
        ],
        outputRequirements: [
            "Return only valid JSON. No markdown. No text outside JSON.",
            "Be strict. Do not inflate scores.",
            "Each numeric score must be justified by actual resume evidence and should vary according to the scoring category.",
            "Do not give high scores unless the resume has strong evidence, measurable impact, and role-relevant keywords.",
            "If projects lack metrics, deployment, users, architecture, or technical depth, lower projectScore.",
            "If skills are generic or not reflected in projects, lower keywordScore and roleFitScore.",
            "If the resume is weak for the target role, say so clearly but constructively.",
            "Give concrete fixes, not generic advice.",
            "Suggested bullets must be directly usable in a resume, but must not invent unsupported metrics.",
            "Do not invent fake experience, fake companies, fake numbers, fake users, fake uptime, fake percentages, fake tools, or fake achievements.",
            "Use numbers only if they already appear in the resume text.",
            "Where a metric is missing, use safe placeholder wording like '[add measurable impact]' or '[add actual metric]' instead of inventing numbers.",
            "Rewritten bullets must improve wording using only evidence available in the resume.",
            "If a metric is missing, suggest a placeholder style like 'Reduced X by Y%' only as a template.",
        ],
        requiredJsonShape: {
            atsScore: "number from 0 to 100",
            roleFitScore: "number from 0 to 100",
            keywordScore: "number from 0 to 100",
            projectScore: "number from 0 to 100",
            readabilityScore: "number from 0 to 100",

            summary:
                "2-3 sentence overall assessment with the single highest-impact improvement.",
            recruiterVerdict:
                "Short recruiter-style verdict: shortlist / borderline / reject risk and why.",

            topStrengths: [
                "specific strength based on actual resume content",
                "specific strength based on actual resume content",
            ],
            criticalIssues: [
                "specific issue that can reduce shortlist chances",
                "specific issue that can reduce shortlist chances",
            ],

            missingKeywords: {
                technical: ["missing technical concept or skill"],
                tools: ["missing tool, framework, database, cloud, testing, or deployment keyword"],
                roleSpecific: ["missing keyword specific to target role"],
            },

            sectionFeedback: [
                {
                    section: "Education",
                    score: "number from 0 to 100",
                    diagnosis: "specific diagnosis for this section",
                    fixes: ["specific fix 1", "specific fix 2"],
                },
                {
                    section: "Skills",
                    score: "number from 0 to 100",
                    diagnosis: "specific diagnosis for this section",
                    fixes: ["specific fix 1", "specific fix 2"],
                },
                {
                    section: "Projects",
                    score: "number from 0 to 100",
                    diagnosis: "specific diagnosis for this section",
                    fixes: ["specific fix 1", "specific fix 2"],
                },
                {
                    section: "Experience",
                    score: "number from 0 to 100",
                    diagnosis: "specific diagnosis for this section",
                    fixes: ["specific fix 1", "specific fix 2"],
                },
            ],

            projectImprovements: [
                {
                    projectName: "actual project name if available",
                    problem: "what is weak in the current project description",
                    improvement: "what to add or rewrite",
                    rewrittenBullet:
                        "professional resume bullet using only facts from the resume. If impact metric is missing, use '[add actual metric]' placeholder instead of inventing a number",
                },
            ],

            suggestedBullets: [
                "truthful resume-ready bullet based only on existing resume evidence; use '[add actual metric]' if metric is missing",
                "truthful resume-ready bullet based only on existing resume evidence; use '[add actual metric]' if metric is missing",
                "truthful resume-ready bullet based only on existing resume evidence; use '[add actual metric]' if metric is missing",
            ],

            actionPlan: [
                "highest priority fix",
                "second priority fix",
                "third priority fix",
            ],
        },
    };

    const response = await groq.chat.completions.create({
        model,
        messages: [
            {
                role: "system",
                content:
                    "You are PlacementOS Resume Intelligence. You review engineering resumes for ATS, recruiter clarity, role fit, technical depth, and campus placement readiness. Output only valid JSON.",
            },
            {
                role: "user",
                content: JSON.stringify(prompt, null, 2),
            },
        ],
        temperature: 0.25,
        response_format: {
            type: "json_object",
        },
    });

    const text = response.choices[0]?.message?.content || "{}";

    return parseResumeJsonSafely(text, fallbackAnalysis, heuristicScores);
};
