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
        const userEmail = data.session.user.email?.toLowerCase();

        // Absolute priority: Check for specific exact emails
        if (userEmail === "admin@veytrix.ai") {
          navigate("/admin/dashboard", { replace: true });
          return;
        }
        if (userEmail === "developer@veytrix.ai") {
          navigate("/developer/dashboard", { replace: true });
          return;
        }
        if (userEmail === "tester@veeytrix.ai" || userEmail === "tester@veytrix.ai") {
          navigate("/tester/dashboard", { replace: true });
          return;
        }

        const authRedirectUrl = localStorage.getItem("authRedirectUrl");
        if (authRedirectUrl) {
          localStorage.removeItem("authRedirectUrl");
          navigate(authRedirectUrl, { replace: true });
          return;
        }

        // First priority: Respect explicit portal intent if they have the role or access
        if (portalIntent === "admin" && (profile.role === "admin" || profile.role === "super_admin" || profile.portalAccess.includes("admin"))) {
          navigate("/admin/dashboard", { replace: true });
          return;
        }
        if (portalIntent === "developer" && (profile.role === "developer" || profile.role === "super_admin" || profile.portalAccess.includes("developer"))) {
          navigate("/developer/dashboard", { replace: true });
          return;
        }
        if (portalIntent === "tester" && (profile.role === "tester" || profile.role === "developer" || profile.role === "admin" || profile.role === "super_admin" || profile.portalAccess.includes("tester"))) {
          navigate("/tester/dashboard", { replace: true });
          return;
        }

        // Second priority: Route by their highest role / access
        if (profile.role === "admin" || profile.role === "super_admin" || profile.portalAccess.includes("admin")) {
          navigate("/admin/dashboard", { replace: true });
          return;
        }
        
        if (profile.role === "developer" || profile.portalAccess.includes("developer")) {
          navigate("/developer/dashboard", { replace: true });
          return;
        }
        
        if (profile.role === "tester" || profile.portalAccess.includes("tester")) {
          navigate("/tester/dashboard", { replace: true });
          return;
        }

        // Default to user app
        navigate("/video-type", { replace: true });
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
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mb-4" />
        <p className="text-white text-lg font-semibold">Signing you in...</p>
      </div>
    </div>
  );
}
