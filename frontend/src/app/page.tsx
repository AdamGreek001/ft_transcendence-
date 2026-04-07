import Link from "next/link";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[#0d0d0f] text-white">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-[#0d0d0f]/95 backdrop-blur border-b border-gray-800/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="font-semibold text-lg">StitchSocial</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="#features" className="text-gray-400 hover:text-white transition text-sm">Features</Link>
                        <Link href="#community" className="text-gray-400 hover:text-white transition text-sm">Community</Link>
                        <Link href="#safety" className="text-gray-400 hover:text-white transition text-sm">Safety</Link>
                        <Link href="#about" className="text-gray-400 hover:text-white transition text-sm">About</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-gray-300 hover:text-white transition text-sm font-medium">
                            Log in
                        </Link>
                        <Link href="/register" className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-full text-sm font-medium transition">
                            Sign Up
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
                            <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                            <span className="text-sm text-violet-400">V2.0 BETA IS HERE</span>
                        </div>
                        <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            Connect with<br />
                            <span className="text-violet-400 italic">your world</span>
                        </h1>
                        <p className="text-lg text-gray-400 mb-8 max-w-xl">
                            Experience the next generation of social networking. Stitch your stories together, join vibrant communities, and share moments with the people who matter most.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                            <Link href="/register" className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-full font-medium transition">
                                Get Started for Free
                            </Link>
                            <button className="w-full sm:w-auto flex items-center justify-center gap-2 text-white px-6 py-3 rounded-full font-medium border border-gray-700 hover:bg-gray-800/50 transition">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                See how it works
                            </button>
                        </div>
                        <div className="flex items-center justify-center lg:justify-start gap-3">
                            <div className="flex -space-x-2">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user1" alt="" className="w-8 h-8 rounded-full border-2 border-[#0d0d0f]" />
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user2" alt="" className="w-8 h-8 rounded-full border-2 border-[#0d0d0f]" />
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user3" alt="" className="w-8 h-8 rounded-full border-2 border-[#0d0d0f]" />
                            </div>
                            <span className="text-sm text-gray-400">Joined by <span className="text-white font-medium">20,000+</span> early adopters this week</span>
                        </div>
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="relative w-64 h-[500px] bg-gradient-to-br from-orange-300 via-pink-300 to-violet-300 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-200/50 via-pink-200/50 to-teal-200/50 opacity-80"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-orange-400 via-pink-400 to-teal-400 opacity-60 blur-xl"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Redefining Connection</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            We&apos;ve built a platform that focuses on meaningful interactions rather than infinite scrolling. Discover tools designed to bring you closer to your community.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <div className="bg-[#1a1a1f] rounded-2xl p-6 border border-gray-800/50">
                            <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Real-time Stories</h3>
                            <p className="text-gray-400 text-sm">
                                Share your moments as they happen with high-fidelity video stories. No filters, just raw authentic connection.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-[#1a1a1f] rounded-2xl p-6 border border-gray-800/50">
                            <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Private Threads</h3>
                            <p className="text-gray-400 text-sm">
                                Deep dive into conversations with end-to-end encrypted messaging. Your data stays yours, always.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-[#1a1a1f] rounded-2xl p-6 border border-gray-800/50">
                            <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Community Hubs</h3>
                            <p className="text-gray-400 text-sm">
                                Find your tribe in curated spaces for every passion. From niche hobbies to global movements.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Visual Discovery Section */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="relative h-96 rounded-2xl overflow-hidden group">
                            <img 
                                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop" 
                                alt="Visual Discovery" 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 right-6">
                                <h3 className="text-2xl font-bold mb-2">Visual Discovery</h3>
                                <p className="text-gray-300 text-sm">
                                    Explore content through a beautiful, immersive lens tailored to your interests.
                                </p>
                            </div>
                        </div>
                        <div className="relative h-96 rounded-2xl overflow-hidden group">
                            <img 
                                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop" 
                                alt="Seamless Sharing" 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 right-6">
                                <h3 className="text-2xl font-bold mb-2">Seamless Sharing</h3>
                                <p className="text-gray-300 text-sm">
                                    Connecting with friends and sharing content across platforms has never been easier.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 bg-gradient-to-r from-violet-600 to-purple-600">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-4">Be the first to join the movement</h2>
                    <p className="text-violet-100 mb-8">
                        We&apos;re rolling out access in waves. Enter your email to get early access and exclusive updates on our journey.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            className="flex-1 px-5 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                        />
                        <button className="bg-white text-violet-600 px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2">
                            Join Waitlist
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-sm text-violet-200 mt-4">No spam. Ever. Just product updates and early access invites.</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-gray-800/50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-md flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="font-semibold text-sm">StitchSocial</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                        <Link href="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link>
                        <Link href="/terms-of-service" className="hover:text-white transition">Terms of Service</Link>
                        <span>Cookies</span>
                    </div>
                    <p className="text-sm text-gray-500">© 2024 StitchSocial Inc. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
