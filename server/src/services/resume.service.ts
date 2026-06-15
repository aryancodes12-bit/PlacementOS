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

const fallbackResumeAnalysis = (): ResumeAIAnalysis => ({
    atsScore: 50,
    roleFitScore: 50,
    keywordScore: 50,
    projectScore: 50,
    readabilityScore: 50,

    summary:
        "Resume analysis could not be generated completely. Review formatting, skills, projects, and measurable impact manually.",
    recruiterVerdict:
        "The resume needs more structured information before it can be evaluated confidently.",

    topStrengths: [],
    criticalIssues: ["AI response could not be parsed correctly."],

    missingKeywords: {
        technical: [],
        tools: [],
        roleSpecific: [],
    },

    sectionFeedback: [],
    projectImprovements: [],

    suggestedBullets: [
        "Add measurable impact to each project bullet.",
        "Include target-role keywords in the skills and project sections.",
        "Keep bullets concise and action-oriented.",
    ],
    actionPlan: [
        "Fix resume structure and section ordering.",
        "Add missing technical keywords.",
        "Rewrite project bullets with impact, tools, and outcomes.",
    ],
});

const parseResumeJsonSafely = (text: string): ResumeAIAnalysis => {
    try {
        const cleaned = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const parsed = JSON.parse(cleaned);

        return {
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
    } catch {
        return fallbackResumeAnalysis();
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
        resumeText,
        scoringRules: {
            atsScore:
                "0-100 score based on ATS readability, section structure, keywords, formatting, quantified impact, and recruiter clarity.",
            roleFitScore:
                "0-100 score based on how well the resume matches the target role.",
            keywordScore:
                "0-100 score based on relevant technical keywords, tools, frameworks, databases, and role-specific terms.",
            projectScore:
                "0-100 score based on project quality, complexity, outcomes, architecture, metrics, and clarity.",
            readabilityScore:
                "0-100 score based on concise bullets, grammar, ordering, formatting, and easy scanning.",
        },
        outputRequirements: [
            "Return only valid JSON. No markdown. No text outside JSON.",
            "Be strict. Do not inflate scores.",
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

    return parseResumeJsonSafely(text);
};