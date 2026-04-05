"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui";
import { AppSidebar } from "@/components/layout/AppSidebar";

const activityLog = [
    {
        id: "1",
        icon: "login",
        title: "Logged in from Safari on Mac",
        time: "Today, 10:24 AM",
    },
    {
        id: "2",
        icon: "security",
        title: "Security update applied",
        time: "Yesterday, 4:15 PM",
    },
];

export default function SettingsPage() {
    const [displayName, setDisplayName] = useState("Alex Rivera");
    const [username, setUsername] = useState("arivera");
    const [bio, setBio] = useState("Digital creator & explorer of modern web aesthetics. Building StitchSocial one thread at a time.");
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

    return (
        <div className="flex h-screen bg-[#0d0d0f]">
            {/* Left Sidebar */}
            <AppSidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Top Bar */}
                <div className="sticky top-0 bg-[#0d0d0f]/95 backdrop-blur z-10 px-6 py-4 border-b border-gray-800/50">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search settings, users, or posts..."
                                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1f] rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 border border-gray-800/50"
                            />
                        </div>
                        <button className="p-2 hover:bg-gray-800/50 rounded-full transition text-gray-400 relative">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>
                        <button className="bg-violet-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-violet-700 transition">
                            Post
                        </button>
                    </div>
                </div>

                {/* Settings Content */}
                <div className="p-6 max-w-2xl">
                    <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
                    <p className="text-gray-500 mb-6">Manage your StitchSocial experience and account security.</p>

                    {/* Tabs */}
                    <div className="border-b border-gray-800/50 mb-8">
                        <button className="px-4 py-3 text-sm font-medium text-violet-400 border-b-2 border-violet-500">
                            Account
                        </button>
                    </div>

                    {/* Public Profile Section */}
                    <section className="mb-10">
                        <h2 className="text-lg font-semibold text-white mb-6">Public Profile</h2>
                        
                        <div className="bg-[#1a1a1f] rounded-2xl p-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center overflow-hidden">
                                        <Avatar
                                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=alex"
                                            alt="Alex Rivera"
                                            size={80}
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-violet-500 rounded-full flex items-center justify-center border-2 border-[#1a1a1f]">
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium text-white mb-1">Avatar Image</p>
                                    <p className="text-sm text-gray-500 mb-3">Min 400×400px, PNG or JPG.</p>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-1.5 bg-[#2a2a2f] border border-gray-700 rounded-lg text-sm font-medium text-white hover:bg-[#3a3a3f] transition">
                                            Change Avatar
                                        </button>
                                        <button className="px-4 py-1.5 text-sm font-medium text-orange-400 hover:text-orange-300 transition">
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Display Name
                                    </label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-[#2a2a2f] border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Username
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full pl-8 pr-4 py-2.5 bg-[#2a2a2f] border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Bio
                                </label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-[#2a2a2f] border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 resize-none"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3">
                                <button className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-gray-300 transition">
                                    Discard changes
                                </button>
                                <button className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition">
                                    Save Profile
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Security & Preferences Section */}
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-6">Security & Preferences</h2>
                        
                        <div className="bg-[#1a1a1f] rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
                                        <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">Two-Factor Authentication</p>
                                        <p className="text-sm text-gray-500">Add an extra layer of security to your account.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${
                                        twoFactorEnabled ? "bg-violet-600" : "bg-gray-600"
                                    }`}
                                >
                                    <span
                                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                            twoFactorEnabled ? "translate-x-6" : "translate-x-0.5"
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* Right Sidebar - Activity */}
            <aside className="w-72 border-l border-gray-800/50 p-6 hidden lg:block">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Last Activity
                </h3>
                <div className="space-y-4">
                    {activityLog.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-[#1a1a1f] rounded-full flex items-center justify-center flex-shrink-0">
                                {activity.icon === "login" ? (
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{activity.title}</p>
                                <p className="text-xs text-gray-500">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>
        </div>
    );
}
