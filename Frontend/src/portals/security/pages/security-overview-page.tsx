import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  Lock,
  Zap,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "../../../app/context/auth-context";
import { logSecurityPortalActivity } from "../../../services/security-portal.service";
import { fetchCloudflarePortalOverview } from "../../../services/developer-portal-api.service";
import { supabase } from "../../../lib/supabase";

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  description,
}: {
  label: string;
  value: number | string;
  icon: any;
  color: string;
  description: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-400 bg-blue-900/20",
    red: "text-red-400 bg-red-900/20",
    green: "text-green-400 bg-green-900/20",
    orange: "text-orange-400 bg-orange-900/20",
    purple: "text-purple-400 bg-purple-900/20",
    cyan: "text-cyan-400 bg-cyan-900/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-300">{label}</h3>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        <Icon className={`w-5 h-5 ${colorClasses[color]}`} />
      </div>
      <motion.div
        key={value}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className={`text-2xl font-bold ${colorClasses[color]}`}
      >
        {value}
      </motion.div>
    </motion.div>
  );
}

export function SecurityOverviewPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalEvents: 0,
    criticalAlerts: 0,
    failedLogins: 0,
    blockedRequests: 0,
    systemHealth: 95,
    activeThreats: 0,
  });

  useEffect(() => {
    if (profile) {
      logSecurityPortalActivity({
        user_id: profile.id,
        user_email: profile.email,
        event_type: "SECURITY_PORTAL_ACCESS",
        module: "Security Overview",
        action: "Accessed Security Overview",
      }).catch(console.error);
    }
  }, [profile]);

  useEffect(() => {
    let isActive = true;

    const loadData = () => {
      fetchCloudflarePortalOverview()
        .then((data) => {
          if (!isActive) return;
          setStats((prev) => ({
            ...prev,
            totalEvents: data?.summary?.requests ?? prev.totalEvents,
            criticalAlerts: data?.security?.criticalAlerts ?? prev.criticalAlerts,
            failedLogins: data?.security?.failedLogins ?? prev.failedLogins,
            blockedRequests: data?.security?.blockedRequests ?? prev.blockedRequests,
            systemHealth: data?.security?.systemHealth ?? prev.systemHealth,
            activeThreats: data?.security?.activeThreats ?? prev.activeThreats,
          }));
        })
        .catch((error) => {
          console.error("Failed to load Cloudflare security overview:", error);
        });
    };

    // Initial load
    loadData();

    // Setup Supabase Realtime Subscription for audit_logs table to trigger re-fetch
    let subscription: any = null;
    if (supabase) {
      subscription = supabase
        .channel('security-overview-updates')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'audit_logs' },
          () => {
            // Re-fetch data when a new audit log (event) is inserted
            loadData();
          }
        )
        .subscribe();
    }

    return () => {
      isActive = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

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
        <h1 className="text-3xl font-bold text-white mb-2">Security Overview</h1>
        <p className="text-sm text-slate-400">Real-time security status and threat intelligence</p>
      </div>

      {/* System Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-green-700/30 bg-green-900/20 backdrop-blur-md p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <div>
              <p className="font-semibold text-green-400">All Systems Operational</p>
              <p className="text-xs text-green-300 mt-1">Last update: just now</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-400">{stats.systemHealth}%</p>
            <p className="text-xs text-green-300">System Health</p>
          </div>
        </div>
      </motion.div>

      {/* Primary Metrics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4"
      >
        <MetricCard
          label="Total Security Events"
          value={stats.totalEvents}
          icon={BarChart3}
          color="blue"
          description="All recorded events"
        />
        <MetricCard
          label="Critical Alerts"
          value={stats.criticalAlerts}
          icon={AlertTriangle}
          color="red"
          description="Requires immediate action"
        />
        <MetricCard
          label="Failed Logins"
          value={stats.failedLogins}
          icon={Lock}
          color="orange"
          description="Authentication attempts"
        />
        <MetricCard
          label="Blocked Requests"
          value={stats.blockedRequests}
          icon={Shield}
          color="cyan"
          description="Requests blocked by policy"
        />
        <MetricCard
          label="Active Threats"
          value={stats.activeThreats}
          icon={AlertCircle}
          color="red"
          description="Ongoing security incidents"
        />
        <MetricCard
          label="System Health"
          value={`${stats.systemHealth}%`}
          icon={CheckCircle}
          color="green"
          description="Overall security posture"
        />
      </motion.div>

      {/* Info Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Real-Time Monitoring
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Security Portal provides real-time monitoring of all system events, threats, and security incidents across your infrastructure.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-slate-300">All modules connected</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-slate-300">Supabase Realtime active</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-slate-300">Activity logging enabled</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            Access Control
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Security Portal enforces strict role-based access control (RBAC) and logs all portal activities for audit trails.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300">Your role: <span className="font-mono text-cyan-400">{profile?.role}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-slate-300">All portal actions logged</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Available Security Modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Audit Logs</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Authentication Monitoring</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Prompt Security</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>File Upload Security</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Rate Limit Monitoring</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>API Security</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>AI Cost Monitoring</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>User Risk Scoring</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Security Alerts</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Admin Activity</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Threat Visualization</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Settings & Roles</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
