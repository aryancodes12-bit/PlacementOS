import { NavLink } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { mobilePrimaryNavigationItems } from "./navigation";

interface MobileBottomNavProps {
    onOpenMore: () => void;
}

export const MobileBottomNav = ({ onOpenMore }: MobileBottomNavProps) => {
    return (
        <nav aria-label="Mobile primary navigation" className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg-secondary/96 px-2 pt-2 backdrop-blur-xl lg:hidden">
            <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
                {mobilePrimaryNavigationItems.map((item) => {
                    const Icon = item.icon;
                    const shortLabel = item.label === "Daily Plan" ? "Plan" : item.label === "DSA Tracker" ? "DSA" : item.label;
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => [
                                "mobile-nav-button flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5",
                                "text-[10px] font-semibold outline-none transition duration-200",
                                "focus-visible:ring-2 focus-visible:ring-brand/70",
                                isActive ? "bg-brand/15 text-[#A5B4FC]" : "text-text-tertiary hover:bg-bg-hover hover:text-text-primary",
                            ].join(" ")}
                        >
                            <Icon size={19} aria-hidden="true" />
                            <span className="max-w-full truncate">{shortLabel}</span>
                        </NavLink>
                    );
                })}

                <button type="button" onClick={onOpenMore} className="mobile-nav-button flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold text-text-tertiary outline-none transition duration-200 hover:bg-bg-hover hover:text-text-primary active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/70">
                    <MoreHorizontal size={20} aria-hidden="true" />
                    More
                </button>
            </div>
        </nav>
    );
};
