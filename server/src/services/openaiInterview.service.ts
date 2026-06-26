import Groq from "groq-sdk";
import fs from "fs";
import os from "os";
import path from "path";
import {
    executeGroqRequestWithRetry,
    runGroqTranscriptionTask,
} from "./groqResilience.service";
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

    confidenceScore: number;
    communicationScore: number;
    technicalScore: number;

    rootCauses: string[];
    questionBreakdown: {
        question: string;
        candidateAnswer: string;
        expectedAnswerChecklist: string[];
        missedPoints: string[];
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

const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) return fallback;

    return Math.max(min, Math.min(max, numericValue));
};

const fallbackAnalysis = (): InterviewAIAnalysis => ({
    summary:
        "AI analysis could not be generated. Review the interview manually and update weak areas.",
    executiveDiagnosis:
        "Not enough analysis available. Add more interview notes or try again.",
    strengths: [],
    weaknesses: [],
    missedConcepts: [],
    repeatedRiskTopics: [],

    confidenceScore: 5,
    communicationScore: 5,
    technicalScore: 5,

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
    if (!value) return [];

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

const parseQuestionBreakdown = (value: unknown) => {
    if (!Array.isArray(value)) return [];

    return value.map((item: any) => ({
        question: String(item?.question || ""),
        candidateAnswer: String(item?.candidateAnswer || ""),
        expectedAnswerChecklist: asStringArray(item?.expectedAnswerChecklist),
        missedPoints: asStringArray(item?.missedPoints),
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

            confidenceScore: clampNumber(parsed.confidenceScore, 0, 10, 5),
            communicationScore: clampNumber(parsed.communicationScore, 0, 10, 5),
            technicalScore: clampNumber(parsed.technicalScore, 0, 10, 5),

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
            estimatedReadinessScore: clampNumber(
                parsed.estimatedReadinessScore,
                0,
                100,
                50
            ),
        };
    } catch {
        return fallbackAnalysis();
    }
};
export const transcribeInterviewAudio = async (
    audioBuffer: Buffer,
    filename: string
): Promise<string> => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is missing");
    }

    const safeFilename = filename.replace(/[^\w.-]/g, "_");
    const tempPath = path.join(os.tmpdir(), `${Date.now()}-${safeFilename}`);

    fs.writeFileSync(tempPath, audioBuffer);

    try {
        const transcription =
            await runGroqTranscriptionTask(
                "interview-audio-transcription",
                () =>
                    groq.audio.transcriptions.create({
                        /*
                         * A fresh stream is created on every retry.
                         * Reusing the previous stream would upload
                         * an already-consumed or closed stream.
                         */
                        file:
                            fs.createReadStream(
                                tempPath
                            ),

                        model:
                            "whisper-large-v3",
                    })
            );

        return (
            transcription.text ||
            ""
        );
    } finally {
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
    }
};
export const analyzeInterviewReplay = async (input: {
    company: string;
    role: string;
    roundType: string;
    result: string;

    transcript?: string | null;

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
    questionReplays?: {
        question: string;
        userAnswer?: string | null;
        missedPoints: string[];
        interviewerFeedback?: string | null;
        confidenceScore?: number | null;
        status: string;
    }[];
}) => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is missing");
    }

    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const prompt = {
        task: "Do not merely summarize this interview. Act like a placement coach and generate a diagnostic improvement plan.",
        importantInstruction:
            "Avoid repeating the input unless needed. Convert the interview log into deeper coaching: root causes, question-wise expected answer checklist, candidate's actual answer from transcript, missed points, likely gaps, practice tasks, numeric scores, and a 3-day improvement plan. Do not use personal names from the transcript.",
        interview: input,
        analysisMode: {
            studentContext:
                "Indian engineering student preparing for campus placements.",
            goal:
                "Help the student improve before the next interview, not just remember what happened.",
            limitation:
                "If actual answer transcript is missing, infer likely gaps from whatWentWrong, missed concepts, questions, topics, scores, question status, user answer, and interviewer feedback. Clearly avoid pretending to know exact answers.",
            privacyRule:
                "Do not use any personal name found in the transcript. Refer to the person only as the candidate or the student.",
        },
        scoringRules: {
            confidenceScore:
                "0-10. 0-3 nervous/no clarity, 4-5 hesitant, 6-7 acceptable confidence, 8-10 strong confident delivery.",
            communicationScore:
                "0-10. 0-3 unclear or broken explanation, 4-5 partially understandable but unstructured, 6-7 understandable with some structure, 8-10 crisp structured answers.",
            technicalScore:
                "0-10. 0-3 mostly wrong or no depth, 4-5 basic but shallow/partly wrong, 6-7 correct basics with examples, 8-10 deep correct answers with edge cases/tradeoffs.",
            estimatedReadinessScore:
                "0-100. Below 50 if selection is unlikely, 50-65 if borderline, 65-80 if decent, 80+ if strong interview-ready.",
        },
        outputRequirements: [
            "Return only valid JSON. No markdown. No text outside JSON.",
            "Return confidenceScore, communicationScore, and technicalScore as numbers from 0 to 10.",
            "If the student provided manual scores, use them as evidence but still adjust based on question-level replay.",
            "If communication evidence is limited, infer communication score from clarity of answers, interviewer feedback, and structured explanation quality.",
            "Do not just restate the user's feedback.",
            "Every next action must be concrete and doable in 1-3 days.",
            "Question breakdown must give expected answer checklist and practice task.",
            "If a question is generic, still provide what a good interview answer should include.",
            "If technical score is low, create a technical recovery plan.",
            "If confidence is low or average, include speaking drills.",
            "If communication is average, include structured answer framework.",
            "Make advice specific to the role and company where possible.",
            "Do not use the candidate's personal name in analysis even if it appears in the transcript.",
            "Refer to the person only as 'the candidate' or 'the student'.",
            "Do not assume the transcript speaker is the logged-in user.",
            "Extract the candidate's actual answer for each question from transcript when available.",
            "Each questionBreakdown item must include candidateAnswer and missedPoints.",
            "candidateAnswer must be a short direct excerpt or concise paraphrase of what the candidate actually said for that question, not a model answer.",
            "Score strictly. Do not give safe middle scores like 6 or 7 unless evidence clearly supports it.",
            "Technical score should be below 5 if answers contain factual mistakes, confused definitions, or no working examples.",
            "Communication score should be below 6 if answers are unstructured, unclear, grammatically broken, or hard to follow.",
            "Estimated readiness should be below 60 if the candidate cannot explain concepts with examples and tradeoffs.",
            "Use the full scoring range from 0 to 10. Avoid defaulting to 5, 6, or 7.",
        ],
        requiredJsonShape: {
            summary:
                "2 sentence summary, not copied from input. Do not use personal names; say the candidate or student.",
            executiveDiagnosis:
                "main diagnosis in one strong paragraph: what is blocking selection and what to fix first. Do not use personal names; say the candidate or student.",
            strengths: ["specific strength 1", "specific strength 2"],
            weaknesses: ["specific weakness 1", "specific weakness 2"],
            missedConcepts: ["concept 1", "concept 2"],
            repeatedRiskTopics: ["topic 1", "topic 2"],

            confidenceScore: "number from 0 to 10",
            communicationScore: "number from 0 to 10",
            technicalScore: "number from 0 to 10",

            rootCauses: [
                "why the student struggled, not just what they struggled with",
            ],
            questionBreakdown: [
                {
                    question: "question asked",
                    candidateAnswer:
                        "candidate's actual answer from transcript. If not available, return empty string",
                    expectedAnswerChecklist: [
                        "what a strong answer should include",
                        "important keyword or concept",
                        "example or edge case to mention",
                    ],
                    missedPoints: [
                        "specific thing candidate missed",
                        "wrong or unclear concept",
                    ],
                    likelyGap:
                        "what the candidate likely missed based on transcript, notes, and scores",
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
            mockDrills: ["speaking drill 1", "technical explanation drill 2"],
            companyReadinessNote: "readiness note for company and role",
            estimatedReadinessScore: "number from 0 to 100",
        },
    };

    const response =
        await executeGroqRequestWithRetry(
            () =>
                groq.chat.completions.create({
                    model,

                    messages: [
                        {
                            role:
                                "system",

                            content:
                                "You are PlacementOS Interview Coach. Diagnose why a candidate may fail or pass a placement interview and generate specific actions. Do not use personal names from the transcript. Refer to the person as the candidate or the student. Extract the candidate's actual answer for each question when transcript evidence is available. Output only valid JSON.",
                        },
                        {
                            role:
                                "user",

                            content:
                                JSON.stringify(
                                    prompt,
                                    null,
                                    2
                                ),
                        },
                    ],

                    temperature:
                        0.35,

                    response_format: {
                        type:
                            "json_object",
                    },
                }),
            {
                operationName:
                    "interview-replay-analysis",
            }
        );
    const text = response.choices[0]?.message?.content || "{}";

    return parseJsonSafely(text);
};