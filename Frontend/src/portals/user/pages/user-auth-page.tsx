import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchAppProfile } from "../../../services/auth-profile";

export function UserAuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const redirectTarget = location.state?.from || "/app";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!supabase || !isSupabaseConfigured) {
      setError("Supabase is not configured for authentication.");
      return;
    }

    setIsLoading(true);
    localStorage.setItem("portalIntent", "user");

    try {
      if (mode === "signin") {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
        } else {
          let target = redirectTarget;
          if (!location.state?.from && data?.session) {
            const profile = await fetchAppProfile(data.session);
            const userEmail = data.session.user.email?.toLowerCase();
            if (userEmail === "admin@veytrix.ai") {
              target = "/admin/dashboard";
            } else if (userEmail === "developer@veytrix.ai") {
              target = "/developer/dashboard";
            } else if (userEmail === "tester@veeytrix.ai" || userEmail === "tester@veytrix.ai") {
              target = "/tester/dashboard";
            } else if (profile.role === "admin" || profile.role === "super_admin" || profile.portalAccess.includes("admin")) {
              target = "/admin/dashboard";
            } else if (profile.role === "developer" || profile.portalAccess.includes("developer")) {
              target = "/developer/dashboard";
            } else if (profile.role === "tester" || profile.portalAccess.includes("tester")) {
              target = "/tester/dashboard";
            }
          }
          navigate(target, { replace: true });
        }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
        } else {
          setMessage("Account created. Check your inbox to verify your email, then sign in.");
          setMode("signin");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,#12314f_0%,#08111e_45%,#050914_100%)] text-white px-6 py-12">
      <div className="mx-auto max-w-5xl grid gap-6 lg:grid-cols-[1.2fr,0.9fr]">
        <section className="rounded-[2rem] border border-cyan-500/20 bg-white/5 p-10 backdrop-blur-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">User Access</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight">Customer portal sign-in and subscription workflow.</h1>
          <p className="mt-5 max-w-2xl text-slate-300">
            Public users authenticate here, spend `user_credits`, and stay isolated from testing analytics, internal flags, and admin-only tooling.
          </p>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-8">
          <div className="flex gap-2 rounded-full bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-bold ${mode === "signin" ? "bg-white text-slate-950" : "text-slate-300"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-bold ${mode === "signup" ? "bg-white text-slate-950" : "text-slate-300"}`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Full name"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-slate-500"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-slate-500"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-slate-500"
            />

            {error && <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
            {message && <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-100 disabled:opacity-60"
            >
              {isLoading ? "Please wait..." : mode === "signin" ? "Enter user portal" : "Create account"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
