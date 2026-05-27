import { useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase";
import { fetchAppProfile } from "../../../services/auth-profile";

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!isSupabaseConfigured || !supabase) {
          console.error("Supabase frontend env is not configured.");
          navigate("/");
          return;
        }

        const { data, error } = await supabase.auth.getSession();

        if (error || !data?.session) {
          console.error("Auth error:", error);
          navigate("/");
          return;
        }

        const profile = await fetchAppProfile(data.session);
        const portalIntent = localStorage.getItem("portalIntent");

        if (portalIntent === "internal" && profile.portalAccess.includes("internal")) {
          navigate("/internal", { replace: true });
          return;
        }

        navigate("/app", { replace: true });
      } catch (err) {
        console.error("Callback error:", err);
        navigate("/");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4" />
        <p className="text-white text-lg font-semibold">Signing you in...</p>
      </div>
    </div>
  );
}
