import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export interface InterviewAIAnalysis {
    summary: string;
    executiveDiagnosis: string;
    strengths: string[];
    weaknesses: string[];
    missedConcepts: string[];
    repeatedRiskTopics: string[];

    rootCauses: string[];

    questionBreakdown: {
        question: string;
        expectedAnswerChecklist: string[];
        likelyGap: string;
        practiceTask: string;
    }[];

    confidenceDiagnosis: string;
    communicationDiagnosis: string;
    technicalDiagnosis: string;

    answerFramework: string[];
    nextActions: string[];
    revisionPlan: string[];

    mockDrills: string[];
    companyReadinessNote: string;
    estimatedReadinessScore: number;
}

const fallbackAnalysis = (): InterviewAIAnalysis => ({
    summary:
        "AI analysis could not be generated. Review the interview manually and update weak areas.",
    executiveDiagnosis:
        "Not enough analysis available. Add more interview notes or try again.",
    strengths: [],
    weaknesses: [],
    missedConcepts: [],
    repeatedRiskTopics: [],
    rootCauses: [],
    questionBreakdown: [],
    confidenceDiagnosis: "Not enough AI output available.",
    communicationDiagnosis: "Not enough AI output available.",
    technicalDiagnosis: "Not enough AI output available.",
    answerFramework: [],
    nextActions: [
        "Review the interview replay manually",
        "Revise missed concepts",
        "Practice explaining answers out loud",
    ],
    revisionPlan: [
        "Day 1: Revise weak topics",
        "Day 2: Practice related interview questions",
        "Day 3: Do one mock explanation session",
    ],
    mockDrills: [],
    companyReadinessNote:
        "Readiness could not be estimated accurately from AI output.",
    estimatedReadinessScore: 50,
});

const asStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => String(item).trim())
        .filter(Boolean);
};

const parseQuestionBreakdown = (value: unknown) => {
    if (!Array.isArray(value)) return [];

    return value.map((item: any) => ({
        question: String(item?.question || ""),
        expectedAnswerChecklist: asStringArray(item?.expectedAnswerChecklist),
        likelyGap: String(item?.likelyGap || ""),
        practiceTask: String(item?.practiceTask || ""),
    }));
};

const parseJsonSafely = (text: string): InterviewAIAnalysis => {
    try {
        const cleaned = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const parsed = JSON.parse(cleaned);

        return {
            summary: String(parsed.summary || ""),
            executiveDiagnosis: String(parsed.executiveDiagnosis || ""),
            strengths: asStringArray(parsed.strengths),
            weaknesses: asStringArray(parsed.weaknesses),
            missedConcepts: asStringArray(parsed.missedConcepts),
            repeatedRiskTopics: asStringArray(parsed.repeatedRiskTopics),
            rootCauses: asStringArray(parsed.rootCauses),
            questionBreakdown: parseQuestionBreakdown(parsed.questionBreakdown),
            confidenceDiagnosis: String(parsed.confidenceDiagnosis || ""),
            communicationDiagnosis: String(parsed.communicationDiagnosis || ""),
            technicalDiagnosis: String(parsed.technicalDiagnosis || ""),
            answerFramework: asStringArray(parsed.answerFramework),
            nextActions: asStringArray(parsed.nextActions),
            revisionPlan: asStringArray(parsed.revisionPlan),
            mockDrills: asStringArray(parsed.mockDrills),
            companyReadinessNote: String(parsed.companyReadinessNote || ""),
            estimatedReadinessScore: Math.max(
                0,
                Math.min(100, Number(parsed.estimatedReadinessScore || 50))
            ),
        };
    } catch {
        return fallbackAnalysis();
    }
};

export const analyzeInterviewReplay = async (input: {
    company: string;
    role: string;
    roundType: string;
    result: string;
    questionsAsked: string[];
    topics: string[];
    conceptsMissed: string[];
    whatWentWell?: string | null;
    whatWentWrong?: string | null;
    feedback?: string | null;
    confidenceScore?: number | null;
    communicationScore?: number | null;
    technicalScore?: number | null;
    previousWeakTopics?: string[];
}) => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is missing");
    }

    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const prompt = {
        task: "Do not merely summarize this interview. Act like a placement coach and generate a diagnostic improvement plan.",
        importantInstruction:
            "Avoid repeating the input unless needed. Convert the interview log into deeper coaching: root causes, question-wise expected answer checklist, likely gaps, practice tasks, and a 3-day improvement plan.",
        interview: input,
        analysisMode: {
            studentContext:
                "Indian engineering student preparing for campus placements.",
            goal:
                "Help the student improve before the next interview, not just remember what happened.",
            limitation:
                "If actual answer transcript is missing, infer likely gaps from whatWentWrong, missed concepts, questions, topics, and scores. Clearly avoid pretending to know exact answers.",
        },
        scoringRules: {
            confidenceScore: "0-10 self score",
            communicationScore: "0-10 self score",
            technicalScore: "0-10 self score",
            estimatedReadinessScore:
                "0-100 realistic readiness estimate for this company and role, based only on available evidence.",
        },
        outputRequirements: [
            "Return only valid JSON. No markdown. No text outside JSON.",
            "Do not just restate the user's feedback.",
            "Every next action must be concrete and doable in 1-3 days.",
            "Question breakdown must give expected answer checklist and practice task.",
            "If a question is generic, still provide what a good interview answer should include.",
            "If technical score is low, create a technical recovery plan.",
            "If confidence is low or average, include speaking drills.",
            "If communication is average, include structured answer framework.",
            "Make advice specific to the role and company where possible.",
        ],
        requiredJsonShape: {
            summary: "2 sentence summary, not copied from input",
            executiveDiagnosis:
                "main diagnosis in one strong paragraph: what is blocking selection and what to fix first",
            strengths: ["specific strength 1", "specific strength 2"],
            weaknesses: ["specific weakness 1", "specific weakness 2"],
            missedConcepts: ["concept 1", "concept 2"],
            repeatedRiskTopics: ["topic 1", "topic 2"],
            rootCauses: [
                "why the student struggled, not just what they struggled with",
            ],
            questionBreakdown: [
                {
                    question: "question asked",
                    expectedAnswerChecklist: [
                        "what a strong answer should include",
                        "important keyword or concept",
                        "example or edge case to mention",
                    ],
                    likelyGap:
                        "what the candidate likely missed based on notes and scores",
                    practiceTask:
                        "one concrete practice task for this exact question",
                },
            ],
            confidenceDiagnosis:
                "specific diagnosis based on confidence score and replay",
            communicationDiagnosis:
                "specific diagnosis based on communication score and answer structure",
            technicalDiagnosis:
                "specific diagnosis based on technical score and missed concepts",
            answerFramework: [
                "how to structure answers next time",
                "example answer pattern",
            ],
            nextActions: ["action 1", "action 2", "action 3"],
            revisionPlan: ["Day 1 plan", "Day 2 plan", "Day 3 plan"],
            mockDrills: [
                "speaking drill 1",
                "technical explanation drill 2",
            ],
            companyReadinessNote: "readiness note for company and role",
            estimatedReadinessScore: "number from 0 to 100",
        },
    };

    const response = await groq.chat.completions.create({
        model,
        messages: [
            {
                role: "system",
                content:
                    "You are PlacementOS Interview Coach. Your job is not to summarize. Your job is to diagnose why a student may fail or pass a placement interview and generate specific actions. Output only valid JSON.",
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

    return parseJsonSafely(text);
};