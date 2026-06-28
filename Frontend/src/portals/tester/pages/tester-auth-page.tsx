import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase";
import { fetchAppProfile } from "../../../services/auth-profile";

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
          </form>
        </section>
      </div>
    </div>
  );
}
