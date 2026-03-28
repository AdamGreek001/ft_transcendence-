"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const sideItems = [
    { href: "/feed", key: "feed", icon: "🏠" },
    { href: "/explore", key: "explore", icon: "🔍" },
    { href: "/messages", key: "messages", icon: "💬" },
    { href: "/notifications", key: "notifications", icon: "🔔" },
    { href: "/profile", key: "profile", icon: "👤" },
    { href: "/settings", key: "settings", icon: "⚙️" },
] as const;

export function Sidebar() {
    const t = useTranslations("nav");
    const pathname = usePathname();

    return (
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 border-r border-gray-200 bg-white p-4 lg:block">
            <nav className="flex flex-col gap-1">
                {sideItems.map((item) => (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={clsx(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                            pathname.startsWith(item.href)
                                ? "bg-primary-50 text-primary-700"
                                : "text-gray-600 hover:bg-gray-100",
                        )}
                    >
                        <span className="text-lg">{item.icon}</span>
                        {t(item.key)}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
