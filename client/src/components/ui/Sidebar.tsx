import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
    LayoutDashboard,
    Code2,
    FileText,
    Mic,
    LogOut,
    User,
    Settings,
    Sparkles,
    Crown,
} from "lucide-react";

const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/daily-plan", icon: Sparkles, label: "Daily Plan" },
    { to: "/pricing", icon: Crown, label: "Premium" },
    { to: "/dsa", icon: Code2, label: "DSA Tracker" },
    { to: "/resume", icon: FileText, label: "Resume" },
    { to: "/interviews", icon: Mic, label: "Interviews" },
    { to: "/profile", icon: User, label: "Profile" },

];

export const Sidebar = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    return (
        <aside className="fixed left-0 top-0 h-screen w-60 bg-[#111118] border-r border-[#1E1E2E] flex flex-col z-50">
            <div className="px-6 py-5 border-b border-[#1E1E2E]">
                <h1 className="text-lg font-bold text-[#F1F1F5] tracking-tight">
                    Placement<span className="text-[#6366F1]">OS</span>
                </h1>
                <p className="text-[11px] text-[#5A5A72] mt-0.5 uppercase tracking-widest">
                    v1.0
                </p>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
                                ? "bg-[#6366F120] text-[#6366F1]"
                                : "text-[#9090A8] hover:text-[#F1F1F5] hover:bg-[#22222F]"
                            }`
                        }
                    >
                        <Icon size={16} className="flex-shrink-0" />
                        {label}
                    </NavLink>
                ))}
            </nav>

            <div className="px-3 py-4 border-t border-[#1E1E2E] space-y-0.5">
                <NavLink
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#9090A8] hover:text-[#F1F1F5] hover:bg-[#22222F] transition-all duration-150"
                >
                    <Settings size={16} />
                    Settings
                </NavLink>

                <button
                    onClick={() => {
                        logout();
                        navigate("/login");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#9090A8] hover:text-[#EF4444] hover:bg-[#EF444415] transition-all duration-150 cursor-pointer"
                >
                    <LogOut size={16} />
                    Logout
                </button>

                <div className="flex items-center gap-3 px-3 py-3 mt-2 bg-[#1A1A24] rounded-xl border border-[#1E1E2E]">
                    <div className="w-7 h-7 rounded-full bg-[#6366F120] border border-[#6366F130] flex items-center justify-center text-[#6366F1] text-xs font-bold flex-shrink-0">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                        <p className="text-xs font-medium text-[#F1F1F5] truncate">
                            {user?.name}
                        </p>
                        <p className="text-[11px] text-[#5A5A72] truncate">
                            {user?.email}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
};