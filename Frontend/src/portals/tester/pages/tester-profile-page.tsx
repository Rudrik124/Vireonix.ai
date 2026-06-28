import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  User,
  Calendar,
  Globe,
  Clock,
  Shield,
  Video,
  Bug,
  Mail,
  UserCircle,
  Languages,
  Bell,
  Moon,
  Camera,
  Save,
  X,
  Play,
  BarChart,
  Sparkles,
  Users,
  AlertCircle,
  XCircle,
  Zap,
  CreditCard,
  TrendingUp,
  Wallet,
  Activity,
  LogIn,
  Lock,
  Smartphone,
  Laptop,
  Key,
  ShieldCheck,
  Target,
  CheckSquare,
  Crosshair,
  Award,
  Trophy,
  Star,
  Medal,
  AlertTriangle,
  LogOut,
  UserMinus,
  Trash2,
  Cpu
} from "lucide-react";
import { buildApiUrl } from "../../../lib/api";

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  icon: any;
  color: string;
}

const GlassCard = ({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`bg-white/[0.03] backdrop-blur-[20px] border border-white/[0.08] rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.15)] overflow-hidden ${className}`}
  >
    {children}
  </motion.div>
);

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
  const [testingModeEnabled, setTestingModeEnabled] = useState(
    profile?.testingModeEnabled || false
  );
  const [togglingTestingMode, setTogglingTestingMode] = useState(false);

  const activityLog: ActivityLog[] = [];

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#050816] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await logout();
      navigate("/", { replace: true });
    }
  };

  const handleSaveProfile = () => {
    setEditMode(false);
    // Save would happen here
  };

  const handleToggleTestingMode = async () => {
    setTogglingTestingMode(true);
    try {
      const token = session?.access_token;
      if (!token) {
        console.error("No access token available");
        setTogglingTestingMode(false);
        return;
      }

      const response = await fetch(buildApiUrl("/api/tester/toggle-testing-mode"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

  return (
    <div className="min-h-[100dvh] bg-[#050816] text-white relative overflow-hidden font-sans selection:bg-purple-500/30">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-7xl">
        {/* PAGE HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-2">
                My Profile
              </h1>
              <p className="text-slate-400 text-lg">
                Manage your tester account, permissions and activity.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-slate-200">Tester Account Active</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditMode(!editMode)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 px-5 py-2 rounded-full backdrop-blur-md transition-colors font-medium"
              >
                {editMode ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {editMode ? "Cancel Edit" : "Edit Profile"}
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT SIDEBAR PROFILE CARD */}
          <div className="lg:col-span-1 space-y-8">
            <GlassCard delay={0.1}>
              <div className="p-6 flex flex-col items-center relative">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent opacity-50"></div>

                <motion.div
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 p-[2px] mb-6 relative z-10"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-full h-full bg-[#050816] rounded-full flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-purple-500/20 blur-xl"></div>
                    <User className="w-12 h-12 text-purple-300 relative z-10" />
                  </div>
                </motion.div>

                <h2 className="text-2xl font-bold text-white mb-1 relative z-10">{profile.name || "Test Engineer"}</h2>
                <p className="text-slate-400 mb-6 relative z-10">{profile.email}</p>

                <div className="w-full space-y-4 relative z-10">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-purple-400" />
                      <span className="text-slate-300 text-sm">Badge</span>
                    </div>
                    <span className="text-white font-medium text-sm">QA Tester</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-green-400" />
                      <span className="text-slate-300 text-sm">Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-white font-medium text-sm">Active</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <Cpu className="w-5 h-5 text-blue-400" />
                      <span className="text-slate-300 text-sm">Testing Mode</span>
                    </div>
                    <button
                      onClick={handleToggleTestingMode}
                      disabled={togglingTestingMode}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${testingModeEnabled
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-white/10 text-slate-400 border border-white/10 hover:bg-white/20"
                        }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${testingModeEnabled ? "bg-green-400" : "bg-slate-400"}`} />
                      {testingModeEnabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-400">Member Since</span>
                      <span className="text-sm font-medium text-white">Mar 2026</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-400">Timezone</span>
                      <span className="text-sm font-medium text-white">{timezone}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-400">Last Login</span>
                    </div>
                    <span className="text-xs font-medium text-white">2 hours ago</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                    <p className="text-xs text-purple-300 leading-relaxed">
                      Quality Assurance Tester - Responsible for executing test scenarios and verifying generative AI models.
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-2 gap-4">
              <GlassCard delay={0.2} className="p-5 flex flex-col items-center justify-center text-center group cursor-default">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Video className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-3xl font-bold text-white mb-1">0</span>
                <span className="text-xs text-slate-400">Videos Tested</span>
              </GlassCard>
              <GlassCard delay={0.3} className="p-5 flex flex-col items-center justify-center text-center group cursor-default">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Bug className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-3xl font-bold text-white mb-1">0</span>
                <span className="text-xs text-slate-400">Bug Reports</span>
              </GlassCard>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-2 space-y-8">

            {/* RIGHT PROFILE SETTINGS CARD */}
            <GlassCard delay={0.2} className="p-0">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-purple-400" />
                  Profile Settings
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={profile.email}
                        readOnly
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-slate-400 cursor-not-allowed focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">@</span>
                      <input
                        type="text"
                        defaultValue={profile.name?.toLowerCase().replace(/\s+/g, '') || "tester123"}
                        disabled={!editMode}
                        className={`w-full border rounded-xl py-2.5 pl-9 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-colors ${editMode ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 opacity-70"}`}
                      />
                    </div>
                  </div>
                </div>

                {editMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-4 flex items-center justify-end gap-3 border-t border-white/10"
                  >
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-5 py-2 rounded-full border border-white/10 hover:bg-white/5 text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </motion.div>
                )}
              </div>
            </GlassCard>

            {/* PERMISSIONS CARD */}
            <GlassCard delay={0.3} className="p-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                Access & Permissions
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Bug, title: "Bug Reporting", desc: "Submit and manage bug reports", status: "Granted", color: "green" },
                  { icon: Play, title: "Test Execution", desc: "Execute assigned testing tasks", status: "Granted", color: "green" },
                  { icon: Video, title: "Video Generation", desc: "Generate testing videos", status: "Granted", color: "green" },
                  { icon: BarChart, title: "Analytics", desc: "Access tester analytics", status: "Granted", color: "green" },
                  { icon: Sparkles, title: "4K Beta Testing", desc: "Experimental feature access", status: "Beta", color: "purple" },
                  { icon: Users, title: "Team Management", desc: "Admin only functionality", status: "Restricted", color: "red" },
                ].map((perm, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4 transition-colors"
                  >
                    <div className={`p-2 rounded-xl bg-${perm.color}-500/10 text-${perm.color}-400 mt-1`}>
                      <perm.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white font-medium">{perm.title}</h4>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${perm.status === 'Granted' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            perm.status === 'Beta' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                              'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                          {perm.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{perm.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            {/* TESTING CREDITS */}
            <GlassCard delay={0.4} className="p-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                <Wallet className="w-5 h-5 text-purple-400" />
                Testing Credits
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 transition-transform"><CreditCard className="w-8 h-8" /></div>
                  <p className="text-xs text-slate-400 mb-1">Available Credits</p>
                  <p className="text-2xl font-bold text-white">{profile.credits?.developerCredits || 0}</p>
                  <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-full"></div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 transition-transform"><Zap className="w-8 h-8" /></div>
                  <p className="text-xs text-slate-400 mb-1">Used This Month</p>
                  <p className="text-2xl font-bold text-white">0</p>
                  <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[0%]"></div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 transition-transform"><TrendingUp className="w-8 h-8" /></div>
                  <p className="text-xs text-slate-400 mb-1">Weekly Quota</p>
                  <p className="text-2xl font-bold text-white">0</p>
                  <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white/30 w-[0%]"></div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 transition-transform"><Activity className="w-8 h-8" /></div>
                  <p className="text-xs text-slate-400 mb-1">Remaining</p>
                  <p className="text-2xl font-bold text-green-400">{profile.credits?.developerCredits || 0}</p>
                  <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[100%]"></div>
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* RECENT ACTIVITY */}
              <GlassCard delay={0.5} className="p-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                  <Clock className="w-5 h-5 text-purple-400" />
                  Recent Activity
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:left-[11px] before:w-px before:bg-gradient-to-b before:from-purple-500/50 before:to-transparent">
                  {activityLog.map((log, index) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + (index * 0.1) }}
                      key={log.id}
                      className="relative"
                    >
                      <div className={`absolute -left-8 p-1 rounded-full bg-[#050816] border border-white/10 ${log.color} shadow-[0_0_10px_currentColor] z-10`}>
                        <log.icon className="w-3 h-3" />
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-medium text-white">{log.action}</h4>
                          <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-400">{log.details}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>

              {/* TESTER PERFORMANCE */}
              <GlassCard delay={0.6} className="p-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                  <Target className="w-5 h-5 text-purple-400" />
                  Tester Performance
                </h3>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><CheckSquare className="w-4 h-4" /></div>
                      <span className="text-sm text-slate-300">Tests Completed</span>
                    </div>
                    <span className="text-lg font-bold text-white">0</span>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 text-green-400 rounded-lg"><Crosshair className="w-4 h-4" /></div>
                      <span className="text-sm text-slate-300">Pass Rate</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-white">0%</span>
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="w-[0%] h-full bg-green-500" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/10 text-red-400 rounded-lg"><Bug className="w-4 h-4" /></div>
                      <span className="text-sm text-slate-300">Bug Accuracy</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-white">0%</span>
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="w-[0%] h-full bg-red-500" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg"><Clock className="w-4 h-4" /></div>
                      <span className="text-sm text-slate-300">Avg. Review Time</span>
                    </div>
                    <span className="text-lg font-bold text-white">0m</span>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* ACHIEVEMENTS */}
            <GlassCard delay={0.7} className="p-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Achievements
              </h3>

              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Award, label: "Early Tester", color: "from-purple-500 to-indigo-500" },
                  { icon: Bug, label: "Bug Hunter", color: "from-red-500 to-orange-500" },
                  { icon: Sparkles, label: "AI Explorer", color: "from-blue-500 to-cyan-500" },
                  { icon: Zap, label: "Fast Reviewer", color: "from-yellow-500 to-amber-500" },
                  { icon: Star, label: "Top Contributor", color: "from-emerald-500 to-teal-500" },
                ].map((badge, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] cursor-default group"
                  >
                    <div className={`p-1 rounded-full bg-gradient-to-br ${badge.color} shadow-[0_0_10px_currentColor] group-hover:animate-pulse`}>
                      <badge.icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-200">{badge.label}</span>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            {/* SECURITY SECTION */}
            <GlassCard delay={0.8} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-400" />
                  Account Security
                </h3>
                <button className="text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors">
                  Manage Sessions
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10"><Smartphone className="w-5 h-5 text-slate-300" /></div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-0.5">Two-Factor Auth</h4>
                    <p className="text-xs text-green-400">Enabled (Authenticator App)</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10"><Key className="w-5 h-5 text-slate-300" /></div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-0.5">Password</h4>
                    <p className="text-xs text-slate-400">Last changed 45 days ago</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10"><Laptop className="w-5 h-5 text-slate-300" /></div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-0.5">Current Session</h4>
                    <p className="text-xs text-slate-400">Mac OS • Chrome • Active Now</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10"><ShieldCheck className="w-5 h-5 text-slate-300" /></div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-0.5">Trusted Devices</h4>
                    <p className="text-xs text-slate-400">2 devices authorized</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* DANGER ZONE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-12 bg-red-500/5 backdrop-blur-[20px] border border-red-500/20 rounded-3xl p-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-red-400 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                  </h3>
                  <p className="text-slate-400 text-sm max-w-md">
                    Destructive actions related to your tester account. Some actions require administrative approval.
                  </p>
                </div>
                <div className="flex flex-col gap-3 min-w-[200px]">
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4 text-slate-400" />
                    Sign Out
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white hover:text-red-300 transition-colors text-sm font-medium">
                    <UserMinus className="w-4 h-4" />
                    Deactivate Account
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-colors text-sm font-medium">
                    <Trash2 className="w-4 h-4" />
                    Delete Profile
                  </button>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
