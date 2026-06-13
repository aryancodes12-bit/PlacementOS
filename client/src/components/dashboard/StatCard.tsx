import type { LucideIcon } from "lucide-react";
interface Props {
    title: string
    value: string | number
    subtitle: string
    icon: LucideIcon
    trend?: { value: string; positive: boolean }
    color?: 'brand' | 'success' | 'warning' | 'danger'
    onClick?: () => void
}

const colorMap = {
    brand: { bg: 'bg-[#6366F120]', text: 'text-[#6366F1]', border: 'border-[#6366F115]' },
    success: { bg: 'bg-[#22C55E15]', text: 'text-[#22C55E]', border: 'border-[#22C55E15]' },
    warning: { bg: 'bg-[#F59E0B15]', text: 'text-[#F59E0B]', border: 'border-[#F59E0B15]' },
    danger: { bg: 'bg-[#EF444415]', text: 'text-[#EF4444]', border: 'border-[#EF444415]' },
}

export const StatCard = ({
    title, value, subtitle, icon: Icon,
    trend, color = 'brand', onClick
}: Props) => {
    const c = colorMap[color]

    return (
        <div
            onClick={onClick}
            className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-5
                 cursor-pointer hover:border-[#2E2E42] hover:shadow-lg
                 transition-all duration-200"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border}
                         flex items-center justify-center`}>
                    <Icon size={16} className={c.text} />
                </div>
                {trend && (
                    <span className={
                        trend.positive
                            ? 'bg-[#22C55E15] text-[#22C55E] text-xs font-medium px-2.5 py-1 rounded-full'
                            : 'bg-[#EF444415] text-[#EF4444] text-xs font-medium px-2.5 py-1 rounded-full'
                    }>
                        {trend.positive ? '↑' : '↓'} {trend.value}
                    </span>
                )}
            </div>

            <p className="text-2xl font-bold text-[#F1F1F5] mb-0.5">{value}</p>
            <p className="text-xs font-medium text-[#9090A8] uppercase tracking-wide">
                {title}
            </p>
            <p className="text-xs text-[#5A5A72] mt-1">{subtitle}</p>
        </div>
    )
}