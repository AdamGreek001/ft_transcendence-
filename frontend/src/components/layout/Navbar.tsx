"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const navItems = [
    { href: "/feed", key: "feed" },
    { href: "/explore", key: "explore" },
    { href: "/messages", key: "messages" },
    { href: "/notifications", key: "notifications" },
] as const;

export function Navbar() {
    const t = useTranslations("nav");
    const pathname = usePathname();

    return (
        <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                <Link href="/" className="text-xl font-bold text-primary-600">
                    ft_transcendence
                </Link>
                <div className="flex items-center gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={clsx(
                                "rounded-lg px-4 py-2 text-sm font-medium transition",
                                pathname === item.href
                                    ? "bg-primary-50 text-primary-700"
                                    : "text-gray-600 hover:bg-gray-100",
                            )}
                        >
                            {t(item.key)}
                        </Link>
                    ))}
                </div>
                <Link
                    href="/login"
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
                >
                    {t("profile")}
                </Link>
            </div>
        </nav>
    );
}
