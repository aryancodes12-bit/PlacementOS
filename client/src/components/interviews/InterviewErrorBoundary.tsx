import {
    Component,
} from "react";

import type {
    ErrorInfo,
    ReactNode,
} from "react";

import {
    AlertTriangle,
    RefreshCw,
} from "lucide-react";

import {
    ActionButton,
} from "../ui/design-system/ActionButton";

import {
    EmptyState,
} from "../ui/design-system/EmptyState";

interface InterviewErrorBoundaryProps {
    children: ReactNode;
}

interface InterviewErrorBoundaryState {
    hasError: boolean;
}

export class InterviewErrorBoundary extends Component<
    InterviewErrorBoundaryProps,
    InterviewErrorBoundaryState
> {
    public state: InterviewErrorBoundaryState = {
        hasError: false,
    };

    public static getDerivedStateFromError():
        InterviewErrorBoundaryState {
        return {
            hasError: true,
        };
    }

    public componentDidCatch(
        error: Error,
        errorInfo: ErrorInfo
    ) {
        console.error(
            "Interview workspace rendering error:",
            {
                error,
                componentStack:
                    errorInfo.componentStack,
            }
        );
    }

    public render() {
        if (
            this.state.hasError
        ) {
            return (
                <EmptyState
                    title="Interview Replay could not be displayed"
                    description="A rendering error occurred. Your stored interviews and analysis reports were not changed."
                    icon={
                        <AlertTriangle
                            size={25}
                            aria-hidden="true"
                        />
                    }
                    iconTone="danger"
                    action={
                        <ActionButton
                            type="button"
                            leadingIcon={
                                <RefreshCw
                                    size={16}
                                    aria-hidden="true"
                                />
                            }
                            onClick={() =>
                                window.location.reload()
                            }
                        >
                            Reload workspace
                        </ActionButton>
                    }
                />
            );
        }

        return this.props.children;
    }
}