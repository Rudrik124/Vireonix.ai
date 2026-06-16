import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Settings, Save, AlertCircle, CheckCircle, ChevronLeft } from "lucide-react";
import { useAuth } from "../../../app/context/auth-context";
import {
  getSecurityThresholds,
  updateSecurityThresholds,
  logSecurityPortalActivity,
  type SecurityThresholds,
} from "../../../services/security-portal.service";

export function SecuritySettingsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [thresholds, setThresholds] = useState<SecurityThresholds | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      logSecurityPortalActivity({
        user_id: profile.id,
        user_email: profile.email,
        event_type: "SECURITY_PORTAL_ACCESS",
        module: "Settings",
        action: "Accessed Security Settings",
      }).catch(console.error);
    }

    loadThresholds();
  }, [profile]);

  const loadThresholds = async () => {
    try {
      const data = await getSecurityThresholds();
      setThresholds(data);
    } catch (error) {
      console.error("Error loading thresholds:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!thresholds || !profile) return;

    try {
      await updateSecurityThresholds(thresholds);
      setSavedMessage("Settings saved successfully!");

      await logSecurityPortalActivity({
        user_id: profile.id,
        user_email: profile.email,
        event_type: "SECURITY_PORTAL_ACTION",
        module: "Settings",
        action: "Updated security thresholds",
        details: thresholds,
      });

      setTimeout(() => setSavedMessage(""), 3000);
    } catch (error) {
      console.error("Error saving thresholds:", error);
      setSavedMessage("Error saving settings");
    }
  };

  if (isLoading || !thresholds) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin">Loading settings...</div>
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
          <Settings className="w-8 h-8 text-indigo-400" />
          Security Settings
        </h1>
        <p className="text-sm text-slate-400">Configure alert thresholds and security parameters</p>
      </div>

      {/* Save Message */}
      {savedMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg border ${
            savedMessage.includes("successfully")
              ? "border-green-700/30 bg-green-900/20"
              : "border-red-700/30 bg-red-900/20"
          } p-4`}
        >
          <div className="flex items-center gap-2">
            {savedMessage.includes("successfully") ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-300">{savedMessage}</p>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-300">{savedMessage}</p>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Settings Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alert Thresholds */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Alert Thresholds</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Failed Login Threshold</label>
              <input
                type="number"
                value={thresholds.failedLoginThreshold}
                onChange={(e) =>
                  setThresholds({ ...thresholds, failedLoginThreshold: parseInt(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">Failed login attempts before alert</p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Blocked Request Threshold</label>
              <input
                type="number"
                value={thresholds.blockedRequestThreshold}
                onChange={(e) =>
                  setThresholds({ ...thresholds, blockedRequestThreshold: parseInt(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">Blocked requests before alert</p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Security Event Threshold</label>
              <input
                type="number"
                value={thresholds.securityEventThreshold}
                onChange={(e) =>
                  setThresholds({ ...thresholds, securityEventThreshold: parseInt(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">Security events before alert</p>
            </div>
          </div>
        </motion.div>

        {/* Security Policies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Security Policies</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Critical Alert Threshold</label>
              <input
                type="number"
                value={thresholds.criticalAlertThreshold}
                onChange={(e) =>
                  setThresholds({ ...thresholds, criticalAlertThreshold: parseInt(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">Critical events for immediate escalation</p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Auto-Lockout Attempts</label>
              <input
                type="number"
                value={thresholds.autoLockoutAttempts}
                onChange={(e) =>
                  setThresholds({ ...thresholds, autoLockoutAttempts: parseInt(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">Failed attempts before lockout</p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Lockout Duration (minutes)</label>
              <input
                type="number"
                value={thresholds.autoLockoutDuration}
                onChange={(e) =>
                  setThresholds({ ...thresholds, autoLockoutDuration: parseInt(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">How long to lock account</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Save Button */}
      <motion.button
        onClick={handleSave}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/40"
      >
        <Save className="w-4 h-4" />
        Save Settings
      </motion.button>

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">About These Settings</h3>
        <div className="space-y-2 text-sm text-slate-400">
          <p>
            • <span className="text-slate-300">Alert Thresholds</span>: When metrics exceed these values, automated alerts will be triggered
          </p>
          <p>
            • <span className="text-slate-300">Security Policies</span>: Global policies that apply to the entire security system
          </p>
          <p>
            • <span className="text-slate-300">Auto-Lockout</span>: Automatically lock accounts after repeated failed authentication attempts
          </p>
          <p>
            • <span className="text-slate-300">Changes are logged</span>: All threshold updates are recorded in the security audit trail
          </p>
        </div>
      </motion.div>
    </div>
  );
}
