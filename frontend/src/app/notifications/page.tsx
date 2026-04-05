"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui";
import { AppSidebar } from "@/components/layout/AppSidebar";

type NotificationType = "like" | "follow" | "reply" | "repost" | "recommendation";

interface Notification {
    id: string;
    type: NotificationType;
    users: { name: string; avatarUrl: string; username?: string }[];
    content?: string;
    quotedContent?: string;
    time: string;
    isVerified?: boolean;
}

const mockNotifications: Notification[] = [
    {
        id: "1",
        type: "like",
        users: [
            { name: "WoolyWanderer", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=wooly" },
        ],
        content: "liked your post",
        quotedContent: "\"Just finished this merino wool scarf! The honeycomb stitch is paying off. #knitting #handmade\"",
        time: "15m ago",
    },
    {
        id: "2",
        type: "follow",
        users: [
            { name: "FiberArtist", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=fiber" },
        ],
        content: "followed you",
        time: "2h ago",
    },
    {
        id: "3",
        type: "reply",
        users: [
            { name: "ThreadMaster", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=thread" },
        ],
        content: "• 2h",
        quotedContent: "Replying to your pattern question: \"I recommend using a 4.5mm needle for that specific yarn weight to get better tension.\"",
        time: "2h ago",
    },
    {
        id: "4",
        type: "repost",
        users: [
            { name: "PatternCollector", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=pattern" },
        ],
        content: "reposted your thread",
        time: "5h ago",
    },
    {
        id: "5",
        type: "recommendation",
        users: [],
        content: "Recommended for you",
        quotedContent: "Based on your interest in \"Natural Dyes\"",
        time: "",
    },
];

const trends = [
    { category: "Knitting • Trending", tag: "#CableKnitWinter", posts: "12.4k posts" },
    { category: "Sustainable Fashion • Trending", tag: "Recycled Sari Silk", posts: "8.1k posts" },
    { category: "Embroidery • Trending", tag: "Botanical Patterns", posts: "4.2k posts" },
];

const whoToFollow = [
    { name: "SilkMaven", username: "@silk_expert", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=silk" },
    { name: "TheLoomLord", username: "@weaving_king", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=loom" },
];

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
        case "reply":
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
        case "recommendation":
            return (
                <div className="w-8 h-8 flex items-center justify-center">
                    <svg className="w-5 h-5 text-violet-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                </div>
            );
        default:
            return null;
    }
}

export default function NotificationsPage() {
    const [activeTab, setActiveTab] = useState<"all" | "mentions" | "verified">("all");

    return (
        <div className="flex h-screen bg-[#0d0d0f]">
            {/* Left Sidebar */}
            <AppSidebar showPostButton />

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

                {/* Tabs */}
                <div className="flex border-b border-gray-800/50">
                    {[
                        { id: "all", label: "All" },
                        { id: "mentions", label: "Mentions" },
                        { id: "verified", label: "Verified" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`flex-1 px-4 py-4 text-sm font-medium transition-colors relative ${
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

                {/* Notifications List */}
                <div className="divide-y divide-gray-800/50">
                    {mockNotifications.map((notification) => (
                        <div key={notification.id} className="p-4 hover:bg-gray-800/20 transition">
                            <div className="flex gap-3">
                                <NotificationIcon type={notification.type} />
                                <div className="flex-1 min-w-0">
                                    {notification.type === "recommendation" ? (
                                        <>
                                            <div className="flex items-center gap-2 mb-2">
                                                <svg className="w-4 h-4 text-violet-500" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                                </svg>
                                                <span className="text-sm font-medium text-white">{notification.content}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-3">{notification.quotedContent}</p>
                                            <div className="bg-[#1a1a1f] rounded-xl p-4 flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">Organic Indigo Dyeing Workshop</p>
                                                    <p className="text-xs text-gray-500">Join 1.2k others in this community project starting next week.</p>
                                                </div>
                                                <button className="ml-auto text-gray-500 hover:text-gray-400">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {notification.users.map((user, idx) => (
                                                    <Avatar key={idx} src={user.avatarUrl} alt={user.name} size={32} />
                                                ))}
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    <span className="font-semibold text-white">
                                                        {notification.users.map((u) => u.name).join(", ")}
                                                    </span>
                                                    <span className="text-gray-400">{notification.content}</span>
                                                </div>
                                                {notification.type === "follow" && (
                                                    <button className="ml-auto px-4 py-1.5 bg-transparent border border-gray-600 rounded-full text-sm font-medium text-white hover:bg-gray-800/50 transition">
                                                        Follow back
                                                    </button>
                                                )}
                                            </div>
                                            {notification.quotedContent && (
                                                <p className="text-sm text-gray-400 mt-2">{notification.quotedContent}</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
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
