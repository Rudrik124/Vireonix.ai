import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchAppProfile } from "../../../services/auth-profile";
import { signInWithGoogle } from "@/lib/auth-helpers";

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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  };

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
            const userEmail = data.session.user.email?.toLowerCase();
            if (userEmail === "admin@veytrix.ai") {
              target = "/admin/dashboard";
            } else if (userEmail === "developer@veytrix.ai") {
              target = "/developer/dashboard";
            } else if (userEmail === "tester@veeytrix.ai" || userEmail === "tester@veytrix.ai") {
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

            <div className="mt-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Or continue with</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-11 flex items-center justify-center gap-2 bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 rounded-xl transition-all group"
                title="Google"
              >
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] group-hover:scale-110 transition-transform">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-sm font-semibold text-white/90">Google</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
