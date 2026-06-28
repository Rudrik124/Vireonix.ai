export function DeveloperOperationsPage() {
  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,#264d39_0%,#0f172a_45%,#020617_100%)] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-[2rem] border border-emerald-400/20 bg-white/5 p-8 backdrop-blur-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-200">Operations</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">Admin surfaces for users, subscriptions, and feature toggles.</h1>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6">
              <h2 className="text-xl font-black">User Management</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">Assign roles, audit access, and separate internal accounts from customer accounts.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6">
              <h2 className="text-xl font-black">Subscription Control</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">View plan status, reconcile public billing, and keep internal testing usage out of production invoices.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6">
              <h2 className="text-xl font-black">Feature Flags</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">Gate beta tools, restrict hidden experiments, and stage releases before exposing them in the public portal.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
