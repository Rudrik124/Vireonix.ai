import { Link } from "react-router";
import { Activity, ArrowRight, Bug, ExternalLink, FlaskConical, ShieldCheck, ToggleRight, Users, Wand2 } from "lucide-react";
import { useAuth } from "../../../app/context/auth-context";
import { buildPortalAwarePath } from "../../../shared/portal/testing-context";

const internalCards = [
  {
    title: "Workflow Lab",
    description: "Trigger AI functions with `test` usage tags and optional credit bypass.",
    href: "/internal/workflows",
    icon: FlaskConical,
  },
  {
    title: "Logs & Monitoring",
    description: "Inspect usage logs, API logs, and testing traces without exposing them to users.",
    href: "/internal/logs",
    icon: Activity,
  },
  {
    title: "Operations",
    description: "Manage users, subscriptions, role assignments, and internal toggles.",
    href: "/internal/operations",
    icon: Users,
  },
];

export function DeveloperDashboardPage() {
  const { profile } = useAuth();
  const internalToolLinks = [
    {
      title: "Test AI Generated Video",
      description: "Launch prompt-to-video with internal credits and test analytics.",
      href: buildPortalAwarePath("/create", "?portal=internal&usageType=test"),
    },
    {
      title: "Test Reference Video",
      description: "Open the reference-video studio in developer testing mode.",
      href: buildPortalAwarePath("/reference-video/setup", "?portal=internal&usageType=test"),
    },
    {
      title: "Test Images to Video",
      description: "Run image and media generation without affecting production billing.",
      href: buildPortalAwarePath("/images-to-video/upload", "?portal=internal&usageType=test"),
    },
    {
      title: "Test Quick Edit",
      description: "Use the quick-edit pipeline with internal test tagging.",
      href: buildPortalAwarePath("/quick-edit/upload", "?portal=internal&usageType=test"),
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#264d39_0%,#0f172a_45%,#020617_100%)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <section className="rounded-[2rem] border border-emerald-400/20 bg-white/5 p-8 backdrop-blur-2xl">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-200">Developer Portal</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight">Internal testing and admin control plane.</h1>
              <p className="mt-4 max-w-3xl text-slate-300">
                Team workflows are isolated here with separate permissions, hidden features, and dedicated `developer_credits` or bypassed billing flows.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-4">
              <p className="text-sm text-slate-400">Signed in as</p>
              <p className="text-xl font-black capitalize">{profile?.role?.replace("_", " ") || "internal user"}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <MetricCard icon={ShieldCheck} label="Portal Access" value="Protected" />
            <MetricCard icon={Bug} label="Testing Mode" value={profile?.testingModeEnabled ? "Enabled" : "Controlled"} />
            <MetricCard icon={ToggleRight} label="Credit Strategy" value={profile?.bypassCreditChecks ? "Bypass" : "Developer Wallet"} />
            <MetricCard icon={Users} label="Data Isolation" value="Separate" />
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {internalCards.map((card) => (
            <Link
              key={card.title}
              to={card.href}
              className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-emerald-300/40 hover:bg-white/10"
            >
              <card.icon className="h-10 w-10 rounded-2xl bg-emerald-300/10 p-2.5 text-emerald-200" />
              <h2 className="mt-5 text-xl font-black">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{card.description}</p>
            </Link>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr,0.8fr]">
          <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/5 p-6">
            <div className="flex items-center gap-3">
              <Wand2 className="h-5 w-5 text-cyan-300" />
              <h2 className="text-xl font-black">Developer Testing Launchpad</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              These links open the same product workflows in internal test mode so the requests can be tagged separately from normal users.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {internalToolLinks.map((link) => (
                <Link
                  key={link.title}
                  to={link.href}
                  className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 transition hover:-translate-y-1 hover:border-cyan-300/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black uppercase tracking-[0.15em] text-cyan-100">{link.title}</h3>
                    <ArrowRight className="h-4 w-4 text-cyan-300" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{link.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <ExternalLink className="h-5 w-5 text-emerald-200" />
              <h2 className="text-xl font-black">Portal Switch</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Jump back to the production-facing user experience whenever you want to compare internal testing against the normal customer portal.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/app"
                className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-cyan-100"
              >
                Open Normal User Portal
              </Link>
              <Link
                to="/features"
                className="rounded-full border border-white/10 bg-black/20 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/10"
              >
                Open Public Feature Chooser
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof ShieldCheck; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <Icon className="h-5 w-5 text-emerald-200" />
      <p className="mt-4 text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
