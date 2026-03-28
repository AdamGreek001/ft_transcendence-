import { useTranslations } from "next-intl";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy — ft_transcendence",
    description: "Our privacy policy and how we handle your data.",
};

export default function PrivacyPolicyPage() {
    const t = useTranslations("legal");

    return (
        <article className="prose mx-auto max-w-3xl px-4 py-12">
            <h1>{t("privacyPolicy")}</h1>
            <p className="text-sm text-gray-500">Last updated: March 2026</p>
            <h2>1. Information We Collect</h2>
            <p>
                We collect information you provide directly, including your username,
                email address, profile picture, and any content you post on the
                platform.
            </p>
            <h2>2. How We Use Your Information</h2>
            <p>
                Your information is used to provide and improve the service, authenticate
                your identity, deliver notifications, and facilitate social interactions
                within the platform.
            </p>
            <h2>3. Data Sharing</h2>
            <p>
                We do not sell your personal data. Information may be shared with
                third-party services only as required to operate the platform (e.g.,
                OAuth providers for authentication).
            </p>
            <h2>4. Data Retention</h2>
            <p>
                Your data is retained as long as your account is active. You may request
                deletion of your account and associated data at any time.
            </p>
            <h2>5. Contact</h2>
            <p>
                For privacy-related inquiries, contact the project team through the
                platform&apos;s support channel.
            </p>
        </article>
    );
}
