import { useNavigate } from "react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";

export function DeveloperSettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"models" | "credits" | "features" | "notifications">("models");
  const [settings, setSettings] = useState({
    aiModel: "gpt-4",
    temperature: 0.7,
    maxTokens: 2000,
    creditMultiplier: 1.0,
    dailyBudget: 100000,
    enableBeta: true,
    notifyOnErrors: true,
  });

  const handleSave = () => {
    console.log("Settings saved:", settings);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <button
            onClick={() => navigate("/developer/dashboard")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Configure system, AI, and notification settings</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-slate-700">
          {(
            [
              { id: "models", label: "AI Models" },
              { id: "credits", label: "Credit Settings" },
              { id: "features", label: "Feature Flags" },
              { id: "notifications", label: "Notifications" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-bold transition border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-500 text-white"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-slate-800 rounded border border-slate-700 p-6 max-w-2xl">
          {activeTab === "models" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2">Default AI Model</label>
                <select
                  value={settings.aiModel}
                  onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-slate-500"
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5">GPT-3.5</option>
                  <option value="claude-3">Claude 3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">
                  Temperature: {settings.temperature.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-slate-400 mt-1">Higher = more creative, Lower = more deterministic</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Max Tokens</label>
                <input
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
          )}

          {activeTab === "credits" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2">Credit Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.creditMultiplier}
                  onChange={(e) => setSettings({ ...settings, creditMultiplier: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-slate-500"
                />
                <p className="text-xs text-slate-400 mt-1">1.0 = standard, 1.5 = 50% more expensive</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Daily Budget (in credits)</label>
                <input
                  type="number"
                  value={settings.dailyBudget}
                  onChange={(e) => setSettings({ ...settings, dailyBudget: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="p-4 bg-blue-900/30 border border-blue-700/50 rounded text-sm">
                <p>
                  <strong>Developer Credits:</strong> Separate pool used for testing, not billed to users.
                </p>
              </div>
            </div>
          )}

          {activeTab === "features" && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-700 rounded border border-slate-600">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">Enable Beta Features</p>
                    <p className="text-sm text-slate-400">Allow testing of unreleased features</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableBeta}
                    onChange={(e) => setSettings({ ...settings, enableBeta: e.target.checked })}
                    className="w-5 h-5"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-700 rounded border border-slate-600">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">Batch Processing</p>
                    <p className="text-sm text-slate-400">Allow processing multiple videos</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-slate-700 rounded border border-slate-600">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">Webhooks</p>
                    <p className="text-sm text-slate-400">Enable webhook notifications</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-slate-700 rounded border border-slate-600">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">Custom Models</p>
                    <p className="text-sm text-slate-400">Allow users to upload custom models</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-700 rounded border border-slate-600">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">Error Notifications</p>
                    <p className="text-sm text-slate-400">Notify on system errors</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyOnErrors}
                    onChange={(e) => setSettings({ ...settings, notifyOnErrors: e.target.checked })}
                    className="w-5 h-5"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-700 rounded border border-slate-600">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">Daily Digest</p>
                    <p className="text-sm text-slate-400">Send daily analytics summary</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-slate-700 rounded border border-slate-600">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">Feature Announcements</p>
                    <p className="text-sm text-slate-400">Notify about new features</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-slate-700 rounded border border-slate-600">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">Critical Alerts</p>
                    <p className="text-sm text-slate-400">High priority system alerts</p>
                  </div>
                  <input type="checkbox" defaultChecked disabled className="w-5 h-5" />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 border-t border-slate-700 pt-6">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded font-bold transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
