import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Users, Shield, CheckCircle, Eye, ChevronLeft } from "lucide-react";
import { useAuth } from "../../../app/context/auth-context";
import { getSecurityRoles, logSecurityPortalActivity } from "../../../services/security-portal.service";
import type { SecurityRole } from "../../../services/security-portal.service";

export function SecurityRolesPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      logSecurityPortalActivity({
        user_id: profile.id,
        user_email: profile.email,
        event_type: "SECURITY_PORTAL_ACCESS",
        module: "Roles",
        action: "Accessed Role Management",
      }).catch(console.error);
    }

    loadRoles();
  }, [profile]);

  const loadRoles = async () => {
    try {
      const data = await getSecurityRoles();
      setRoles(data);
    } catch (error) {
      console.error("Error loading roles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse">Loading roles...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/security")}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-3 transition"
        >
          <ChevronLeft size={18} />
          Back to Security Portal
        </button>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-indigo-400" />
          Role Management
        </h1>
        <p className="text-sm text-slate-400">Configure security roles and permissions for the Security Portal</p>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-blue-700/30 bg-blue-900/20 p-4"
      >
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-300 font-semibold">Role-Based Access Control</p>
            <p className="text-blue-200 text-sm mt-1">
              The Security Portal uses role-based access control (RBAC) to restrict access based on user roles. Each role has specific permissions.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role, idx) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                {role.name}
              </h3>
              <p className="text-sm text-slate-400 mt-1">{role.description}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300 uppercase">Permissions</p>
              <div className="space-y-2">
                {role.permissions.map((permission, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300">{permission.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700/30">
              <p className="text-xs text-slate-500">
                Created: {new Date(role.created_at).toLocaleDateString()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Role Hierarchy */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-cyan-400" />
          Role Hierarchy
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 rounded-lg border border-slate-700/30 bg-slate-800/30 p-4">
              <p className="text-sm font-semibold text-slate-300">SECURITY_VIEWER</p>
              <p className="text-xs text-slate-500 mt-1">Read-only access to security dashboards</p>
            </div>
            <div className="text-slate-500">↓</div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 rounded-lg border border-slate-700/30 bg-slate-800/30 p-4">
              <p className="text-sm font-semibold text-slate-300">SECURITY_ANALYST</p>
              <p className="text-xs text-slate-500 mt-1">Can manage security alerts and investigations</p>
            </div>
            <div className="text-slate-500">↓</div>
          </div>

          <div className="flex-1 rounded-lg border border-slate-700/30 bg-slate-800/30 p-4">
            <p className="text-sm font-semibold text-slate-300">SECURITY_ADMIN</p>
            <p className="text-xs text-slate-500 mt-1">Full access including settings and configuration</p>
          </div>
        </div>
      </motion.div>

      {/* Access Control Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Security Portal Access</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-slate-300 font-semibold">Your Current Role</p>
            <p className="text-slate-400 mt-1 font-mono bg-slate-800/50 px-3 py-2 rounded">{profile?.role}</p>
          </div>

          <div className="pt-3 border-t border-slate-700/30">
            <p className="text-slate-300 font-semibold mb-2">Portal Access Rules</p>
            <ul className="space-y-2 text-slate-400">
              <li>• Only users with SECURITY or ADMIN roles can access this portal</li>
              <li>• All portal access and actions are logged for audit purposes</li>
              <li>• Unauthorized access attempts are recorded as security events</li>
              <li>• Role changes require SECURITY_ADMIN or higher privileges</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
