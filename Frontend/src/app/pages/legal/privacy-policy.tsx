import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

export function PrivacyPolicyPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] text-white font-sans selection:bg-fuchsia-500/30">
      <header className="relative z-50 w-full py-4 border-b border-white/5 bg-white/5 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 flex items-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <h1 className="text-4xl font-black mb-8">VEYTRIX.AI Privacy Policy</h1>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">1. Introduction</h2>
          <p className="text-gray-300">Welcome to VEYTRIX.AI. Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your information when you access our website and AI-powered services.</p>
          <p className="text-gray-300">By using VEYTRIX.AI, you agree to the practices described in this policy.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">2. Information We Collect</h2>
          <p className="text-gray-300">We may collect the following information:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li><strong>Personal Information:</strong> Full Name, Email Address, Profile Picture, Account Credentials, Payment Information (processed securely through third-party payment providers)</li>
            <li><strong>Usage Information:</strong> IP Address, Browser Type, Device Information, Operating System, Login Activity, Session Duration, Pages Visited, Features Used</li>
            <li><strong>AI Content:</strong> Text Prompts, Uploaded Images, Uploaded Videos, Reference Media, Generated AI Outputs, Editing History</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">3. How We Use Your Information</h2>
          <p className="text-gray-300">We use collected information to:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Provide AI video generation services</li>
            <li>Improve platform performance</li>
            <li>Personalize user experience</li>
            <li>Detect fraud and abuse</li>
            <li>Process payments</li>
            <li>Manage subscriptions</li>
            <li>Provide customer support</li>
            <li>Train and improve internal AI systems (only where permitted)</li>
            <li>Analyze platform performance</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">4. Data Security</h2>
          <p className="text-gray-300">We implement industry-standard security measures including:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>SSL Encryption</li>
            <li>Secure Cloud Storage</li>
            <li>Access Control</li>
            <li>Authentication Systems</li>
            <li>Firewall Protection</li>
            <li>Regular Security Audits</li>
          </ul>
          <p className="text-gray-300">Despite our efforts, no internet transmission is 100% secure.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">5. Cookies</h2>
          <p className="text-gray-300">VEYTRIX.AI uses cookies to:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Remember user preferences</li>
            <li>Keep users logged in</li>
            <li>Analyze traffic</li>
            <li>Improve performance</li>
            <li>Enhance user experience</li>
          </ul>
          <p className="text-gray-300">Users may disable cookies through browser settings.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">6. Third-Party Services</h2>
          <p className="text-gray-300">We may integrate with:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Payment Gateways</li>
            <li>Authentication Providers</li>
            <li>Cloud Storage Services</li>
            <li>Analytics Providers</li>
            <li>AI Infrastructure Providers</li>
          </ul>
          <p className="text-gray-300">These services maintain their own privacy policies.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">7. Data Retention</h2>
          <p className="text-gray-300">We retain user data only as long as necessary to:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Provide services</li>
            <li>Meet legal obligations</li>
            <li>Resolve disputes</li>
            <li>Enforce agreements</li>
          </ul>
          <p className="text-gray-300">Users may request deletion of their account and associated data.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">8. User Rights</h2>
          <p className="text-gray-300">Users have the right to:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Access personal data</li>
            <li>Correct inaccurate information</li>
            <li>Delete their account</li>
            <li>Export their data</li>
            <li>Withdraw consent</li>
            <li>Request information regarding stored data</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">9. Children's Privacy</h2>
          <p className="text-gray-300">VEYTRIX.AI is not intended for users under the age of 13. We do not knowingly collect personal information from children.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">10. Policy Updates</h2>
          <p className="text-gray-300">This Privacy Policy may be updated periodically. Continued use of VEYTRIX.AI constitutes acceptance of any modifications.</p>
        </section>
      </main>
    </div>
  );
}
