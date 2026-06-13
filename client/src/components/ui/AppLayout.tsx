import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
    action?: ReactNode;
}

export const AppLayout = ({
    children,
    title,
    description,
    action,
}: AppLayoutProps) => {
    return (
        <div className="flex min-h-screen bg-bg-primary">
            <Sidebar />

            <main className="ml-60 flex-1 min-h-screen p-8">
                {title && (
                    <Topbar title={title} description={description} action={action} />
                )}

                {children}
            </main>
        </div>
    );
};