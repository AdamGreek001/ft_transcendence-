"use client";

import { useState, useEffect, useRef } from "react";
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

const trends = [
    { category: "Knitting • Trending", tag: "#CableKnitWinter", posts: "12.4k posts" },
    { category: "Sustainable Fashion • Trending", tag: "Recycled Sari Silk", posts: "8.1k posts" },
    { category: "Embroidery • Trending", tag: "Botanical Patterns", posts: "4.2k posts" },
];

const whoToFollow = [
    { name: "SilkMaven", username: "@silk_expert", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=silk" },
    { name: "TheLoomLord", username: "@weaving_king", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=loom" },
];

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

        const fetchNotifications = async () => {
            setIsLoading(true);
            try {
                const data = await apiClient.get<NotificationsResponse>("/notifications");
                setNotifications((data.notifications || []).map(mapBackendNotification));
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
                setNotifications([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();
    }, [isHydrated, isAuthenticated]);

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

    // Filter notifications by active tab
    const filteredNotifications = notifications.filter(notif => {
        if (activeTab === "read") {
            return notif.read;
        }
        if (activeTab === "unread") {
            return !notif.read;
        }
        return true;
    });

    return (
        <div className="flex h-screen bg-[#0d0d0f]">
            {/* Left Sidebar */}
            <AppSidebar />

            {/* Main Content */}
            <main className="flex-1 border-r border-gray-800/50 overflow-y-auto">
                {/* Top Bar */}
                <div className="sticky top-0 bg-[#0d0d0f]/95 backdrop-blur z-10 px-4 py-3 border-b border-gray-800/50">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search patterns, yarns, artists..."
                                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1f] rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 border border-gray-800/50"
                            />
                        </div>
                        <button className="p-2 hover:bg-gray-800/50 rounded-full transition text-gray-400 relative">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </button>
                        <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=alex" alt="User" size={36} />
                    </div>
                </div>

                {/* Tabs and Actions */}
                <div className="border-b border-gray-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-1 overflow-x-auto">
                            {[
                                { id: "all", label: "All" },
                                { id: "unread", label: "Unread" },
                                { id: "read", label: "Read" },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`px-4 py-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
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
                            className={`px-4 py-2 text-sm transition border-l border-gray-800/50 ${
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
                                <div className="flex gap-3 items-start">
                                    <NotificationIcon type={notification.type} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {notification.users[0] && (
                                                <Avatar 
                                                    src={notification.users[0].avatarUrl} 
                                                    alt={notification.users[0].name} 
                                                    size={24} 
                                                />
                                            )}
                                            <span className="font-medium text-white text-sm">
                                                {notification.users[0]?.name}
                                            </span>
                                            <span className="text-gray-500 text-sm">{notification.content}</span>
                                            <span className="text-gray-600 text-xs ml-auto">{notification.time}</span>
                                            {!notification.read && (
                                                <span className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0" />
                                            )}
                                        </div>
                                        {notification.quotedContent && (
                                            <p className="text-gray-400 text-sm mt-1">{notification.quotedContent}</p>
                                        )}
                                    </div>
                                    {!notification.read && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="ml-2 px-3 py-1 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded transition flex-shrink-0"
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

            {/* Right Sidebar */}
            <aside className="w-80 p-6 hidden lg:block overflow-y-auto">
                {/* Trending */}
                <div className="bg-[#1a1a1f] rounded-2xl p-4 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Trending in Textiles</h3>
                    <div className="space-y-4">
                        {trends.map((trend, idx) => (
                            <div key={idx} className="group cursor-pointer">
                                <p className="text-xs text-gray-500">{trend.category}</p>
                                <p className="font-semibold text-white group-hover:text-violet-400 transition">{trend.tag}</p>
                                <p className="text-xs text-gray-500">{trend.posts}</p>
                            </div>
                        ))}
                    </div>
                    <button className="text-violet-400 text-sm font-medium mt-4 hover:text-violet-300 transition">
                        Show more
                    </button>
                </div>

                {/* Who to follow */}
                <div className="bg-[#1a1a1f] rounded-2xl p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Who to follow</h3>
                    <div className="space-y-4">
                        {whoToFollow.map((user, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <Avatar src={user.avatarUrl} alt={user.name} size={40} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white truncate">{user.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{user.username}</p>
                                </div>
                                <button className="px-4 py-1.5 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-200 transition">
                                    Follow
                                </button>
                            </div>
                        ))}
                    </div>
                    <button className="text-violet-400 text-sm font-medium mt-4 hover:text-violet-300 transition">
                        Show more
                    </button>
                </div>

                {/* Footer Links */}
                <div className="mt-6 text-xs text-gray-600">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <a href="#" className="hover:underline">Terms of Service</a>
                        <a href="#" className="hover:underline">Privacy Policy</a>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <a href="#" className="hover:underline">Cookie Policy</a>
                        <span>© 2024 StitchSocial Inc.</span>
                    </div>
                </div>
            </aside>
        </div>
    );
}
