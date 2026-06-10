import { useNavigate } from "react-router";
import type { ComponentType } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  FlaskConical,
  LogOut,
  MessageSquare,
  RefreshCcw,
  Settings,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useAuth } from "../../../app/context/auth-context";
import { useDashboardStats } from "../../../hooks/useDashboardData";

type DashboardIcon = ComponentType<{ className?: string }>;

export function DeveloperDashboardPage() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const { stats, isLoading, error, refetch } = useDashboardStats();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const menuItems = [
    { label: "Users", path: "/developer/users", icon: Users },
    { label: "Credits", path: "/developer/credits", icon: Zap },
    { label: "Tester Credits", path: "/developer/tester-credits", icon: Wallet },
    { label: "AI Testing Lab", path: "/developer/testing-lab", icon: FlaskConical },
    { label: "Issues & Reports", path: "/developer/error-logs", icon: AlertCircle },
    { label: "Analytics", path: "/developer/analytics", icon: BarChart3 },
    { label: "Feedback", path: "/developer/feedback", icon: MessageSquare },
    { label: "Settings", path: "/developer/settings", icon: Settings },
  ];

  const statCards = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users },
    { label: "Active Users", value: stats.activeUsers.toLocaleString(), icon: Activity },
    { label: "New Users (7d)", value: stats.newUsers.toLocaleString(), icon: Users },
    { label: "AI Requests", value: stats.aiRequests.toLocaleString(), icon: BarChart3 },
    { label: "Credits Consumed", value: stats.creditsConsumed.toLocaleString(), icon: Zap },
    { label: "Revenue", value: `$${stats.revenue.toLocaleString()}`, icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="border-b border-slate-700 bg-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Developer Portal</h1>
              <p className="mt-1 text-sm text-slate-400">Admin & Analytics Dashboard</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded bg-red-600 px-4 py-2 transition hover:bg-red-700"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 rounded border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Signed in as</p>
          <p className="text-lg font-bold">{profile?.email}</p>
          <p className="mt-1 text-sm text-slate-400">
            Role: {profile?.role?.replace("_", " ") || "Developer"}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center justify-between gap-4 rounded border border-amber-500/40 bg-amber-500/10 p-4 text-amber-100">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">Dashboard stats could not load: {error}</p>
            </div>
            <button
              onClick={refetch}
              className="flex items-center gap-2 rounded bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              <RefreshCcw className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-24 rounded border border-slate-700 bg-slate-800 p-4">
                <div className="mb-4 h-4 w-24 animate-pulse rounded bg-slate-700" />
                <div className="h-7 w-16 animate-pulse rounded bg-slate-700" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
            ))}
          </div>
        )}

        <div className="mb-8 rounded border border-slate-700 bg-slate-800 p-4">
          <h2 className="mb-4 text-lg font-bold">System Status</h2>
          <div className="space-y-2 text-sm">
            {["API Health", "Database", "Storage", "Queue"].map((item) => (
              <div key={item} className="flex justify-between gap-4">
                <span className="text-slate-400">{item}</span>
                <span className="flex items-center gap-1 text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Operational
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-lg font-bold">Portal Sections</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="rounded border border-slate-700 bg-slate-800 p-4 text-left transition hover:border-slate-600 hover:bg-slate-700"
              >
                <item.icon className="mb-3 h-5 w-5 text-cyan-300" />
                <p className="text-sm font-bold">{item.label}</p>
                <p className="mt-1 text-xs text-slate-400">Manage {item.label.toLowerCase()}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: DashboardIcon;
}) {
  return (
    <div className="rounded border border-slate-700 bg-slate-800 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{label}</p>
        <Icon className="h-5 w-5 text-cyan-300" />
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
