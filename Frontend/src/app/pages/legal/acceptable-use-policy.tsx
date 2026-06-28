import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

export function AcceptableUsePolicyPage() {
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
        <h1 className="text-4xl font-black mb-8">VEYTRIX.AI Acceptable Use Policy</h1>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">1. Purpose</h2>
          <p className="text-gray-300">This policy defines acceptable use of VEYTRIX.AI services and protects the platform and community from misuse.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">2. Permitted Use</h2>
          <p className="text-gray-300">Users may use VEYTRIX.AI for:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Creative projects</li>
            <li>Commercial content creation</li>
            <li>Marketing materials</li>
            <li>Educational purposes</li>
            <li>Entertainment</li>
            <li>Product demonstrations</li>
            <li>Social media content</li>
          </ul>
          <p className="text-gray-300">provided such use complies with applicable laws.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">3. Prohibited Activities</h2>
          <p className="text-gray-300">Users must not use VEYTRIX.AI to create or distribute:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Illegal content</li>
            <li>Terrorist propaganda</li>
            <li>Hate speech</li>
            <li>Child exploitation material</li>
            <li>Graphic violence</li>
            <li>Fraudulent content</li>
            <li>Deepfake impersonation intended to deceive</li>
            <li>Malware</li>
            <li>Phishing materials</li>
            <li>Spam</li>
            <li>Copyright-infringing material without authorization</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">4. Platform Abuse</h2>
          <p className="text-gray-300">Users may not:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Reverse engineer the platform</li>
            <li>Bypass security measures</li>
            <li>Attempt unauthorized access</li>
            <li>Exploit vulnerabilities</li>
            <li>Abuse APIs</li>
            <li>Use bots for unauthorized automation</li>
            <li>Resell platform access without permission</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">5. AI Safety</h2>
          <p className="text-gray-300">Users are responsible for reviewing AI-generated outputs before publication.</p>
          <p className="text-gray-300">VEYTRIX.AI does not guarantee factual accuracy or legal compliance of generated content.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">6. Resource Usage</h2>
          <p className="text-gray-300">Excessive or abusive consumption of system resources that negatively impacts other users may result in throttling or suspension.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">7. Enforcement</h2>
          <p className="text-gray-300">Violations may result in:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Content removal</li>
            <li>Credit forfeiture</li>
            <li>Temporary suspension</li>
            <li>Permanent account termination</li>
            <li>Reporting to appropriate authorities where required</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">8. Reporting Violations</h2>
          <p className="text-gray-300">Users are encouraged to report misuse or policy violations to VEYTRIX.AI for investigation.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">9. Policy Updates</h2>
          <p className="text-gray-300">This Acceptable Use Policy may be revised periodically to address evolving technologies, security concerns, and legal requirements.</p>
          <p className="text-gray-300">Continued use of VEYTRIX.AI constitutes acceptance of the updated policy.</p>
        </section>
      </main>
    </div>
  );
}
