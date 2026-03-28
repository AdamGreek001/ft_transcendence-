"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
    const t = useTranslations("auth");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        // Auth logic will be wired here
    }

    return (
        <>
            <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
                {t("login")}
            </h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    {t("email")}
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="rounded-lg border border-gray-300 px-4 py-2.5 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    {t("password")}
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="rounded-lg border border-gray-300 px-4 py-2.5 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                </label>
                <button
                    type="submit"
                    className="rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
                >
                    {t("login")}
                </button>
                <button
                    type="button"
                    className="rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                    Log in with Google
                </button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-500">
                <Link href="/register" className="text-primary-600 hover:underline">
                    {t("register")}
                </Link>
            </p>
        </>
    );
}
