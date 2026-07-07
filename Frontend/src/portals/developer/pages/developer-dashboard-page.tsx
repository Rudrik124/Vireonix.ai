import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import type { ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Search,
  Bell,
  ChevronDown,
  User,
  Cpu,
  HardDrive,
  Database,
  ArrowUpRight,
  TrendingUp,
  Server,
  Terminal,
  Play,
  Globe2,
  MapPin,
  Bot,
  Shield,
  Plus,
  Mail,
  Wrench,
  Check,
  DollarSign,
  PieChart,
  Lock,
  AlertTriangle,
  FileText
} from "lucide-react";
import { useAuth } from "../../../app/context/auth-context";
import { useDashboardStats } from "../../../hooks/useDashboardData";
import { fetchCloudflarePortalOverview } from "../../../services/developer-portal-api.service";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from "recharts";

type DashboardIcon = ComponentType<{ className?: string }>;

const revenueData = [
  { name: "Mon", revenue: 0 },
  { name: "Tue", revenue: 0 },
  { name: "Wed", revenue: 0 },
  { name: "Thu", revenue: 0 },
  { name: "Fri", revenue: 0 },
  { name: "Sat", revenue: 0 },
  { name: "Sun", revenue: 0 },
];

const fakeActivity: any[] = [];

const fakeJobs: any[] = [];

const worldRegions = [
  { name: "India", activity: 0 },
  { name: "USA", activity: 0 },
  { name: "UK", activity: 0 },
  { name: "Germany", activity: 0 },
  { name: "Japan", activity: 0 },
];

const notifications = [
  { id: 1, text: "Server restarted", type: "system", time: "1h ago" },
  { id: 2, text: "Premium purchase received", type: "revenue", time: "2h ago" },
  { id: 3, text: "AI model updated", type: "ai", time: "5h ago" },
  { id: 4, text: "Storage backup completed", type: "system", time: "1d ago" },
  { id: 5, text: "New developer login", type: "user", time: "1d ago" },
];

function CreditsAnalytics() {
  const [isVisible, setIsVisible] = useState(false);

  const cards = [
    { label: 'Total Distributed', value: 0 },
    { label: 'Daily Distributed', value: 0 },
    { label: 'Credits Used', value: 0 },
    { label: 'Credits Left', value: 0 },
    { label: 'Overall Unused', value: 0 },
    { label: 'Saved Credits', value: 0 },
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-6 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Credits Analytics</h2>
          <p className="text-sm text-slate-400">Click the button to reveal the analytics panel.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
        >
          {isVisible ? 'Hide Analytics' : 'Show Analytics'}
        </button>
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {cards.map((c) => (
                <div key={c.label} className="p-4 rounded-xl border border-white/5 bg-slate-900/30">
                  <p className="text-sm text-slate-400">{c.label}</p>
                  <p className="text-2xl font-bold text-white">{c.value}</p>
                </div>
              ))}
            </div>
            <div className="text-sm text-slate-500">Analytics values are currently mocked as zero until the credit system is implemented.</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DeveloperDashboardPage() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const { stats, isLoading, error, refetch } = useDashboardStats();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [activeActivities, setActiveActivities] = useState(fakeActivity);
  const [cloudflareStatus, setCloudflareStatus] = useState({
    configured: false,
    source: "fallback",
    summary: { requests: 0, bandwidthBytes: 0, blockedRequests: 0, uniqueVisitors: 0, threats: 0 },
    security: { criticalAlerts: 0, activeThreats: 0, failedLogins: 0, blockedRequests: 0, systemHealth: 95 },
  });
  const [hasVisited] = useState(() => sessionStorage.getItem("devDashboardVisited") === "true");

  useEffect(() => {
    if (!hasVisited) {
      sessionStorage.setItem("devDashboardVisited", "true");
    }
  }, [hasVisited]);

  useEffect(() => {
    // Simulate rotating activity
    const interval = setInterval(() => {
      setActiveActivities((prev) => {
        const newArr = [...prev];
        const last = newArr.pop();
        if (last) newArr.unshift(last);
        return newArr;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedScrollPos = sessionStorage.getItem("devDashboardScrollPos");
    if (savedScrollPos) {
      // Use setTimeout to ensure it scrolls after rendering
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPos, 10));
        sessionStorage.removeItem("devDashboardScrollPos");
      }, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchCloudflarePortalOverview()
      .then((payload) => {
        if (!isMounted) return;
        setCloudflareStatus(payload);
      })
      .catch((error) => {
        console.error("Failed to load Cloudflare overview:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNavigate = (path: string) => {
    sessionStorage.setItem("devDashboardScrollPos", window.scrollY.toString());
    // Prevent navigation outside the developer portal from this page.
    if (!path.startsWith("/developer")) {
      // Keep user on the developer dashboard if an external path is requested
      console.warn("Blocked navigation outside developer portal:", path);
      navigate("/developer/dashboard");
      return;
    }

    navigate(path);
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("devDashboardVisited");
    await logout();
    navigate("/", { replace: true });
  };

  const menuItems = [
    { label: "Users", path: "/developer/users", icon: Users, desc: "Manage all platform users", count: stats?.totalUsers || 0 },
    { label: "Credits", path: "/developer/credits", icon: Zap, desc: "Credit allocations & usage", count: stats?.creditsConsumed || 0 },
    { label: "Cost Tracking", path: "/developer/costs", icon: Server, desc: "Expenses, monthly and yearly spend", count: "New" },
    { label: "Revenue & Profit", path: "/developer/revenue-profit", icon: DollarSign, desc: "Monthly and yearly revenue analytics", count: "New" },
    { label: "Profit Distribution", path: "/developer/profit-distribution", icon: PieChart, desc: "Reserve, growth, and worker allocation", count: "Live" },
    { label: "Tester Credits", path: "/developer/tester-credits", icon: Wallet, desc: "Manage tester allowances", count: "Beta" },
    // AI Testing Lab removed per request
    { label: "Analytics", path: "/developer/analytics", icon: BarChart3, desc: "Platform metrics & charts", count: "Active" },
    { label: "Reports", path: "/developer/reports", icon: AlertCircle, desc: "View testing bug report board", count: "Live" },
    { label: "Error Logs", path: "/developer/error-logs", icon: Terminal, desc: "System traces & issues", count: "0 Critical" },
    { label: "Feedback", path: "/developer/feedback", icon: MessageSquare, desc: "User feedback & requests", count: "12 New" },
    { label: "Settings", path: "/developer/settings", icon: Settings, desc: "Global configuration", count: "Secure" },
  ];

  const statCards = [
    { label: "Users", value: stats?.totalUsers?.toLocaleString() || "0", icon: Users, growth: "+0%" },
    { label: "AI Requests", value: stats?.aiRequests?.toLocaleString() || "0", icon: Zap, growth: "+0%" },
    { label: "Credits", value: stats?.creditsConsumed?.toLocaleString() || "0", icon: Activity, growth: "0%" },
    { label: "Revenue", value: `$${stats?.revenue?.toLocaleString() || "0"}`, icon: Wallet, growth: "+0%" },
  ];

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 relative overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
          <div className="flex items-center justify-between h-16 px-6 max-w-[1600px] mx-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
                  <span className="font-bold text-white tracking-tighter">V</span>
                </div>
                <div>
                  <h1 className="font-bold text-sm tracking-wide text-white">VEYTRIX.AI</h1>
                  <p className="text-[10px] text-indigo-300/80 uppercase tracking-widest font-semibold">Developer Control Center</p>
                </div>
              </div>
            </div>

            <div className="flex-1 max-w-xl px-8 hidden md:block">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  placeholder="⌘ Search users, requests, logs, payments..."
                  className="w-full bg-slate-900/50 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">

              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer group border border-transparent hover:border-white/10"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-fuchsia-500 to-blue-500 p-[2px]">
                    <div className="w-full h-full rounded-full bg-[#030712] flex items-center justify-center relative">
                      <span className="text-xs font-bold text-white">DV</span>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#030712]"></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-slate-200 hidden sm:block">Developer</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-slate-900/90 backdrop-blur-xl shadow-2xl py-1 overflow-hidden"
                    >
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors">
                        <User className="h-4 w-4" /> Profile
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors">
                        <Settings className="h-4 w-4" /> Preferences
                      </button>
                      <div className="h-px bg-white/10 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-[1600px] mx-auto w-full p-6 space-y-6">
          
          {/* Welcome Hero Section */}
          <motion.div
            initial={hasVisited ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-8 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <motion.h2 
                  initial={hasVisited ? false : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-slate-400 text-lg mb-1"
                >
                  Welcome back,
                </motion.h2>
                <motion.h1 
                  initial={hasVisited ? false : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight"
                >
                  Welcome back, <br className="md:hidden" />
                  Developer <span className="inline-block origin-bottom-right hover:rotate-12 transition-transform cursor-default">👋</span>
                </motion.h1>
                <motion.p 
                  initial={hasVisited ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-emerald-400 flex items-center gap-2 text-sm font-medium"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  Everything is running smoothly.
                </motion.p>
              </div>

              <div className="flex flex-wrap gap-4 md:gap-8">
                {[
                  { l: "Users Online", v: "0" },
                  { l: "AI Requests Today", v: "0" },
                  { l: "Revenue Today", v: "$0" },
                  { l: "Credits Remaining", v: "0" }
                ].map((m, i) => (
                  <motion.div 
                    initial={hasVisited ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                    key={m.l} 
                    className="flex flex-col"
                  >
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{m.l}</span>
                    <span className="text-2xl font-bold text-white">{m.v}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* User Plan Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl border border-white/5 bg-slate-900/30 p-4 animate-pulse" />
              ))
            ) : (
              [
                { label: 'Free Users', value: stats.freeUsers ?? 0, icon: Users },
                { label: 'Pro Users', value: stats.proUsers ?? 0, icon: Users },
                { label: 'Pro Max Users', value: stats.proMaxUsers ?? 0, icon: Users },
                { label: 'Total Users', value: stats.totalUsers ?? 0, icon: Users },
              ].map((c) => (
                <div key={c.label} className="relative rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-800/80 flex items-center justify-center">
                        <c.icon className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">{c.label}</p>
                        <p className="text-2xl font-bold text-white">{c.value}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {stats?.planSchemaMissing && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 mb-6 text-amber-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Plan schema missing</p>
                  <p className="text-sm text-amber-200">The `plan_type` column is not present in `app_profiles`. Run the provided SQL to add it.</p>
                </div>
                <button
                  onClick={() => navigator.clipboard?.writeText(stats.planSchemaSql || '')}
                  className="px-3 py-1 rounded-md bg-amber-600/30 text-amber-100 text-sm"
                >
                  Copy SQL
                </button>
              </div>
              <pre className="mt-3 text-xs text-amber-100 bg-amber-900/10 rounded-md p-3 overflow-auto">{stats.planSchemaSql}</pre>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
                <p className="text-sm">Dashboard stats could not load: {error}</p>
              </div>
              <button
                onClick={refetch}
                className="flex items-center gap-2 rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/30"
              >
                <RefreshCcw className="h-4 w-4" /> Retry
              </button>
            </div>
          )}

          {/* Premium Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-32 rounded-2xl border border-white/5 bg-slate-900/30 p-6 animate-pulse" />
              ))
            ) : (
              statCards.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={hasVisited ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="group relative rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-sm p-6 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(99,102,241,0.12)] hover:border-indigo-500/30 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="h-10 w-10 rounded-xl bg-slate-800/80 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <stat.icon className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                      <TrendingUp className="h-3 w-3" /> {stat.growth}
                    </div>
                  </div>
                  <div className="relative z-10">
                    <p className="text-sm text-slate-400 font-medium mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{stat.value}</h3>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Revenue Analytics */}
            <motion.div 
              initial={hasVisited ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="xl:col-span-2 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Revenue Analytics</h2>
                  <p className="text-sm text-slate-400">Platform earnings overview</p>
                </div>
                <div className="flex items-center gap-2 p-1 bg-slate-950/50 rounded-lg border border-white/5">
                  {['7D', '30D', '1Y'].map((t, i) => (
                    <button key={t} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${i === 0 ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff15', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* AI System Health Panel & Circular Progress */}
            <motion.div 
              initial={hasVisited ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col gap-6"
            >
              {/* Credits Analytics Module */}
+              <CreditsAnalytics />
+
              {/* Health Panel */}
              <div className="flex-1 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-6">
                <h2 className="text-lg font-bold text-white mb-6">System Health</h2>
                <div className="space-y-5">
                  {[
                    { l: "CPU Usage", v: 42, icon: Cpu, c: "text-blue-400", bg: "bg-blue-500" },
                    { l: "GPU Usage", v: 88, icon: Server, c: "text-indigo-400", bg: "bg-indigo-500" },
                    { l: "Queue Load", v: 34, icon: Activity, c: "text-emerald-400", bg: "bg-emerald-500" },
                    { l: "Storage", v: 76, icon: HardDrive, c: "text-purple-400", bg: "bg-purple-500" },
                  ].map((h) => (
                    <div key={h.l}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="flex items-center gap-2 text-slate-300"><h.icon className={`h-4 w-4 ${h.c}`} /> {h.l}</span>
                        <span className="text-white font-medium">{h.v}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={hasVisited ? false : { width: 0 }}
                          animate={{ width: `${h.v}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full ${h.bg} rounded-full`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live AI Activity Feed */}
            <motion.div 
              initial={hasVisited ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  Live Activity
                </h2>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-slate-900/40 to-transparent z-10" />
                <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-slate-900/40 to-transparent z-10" />
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {activeActivities.map((act) => (
                      <motion.div
                        key={act.id}
                        layout
                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5"
                      >
                        <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{act.text}</p>
                          <p className="text-xs text-slate-500">{act.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Portal Modules */}
            <motion.div 
              initial={hasVisited ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Portal Modules</h2>
                <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors">
                  View All <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {menuItems.map((item, idx) => (
                  <motion.button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative text-left rounded-2xl border border-white/10 bg-slate-800/50 p-4 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-colors duration-500" />
                    <item.icon className="h-6 w-6 text-slate-400 group-hover:text-indigo-400 transition-colors mb-3" />
                    <p className="font-bold text-slate-200 group-hover:text-white transition-colors">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.desc}</p>
                    <div className="mt-3 inline-block px-2 py-1 rounded bg-slate-900/80 border border-white/5 text-[10px] font-semibold text-slate-300">
                      {item.count}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Quick Actions */}
            <motion.div 
              initial={hasVisited ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="lg:col-span-1 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-6 flex flex-col"
            >
              <h2 className="text-lg font-bold text-white mb-6">Quick Actions</h2>
              <div className="space-y-3 flex-1">
                {[
                  { l: "Add Credits", icon: Plus, c: "from-indigo-500 to-purple-500" },
                  { l: "Add Tester", icon: User, c: "from-emerald-500 to-teal-500" },
                  { l: "Create Admin", icon: Shield, c: "from-orange-500 to-red-500" },
                  { l: "Broadcast", icon: Mail, c: "from-blue-500 to-cyan-500" },
                  { l: "Maintenance", icon: Wrench, c: "from-slate-600 to-slate-400" },
                ].map((a) => (
                  <button key={a.l} className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-800/30 hover:bg-slate-800/80 transition-colors group">
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white">{a.l}</span>
                    <div className={`h-6 w-6 rounded-md bg-gradient-to-tr ${a.c} flex items-center justify-center`}>
                      <a.icon className="h-3 w-3 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Recent AI Jobs */}
            <motion.div 
              initial={hasVisited ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-6"
            >
              <h2 className="text-lg font-bold text-white mb-6">Recent AI Jobs</h2>
              <div className="space-y-1">
                {fakeJobs.map((job, i) => (
                  <div key={job.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center">
                        <Play className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">{job.name}</p>
                        <p className="text-xs text-slate-500">{job.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                      <Check className="h-3 w-3" /> {job.status}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Developer Identity Card */}
            <motion.div 
              initial={hasVisited ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="lg:col-span-1 rounded-3xl border border-white/10 bg-gradient-to-b from-slate-800/80 to-slate-900/40 backdrop-blur-md p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              
              <div className="flex flex-col items-center text-center mt-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 p-[2px] mb-4 relative">
                  <div className="w-full h-full rounded-full bg-[#080C18] flex items-center justify-center">
                    <span className="text-2xl font-black text-white">DV</span>
                  </div>
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#080C18]"></div>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white">Developer</h3>
                  <p className="text-sm font-medium text-indigo-400 mt-1">Lead Developer</p>
                  <p className="text-xs text-slate-500 mt-1">Veytrix.AI</p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                  <span className="text-slate-400">Last deploy</span>
                  <span className="text-slate-200">2 mins ago</span>
                </div>
                <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                  <span className="text-slate-400">Projects</span>
                  <span className="text-slate-200">0</span>
                </div>
                <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                  <span className="text-slate-400">Commits</span>
                  <span className="text-slate-200">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">AI Managed</span>
                  <span className="text-slate-200 font-semibold text-indigo-400">0</span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* World Usage */}
            <motion.div 
              initial={hasVisited ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-6 relative overflow-hidden"
            >
              <Globe2 className="absolute -bottom-10 -right-10 w-64 h-64 text-slate-800/30 pointer-events-none" />
              <h2 className="text-lg font-bold text-white mb-6">World Usage</h2>
              <div className="space-y-4 relative z-10">
                {worldRegions.map((r) => (
                  <div key={r.name} className="flex items-center gap-4">
                    <span className="w-16 text-sm font-medium text-slate-300">{r.name}</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full relative" style={{ width: `${r.activity}%` }}>
                        <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 blur-[2px]" />
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 w-8 text-right">{r.activity}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Notifications Panel */}
            <motion.div 
              initial={hasVisited ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-6"
            >
              <h2 className="text-lg font-bold text-white mb-6">System Notifications</h2>
              <div className="space-y-4">
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <div className="mt-1 h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-300">{n.text}</p>
                      <p className="text-xs text-slate-500 mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

        </main>

        {/* Animated Footer */}
        <footer className="mt-auto border-t border-white/10 bg-slate-950/50 backdrop-blur-xl relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          <div className="max-w-[1600px] mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-white text-sm">VEYTRIX.AI</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-slate-500">© 2026 All Rights Reserved</p>
              <p className="text-xs font-mono text-indigo-400/80 mt-1 bg-indigo-500/10 inline-block px-2 py-0.5 rounded">Build v2.1.4 • Production</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Global AI Copilot */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isCopilotOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-16 right-0 w-80 rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-indigo-400" />
                  <span className="font-bold text-white text-sm">AI Copilot</span>
                </div>
                <button onClick={() => setIsCopilotOpen(false)} className="text-slate-400 hover:text-white">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 h-64 overflow-y-auto">
                <div className="bg-white/5 rounded-xl p-3 text-sm text-slate-300 mb-4 border border-white/5">
                  How can I help you manage the VEYTRIX ecosystem today?
                </div>
                <div className="space-y-2">
                  {['Create tester', 'Find user', 'Reset credits', 'Export logs', 'Search requests'].map(s => (
                    <button key={s} className="w-full text-left p-2 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs hover:bg-indigo-500/20 transition-colors border border-indigo-500/20">
                      → {s}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          className="h-14 w-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center justify-center text-white border border-white/20"
        >
          <Bot className="h-6 w-6" />
        </motion.button>
      </div>
    </div>
  );
}
