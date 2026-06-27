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

interface InterviewQuestionReplayInput {
    question: string;
    userAnswer?: string | null;
    missedPoints: string[];
    interviewerFeedback?: string | null;
    confidenceScore?: number | null;
    status: string;
}

interface AnalyzeInterviewInput {
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
    questionReplays?: InterviewQuestionReplayInput[];
}

interface InterviewEvidenceSignals {
    questionCount: number;
    replayCount: number;
    answeredReplayCount: number;
    failedOrPartialCount: number;
    transcriptWordCount: number;
    topicCount: number;
    missedConceptCount: number;
    previousWeakTopicCount: number;
    explicitWeaknessSignalCount: number;
    explicitStrengthSignalCount: number;
    hasInterviewerFeedback: boolean;
    hasConcreteCandidateAnswers: boolean;
    hasTranscript: boolean;
    hasManualScores: boolean;
    averageManualScore: number | null;
    averageReplayConfidenceScore: number | null;
}

type InterviewScoreKey =
    | "confidenceScore"
    | "communicationScore"
    | "technicalScore";

const INTERVIEW_SCORE_KEYS: InterviewScoreKey[] = [
    "confidenceScore",
    "communicationScore",
    "technicalScore",
];

const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) return fallback;

    return Math.max(min, Math.min(max, numericValue));
};

const average = (values: number[]) =>
    values.length === 0
        ? null
        : values.reduce((total, value) => total + value, 0) / values.length;

const clampInterviewScore = (value: number) =>
    clampNumber(value, 0, 10, 5);

const clampReadinessScore = (value: number) =>
    Math.round(clampNumber(value, 0, 100, 50));

const wordCount = (text?: string | null) =>
    (text || "").split(/\s+/).filter(Boolean).length;

const hasText = (value?: string | null) => Boolean(value?.trim());

const countNonEmpty = (values: (string | null | undefined)[]) =>
    values.filter((value) => hasText(value)).length;

const getManualScores = (input: AnalyzeInterviewInput) =>
    [
        input.confidenceScore,
        input.communicationScore,
        input.technicalScore,
    ].filter((score): score is number => typeof score === "number");

const buildInterviewEvidenceSignals = (
    input: AnalyzeInterviewInput
): InterviewEvidenceSignals => {
    const questionReplays = input.questionReplays ?? [];
    const replayConfidenceScores = questionReplays
        .map((replay) => replay.confidenceScore)
        .filter((score): score is number => typeof score === "number");
    const manualScores = getManualScores(input);
    const failedOrPartialStatuses = new Set(["FAILED", "PARTIAL", "SKIPPED"]);

    return {
        questionCount: input.questionsAsked.length,
        replayCount: questionReplays.length,
        answeredReplayCount: questionReplays.filter((replay) =>
            hasText(replay.userAnswer)
        ).length,
        failedOrPartialCount: questionReplays.filter((replay) =>
            failedOrPartialStatuses.has(String(replay.status).toUpperCase())
        ).length,
        transcriptWordCount: wordCount(input.transcript),
        topicCount: input.topics.length,
        missedConceptCount: input.conceptsMissed.length,
        previousWeakTopicCount: input.previousWeakTopics?.length ?? 0,
        explicitWeaknessSignalCount: countNonEmpty([
            input.whatWentWrong,
            input.feedback,
            ...questionReplays.map((replay) => replay.interviewerFeedback),
            ...questionReplays.flatMap((replay) => replay.missedPoints),
        ]),
        explicitStrengthSignalCount: countNonEmpty([input.whatWentWell]),
        hasInterviewerFeedback:
            hasText(input.feedback) ||
            questionReplays.some((replay) => hasText(replay.interviewerFeedback)),
        hasConcreteCandidateAnswers:
            questionReplays.some((replay) => hasText(replay.userAnswer)) ||
            wordCount(input.transcript) >= 40,
        hasTranscript: wordCount(input.transcript) >= 20,
        hasManualScores: manualScores.length > 0,
        averageManualScore: average(manualScores),
        averageReplayConfidenceScore: average(replayConfidenceScores),
    };
};

const computeHeuristicInterviewScores = (
    signals: InterviewEvidenceSignals
): Pick<
    InterviewAIAnalysis,
    | "confidenceScore"
    | "communicationScore"
    | "technicalScore"
    | "estimatedReadinessScore"
> => {
    const manualAnchor = signals.averageManualScore;
    const replayConfidenceAnchor = signals.averageReplayConfidenceScore;
    const evidenceDepth =
        (signals.hasTranscript ? 0.6 : 0) +
        (signals.hasConcreteCandidateAnswers ? 0.5 : 0) +
        Math.min(1.2, signals.answeredReplayCount * 0.25);
    const weaknessPenalty =
        Math.min(2.2, signals.failedOrPartialCount * 0.45) +
        Math.min(1.6, signals.missedConceptCount * 0.22) +
        Math.min(1, signals.previousWeakTopicCount * 0.18);

    const confidenceScore = clampInterviewScore(
        (manualAnchor ?? replayConfidenceAnchor ?? 5.4) +
            (signals.explicitStrengthSignalCount > 0 ? 0.45 : 0) -
            Math.min(1.4, signals.failedOrPartialCount * 0.25) +
            (signals.hasConcreteCandidateAnswers ? 0.25 : -0.35)
    );
    const communicationScore = clampInterviewScore(
        (manualAnchor ?? 5.2) +
            evidenceDepth -
            Math.min(2.1, signals.explicitWeaknessSignalCount * 0.16) -
            (signals.hasTranscript ? 0 : 0.35)
    );
    const technicalScore = clampInterviewScore(
        (manualAnchor ?? 5.1) +
            Math.min(0.8, signals.topicCount * 0.08) -
            weaknessPenalty +
            (signals.answeredReplayCount > 0 ? 0.25 : -0.25)
    );
    const estimatedReadinessScore = clampReadinessScore(
        confidenceScore * 8 +
            communicationScore * 9 +
            technicalScore * 10 -
            Math.min(12, signals.failedOrPartialCount * 2.4) -
            Math.min(8, signals.missedConceptCount)
    );

    return {
        confidenceScore,
        communicationScore,
        technicalScore,
        estimatedReadinessScore,
    };
};

const buildFallbackQuestionBreakdown = (input: AnalyzeInterviewInput) => {
    const replayBreakdown = (input.questionReplays ?? []).map((replay) => ({
        question: replay.question,
        candidateAnswer: replay.userAnswer?.trim() || "",
        expectedAnswerChecklist: [
            "State the core concept clearly.",
            "Give one concrete example from code, project work, or problem solving.",
            "Mention edge cases, tradeoffs, or complexity where relevant.",
        ],
        missedPoints: replay.missedPoints ?? [],
        likelyGap:
            replay.interviewerFeedback ||
            "The answer needs clearer structure, stronger technical proof, and a concise example.",
        practiceTask:
            "Record a 90-second answer using definition, example, tradeoff, and final summary.",
    }));

    if (replayBreakdown.length > 0) return replayBreakdown;

    return input.questionsAsked.slice(0, 5).map((question) => ({
        question,
        candidateAnswer: "",
        expectedAnswerChecklist: [
            "Open with the direct answer.",
            "Explain the reasoning step by step.",
            "Close with an example, complexity, or tradeoff.",
        ],
        missedPoints: input.conceptsMissed.slice(0, 3),
        likelyGap:
            "No detailed replay answer was available, so practice should focus on structured explanation.",
        practiceTask:
            "Write and speak a STAR or concept-example-tradeoff answer for this exact question.",
    }));
};

const fallbackAnalysis = (input?: AnalyzeInterviewInput): InterviewAIAnalysis => {
    const signals = input ? buildInterviewEvidenceSignals(input) : null;
    const scores = signals
        ? computeHeuristicInterviewScores(signals)
        : {
              confidenceScore: 5,
              communicationScore: 5,
              technicalScore: 5,
              estimatedReadinessScore: 50,
          };

    return {
        summary:
            "AI analysis could not be parsed completely, so this review was generated from interview replay signals. Focus first on the repeated weak topics, then practice concise structured answers for each question.",
        executiveDiagnosis:
            "The main selection risk is insufficient evidence of clear, structured, technically complete answers. The student should convert every weak question into a short answer script with definition, example, edge cases, and a final conclusion.",
        strengths: input?.whatWentWell
            ? [input.whatWentWell]
            : signals?.explicitStrengthSignalCount
              ? ["There is at least one positive interview signal to preserve."]
              : [],
        weaknesses: [
            ...(input?.whatWentWrong ? [input.whatWentWrong] : []),
            ...(signals?.missedConceptCount
                ? ["Missed concepts need targeted revision before the next mock."]
                : []),
            ...(signals?.failedOrPartialCount
                ? ["Several replay answers were marked failed, partial, or skipped."]
                : []),
        ],
        missedConcepts: input?.conceptsMissed ?? [],
        repeatedRiskTopics: [
            ...new Set([
                ...(input?.topics ?? []),
                ...(input?.previousWeakTopics ?? []),
            ]),
        ].slice(0, 8),

        confidenceScore: scores.confidenceScore,
        communicationScore: scores.communicationScore,
        technicalScore: scores.technicalScore,

        rootCauses: [
            "Answers likely lack a repeatable structure.",
            "Technical explanations need stronger examples, edge cases, and tradeoffs.",
            "Missed concepts should be revised through active recall instead of passive reading.",
        ],
        questionBreakdown: input ? buildFallbackQuestionBreakdown(input) : [],
        confidenceDiagnosis:
            scores.confidenceScore >= 7
                ? "Confidence is usable, but it still needs steadier proof through concise examples."
                : "Confidence may be limiting answer quality; practice short timed explanations out loud.",
        communicationDiagnosis:
            scores.communicationScore >= 7
                ? "Communication is understandable, but answer structure should become more predictable."
                : "Communication needs a clearer opening answer, step-by-step reasoning, and a crisp close.",
        technicalDiagnosis:
            scores.technicalScore >= 7
                ? "Technical base is usable, but answers need more depth, edge cases, and tradeoffs."
                : "Technical readiness is the main risk; revise missed concepts and explain them with examples.",
        answerFramework: [
            "Direct answer in one sentence.",
            "Explain the reasoning or implementation in 2-3 steps.",
            "Add one example, edge case, complexity note, or tradeoff.",
            "Close with the final decision or learning.",
        ],
        nextActions: [
            "Rewrite every weak question into a 6-line model answer.",
            "Revise missed concepts with active recall and one coding or design example.",
            "Record two timed mock answers and compare them against the checklist.",
        ],
        revisionPlan: [
            "Day 1: Revise missed concepts and create short answer notes.",
            "Day 2: Practice each weak question out loud with examples and tradeoffs.",
            "Day 3: Run a mock interview and fix answers that still sound vague.",
        ],
        mockDrills: [
            "90-second concept explanation drill for each missed topic.",
            "Question replay drill: answer, self-score, rewrite, and answer again.",
        ],
        companyReadinessNote:
            input?.company && input?.role
                ? `For ${input.company} ${input.role}, readiness depends on turning weak topics into clear, example-backed answers.`
                : "Readiness depends on turning weak topics into clear, example-backed answers.",
        estimatedReadinessScore: scores.estimatedReadinessScore,
    };
};

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

const getReadinessFromScores = (analysis: Pick<
    InterviewAIAnalysis,
    "confidenceScore" | "communicationScore" | "technicalScore"
>) =>
    clampReadinessScore(
        analysis.confidenceScore * 8 +
            analysis.communicationScore * 9 +
            analysis.technicalScore * 10
    );

const calibrateCompressedInterviewScores = (
    analysis: InterviewAIAnalysis,
    heuristicScores: ReturnType<typeof computeHeuristicInterviewScores>
): InterviewAIAnalysis => {
    const scores = INTERVIEW_SCORE_KEYS.map((key) => analysis[key]);
    const spread = Math.max(...scores) - Math.min(...scores);
    const isSafeMiddle =
        scores.every((score) => score >= 5 && score <= 7) &&
        Number.isInteger(analysis.estimatedReadinessScore) &&
        [50, 60, 65, 70].includes(analysis.estimatedReadinessScore);

    if (spread > 0.75 && !isSafeMiddle) return analysis;

    const modelMean =
        scores.reduce((total, score) => total + score, 0) / scores.length;
    const heuristicValues = INTERVIEW_SCORE_KEYS.map(
        (key) => heuristicScores[key]
    );
    const heuristicMean =
        heuristicValues.reduce((total, score) => total + score, 0) /
        heuristicValues.length;

    const calibrated = INTERVIEW_SCORE_KEYS.reduce(
        (updatedAnalysis, key) => ({
            ...updatedAnalysis,
            [key]: Number(
                clampInterviewScore(
                    modelMean + (heuristicScores[key] - heuristicMean) * 0.65
                ).toFixed(1)
            ),
        }),
        analysis
    );

    return {
        ...calibrated,
        estimatedReadinessScore:
            isSafeMiddle || analysis.estimatedReadinessScore === 50
                ? getReadinessFromScores(calibrated)
                : analysis.estimatedReadinessScore,
    };
};

const parseJsonSafely = (
    text: string,
    fallback = fallbackAnalysis(),
    heuristicScores?: ReturnType<typeof computeHeuristicInterviewScores>
): InterviewAIAnalysis => {
    try {
        const cleaned = extractJsonObject(text);

        const parsed = JSON.parse(cleaned);

        const analysis = {
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

        return heuristicScores
            ? calibrateCompressedInterviewScores(analysis, heuristicScores)
            : analysis;
    } catch {
        return fallback;
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
export const analyzeInterviewReplay = async (input: AnalyzeInterviewInput) => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is missing");
    }

    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    const evidenceSignals = buildInterviewEvidenceSignals(input);
    const fallback = fallbackAnalysis(input);
    const heuristicScores = computeHeuristicInterviewScores(evidenceSignals);

    const prompt = {
        task: "Do not merely summarize this interview. Act like a placement coach and generate a diagnostic improvement plan.",
        importantInstruction:
            "Avoid repeating the input unless needed. Convert the interview log into deeper coaching: root causes, question-wise expected answer checklist, candidate's actual answer from transcript, missed points, likely gaps, practice tasks, numeric scores, and a 3-day improvement plan. Do not use personal names from the transcript.",
        interview: input,
        evidenceSignals,
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
        scoreBands: {
            "0-3":
                "Poor: answer is absent, mostly wrong, unclear, or shows severe hesitation.",
            "4-5":
                "Weak: basic attempt exists but structure, examples, correctness, or depth are not enough.",
            "6-7":
                "Decent: understandable and partly correct, but misses depth, edge cases, or interview polish.",
            "8-10":
                "Strong: structured, confident, technically accurate, example-backed, and handles tradeoffs.",
        },
        coachingQualityRules: [
            "Use evidenceSignals to calibrate strictness, but the interview object is the source of truth.",
            "Do not produce generic advice like 'improve communication' unless it is tied to a specific observed answer or missed concept.",
            "Every weakness must explain the practical interview consequence.",
            "Every root cause must describe why the candidate struggled, not just what topic was missed.",
            "Every next action must include a concrete artifact: answer script, recorded response, code example, flashcards, or mock drill.",
            "When transcript or replay answers are available, quote or paraphrase the candidate's actual answer briefly and contrast it with what was expected.",
            "When transcript evidence is missing, say the candidateAnswer is empty and infer only from notes, statuses, missed points, and manual scores.",
        ],
        calibrationInstructions: [
            "Do not give confidenceScore, communicationScore, and technicalScore the same value unless the evidence quality is truly identical.",
            "Avoid comfortable defaults like 5, 6, or 7. Pick exact scores such as 4.3, 5.8, 6.6, or 7.4 when evidence supports nuance.",
            "If failedOrPartialCount is high, technicalScore and estimatedReadinessScore must drop.",
            "If missedConceptCount is high, technicalScore should usually be below communicationScore.",
            "If answeredReplayCount is 0 and transcript is weak or absent, keep confidence in the analysis lower and avoid high scores.",
            "If candidate answers are unstructured but conceptually close, communicationScore should be lower than technicalScore.",
            "If the student provided manual scores, use them as anchors, not final truth.",
        ],
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
            "Scores may use one decimal place when nuance helps.",
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

    return parseJsonSafely(text, fallback, heuristicScores);
};
