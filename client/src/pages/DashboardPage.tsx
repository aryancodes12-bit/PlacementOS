import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

import { AppLayout } from "../components/ui/AppLayout";
import { ReadinessRing } from "../components/dashboard/ReadinessRing";
import { StatCard } from "../components/dashboard/StatCard";
import { CompanyReadiness } from "../components/dashboard/CompanyReadiness";
import { DailyActionPlan } from "../components/dashboard/DailyActionPlan";
import { ProfileCompletionCard } from "../components/dashboard/ProfileCompletionCard";
import { RecentActivity } from "../components/dashboard/RecentActivity";

import { Code2, FileText, Flame, Mic, UserRound } from "lucide-react";
import { useEffect, useState } from 'react'
import { readinessService, dsaService } from '../services/dsa.service'

// Component ke andar:
const [readiness, setReadiness] = useState<any>(null)
const [streak, setStreak] = useState(0)
const [dsaStats, setDsaStats] = useState<any>(null)
const [loadingData, setLoadingData] = useState(true)

useEffect(() => {
    const fetchAll = async () => {
        try {
            const [r, s, d] = await Promise.all([
                readinessService.getMe(),
                dsaService.getStreak(),
                dsaService.getAll(),
            ])
            setReadiness(r.data)
            setStreak(s.data.currentStreak)
            setDsaStats(d.data.stats)
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingData(false)
        }
    }
    fetchAll()
}, [])
const DASHBOARD_STATE = {
    overall: 18,
    dsa: 0,
    resume: 0,
    interview: 0,
    aptitude: 0,
    readyFor: [] as string[],
    improveFor: ["TCS", "Infosys", "Accenture", "JPMorgan"],
};

const ACTIONS = [
    {
        type: "info" as const,
        title: "Complete your profile",
        message:
            "Add skills and target companies to personalize your placement dashboard.",
    },
    {
        type: "warning" as const,
        title: "Resume analysis pending",
        message:
            "Upload your latest resume to identify missing keywords and improve ATS readiness.",
    },
    {
        type: "info" as const,
        title: "No interviews logged yet",
        message:
            "After your first mock or real interview, log it here to track weak areas.",
    },
];

export const DashboardPage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const hour = new Date().getHours();

    const greeting =
        hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    return (
        <AppLayout
            title={`${greeting}, ${user?.name?.split(" ")[0] || "Student"} 👋`}
            description="Track your placement readiness across resume, interviews, and preparation."
            action={
                <button
                    onClick={() => navigate("/profile")}
                    className="bg-brand hover:bg-brand-hover text-white font-medium px-4 py-2 rounded-xl transition-all duration-200 text-sm flex items-center gap-2"
                >
                    <UserRound size={14} />
                    Complete Profile
                </button>
            }
        >
            <div className="grid grid-cols-12 gap-4 mb-4">
                <div className="col-span-12 lg:col-span-3 bg-bg-secondary border border-border rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
                    <ReadinessRing score={DASHBOARD_STATE.overall} />

                    <div className="w-full space-y-2">
                        {[
                            { label: "DSA", val: DASHBOARD_STATE.dsa, color: "#6366F1" },
                            { label: "Resume", val: DASHBOARD_STATE.resume, color: "#22C55E" },
                            {
                                label: "Interview",
                                val: DASHBOARD_STATE.interview,
                                color: "#F59E0B",
                            },
                            {
                                label: "Aptitude",
                                val: DASHBOARD_STATE.aptitude,
                                color: "#3B82F6",
                            },
                        ].map(({ label, val, color }) => (
                            <div key={label} className="flex items-center gap-2">
                                <span className="text-[11px] text-text-tertiary w-16">
                                    {label}
                                </span>

                                <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${val}%`, backgroundColor: color }}
                                    />
                                </div>

                                <span className="text-[11px] text-text-secondary w-6 text-right">
                                    {val}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="DSA Problems"
                        value="0"
                        subtitle="Start tracking solved problems by topic"
                        icon={Code2}
                        color="brand"
                        onClick={() => navigate("/dsa")}
                    />

                    <StatCard
                        title="Resume Score"
                        value="Pending"
                        subtitle="Upload resume to generate ATS score"
                        icon={FileText}
                        color="success"
                        onClick={() => navigate("/resume")}
                    />

                    <StatCard
                        title="Interviews Logged"
                        value="0"
                        subtitle="Add your first interview replay"
                        icon={Mic}
                        color="warning"
                        onClick={() => navigate("/interviews")}
                    />

                    <div className="md:col-span-3 bg-bg-secondary border border-border rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-warning-muted border border-warning/10 flex items-center justify-center flex-shrink-0">
                            <Flame size={18} className="text-warning" />
                        </div>

                        <div>
                            <p className="text-lg font-bold text-text-primary">
                                Start your preparation streak
                            </p>
                            <p className="text-xs text-text-tertiary">
                                Complete one activity today: update profile, upload resume, or log interview.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate("/profile")}
                            className="ml-auto bg-bg-tertiary hover:bg-bg-hover border border-border hover:border-border-hover text-text-secondary hover:text-text-primary px-4 py-2 rounded-xl text-sm transition-all"
                        >
                            Start now
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-4 mb-4">
                <div className="col-span-12 lg:col-span-7">
                    <DailyActionPlan actions={ACTIONS} />
                </div>

                <div className="col-span-12 lg:col-span-5">
                    <CompanyReadiness
                        readyFor={DASHBOARD_STATE.readyFor}
                        improveFor={DASHBOARD_STATE.improveFor}
                    />
                </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-5">
                    <ProfileCompletionCard
                        completedItems={["Account created"]}
                        missingItems={[
                            "Profile details",
                            "Resume upload",
                            "DSA activity",
                            "Interview replay",
                        ]}
                    />
                </div>

                <div className="col-span-12 lg:col-span-7">
                    <RecentActivity />
                </div>
            </div>
        </AppLayout>
    );
};