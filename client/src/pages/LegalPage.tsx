import {
    ArrowLeft,
    ShieldCheck,
} from "lucide-react";

import {
    Link,
} from "react-router-dom";

interface LegalPageProps {
    type: "terms" | "privacy";
}

const privacySections = [
    {
        title: "Information stored",
        paragraphs: [
            "PlacementOS may store your profile preferences, DSA progress, revision history, resume analysis, interview records, readiness history, daily plans, feedback, and payment-demo records.",
        ],
    },
    {
        title: "How information is used",
        paragraphs: [
            "Your information is used to provide preparation analytics, personalised plans, readiness calculations, application functionality, support, and account management.",
        ],
    },
    {
        title: "Account deletion",
        paragraphs: [
            "You can permanently delete your PlacementOS account and associated database records from the Settings page.",
            "Cloud-hosted media and external payment-provider records may require separate cleanup and may be subject to provider retention requirements.",
        ],
    },
    {
        title: "Data sharing",
        paragraphs: [
            "PlacementOS does not sell your personal preparation data. Third-party services are used only where required to provide application functionality.",
        ],
    },
];

const termsSections = [
    {
        title: "Use of PlacementOS",
        paragraphs: [
            "PlacementOS is a preparation and productivity application. Its scores, recommendations, and AI-generated analysis are guidance tools and do not guarantee employment or interview outcomes.",
        ],
    },
    {
        title: "Account responsibility",
        paragraphs: [
            "You are responsible for maintaining the security of your account credentials and for the accuracy of information submitted through your account.",
        ],
    },
    {
        title: "Acceptable use",
        paragraphs: [
            "You must not attempt to disrupt the service, access another user's data, abuse third-party integrations, or use PlacementOS for unlawful activity.",
        ],
    },
    {
        title: "Service availability",
        paragraphs: [
            "Features may change, be improved, or become temporarily unavailable during maintenance, development, or third-party service interruptions.",
        ],
    },
];

export const LegalPage = ({
    type,
}: LegalPageProps) => {
    const isPrivacy = type === "privacy";

    const title = isPrivacy
        ? "Privacy policy"
        : "Terms of use";

    const description = isPrivacy
        ? "How PlacementOS handles account and preparation data."
        : "The conditions governing your use of PlacementOS.";

    const sections = isPrivacy
        ? privacySections
        : termsSections;

    return (
        <div className="min-h-screen bg-[#050816] px-5 py-10 text-white sm:py-16">
            <div className="mx-auto max-w-3xl">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-slate-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                    <ArrowLeft size={15} />
                    Back to PlacementOS
                </Link>

                <div className="mt-10 rounded-[28px] border border-white/[0.08] bg-[#0b1020] p-6 sm:p-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
                        <ShieldCheck
                            size={21}
                            className="text-indigo-300"
                        />
                    </div>

                    <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
                        {title}
                    </h1>

                    <p className="mt-3 text-sm leading-7 text-slate-400">
                        {description}
                    </p>

                    <p className="mt-2 text-xs text-slate-600">
                        Last updated: 21 June 2026
                    </p>

                    <div className="mt-10 space-y-9">
                        {sections.map((section) => (
                            <section
                                key={section.title}
                            >
                                <h2 className="text-lg font-semibold text-white">
                                    {section.title}
                                </h2>

                                <div className="mt-3 space-y-3">
                                    {section.paragraphs.map(
                                        (paragraph) => (
                                            <p
                                                key={
                                                    paragraph
                                                }
                                                className="text-sm leading-7 text-slate-400"
                                            >
                                                {
                                                    paragraph
                                                }
                                            </p>
                                        )
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>

                    <div className="mt-10 rounded-xl border border-amber-400/10 bg-amber-500/[0.06] px-4 py-3 text-xs leading-6 text-amber-200/80">
                        This document is an application-level
                        policy draft and should be legally
                        reviewed before commercial or
                        production-scale use.
                    </div>
                </div>
            </div>
        </div>
    );
};