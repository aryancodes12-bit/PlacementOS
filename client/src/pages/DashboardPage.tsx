import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Code2, FileText, Flame, Mic, UserRound } from "lucide-react";

import { useAuthStore } from "../store/authStore";
import { AppLayout } from "../components/ui/AppLayout";
import { ReadinessRing } from "../components/dashboard/ReadinessRing";
import { StatCard } from "../components/dashboard/StatCard";
import { CompanyReadiness } from "../components/dashboard/CompanyReadiness";
import { DailyActionPlan } from "../components/dashboard/DailyActionPlan";
import { ProfileCompletionCard } from "../components/dashboard/ProfileCompletionCard";

import { dsaService, readinessService } from "../services/dsa.service";
import { interviewService } from "../services/interview.service";
import { profileService } from "../services/profile.service";

export const DashboardPage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [readiness, setReadiness] = useState<any>(null);
    const [streak, setStreak] = useState(0);
    const [dsaStats, setDsaStats] = useState<any>(null);
    const [interviewStats, setInterviewStats] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [
                    readinessResponse,
                    streakResponse,
                    dsaResponse,
                    interviewStatsResponse,
                    profileResponse,
                ] = await Promise.all([
                    readinessService.getMe(),
                    dsaService.getStreak(),
                    dsaService.getAll(),
                    interviewService.getStats(),
                    profileService.getMe(),
                ]);

                setReadiness(readinessResponse.data);
                setStreak(streakResponse.data.currentStreak);
                setDsaStats(dsaResponse.data.stats);
                setInterviewStats(interviewStatsResponse.data);
                setProfile(profileResponse.data.data?.profile ?? profileResponse.data.profile);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchDashboardData();
    }, []);

    const hour = new Date().getHours();

    const greeting =
        hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    const overall = readiness?.overallScore ?? 0;
    const dsaScore = readiness?.dsaScore ?? 0;
    const resumeScore = readiness?.resumeScore ?? 0;
    const interviewScore = readiness?.interviewScore ?? 0;
    const aptitudeScore = readiness?.aptitudeScore ?? 0;

    const totalInterviews = interviewStats?.totalInterviews ?? 0;
    const averageConfidence = interviewStats?.averageConfidenceScore ?? 0;
    const averageTechnical = interviewStats?.averageTechnicalScore ?? 0;

    const weakTopic =
        interviewStats?.mostMissedConcepts?.[0]?.name ||
        interviewStats?.mostRepeatedTopics?.[0]?.name ||
        "No weak topic yet";

    const topInterviewAction =
        interviewStats?.nextActions?.[0] ||
        "Analyze your latest interview replay to generate next actions.";

    const hasDsaActivity = (dsaStats?.total ?? 0) > 0;
    const hasInterviewActivity = totalInterviews > 0;
    const profileSkills = profile?.skills ?? [];
    const profileTargetCompanies = profile?.targetCompanies ?? [];
    const interviewCompanies =
        interviewStats?.companyBreakdown?.map((item: any) => item.company) ?? [];

    const targetCompanies =
        profileTargetCompanies.length > 0
            ? profileTargetCompanies
            : interviewCompanies;

    const readyFor = (readiness?.readyFor ?? []).filter((company: string) =>
        targetCompanies.includes(company)
    );

    const improveFor = targetCompanies.filter(
        (company: string) => !readyFor.includes(company)
    );
    const hasProfileDetails =
        profileSkills.length > 0 ||
        profileTargetCompanies.length > 0 ||
        Boolean(profile?.bio) ||
        Boolean(profile?.college) ||
        Boolean(profile?.graduationYear);

    const hasResumeActivity = resumeScore > 0;
    const actions = [
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
        hasInterviewActivity
            ? {
                type: "info" as const,
                title: "Interview next action",
                message: topInterviewAction,
            }
            : {
                type: "info" as const,
                title: "Log your first interview replay",
                message:
                    "Add one mock or real interview to start tracking weak topics, confidence, and next actions.",
            },
    ];

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
                    <ReadinessRing score={overall} />

                    <div className="w-full space-y-2">
                        {[
                            { label: "DSA", val: dsaScore, color: "#6366F1" },
                            { label: "Resume", val: resumeScore, color: "#22C55E" },
                            { label: "Interview", val: interviewScore, color: "#F59E0B" },
                            { label: "Aptitude", val: aptitudeScore, color: "#3B82F6" },
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

                                <span className="text-[11px] text-text-secondary w-8 text-right">
                                    {Math.round(val)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="DSA Problems"
                        value={loadingData ? "..." : dsaStats?.solved ?? 0}
                        subtitle={`${dsaStats?.total ?? 0} total · ${dsaStats?.unsolved ?? 0
                            } unsolved`}
                        icon={Code2}
                        color="brand"
                        onClick={() => navigate("/dsa")}
                    />

                    <StatCard
                        title="Resume Score"
                        value={resumeScore > 0 ? `${Math.round(resumeScore)}%` : "Pending"}
                        subtitle="Upload resume to generate ATS score"
                        icon={FileText}
                        color="success"
                        onClick={() => navigate("/resume")}
                    />

                    <StatCard
                        title="Interviews Logged"
                        value={loadingData ? "..." : totalInterviews}
                        subtitle={
                            totalInterviews > 0
                                ? `Avg confidence ${averageConfidence}/10 · Weak: ${weakTopic}`
                                : "Log your first interview replay"
                        }
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
                                🔥 {streak} day streak
                            </p>
                            <p className="text-xs text-text-tertiary">
                                Complete one activity today: solve a DSA problem, update your
                                profile, or log an interview replay.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate("/dsa")}
                            className="ml-auto bg-bg-tertiary hover:bg-bg-hover border border-border hover:border-border-hover text-text-secondary hover:text-text-primary px-4 py-2 rounded-xl text-sm transition-all"
                        >
                            Add problem
                        </button>
                    </div>
                </div>
            </div>

            {hasInterviewActivity && (
                <div className="grid grid-cols-12 gap-4 mb-4">
                    <div className="col-span-12 bg-bg-secondary border border-border rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h3 className="text-base font-semibold text-text-primary">
                                    Interview Replay Intelligence
                                </h3>
                                <p className="text-sm text-text-tertiary mt-1">
                                    AI-generated interview insights from your latest replays.
                                </p>
                            </div>

                            <button
                                onClick={() => navigate("/interviews")}
                                className="bg-bg-tertiary hover:bg-bg-hover border border-border hover:border-border-hover text-text-secondary hover:text-text-primary px-4 py-2 rounded-xl text-sm transition"
                            >
                                Open Replays
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="bg-bg-tertiary border border-border rounded-xl p-4">
                                <p className="text-xs uppercase tracking-wide text-text-tertiary">
                                    Avg Confidence
                                </p>
                                <p className="text-xl font-bold text-text-primary mt-1">
                                    {averageConfidence}/10
                                </p>
                            </div>

                            <div className="bg-bg-tertiary border border-border rounded-xl p-4">
                                <p className="text-xs uppercase tracking-wide text-text-tertiary">
                                    Avg Technical
                                </p>
                                <p className="text-xl font-bold text-text-primary mt-1">
                                    {averageTechnical}/10
                                </p>
                            </div>

                            <div className="bg-bg-tertiary border border-border rounded-xl p-4">
                                <p className="text-xs uppercase tracking-wide text-text-tertiary">
                                    Weak Topic
                                </p>
                                <p className="text-xl font-bold text-text-primary mt-1 truncate">
                                    {weakTopic}
                                </p>
                            </div>

                            <div className="bg-bg-tertiary border border-border rounded-xl p-4">
                                <p className="text-xs uppercase tracking-wide text-text-tertiary">
                                    Interview Score
                                </p>
                                <p className="text-xl font-bold text-text-primary mt-1">
                                    {Math.round(interviewScore)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-12 gap-4 mb-4">
                <div className="col-span-12 lg:col-span-7">
                    <DailyActionPlan actions={actions} />
                </div>

                <div className="col-span-12 lg:col-span-5">
                    <CompanyReadiness readyFor={readyFor} improveFor={improveFor} />
                </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-5">
                    <ProfileCompletionCard
                        completedItems={[
                            "Account created",
                            ...(hasProfileDetails ? ["Profile details"] : []),
                            ...(hasDsaActivity ? ["DSA activity"] : []),
                            ...(hasInterviewActivity ? ["Interview replay"] : []),
                            ...(hasResumeActivity ? ["Resume upload"] : []),
                        ]}
                        missingItems={[
                            ...(hasProfileDetails ? [] : ["Profile details"]),
                            ...(hasResumeActivity ? [] : ["Resume upload"]),
                            ...(hasDsaActivity ? [] : ["DSA activity"]),
                            ...(hasInterviewActivity ? [] : ["Interview replay"]),
                        ]}
                    />
                </div>

                <div className="col-span-12 lg:col-span-7">
                    <div className="bg-bg-secondary border border-border rounded-2xl p-5 h-full">
                        <h3 className="text-sm font-semibold text-text-primary mb-4">
                            Recent Activity
                        </h3>

                        {hasInterviewActivity ? (
                            <div className="space-y-3">
                                {interviewStats.recentInterviews.slice(0, 3).map((interview: any) => (
                                    <div
                                        key={interview.id}
                                        className="bg-bg-tertiary border border-border rounded-xl px-4 py-3"
                                    >
                                        <p className="text-sm font-medium text-text-primary">
                                            Interview replay logged
                                        </p>
                                        <p className="text-xs text-text-tertiary mt-1">
                                            {interview.company} · {interview.role}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : hasDsaActivity ? (
                            <div className="bg-bg-tertiary border border-border rounded-xl px-4 py-3">
                                <p className="text-sm font-medium text-text-primary">
                                    DSA activity found
                                </p>
                                <p className="text-xs text-text-tertiary mt-1">
                                    {dsaStats?.total ?? 0} problems tracked.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-bg-tertiary border border-border rounded-xl px-4 py-3">
                                <p className="text-sm font-medium text-text-primary">No activity yet</p>
                                <p className="text-xs text-text-tertiary mt-1">
                                    Start by completing your profile, solving DSA, or logging an interview.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};