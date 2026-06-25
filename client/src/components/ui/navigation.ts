import type {
    LucideIcon,
} from "lucide-react";

import {
    Code2,
    Crown,
    FileText,
    LayoutDashboard,
    Map,
    Mic,
    Settings,
    Sparkles,
    User,
} from "lucide-react";

export interface AppNavigationItem {
    to: string;
    label: string;
    icon: LucideIcon;
}

export const primaryNavigationItems:
    AppNavigationItem[] = [
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

export const secondaryNavigationItems:
    AppNavigationItem[] = [
        {
            to: "/pricing",
            icon: Crown,
            label: "Premium",
        },
        {
            to: "/settings",
            icon: Settings,
            label: "Settings",
        },
    ];

export const mobilePrimaryNavigationItems:
    AppNavigationItem[] = [
        primaryNavigationItems[0],
        primaryNavigationItems[1],
        primaryNavigationItems[3],
        primaryNavigationItems[5],
    ];