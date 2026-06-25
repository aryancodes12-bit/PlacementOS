import {
    useEffect,
    useMemo,
    useState,
} from "react";

import type {
    FormEvent,
    ReactNode,
} from "react";

import {
    ArrowLeft,
    CheckCircle2,
    FileAudio,
    HelpCircle,
    PenLine,
    Plus,
    Save,
    Sparkles,
    Target,
    Trash2,
    Video,
    WifiOff,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import {
    AppLayout,
} from "../components/ui/AppLayout";

import {
    ActionButton,
} from "../components/ui/design-system/ActionButton";

import {
    PageSurface,
} from "../components/ui/design-system/PageSurface";

import {
    SectionHeader,
} from "../components/ui/design-system/SectionHeader";

import {
    StatusNotice,
} from "../components/ui/design-system/StatusNotice";

import {
    AudioInterviewUploader,
} from "../components/interviews/AudioInterviewUploader";

import {
    VideoInterviewUploader,
} from "../components/interviews/VideoInterviewUploader";

import {
    InterviewErrorBoundary,
} from "../components/interviews/InterviewErrorBoundary";

import {
    formatInterviewEnum,
    getInterviewApiError,
    INTERVIEW_RESULTS,
    INTERVIEW_ROUND_TYPES,
    toInterviewArray,
    toInterviewScore,
} from "../components/interviews/interview-ui.utils";

import {
    interviewService,
} from "../services/interview.service";

import type {
    CreateInterviewInput,
    InterviewQuestionReplay,
    InterviewQuestionStatus,
    InterviewResult,
    InterviewRoundType,
} from "../services/interview.service";

type InterviewEntryMode =
    | "manual"
    | "audio"
    | "video";

interface ManualInterviewForm {
    company: string;
    role: string;
    roundType: InterviewRoundType;
    date: string;
    result: InterviewResult;
    topics: string;
    conceptsMissed: string;
    whatWentWell: string;
    whatWentWrong: string;
    feedback: string;
    confidenceScore: string;
    communicationScore: string;
    technicalScore: string;
}

interface QuestionForm {
    localId: string;
    question: string;
    userAnswer: string;
    missedPoints: string;
    interviewerFeedback: string;
    confidenceScore: string;
    status: InterviewQuestionStatus;
}

const QUESTION_STATUSES: InterviewQuestionStatus[] = [
    "SOLVED",
    "PARTIAL",
    "FAILED",
    "SKIPPED",
];

const createLocalId = () => {
    if (
        typeof crypto !==
        "undefined" &&
        "randomUUID" in crypto
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()}`;
};

const emptyQuestion =
    (): QuestionForm => ({
        localId:
            createLocalId(),
        question: "",
        userAnswer: "",
        missedPoints: "",
        interviewerFeedback:
            "",
        confidenceScore:
            "",
        status: "PARTIAL",
    });

const initialForm =
    (): ManualInterviewForm => ({
        company: "",
        role: "",
        roundType:
            "TECHNICAL",
        date: new Date()
            .toISOString()
            .slice(0, 10),
        result: "PENDING",
        topics: "",
        conceptsMissed:
            "",
        whatWentWell: "",
        whatWentWrong: "",
        feedback: "",
        confidenceScore:
            "",
        communicationScore:
            "",
        technicalScore: "",
    });

const fieldClass = [
    "w-full rounded-xl border border-border bg-bg-tertiary",
    "px-3.5 py-2.5 text-sm text-text-primary",
    "placeholder:text-text-tertiary",
    "outline-none transition duration-150",
    "hover:border-border-hover",
    "focus:border-brand focus:ring-2 focus:ring-brand/20",
    "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

const textAreaClass = [
    fieldClass,
    "min-h-24 resize-y",
].join(" ");

const labelClass =
    "mb-1.5 block text-xs font-bold uppercase tracking-[0.11em] text-text-secondary";

const helperClass =
    "mt-1.5 text-[11px] leading-5 text-text-tertiary";

const SourceOption = ({
    active,
    icon,
    title,
    description,
    onClick,
}: {
    active: boolean;
    icon: ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}) => {
    return (
        <button
            type="button"
            aria-pressed={
                active
            }
            onClick={onClick}
            className={[
                "group rounded-2xl border p-4 text-left outline-none",
                "transition duration-200 active:scale-[0.99]",
                "focus-visible:ring-2 focus-visible:ring-brand/70",
                active
                    ? "border-brand/50 bg-brand/10 shadow-[0_0_0_1px_rgba(99,102,241,0.08)]"
                    : "border-border bg-bg-tertiary hover:border-border-hover hover:bg-bg-hover",
            ].join(
                " "
            )}
        >
            <div className="flex items-start gap-3">
                <div
                    className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                        active
                            ? "border-brand/25 bg-brand/15 text-[#A5B4FC]"
                            : "border-border bg-bg-secondary text-text-secondary group-hover:text-text-primary",
                    ].join(
                        " "
                    )}
                >
                    {icon}
                </div>

                <div className="min-w-0">
                    <p className="text-sm font-bold text-text-primary">
                        {title}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-text-tertiary">
                        {description}
                    </p>
                </div>
            </div>
        </button>
    );
};

const ScoreField = ({
    id,
    label,
    value,
    placeholder,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    placeholder: string;
    onChange: (
        value: string
    ) => void;
}) => {
    return (
        <div>
            <label
                htmlFor={id}
                className={
                    labelClass
                }
            >
                {label}
            </label>

            <div className="relative">
                <input
                    id={id}
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    inputMode="decimal"
                    value={value}
                    placeholder={
                        placeholder
                    }
                    className={`${fieldClass} pr-12`}
                    onChange={(
                        event
                    ) =>
                        onChange(
                            event
                                .target
                                .value
                        )
                    }
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-tertiary">
                    /10
                </span>
            </div>
        </div>
    );
};

const NewInterviewPageContent =
    () => {
        const navigate =
            useNavigate();

        const [
            mode,
            setMode,
        ] =
            useState<InterviewEntryMode>(
                "manual"
            );

        const [
            form,
            setForm,
        ] =
            useState<ManualInterviewForm>(
                initialForm
            );

        const [
            questions,
            setQuestions,
        ] = useState<
            QuestionForm[]
        >([
            emptyQuestion(),
        ]);

        const [
            saving,
            setSaving,
        ] =
            useState(false);

        const [
            error,
            setError,
        ] =
            useState("");

        const [
            isOnline,
            setIsOnline,
        ] = useState(
            () =>
                typeof navigator ===
                "undefined" ||
                navigator.onLine
        );

        useEffect(() => {
            const handleOnline =
                () =>
                    setIsOnline(
                        true
                    );

            const handleOffline =
                () =>
                    setIsOnline(
                        false
                    );

            window.addEventListener(
                "online",
                handleOnline
            );

            window.addEventListener(
                "offline",
                handleOffline
            );

            return () => {
                window.removeEventListener(
                    "online",
                    handleOnline
                );

                window.removeEventListener(
                    "offline",
                    handleOffline
                );
            };
        }, []);

        const parsedTopics =
            useMemo(
                () =>
                    toInterviewArray(
                        form.topics
                    ),
                [form.topics]
            );

        const explicitMissedConcepts =
            useMemo(
                () =>
                    toInterviewArray(
                        form.conceptsMissed
                    ),
                [
                    form.conceptsMissed,
                ]
            );

        const completedQuestionCount =
            useMemo(
                () =>
                    questions.filter(
                        (
                            question
                        ) =>
                            question.question.trim()
                    ).length,
                [questions]
            );

        const questionMissedPoints =
            useMemo(
                () =>
                    questions.flatMap(
                        (
                            question
                        ) =>
                            toInterviewArray(
                                question.missedPoints
                            )
                    ),
                [questions]
            );

        const totalMissedConcepts =
            useMemo(
                () =>
                    new Set([
                        ...explicitMissedConcepts,
                        ...questionMissedPoints,
                    ]).size,
                [
                    explicitMissedConcepts,
                    questionMissedPoints,
                ]
            );

        const updateForm = <
            K extends keyof ManualInterviewForm,
        >(
            field: K,
            value: ManualInterviewForm[K]
        ) => {
            setForm(
                (
                    current
                ) => ({
                    ...current,
                    [field]:
                        value,
                })
            );
        };

        const updateQuestion = (
            localId: string,
            field:
                keyof Omit<
                    QuestionForm,
                    "localId"
                >,
            value: string
        ) => {
            setQuestions(
                (
                    current
                ) =>
                    current.map(
                        (
                            question
                        ) =>
                            question.localId ===
                                localId
                                ? {
                                    ...question,
                                    [field]:
                                        value,
                                }
                                : question
                    )
            );
        };

        const addQuestion =
            () => {
                setQuestions(
                    (
                        current
                    ) => [
                            ...current,
                            emptyQuestion(),
                        ]
                );
            };

        const removeQuestion = (
            localId: string
        ) => {
            setQuestions(
                (
                    current
                ) => {
                    if (
                        current.length ===
                        1
                    ) {
                        return current;
                    }

                    return current.filter(
                        (
                            question
                        ) =>
                            question.localId !==
                            localId
                    );
                }
            );
        };

        const buildQuestionReplays =
            (): InterviewQuestionReplay[] => {
                return questions
                    .map(
                        (
                            question
                        ) => ({
                            question:
                                question.question.trim(),

                            userAnswer:
                                question.userAnswer.trim() ||
                                null,

                            missedPoints:
                                toInterviewArray(
                                    question.missedPoints
                                ),

                            interviewerFeedback:
                                question.interviewerFeedback.trim() ||
                                null,

                            confidenceScore:
                                toInterviewScore(
                                    question.confidenceScore
                                ),

                            status:
                                question.status,
                        })
                    )
                    .filter(
                        (
                            question
                        ) =>
                            question.question.length >
                            0
                    );
            };

        const handleSubmit =
            async (
                event: FormEvent
            ) => {
                event.preventDefault();

                if (
                    !isOnline
                ) {
                    setError(
                        "You are offline. Reconnect before saving this interview replay."
                    );
                    return;
                }

                if (
                    !form.company.trim()
                ) {
                    setError(
                        "Company is required."
                    );
                    return;
                }

                if (
                    !form.role.trim()
                ) {
                    setError(
                        "Role is required."
                    );
                    return;
                }

                if (!form.date) {
                    setError(
                        "Interview date is required."
                    );
                    return;
                }

                const questionReplays =
                    buildQuestionReplays();

                if (
                    questionReplays.length ===
                    0
                ) {
                    setError(
                        "Add at least one interview question."
                    );
                    return;
                }

                try {
                    setSaving(
                        true
                    );

                    setError("");

                    const allMissedConcepts =
                        Array.from(
                            new Set([
                                ...toInterviewArray(
                                    form.conceptsMissed
                                ),

                                ...questionReplays.flatMap(
                                    (
                                        question
                                    ) =>
                                        question.missedPoints
                                ),
                            ])
                        );

                    const payload: CreateInterviewInput =
                    {
                        company:
                            form.company.trim(),

                        role:
                            form.role.trim(),

                        roundType:
                            form.roundType,

                        date:
                            form.date,

                        result:
                            form.result,

                        questionsAsked:
                            questionReplays.map(
                                (
                                    question
                                ) =>
                                    question.question
                            ),

                        questionReplays,

                        topics:
                            toInterviewArray(
                                form.topics
                            ),

                        conceptsMissed:
                            allMissedConcepts,

                        whatWentWell:
                            form.whatWentWell.trim(),

                        whatWentWrong:
                            form.whatWentWrong.trim(),

                        feedback:
                            form.feedback.trim(),

                        confidenceScore:
                            toInterviewScore(
                                form.confidenceScore
                            ),

                        communicationScore:
                            toInterviewScore(
                                form.communicationScore
                            ),

                        technicalScore:
                            toInterviewScore(
                                form.technicalScore
                            ),

                        nextActions:
                            [],
                    };

                    const {
                        data,
                    } =
                        await interviewService.create(
                            payload
                        );

                    navigate(
                        data
                            .interview
                            ?.id
                            ? `/interviews/${data.interview.id}`
                            : "/interviews"
                    );
                } catch (
                submitError
                ) {
                    setError(
                        getInterviewApiError(
                            submitError,
                            "Failed to log interview replay."
                        )
                    );
                } finally {
                    setSaving(
                        false
                    );
                }
            };

        const switchMode = (
            nextMode: InterviewEntryMode
        ) => {
            if (
                saving
            ) {
                return;
            }

            setError("");
            setMode(
                nextMode
            );
        };

        return (
            <AppLayout
                title="Log Interview"
                description="Capture a manual replay or upload interview media for transcription and AI analysis."
                action={
                    <ActionButton
                        type="button"
                        variant="secondary"
                        leadingIcon={
                            <ArrowLeft
                                size={15}
                                aria-hidden="true"
                            />
                        }
                        onClick={() =>
                            navigate(
                                "/interviews"
                            )
                        }
                    >
                        Back
                    </ActionButton>
                }
            >
                <div className="mx-auto grid w-full max-w-[1320px] gap-4 sm:gap-5">
                    {!isOnline && (
                        <StatusNotice
                            tone="warning"
                            title="You are offline"
                        >
                            <span className="inline-flex items-start gap-2">
                                <WifiOff
                                    size={16}
                                    className="mt-0.5 shrink-0"
                                    aria-hidden="true"
                                />

                                Manual saving and media uploads require an internet connection.
                            </span>
                        </StatusNotice>
                    )}

                    <PageSurface padding="md">
                        <SectionHeader
                            title="Replay source"
                            description="Choose how you want to capture this interview."
                            icon={
                                <Sparkles
                                    size={18}
                                    aria-hidden="true"
                                />
                            }
                            compact
                        />

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <SourceOption
                                active={
                                    mode ===
                                    "manual"
                                }
                                icon={
                                    <PenLine
                                        size={18}
                                        aria-hidden="true"
                                    />
                                }
                                title="Quick Log"
                                description="Manually capture questions, answers, missed points, and feedback."
                                onClick={() =>
                                    switchMode(
                                        "manual"
                                    )
                                }
                            />

                            <SourceOption
                                active={
                                    mode ===
                                    "audio"
                                }
                                icon={
                                    <FileAudio
                                        size={18}
                                        aria-hidden="true"
                                    />
                                }
                                title="Upload Audio"
                                description="Transcribe interview audio and generate an AI-assisted replay."
                                onClick={() =>
                                    switchMode(
                                        "audio"
                                    )
                                }
                            />

                            <SourceOption
                                active={
                                    mode ===
                                    "video"
                                }
                                icon={
                                    <Video
                                        size={18}
                                        aria-hidden="true"
                                    />
                                }
                                title="Upload Video"
                                description="Save video evidence, extract speech, and generate interview analysis."
                                onClick={() =>
                                    switchMode(
                                        "video"
                                    )
                                }
                            />
                        </div>
                    </PageSurface>

                    {mode ===
                        "audio" ? (
                        <AudioInterviewUploader />
                    ) : mode ===
                        "video" ? (
                        <VideoInterviewUploader />
                    ) : (
                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]"
                        >
                            <main className="grid min-w-0 gap-4">
                                {error && (
                                    <StatusNotice
                                        tone="error"
                                        dismissible
                                        onDismiss={() =>
                                            setError(
                                                ""
                                            )
                                        }
                                    >
                                        {
                                            error
                                        }
                                    </StatusNotice>
                                )}

                                <PageSurface padding="lg">
                                    <SectionHeader
                                        title="Interview details"
                                        description="Start with company, role, round, date, and outcome."
                                        icon={
                                            <Target
                                                size={18}
                                                aria-hidden="true"
                                            />
                                        }
                                        compact
                                    />

                                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="interview-company"
                                                className={
                                                    labelClass
                                                }
                                            >
                                                Company
                                            </label>

                                            <input
                                                id="interview-company"
                                                value={
                                                    form.company
                                                }
                                                autoComplete="organization"
                                                placeholder="TCS, Infosys, Amazon, JPMorgan"
                                                className={
                                                    fieldClass
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateForm(
                                                        "company",
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="interview-role"
                                                className={
                                                    labelClass
                                                }
                                            >
                                                Role
                                            </label>

                                            <input
                                                id="interview-role"
                                                value={
                                                    form.role
                                                }
                                                autoComplete="organization-title"
                                                placeholder="SDE Intern, Java Developer Intern"
                                                className={
                                                    fieldClass
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateForm(
                                                        "role",
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="interview-round"
                                                className={
                                                    labelClass
                                                }
                                            >
                                                Round Type
                                            </label>

                                            <select
                                                id="interview-round"
                                                value={
                                                    form.roundType
                                                }
                                                className={
                                                    fieldClass
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateForm(
                                                        "roundType",
                                                        event
                                                            .target
                                                            .value as InterviewRoundType
                                                    )
                                                }
                                            >
                                                {INTERVIEW_ROUND_TYPES.map(
                                                    (
                                                        round
                                                    ) => (
                                                        <option
                                                            key={
                                                                round
                                                            }
                                                            value={
                                                                round
                                                            }
                                                        >
                                                            {formatInterviewEnum(
                                                                round
                                                            )}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="interview-result"
                                                className={
                                                    labelClass
                                                }
                                            >
                                                Result
                                            </label>

                                            <select
                                                id="interview-result"
                                                value={
                                                    form.result
                                                }
                                                className={
                                                    fieldClass
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateForm(
                                                        "result",
                                                        event
                                                            .target
                                                            .value as InterviewResult
                                                    )
                                                }
                                            >
                                                {INTERVIEW_RESULTS.map(
                                                    (
                                                        result
                                                    ) => (
                                                        <option
                                                            key={
                                                                result
                                                            }
                                                            value={
                                                                result
                                                            }
                                                        >
                                                            {formatInterviewEnum(
                                                                result
                                                            )}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="interview-date"
                                                className={
                                                    labelClass
                                                }
                                            >
                                                Date
                                            </label>

                                            <input
                                                id="interview-date"
                                                type="date"
                                                value={
                                                    form.date
                                                }
                                                className={
                                                    fieldClass
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateForm(
                                                        "date",
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </PageSurface>

                                <PageSurface padding="lg">
                                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                        <SectionHeader
                                            title="Question-level replay"
                                            description="Capture what you answered, what you missed, and what feedback you received."
                                            icon={
                                                <HelpCircle
                                                    size={18}
                                                    aria-hidden="true"
                                                />
                                            }
                                            compact
                                        />

                                        <ActionButton
                                            type="button"
                                            variant="secondary"
                                            leadingIcon={
                                                <Plus
                                                    size={15}
                                                    aria-hidden="true"
                                                />
                                            }
                                            onClick={
                                                addQuestion
                                            }
                                        >
                                            Add Question
                                        </ActionButton>
                                    </div>

                                    <div className="mt-5 grid gap-4">
                                        {questions.map(
                                            (
                                                question,
                                                index
                                            ) => (
                                                <PageSurface
                                                    key={
                                                        question.localId
                                                    }
                                                    as="article"
                                                    variant="subtle"
                                                    padding="md"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-bold text-text-primary">
                                                                Question{" "}
                                                                {index +
                                                                    1}
                                                            </p>

                                                            <p className="mt-0.5 text-xs text-text-tertiary">
                                                                {
                                                                    formatInterviewEnum(
                                                                        question.status
                                                                    )
                                                                }
                                                            </p>
                                                        </div>

                                                        <ActionButton
                                                            type="button"
                                                            variant="danger"
                                                            aria-label={`Remove question ${index + 1}`}
                                                            disabled={
                                                                questions.length ===
                                                                1
                                                            }
                                                            onClick={() =>
                                                                removeQuestion(
                                                                    question.localId
                                                                )
                                                            }
                                                            className="!px-3"
                                                        >
                                                            <Trash2
                                                                size={15}
                                                                aria-hidden="true"
                                                            />
                                                        </ActionButton>
                                                    </div>

                                                    <div className="mt-4 grid gap-4">
                                                        <div>
                                                            <label
                                                                htmlFor={`question-${question.localId}`}
                                                                className={
                                                                    labelClass
                                                                }
                                                            >
                                                                Question Asked
                                                            </label>

                                                            <textarea
                                                                id={`question-${question.localId}`}
                                                                value={
                                                                    question.question
                                                                }
                                                                placeholder="What is SQL indexing and why is it used?"
                                                                className={
                                                                    textAreaClass
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    updateQuestion(
                                                                        question.localId,
                                                                        "question",
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </div>

                                                        <div>
                                                            <label
                                                                htmlFor={`answer-${question.localId}`}
                                                                className={
                                                                    labelClass
                                                                }
                                                            >
                                                                My Answer
                                                            </label>

                                                            <textarea
                                                                id={`answer-${question.localId}`}
                                                                value={
                                                                    question.userAnswer
                                                                }
                                                                placeholder="Explain what you said, including examples and tradeoffs."
                                                                className={`${textAreaClass} min-h-28`}
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    updateQuestion(
                                                                        question.localId,
                                                                        "userAnswer",
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </div>

                                                        <div className="grid gap-4 md:grid-cols-2">
                                                            <div>
                                                                <label
                                                                    htmlFor={`missed-${question.localId}`}
                                                                    className={
                                                                        labelClass
                                                                    }
                                                                >
                                                                    Missed Points
                                                                </label>

                                                                <textarea
                                                                    id={`missed-${question.localId}`}
                                                                    value={
                                                                        question.missedPoints
                                                                    }
                                                                    placeholder={"B-tree basics\nClustered vs non-clustered\nIndex tradeoffs"}
                                                                    className={
                                                                        textAreaClass
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) =>
                                                                        updateQuestion(
                                                                            question.localId,
                                                                            "missedPoints",
                                                                            event
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                />

                                                                <p className={
                                                                    helperClass
                                                                }>
                                                                    Enter one item per line or separate items with commas.
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <label
                                                                    htmlFor={`feedback-${question.localId}`}
                                                                    className={
                                                                        labelClass
                                                                    }
                                                                >
                                                                    Interviewer Feedback
                                                                </label>

                                                                <textarea
                                                                    id={`feedback-${question.localId}`}
                                                                    value={
                                                                        question.interviewerFeedback
                                                                    }
                                                                    placeholder="Revise internals, examples, and when not to use this approach."
                                                                    className={
                                                                        textAreaClass
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) =>
                                                                        updateQuestion(
                                                                            question.localId,
                                                                            "interviewerFeedback",
                                                                            event
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid gap-4 md:grid-cols-2">
                                                            <ScoreField
                                                                id={`confidence-${question.localId}`}
                                                                label="Question Confidence"
                                                                value={
                                                                    question.confidenceScore
                                                                }
                                                                placeholder="5"
                                                                onChange={(
                                                                    value
                                                                ) =>
                                                                    updateQuestion(
                                                                        question.localId,
                                                                        "confidenceScore",
                                                                        value
                                                                    )
                                                                }
                                                            />

                                                            <div>
                                                                <label
                                                                    htmlFor={`status-${question.localId}`}
                                                                    className={
                                                                        labelClass
                                                                    }
                                                                >
                                                                    Status
                                                                </label>

                                                                <select
                                                                    id={`status-${question.localId}`}
                                                                    value={
                                                                        question.status
                                                                    }
                                                                    className={
                                                                        fieldClass
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) =>
                                                                        updateQuestion(
                                                                            question.localId,
                                                                            "status",
                                                                            event
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                >
                                                                    {QUESTION_STATUSES.map(
                                                                        (
                                                                            status
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    status
                                                                                }
                                                                                value={
                                                                                    status
                                                                                }
                                                                            >
                                                                                {formatInterviewEnum(
                                                                                    status
                                                                                )}
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </PageSurface>
                                            )
                                        )}
                                    </div>
                                </PageSurface>

                                <PageSurface padding="lg">
                                    <SectionHeader
                                        title="Overall replay context"
                                        description="Add topics, overall reflection, and interviewer feedback."
                                        icon={
                                            <CheckCircle2
                                                size={18}
                                                aria-hidden="true"
                                            />
                                        }
                                        compact
                                    />

                                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="interview-topics"
                                                className={
                                                    labelClass
                                                }
                                            >
                                                Topics Covered
                                            </label>

                                            <textarea
                                                id="interview-topics"
                                                value={
                                                    form.topics
                                                }
                                                placeholder={"Java\nOOP\nDBMS\nSQL"}
                                                className={
                                                    textAreaClass
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateForm(
                                                        "topics",
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />

                                            <p className={
                                                helperClass
                                            }>
                                                {parsedTopics.length} topic
                                                {parsedTopics.length ===
                                                    1
                                                    ? ""
                                                    : "s"}{" "}
                                                detected.
                                            </p>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="interview-missed-concepts"
                                                className={
                                                    labelClass
                                                }
                                            >
                                                Overall Missed Concepts
                                            </label>

                                            <textarea
                                                id="interview-missed-concepts"
                                                value={
                                                    form.conceptsMissed
                                                }
                                                placeholder={"SQL indexing\nTime complexity\nThread safety"}
                                                className={
                                                    textAreaClass
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateForm(
                                                        "conceptsMissed",
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />

                                            <p className={
                                                helperClass
                                            }>
                                                Question-level missed points are merged automatically.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-4">
                                        <div>
                                            <label
                                                htmlFor="interview-well"
                                                className={
                                                    labelClass
                                                }
                                            >
                                                What Went Well
                                            </label>

                                            <textarea
                                                id="interview-well"
                                                value={
                                                    form.whatWentWell
                                                }
                                                placeholder="I stayed calm, clarified requirements, and explained core concepts clearly."
                                                className={
                                                    textAreaClass
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateForm(
                                                        "whatWentWell",
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="interview-wrong"
                                                className={
                                                    labelClass
                                                }
                                            >
                                                What Went Wrong
                                            </label>

                                            <textarea
                                                id="interview-wrong"
                                                value={
                                                    form.whatWentWrong
                                                }
                                                placeholder="I struggled with deeper internals, tradeoffs, or structured explanations."
                                                className={
                                                    textAreaClass
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateForm(
                                                        "whatWentWrong",
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="interview-feedback"
                                                className={
                                                    labelClass
                                                }
                                            >
                                                Overall Feedback
                                            </label>

                                            <textarea
                                                id="interview-feedback"
                                                value={
                                                    form.feedback
                                                }
                                                placeholder="Add feedback from the interviewer, mentor, or your own review."
                                                className={
                                                    textAreaClass
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateForm(
                                                        "feedback",
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </PageSurface>
                            </main>

                            <aside className="grid content-start gap-4 lg:sticky lg:top-6 lg:self-start">
                                <PageSurface padding="lg">
                                    <SectionHeader
                                        title="Overall self scores"
                                        description="Rate the complete interview from 0 to 10."
                                        icon={
                                            <Target
                                                size={17}
                                                aria-hidden="true"
                                            />
                                        }
                                        compact
                                    />

                                    <div className="mt-5 grid gap-4">
                                        <ScoreField
                                            id="overall-confidence"
                                            label="Confidence"
                                            value={
                                                form.confidenceScore
                                            }
                                            placeholder="6"
                                            onChange={(
                                                value
                                            ) =>
                                                updateForm(
                                                    "confidenceScore",
                                                    value
                                                )
                                            }
                                        />

                                        <ScoreField
                                            id="overall-communication"
                                            label="Communication"
                                            value={
                                                form.communicationScore
                                            }
                                            placeholder="7"
                                            onChange={(
                                                value
                                            ) =>
                                                updateForm(
                                                    "communicationScore",
                                                    value
                                                )
                                            }
                                        />

                                        <ScoreField
                                            id="overall-technical"
                                            label="Technical"
                                            value={
                                                form.technicalScore
                                            }
                                            placeholder="5"
                                            onChange={(
                                                value
                                            ) =>
                                                updateForm(
                                                    "technicalScore",
                                                    value
                                                )
                                            }
                                        />
                                    </div>
                                </PageSurface>

                                <PageSurface
                                    variant="highlight"
                                    padding="md"
                                >
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#A5B4FC]">
                                        Replay summary
                                    </p>

                                    <div className="mt-4 grid grid-cols-3 gap-2">
                                        <div className="rounded-xl border border-border bg-bg-tertiary p-3 text-center">
                                            <p className="text-lg font-black text-text-primary">
                                                {
                                                    completedQuestionCount
                                                }
                                            </p>

                                            <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-text-tertiary">
                                                Questions
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-border bg-bg-tertiary p-3 text-center">
                                            <p className="text-lg font-black text-text-primary">
                                                {
                                                    parsedTopics.length
                                                }
                                            </p>

                                            <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-text-tertiary">
                                                Topics
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-border bg-bg-tertiary p-3 text-center">
                                            <p className="text-lg font-black text-danger">
                                                {
                                                    totalMissedConcepts
                                                }
                                            </p>

                                            <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-text-tertiary">
                                                Gaps
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mt-4 text-xs leading-5 text-text-secondary">
                                        Detailed answers and missed points produce a sharper AI diagnosis later.
                                    </p>
                                </PageSurface>

                                <ActionButton
                                    type="submit"
                                    fullWidth
                                    loading={
                                        saving
                                    }
                                    loadingText="Saving interview..."
                                    leadingIcon={
                                        <Save
                                            size={16}
                                            aria-hidden="true"
                                        />
                                    }
                                    disabled={
                                        !isOnline
                                    }
                                >
                                    Save Question Replay
                                </ActionButton>
                            </aside>
                        </form>
                    )}
                </div>
            </AppLayout>
        );
    };

export const NewInterviewPage =
    () => {
        return (
            <InterviewErrorBoundary>
                <NewInterviewPageContent />
            </InterviewErrorBoundary>
        );
    };
