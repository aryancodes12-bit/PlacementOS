import {
    InterviewMediaUploader,
} from "./InterviewMediaUploader";

import type {
    InterviewAnalysisLoadingHandler,
} from "./InterviewMediaUploader";

interface AudioInterviewUploaderProps {
    onAnalysisLoadingChange?: InterviewAnalysisLoadingHandler;
}

export const AudioInterviewUploader = ({
    onAnalysisLoadingChange,
}: AudioInterviewUploaderProps) => {
    return (
        <InterviewMediaUploader
            mediaType="audio"
            onAnalysisLoadingChange={
                onAnalysisLoadingChange
            }
        />
    );
};
