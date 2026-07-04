import { useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchAppProfile } from "../../../services/auth-profile";
import { detectDeviceInfo, recordLoginActivity } from "../../../lib/auth-login-activity";
import { getRoleRedirectUrl } from "../../../lib/role-redirect";

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

        let sessionResult = await supabase.auth.getSessionFromUrl();
        if (!sessionResult.data?.session) {
          sessionResult = await supabase.auth.getSession();
        }

        if (sessionResult.error || !sessionResult.data?.session) {
          console.error("Auth error:", sessionResult.error);
          navigate("/");
          return;
        }

        const profile = await fetchAppProfile(sessionResult.data.session);
        await recordLoginActivity(sessionResult.data.session, profile);
        const portalIntent = localStorage.getItem("portalIntent");
        const userEmail = sessionResult.data.session.user.email?.toLowerCase();

        // Resolve the redirect URL using the centralized helper
        const authRedirectUrl = localStorage.getItem("authRedirectUrl");
        if (authRedirectUrl) {
          localStorage.removeItem("authRedirectUrl");
        }

        let fallbackUrl = authRedirectUrl || "/home";

        // Handle specific portal intent for admin since admin is a special case
        if (portalIntent === "admin") {
          fallbackUrl = "/admin/dashboard";
        }

        const nextRoute = getRoleRedirectUrl(userEmail, profile, fallbackUrl);
        navigate(nextRoute, { replace: true });
        return;

      } catch (err) {
        console.error("Callback error:", err);
        navigate("/");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mb-4" />
        <p className="text-white text-lg font-semibold">Signing you in...</p>
      </div>
    </div>
  );
}
