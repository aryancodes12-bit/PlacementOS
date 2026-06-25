import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileNavigationDrawer } from "./MobileNavigationDrawer";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
    action?: ReactNode;
}

export const AppLayout = ({ children, title, description, action }: AppLayoutProps) => {
    const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setMobileNavigationOpen(false);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary">
            <Sidebar />
            <MobileNavigationDrawer open={mobileNavigationOpen} onClose={() => setMobileNavigationOpen(false)} />

            <div className="min-w-0 lg:pl-64">
                <main className="app-shell-content mx-auto min-h-screen w-full max-w-[1600px] px-4 pt-3 sm:px-6 sm:pt-5 lg:px-8 lg:pt-8">
                    {title && (
                        <Topbar
                            title={title}
                            description={description}
                            action={action}
                            onOpenNavigation={() => setMobileNavigationOpen(true)}
                        />
                    )}
                    <div className="app-shell-enter min-w-0">{children}</div>
                </main>
            </div>

            <MobileBottomNav onOpenMore={() => setMobileNavigationOpen(true)} />
        </div>
    );
};
