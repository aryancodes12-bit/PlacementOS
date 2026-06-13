import { CheckCircle2, XCircle } from 'lucide-react'

interface Props {
    readyFor: string[]
    improveFor: string[]
}

export const CompanyReadiness = ({ readyFor, improveFor }: Props) => {
    return (
        <div className="card p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
                Target Companies
            </h3>

            <div className="space-y-4">
                {readyFor.length > 0 && (
                    <div>
                        <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">
                            Ready for
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {readyFor.map((company) => (
                                <div key={company}
                                    className="flex items-center gap-1.5 bg-success-muted
                             border border-success/10 rounded-lg px-3 py-1.5">
                                    <CheckCircle2 size={12} className="text-success" />
                                    <span className="text-xs font-medium text-success">
                                        {company}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {improveFor.length > 0 && (
                    <div>
                        <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">
                            Need improvement
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {improveFor.map((company) => (
                                <div key={company}
                                    className="flex items-center gap-1.5 bg-danger-muted
                             border border-danger/10 rounded-lg px-3 py-1.5">
                                    <XCircle size={12} className="text-danger" />
                                    <span className="text-xs font-medium text-danger">
                                        {company}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}