"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AppSidebar } from "@/components/layout/AppSidebar";

export default function FeedPage() {
    const t = useTranslations("feed");
    const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(false);

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
                        <h1 className="text-base sm:text-lg font-semibold text-white">Feed</h1>
                    </div>
                </div>

                <div className="mx-auto max-w-2xl px-4 py-8">
                    <div className="mb-6 rounded-xl border border-gray-800/50 bg-[#1a1a1f] p-4 shadow-sm">
                        <textarea
                            placeholder={t("createPost")}
                            rows={3}
                            className="w-full resize-none rounded-lg border-0 bg-[#0d0d0f] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                        />
                        <div className="mt-3 flex justify-end">
                            <button className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-violet-700">
                                Post
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-sm text-gray-400">{t("noMorePosts")}</p>
                </div>
            </main>
        </div>
    );
}
