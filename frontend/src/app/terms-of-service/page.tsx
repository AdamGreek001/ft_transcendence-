import React from "react";
// import Navbar from "@/components/Navbar";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-black text-gray-300 font-sans">
      {/* <header className="bg-gray-800">
        <Navbar buttonText="Sign Up" paragraph="Don't have an account ?" />
      </header> */}
      
      <main className="max-w-4xl mx-auto py-16 px-6">
        <h1 className="text-4xl font-bold text-white mb-8 border-b border-gray-800 pb-4">
          Terms of Service
        </h1>
        <p className="mb-6 text-sm italic text-gray-500">Effective Date: March 26, 2026</p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-purple-400 mb-4">1. Acceptance of Terms</h2>
          <p className="leading-relaxed">
            By creating an account (via Google or Email) on our Social Platform, you agree to follow these rules. If you don't agree, please don't use the app. 
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-purple-400 mb-4">2. User Conduct</h2>
          <p className="mb-4 text-gray-400 italic">"Don't be a jerk."</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>No Spam:</strong> Don't post the same thing 100 times.</li>
            <li><strong>Respect:</strong> No hate speech, harassment, or bullying of other members.</li>
            <li><strong>Illegal Content:</strong> Don't post anything that breaks the law.</li>
            <li><strong>Copyright:</strong> Only post content (images/text) that you have the right to share.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-purple-400 mb-4">3. Content Ownership</h2>
          <p>
            You own the content you post. However, by posting on this app, you grant us a license to display, distribute, and promote your content within the platform.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-purple-400 mb-4">4. Account Termination</h2>
          <p>
            We reserve the right to ban or delete any account that breaks these terms without prior notice. 
          </p>
        </section>

        <section className="mt-20 border-t border-gray-800 pt-10 text-center">
          <p className="text-sm text-gray-500">
            Enjoy your time on the app! ❤️
          </p>
        </section>
      </main>
    </div>
  );
};

export default TermsOfService;