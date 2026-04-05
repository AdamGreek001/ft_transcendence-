import { getTranslations } from "next-intl/server";

interface ProfilePageProps {
    params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { username } = await params;
    const t = await getTranslations("profile");

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">@{username}</h1>
                        <p className="mt-1 text-sm text-gray-500">Bio goes here</p>
                        <div className="mt-3 flex gap-6 text-sm text-gray-600">
                            <span><strong>0</strong> {t("posts")}</span>
                            <span><strong>0</strong> {t("followers")}</span>
                            <span><strong>0</strong> {t("following")}</span>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex gap-3">
                    <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700">
                        {t("follow")}
                    </button>
                    <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                        {t("block")}
                    </button>
                </div>
            </div>
        </div>
    );
}
