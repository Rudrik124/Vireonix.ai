import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../../../app/context/auth-context";
import { Users, Zap, AlertCircle, BarChart3, LogOut, Wallet } from "lucide-react";
import { fetchDashboardStats } from "../../../services/developer-portal-api.service";

export function DeveloperDashboardPage() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    creditsConsumed: 0,
    aiRequests: 0,
    revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const menuItems = [
    { label: "Users", path: "/developer/users", icon: Users },
    { label: "Credits", path: "/developer/credits", icon: Zap },
    { label: "Tester Credits", path: "/developer/tester-credits", icon: Wallet },
    { label: "AI Testing Lab", path: "/developer/testing-lab", icon: "⚗️" },
    { label: "Error Logs", path: "/developer/error-logs", icon: AlertCircle },
    { label: "Analytics", path: "/developer/analytics", icon: BarChart3 },
    { label: "Feedback", path: "/developer/feedback", icon: "💬" },
    { label: "Settings", path: "/developer/settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Developer Portal</h1>
              <p className="text-sm text-slate-400 mt-1">Admin & Analytics Dashboard</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* User Info */}
        <div className="mb-8 p-4 bg-slate-800 rounded border border-slate-700">
          <p className="text-sm text-slate-400">Signed in as</p>
          <p className="text-lg font-bold">{profile?.email}</p>
          <p className="text-sm text-slate-400 mt-1">Role: {profile?.role?.replace("_", " ") || "Developer"}</p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-800 rounded border border-slate-700 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} />
            <StatCard label="Active Users" value={stats.activeUsers.toLocaleString()} />
            <StatCard label="New Users (7d)" value={stats.newUsers} />
            <StatCard label="AI Requests" value={stats.aiRequests.toLocaleString()} />
            <StatCard label="Credits Consumed" value={stats.creditsConsumed.toLocaleString()} />
            <StatCard label="Revenue" value={`$${stats.revenue.toLocaleString()}`} />
          </div>
        )}

        {/* Recent Activity */}
        <div className="mb-8 p-4 bg-slate-800 rounded border border-slate-700">
          <h2 className="text-lg font-bold mb-4">System Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">API Health</span>
              <span className="text-green-400">✓ Operational</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Database</span>
              <span className="text-green-400">✓ Operational</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Storage</span>
              <span className="text-green-400">✓ Operational</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Queue</span>
              <span className="text-green-400">✓ Operational</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Portal Sections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="p-4 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 hover:border-slate-600 transition text-left"
              >
                <p className="text-sm font-bold">{item.label}</p>
                <p className="text-xs text-slate-400 mt-1">Manage {item.label.toLowerCase()}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 bg-slate-800 rounded border border-slate-700">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}
