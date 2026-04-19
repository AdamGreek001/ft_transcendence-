"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
    const router = useRouter();
    const { user, isHydrated } = useAuth();

    useEffect(() => {
        if (!isHydrated) return;
        if (user?.username) {
            router.replace(`/profile/${user.username}`);
            return;
        }
        router.replace("/feed");
    }, [isHydrated, user, router]);

    return null;
}
