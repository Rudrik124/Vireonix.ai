import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useState } from "react";
import { Bell, Mail, Check, X, Settings } from "lucide-react";

interface Notification {
  id: string;
  type: "build" | "bug-status" | "credit-alert" | "test-assigned";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

export function TesterNotificationsPage() {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "NOTIF-001",
      type: "build",
      title: "New Build Deployed",
      message: "Build 2026.5.28 has been deployed to the test environment. Changelog: 40% faster generation, bug fixes, and new features.",
      timestamp: "2026-05-28 15:30",
      read: false,
      action: { label: "View Changelog", url: "/tester/documentation" },
    },
    {
      id: "NOTIF-002",
      type: "bug-status",
      title: "Bug Status Updated",
      message: "Your bug report BUG-012 (Video timeout) has been marked as FIXED by the dev team.",
      timestamp: "2026-05-28 14:15",
      read: false,
      action: { label: "View Report", url: "/tester/bug-reports" },
    },
    {
      id: "NOTIF-003",
      type: "credit-alert",
      title: "Low Credit Balance",
      message: "⚠️ Your testing credits are running low (42 remaining). Resets Monday with 500 credits.",
      timestamp: "2026-05-28 12:00",
      read: true,
      action: { label: "View Credits", url: "/tester/credits" },
    },
    {
      id: "NOTIF-004",
      type: "bug-status",
      title: "Bug Needs More Information",
      message: "BUG-010 needs clarification. Dev team requested: Can you reproduce on Safari?",
      timestamp: "2026-05-28 10:45",
      read: true,
      action: { label: "View Report", url: "/tester/bug-reports" },
    },
    {
      id: "NOTIF-005",
      type: "test-assigned",
      title: "New Test Cases Assigned",
      message: "3 new test cases assigned for Sprint 26: Video edge cases and performance testing.",
      timestamp: "2026-05-27 16:20",
      read: true,
      action: { label: "View Cases", url: "/tester/test-cases" },
    },
    {
      id: "NOTIF-006",
      type: "build",
      title: "Build Available for Testing",
      message: "Build 2026.5.27 is ready for testing in the test environment.",
      timestamp: "2026-05-27 09:00",
      read: true,
    },
  ]);

  const [emailPreference, setEmailPreference] = useState<"instant" | "daily" | "none">("instant");
  const [notificationPreferences, setNotificationPreferences] = useState({
    buildDeployments: true,
    bugStatusUpdates: true,
    creditAlerts: true,
    testAssignments: true,
    commentNotifications: true,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const typeIcons = {
    build: "🚀",
    "bug-status": "🐛",
    "credit-alert": "⚠️",
    "test-assigned": "✅",
  };

  const typeColors = {
    build: "border-l-blue-500 bg-blue-50",
    "bug-status": "border-l-purple-500 bg-purple-50",
    "credit-alert": "border-l-yellow-500 bg-yellow-50",
    "test-assigned": "border-l-green-500 bg-green-50",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              <Bell className="inline-block mr-2" />
              Notifications
            </h1>
            <p className="text-purple-200">{unreadCount} unread notifications</p>
          </div>
          <button
            onClick={() => navigate("/tester/dashboard")}
            className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded transition"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-purple-700 p-6 rounded-lg sticky top-8">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Preferences
              </h2>

              <div className="space-y-4">
                {/* Email Preferences */}
                <div>
                  <label className="text-white font-semibold block mb-2 text-sm">Email Notifications</label>
                  <select
                    value={emailPreference}
                    onChange={(e) => setEmailPreference(e.target.value as any)}
                    className="w-full px-3 py-2 rounded text-white bg-purple-600 text-sm"
                  >
                    <option value="instant">Instant</option>
                    <option value="daily">Daily Digest</option>
                    <option value="none">Disabled</option>
                  </select>
                  <p className="text-purple-300 text-xs mt-2">
                    {emailPreference === "instant"
                      ? "Get notified immediately"
                      : emailPreference === "daily"
                      ? "Daily email summary at 9 AM"
                      : "No email notifications"}
                  </p>
                </div>

                {/* Notification Types */}
                <div>
                  <p className="text-white font-semibold block mb-2 text-sm">Notification Types</p>
                  <div className="space-y-2">
                    {Object.entries(notificationPreferences).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) =>
                            setNotificationPreferences({
                              ...notificationPreferences,
                              [key]: e.target.checked,
                            })
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-purple-200 text-sm">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .trim()
                            .split(" ")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Save */}
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition font-semibold mt-4">
                  Save Settings
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="lg:col-span-3">
            {/* Header Actions */}
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">All Notifications</h2>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-blue-300 hover:text-blue-200 text-sm transition"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications */}
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="bg-purple-700 p-8 rounded-lg text-center">
                  <Bell className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                  <p className="text-purple-200">No notifications</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg border-l-4 ${typeColors[notif.type]} ${
                      !notif.read ? "bg-opacity-20" : "bg-opacity-10"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl mt-1">{typeIcons[notif.type]}</span>
                        <div className="flex-1">
                          <h3
                            className={`font-semibold ${
                              !notif.read ? "text-white" : "text-purple-200"
                            }`}
                          >
                            {notif.title}
                          </h3>
                          <p className="text-purple-200 text-sm mt-1">{notif.message}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 ml-4">
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            title="Mark as read"
                            className="text-blue-500 hover:text-blue-600 transition"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          title="Delete"
                          className="text-red-500 hover:text-red-600 transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-purple-300">{notif.timestamp}</span>
                      {notif.action && (
                        <button
                          onClick={() => navigate(notif.action!.url)}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
                        >
                          {notif.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
