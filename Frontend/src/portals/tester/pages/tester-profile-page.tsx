import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { User, Clock, Shield, LogOut, Activity, Zap } from "lucide-react";
import { buildApiUrl } from "../../../lib/api";

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
}

export function TesterProfilePage() {
  const { profile, isLoading, logout, session } = useAuth();
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [editMode, setEditMode] = useState(false);
  const [timezone, setTimezone] = useState(profile?.timezone || "UTC");
  const [contactEmail, setContactEmail] = useState(profile?.email || "");
  const [testingModeEnabled, setTestingModeEnabled] = useState(profile?.testingModeEnabled || false);
  const [togglingTestingMode, setTogglingTestingMode] = useState(false);

  const [activityLog] = useState<ActivityLog[]>([
    {
      id: "ACT-001",
      action: "Bug Report Submitted",
      timestamp: "2026-05-28 14:32",
      details: "Video generation timeout issue (BUG-012)",
    },
    {
      id: "ACT-002",
      action: "Test Case Passed",
      timestamp: "2026-05-28 12:15",
      details: "TC-003: Advanced parameter testing",
    },
    {
      id: "ACT-003",
      action: "Video Generated",
      timestamp: "2026-05-28 10:45",
      details: "VID-045: 4K cinematic test",
    },
    {
      id: "ACT-004",
      action: "Credits Used",
      timestamp: "2026-05-27 16:20",
      details: "-50 credits for video generation",
    },
    {
      id: "ACT-005",
      action: "Login",
      timestamp: "2026-05-27 09:00",
      details: "Signed in from Chrome/Windows",
    },
    {
      id: "ACT-006",
      action: "Feature Access Granted",
      timestamp: "2026-05-26 14:00",
      details: "Access to 4K testing granted",
    },
  ]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const handleSaveProfile = () => {
    setEditMode(false);
    // Save would happen here
  };

  const handleToggleTestingMode = async () => {
    setTogglingTestingMode(true);
    try {
      // Get the access token from the session
      const token = session?.access_token;
      if (!token) {
        console.error("No access token available");
        setTogglingTestingMode(false);
        return;
      }

      // Call API to toggle testing mode
      const response = await fetch(buildApiUrl("/api/tester/toggle-testing-mode"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: !testingModeEnabled }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestingModeEnabled(data.testingModeEnabled);
      } else {
        console.error("Failed to toggle testing mode");
      }
    } catch (error) {
      console.error("Error toggling testing mode:", error);
    } finally {
      setTogglingTestingMode(false);
    }
  };

  const roleColors = {
    super_admin: "bg-red-600",
    admin: "bg-orange-600",
    developer: "bg-blue-600",
    tester: "bg-purple-600",
  };

  const roleDescriptions = {
    super_admin: "Super Administrator - Full system access",
    admin: "Administrator - Portal and user management",
    developer: "Developer - Feature development and bug fixes",
    tester: "Tester - Testing and quality assurance",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
            <p className="text-purple-200">Manage your testing account and preferences</p>
          </div>
          <button
            onClick={() => navigate("/tester/dashboard")}
            className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded transition"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-purple-700 p-6 rounded-lg">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white text-center">{profile.name || "Tester"}</h2>
                <p className="text-purple-300 text-sm text-center mt-1">{profile.email}</p>
              </div>

              {/* Role Badge */}
              <div className={`${roleColors[profile.role as keyof typeof roleColors] || "bg-purple-600"} text-white px-4 py-2 rounded-lg text-center mb-4 font-semibold`}>
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </div>

              <p className="text-purple-200 text-sm text-center mb-6">
                {roleDescriptions[profile.role as keyof typeof roleDescriptions]}
              </p>

              {/* Key Stats */}
              <div className="space-y-3 border-t border-purple-600 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-purple-200 text-sm">Account Created</span>
                  <span className="text-white font-semibold">2026-03-15</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-200 text-sm">Status</span>
                  <span className="text-green-400 font-semibold">✓ Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-200 text-sm">Testing Mode</span>
                  <button
                    onClick={handleToggleTestingMode}
                    disabled={togglingTestingMode}
                    className={`px-3 py-1 rounded font-semibold text-sm transition ${
                      testingModeEnabled
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    } ${togglingTestingMode ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {togglingTestingMode ? "..." : testingModeEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            <div className="bg-purple-700 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  Profile Settings
                </h2>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`px-4 py-2 rounded transition ${
                    editMode
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white`}
                >
                  {editMode ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-white font-semibold block mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-2 rounded text-white bg-purple-600 disabled:opacity-50"
                  />
                  <p className="text-purple-300 text-xs mt-1">Primary email cannot be changed</p>
                </div>

                <div>
                  <label className="text-white font-semibold block mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profile.name || ""}
                    disabled={!editMode}
                    className="w-full px-4 py-2 rounded text-white bg-purple-600"
                  />
                </div>

                <div>
                  <label className="text-white font-semibold block mb-2">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    disabled={!editMode}
                    className="w-full px-4 py-2 rounded text-white bg-purple-600"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">Eastern Time (EST)</option>
                    <option value="CST">Central Time (CST)</option>
                    <option value="MST">Mountain Time (MST)</option>
                    <option value="PST">Pacific Time (PST)</option>
                    <option value="GMT">Greenwich Mean Time (GMT)</option>
                    <option value="IST">Indian Standard Time (IST)</option>
                    <option value="JST">Japan Standard Time (JST)</option>
                  </select>
                </div>

                {editMode && (
                  <button
                    onClick={handleSaveProfile}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition font-semibold"
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </div>

            {/* Permissions & Features */}
            <div className="bg-purple-700 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6" />
                Your Permissions
              </h2>

              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-purple-600 rounded">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span className="text-white">Submit and track bug reports</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-600 rounded">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span className="text-white">Execute assigned test cases</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-600 rounded">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span className="text-white">Access test environment</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-600 rounded">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span className="text-white">Generate test videos</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-600 rounded">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span className="text-white">View testing analytics</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-600 rounded">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span className="text-white">Access 4K testing (Beta)</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-600 rounded">
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  <span className="text-gray-300">Manage other testers (Admin only)</span>
                </div>
              </div>
            </div>

            {/* Testing Credits */}
            <div className="bg-purple-700 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2 mb-4">
                <Zap className="w-6 h-6" />
                Testing Credits
              </h2>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-600 p-4 rounded text-center">
                  <p className="text-purple-300 text-sm">Available</p>
                  <p className="text-white text-3xl font-bold">{profile.credits?.developerCredits || 0}</p>
                </div>
                <div className="bg-purple-600 p-4 rounded text-center">
                  <p className="text-purple-300 text-sm">Used This Month</p>
                  <p className="text-white text-3xl font-bold">689</p>
                </div>
                <div className="bg-purple-600 p-4 rounded text-center">
                  <p className="text-purple-300 text-sm">Weekly Limit</p>
                  <p className="text-white text-3xl font-bold">500</p>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-900 border border-red-700 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Danger Zone</h2>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded transition font-semibold"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
              <p className="text-red-200 text-sm mt-3">You will be logged out and returned to the login page.</p>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2 mb-4">
            <Activity className="w-6 h-6" />
            Recent Activity
          </h2>

          <div className="space-y-3">
            {activityLog.map((activity) => (
              <div key={activity.id} className="bg-purple-700 p-4 rounded-lg flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{activity.action}</h3>
                  <p className="text-purple-300 text-sm">{activity.details}</p>
                </div>
                <div className="text-right">
                  <p className="text-purple-300 text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
