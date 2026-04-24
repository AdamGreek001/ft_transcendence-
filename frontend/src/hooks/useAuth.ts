"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import Cookies from "js-cookie";
import { apiClient } from "@/lib/api";

export function useAuth() {
    const { accessToken, user, setAuth, clearAuth, isHydrated, setHydrated } =
        useAuthStore();

    useEffect(() => {
        if (!isHydrated) {
            const storedToken = Cookies.get("token");
            const storedUser = localStorage.getItem("user");

            const hydrateAuth = async () => {
                if (!storedToken) {
                    clearAuth();
                    setHydrated();
                    return;
                }

                if (storedUser) {
                    try {
                        setAuth(storedToken, JSON.parse(storedUser));
                        setHydrated();
                        return;
                    } catch {
                        localStorage.removeItem("user");
                    }
                }

                try {
                    const me = await apiClient.get<any>("/users/me");
                    setAuth(storedToken, me);
                    localStorage.setItem("user", JSON.stringify(me));
                } catch {
                    localStorage.removeItem("user");
                    // Keep token-based session alive; pages can retry /users/me or use token-protected APIs.
                    setAuth(storedToken, null);
                } finally {
                    setHydrated();
                }
            };

            void hydrateAuth();
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
