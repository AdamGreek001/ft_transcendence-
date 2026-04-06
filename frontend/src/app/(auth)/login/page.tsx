"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { AuthResponse } from "@/types";

export default function LoginPage() {
    const t = useTranslations("auth");
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await apiClient.post<AuthResponse>("/auth/login", {
                email,
                password,
            });
            setAuth(response.accessToken, response.user);
            router.push("/");
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || "Login failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <h1 className="mb-6 text-center text-2xl font-bold text-white">
                {t("login")}
            </h1>
            {error && (
                <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-300">
                    {t("email")}
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-300">
                    {t("password")}
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
                    />
                </label>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
                >
                    {isLoading ? "Signing in..." : t("login")}
                </button>
                <button
                    type="button"
                    className="rounded-lg border border-gray-600 bg-gray-800 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-700"
                >
                    Log in with Google
                </button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-400">
                <Link href="/register" className="text-primary-400 hover:underline">
                    {t("register")}
                </Link>
            </p>
        </>
    );
}
