import { useEffect, useMemo, useState } from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { readinessService } from "../../services/dsa.service";

const LINES = [
    { key: "overallScore", label: "Overall", color: "#6366F1" },
    { key: "dsaScore", label: "DSA", color: "#22C55E" },
    { key: "resumeScore", label: "Resume", color: "#F59E0B" },
    { key: "interviewScore", label: "Interview", color: "#3B82F6" },
];

const formatDateLabel = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
    });
};

const formatTimeLabel = (date: string) => {
    return new Date(date).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatFullLabel = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const ReadinessGraph = () => {
    const [history, setHistory] = useState<any[]>([]);
    const [activeLines, setActiveLines] = useState<string[]>(
        LINES.map((line) => line.key)
    );
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const [historyResponse, currentResponse] = await Promise.all([
                    readinessService.getHistory(),
                    readinessService.getMe(),
                ]);

                const rawHistory = historyResponse.data.history ?? [];
                const currentReadiness = currentResponse.data;

                const latestSnapshot = rawHistory[rawHistory.length - 1];

                const shouldAppendCurrent =
                    currentReadiness &&
                    (!latestSnapshot ||
                        Math.round(latestSnapshot.overallScore) !==
                        Math.round(currentReadiness.overallScore) ||
                        Math.round(latestSnapshot.dsaScore) !==
                        Math.round(currentReadiness.dsaScore) ||
                        Math.round(latestSnapshot.resumeScore) !==
                        Math.round(currentReadiness.resumeScore) ||
                        Math.round(latestSnapshot.interviewScore) !==
                        Math.round(currentReadiness.interviewScore) ||
                        Math.round(latestSnapshot.aptitudeScore) !==
                        Math.round(currentReadiness.aptitudeScore));

                const mergedHistory = shouldAppendCurrent
                    ? [
                        ...rawHistory,
                        {
                            id: "current",
                            createdAt: new Date().toISOString(),
                            overallScore: currentReadiness.overallScore,
                            dsaScore: currentReadiness.dsaScore,
                            resumeScore: currentReadiness.resumeScore,
                            interviewScore: currentReadiness.interviewScore,
                            aptitudeScore: currentReadiness.aptitudeScore,
                        },
                    ]
                    : rawHistory;

                const uniqueDates = new Set(
                    mergedHistory.map((item: any) => formatDateLabel(item.createdAt))
                );

                const shouldShowTime = uniqueDates.size <= 1;

                const formattedHistory = mergedHistory.map(
                    (item: any, index: number) => ({
                        ...item,
                        index: index + 1,
                        xLabel: shouldShowTime
                            ? formatTimeLabel(item.createdAt)
                            : formatDateLabel(item.createdAt),
                        tooltipLabel: formatFullLabel(item.createdAt),
                    })
                );

                setHistory(formattedHistory);
            } catch (error) {
                console.error("Failed to fetch readiness history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const chartStats = useMemo(() => {
        if (history.length === 0) {
            return {
                latestOverall: 0,
                change: 0,
            };
        }

        const first = history[0]?.overallScore ?? 0;
        const latest = history[history.length - 1]?.overallScore ?? 0;

        return {
            latestOverall: Math.round(latest),
            change: Math.round(latest - first),
        };
    }, [history]);

    const toggleLine = (key: string) => {
        setActiveLines((current) => {
            if (current.includes(key)) {
                if (current.length === 1) return current;
                return current.filter((line) => line !== key);
            }

            return [...current, key];
        });
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;

        const row = payload[0]?.payload;

        return (
            <div className="rounded-xl border border-border bg-bg-secondary px-3 py-2 shadow-xl">
                <p className="mb-2 text-xs text-text-tertiary">
                    {row?.tooltipLabel ?? label}
                </p>

                <div className="space-y-1">
                    {payload.map((item: any) => (
                        <div key={item.dataKey} className="flex items-center gap-2 text-xs">
                            <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />

                            <span className="text-text-secondary">
                                {LINES.find((line) => line.key === item.dataKey)?.label}:
                            </span>

                            <span className="font-semibold text-text-primary">
                                {Math.round(item.value)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="rounded-2xl border border-border bg-bg-secondary p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                        Readiness Progress
                    </h3>
                    <p className="mt-1 text-xs text-text-tertiary">
                        Tracks readiness changes across DSA, resume, and interview activity.
                    </p>

                    {history.length >= 2 && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="rounded-full bg-brand-muted px-2.5 py-1 text-xs font-medium text-brand">
                                Current {chartStats.latestOverall}%
                            </span>

                            <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${chartStats.change >= 0
                                        ? "bg-success-muted text-success"
                                        : "bg-danger-muted text-danger"
                                    }`}
                            >
                                {chartStats.change >= 0 ? "+" : ""}
                                {chartStats.change}% change
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {LINES.map((line) => {
                        const isActive = activeLines.includes(line.key);

                        return (
                            <button
                                key={line.key}
                                onClick={() => toggleLine(line.key)}
                                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${isActive
                                        ? "border-transparent"
                                        : "border-border text-text-tertiary opacity-50"
                                    }`}
                                style={
                                    isActive
                                        ? {
                                            backgroundColor: `${line.color}20`,
                                            color: line.color,
                                        }
                                        : undefined
                                }
                            >
                                <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{
                                        backgroundColor: isActive ? line.color : "#5A5A72",
                                    }}
                                />
                                {line.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading ? (
                <div className="h-64 animate-pulse rounded-xl bg-bg-tertiary" />
            ) : history.length < 2 ? (
                <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-bg-tertiary">
                    <p className="max-w-sm text-center text-sm text-text-tertiary">
                        More score updates are needed to draw a meaningful progress graph.
                    </p>
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-bg-tertiary px-3 py-4">
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart
                            data={history}
                            margin={{ top: 10, right: 16, left: -18, bottom: 0 }}
                        >
                            <CartesianGrid
                                stroke="#2A2A3A"
                                strokeDasharray="3 3"
                                vertical={false}
                            />

                            <XAxis
                                dataKey="xLabel"
                                tick={{ fill: "#9090A8", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                minTickGap={24}
                            />

                            <YAxis
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
                                tick={{ fill: "#9090A8", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />

                            <Tooltip content={<CustomTooltip />} />

                            {LINES.filter((line) => activeLines.includes(line.key)).map(
                                (line) => (
                                    <Line
                                        key={line.key}
                                        type="monotone"
                                        dataKey={line.key}
                                        stroke={line.color}
                                        strokeWidth={line.key === "overallScore" ? 3 : 2}
                                        dot={{
                                            r: 3,
                                            fill: line.color,
                                            strokeWidth: 0,
                                        }}
                                        activeDot={{
                                            r: 5,
                                            fill: line.color,
                                            strokeWidth: 0,
                                        }}
                                    />
                                )
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};