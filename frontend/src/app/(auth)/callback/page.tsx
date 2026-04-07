"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/utils";
import Cookies from "js-cookie";

export default function OAuthCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const called = useRef(false);

    useEffect(() => {
        const code = searchParams.get("code");
        
        if (code && !called.current) {
            called.current = true;

            api.post("/auth/google/callback", { code })
                .then((res) => {
                    const { accessToken } = res.data;
                    if (accessToken) {
                        Cookies.set("token", accessToken, { expires: 7, path: "/" });
                        router.push("/feed");
                    }
                })
                .catch((err) => {
                    console.error("Google Auth Error:", err);
                    router.push("/login?error=oauth_failed");
                });
        }
    }, [searchParams, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-900">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4 mx-auto"></div>
                <p className="text-lg text-gray-400">Finalizing your login…</p>
            </div>
        </div>
    );
}