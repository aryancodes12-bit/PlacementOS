import {
    NavLink,
    useNavigate,
} from "react-router-dom";

import {
    Code2,
    Crown,
    FileText,
    LayoutDashboard,
    LogOut,
    Map,
    Mic,
    Settings,
    Sparkles,
    User,
} from "lucide-react";

import {
    useAuthStore,
} from "../../store/authStore";

import {
    BrandLogo,
} from "./BrandLogo";

const navItems = [
    {
        to: "/dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
    },
    {
        to: "/daily-plan",
        icon: Sparkles,
        label: "Daily Plan",
    },
    {
        to: "/roadmap",
        icon: Map,
        label: "Full-Stack Roadmap",
    },
    {
        to: "/pricing",
        icon: Crown,
        label: "Premium",
    },
    {
        to: "/dsa",
        icon: Code2,
        label: "DSA Tracker",
    },
    {
        to: "/resume",
        icon: FileText,
        label: "Resume",
    },
    {
        to: "/interviews",
        icon: Mic,
        label: "Interviews",
    },
    {
        to: "/profile",
        icon: User,
        label: "Profile",
    },
];

export const Sidebar = () => {
    const user = useAuthStore(
        (state) => state.user
    );

    const logout = useAuthStore(
        (state) => state.logout
    );

    const navigate = useNavigate();

    const userInitial =
        user?.name
            ?.trim()
            .charAt(0)
            .toUpperCase() || "U";

    const handleLogout = () => {
        logout();

        navigate("/login", {
            replace: true,
        });
    };

    return (
        <aside className="fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r border-[#1E1E2E] bg-[#111118]">
            <div className="border-b border-[#1E1E2E] px-4 py-4">
                <button
                    type="button"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                    aria-label="Go to PlacementOS dashboard"
                    className="block w-full rounded-xl transition hover:opacity-95 active:scale-[0.98]"
                >
                    <BrandLogo
                        variant="auth"
                        priority
                    />
                </button>
            </div>

            <nav
                aria-label="Primary navigation"
                className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4"
            >
                {navItems.map(
                    ({
                        to,
                        icon: Icon,
                        label,
                    }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({
                                isActive,
                            }) =>
                                [
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5",
                                    "text-sm font-medium transition-all duration-150",
                                    isActive
                                        ? "bg-[#6366F1]/15 text-[#818CF8]"
                                        : "text-[#9090A8] hover:bg-[#22222F] hover:text-[#F1F1F5]",
                                ].join(
                                    " "
                                )
                            }
                        >
                            <Icon
                                size={16}
                                className="shrink-0"
                                aria-hidden="true"
                            />

                            <span>
                                {label}
                            </span>
                        </NavLink>
                    )
                )}
            </nav>

            <div className="space-y-0.5 border-t border-[#1E1E2E] px-3 py-4">
                <NavLink
                    to="/settings"
                    className={({
                        isActive,
                    }) =>
                        [
                            "flex items-center gap-3 rounded-xl px-3 py-2.5",
                            "text-sm font-medium transition-all duration-150",
                            isActive
                                ? "bg-[#6366F1]/15 text-[#818CF8]"
                                : "text-[#9090A8] hover:bg-[#22222F] hover:text-[#F1F1F5]",
                        ].join(" ")
                    }
                >
                    <Settings
                        size={16}
                        aria-hidden="true"
                    />

                    Settings
                </NavLink>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#9090A8] transition-all duration-150 hover:bg-[#EF4444]/10 hover:text-[#EF4444]"
                >
                    <LogOut
                        size={16}
                        aria-hidden="true"
                    />

                    Logout
                </button>

                <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#1E1E2E] bg-[#1A1A24] px-3 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#6366F1]/25 bg-[#6366F1]/15 text-xs font-bold text-[#818CF8]">
                        {userInitial}
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-[#F1F1F5]">
                            {user?.name ||
                                "PlacementOS user"}
                        </p>

                        <p className="truncate text-[11px] text-[#5A5A72]">
                            {user?.email}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
};