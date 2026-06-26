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

import {
    interviewService,
} from "../../services/interview.service";

import type {
    InterviewResult,
    InterviewRoundType,
    InterviewUploadResponse,
} from "../../services/interview.service";

import {
    readInterviewMediaMetadata,
} from "../../lib/media/interviewMediaMetadata";

import type {
    InterviewMediaMetadata,
} from "../../lib/media/interviewMediaMetadata";

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

type UploadResponse =
    Promise<{
        data: InterviewUploadResponse;
    }>;

interface InterviewMediaUploaderProps {
    mediaType: MediaType;
}

interface MediaConfig {
    accept: string;
    description: string;
    emptyFileLabel: string;
    fileFieldName: MediaType;
    fileHelp: string;
    fileLabel: string;
    Icon: typeof FileAudio;
    submitLabel: string;
    title: string;
    upload: (
        data: FormData
    ) => UploadResponse;
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
            "Upload a mock or real interview audio. PlacementOS will transcribe it, analyze weak concepts, generate scores, and save the replay.",
        emptyFileLabel:
            "Choose an audio file",
        fileFieldName:
            "audio",
        fileHelp:
            "MP3, WAV, M4A, WEBM, or OGG up to 50 MB",
        fileLabel:
            "Audio file",
        Icon:
            FileAudio,
        submitLabel:
            "Upload & Analyze",
        title:
            "Upload Audio Interview",
        upload:
            interviewService.uploadAudio,
    },

    video: {
        accept:
            "video/*,.mp4,.webm,.mov",
        description:
            "Upload a mock or real interview video. PlacementOS will validate its duration before processing the interview replay.",
        emptyFileLabel:
            "Choose a video file",
        fileFieldName:
            "video",
        fileHelp:
            "MP4, WEBM, or MOV up to 50 MB and 30 minutes",
        fileLabel:
            "Video file",
        Icon:
            Video,
        submitLabel:
            "Upload Video & Analyze",
        title:
            "Upload Video Interview",
        upload:
            interviewService.uploadVideo,
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

const getMetadataErrorMessage = (
    error: unknown,
    mediaType: MediaType
): string => {
    if (
        error instanceof Error &&
        error.message
    ) {
        return error.message;
    }

    return `Unable to validate the selected ${mediaType} file.`;
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

export const InterviewMediaUploader = ({
    mediaType,
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
        error,
        setError,
    ] =
        useState("");

    const Icon =
        config.Icon;

    useEffect(() => {
        return () => {
            mediaValidationRequestRef.current +=
                1;
        };
    }, []);

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
                    getMetadataErrorMessage(
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
                    getMetadataErrorMessage(
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

            try {
                const formData =
                    new FormData();

                formData.append(
                    "company",
                    form.company.trim()
                );

                formData.append(
                    "role",
                    form.role.trim()
                );

                formData.append(
                    "roundType",
                    form.roundType
                );

                formData.append(
                    "date",
                    form.date
                );

                formData.append(
                    "result",
                    form.result
                );

                formData.append(
                    "topics",
                    form.topics.trim()
                );

                formData.append(
                    "notes",
                    form.notes.trim()
                );

                formData.append(
                    config.fileFieldName,
                    mediaFile
                );

                const {
                    data,
                } =
                    await config.upload(
                        formData
                    );

                navigate(
                    `/interviews/${data.interview.id}`
                );
            } catch (
            uploadError
            ) {
                console.error(
                    `${mediaType} upload failed:`,
                    uploadError
                );

                setError(
                    getInterviewApiError(
                        uploadError,
                        `Failed to upload and analyze ${mediaType} interview.`
                    )
                );
            } finally {
                setUploading(
                    false
                );

                setValidatingBeforeUpload(
                    false
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
                                event
                                    .target
                                    .value
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
                                event
                                    .target
                                    .value
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
                                event
                                    .target
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
                                event
                                    .target
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
                                event
                                    .target
                                    .value
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
                                event
                                    .target
                                    .value
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
                            event
                                .target
                                .value
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
                        validatingMedia
                    }
                    className={`group relative mt-3 flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-tertiary px-5 py-7 text-center transition ${uploading ||
                            validatingMedia
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
                            uploading ||
                            validatingMedia
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
                        uploading ||
                        validatingMedia
                    }
                >
                    Cancel
                </ActionButton>

                <ActionButton
                    type="submit"
                    disabled={
                        validatingMedia ||
                        uploading ||
                        !mediaFile ||
                        !mediaMetadata
                    }
                    loading={
                        uploading
                    }
                    loadingText={
                        validatingBeforeUpload
                            ? "Validating media..."
                            : "Uploading & analyzing..."
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