import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "../../../app/context/auth-context";
import { AuditLogDashboard } from "../../../portals/developer/components/audit-log-dashboard";
import { logSecurityPortalActivity } from "../../../services/security-portal.service";

export function SecurityAuditLogsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      logSecurityPortalActivity({
        user_id: profile.id,
        user_email: profile.email,
        event_type: "SECURITY_PORTAL_ACCESS",
        module: "Audit Logs",
        action: "Accessed Audit Logs module",
      }).catch(console.error);
    }
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/security")}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-4 transition"
          >
            <ChevronLeft size={18} />
            Back to Security Portal
          </button>
          <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
          <p className="text-sm text-slate-400 mt-1">View and manage system audit logs</p>
        </div>
      </div>
      <AuditLogDashboard />
    </div>
  );
}
