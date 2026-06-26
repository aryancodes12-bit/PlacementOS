import {
    Component,
} from "react";

import type {
    ErrorInfo,
    ReactNode,
} from "react";

import {
    AlertTriangle,
    Home,
    RefreshCw,
} from "lucide-react";

import {
    BrandLogo,
} from "./BrandLogo";

interface AppErrorBoundaryProps {
    children: ReactNode;
}

interface AppErrorBoundaryState {
    hasError: boolean;
}

export class AppErrorBoundary extends Component<
    AppErrorBoundaryProps,
    AppErrorBoundaryState
> {
    public state: AppErrorBoundaryState = {
        hasError: false,
    };

    public static getDerivedStateFromError():
        AppErrorBoundaryState {
        return {
            hasError: true,
        };
    }

    public componentDidCatch(
        error: Error,
        errorInfo: ErrorInfo
    ) {
        console.error(
            "PlacementOS rendering error:",
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
                <main className="flex min-h-screen items-center justify-center bg-[#050816] px-5 py-10 text-white">
                    <section
                        role="alert"
                        className="w-full max-w-lg rounded-3xl border border-white/[0.08] bg-[#0d1323]/95 p-6 text-center shadow-2xl shadow-black/30 sm:p-8"
                    >
                        <BrandLogo
                            variant="auth"
                            priority
                            className="justify-center"
                        />

                        <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-red-300">
                            <AlertTriangle
                                size={24}
                                aria-hidden="true"
                            />
                        </div>

                        <h1 className="mt-6 text-2xl font-bold tracking-tight">
                            Something went wrong
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-slate-400">
                            PlacementOS hit a rendering issue. Your saved
                            preparation data has not been changed.
                        </p>

                        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={() =>
                                    window.location.reload()
                                }
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
                            >
                                <RefreshCw
                                    size={16}
                                    aria-hidden="true"
                                />
                                Reload
                            </button>

                            <a
                                href="/"
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-indigo-400/30 hover:text-white"
                            >
                                <Home
                                    size={16}
                                    aria-hidden="true"
                                />
                                Back to home
                            </a>
                        </div>
                    </section>
                </main>
            );
        }

        return this.props.children;
    }
}
