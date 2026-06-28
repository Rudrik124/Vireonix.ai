import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";

export function AdminDashboardPage() {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[100dvh]">Loading...</div>;
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Manage users, credentials, and system settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management Card */}
          <div
            onClick={() => navigate("/admin/users")}
            className="bg-slate-700 hover:bg-slate-600 cursor-pointer p-6 rounded-lg transition transform hover:scale-105"
          >
            <h3 className="text-xl font-semibold text-white mb-2">User Management</h3>
            <p className="text-slate-300 text-sm">Manage user roles and permissions</p>
          </div>

          {/* Testing Credentials Card */}
          <div
            onClick={() => navigate("/admin/testing-credentials")}
            className="bg-slate-700 hover:bg-slate-600 cursor-pointer p-6 rounded-lg transition transform hover:scale-105"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Testing Credentials</h3>
            <p className="text-slate-300 text-sm">Create and manage tester credentials</p>
          </div>

          {/* System Logs Card */}
          <div
            onClick={() => navigate("/admin/logs")}
            className="bg-slate-700 hover:bg-slate-600 cursor-pointer p-6 rounded-lg transition transform hover:scale-105"
          >
            <h3 className="text-xl font-semibold text-white mb-2">System Logs</h3>
            <p className="text-slate-300 text-sm">View system activity and logs</p>
          </div>

          {/* Settings Card */}
          <div
            onClick={() => navigate("/admin/settings")}
            className="bg-slate-700 hover:bg-slate-600 cursor-pointer p-6 rounded-lg transition transform hover:scale-105"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Settings</h3>
            <p className="text-slate-300 text-sm">Configure system settings</p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-slate-700 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Role</p>
              <p className="text-white font-semibold capitalize">{profile.role}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Email</p>
              <p className="text-white font-semibold">{profile.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
