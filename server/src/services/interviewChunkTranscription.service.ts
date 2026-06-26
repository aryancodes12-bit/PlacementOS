import {
    transcribeInterviewAudio,
} from "./openaiInterview.service";

import {
    combineInterviewChunkTranscripts,
} from "../utils/interviewTranscript.utils";

const INTERVIEW_AUDIO_UPLOAD_LIMIT_BYTES =
    24 * 1024 * 1024;

const CHUNK_FILENAME_PATTERN =
    /(?:^|-)part-(\d+)-of-(\d+)(?:\.[^.]+)?$/i;

interface ParsedInterviewAudioChunk {
    file: Express.Multer.File;
    partNumber: number;
    totalParts: number;
}

export interface InterviewChunkTranscriptionResult {
    transcript: string;
    chunkTranscripts: string[];
    chunkCount: number;
}

export class InterviewChunkValidationError
    extends Error {
    constructor(
        message: string
    ) {
        super(
            message
        );

        this.name =
            "InterviewChunkValidationError";
    }
}

const parseInterviewAudioChunk = (
    file: Express.Multer.File
): ParsedInterviewAudioChunk => {
    if (
        file.size <= 0 ||
        file.buffer.length <= 0
    ) {
        throw new InterviewChunkValidationError(
            `Audio chunk "${file.originalname}" is empty.`
        );
    }

    if (
        file.size >
        INTERVIEW_AUDIO_UPLOAD_LIMIT_BYTES
    ) {
        throw new InterviewChunkValidationError(
            `Audio chunk "${file.originalname}" exceeds the 24 MB upload limit.`
        );
    }

    const match =
        file.originalname.match(
            CHUNK_FILENAME_PATTERN
        );

    if (!match) {
        throw new InterviewChunkValidationError(
            `Invalid chunk filename "${file.originalname}". Expected a name containing part-001-of-003.`
        );
    }

    const partNumber =
        Number(
            match[1]
        );

    const totalParts =
        Number(
            match[2]
        );

    if (
        !Number.isInteger(
            partNumber
        ) ||
        !Number.isInteger(
            totalParts
        ) ||
        partNumber < 1 ||
        totalParts < 1 ||
        partNumber >
        totalParts
    ) {
        throw new InterviewChunkValidationError(
            `Invalid chunk numbering in "${file.originalname}".`
        );
    }

    return {
        file,
        partNumber,
        totalParts,
    };
};

const orderInterviewAudioChunks = (
    files: Express.Multer.File[]
): ParsedInterviewAudioChunk[] => {
    if (
        files.length ===
        0
    ) {
        throw new InterviewChunkValidationError(
            "At least one interview audio chunk is required."
        );
    }

    const parsedChunks =
        files.map(
            parseInterviewAudioChunk
        );

    const expectedTotal =
        parsedChunks[0]
            .totalParts;

    if (
        files.length !==
        expectedTotal
    ) {
        throw new InterviewChunkValidationError(
            `Expected ${expectedTotal} audio chunks but received ${files.length}.`
        );
    }

    const partNumbers =
        new Set<number>();

    for (
        const chunk
        of parsedChunks
    ) {
        if (
            chunk.totalParts !==
            expectedTotal
        ) {
            throw new InterviewChunkValidationError(
                "All audio chunks must declare the same total number of parts."
            );
        }

        if (
            partNumbers.has(
                chunk.partNumber
            )
        ) {
            throw new InterviewChunkValidationError(
                `Duplicate audio chunk part ${chunk.partNumber}.`
            );
        }

        partNumbers.add(
            chunk.partNumber
        );
    }

    for (
        let partNumber = 1;
        partNumber <=
        expectedTotal;
        partNumber += 1
    ) {
        if (
            !partNumbers.has(
                partNumber
            )
        ) {
            throw new InterviewChunkValidationError(
                `Audio chunk part ${partNumber} is missing.`
            );
        }
    }

    return parsedChunks.sort(
        (
            first,
            second
        ) =>
            first.partNumber -
            second.partNumber
    );
};

export const transcribeInterviewAudioChunks =
    async (
        files: Express.Multer.File[]
    ): Promise<InterviewChunkTranscriptionResult> => {
        const orderedChunks =
            orderInterviewAudioChunks(
                files
            );

        const chunkTranscripts:
            string[] =
            [];

        /*
         * Sequential processing avoids unnecessary
         * transcription API concurrency and preserves
         * deterministic chunk order.
         */
        for (
            const chunk
            of orderedChunks
        ) {
            const transcript =
                await transcribeInterviewAudio(
                    chunk.file.buffer,
                    chunk.file.originalname
                );

            chunkTranscripts.push(
                transcript.trim()
            );
        }

        const transcript =
            combineInterviewChunkTranscripts(
                chunkTranscripts
            );

        if (!transcript) {
            throw new Error(
                "No transcript could be generated from the uploaded audio chunks."
            );
        }

        return {
            transcript,
            chunkTranscripts,
            chunkCount:
                orderedChunks.length,
        };
    };