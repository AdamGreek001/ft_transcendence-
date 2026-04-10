"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import Cookies from "js-cookie";

export function useAuth() {
    const { accessToken, user, setAuth, clearAuth, isHydrated, setHydrated } =
        useAuthStore();

    useEffect(() => {
        if (!isHydrated) {
            const storedToken = Cookies.get("token");
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
        Cookies.remove("token", { path: "/" });
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
