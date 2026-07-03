import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "../../../app/context/auth-context";
import { RateLimitMonitoringDashboard } from "../../../portals/developer/components/rate-limit-monitoring-dashboard";
import { logSecurityPortalActivity } from "../../../services/security-portal.service";

export function SecurityRateLimitPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  useEffect(() => {
    if (profile) {
      logSecurityPortalActivity({
        user_id: profile.id,
        user_email: profile.email,
        event_type: "SECURITY_PORTAL_ACCESS",
        module: "Rate Limit Monitoring",
        action: "Accessed Rate Limit Monitoring",
      }).catch(console.error);
    }
  }, [profile]);
  
  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/security")}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition"
      >
        <ChevronLeft size={18} />
        Back to Security Portal
      </button>
      <RateLimitMonitoringDashboard />
    </div>
  );
}
