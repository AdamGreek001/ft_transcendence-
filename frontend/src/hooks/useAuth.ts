"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";

export function useAuth() {
    const { accessToken, user, setAuth, clearAuth, isHydrated, setHydrated } =
        useAuthStore();

    useEffect(() => {
        if (!isHydrated) {
            const storedToken = localStorage.getItem("accessToken");
            const storedUser = localStorage.getItem("user");
            if (storedToken && storedUser) {
                try {
                    setAuth(storedToken, JSON.parse(storedUser));
                } catch {
                    clearAuth();
                }
            }
            setHydrated();
        }
    }, [isHydrated, setAuth, clearAuth, setHydrated]);

    const logout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        clearAuth();
        window.location.href = "/login";
    };

    return {
        isAuthenticated: !!accessToken,
        user,
        accessToken,
        logout,
        isHydrated,
    };
}
