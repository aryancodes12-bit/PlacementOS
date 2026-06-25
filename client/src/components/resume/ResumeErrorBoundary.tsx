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

interface ResumeErrorBoundaryProps {
    children: ReactNode;
}

interface ResumeErrorBoundaryState {
    hasError: boolean;
}

export class ResumeErrorBoundary extends Component<
    ResumeErrorBoundaryProps,
    ResumeErrorBoundaryState
> {
    public state: ResumeErrorBoundaryState = {
        hasError: false,
    };

    public static getDerivedStateFromError():
        ResumeErrorBoundaryState {
        return {
            hasError: true,
        };
    }

    public componentDidCatch(
        error: Error,
        info: ErrorInfo
    ) {
        console.error(
            "Resume workspace rendering error:",
            {
                error,
                componentStack:
                    info.componentStack,
            }
        );
    }

    public render() {
        if (
            this.state.hasError
        ) {
            return (
                <EmptyState
                    title="Resume Intelligence could not be displayed"
                    description="A rendering error occurred. Your stored resume data has not been changed."
                    icon={
                        <AlertTriangle
                            size={24}
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
