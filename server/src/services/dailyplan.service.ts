
import Groq from "groq-sdk";
import { prisma } from "../prisma/client";
import { getDSAAnalytics } from "./dsaAnalytics.service";
import {
    calculateDailyPlanTotalTime,
    parsePlanDurationToMinutes,
} from "../utils/dailyPlanTime";

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

interface ResumePlanSummary {
    hasResume: boolean;
    atsScore: number;
    roleFitScore: number;
    keywordScore: number;
    projectScore: number;
    targetRole: string | null;
    actionPlan: string[];
    missingKeywords: unknown;
    criticalIssues: string[];
}

interface InterviewPlanSummary {
    total: number;
    averageScore: number;
    recurringMissedConcepts: string[];
    nextActions: string[];
}

interface DailyPlanEvidenceSignals {
    weakestArea: "DSA" | "Resume" | "Interview";
    readinessBand: "baseline" | "at-risk" | "building" | "competitive";
    hasOverdueRevision: boolean;
    dueRevisionCount: number;
    primaryDsaFocus: string;
    primaryResumeFocus: string;
    primaryInterviewFocus: string;
    evidenceGaps: string[];
}

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

const CATEGORY_NAMES: DailyPlanCategory["name"][] =
    ["DSA", "Resume", "Interview"];

const DEFAULT_DURATION_BY_CATEGORY: Record<
    DailyPlanCategory["name"],
    string
> = {
    DSA: "35 min",
    Resume: "20 min",
    Interview: "30 min",
};

const clampText = (
    value: unknown,
    fallback: string,
    maxLength = 220
) => {
    const text = String(value || "")
        .replace(/\s+/g, " ")
        .trim();

    if (!text) return fallback;

    return text.length > maxLength
        ? `${text.slice(0, maxLength - 1).trim()}.`
        : text;
};

const normalizeDuration = (
    duration: unknown,
    categoryName: DailyPlanCategory["name"]
) => {
    const text = String(duration || "").trim();
    const minutes = parsePlanDurationToMinutes(text);

    if (minutes >= 10 && minutes <= 90) {
        return text;
    }

    return DEFAULT_DURATION_BY_CATEGORY[categoryName];
};

const dedupePlanItems = (
    items: DailyPlanItem[]
) => {
    const seen = new Set<string>();

    return items.filter((item) => {
        const key = item.task
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .trim();

        if (!key || seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
};

const normalizeDailyPlan = (
    plan: DailyPlanAIResponse,
    fallback: DailyPlanAIResponse
): DailyPlanAIResponse => {
    const categories = CATEGORY_NAMES.map((categoryName) => {
        const category =
            plan.categories.find(
                (item) => item.name === categoryName
            ) ||
            fallback.categories.find(
                (item) => item.name === categoryName
            );

        const fallbackCategory =
            fallback.categories.find(
                (item) => item.name === categoryName
            );

        const parsedItems = dedupePlanItems(
            (category?.items || [])
                .map((item) => ({
                    task: clampText(
                        item.task,
                        "",
                        140
                    ),
                    reason: clampText(
                        item.reason,
                        "This task is tied to today's preparation data.",
                        220
                    ),
                    duration: normalizeDuration(
                        item.duration,
                        categoryName
                    ),
                }))
                .filter((item) => item.task.length > 0)
        ).slice(0, 3);
        const completedItems =
            parsedItems.length >= 2
                ? parsedItems
                : dedupePlanItems([
                    ...parsedItems,
                    ...(fallbackCategory?.items ?? []),
                ]).slice(0, 3);

        return {
            name: categoryName,
            icon: CATEGORY_CONFIG[categoryName].icon,
            color: CATEGORY_CONFIG[categoryName].color,
            items:
                completedItems.length > 0
                    ? completedItems
                    : fallbackCategory?.items ?? [],
        };
    });

    return {
        greeting: clampText(
            plan.greeting,
            fallback.greeting,
            180
        ),
        categories,
        totalTime:
            calculateDailyPlanTotalTime(
                categories
            ),
        focusMessage: clampText(
            plan.focusMessage,
            fallback.focusMessage,
            180
        ),
    };
};

const extractJsonObject = (text: string) => {
    const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (
        firstBrace === -1 ||
        lastBrace === -1 ||
        firstBrace >= lastBrace
    ) {
        return cleaned;
    }

    return cleaned.slice(
        firstBrace,
        lastBrace + 1
    );
};

const getReadinessBand = (
    overallScore: number
): DailyPlanEvidenceSignals["readinessBand"] => {
    if (overallScore <= 0) return "baseline";
    if (overallScore < 45) return "at-risk";
    if (overallScore < 75) return "building";
    return "competitive";
};

const getLowestScoredArea = (scores: {
    dsaScore: number;
    resumeScore: number;
    interviewScore: number;
}): DailyPlanEvidenceSignals["weakestArea"] => {
    const entries: Array<[
        DailyPlanEvidenceSignals["weakestArea"],
        number
    ]> = [
            ["DSA", scores.dsaScore],
            ["Resume", scores.resumeScore],
            ["Interview", scores.interviewScore],
        ];

    return entries.sort(
        (first, second) => first[1] - second[1]
    )[0][0];
};

const buildPlanEvidenceSignals = (input: {
    dsaAnalytics: DSAAnalyticsResult;
    resumeSummary: ResumePlanSummary;
    interviewSummary: InterviewPlanSummary;
    overallScore: number;
    resumeScore: number;
    interviewScore: number;
}): DailyPlanEvidenceSignals => {
    const firstRevision =
        input.dsaAnalytics.revisionQueue?.[0];
    const primaryDsaFocus =
        firstRevision?.title ||
        input.dsaAnalytics.weakPatterns?.[0]?.pattern ||
        input.dsaAnalytics.patternGaps?.[0] ||
        input.dsaAnalytics.dailyTarget?.focusPatterns?.[0] ||
        "core DSA patterns";
    const primaryResumeFocus =
        input.resumeSummary.actionPlan[0] ||
        input.resumeSummary.criticalIssues[0] ||
        "resume keywords and project bullets";
    const primaryInterviewFocus =
        input.interviewSummary.recurringMissedConcepts[0] ||
        input.interviewSummary.nextActions[0] ||
        "project explanation and structured answers";
    const evidenceGaps = [
        input.dsaAnalytics.summary.total === 0
            ? "No DSA problems tracked yet"
            : "",
        !input.resumeSummary.hasResume
            ? "No resume analysis available"
            : "",
        input.interviewSummary.total === 0
            ? "No interview replay available"
            : "",
    ].filter(Boolean);

    return {
        weakestArea: getLowestScoredArea({
            dsaScore: input.dsaAnalytics.dsaScore,
            resumeScore: input.resumeScore,
            interviewScore: input.interviewScore,
        }),
        readinessBand:
            getReadinessBand(input.overallScore),
        hasOverdueRevision:
            Boolean(firstRevision?.overdueDays),
        dueRevisionCount:
            input.dsaAnalytics.revisionQueue.length,
        primaryDsaFocus,
        primaryResumeFocus,
        primaryInterviewFocus,
        evidenceGaps,
    };
};
const buildStarterDailyPlan =
    (): DailyPlanAIResponse => {
        return {
            greeting:
                "Welcome to PlacementOS. Build your preparation baseline so future plans can use your real progress data.",

            categories: [
                {
                    name: "DSA",
                    icon: "code",
                    color: "brand",
                    items: [
                        {
                            task:
                                "Add or import your first DSA problem.",
                            reason:
                                "PlacementOS needs your own problem history before it can identify weak topics, patterns, and revision priorities.",
                            duration: "15 min",
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
                                "Upload your current resume for analysis.",
                            reason:
                                "Your first resume analysis establishes an ATS, keyword, project, and role-fit baseline.",
                            duration: "15 min",
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
                                "Log one mock or past interview experience.",
                            reason:
                                "An interview replay gives PlacementOS evidence about communication, confidence, technical performance, and missed concepts.",
                            duration: "20 min",
                        },
                    ],
                },
            ],

            totalTime: "50 min",

            focusMessage:
                "Create your preparation baseline today; personalised AI recommendations will begin after you add real activity.",
        };
    };
interface FallbackPlanContext {
    dsaAnalytics: DSAAnalyticsResult;
    resumeSummary: ResumePlanSummary;
    interviewSummary: InterviewPlanSummary;
    evidenceSignals: DailyPlanEvidenceSignals;
}

const buildFallbackDailyPlan = ({
    dsaAnalytics,
    resumeSummary,
    interviewSummary,
    evidenceSignals,
}: FallbackPlanContext): DailyPlanAIResponse => {
    const dsaItems: DailyPlanItem[] = [];
    const resumeItems: DailyPlanItem[] = [];
    const interviewItems: DailyPlanItem[] = [];

    const firstRevision =
        dsaAnalytics.revisionQueue?.[0];

    const focusPattern =
        dsaAnalytics.dailyTarget?.focusPatterns?.[0] ||
        dsaAnalytics.patternGaps?.[0] ||
        "Arrays";

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
        task:
            dsaAnalytics.dsaScore < 35
                ? `Solve 2 beginner-friendly problems using ${focusPattern}`
                : `Solve 2 timed problems using ${focusPattern}`,
        reason:
            dsaAnalytics.weakPatterns.length > 0
                ? `${focusPattern} is currently weak in your tracked pattern coverage.`
                : `${focusPattern} is missing or underrepresented in your pattern coverage.`,
        duration: "45 min",
    });

    dsaItems.push({
        task:
            "Write one 5-line post-solve note with approach, complexity, mistake, and revision trigger",
        reason:
            "Short solve notes make future revision and pattern recall faster.",
        duration: "10 min",
    });

    if (resumeSummary.hasResume) {
        resumeItems.push({
            task:
                resumeSummary.actionPlan[0] ||
                "Rewrite one weak project bullet with action, tech stack, and measurable impact",
            reason:
                resumeSummary.actionPlan[0]
                    ? "This is the top action from Resume Intelligence."
                    : "Project bullets directly affect recruiter clarity and shortlist confidence.",
            duration: "20 min",
        });

        if (resumeSummary.keywordScore < 70) {
            resumeItems.push({
                task:
                    "Add 3 truthful target-role keywords to skills or project bullets",
                reason:
                    `Your keyword score is ${resumeSummary.keywordScore}/100, so ATS matching needs targeted improvement.`,
                duration: "15 min",
            });
        } else {
            resumeItems.push({
                task:
                    "Polish the top resume project for clarity, scope, and outcome",
                reason:
                    "A strong project section helps convert ATS visibility into recruiter interest.",
                duration: "15 min",
            });
        }
    } else {
        resumeItems.push({
            task:
                "Upload your current resume for analysis.",
            reason:
                "No resume analysis exists yet, so PlacementOS cannot identify ATS or role-fit gaps.",
            duration: "15 min",
        });
        resumeItems.push({
            task:
                "Prepare a clean one-page PDF with education, skills, projects, and links",
            reason:
                "A structured resume gives the analyzer enough evidence for useful feedback.",
            duration: "20 min",
        });
    }

    if (interviewSummary.total > 0) {
        const missedConcept =
            interviewSummary.recurringMissedConcepts[0];
        const nextAction =
            interviewSummary.nextActions[0];

        interviewItems.push({
            task:
                nextAction ||
                `Explain ${missedConcept || "one weak technical concept"} out loud for 90 seconds`,
            reason:
                nextAction
                    ? "This action comes from your latest interview analysis."
                    : missedConcept
                        ? `${missedConcept} appears in your recurring missed concepts.`
                        : "Spoken practice improves interview structure and confidence.",
            duration: "25 min",
        });
        interviewItems.push({
            task:
                "Record one project explanation using problem, architecture, tradeoff, and impact",
            reason:
                "Project explanation is a high-frequency interview signal for software roles.",
            duration: "25 min",
        });
    } else {
        interviewItems.push({
            task:
                "Log one mock or past interview experience.",
            reason:
                "No interview replay exists yet, so PlacementOS cannot identify communication or technical weaknesses.",
            duration: "20 min",
        });
        interviewItems.push({
            task:
                "Practice a 2-minute self-introduction and one project explanation",
            reason:
                "These are baseline answers needed before deeper interview coaching can be personalized.",
            duration: "20 min",
        });
    }

    const plan: DailyPlanAIResponse = {
        greeting:
            dsaAnalytics.dsaScore < 40
                ? `Your DSA readiness is ${dsaAnalytics.dsaScore}/100, so today should focus on pattern breadth and consistent revision.`
                : `Today's weakest area is ${evidenceSignals.weakestArea}; keep the plan focused and measurable.`,

        categories: [
            {
                name: "DSA",
                icon: "code",
                color: "brand",
                items: dsaItems.slice(
                    0,
                    3
                ),
            },
            {
                name: "Resume",
                icon: "file",
                color: "success",
                items: resumeItems.slice(
                    0,
                    3
                ),
            },
            {
                name: "Interview",
                icon: "mic",
                color: "warning",
                items: interviewItems.slice(
                    0,
                    3
                ),
            },
        ],

        totalTime: "0 min",

        focusMessage: firstRevision
            ? `Complete the due revision for ${firstRevision.title}, then strengthen ${focusPattern}.`
            : `Today's main focus is ${evidenceSignals.primaryDsaFocus} plus one concrete ${evidenceSignals.weakestArea} improvement.`,
    };

    return normalizeDailyPlan(
        plan,
        plan
    );
};

const parseDailyPlanSafely = (
    text: string,
    fallback: DailyPlanAIResponse
): DailyPlanAIResponse => {
    try {
        const cleaned = extractJsonObject(text);

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

        return normalizeDailyPlan({
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
        }, fallback);
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

    const hasDsaEvidence =
        recentDsaProblems.length > 0;

    const hasResumeEvidence =
        Boolean(latestResume);

    const hasInterviewEvidence =
        recentInterviews.length > 0;

    const hasPreparationEvidence =
        hasDsaEvidence ||
        hasResumeEvidence ||
        hasInterviewEvidence;

    /*
     * A completely new account has no evidence from which
     * weak patterns, resume gaps, or interview weaknesses
     * can be inferred.
     */
    if (!hasPreparationEvidence) {
        return buildStarterDailyPlan();
    }

    const resumeAnalysis =
        latestResume?.aiAnalysis as any;

    const resumeSummary: ResumePlanSummary = {
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
        ).slice(0, 5),

        missingKeywords:
            resumeAnalysis?.missingKeywords ?? {},

        criticalIssues: asStringArray(
            resumeAnalysis?.criticalIssues
        ).slice(0, 5),
    };

    const interviewSummary: InterviewPlanSummary = {
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

    const evidenceSignals =
        buildPlanEvidenceSignals({
            dsaAnalytics,
            resumeSummary,
            interviewSummary,
            overallScore:
                readiness?.overallScore ?? 0,
            resumeScore:
                readiness?.resumeScore ??
                resumeSummary.atsScore,
            interviewScore:
                readiness?.interviewScore ??
                interviewSummary.averageScore,
        });

    const fallback =
        buildFallbackDailyPlan({
            dsaAnalytics,
            resumeSummary,
            interviewSummary,
            evidenceSignals,
        });

    /*
     * Return a data-aware fallback if Groq is unavailable.
     */
    if (!process.env.GROQ_API_KEY) {
        return fallback;
    }

    const model =
        process.env.GROQ_MODEL ||
        "llama-3.3-70b-versatile";

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

        evidenceSignals,
        dsaSummary,
        resumeSummary,
        interviewSummary,

        planningRules: [
            "Prioritize today's weakest area, but still include useful tasks in all three categories.",
            "If hasOverdueRevision is true, the first DSA task must be that overdue revision using the exact title from revisionQueue.",
            "If readinessBand is baseline, prioritize creating missing evidence: DSA logs, resume upload, or interview replay.",
            "If readinessBand is at-risk, keep tasks smaller and more foundational.",
            "If readinessBand is building, include timed practice and one polish task.",
            "If readinessBand is competitive, focus on hardening weak edges, revision, and mock interview performance.",
            "Use primaryDsaFocus, primaryResumeFocus, and primaryInterviewFocus when they are supported by source data.",
            "Do not give equal attention to every area if one area is clearly weaker.",
            "Prefer tasks that create a concrete artifact: solved problem note, rewritten bullet, recorded answer, flashcards, or mock replay.",
            "Avoid motivational filler. Every task should change something measurable today.",
        ],

        outputRequirements: [
            "Return only valid JSON. Do not use markdown and do not add text outside JSON.",

            "Create exactly 3 categories named DSA, Resume, and Interview.",

            "Each category must contain 2 to 3 specific tasks.",

            "Every task must contain task, reason, and duration.",

            "Duration must be between 10 and 90 minutes per task, written like '20 min' or '1 hour'.",

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

            "Reasons must mention the relevant score, weak pattern, due revision, missing keyword, resume issue, missed concept, or evidence gap when available.",

            "Do not duplicate the same task across categories.",

            "Do not create broad tasks like 'practice DSA' or 'improve resume'. Make every task specific enough to do immediately.",

            "TotalTime will be recalculated server-side, but the item durations still need to be realistic.",

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

