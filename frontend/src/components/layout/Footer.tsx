import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t border-gray-200 bg-white py-8">
            <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-sm text-gray-500 md:flex-row md:justify-between">
                <p>© {new Date().getFullYear()} ft_transcendence. All rights reserved.</p>
                <div className="flex gap-6">
                    <Link href="/privacy-policy" className="transition hover:text-primary-600">
                        Privacy Policy
                    </Link>
                    <Link href="/terms-of-service" className="transition hover:text-primary-600">
                        Terms of Service
                    </Link>
                </div>
            </div>
        </footer>
    );
}
