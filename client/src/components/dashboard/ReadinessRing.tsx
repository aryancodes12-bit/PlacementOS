interface Props {
    score: number
    size?: number
}

export const ReadinessRing = ({ score, size = 120 }: Props) => {
    const radius = 46
    const cx = size / 2
    const cy = size / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference
    const color = score >= 75 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444'
    const label = score >= 75 ? 'Strong' : score >= 50 ? 'Growing' : 'Needs Work'

    return (
        <div className="flex flex-col items-center gap-2">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Glow filter */}
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Track */}
                <circle cx={cx} cy={cy} r={radius}
                    fill="none" stroke="#1A1A24" strokeWidth="8" />

                {/* Progress */}
                <circle
                    cx={cx} cy={cy} r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${cx} ${cy})`}
                    filter="url(#glow)"
                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
                />

                {/* Score text */}
                <text x={cx} y={cy - 6} textAnchor="middle"
                    fill="#F1F1F5" fontSize="22" fontWeight="700"
                    fontFamily="Inter, sans-serif">
                    {score}
                </text>
                <text x={cx} y={cy + 12} textAnchor="middle"
                    fill="#5A5A72" fontSize="10"
                    fontFamily="Inter, sans-serif">
                    readiness
                </text>
            </svg>

            <span className="text-xs font-medium"
                style={{ color }}>
                {label}
            </span>
        </div>
    )
}