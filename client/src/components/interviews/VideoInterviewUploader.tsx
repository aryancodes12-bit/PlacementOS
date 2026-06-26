import {
    InterviewMediaUploader,
} from "./InterviewMediaUploader";

import type {
    InterviewAnalysisLoadingHandler,
} from "./InterviewMediaUploader";

interface VideoInterviewUploaderProps {
    onAnalysisLoadingChange?: InterviewAnalysisLoadingHandler;
}

export const VideoInterviewUploader = ({
    onAnalysisLoadingChange,
}: VideoInterviewUploaderProps) => {
    return (
        <InterviewMediaUploader
            mediaType="video"
            onAnalysisLoadingChange={
                onAnalysisLoadingChange
            }
        />
    );
};
