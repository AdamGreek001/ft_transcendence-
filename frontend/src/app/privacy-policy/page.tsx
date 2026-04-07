import React from "react";
// import Navbar from "@/components/Navbar";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-black text-gray-300 font-sans">
      {/* <header className="bg-gray-800">
        <Navbar buttonText="Sign Up" paragraph="Don't have an account ?" />
      </header> */}
      
      <main className="max-w-4xl mx-auto py-16 px-6">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="mb-6 text-sm italic">Last updated: March 26, 2026</p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-purple-400 mb-4">1. Information We Collect</h2>
          <p className="leading-relaxed">
            When you use our Social App, we collect information you provide directly to us:
          </p>
          <ul className="list-disc ml-6 mt-4 space-y-2">
            <li><strong>Account Data:</strong> Email, name, and profile picture provided via Google OAuth or Sign Up.</li>
            <li><strong>Content:</strong> Posts, comments, and interactions you create on the platform.</li>
            <li><strong>Technical Data:</strong> IP address and browser type for security and analytics.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-purple-400 mb-4">2. How We Use Your Information</h2>
          <p>We use the collected data to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Authenticate your account and provide access to features.</li>
              <li>Display your profile to other users within the social network.</li>
              <li>Improve our algorithms to show you relevant content (like Reddit).</li>
            </ul>
          
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-purple-400 mb-4">3. Data Sharing</h2>
          <p>
            We do not sell your personal data. Your username and posts are visible to other users as part of the social experience.
          </p>
        </section>

        <section className="mb-10 text-center border-t border-gray-800 pt-10">
          <p className="text-sm">
            Questions about our Privacy Policy? Contact us at <span className="text-purple-400 cursor-pointer">support@your-app.com</span>
          </p>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPolicy;