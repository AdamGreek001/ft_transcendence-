import type { Metadata } from "next";
import { ToastContainer } from "@/components/layout/ToastContainer";
import { PostProvider, usePostContext } from "@/context/PostContext";

import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "ft_transcendence — Social Platform",
    description:
        "A real-time social media platform with chat, posts, and community features.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body suppressHydrationWarning={true}>
                <PostProvider>
                    {children}
                    <ToastContainer />
                </PostProvider>
            </body>
        </html>
    );
}