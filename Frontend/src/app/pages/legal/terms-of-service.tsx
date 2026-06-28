import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

export function TermsOfServicePage() {
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
        <h1 className="text-4xl font-black mb-8">VEYTRIX.AI Terms of Service</h1>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">1. Acceptance of Terms</h2>
          <p className="text-gray-300">By accessing VEYTRIX.AI, you agree to comply with these Terms of Service.</p>
          <p className="text-gray-300">If you disagree with any part, please discontinue use immediately.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">2. Eligibility</h2>
          <p className="text-gray-300">Users must:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Be at least 13 years old</li>
            <li>Have legal authority to enter agreements</li>
            <li>Provide accurate information</li>
            <li>Maintain account security</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">3. User Accounts</h2>
          <p className="text-gray-300">You are responsible for:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Maintaining password confidentiality</li>
            <li>All activities under your account</li>
            <li>Keeping information updated</li>
            <li>Reporting unauthorized access</li>
          </ul>
          <p className="text-gray-300">VEYTRIX.AI reserves the right to suspend accounts involved in suspicious activity.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">4. AI Generated Content</h2>
          <p className="text-gray-300">Users retain ownership of content they upload.</p>
          <p className="text-gray-300">Generated outputs belong to the user unless prohibited by applicable law or platform policies.</p>
          <p className="text-gray-300">VEYTRIX.AI may temporarily store generated content for processing and service improvement.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">5. Intellectual Property</h2>
          <p className="text-gray-300">All platform assets including:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Software</li>
            <li>UI Design</li>
            <li>Branding</li>
            <li>Logos</li>
            <li>Source Code</li>
            <li>Documentation</li>
          </ul>
          <p className="text-gray-300">remain the exclusive property of VEYTRIX.AI.</p>
          <p className="text-gray-300">Unauthorized copying or redistribution is prohibited.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">6. Subscription Plans</h2>
          <p className="text-gray-300">Paid subscriptions provide access to premium features.</p>
          <p className="text-gray-300">Subscription prices may change with prior notice.</p>
          <p className="text-gray-300">Unused credits may expire according to plan terms.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">7. Service Availability</h2>
          <p className="text-gray-300">VEYTRIX.AI strives for maximum uptime but does not guarantee uninterrupted service.</p>
          <p className="text-gray-300">Maintenance, upgrades, or unforeseen outages may temporarily affect availability.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">8. Account Suspension</h2>
          <p className="text-gray-300">Accounts may be suspended for:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Fraudulent activity</li>
            <li>Policy violations</li>
            <li>Illegal usage</li>
            <li>Payment disputes</li>
            <li>Security risks</li>
          </ul>
          <p className="text-gray-300">Repeated violations may result in permanent termination.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">9. Limitation of Liability</h2>
          <p className="text-gray-300">VEYTRIX.AI shall not be liable for:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Data loss</li>
            <li>Business interruption</li>
            <li>Revenue loss</li>
            <li>Indirect damages</li>
            <li>AI output inaccuracies</li>
          </ul>
          <p className="text-gray-300">Users assume responsibility for verifying generated content.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">10. Governing Law</h2>
          <p className="text-gray-300">These Terms shall be governed by the applicable laws of the jurisdiction in which VEYTRIX.AI operates.</p>
        </section>
      </main>
    </div>
  );
}
