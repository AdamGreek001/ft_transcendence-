"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function OAuthCallbackPage() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const code = searchParams.get("code");
        if (code) {
            // Exchange Google authorization code with the backend
            fetch("/api/auth/google/callback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.accessToken) {
                        localStorage.setItem("accessToken", data.accessToken);
                        window.location.href = "/feed";
                    }
                })
                .catch(() => {
                    window.location.href = "/login";
                });
        }
    }, [searchParams]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <p className="text-lg text-gray-600">Authenticating…</p>
        </div>
    );
}
