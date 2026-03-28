import { useTranslations } from "next-intl";

export default function FeedPage() {
    const t = useTranslations("feed");

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <textarea
                    placeholder={t("createPost")}
                    rows={3}
                    className="w-full resize-none rounded-lg border-0 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
                <div className="mt-3 flex justify-end">
                    <button className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-700">
                        Post
                    </button>
                </div>
            </div>
            <p className="text-center text-sm text-gray-400">{t("noMorePosts")}</p>
        </div>
    );
}
