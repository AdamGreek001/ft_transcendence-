"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const called = useRef(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const user = searchParams.get("user");

    if (token && user && !called.current) {
      called.current = true;

      try {
        Cookies.set("token", token, { expires: 7, path: "/" });
        localStorage.setItem("user", user);
        router.push("/feed");
      } catch (err) {
        console.error("Failed to store auth:", err);
        router.push("/login?error=oauth_failed");
      }
    } else if (!token && !user && !called.current) {
      // If no token/user in URL, check for code (fallback for old flow)
      const code = searchParams.get("code");
      if (code) {
        called.current = true;
        router.push("/login?error=oauth_failed");
      }
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
