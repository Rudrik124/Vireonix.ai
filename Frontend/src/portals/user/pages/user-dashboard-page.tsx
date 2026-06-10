import { Link } from "react-router";
import { CreditCard, History, ImagePlus, Settings, Sparkles, Wand2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../../app/context/auth-context";
import { fetchCreditOverview } from "../../../services/usage.service";

const quickActions = [
  {
    title: "AI Generated Video",
    description: "Prompt-driven generation with production credit tracking.",
    href: "/create",
    icon: Sparkles,
  },
  {
    title: "Images to Video",
    description: "Upload images or clips and generate polished motion outputs.",
    href: "/images-to-video/upload",
    icon: ImagePlus,
  },
  {
    title: "Quick Edit",
    description: "Use AI-enhanced editing without entering the internal testing flow.",
    href: "/quick-edit/upload",
    icon: Wand2,
  },
];

export function UserDashboardPage() {
  const { profile } = useAuth();
  const [credits, setCredits] = useState(profile?.credits || { userCredits: 0, developerCredits: 0 });

  useEffect(() => {
    let mounted = true;

    fetchCreditOverview(profile).then((nextCredits) => {
      if (mounted && nextCredits) {
        setCredits(nextCredits);
      }
    });

    return () => {
      mounted = false;
    };
  }, [profile]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#12314f_0%,#08111e_45%,#050914_100%)] text-white">
      <header className="mx-auto max-w-7xl px-6 pt-8 flex justify-between items-center">
        <div className="text-xl font-black tracking-tight">VEYTRIX.AI</div>
        <Link 
          to="/wallet" 
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-bold text-cyan-400 hover:bg-white/10 hover:text-cyan-300 transition-all"
        >
          <Wallet className="w-4 h-4" /> Wallet
        </Link>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          <section className="rounded-[2rem] border border-cyan-500/20 bg-white/5 p-8 backdrop-blur-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">User Portal</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight">Production workspace for customer-facing AI workflows.</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Credits, subscriptions, output history, and tool access are isolated from the internal testing environment.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <CreditCard className="h-5 w-5 text-cyan-300" />
                <p className="mt-4 text-sm text-slate-400">User credits</p>
                <p className="mt-1 text-3xl font-black">{credits.userCredits}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <History className="h-5 w-5 text-cyan-300" />
                <p className="mt-4 text-sm text-slate-400">Subscription</p>
                <p className="mt-1 text-2xl font-black capitalize">{profile?.subscriptionStatus || "free"}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <Settings className="h-5 w-5 text-cyan-300" />
                <p className="mt-4 text-sm text-slate-400">Portal access</p>
                <p className="mt-1 text-2xl font-black">User</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-amber-400/20 bg-amber-400/5 p-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-200">Security Boundary</p>
            <p className="mt-4 text-lg font-semibold">Internal metrics and test credits stay outside this portal.</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              User traffic is billed against `user_credits` and logged as `usage_type = production`. Internal routes require separate role checks and never leak admin-only analytics.
            </p>
            <Link
              to="/features"
              className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-cyan-100"
            >
              Explore tools
            </Link>
          </section>
        </div>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/10"
            >
              <action.icon className="h-10 w-10 rounded-2xl bg-cyan-400/10 p-2.5 text-cyan-300" />
              <h2 className="mt-5 text-xl font-black">{action.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{action.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
