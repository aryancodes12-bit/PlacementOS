
import Groq from "groq-sdk";
import { prisma } from "../prisma/client";
import { getDSAAnalytics } from "./dsaAnalytics.service";

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

type DSAAnalyticsResult = Awaited<
    ReturnType<typeof getDSAAnalytics>
>;

const CATEGORY_CONFIG: Record<
    DailyPlanCategory["name"],
    Pick<DailyPlanCategory, "icon" | "color">
> = {
    DSA: {
        icon: "code",
        color: "brand",
    },
    Resume: {
        icon: "file",
        color: "success",
    },
    Interview: {
        icon: "mic",
        color: "warning",
    },
};

const asStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => String(item).trim())
        .filter(Boolean);
};

const buildFallbackDailyPlan = (
    dsaAnalytics?: DSAAnalyticsResult
): DailyPlanAIResponse => {
    const dsaItems: DailyPlanItem[] = [];

    const firstRevision =
        dsaAnalytics?.revisionQueue?.[0];

    const focusPattern =
        dsaAnalytics?.dailyTarget?.focusPatterns?.[0] ||
        dsaAnalytics?.patternGaps?.[0] ||
        "HashMap";

    if (firstRevision) {
        dsaItems.push({
            task: `Revise ${firstRevision.title}`,
            reason:
                firstRevision.overdueDays > 0
                    ? `This problem is ${firstRevision.overdueDays} day${firstRevision.overdueDays === 1 ? "" : "s"
                    } overdue in your revision queue.`
                    : "This problem is due today according to your spaced-repetition schedule.",
            duration: "20 min",
        });
    }

    dsaItems.push({
        task: `Solve 2 problems using the ${focusPattern} pattern`,
        reason:
            "This pattern is currently weak or missing from your solved-pattern coverage.",
        duration: "45 min",
    });

    return {
        greeting:
            dsaAnalytics && dsaAnalytics.dsaScore < 40
                ? `Your DSA readiness is ${dsaAnalytics.dsaScore}/100, so today should focus on pattern breadth and consistent revision.`
                : "Stay consistent today with focused DSA, resume, and interview preparation.",

        categories: [
            {
                name: "DSA",
                icon: "code",
                color: "brand",
                items: dsaItems.slice(0, 3),
            },
            {
                name: "Resume",
                icon: "file",
                color: "success",
                items: [
                    {
                        task:
                            "Review one Resume Intelligence recommendation and improve one project bullet.",
                        reason:
                            "A focused resume improvement can strengthen ATS relevance and recruiter clarity.",
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
                        task:
                            "Explain one technical project end-to-end using problem, architecture, decisions, and impact.",
                        reason:
                            "Structured explanations improve technical communication and interview confidence.",
                        duration: "30 min",
                    },
                ],
            },
        ],

        totalTime: firstRevision
            ? "1 hour 55 min"
            : "1 hour 35 min",

        focusMessage: firstRevision
            ? `Complete the due revision for ${firstRevision.title}, then strengthen ${focusPattern}.`
            : `Build practical coverage in ${focusPattern} today.`,
    };
};

const parseDailyPlanSafely = (
    text: string,
    fallback: DailyPlanAIResponse
): DailyPlanAIResponse => {
    try {
        const cleaned = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const parsed = JSON.parse(cleaned);

        const rawCategories = Array.isArray(
            parsed.categories
        )
            ? parsed.categories
            : [];

        const categoryNames: DailyPlanCategory["name"][] =
            ["DSA", "Resume", "Interview"];

        const categories =
            categoryNames.map((categoryName) => {
                const rawCategory = rawCategories.find(
                    (category: any) =>
                        String(category?.name || "")
                            .trim()
                            .toLowerCase() ===
                        categoryName.toLowerCase()
                );

                const parsedItems = Array.isArray(
                    rawCategory?.items
                )
                    ? rawCategory.items
                        .map((item: any) => ({
                            task: String(
                                item?.task || ""
                            ).trim(),
                            reason: String(
                                item?.reason || ""
                            ).trim(),
                            duration: String(
                                item?.duration || ""
                            ).trim(),
                        }))
                        .filter(
                            (item: DailyPlanItem) =>
                                item.task.length > 0
                        )
                        .slice(0, 3)
                    : [];

                const fallbackCategory =
                    fallback.categories.find(
                        (category) =>
                            category.name === categoryName
                    );

                return {
                    name: categoryName,
                    icon:
                        CATEGORY_CONFIG[categoryName].icon,
                    color:
                        CATEGORY_CONFIG[categoryName].color,
                    items:
                        parsedItems.length > 0
                            ? parsedItems
                            : fallbackCategory?.items ?? [],
                };
            });

        return {
            greeting:
                String(
                    parsed.greeting || fallback.greeting
                ).trim(),

            categories,

            totalTime:
                String(
                    parsed.totalTime ||
                    fallback.totalTime
                ).trim(),

            focusMessage:
                String(
                    parsed.focusMessage ||
                    fallback.focusMessage
                ).trim(),
        };
    } catch {
        return fallback;
    }
};

const findRecurringInterviewConcepts = (
    interviews: Array<{
        conceptsMissed: string[];
    }>
) => {
    const frequency: Record<string, number> = {};

    interviews
        .flatMap(
            (interview) =>
                interview.conceptsMissed || []
        )
        .forEach((concept) => {
            const normalizedConcept = concept.trim();

            if (!normalizedConcept) return;

            frequency[normalizedConcept] =
                (frequency[normalizedConcept] || 0) + 1;
        });

    return Object.entries(frequency)
        .sort(
            (first, second) =>
                second[1] - first[1]
        )
        .map(([concept]) => concept)
        .slice(0, 5);
};

export const generateDailyPlan = async (
    userId: string
): Promise<DailyPlanAIResponse> => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error(
            "GROQ_API_KEY is missing"
        );
    }

    const model =
        process.env.GROQ_MODEL ||
        "llama-3.3-70b-versatile";

    const [
        dsaAnalytics,
        recentDsaProblems,
        latestResume,
        recentInterviews,
        readiness,
        profile,
    ] = await Promise.all([
        getDSAAnalytics(userId),

        prisma.dSAProblem.findMany({
            where: {
                userId,
            },
            orderBy: {
                updatedAt: "desc",
            },
            take: 10,
            select: {
                id: true,
                title: true,
                topic: true,
                pattern: true,
                difficulty: true,
                status: true,
                revisionCount: true,
                nextRevisionAt: true,
                updatedAt: true,
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

    const fallback =
        buildFallbackDailyPlan(dsaAnalytics);

    const dsaSummary = {
        dsaScore: dsaAnalytics.dsaScore,

        scoreBreakdown:
            dsaAnalytics.scoreBreakdown,

        totals: dsaAnalytics.summary,

        weakTopics:
            dsaAnalytics.weakTopics
                .slice(0, 5)
                .map((topic) => ({
                    topic: topic.topic,
                    solved: topic.solved,
                    total: topic.total,
                    percentage: topic.percentage,
                })),

        weakPatterns:
            dsaAnalytics.weakPatterns
                .slice(0, 5)
                .map((pattern) => ({
                    pattern: pattern.pattern,
                    solved: pattern.solved,
                    total: pattern.total,
                    percentage: pattern.percentage,
                    status: pattern.status,
                })),

        patternGaps:
            dsaAnalytics.patternGaps.slice(0, 6),

        revisionQueue:
            dsaAnalytics.revisionQueue
                .slice(0, 5)
                .map((problem) => ({
                    id: problem.id,
                    title: problem.title,
                    topic: problem.topic,
                    pattern: problem.pattern,
                    difficulty: problem.difficulty,
                    nextRevisionAt:
                        problem.nextRevisionAt,
                    overdueDays: problem.overdueDays,
                    revisionCount:
                        problem.revisionCount,
                })),

        revisionConsistency:
            dsaAnalytics.revisionConsistency,

        dailyTarget:
            dsaAnalytics.dailyTarget,

        recentProblems:
            recentDsaProblems.map((problem) => ({
                title: problem.title,
                topic: problem.topic,
                pattern: problem.pattern,
                difficulty: problem.difficulty,
                status: problem.status,
                revisionCount:
                    problem.revisionCount,
                nextRevisionAt:
                    problem.nextRevisionAt,
            })),
    };

    const resumeAnalysis =
        latestResume?.aiAnalysis as any;

    const resumeSummary = {
        hasResume: Boolean(latestResume),
        atsScore:
            latestResume?.atsScore ?? 0,
        roleFitScore:
            latestResume?.roleFitScore ?? 0,
        keywordScore:
            latestResume?.keywordScore ?? 0,
        projectScore:
            latestResume?.projectScore ?? 0,

        targetRole:
            latestResume?.targetRole ?? null,

        actionPlan: asStringArray(
            resumeAnalysis?.actionPlan
        ),

        missingKeywords:
            resumeAnalysis?.missingKeywords ?? {},
    };

    const interviewSummary = {
        total: recentInterviews.length,

        averageScore:
            recentInterviews.length > 0
                ? Math.round(
                    recentInterviews.reduce(
                        (sum, interview) =>
                            sum +
                            (interview.overallScore ?? 0),
                        0
                    ) / recentInterviews.length
                )
                : 0,

        recurringMissedConcepts:
            findRecurringInterviewConcepts(
                recentInterviews
            ),

        nextActions:
            recentInterviews
                .flatMap(
                    (interview) =>
                        interview.nextActions || []
                )
                .slice(0, 8),
    };

    const prompt = {
        task:
            "Generate a focused daily placement preparation plan for an engineering student.",

        studentContext: {
            targetCompanies:
                profile?.targetCompanies ?? [],

            skills:
                profile?.skills ?? [],

            targetRole:
                latestResume?.targetRole ||
                "SDE Intern, Full Stack Developer, Backend Developer",
        },

        readiness: {
            overallScore:
                readiness?.overallScore ?? 0,

            dsaScore:
                dsaAnalytics.dsaScore,

            resumeScore:
                readiness?.resumeScore ?? 0,

            interviewScore:
                readiness?.interviewScore ?? 0,
        },

        dsaSummary,
        resumeSummary,
        interviewSummary,

        outputRequirements: [
            "Return only valid JSON. Do not use markdown and do not add text outside JSON.",

            "Create exactly 3 categories named DSA, Resume, and Interview.",

            "Each category must contain 2 to 3 specific tasks.",

            "Every task must contain task, reason, and duration.",

            "All tasks must be realistically completable today.",

            "Keep total preparation time between 1 and 3 hours.",

            "Use the supplied data only. Do not invent scores, companies, resume facts, interview weaknesses, or DSA problem names.",

            "DSA tasks must be based on revisionQueue, weakPatterns, weakTopics, patternGaps, dailyTarget, or recentProblems.",

            "When revisionQueue is not empty, include at least one revision task using the exact supplied problem title.",

            "When an overdue revision exists, prioritize it before suggesting new problems.",

            "When weakPatterns is not empty, include a task for the weakest pattern.",

            "When weakPatterns is empty, use the first pattern from patternGaps or dailyTarget.focusPatterns.",

            "Do not claim that a topic is mastered merely because its percentage is high when only a small number of problems are tracked.",

            "Use an exact problem title for a revision task only when that problem exists in revisionQueue.",
            "Do not recommend revising a recent problem before its scheduled revision date.",
            "RecentProblems may be used only to understand recent activity, not to create revision tasks.",
            "Do not claim that a problem is due, overdue, or needs revision unless revisionQueue explicitly contains it.",
            "When revisionQueue is empty, DSA tasks should focus on weakPatterns, patternGaps, complexity analysis, or new problem-solving practice.",
            "DSA category may contain only data structures, algorithms, SQL, coding practice, complexity analysis, or problem revision.",

            "Do not place OOP theory, Java theory, resume work, communication, or mock-interview tasks in the DSA category.",

            "Resume category must contain only ATS, keywords, bullet rewriting, project descriptions, formatting, and recruiter clarity tasks.",

            "Interview category should contain communication, mock interviews, OOP explanation, Java concepts, project explanation, and spoken technical practice.",

            "Use actual resume action items, missing keywords, interview missed concepts, and interview next actions when available.",

            "Reasons must explicitly connect each task to the supplied student data.",

            "Avoid generic advice such as work hard, practice more, stay motivated, or improve skills.",
        ],

        requiredJsonShape: {
            greeting:
                "One motivational sentence based on current readiness and the weakest actionable area.",

            categories: [
                {
                    name: "DSA",
                    icon: "code",
                    color: "brand",
                    items: [
                        {
                            task:
                                "Specific DSA problem-solving or revision task.",
                            reason:
                                "Reason tied to DSA analytics.",
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
                            task:
                                "Specific resume improvement task.",
                            reason:
                                "Reason tied to resume analysis.",
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
                            task:
                                "Specific interview practice task.",
                            reason:
                                "Reason tied to interview data.",
                            duration: "30 min",
                        },
                    ],
                },
            ],

            totalTime:
                "Total time estimate.",

            focusMessage:
                "One sentence describing today's single most important focus.",
        },
    };

    try {
        const response =
            await groq.chat.completions.create({
                model,

                messages: [
                    {
                        role: "system",
                        content:
                            "You are PlacementOS Daily Coach. Generate concise, specific, evidence-based placement preparation plans. Output only valid JSON.",
                    },
                    {
                        role: "user",
                        content: JSON.stringify(
                            prompt,
                            null,
                            2
                        ),
                    },
                ],

                temperature: 0.25,

                response_format: {
                    type: "json_object",
                },
            });

        const text =
            response.choices[0]?.message
                ?.content || "{}";

        return parseDailyPlanSafely(
            text,
            fallback
        );
    } catch (error) {
        console.error(
            "Daily Plan Groq generation failed:",
            error
        );

        return fallback;
    }
};

