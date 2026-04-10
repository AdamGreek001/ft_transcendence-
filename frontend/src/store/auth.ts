import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
    accessToken: string | null;
    user: User | null;
    isHydrated: boolean;
    setAuth: (token: string, user: User) => void;
    clearAuth: () => void;
    setHydrated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    user: null,
    isHydrated: false,

    setAuth: (accessToken, user) => {
        set({ accessToken, user });
    },

    clearAuth: () => {
        set({ accessToken: null, user: null });
    },

    setHydrated: () => set({ isHydrated: true }),
}));
