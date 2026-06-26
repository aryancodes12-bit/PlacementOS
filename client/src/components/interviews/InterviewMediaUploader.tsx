import {
    useEffect,
    useId,
    useRef,
    useState,
} from "react";

import type {
    ChangeEvent,
    FormEvent,
} from "react";

import {
    CalendarDays,
    FileAudio,
    Sparkles,
    Upload,
    Video,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import type {
    InterviewResult,
    InterviewRoundType,
} from "../../services/interview.service";

import {
    extractInterviewAudioFromVideo,
} from "../../lib/media/interviewAudioExtraction";

import {
    readInterviewMediaMetadata,
} from "../../lib/media/interviewMediaMetadata";

import type {
    InterviewMediaMetadata,
} from "../../lib/media/interviewMediaMetadata";

import {
    uploadProcessedInterviewAudio,
} from "../../lib/media/interviewProcessedAudioUpload";

import type {
    InterviewProcessedAudioUploadStage,
} from "../../lib/media/interviewProcessedAudioUpload";

import {
    ActionButton,
} from "../ui/design-system/ActionButton";

import {
    IconTile,
} from "../ui/design-system/IconTile";

import {
    PageSurface,
} from "../ui/design-system/PageSurface";

import {
    SelectField,
    TextAreaField,
    TextField,
} from "../ui/design-system/FormControls";

import {
    StatusNotice,
} from "../ui/design-system/StatusNotice";

import {
    InterviewPageSkeleton,
} from "./InterviewPageSkeleton";

import {
    formatInterviewEnum,
    formatMediaSize,
    getInterviewApiError,
    INTERVIEW_RESULTS,
    INTERVIEW_ROUND_TYPES,
    validateInterviewMedia,
} from "./interview-ui.utils";

type MediaType =
    | "audio"
    | "video";

export type InterviewAnalysisLoadingHandler =
    (isLoading: boolean) => void;

interface InterviewMediaUploaderProps {
    mediaType: MediaType;
    onAnalysisLoadingChange?: InterviewAnalysisLoadingHandler;
}

interface MediaConfig {
    accept: string;
    description: string;
    emptyFileLabel: string;
    fileHelp: string;
    fileLabel: string;
    Icon: typeof FileAudio;
    submitLabel: string;
    title: string;
}

interface MediaUploadForm {
    company: string;
    role: string;
    roundType: InterviewRoundType;
    date: string;
    result: InterviewResult;
    topics: string;
    notes: string;
}

const mediaConfig: Record<
    MediaType,
    MediaConfig
> = {
    audio: {
        accept:
            "audio/*,.mp3,.wav,.m4a,.webm,.ogg",
        description:
            "Upload a mock or real interview audio. PlacementOS automatically uses a single upload or safe overlapping chunks before transcription and AI analysis.",
        emptyFileLabel:
            "Choose an audio file",
        fileHelp:
            "MP3, WAV, M4A, WEBM, or OGG, maximum 50 MB and 60 minutes.",
        fileLabel:
            "Audio file",
        Icon:
            FileAudio,
        submitLabel:
            "Upload & Analyze",
        title:
            "Upload Audio Interview",
    },

    video: {
        accept:
            "video/*,.mp4,.webm,.mov",
        description:
            "Select a mock or real interview video. PlacementOS extracts compressed audio locally, while the original video stays on your device.",
        emptyFileLabel:
            "Choose a video file",
        fileHelp:
            "MP4, WEBM, or MOV, maximum 30 minutes. The original video stays on your device.",
        fileLabel:
            "Video file",
        Icon:
            Video,
        submitLabel:
            "Process Video & Analyze",
        title:
            "Upload Video Interview",
    },
};

const roundTypeOptions =
    INTERVIEW_ROUND_TYPES.map(
        (roundType) => ({
            label:
                formatInterviewEnum(
                    roundType
                ),
            value:
                roundType,
        })
    );

const resultOptions =
    INTERVIEW_RESULTS.map(
        (result) => ({
            label:
                formatInterviewEnum(
                    result
                ),
            value:
                result,
        })
    );

const createInitialForm =
    (): MediaUploadForm => ({
        company: "",
        role: "",
        roundType:
            "TECHNICAL",
        date:
            new Date()
                .toISOString()
                .slice(
                    0,
                    10
                ),
        result:
            "PENDING",
        topics: "",
        notes: "",
    });

const getMediaProcessingError = (
    error: unknown,
    mediaType: MediaType
): string => {
    if (
        error instanceof Error &&
        error.message
    ) {
        return error.message;
    }

    return `Unable to process the selected ${mediaType} file.`;
};

const formatSelectedMediaDetails = (
    file: File,
    metadata: InterviewMediaMetadata
): string => {
    const details = [
        formatMediaSize(
            file.size
        ),
        metadata.durationLabel,
    ];

    if (
        metadata.mediaType ===
        "video" &&
        metadata.width &&
        metadata.height
    ) {
        details.push(
            `${metadata.width}×${metadata.height}`
        );
    }

    return details.join(
        " • "
    );
};

const getUploadLoadingText = (
    validatingBeforeUpload: boolean,
    extractingVideoAudio: boolean,
    uploadStage:
        | InterviewProcessedAudioUploadStage
        | null
): string => {
    if (
        validatingBeforeUpload
    ) {
        return "Validating media...";
    }

    if (
        extractingVideoAudio
    ) {
        return "Extracting audio locally...";
    }

    switch (
    uploadStage
    ) {
        case "preparing":
            return "Preparing audio...";

        case "generating-chunks":
            return "Creating safe audio chunks...";

        case "uploading-chunks":
            return "Uploading audio chunks...";

        case "uploading-single":
            return "Uploading & analyzing...";

        default:
            return "Uploading & analyzing...";
    }
};

export const InterviewMediaUploader = ({
    mediaType,
    onAnalysisLoadingChange,
}: InterviewMediaUploaderProps) => {
    const navigate =
        useNavigate();

    const fileInputId =
        useId();

    const fileInputRef =
        useRef<HTMLInputElement | null>(
            null
        );

    const mediaValidationRequestRef =
        useRef(0);

    const config =
        mediaConfig[
        mediaType
        ];

    const [
        form,
        setForm,
    ] =
        useState<MediaUploadForm>(
            createInitialForm
        );

    const [
        mediaFile,
        setMediaFile,
    ] =
        useState<File | null>(
            null
        );

    const [
        mediaMetadata,
        setMediaMetadata,
    ] =
        useState<InterviewMediaMetadata | null>(
            null
        );

    const [
        validatingMedia,
        setValidatingMedia,
    ] =
        useState(false);

    const [
        uploading,
        setUploading,
    ] =
        useState(false);

    const [
        validatingBeforeUpload,
        setValidatingBeforeUpload,
    ] =
        useState(false);

    const [
        extractingVideoAudio,
        setExtractingVideoAudio,
    ] =
        useState(false);

    const [
        uploadStage,
        setUploadStage,
    ] =
        useState<
            InterviewProcessedAudioUploadStage |
            null
        >(
            null
        );

    const [
        error,
        setError,
    ] =
        useState("");

    const Icon =
        config.Icon;

    const isBusy =
        validatingMedia ||
        uploading ||
        extractingVideoAudio;

    useEffect(() => {
        return () => {
            mediaValidationRequestRef.current +=
                1;
        };
    }, []);

    useEffect(() => {
        onAnalysisLoadingChange?.(
            uploading
        );

        return () => {
            if (
                uploading
            ) {
                onAnalysisLoadingChange?.(
                    false
                );
            }
        };
    }, [
        onAnalysisLoadingChange,
        uploading,
    ]);

    const updateField = (
        field: keyof MediaUploadForm,
        value: string
    ) => {
        setForm(
            (previous) => ({
                ...previous,
                [field]:
                    value,
            })
        );
    };

    const resetSelectedMedia =
        () => {
            mediaValidationRequestRef.current +=
                1;

            setMediaFile(
                null
            );

            setMediaMetadata(
                null
            );

            setValidatingMedia(
                false
            );

            if (
                fileInputRef.current
            ) {
                fileInputRef.current.value =
                    "";
            }
        };

    const handleFileChange =
        async (
            event: ChangeEvent<HTMLInputElement>
        ) => {
            const inputElement =
                event.currentTarget;

            const nextFile =
                inputElement.files?.[0] ??
                null;

            const requestId =
                mediaValidationRequestRef.current +
                1;

            mediaValidationRequestRef.current =
                requestId;

            setMediaFile(
                null
            );

            setMediaMetadata(
                null
            );

            setUploadStage(
                null
            );

            setError("");

            if (!nextFile) {
                setValidatingMedia(
                    false
                );
                return;
            }

            const validationError =
                validateInterviewMedia(
                    nextFile,
                    mediaType
                );

            if (
                validationError
            ) {
                setValidatingMedia(
                    false
                );

                setError(
                    validationError
                );

                inputElement.value =
                    "";

                return;
            }

            setValidatingMedia(
                true
            );

            try {
                const metadata =
                    await readInterviewMediaMetadata(
                        nextFile,
                        mediaType
                    );

                if (
                    mediaValidationRequestRef.current !==
                    requestId
                ) {
                    return;
                }

                setMediaFile(
                    nextFile
                );

                setMediaMetadata(
                    metadata
                );

                setError("");
            } catch (
            metadataError
            ) {
                if (
                    mediaValidationRequestRef.current !==
                    requestId
                ) {
                    return;
                }

                inputElement.value =
                    "";

                setMediaFile(
                    null
                );

                setMediaMetadata(
                    null
                );

                setError(
                    getMediaProcessingError(
                        metadataError,
                        mediaType
                    )
                );
            } finally {
                if (
                    mediaValidationRequestRef.current ===
                    requestId
                ) {
                    setValidatingMedia(
                        false
                    );
                }
            }
        };

    const handleSubmit =
        async (
            event: FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            if (
                validatingMedia
            ) {
                setError(
                    `Please wait while the ${mediaType} file is being validated.`
                );
                return;
            }

            if (
                !form.company.trim() ||
                !form.role.trim() ||
                !form.date
            ) {
                setError(
                    "Company, role, and date are required."
                );
                return;
            }

            if (
                !mediaFile ||
                !mediaMetadata
            ) {
                setError(
                    `Please select a valid ${mediaType} file.`
                );
                return;
            }

            const validationError =
                validateInterviewMedia(
                    mediaFile,
                    mediaType
                );

            if (
                validationError
            ) {
                setError(
                    validationError
                );
                return;
            }

            setUploading(
                true
            );

            setValidatingBeforeUpload(
                true
            );

            setExtractingVideoAudio(
                false
            );

            setUploadStage(
                null
            );

            setError("");

            let refreshedMetadata:
                InterviewMediaMetadata;

            try {
                refreshedMetadata =
                    await readInterviewMediaMetadata(
                        mediaFile,
                        mediaType
                    );

                setMediaMetadata(
                    refreshedMetadata
                );
            } catch (
            metadataError
            ) {
                resetSelectedMedia();

                setError(
                    getMediaProcessingError(
                        metadataError,
                        mediaType
                    )
                );

                setUploading(
                    false
                );

                setValidatingBeforeUpload(
                    false
                );

                return;
            }

            setValidatingBeforeUpload(
                false
            );

            let processedAudioFile =
                mediaFile;

            if (
                mediaType ===
                "video"
            ) {
                setExtractingVideoAudio(
                    true
                );

                try {
                    const extractedAudio =
                        await extractInterviewAudioFromVideo(
                            mediaFile
                        );

                    processedAudioFile =
                        extractedAudio.file;
                } catch (
                extractionError
                ) {
                    setError(
                        getMediaProcessingError(
                            extractionError,
                            "video"
                        )
                    );

                    setUploading(
                        false
                    );

                    setExtractingVideoAudio(
                        false
                    );

                    return;
                } finally {
                    setExtractingVideoAudio(
                        false
                    );
                }
            }

            try {
                const result =
                    await uploadProcessedInterviewAudio({
                        audioFile:
                            processedAudioFile,

                        durationSeconds:
                            refreshedMetadata
                                .durationSeconds,

                        sourceType:
                            mediaType ===
                                "video"
                                ? "VIDEO"
                                : "AUDIO",

                        fields: {
                            company:
                                form.company,

                            role:
                                form.role,

                            roundType:
                                form.roundType,

                            date:
                                form.date,

                            result:
                                form.result,

                            topics:
                                form.topics,

                            notes:
                                form.notes,
                        },

                        originalMediaName:
                            mediaType ===
                                "video"
                                ? mediaFile.name
                                : undefined,

                        originalMediaDurationSeconds:
                            mediaType ===
                                "video"
                                ? refreshedMetadata
                                    .durationSeconds
                                : undefined,

                        onStageChange:
                            setUploadStage,
                    });

                navigate(
                    `/interviews/${result.data.interview.id}`
                );
            } catch (
            uploadError
            ) {
                console.error(
                    `${mediaType} processing failed:`,
                    uploadError
                );

                setError(
                    getInterviewApiError(
                        uploadError,
                        `Failed to process and analyze ${mediaType} interview.`
                    )
                );
            } finally {
                setUploading(
                    false
                );

                setValidatingBeforeUpload(
                    false
                );

                setExtractingVideoAudio(
                    false
                );

                setUploadStage(
                    null
                );
            }
        };

    const selectedMediaDetails =
        mediaFile &&
            mediaMetadata
            ? formatSelectedMediaDetails(
                mediaFile,
                mediaMetadata
            )
            : null;

    const loadingText =
        getUploadLoadingText(
            validatingBeforeUpload,
            extractingVideoAudio,
            uploadStage
        );

    if (
        uploading
    ) {
        return (
            <InterviewPageSkeleton
                variant="detail"
                label={
                    loadingText
                }
            />
        );
    }

    return (
        <form
            onSubmit={
                handleSubmit
            }
            className="space-y-5"
        >
            <PageSurface padding="lg">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            <IconTile
                                tone="brand"
                                size="sm"
                            >
                                <Icon
                                    size={
                                        17
                                    }
                                    aria-hidden="true"
                                />
                            </IconTile>

                            <h2 className="text-base font-semibold text-text-primary">
                                {
                                    config.title
                                }
                            </h2>
                        </div>

                        <p className="mt-3 max-w-3xl text-sm leading-6 text-text-secondary">
                            {
                                config.description
                            }
                        </p>
                    </div>
                </div>

                {error && (
                    <StatusNotice
                        tone="error"
                        className="mt-5"
                    >
                        {
                            error
                        }
                    </StatusNotice>
                )}

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <TextField
                        label="Company"
                        value={
                            form.company
                        }
                        onChange={(
                            event
                        ) =>
                            updateField(
                                "company",
                                event.target.value
                            )
                        }
                        placeholder="TCS, Infosys, Amazon"
                        required
                    />

                    <TextField
                        label="Role"
                        value={
                            form.role
                        }
                        onChange={(
                            event
                        ) =>
                            updateField(
                                "role",
                                event.target.value
                            )
                        }
                        placeholder="Java Developer Intern"
                        required
                    />

                    <SelectField
                        label="Round type"
                        value={
                            form.roundType
                        }
                        onChange={(
                            event
                        ) =>
                            updateField(
                                "roundType",
                                event.target
                                    .value as InterviewRoundType
                            )
                        }
                        options={
                            roundTypeOptions
                        }
                    />

                    <SelectField
                        label="Result"
                        value={
                            form.result
                        }
                        onChange={(
                            event
                        ) =>
                            updateField(
                                "result",
                                event.target
                                    .value as InterviewResult
                            )
                        }
                        options={
                            resultOptions
                        }
                    />

                    <TextField
                        label="Date"
                        type="date"
                        value={
                            form.date
                        }
                        onChange={(
                            event
                        ) =>
                            updateField(
                                "date",
                                event.target.value
                            )
                        }
                        leadingIcon={
                            <CalendarDays
                                size={
                                    16
                                }
                                aria-hidden="true"
                            />
                        }
                        required
                    />

                    <TextField
                        label="Topics"
                        value={
                            form.topics
                        }
                        onChange={(
                            event
                        ) =>
                            updateField(
                                "topics",
                                event.target.value
                            )
                        }
                        placeholder="Java, OOP, DBMS"
                        description="Separate topics with commas."
                    />
                </div>

                <TextAreaField
                    label="Notes"
                    value={
                        form.notes
                    }
                    onChange={(
                        event
                    ) =>
                        updateField(
                            "notes",
                            event.target.value
                        )
                    }
                    placeholder="Optional context about this interview..."
                    className="min-h-28"
                    containerClassName="mt-4"
                />
            </PageSurface>

            <PageSurface padding="lg">
                <p className="text-sm font-semibold text-text-secondary">
                    {
                        config.fileLabel
                    }
                </p>

                <label
                    htmlFor={
                        fileInputId
                    }
                    aria-busy={
                        isBusy
                    }
                    className={`group relative mt-3 flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-tertiary px-5 py-7 text-center transition ${isBusy
                        ? "cursor-not-allowed opacity-70"
                        : "cursor-pointer hover:border-brand"
                        }`}
                >
                    <input
                        ref={
                            fileInputRef
                        }
                        id={
                            fileInputId
                        }
                        type="file"
                        accept={
                            config.accept
                        }
                        onChange={
                            handleFileChange
                        }
                        disabled={
                            isBusy
                        }
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                        aria-label={
                            config.fileLabel
                        }
                    />

                    <IconTile
                        tone="brand"
                        size="lg"
                    >
                        <Upload
                            size={
                                22
                            }
                            aria-hidden="true"
                        />
                    </IconTile>

                    <p className="mt-4 max-w-full break-words text-sm font-semibold text-text-primary">
                        {validatingMedia
                            ? "Reading media details..."
                            : mediaFile
                                ? mediaFile.name
                                : config.emptyFileLabel}
                    </p>

                    <p className="mt-1 text-xs text-text-tertiary">
                        {validatingMedia
                            ? "Checking format and duration..."
                            : selectedMediaDetails ??
                            config.fileHelp}
                    </p>
                </label>
            </PageSurface>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <ActionButton
                    type="button"
                    variant="secondary"
                    onClick={() =>
                        navigate(
                            "/interviews"
                        )
                    }
                    disabled={
                        isBusy
                    }
                >
                    Cancel
                </ActionButton>

                <ActionButton
                    type="submit"
                    disabled={
                        isBusy ||
                        !mediaFile ||
                        !mediaMetadata
                    }
                    loading={
                        uploading
                    }
                    loadingText={
                        loadingText
                    }
                    leadingIcon={
                        <Sparkles
                            size={
                                16
                            }
                            aria-hidden="true"
                        />
                    }
                >
                    {
                        config.submitLabel
                    }
                </ActionButton>
            </div>
        </form>
    );
};
