"use client";

// import { useTranslations } from "next-intl";
// import { clsx } from "clsx";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import HomeIcon from '../../../public/icons/home.svg';
import ExploreIcon from '../../../public/icons/explore.svg';
import NotificationsIcon from '../../../public/icons/notifications.svg';
import MessagesIcon from '../../../public/icons/mail.svg';
import ProfileIcon from '../../../public/icons/person.svg';


const sideItems = [
    { href: "/feed", key: "feed", icon: <HomeIcon /> },
    { href: "/explore", key: "explore", icon: <ExploreIcon /> },
    { href: "/notifications", key: "notifications", icon: <NotificationsIcon /> },
    { href: "/messages", key: "messages", icon: <MessagesIcon /> },
    { href: "/profile", key: "profile", icon: <ProfileIcon /> }
] as const;

export function Sidebar() {

    const pathname = usePathname();
    return (
        <aside className="w-64 shrink-0 h-screen flex flex-col justify-between p-6 border-r border-slate-800 bg-[#0f0f0f]">
            <div className="flex flex-col gap-8">
                <Logo />
                <nav className="flex flex-col gap-2 mt-8">
                    {sideItems.map((item) => {
                        const active = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                className={`flex items-center gap-4 px-3 py-3 rounded-full text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer
                                ${active ? "bg-purple-500/10 text-purple-400 font-semibold hover:bg-purple-500/10" : ""}`}
                            >
                                {item.icon}
                                <span>{item.key}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}

