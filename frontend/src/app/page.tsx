import { Sidebar } from "../components/layout/Sidebar";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function HomePage() {
    const t = useTranslations("common");

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
            <Sidebar />
            <h1 className="text-4xl font-bold tracking-tight text-primary-600">
                {t("appName")}
            </h1>
            <p className="max-w-md text-center text-lg text-gray-600">
                A real-time social platform — connect, share, and chat with your
                community.
            </p>
            <div className="flex gap-4">
                <Link
                    href="/feed"
                    className="rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-primary-700"
                >
                    Go to Feed
                </Link>
                <Link
                    href="/login"
                    className="rounded-lg border border-primary-300 px-6 py-3 text-sm font-medium text-primary-600 transition hover:bg-primary-50"
                >
                    Log In
                </Link>
            </div>
        </main>
    );
}
