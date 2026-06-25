import {
    useId,
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
    interviewService,
} from "../../services/interview.service";

import type {
    InterviewResult,
    InterviewRoundType,
    InterviewUploadResponse,
} from "../../services/interview.service";

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

import {
    useNavigate,
} from "react-router-dom";

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
        fileFieldName: "audio",
        fileHelp:
            "MP3, WAV, M4A, WEBM, or OGG up to 50 MB",
        fileLabel:
            "Audio file",
        Icon: FileAudio,
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
            "Upload a mock or real interview video. PlacementOS will save the video, transcribe the audio, analyze weak concepts, and generate a question-level replay.",
        emptyFileLabel:
            "Choose a video file",
        fileFieldName: "video",
        fileHelp:
            "MP4, WEBM, or MOV up to 50 MB",
        fileLabel:
            "Video file",
        Icon: Video,
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
        roundType: "TECHNICAL",
        date:
            new Date()
                .toISOString()
                .slice(0, 10),
        result: "PENDING",
        topics: "",
        notes: "",
    });

export const InterviewMediaUploader = ({
    mediaType,
}: InterviewMediaUploaderProps) => {
    const navigate =
        useNavigate();

    const fileInputId =
        useId();

    const config =
        mediaConfig[
            mediaType
        ];

    const [form, setForm] =
        useState<MediaUploadForm>(
            createInitialForm
        );

    const [mediaFile, setMediaFile] =
        useState<File | null>(
            null
        );

    const [uploading, setUploading] =
        useState(false);

    const [error, setError] =
        useState("");

    const Icon =
        config.Icon;

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

    const handleFileChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const nextFile =
            event.currentTarget
                .files?.[0] ??
            null;

        if (!nextFile) {
            setMediaFile(null);
            return;
        }

        const validationError =
            validateInterviewMedia(
                nextFile,
                mediaType
            );

        if (validationError) {
            setMediaFile(null);
            setError(
                validationError
            );
            event.currentTarget.value =
                "";
            return;
        }

        setMediaFile(
            nextFile
        );
        setError("");
    };

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

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

        if (!mediaFile) {
            setError(
                `Please select a ${mediaType} file.`
            );
            return;
        }

        const validationError =
            validateInterviewMedia(
                mediaFile,
                mediaType
            );

        if (validationError) {
            setError(
                validationError
            );
            return;
        }

        setUploading(true);
        setError("");

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
            } = await config.upload(
                formData
            );

            navigate(
                `/interviews/${data.interview.id}`
            );
        } catch (uploadError) {
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
            setUploading(false);
        }
    };

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
                                    size={17}
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
                                event.target
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
                                event.target
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
                                event.target
                                    .value
                            )
                        }
                        leadingIcon={
                            <CalendarDays
                                size={16}
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
                                event.target
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
                    className="group relative mt-3 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-tertiary px-5 py-7 text-center transition hover:border-brand"
                >
                    <input
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
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label={
                            config.fileLabel
                        }
                    />

                    <IconTile
                        tone="brand"
                        size="lg"
                    >
                        <Upload
                            size={22}
                            aria-hidden="true"
                        />
                    </IconTile>

                    <p className="mt-4 max-w-full break-words text-sm font-semibold text-text-primary">
                        {mediaFile
                            ? mediaFile.name
                            : config.emptyFileLabel}
                    </p>

                    <p className="mt-1 text-xs text-text-tertiary">
                        {
                            mediaFile
                                ? formatMediaSize(
                                    mediaFile.size
                                )
                                : config.fileHelp
                        }
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
                        uploading
                    }
                >
                    Cancel
                </ActionButton>

                <ActionButton
                    type="submit"
                    loading={
                        uploading
                    }
                    loadingText="Uploading & analyzing..."
                    leadingIcon={
                        <Sparkles
                            size={16}
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
