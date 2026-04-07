"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Avatar } from "@/components/ui";
import { useNotificationsStore } from "@/store/notifications";
import { useMessagesStore } from "@/store/messages";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string; filled?: boolean }>;
    badgeKey?: "notifications" | "messages";
}

function HomeIcon({ className, filled }: { className?: string; filled?: boolean }) {
    return filled ? (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.1L1 12h3v9h6v-6h4v6h6v-9h3L12 2.1z" />
        </svg>
    ) : (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    );
}

function ExploreIcon({ className, filled }: { className?: string; filled?: boolean }) {
    return filled ? (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-2.4 5.6a1 1 0 01-.54.54l-5.6 2.4a.5.5 0 01-.64-.64l2.4-5.6a1 1 0 01.54-.54l5.6-2.4a.5.5 0 01.64.64z" />
        </svg>
    ) : (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function MessagesIcon({ className, filled }: { className?: string; filled?: boolean }) {
    return filled ? (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
    ) : (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    );
}

function NotificationsIcon({ className, filled }: { className?: string; filled?: boolean }) {
    return filled ? (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
    ) : (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    );
}

function SettingsIcon({ className, filled }: { className?: string; filled?: boolean }) {
    return filled ? (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </svg>
    ) : (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function ProfileIcon({ className, filled }: { className?: string; filled?: boolean }) {
    return filled ? (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
    ) : (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    );
}

const navItems: NavItem[] = [
    { href: "/feed", label: "Home", icon: HomeIcon },
    { href: "/explore", label: "Explore", icon: ExploreIcon },
    { href: "/messages", label: "Messages", icon: MessagesIcon, badgeKey: "messages" },
    { href: "/notifications", label: "Notifications", icon: NotificationsIcon, badgeKey: "notifications" },
    { href: "/profile", label: "Profile", icon: ProfileIcon },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
];

interface AppSidebarProps {
    user?: {
        name: string;
        username: string;
        avatarUrl: string;
    };
    showPostButton?: boolean;
}

export function AppSidebar({ 
    user = { name: "LATINO", username: "@latino", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex" },
    showPostButton = false 
}: AppSidebarProps) {
    const pathname = usePathname();
    const { unreadCount, setUnreadCount } = useNotificationsStore();
    const { unreadCount: messagesUnreadCount, setUnreadCount: setMessagesUnreadCount } = useMessagesStore();
    const accessToken = useAuthStore((s) => s.accessToken);
    
    // Initialize notification WebSocket connection
    useNotificationSocket();

    // Fetch initial unread counts
    useEffect(() => {
        if (!accessToken) return;
        
        // Fetch notification unread count
        apiClient.get<{ count: number }>("/notifications/unread-count")
            .then((data) => setUnreadCount(data.count))
            .catch((err) => console.error("Failed to fetch unread count:", err));
        
        // Fetch messages unread count
        apiClient.get<{ count: number }>("/chat/unread-count")
            .then((data) => setMessagesUnreadCount(data.count))
            .catch((err) => console.error("Failed to fetch messages unread count:", err));
    }, [accessToken, setUnreadCount, setMessagesUnreadCount]);

    const getBadgeCount = (badgeKey?: "notifications" | "messages") => {
        if (badgeKey === "notifications") return unreadCount;
        if (badgeKey === "messages") return messagesUnreadCount;
        return 0;
    };

    return (
        <aside className="w-56 bg-[#0d0d0f] border-r border-gray-800/50 flex flex-col h-screen sticky top-0">
            {/* Logo */}
            <div className="p-6 pb-8">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className="font-semibold text-white text-lg">StitchSocial</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    const badgeCount = getBadgeCount(item.badgeKey);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${
                                isActive
                                    ? "bg-violet-600 text-white"
                                    : "text-gray-300 hover:bg-gray-800/50"
                            }`}
                        >
                            <Icon className="h-5 w-5" filled={isActive} />
                            <span className="font-medium">
                                {item.label}
                            </span>
                            {badgeCount > 0 && (
                                <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                                    isActive ? "bg-white/20 text-white" : "bg-violet-500 text-white"
                                }`}>
                                    {badgeCount > 99 ? "99+" : badgeCount}
                                </span>
                            )}
                        </Link>
                    );
                })}

                {/* Post Thread Button */}
                {showPostButton && (
                    <button className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 px-4 rounded-xl transition-colors">
                        Post Thread
                    </button>
                )}
            </nav>

            {/* User Profile at Bottom */}
            <div className="p-4 border-t border-gray-800/50">
                <div className="flex items-center gap-3">
                    <Avatar
                        src={user.avatarUrl}
                        alt={user.name}
                        size={40}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.username}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
