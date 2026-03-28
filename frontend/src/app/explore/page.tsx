import { useTranslations } from "next-intl";

export default function ExplorePage() {
    const t = useTranslations("common");

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">Explore</h1>
            <div className="mb-6">
                <input
                    type="text"
                    placeholder={t("search")}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-5 py-3 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="aspect-square animate-pulse rounded-xl bg-gray-100" />
                <div className="aspect-square animate-pulse rounded-xl bg-gray-100" />
                <div className="aspect-square animate-pulse rounded-xl bg-gray-100" />
                <div className="aspect-square animate-pulse rounded-xl bg-gray-100" />
                <div className="aspect-square animate-pulse rounded-xl bg-gray-100" />
                <div className="aspect-square animate-pulse rounded-xl bg-gray-100" />
            </div>
            <p className="mt-6 text-center text-sm text-gray-400">{t("noResults")}</p>
        </div>
    );
}
