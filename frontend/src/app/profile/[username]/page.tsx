"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface ProfilePageProps {
    params: Promise<{ username: string }>;
}

interface UserProfileResponse {
    id: string;
    username: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    _count: {
        posts: number;
        followers: number;
        following: number;
    };
}

interface FollowingRelation {
    followingId: string;
    following?: { id: string };
}

interface FollowerRelation {
    followerId: string;
    follower?: { id: string };
}

interface StartConversationResponse {
    id: string;
}

export default function ProfilePage({ params }: ProfilePageProps) {
    const router = useRouter();
    const t = useTranslations("profile");
    const { user: currentUser } = useAuth();
    const [username, setUsername] = useState<string>("");
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFriend, setIsFriend] = useState(false);
    const [profileFollowsCurrent, setProfileFollowsCurrent] = useState(false);
    const [isFollowBusy, setIsFollowBusy] = useState(false);
    const [isStartChatBusy, setIsStartChatBusy] = useState(false);
    const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const loadProfile = async () => {
        const resolved = await params;
        setUsername(resolved.username);
        setIsLoading(true);
        setIsFollowing(false);
        setError(null);

        try {
            const data = await apiClient.get<UserProfileResponse>(`/users/${resolved.username}`);
            setProfile(data);
        } catch (err: any) {
            console.error("Failed to fetch profile:", err);
            const status = err?.response?.status;
            if (status === 404) {
                setProfile(null);
                setError("not_found");
            } else {
                // Keep existing profile if we had one (transient error)
                setProfile(prev => prev);
                setError("load_error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            const resolved = await params;
            if (cancelled) return;
            setUsername(resolved.username);
            setIsLoading(true);
            setIsFollowing(false);
            setError(null);

            try {
                const data = await apiClient.get<UserProfileResponse>(`/users/${resolved.username}`);
                if (cancelled) return;
                setProfile(data);
            } catch (err: any) {
                console.error("Failed to fetch profile:", err);
                if (cancelled) return;
                const status = err?.response?.status;
                if (status === 404) {
                    setProfile(null);
                    setError("not_found");
                } else {
                    setProfile(null);
                    setError("load_error");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [params]);

    useEffect(() => {
        let cancelled = false;

        const resolveFollowState = async () => {
            if (!currentUser?.id || !profile?.id) return;

            if (currentUser.username === profile.username) {
                setIsFollowing(false);
                setIsFriend(false);
                setProfileFollowsCurrent(false);
                return;
            }

            try {
                const [following, followers] = await Promise.all([
                    apiClient.get<FollowingRelation[]>(`/users/${currentUser.id}/following`),
                    apiClient.get<FollowerRelation[]>(`/users/${currentUser.id}/followers`),
                ]);
                if (cancelled) return;
                const followsProfile = following.some(
                    (item) => item.followingId === profile.id || item.following?.id === profile.id,
                );
                setIsFollowing(followsProfile);

                const profileFollowsCurrent = followers.some(
                    (item) => item.followerId === profile.id || item.follower?.id === profile.id,
                );
                setProfileFollowsCurrent(profileFollowsCurrent);
                setIsFriend(followsProfile && profileFollowsCurrent);
            } catch (error) {
                console.error("Failed to resolve follow state:", error);
                setProfileFollowsCurrent(false);
                setIsFriend(false);
            }
        };

        resolveFollowState();

        return () => {
            cancelled = true;
        };
    }, [currentUser?.id, currentUser?.username, profile?.id, profile?.username]);

    const handleToggleFollow = async () => {
        if (!profile) return;
        setIsFollowBusy(true);
        try {
            if (isFollowing) {
                await apiClient.delete(`/users/${profile.id}/follow`);
            } else {
                await apiClient.post(`/users/${profile.id}/follow`);
            }
            setIsFollowing((prev) => !prev);
            setProfile((prev) => {
                if (!prev) return prev;
                const followers = prev._count?.followers ?? 0;
                return {
                    ...prev,
                    _count: {
                        ...prev._count,
                        followers: isFollowing ? Math.max(0, followers - 1) : followers + 1,
                    },
                };
            });
            setIsFriend(isFollowing ? false : profileFollowsCurrent);
        } catch (error) {
            console.error("Failed to toggle follow:", error);
        } finally {
            setIsFollowBusy(false);
        }
    };

    const handleStartChat = async () => {
        if (!profile?.id || !isFriend) return;

        setIsStartChatBusy(true);
        try {
            const conv = await apiClient.post<StartConversationResponse>("/chat/conversations/start", {
                userId: profile.id,
            });
            router.push(`/messages?conversationId=${conv.id}`);
        } catch (error) {
            console.error("Failed to start chat:", error);
        } finally {
            setIsStartChatBusy(false);
        }
    };

    if (isLoading) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-8">
                <div className="rounded-xl border border-gray-800/50 bg-[#1a1a1f] p-6 shadow-sm text-gray-400">
                    Loading profile...
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-8">
                <div className="rounded-xl border border-gray-800/50 bg-[#1a1a1f] p-6 shadow-sm text-gray-400">
                    {error === "not_found" ? (
                        <>User @{username} not found.</>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <span>Failed to load profile. Please try again.</span>
                            <button
                                onClick={loadProfile}
                                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const isOwnProfile = currentUser?.username === profile.username;

    return (
        <div className="flex min-h-screen md:h-[100dvh] bg-[#0d0d0f]">
            {isNavSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setIsNavSidebarOpen(false)}
                        className="absolute inset-0 bg-black/60"
                        aria-label="Close navigation sidebar"
                    />
                    <div className="relative h-full w-[min(82vw,18rem)]">
                        <button
                            type="button"
                            onClick={() => setIsNavSidebarOpen(false)}
                            className="absolute right-3 top-3 z-10 p-2 rounded-full bg-black/40 text-white"
                            aria-label="Close sidebar"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <AppSidebar />
                    </div>
                </div>
            )}

            <div className="hidden lg:block">
                <AppSidebar />
            </div>

            <main className="flex-1 overflow-y-auto">
                <div className="sticky top-0 bg-[#0d0d0f]/95 backdrop-blur z-10 px-3 sm:px-4 py-3 border-b border-gray-800/50">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsNavSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-gray-800/50 rounded-full transition text-gray-300"
                            aria-label="Open navigation sidebar"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-base sm:text-lg font-semibold text-white">Profile</h1>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl px-4 py-8">
                    <div className="rounded-xl border border-gray-800/50 bg-[#1a1a1f] p-6 shadow-sm">
                <div className="flex items-center gap-6">
                    <Avatar
                        src={profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                        alt={profile.displayName || profile.username}
                        size={96}
                    />
                    <div>
                        <h1 className="text-2xl font-bold text-white">@{profile.username}</h1>
                        <p className="mt-1 text-sm text-gray-400">{profile.bio || "No bio yet"}</p>
                        <div className="mt-3 flex gap-6 text-sm text-gray-300">
                            <span><strong>{profile._count?.posts ?? 0}</strong> {t("posts")}</span>
                            <span><strong>{profile._count?.followers ?? 0}</strong> {t("followers")}</span>
                            <span><strong>{profile._count?.following ?? 0}</strong> {t("following")}</span>
                        </div>
                    </div>
                </div>

                {!isOwnProfile && (
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={handleToggleFollow}
                            disabled={isFollowBusy}
                            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${isFollowing ? "bg-gray-700 hover:bg-gray-600" : "bg-violet-600 hover:bg-violet-700"}`}
                        >
                            {isFollowBusy ? "..." : isFollowing ? "Following" : t("follow")}
                        </button>
                        {isFriend && (
                            <button
                                onClick={handleStartChat}
                                disabled={isStartChatBusy}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-[#2a2a2f] hover:bg-[#3a3a3f] transition"
                            >
                                {isStartChatBusy ? "..." : "Start Chat"}
                            </button>
                        )}
                    </div>
                )}
                    </div>
                </div>
            </main>
        </div>
    );
}
