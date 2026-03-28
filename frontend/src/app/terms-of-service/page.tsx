import { useTranslations } from "next-intl";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service — ft_transcendence",
    description: "Terms of service for using the ft_transcendence platform.",
};

export default function TermsOfServicePage() {
    const t = useTranslations("legal");

    return (
        <article className="prose mx-auto max-w-3xl px-4 py-12">
            <h1>{t("termsOfService")}</h1>
            <p className="text-sm text-gray-500">Last updated: March 2026</p>
            <h2>1. Acceptance of Terms</h2>
            <p>
                By accessing and using ft_transcendence, you agree to be bound by these
                terms of service. If you do not agree, do not use the platform.
            </p>
            <h2>2. User Accounts</h2>
            <p>
                You are responsible for maintaining the confidentiality of your account
                credentials. You must be at least 13 years old to create an account.
            </p>
            <h2>3. User Content</h2>
            <p>
                You retain ownership of content you post. By posting, you grant the
                platform a non-exclusive license to display and distribute your content
                within the service.
            </p>
            <h2>4. Prohibited Conduct</h2>
            <p>
                Users must not post illegal content, harass other users, impersonate
                others, or attempt to compromise the security of the platform.
            </p>
            <h2>5. Termination</h2>
            <p>
                We reserve the right to suspend or terminate accounts that violate these
                terms. Users may delete their accounts at any time.
            </p>
            <h2>6. Limitation of Liability</h2>
            <p>
                The platform is provided &quot;as is&quot; without warranties. We are not
                liable for any damages arising from your use of the service.
            </p>
        </article>
    );
}
