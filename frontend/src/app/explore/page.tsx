"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Avatar } from "@/components/ui";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface UserSuggestion {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isFollowing: boolean;
}

export default function ExplorePage() {
    const { isAuthenticated, isHydrated } = useAuth();
    const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserSuggestion[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [searchUsersError, setSearchUsersError] = useState("");
    const [isFollowBusyId, setIsFollowBusyId] = useState<string | null>(null);

    useEffect(() => {
        if (!isHydrated || !isAuthenticated) return;

        const query = searchQuery.trim();
        if (query.length < 2) {
            setSearchResults([]);
            setSearchUsersError("");
            return;
        }

        const timeout = setTimeout(async () => {
            setIsSearchingUsers(true);
            setSearchUsersError("");
            try {
                const results = await apiClient.get<UserSuggestion[]>(
                    `/users/find?q=${encodeURIComponent(query)}`,
                );
                setSearchResults(results);
            } catch (error) {
                console.error("Failed to search users:", error);
                setSearchResults([]);
                setSearchUsersError("Search is unavailable right now");
            } finally {
                setIsSearchingUsers(false);
            }
        }, 250);

        return () => clearTimeout(timeout);
    }, [searchQuery, isHydrated, isAuthenticated]);

    const toggleFollow = async (target: UserSuggestion) => {
        setIsFollowBusyId(target.id);
        try {
            if (target.isFollowing) {
                await apiClient.delete(`/users/${target.id}/follow`);
            } else {
                await apiClient.post(`/users/${target.id}/follow`);
            }

            setSearchResults((prev) =>
                prev.map((u) =>
                    u.id === target.id ? { ...u, isFollowing: !target.isFollowing } : u,
                ),
            );
        } catch (error) {
            console.error("Failed to toggle follow:", error);
        } finally {
            setIsFollowBusyId(null);
        }
    };

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
                        <h1 className="text-base sm:text-lg font-semibold text-white">Explore</h1>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl px-4 py-8">
                    <div className="mb-5 relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users to follow..."
                            className="w-full pl-10 pr-4 py-3 bg-[#1a1a1f] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 border border-gray-800/50"
                        />
                    </div>

                    <div className="space-y-3">
                        {isSearchingUsers && <p className="text-sm text-gray-500">Searching users...</p>}
                        {!isSearchingUsers && !!searchUsersError && (
                            <p className="text-sm text-red-400">{searchUsersError}</p>
                        )}
                        {!isSearchingUsers && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                            <p className="text-sm text-gray-500">No users found</p>
                        )}

                        {!isSearchingUsers && searchResults.map((u) => (
                            <div key={u.id} className="bg-[#1a1a1f] border border-gray-800/50 rounded-xl p-4 flex items-center gap-3">
                                <Avatar
                                    src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                                    alt={u.displayName || u.username}
                                    size={42}
                                />
                                <div className="flex-1 min-w-0">
                                    <Link href={`/profile/${u.username}`} className="block text-sm font-medium text-white truncate hover:text-violet-300 transition">
                                        {u.displayName || u.username}
                                    </Link>
                                    <Link href={`/profile/${u.username}`} className="block text-xs text-gray-500 truncate hover:text-gray-300 transition">
                                        @{u.username}
                                    </Link>
                                </div>
                                <button
                                    onClick={() => toggleFollow(u)}
                                    disabled={isFollowBusyId === u.id}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${u.isFollowing ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-violet-600 text-white hover:bg-violet-700"}`}
                                >
                                    {isFollowBusyId === u.id ? "..." : u.isFollowing ? "Following" : "Follow"}
                                </button>
                            </div>
                        ))}

                        {!searchQuery.trim() && (
                            <p className="text-sm text-gray-500">Start typing a username or display name to discover people.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
