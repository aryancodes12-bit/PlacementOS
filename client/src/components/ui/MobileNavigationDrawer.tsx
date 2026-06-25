import { useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { BrandLogo } from "./BrandLogo";
import { primaryNavigationItems, secondaryNavigationItems } from "./navigation";

interface MobileNavigationDrawerProps {
    open: boolean;
    onClose: () => void;
}

export const MobileNavigationDrawer = ({ open, onClose }: MobileNavigationDrawerProps) => {
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const userInitial = user?.name?.trim().charAt(0).toUpperCase() || "U";

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeButtonRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, onClose]);

    if (!open) return null;

    const handleLogout = () => {
        logout();
        onClose();
        navigate("/login", { replace: true });
    };

    return (
        <div className="fixed inset-0 z-[70] lg:hidden">
            <button type="button" aria-label="Close navigation" onClick={onClose} className="drawer-backdrop absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <section role="dialog" aria-modal="true" aria-label="Application navigation" className="drawer-panel absolute inset-y-0 left-0 flex w-[min(92vw,22rem)] max-w-[calc(100vw-1rem)] flex-col border-r border-border bg-bg-secondary shadow-2xl">
                <div className="app-safe-top flex items-center justify-between gap-3 border-b border-border px-3 py-3 sm:px-4 sm:py-4">
                    <BrandLogo
                        variant="sidebar"
                        priority
                        className="min-w-0"
                    />
                    <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close navigation menu" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-bg-tertiary text-text-secondary outline-none transition hover:text-text-primary active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/70">
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <nav aria-label="Mobile navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3 sm:py-4">
                    {[...primaryNavigationItems, ...secondaryNavigationItems].map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={onClose}
                                className={({ isActive }) => [
                                    "flex min-h-12 items-center gap-3 rounded-xl px-3 py-3",
                                    "text-sm font-medium outline-none transition duration-200",
                                    "focus-visible:ring-2 focus-visible:ring-brand/70",
                                    isActive ? "bg-brand/15 text-[#A5B4FC]" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
                                ].join(" ")}
                            >
                                <Icon size={18} className="shrink-0" aria-hidden="true" />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="app-safe-bottom border-t border-border px-3 py-3 sm:py-4">
                    <div className="mb-3 flex items-center gap-3 rounded-2xl border border-border bg-bg-tertiary p-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand/25 bg-brand/15 text-sm font-bold text-[#A5B4FC]">{userInitial}</div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-text-primary">{user?.name || "PlacementOS user"}</p>
                            <p className="truncate text-xs text-text-tertiary">{user?.email}</p>
                        </div>
                    </div>
                    <button type="button" onClick={handleLogout} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger outline-none transition hover:border-danger/40 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-danger/60">
                        <LogOut size={17} aria-hidden="true" />
                        Logout
                    </button>
                </div>
            </section>
        </div>
    );
};
