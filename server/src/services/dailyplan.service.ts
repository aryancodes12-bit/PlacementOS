import Groq from "groq-sdk";
import { prisma } from "../prisma/client";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export interface DailyPlanItem {
    task: string;
    reason: string;
    duration: string;
}

export interface DailyPlanCategory {
    name: "DSA" | "Resume" | "Interview";
    icon: "code" | "file" | "mic";
    color: "brand" | "success" | "warning";
    items: DailyPlanItem[];
}

export interface DailyPlanAIResponse {
    greeting: string;
    categories: DailyPlanCategory[];
    totalTime: string;
    focusMessage: string;
}

const asStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];

    return value.map((item) => String(item).trim()).filter(Boolean);
};

const fallbackDailyPlan = (): DailyPlanAIResponse => ({
    greeting:
        "Stay consistent today — focus on one DSA pattern, one resume improvement, and one interview explanation drill.",
    categories: [
        {
            name: "DSA",
            icon: "code",
            color: "brand",
            items: [
                {
                    task: "Solve 2 easy-to-medium problems from Arrays or HashMap.",
                    reason: "Your DSA score needs consistent practice to improve readiness.",
                    duration: "45 min",
                },
            ],
        },
        {
            name: "Resume",
            icon: "file",
            color: "success",
            items: [
                {
                    task: "Review missing keywords and improve one project bullet.",
                    reason: "Small resume improvements can increase ATS and recruiter clarity.",
                    duration: "20 min",
                },
            ],
        },
        {
            name: "Interview",
            icon: "mic",
            color: "warning",
            items: [
                {
                    task: "Explain one project end-to-end out loud using problem, tech, impact, and tradeoffs.",
                    reason: "Interview score improves when your explanations become structured.",
                    duration: "30 min",
                },
            ],
        },
    ],
    totalTime: "1 hour 35 min",
    focusMessage: "Today’s main focus is consistency across DSA and interview explanation.",
});

const parseDailyPlanSafely = (text: string): DailyPlanAIResponse => {
    try {
        const cleaned = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const parsed = JSON.parse(cleaned);

        return {
            greeting: String(parsed.greeting || fallbackDailyPlan().greeting),
            categories: Array.isArray(parsed.categories)
                ? parsed.categories.map((category: any) => ({
                    name: category.name || "DSA",
                    icon: category.icon || "code",
                    color: category.color || "brand",
                    items: Array.isArray(category.items)
                        ? category.items.map((item: any) => ({
                            task: String(item.task || ""),
                            reason: String(item.reason || ""),
                            duration: String(item.duration || ""),
                        }))
                        : [],
                }))
                : fallbackDailyPlan().categories,
            totalTime: String(parsed.totalTime || "—"),
            focusMessage: String(
                parsed.focusMessage || fallbackDailyPlan().focusMessage
            ),
        };
    } catch {
        return fallbackDailyPlan();
    }
};

const findWeakDsaTopics = (problems: any[]) => {
    const topicMap: Record<string, { total: number; solved: number }> = {};

    problems.forEach((problem) => {
        const topic = problem.topic || "General";

        if (!topicMap[topic]) {
            topicMap[topic] = {
                total: 0,
                solved: 0,
            };
        }

        topicMap[topic].total += 1;

        if (problem.status === "SOLVED") {
            topicMap[topic].solved += 1;
        }
    });

    return Object.entries(topicMap)
        .filter(([, value]) => value.total > 0 && value.solved / value.total < 0.5)
        .map(([topic]) => topic)
        .slice(0, 5);
};

const findRecurringInterviewConcepts = (interviews: any[]) => {
    const frequency: Record<string, number> = {};

    interviews
        .flatMap((interview) => interview.conceptsMissed || [])
        .forEach((concept) => {
            frequency[concept] = (frequency[concept] || 0) + 1;
        });

    return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .map(([concept]) => concept)
        .slice(0, 5);
};

export const generateDailyPlan = async (
    userId: string
): Promise<DailyPlanAIResponse> => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is missing");
    }

    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const [
        dsaProblems,
        latestResume,
        recentInterviews,
        readiness,
        profile,
    ] = await Promise.all([
        prisma.dSAProblem.findMany({
            where: {
                userId,
            },
            orderBy: {
                updatedAt: "desc",
            },
        }),

        prisma.resume.findFirst({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        }),

        prisma.interviewSession.findMany({
            where: {
                userId,
            },
            orderBy: {
                date: "desc",
            },
            take: 5,
        }),

        prisma.readinessScore.findUnique({
            where: {
                userId,
            },
        }),

        prisma.profile.findUnique({
            where: {
                userId,
            },
        }),
    ]);

    const solvedDsa = dsaProblems.filter(
        (problem) => problem.status === "SOLVED"
    ).length;

    const dsaSummary = {
        total: dsaProblems.length,
        solved: solvedDsa,
        weakTopics: findWeakDsaTopics(dsaProblems),
        recentTopics: Array.from(
            new Set(dsaProblems.slice(0, 10).map((problem) => problem.topic))
        ).filter(Boolean),
    };

    const resumeSummary = {
        hasResume: Boolean(latestResume),
        atsScore: latestResume?.atsScore ?? 0,
        roleFitScore: latestResume?.roleFitScore ?? 0,
        keywordScore: latestResume?.keywordScore ?? 0,
        projectScore: latestResume?.projectScore ?? 0,
        targetRole: latestResume?.targetRole ?? null,
        actionPlan: asStringArray((latestResume?.aiAnalysis as any)?.actionPlan),
        missingKeywords: (latestResume?.aiAnalysis as any)?.missingKeywords ?? {},
    };

    const interviewSummary = {
        total: recentInterviews.length,
        averageScore:
            recentInterviews.length > 0
                ? Math.round(
                    recentInterviews.reduce(
                        (sum, interview) => sum + (interview.overallScore ?? 0),
                        0
                    ) / recentInterviews.length
                )
                : 0,
        recurringMissedConcepts: findRecurringInterviewConcepts(recentInterviews),
        nextActions: recentInterviews.flatMap(
            (interview) => interview.nextActions || []
        ),
    };

    const prompt = {
        task:
            "Generate a focused daily placement preparation plan for an engineering student.",
        studentContext: {
            targetCompanies: profile?.targetCompanies ?? [],
            skills: profile?.skills ?? [],
            targetRole:
                latestResume?.targetRole ||
                "SDE Intern, Full Stack Developer, Backend Developer",
        },
        readiness: {
            overallScore: readiness?.overallScore ?? 0,
            dsaScore: readiness?.dsaScore ?? 0,
            resumeScore: readiness?.resumeScore ?? 0,
            interviewScore: readiness?.interviewScore ?? 0,

            improvementTips: readiness
                ? []
                : ["Readiness score is not available yet."],
        },
        dsaSummary,
        resumeSummary,
        interviewSummary,
        outputRequirements: [
            "Return only valid JSON. No markdown. No text outside JSON.",
            "Create exactly 3 categories: DSA, Resume, Interview.",
            "Each category must have 2 to 3 specific tasks.",
            "Every task must have task, reason, and duration.",
            "Tasks must be doable today.",
            "Use actual weak topics, missing keywords, resume action plan, and interview missed concepts when available.",
            "Do not give generic advice like 'work hard' or 'practice more'.",
            "Do not invent fake scores, fake companies, or fake resume facts.",
            "Keep total time realistic for a student: between 1 and 3 hours.",
            "DSA category must contain only data structures, algorithms, SQL, problem-solving, or coding practice tasks.",
            "Do not put OOP, Java theory, resume, communication, or mock interview tasks inside DSA.",
            "Interview category should contain communication, mock interview, OOP explanation, Java concepts, project explanation, and spoken practice tasks.",
            "Resume category should contain only resume, ATS, keywords, bullet rewriting, project description, and recruiter clarity tasks.",
        ],
        requiredJsonShape: {
            greeting:
                "one motivational sentence based on current readiness and weakest area",
            categories: [
                {
                    name: "DSA",
                    icon: "code",
                    color: "brand",
                    items: [
                        {
                            task: "specific DSA task",
                            reason: "why this matters based on current data",
                            duration: "30 min",
                        },
                    ],
                },
                {
                    name: "Resume",
                    icon: "file",
                    color: "success",
                    items: [
                        {
                            task: "specific resume improvement task",
                            reason: "why this matters based on current data",
                            duration: "20 min",
                        },
                    ],
                },
                {
                    name: "Interview",
                    icon: "mic",
                    color: "warning",
                    items: [
                        {
                            task: "specific interview practice task",
                            reason: "why this matters based on current data",
                            duration: "30 min",
                        },
                    ],
                },
            ],
            totalTime: "total time estimate",
            focusMessage: "one sentence with today's single most important focus",
        },
    };

    const response = await groq.chat.completions.create({
        model,
        messages: [
            {
                role: "system",
                content:
                    "You are PlacementOS Daily Coach. Generate concise, specific, data-driven placement preparation plans. Output only valid JSON.",
            },
            {
                role: "user",
                content: JSON.stringify(prompt, null, 2),
            },
        ],
        temperature: 0.35,
        response_format: {
            type: "json_object",
        },
    });

    const text = response.choices[0]?.message?.content || "{}";

    return parseDailyPlanSafely(text);
};
