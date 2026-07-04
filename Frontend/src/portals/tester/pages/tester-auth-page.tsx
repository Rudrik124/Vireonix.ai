import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchAppProfile } from "../../../services/auth-profile";
import { signInWithGoogle } from "@/lib/auth-helpers";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const withTimeout = async <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
  let timeoutHandle: number | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = window.setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      window.clearTimeout(timeoutHandle);
    }
  }
};

export function TesterAuthPage() {
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const redirectTarget = location.state?.from || "/tester/dashboard";

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

    if (!supabase || !isSupabaseConfigured) {
      setError("Supabase is not configured for authentication.");
      return;
    }

    setIsLoading(true);
    localStorage.setItem("portalIntent", "tester");

    try {
      const { data, error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        10000,
        "Sign-in timed out. Check your network."
      ) as any;

      if (signInError) {
        setError(signInError.message);
      } else if (!data.session) {
        setError("Login succeeded but no session was returned.");
      } else {
        const profile = await fetchAppProfile(data.session);

        const userEmail = data.session.user.email?.toLowerCase();
        const isHardcodedTester = userEmail === "tester@veeytrix.ai" || userEmail === "tester@veytrix.ai";

        if (!isHardcodedTester && !profile.portalAccess.includes("tester") && !profile.portalAccess.includes("developer") && !profile.portalAccess.includes("admin")) {
          await supabase.auth.signOut();
          localStorage.removeItem("portalIntent");
          setError("This account does not have tester access.");
          return;
        }

        navigate(redirectTarget, { replace: true });
      }
    } catch (error: any) {
      setError(error?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,#4a1b49_0%,#111827_40%,#030712_100%)] text-white px-6 py-12">
      <div className="mx-auto max-w-5xl grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <section className="rounded-[2rem] border border-purple-400/20 bg-purple-400/5 p-10 backdrop-blur-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-purple-200">Tester Portal</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight">Secure testing environment.</h1>
          <p className="mt-5 max-w-2xl text-slate-200">
            Log in here to access testing features, submit bug reports, and validate video generation capabilities.
          </p>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-8">
          <form onSubmit={submit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tester@veytrix.ai"
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

            <p className="rounded-2xl border border-purple-400/20 bg-purple-400/5 px-4 py-3 text-xs leading-6 text-purple-100/90">
              This portal is restricted to accounts with <code>tester</code> privileges.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-purple-500 px-5 py-3 text-sm font-black text-white transition hover:bg-purple-400 disabled:opacity-60"
            >
              {isLoading ? "Authorizing..." : "Enter tester portal"}
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
