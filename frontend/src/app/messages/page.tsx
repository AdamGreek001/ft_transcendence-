import { useTranslations } from "next-intl";

export default function MessagesPage() {
    const t = useTranslations("chat");

    return (
        <div className="mx-auto flex max-w-5xl gap-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" style={{ height: "calc(100vh - 6rem)" }}>
            {/* Sidebar — conversation list */}
            <aside className="w-80 border-r border-gray-200 p-4">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Messages</h2>
                <p className="text-sm text-gray-400">{t("noConversations")}</p>
            </aside>

            {/* Main — chat area */}
            <section className="flex flex-1 flex-col">
                <div className="flex-1 p-6">
                    <p className="text-center text-sm text-gray-400">
                        Select a conversation to start messaging.
                    </p>
                </div>
                <div className="border-t border-gray-200 p-4">
                    <input
                        type="text"
                        placeholder={t("typeMessage")}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                </div>
            </section>
        </div>
    );
}
