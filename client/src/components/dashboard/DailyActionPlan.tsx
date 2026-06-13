import { Sparkles, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'

interface Action {
    type: 'warning' | 'success' | 'info'
    title: string
    message: string
}

interface Props {
    actions: Action[]
    loading?: boolean
}

const iconMap = {
    warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning-muted' },
    success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success-muted' },
    info: { icon: ArrowRight, color: 'text-brand', bg: 'bg-brand-muted' },
}

export const DailyActionPlan = ({ actions, loading }: Props) => {
    return (
        <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-brand-muted flex items-center justify-center">
                    <Sparkles size={14} className="text-brand" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary">
                    Today's Action Plan
                </h3>
                <span className="badge-brand ml-auto">AI</span>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 bg-bg-tertiary rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {actions.map((action, i) => {
                        const { icon: Icon, color, bg } = iconMap[action.type]
                        return (
                            <div key={i}
                                className="flex items-start gap-3 p-3 bg-bg-tertiary
                           rounded-xl border border-border hover:border-border-hover
                           transition-all duration-150">
                                <div className={`w-7 h-7 rounded-lg ${bg} flex items-center
                                 justify-center mt-0.5 flex-shrink-0`}>
                                    <Icon size={12} className={color} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-text-primary">
                                        {action.title}
                                    </p>
                                    <p className="text-xs text-text-tertiary mt-0.5">
                                        {action.message}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}