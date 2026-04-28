"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { io, type Socket } from "socket.io-client";
import { Avatar } from "@/components/ui";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationsStore } from "@/store/notifications";
import { useAuthStore } from "@/store/auth";

type NotificationType = "like" | "follow" | "comment" | "mention" | "repost" | "message" | "system";

interface BackendNotification {
    id: string;
    type: string;
    message: string;
    read: boolean;
    createdAt: string;
    actor: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
    };
}

interface Notification {
    id: string;
    type: NotificationType;
    users: { name: string; avatarUrl: string; username?: string }[];
    content?: string;
    quotedContent?: string;
    time: string;
    isVerified?: boolean;
    read: boolean;
}

interface NotificationsResponse {
    notifications: BackendNotification[];
    total: number;
    hasMore: boolean;
}

interface UserSuggestion {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isFollowing: boolean;
}

interface FollowingRelation {
    followingId: string;
    following: {
        id: string;
        username: string;
    };
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function mapBackendNotification(n: BackendNotification): Notification {
    const typeMap: Record<string, NotificationType> = {
        like: "like",
        follow: "follow",
        comment: "comment",
        mention: "mention",
        repost: "repost",
        message: "message",
        system: "system",
    };

    return {
        id: n.id,
        type: typeMap[n.type] || "like",
        users: [{
            name: n.actor?.displayName || n.actor?.username || "Someone",
            avatarUrl: n.actor?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.actor?.username}`,
            username: n.actor?.username,
        }],
        content: n.message,
        time: formatTimeAgo(n.createdAt),
        read: n.read,
    };
}

function NotificationIcon({ type }: { type: NotificationType }) {
    switch (type) {
        case "like":
            return (
                <div className="w-8 h-8 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                </div>
            );
        case "follow":
            return (
                <div className="w-8 h-8 flex items-center justify-center">
                    <svg className="w-5 h-5 text-violet-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                </div>
            );
        case "comment":
        case "mention":
            return (
                <div className="w-8 h-8 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
                    </svg>
                </div>
            );
        case "repost":
            return (
                <div className="w-8 h-8 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                    </svg>
                </div>
            );
        case "message":
            return (
                <div className="w-8 h-8 flex items-center justify-center">
                    <svg className="w-5 h-5 text-violet-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                    </svg>
                </div>
            );
        default:
            return (
                <div className="w-8 h-8 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                    </svg>
                </div>
            );
    }
}

export default function NotificationsPage() {
    const { isAuthenticated, isHydrated, user } = useAuth();
    const token = useAuthStore((s) => s.accessToken);
    const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(false);
    const [isFindUsersOpen, setIsFindUsersOpen] = useState(false);
    const [notificationsSearchQuery, setNotificationsSearchQuery] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserSuggestion[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [searchUsersError, setSearchUsersError] = useState<string>("");
    const [isFollowBusyId, setIsFollowBusyId] = useState<string | null>(null);
    const [currentUserProfile, setCurrentUserProfile] = useState<{
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
    } | null>(null);
    const [followingUsernames, setFollowingUsernames] = useState<Set<string>>(new Set());
    const socketRef = useRef<Socket | null>(null);
    const { setUnreadCount, markAsRead: markStoreAsRead, markAllAsRead: markStoreAllAsRead } = useNotificationsStore();

    // Initialize WebSocket for real-time notifications
    useEffect(() => {
        if (!token) return;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
        const socket = io(`${wsUrl}/notifications`, {
            auth: { token },
            transports: ["websocket"],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on("connect", () => {
            console.log("Notifications WebSocket connected on page");
        });

        // Listen for new notifications
        socket.on("notification", (data: any) => {
            console.log("Received real-time notification:", data);
            const notification = mapBackendNotification(data);
            setNotifications(prev => [notification, ...prev]);
        });

        // Listen for unread count updates
        socket.on("notification:count", (data: { count: number }) => {
            console.log("Unread count update:", data.count);
            setUnreadCount(data.count);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, [token, setUnreadCount]);

    // Fetch initial notifications on page load
    useEffect(() => {
        if (!isHydrated || !isAuthenticated) return;

        // Restore cached notifications immediately to avoid flash of empty state
        try {
            const cached = sessionStorage.getItem("notifications_cache");
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setNotifications(parsed);
                }
            }
        } catch {
            // Ignore cache parse errors.
        }

        const fetchNotifications = async () => {
            setIsLoading(true);
            try {
                const data = await apiClient.get<NotificationsResponse>("/notifications");
                const mapped = (data.notifications || []).map(mapBackendNotification);
                setNotifications(mapped);
                sessionStorage.setItem("notifications_cache", JSON.stringify(mapped));
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
                // Don't clear existing notifications on transient errors (e.g., 429 rate limit)
                // Only set empty if we had no notifications to begin with
                setNotifications(prev => prev.length > 0 ? prev : []);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();
    }, [isHydrated, isAuthenticated]);

    useEffect(() => {
        if (isHydrated && !isAuthenticated) {
            setIsLoading(false);
        }
    }, [isHydrated, isAuthenticated]);

    useEffect(() => {
        if (!isHydrated || !isAuthenticated) return;

        apiClient
            .get<{ username: string; displayName: string | null; avatarUrl: string | null }>("/users/me")
            .then((profile) => setCurrentUserProfile(profile))
            .catch((error) => console.error("Failed to fetch current user profile:", error));
    }, [isHydrated, isAuthenticated]);

    useEffect(() => {
        if (!isHydrated || !isAuthenticated || !user?.id) return;

        const fetchFollowing = async () => {
            try {
                const data = await apiClient.get<FollowingRelation[]>(`/users/${user.id}/following`);
                const usernames = new Set(
                    (data || [])
                        .map((item) => item.following?.username?.toLowerCase())
                        .filter((name): name is string => !!name),
                );
                setFollowingUsernames(usernames);
            } catch (error) {
                console.error("Failed to fetch following list:", error);
                setFollowingUsernames(new Set());
            }
        };

        fetchFollowing();
    }, [isHydrated, isAuthenticated, user?.id]);

    const markAsRead = async (id: string) => {
        try {
            // Update local state optimistically
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            markStoreAsRead(id);
            
            // Call API to persist to database
            await apiClient.patch(`/notifications/${id}/read`);
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
            // Revert on error
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
        }
    };

    const markAllAsRead = async () => {
        try {
            // Store original state for rollback
            const originalNotifications = notifications;
            
            // Update local state optimistically
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            markStoreAllAsRead();
            
            // Call API to persist to database
            await apiClient.patch("/notifications/read-all");
        } catch (error) {
            console.error("Failed to mark all as read:", error);
            // Revert by refetching
            const data = await apiClient.get<NotificationsResponse>("/notifications");
            setNotifications((data.notifications || []).map(mapBackendNotification));
        }
    };

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

    // Filter notifications by tab and search query
    const filteredNotifications = notifications.filter(notif => {
        const query = notificationsSearchQuery.trim().toLowerCase();

        const matchesSearch = !query || [
            notif.users[0]?.name || "",
            notif.users[0]?.username || "",
            notif.content || "",
            notif.quotedContent || "",
        ].some((value) => value.toLowerCase().includes(query));

        if (!matchesSearch) {
            return false;
        }

        if (activeTab === "read") {
            return notif.read;
        }
        if (activeTab === "unread") {
            return !notif.read;
        }
        return true;
    });

    const [suggestedUsers, setSuggestedUsers] = useState<UserSuggestion[]>([]);

    // Fetch "Who to follow" suggestions from the backend
    useEffect(() => {
        if (!isHydrated || !isAuthenticated) return;

        const fetchSuggestions = async () => {
            try {
                const data = await apiClient.get<UserSuggestion[]>("/users/suggestions");
                setSuggestedUsers(data || []);
            } catch (error) {
                console.error("Failed to fetch suggestions:", error);
            }
        };

        fetchSuggestions();
    }, [isHydrated, isAuthenticated]);

    const normalizeAvatarUrl = (avatarUrl?: string | null, username?: string) => {
        if (!avatarUrl) {
            return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || "user"}`;
        }
        if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
            return avatarUrl;
        }

        const mediaBaseUrl = process.env.NEXT_PUBLIC_MEDIA_URL || "http://localhost:3001/uploads";
        const cleanBase = mediaBaseUrl.replace(/\/+$/, "");

        if (avatarUrl.startsWith("/uploads/")) {
            return `${cleanBase}/${avatarUrl.replace(/^\/uploads\//, "")}`;
        }
        if (avatarUrl.startsWith("/avatars/")) {
            return `${cleanBase}/${avatarUrl.replace(/^\//, "")}`;
        }
        if (avatarUrl.startsWith("avatars/")) {
            return `${cleanBase}/${avatarUrl}`;
        }
        return `${cleanBase}/${avatarUrl.replace(/^\/+/, "")}`;
    };

    const currentUserAvatar = normalizeAvatarUrl(
        currentUserProfile?.avatarUrl || user?.avatarUrl,
        currentUserProfile?.username || user?.username || "user",
    );

    const currentUserAlt =
        currentUserProfile?.displayName ||
        user?.displayName ||
        currentUserProfile?.username ||
        user?.username ||
        "User";

    const findUsersPanel = (
        <>
        <div className="bg-[#1a1a1f] rounded-2xl p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Find users</h3>
            <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-9 pr-3 py-2 bg-[#0d0d0f] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 border border-gray-800/50"
                />
            </div>

            <div className="mt-3 space-y-3">
                {isSearchingUsers && <p className="text-xs text-gray-500">Searching...</p>}
                {!isSearchingUsers && !!searchUsersError && (
                    <p className="text-xs text-red-400">{searchUsersError}</p>
                )}
                {!isSearchingUsers && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                    <p className="text-xs text-gray-500">No users found</p>
                )}
                {!isSearchingUsers && searchResults.map((u) => (
                    <div key={u.id} className="flex items-center gap-3">
                        <Avatar
                            src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                            alt={u.displayName || u.username}
                            size={34}
                        />
                        <div className="flex-1 min-w-0">
                            <Link href={`/profile/${u.username}`} className="block text-sm text-white font-medium truncate hover:text-violet-300 transition">
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
            </div>
        </div>

        {/* Who to follow */}
        <div className="bg-[#1a1a1f] rounded-2xl p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Who to follow</h3>
            {suggestedUsers.length === 0 ? (
                <p className="text-sm text-gray-500">No suggestions yet</p>
            ) : (
                <div className="space-y-4">
                    {suggestedUsers.map((suggested) => {
                        const handle = suggested.username?.startsWith("@")
                            ? suggested.username
                            : `@${suggested.username}`;
                        const profilePath = `/profile/${handle.replace(/^@/, "")}`;
                        const displayName = suggested.displayName || suggested.username;
                        const avatarSrc = normalizeAvatarUrl(suggested.avatarUrl, suggested.username);
                        
                        return (
                            <div key={suggested.id} className="flex items-center gap-3">
                                <Avatar src={avatarSrc} alt={displayName} size={40} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white truncate">{displayName}</p>
                                    <p className="text-sm text-gray-500 truncate">{handle}</p>
                                </div>
                                <Link
                                    href={profilePath}
                                    className="px-3 py-1.5 bg-white text-black rounded-full text-xs font-medium hover:bg-gray-200 transition"
                                >
                                    View
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
        </>
    );

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

            {/* Left Sidebar */}
            <div className="hidden lg:block">
                <AppSidebar />
            </div>

            {/* Main Content */}
            <main className="flex-1 border-r border-gray-800/50 overflow-y-auto">
                {/* Top Bar */}
                <div className="sticky top-0 bg-[#0d0d0f]/95 backdrop-blur z-10 px-3 sm:px-4 py-3 border-b border-gray-800/50">
                    <div className="flex items-center gap-4">
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
                        <div className="flex-1 relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={notificationsSearchQuery}
                                onChange={(e) => setNotificationsSearchQuery(e.target.value)}
                                placeholder="Search notifications..."
                                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1f] rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 border border-gray-800/50"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsFindUsersOpen(true)}
                            className="xl:hidden px-3 py-2 rounded-full border border-gray-700 text-xs font-medium text-violet-300 hover:bg-gray-800/50 transition"
                        >
                            Find users
                        </button>
                        <Avatar
                            src={currentUserAvatar}
                            alt={currentUserAlt}
                            size={36}
                        />
                    </div>
                </div>

                {/* Tabs and Actions */}
                <div className="border-b border-gray-800/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-1 overflow-x-auto">
                            {[
                                { id: "all", label: "All" },
                                { id: "unread", label: "Unread" },
                                { id: "read", label: "Read" },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? "text-white"
                                            : "text-gray-500 hover:text-gray-300"
                                    }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-violet-500 rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={markAllAsRead}
                            disabled={!notifications.some(n => !n.read)}
                            className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm transition border-t sm:border-t-0 sm:border-l border-gray-800/50 text-left sm:text-center ${
                                notifications.some(n => !n.read)
                                    ? "text-violet-400 hover:text-violet-300 cursor-pointer"
                                    : "text-gray-600 cursor-not-allowed opacity-50"
                            }`}
                        >
                            Mark All as Read
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="divide-y divide-gray-800/50">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading notifications...</div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No notifications yet</div>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <div 
                                key={notification.id} 
                                className={`p-4 hover:bg-gray-800/20 transition ${!notification.read ? 'bg-violet-500/5' : 'opacity-60'}`}
                            >
                                <div className="flex flex-col sm:flex-row gap-3 items-start">
                                    <NotificationIcon type={notification.type} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            {notification.users[0] && (
                                                <Avatar 
                                                    src={notification.users[0].avatarUrl} 
                                                    alt={notification.users[0].name} 
                                                    size={24} 
                                                />
                                            )}
                                            <span className="font-medium text-white text-sm break-words">
                                                {notification.users[0]?.name}
                                            </span>
                                            <span className="text-gray-500 text-sm break-words">{notification.content}</span>
                                            <span className="text-gray-600 text-xs sm:ml-auto">{notification.time}</span>
                                            {!notification.read && (
                                                <span className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0" />
                                            )}
                                        </div>
                                        {notification.quotedContent && (
                                            <p className="text-gray-400 text-sm mt-1 break-words">{notification.quotedContent}</p>
                                        )}
                                    </div>
                                    {!notification.read && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="sm:ml-2 px-3 py-1 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded transition flex-shrink-0"
                                        >
                                            Mark as read
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {isFindUsersOpen && (
                <div className="fixed inset-0 z-50 xl:hidden">
                    <button
                        type="button"
                        onClick={() => setIsFindUsersOpen(false)}
                        className="absolute inset-0 bg-black/60"
                        aria-label="Close find users panel"
                    />
                    <aside className="absolute right-0 top-0 h-full w-[min(90vw,24rem)] overflow-y-auto border-l border-gray-800/60 bg-[#0d0d0f] p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Find users</h2>
                            <button
                                type="button"
                                onClick={() => setIsFindUsersOpen(false)}
                                className="p-2 rounded-full text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 transition"
                                aria-label="Close"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {findUsersPanel}
                    </aside>
                </div>
            )}

            {/* Right Sidebar */}
            <aside className="w-72 xl:w-80 p-4 xl:p-6 hidden xl:block overflow-y-auto">
                {findUsersPanel}

                {/* Footer Links */}
                <div className="mt-6 text-xs text-gray-600">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link>
                        <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <span>© 2024 StitchSocial Inc.</span>
                    </div>
                </div>
            </aside>
        </div>
    );
}
