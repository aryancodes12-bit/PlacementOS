import { Building2, CheckCircle2, XCircle } from "lucide-react";

interface CompanyReadinessProps {
    readyFor: string[];
    improveFor: string[];
}

export const CompanyReadiness = ({
    readyFor,
    improveFor,
}: CompanyReadinessProps) => {
    const hasCompanies = readyFor.length > 0 || improveFor.length > 0;

    return (
        <div className="bg-bg-secondary border border-border rounded-2xl p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
                <Building2 size={16} className="text-brand" />
                <h3 className="text-sm font-semibold text-text-primary">
                    Company Readiness
                </h3>
            </div>

            {!hasCompanies ? (
                <div className="bg-bg-tertiary border border-border rounded-xl p-4">
                    <p className="text-sm font-medium text-text-primary">
                        No target companies yet
                    </p>
                    <p className="text-xs text-text-tertiary mt-1 leading-5">
                        Add target companies in your profile or log interviews to generate
                        company-wise readiness.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {readyFor.length > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-wide text-success mb-2">
                                Ready / Improving well
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {readyFor.map((company) => (
                                    <span
                                        key={company}
                                        className="bg-success-muted border border-success/10 text-success text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5"
                                    >
                                        <CheckCircle2 size={12} />
                                        {company}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {improveFor.length > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-wide text-danger mb-2">
                                Need improvement
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {improveFor.map((company) => (
                                    <span
                                        key={company}
                                        className="bg-danger-muted border border-danger/10 text-danger text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5"
                                    >
                                        <XCircle size={12} />
                                        {company}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};