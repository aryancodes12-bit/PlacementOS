import {
    interviewService,
} from "../../services/interview.service";

import type {
    InterviewResult,
    InterviewRoundType,
    InterviewSourceType,
    InterviewUploadResponse,
} from "../../services/interview.service";

import {
    generateInterviewAudioChunks,
} from "./interviewAudioChunkGeneration";

import {
    planInterviewAudioChunks,
    requiresInterviewAudioChunking,
} from "./interviewAudioChunks";

export type ProcessedInterviewSourceType =
    Extract<
        InterviewSourceType,
        "AUDIO" | "VIDEO"
    >;

export type InterviewProcessedAudioUploadStage =
    | "preparing"
    | "generating-chunks"
    | "uploading-single"
    | "uploading-chunks";

export interface InterviewProcessedAudioFormFields {
    company: string;
    role: string;
    roundType: InterviewRoundType;
    date: string;
    result: InterviewResult;
    topics: string;
    notes: string;
}

export interface UploadProcessedInterviewAudioInput {
    audioFile: File;
    durationSeconds: number;
    sourceType: ProcessedInterviewSourceType;
    fields: InterviewProcessedAudioFormFields;

    originalMediaName?: string;
    originalMediaDurationSeconds?: number;

    onStageChange?: (
        stage: InterviewProcessedAudioUploadStage
    ) => void;
}

export interface UploadProcessedInterviewAudioResult {
    data: InterviewUploadResponse;
    mode:
    | "single"
    | "chunked";
    chunkCount: number;
    uploadedAudioBytes: number;
}

const MAX_INTERVIEW_AUDIO_CHUNKS =
    100;

const validateProcessedAudio = (
    file: File,
    durationSeconds: number
): void => {
    if (
        file.size <= 0
    ) {
        throw new Error(
            "The processed interview audio file is empty."
        );
    }

    if (
        !Number.isFinite(
            durationSeconds
        ) ||
        durationSeconds <= 0
    ) {
        throw new Error(
            "The processed interview audio has an invalid duration."
        );
    }

    const fileName =
        file.name
            .trim()
            .toLowerCase();

    const hasAudioMimeType =
        file.type
            .trim()
            .toLowerCase()
            .startsWith(
                "audio/"
            );

    const hasSupportedExtension =
        [
            ".mp3",
            ".wav",
            ".m4a",
            ".webm",
            ".ogg",
        ].some(
            (extension) =>
                fileName.endsWith(
                    extension
                )
        );

    if (
        !hasAudioMimeType &&
        !hasSupportedExtension
    ) {
        throw new Error(
            "The processed media must be a supported audio file."
        );
    }
};

const appendCommonInterviewFields = (
    formData: FormData,
    fields: InterviewProcessedAudioFormFields
): void => {
    formData.append(
        "company",
        fields.company.trim()
    );

    formData.append(
        "role",
        fields.role.trim()
    );

    formData.append(
        "roundType",
        fields.roundType
    );

    formData.append(
        "date",
        fields.date
    );

    formData.append(
        "result",
        fields.result
    );

    formData.append(
        "topics",
        fields.topics.trim()
    );

    formData.append(
        "notes",
        fields.notes.trim()
    );
};

const appendOriginalMediaMetadata = (
    formData: FormData,
    sourceType: ProcessedInterviewSourceType,
    originalMediaName?: string,
    originalMediaDurationSeconds?: number
): void => {
    if (
        sourceType !==
        "VIDEO"
    ) {
        return;
    }

    if (
        originalMediaName
    ) {
        formData.append(
            "sourceVideoName",
            originalMediaName
        );
    }

    if (
        typeof originalMediaDurationSeconds ===
        "number" &&
        Number.isFinite(
            originalMediaDurationSeconds
        )
    ) {
        formData.append(
            "sourceVideoDurationSeconds",
            String(
                originalMediaDurationSeconds
            )
        );
    }
};

/**
 * Uploads already-processed interview audio.
 *
 * The caller is responsible for supplying optimized
 * interview audio. This function chooses between the
 * single-file and chunked backend contracts.
 */
export const uploadProcessedInterviewAudio =
    async ({
        audioFile,
        durationSeconds,
        sourceType,
        fields,
        originalMediaName,
        originalMediaDurationSeconds,
        onStageChange,
    }: UploadProcessedInterviewAudioInput): Promise<
        UploadProcessedInterviewAudioResult
    > => {
        onStageChange?.(
            "preparing"
        );

        validateProcessedAudio(
            audioFile,
            durationSeconds
        );

        if (
            !fields.company.trim() ||
            !fields.role.trim() ||
            !fields.date
        ) {
            throw new Error(
                "Company, role, and date are required."
            );
        }

        if (
            !requiresInterviewAudioChunking(
                audioFile.size
            )
        ) {
            const formData =
                new FormData();

            appendCommonInterviewFields(
                formData,
                fields
            );

            formData.append(
                "audio",
                audioFile
            );

            appendOriginalMediaMetadata(
                formData,
                sourceType,
                originalMediaName,
                originalMediaDurationSeconds
            );

            onStageChange?.(
                "uploading-single"
            );

            const response =
                sourceType ===
                    "VIDEO"
                    ? await interviewService.uploadVideo(
                        formData
                    )
                    : await interviewService.uploadAudio(
                        formData
                    );

            return {
                data:
                    response.data,

                mode:
                    "single",

                chunkCount:
                    1,

                uploadedAudioBytes:
                    audioFile.size,
            };
        }

        const windows =
            planInterviewAudioChunks({
                durationSeconds,
                sizeBytes:
                    audioFile.size,
            });

        if (
            windows.length >
            MAX_INTERVIEW_AUDIO_CHUNKS
        ) {
            throw new Error(
                `This interview requires ${windows.length} chunks, but the maximum supported count is ${MAX_INTERVIEW_AUDIO_CHUNKS}.`
            );
        }

        onStageChange?.(
            "generating-chunks"
        );

        const generatedChunks =
            await generateInterviewAudioChunks({
                audioFile,
                windows,
            });

        if (
            generatedChunks.length !==
            windows.length
        ) {
            throw new Error(
                "Some interview audio chunks could not be generated."
            );
        }

        const formData =
            new FormData();

        appendCommonInterviewFields(
            formData,
            fields
        );

        formData.append(
            "sourceType",
            sourceType
        );

        appendOriginalMediaMetadata(
            formData,
            sourceType,
            originalMediaName,
            originalMediaDurationSeconds
        );

        for (
            const chunk
            of generatedChunks
        ) {
            formData.append(
                "chunks",
                chunk.file
            );
        }

        onStageChange?.(
            "uploading-chunks"
        );

        const response =
            await interviewService.uploadChunks(
                formData
            );

        const uploadedAudioBytes =
            generatedChunks.reduce(
                (
                    total,
                    chunk
                ) =>
                    total +
                    chunk.sizeBytes,
                0
            );

        return {
            data:
                response.data,

            mode:
                "chunked",

            chunkCount:
                generatedChunks.length,

            uploadedAudioBytes,
        };
    };