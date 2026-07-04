import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  BarChart3,
  Activity,
  AlertCircle,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Eye,
  FileText,
  Lock,
  AlertTriangle,
  Zap,
  Upload,
  MessageSquare,
  Video,
  TrendingUp,
  Globe,
  Settings,
  Users,
} from "lucide-react";
import { useAuth } from "../../../app/context/auth-context";
import { logSecurityPortalActivity } from "../../../services/security-portal.service";

const SECURITY_MODULES = [
  { id: "overview", label: "Security Overview", path: "/security/overview", icon: BarChart3, color: "indigo" },
  { id: "audit-logs", label: "Audit Logs", path: "/security/audit-logs", icon: FileText, color: "blue" },
  {
    id: "authentication",
    label: "Authentication",
    path: "/security/authentication-monitoring",
    icon: Lock,
    color: "cyan",
  },
  {
    id: "prompt-security",
    label: "Prompt Security",
    path: "/security/prompt-security",
    icon: MessageSquare,
    color: "purple",
  },
  {
    id: "file-upload",
    label: "File Upload Security",
    path: "/security/file-upload-security",
    icon: Upload,
    color: "cyan",
  },
  { id: "rate-limit", label: "Rate Limit Monitoring", path: "/security/rate-limit-monitoring", icon: Zap, color: "amber" },
  { id: "api-security", label: "API Security", path: "/security/api-security", icon: Shield, color: "blue" },
  { id: "ai-cost", label: "AI Cost Monitoring", path: "/security/ai-cost-monitoring", icon: TrendingUp, color: "green" },
  { id: "user-risk", label: "User Risk Scoring", path: "/security/user-risk-scoring", icon: AlertTriangle, color: "orange" },
  {
    id: "security-alerts",
    label: "Security Alerts",
    path: "/security/security-alerts",
    icon: AlertCircle,
    color: "rose",
  },
  {
    id: "admin-activity",
    label: "Admin Activity",
    path: "/security/admin-activity",
    icon: Activity,
    color: "indigo",
  },
  { id: "threat-map", label: "Threat Visualization", path: "/security/threat-visualization", icon: Globe, color: "red" },
];

const ADMIN_MODULES = [
  { id: "settings", label: "Security Settings", path: "/security/settings", icon: Settings, color: "slate" },
  { id: "roles", label: "Role Management", path: "/security/roles", icon: Users, color: "slate" },
];

export function SecurityPortalDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCompact, setIsCompact] = useState(false);

  // Redirect if not authorized
  useEffect(() => {
    const isAuthorized = profile && (
      ["admin", "super_admin", "security"].includes(profile.role || "") ||
      profile.email === "security@veytrix.ai"
    );

    if (!isAuthorized) {
      navigate("/");
    } else {
      // Log security portal access
      logSecurityPortalActivity({
        user_id: profile.id,
        user_email: profile.email,
        event_type: "SECURITY_PORTAL_LOGIN",
        module: "Security Portal",
        action: "User accessed Security Portal",
        timestamp: new Date().toISOString(),
      }).catch(console.error);
    }
  }, [profile, navigate]);

  const handleLogout = async () => {
    // Log logout event
    if (profile) {
      await logSecurityPortalActivity({
        user_id: profile.id,
        user_email: profile.email,
        event_type: "SECURITY_PORTAL_ACCESS",
        module: "Security Portal",
        action: "User logged out from Security Portal",
        timestamp: new Date().toISOString(),
      }).catch(console.error);
    }
    logout();
  };

  const isSecurityAdmin = profile?.role === "admin" || profile?.role === "super_admin" || profile?.email === "security@veytrix.ai";
  const visibleModules = isSecurityAdmin ? [...SECURITY_MODULES, ...ADMIN_MODULES] : SECURITY_MODULES;

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      indigo: "text-indigo-400",
      blue: "text-blue-400",
      cyan: "text-cyan-400",
      purple: "text-purple-400",
      amber: "text-amber-400",
      green: "text-green-400",
      orange: "text-orange-400",
      rose: "text-rose-400",
      red: "text-red-400",
      slate: "text-slate-400",
    };
    return colorMap[color] || "text-slate-400";
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="sticky top-0 h-[100dvh] border-r border-slate-800 bg-slate-950/80 backdrop-blur-md overflow-hidden"
      >
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <motion.div
              animate={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? "auto" : 0 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <Shield className="w-6 h-6 text-indigo-400 flex-shrink-0" />
              <span className="font-bold text-sm whitespace-nowrap">Security Portal</span>
            </motion.div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-slate-800 rounded transition-colors"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Modules List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Security Modules */}
          <div>
            {sidebarOpen && (
              <h3 className="text-xs font-semibold text-slate-500 uppercase px-3 py-2 mb-2">Monitoring</h3>
            )}
            {SECURITY_MODULES.map((module) => {
              const Icon = module.icon;
              const isActive = location.pathname === module.path;

              return (
                <motion.button
                  key={module.id}
                  onClick={() => {
                    navigate(module.path);
                    logSecurityPortalActivity({
                      user_id: profile?.id || "",
                      user_email: profile?.email,
                      event_type: "SECURITY_PORTAL_ACCESS",
                      module: module.label,
                      action: `Accessed ${module.label}`,
                      timestamp: new Date().toISOString(),
                    }).catch(console.error);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30" : "text-slate-400 hover:bg-slate-800/50"
                  }`}
                  title={module.label}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${getColorClass(module.color)}`} />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm whitespace-nowrap overflow-hidden"
                      >
                        {module.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          {/* Admin Modules */}
          {isSecurityAdmin && (
            <div className="pt-4 border-t border-slate-800">
              {sidebarOpen && <h3 className="text-xs font-semibold text-slate-500 uppercase px-3 py-2 mb-2">Admin</h3>}
              {ADMIN_MODULES.map((module) => {
                const Icon = module.icon;
                const isActive = location.pathname === module.path;

                return (
                  <motion.button
                    key={module.id}
                    onClick={() => {
                      navigate(module.path);
                      logSecurityPortalActivity({
                        user_id: profile?.id || "",
                        user_email: profile?.email,
                        event_type: "SECURITY_PORTAL_ACTION",
                        module: module.label,
                        action: `Accessed ${module.label}`,
                        timestamp: new Date().toISOString(),
                      }).catch(console.error);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30" : "text-slate-400 hover:bg-slate-800/50"
                    }`}
                    title={module.label}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${getColorClass(module.color)}`} />
                    <AnimatePresence>
                      {sidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="text-sm whitespace-nowrap overflow-hidden"
                        >
                          {module.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="p-3 border-t border-slate-800">
          {sidebarOpen ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="text-xs">
                <p className="text-slate-400">Logged in as</p>
                <p className="font-mono text-cyan-400 truncate">{profile?.email}</p>
                <p className="text-slate-500 text-xs mt-1">{profile?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors text-sm"
              >
                <LogOut size={16} />
                Logout
              </button>
            </motion.div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 backdrop-blur-sm bg-slate-950/80 border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-white">Security Portal</h1>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <p className="text-slate-400">Portal Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-green-400">All Systems Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {location.pathname === "/security" ? (
              // Landing Page
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Welcome to Security Portal</h2>
                  <p className="text-slate-400">Monitor and manage all security aspects of your system</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleModules.map((module) => {
                    const Icon = module.icon;
                    return (
                      <motion.button
                        key={module.id}
                        onClick={() => navigate(module.path)}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className="text-left p-4 rounded-xl border border-slate-700/50 bg-slate-900/30 backdrop-blur-md hover:border-indigo-500/30 hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <Icon className={`w-6 h-6 ${getColorClass(module.color)}`} />
                        </div>
                        <h3 className="font-semibold text-white mb-1">{module.label}</h3>
                        <p className="text-xs text-slate-400">Access module</p>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              // Child pages will be rendered here by route
              <div>Page content will be rendered by child routes</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
