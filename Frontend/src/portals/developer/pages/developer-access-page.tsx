import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
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

export function DeveloperAccessPage() {
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
  const [debugStep, setDebugStep] = useState("Idle");

  const redirectTarget = location.state?.from || "/developer/dashboard";

  const resolveInternalProfile = async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      setDebugStep(`Checking browser session (${attempt + 1}/5)`);
      const { data: sessionData } = (await withTimeout(
        supabase!.auth.getSession(),
        5000,
        "Timed out while reading the Supabase browser session.",
      )) as any;
      if (sessionData.session) {
        setDebugStep(`Loading app profile (${attempt + 1}/5)`);
        const profile = await withTimeout(
          fetchAppProfile(sessionData.session),
          5000,
          "Timed out while loading your app profile from Supabase.",
        );
        // Check for developer, admin, or tester portal access
        if (profile.portalAccess.includes("developer") || profile.portalAccess.includes("admin") || profile.portalAccess.includes("tester")) {
          return profile;
        }
      }

      await wait(250);
    }

    return null;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setDebugStep("Validating environment");

    if (!supabase || !isSupabaseConfigured) {
      setError("Supabase is not configured for authentication.");
      setDebugStep("Missing Supabase configuration");
      return;
    }

    setIsLoading(true);
    setDebugStep("Requesting Supabase sign-in");
    localStorage.setItem("portalIntent", "developer");

    try {
      const { data, error: signInError } = (await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        10000,
        "Supabase sign-in timed out. Check your network tab or Supabase Auth settings.",
      )) as any;
      if (signInError) {
        setError(signInError.message);
        setDebugStep("Supabase rejected credentials");
      } else if (!data.session) {
        setError("Login succeeded but no session was returned. Please try again.");
        setDebugStep("No session returned from sign-in");
      } else {
        setDebugStep("Credentials accepted, verifying internal access");
        const profile = await resolveInternalProfile();

        if (!profile) {
          await supabase.auth.signOut();
          localStorage.removeItem("portalIntent");
          setError("This account signed in, but developer access could not be verified. Confirm your app_profiles row has a developer/admin/tester role, then try again.");
          setDebugStep("Profile lookup finished without developer access");
          return;
        }

        let target = redirectTarget;
        if (!location.state?.from) {
          if (profile.portalAccess.includes("admin")) {
            target = "/admin/dashboard";
          } else if (profile.portalAccess.includes("developer")) {
            target = "/developer/dashboard";
          } else if (profile.portalAccess.includes("tester")) {
            target = "/tester/dashboard";
          }
        }

        setDebugStep("Developer access verified, redirecting");
        navigate(target, { replace: true });
      }
    } catch (error: any) {
      setError(error?.message || "Developer login failed. Please try again.");
      setDebugStep("Developer login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,#28491b_0%,#111827_40%,#030712_100%)] text-white px-6 py-12">
      <div className="mx-auto max-w-5xl grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/5 p-10 backdrop-blur-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-200">Developer Portal</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight">Secure developer, admin, and testing access.</h1>
          <p className="mt-5 max-w-2xl text-slate-200">
            This route is isolated from public workflows. Developer tools, admin controls, testing environment, logs, and hidden experiments live here and are tagged as `usage_type = test`.
          </p>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-8">
          <form onSubmit={submit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="team@veytrix.ai"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-slate-500"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Internal password"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-slate-500"
            />

            {error && <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
            <p className="rounded-2xl border border-sky-400/20 bg-sky-400/5 px-4 py-3 text-xs leading-6 text-sky-100/90">
              Debug step: <strong>{debugStep}</strong>
            </p>
            <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-xs leading-6 text-emerald-100/90">
              This login only works for existing Supabase users whose <code>app_profiles.role</code> is <code>super_admin</code>, <code>admin</code>, <code>developer</code>, or <code>tester</code>.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-200 disabled:opacity-60"
            >
              {isLoading ? "Authorizing..." : "Enter internal portal"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
