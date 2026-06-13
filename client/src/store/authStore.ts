import { create } from "zustand";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, accessToken: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: JSON.parse(localStorage.getItem("user") || "null"),
    accessToken: localStorage.getItem("accessToken"),
    isAuthenticated: !!localStorage.getItem("accessToken"),

    setAuth: (user, accessToken) => {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("accessToken", accessToken);

        set({
            user,
            accessToken,
            isAuthenticated: true,
        });
    },

    logout: () => {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");

        set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
        });
    },
}));