import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

export function RefundPolicyPage() {
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
        <h1 className="text-4xl font-black mb-8">VEYTRIX.AI Refund Policy</h1>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">1. General Policy</h2>
          <p className="text-gray-300">All purchases are subject to this Refund Policy.</p>
          <p className="text-gray-300">Users are encouraged to review subscription details before making payments.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">2. Subscription Refunds</h2>
          <p className="text-gray-300">Refund requests may be considered if:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Duplicate payment occurred</li>
            <li>Billing error occurred</li>
            <li>Service was unavailable due to platform failure</li>
            <li>Payment was processed incorrectly</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">3. Non-Refundable Items</h2>
          <p className="text-gray-300">The following are generally non-refundable:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Used AI credits</li>
            <li>Completed AI generations</li>
            <li>Consumed subscription benefits</li>
            <li>Promotional plans</li>
            <li>Lifetime offers</li>
            <li>Custom enterprise services</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">4. Failed Generations</h2>
          <p className="text-gray-300">If a generation fails due to a verified system issue, credits may be restored automatically or manually after review.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">5. Cancellation</h2>
          <p className="text-gray-300">Users may cancel subscriptions at any time.</p>
          <p className="text-gray-300">Cancellation prevents future billing but does not automatically generate refunds for the current billing cycle unless required by law.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">6. Refund Processing</h2>
          <p className="text-gray-300">Approved refunds are typically processed through the original payment method.</p>
          <p className="text-gray-300">Processing times depend on payment providers and banking institutions.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">7. Abuse Prevention</h2>
          <p className="text-gray-300">Refund abuse, chargeback fraud, or repeated malicious refund requests may result in account suspension.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">8. Pricing Changes</h2>
          <p className="text-gray-300">VEYTRIX.AI reserves the right to modify pricing, plans, and credit allocations at any time with appropriate notice.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-fuchsia-400">9. Exceptional Cases</h2>
          <p className="text-gray-300">Refund requests outside these conditions may be reviewed individually at the sole discretion of VEYTRIX.AI.</p>
        </section>
      </main>
    </div>
  );
}
