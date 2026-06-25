import {
    Link,
    NavLink,
    useNavigate,
} from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { BrandLogo } from "./BrandLogo";

import {
    primaryNavigationItems,
    secondaryNavigationItems,
} from "./navigation";

const linkClassName = ({ isActive }: { isActive: boolean }) =>
    [
        "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5",
        "text-sm font-medium outline-none transition duration-200",
        "focus-visible:ring-2 focus-visible:ring-brand/70",
        isActive
            ? "bg-brand/15 text-[#A5B4FC] shadow-[inset_0_0_0_1px_rgba(99,102,241,0.18)]"
            : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
    ].join(" ");

export const Sidebar = () => {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();
    const userInitial = user?.name?.trim().charAt(0).toUpperCase() || "U";

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-bg-secondary/95 backdrop-blur-xl lg:flex">
            <div className="border-b border-border px-4 py-4">
                <Link
                    to="/dashboard"
                    aria-label="Open PlacementOS dashboard"
                    className={[
                        "group flex min-h-12 items-center gap-3 rounded-xl px-2",
                        "outline-none transition duration-200",
                        "hover:bg-white/[0.035]",
                        "focus-visible:ring-2 focus-visible:ring-indigo-400/70",
                    ].join(" ")}
                >
                    <BrandLogo
                        variant="sidebar"
                        priority
                        className="transition duration-200 group-hover:scale-[1.02]"
                    />
                </Link>
            </div>

            <nav aria-label="Primary navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {primaryNavigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink key={item.to} to={item.to} className={linkClassName}>
                            <Icon size={17} className="shrink-0 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                            <span className="truncate">{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            <div className="space-y-1 border-t border-border px-3 py-4">
                {secondaryNavigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink key={item.to} to={item.to} className={linkClassName}>
                            <Icon size={17} className="shrink-0" aria-hidden="true" />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}

                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary outline-none transition duration-200 hover:bg-danger/10 hover:text-danger active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-danger/60"
                >
                    <LogOut size={17} aria-hidden="true" />
                    Logout
                </button>

                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-bg-tertiary px-3 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand/25 bg-brand/15 text-xs font-bold text-[#A5B4FC]">
                        {userInitial}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-text-primary">{user?.name || "PlacementOS user"}</p>
                        <p className="mt-0.5 truncate text-[11px] text-text-tertiary">{user?.email}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};
