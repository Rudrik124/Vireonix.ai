import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  BarChart3, 
  Users, 
  UserPlus, 
  Globe2, 
  TrendingUp, 
  Activity, 
  Zap, 
  Cloud, 
  Bot, 
  Clock, 
  Server, 
  ShieldAlert, 
  ArrowUpRight,
  Database,
  Link2,
  Search,
  MessageCircle,
  Rocket
} from "lucide-react";
import { useAnalyticsData } from "../../../hooks/useDashboardData";

type FeatureUsageStats = {
  count?: number;
};

const particles = Array.from({ length: 40 });

// Animated Number Counter Component
function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }: { value: number | string; prefix?: string; suffix?: string, decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) || 0 : value;

  useEffect(() => {
    const controls = animate(0, numValue, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(v)
    });
    return controls.stop;
  }, [numValue]);

  const formatted = displayValue >= 1000000 
    ? `${(displayValue / 1000000).toFixed(1)}M` 
    : displayValue >= 1000 && !suffix.includes('%')
      ? `${(displayValue / 1000).toFixed(decimals)}K` 
      : displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return <span>{prefix}{formatted}{suffix}</span>;
}

export function DeveloperAnalyticsPage() {
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");
  const { analytics, isLoading } = useAnalyticsData(timeRange);

  // Mouse Parallax for Ambient Lighting
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 100 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);
  
  const glowX = useTransform(smoothMouseX, [-1, 1], [-50, 50]);
  const glowY = useTransform(smoothMouseY, [-1, 1], [-50, 50]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) * 2 - 1);
      mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const timeRanges = [
    { id: "7d", label: "Last 7 Days" },
    { id: "30d", label: "Last 30 Days" },
    { id: "90d", label: "Last 90 Days" },
  ] as const;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#030712] font-sans selection:bg-blue-500/30 selection:text-white text-slate-200 pb-24">
      
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.05, 1] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[30%] -right-[10%] w-[80vw] h-[80vh] bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_35%)]" 
          />
          <motion.div 
            animate={{ rotate: -360, scale: [1, 1.1, 1] }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] -left-[10%] w-[70vw] h-[70vh] bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_45%)]" 
          />
        </div>

        {/* Ambient Glows & Blurred Graph Waves */}
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] bg-indigo-600/5 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />
        
        <motion.div 
          animate={{ x: [-20, 20, -20], y: [-10, 10, -10] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent blur-[10px]"
        />
        <motion.div 
          animate={{ x: [20, -20, 20], y: [10, -10, 10] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[60%] left-[5%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent blur-[15px]"
        />

        {/* Mouse Follow Ambient Glow */}
        <motion.div 
          style={{ x: glowX, y: glowY, background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(59,130,246,0.1) 100%)' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[100px] opacity-15 pointer-events-none"
        />

        {/* Floating Particles */}
        {particles.map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full blur-[1px] ${i % 3 === 0 ? 'bg-indigo-400/10' : i % 3 === 1 ? 'bg-blue-400/10' : 'bg-white/5'}`}
            style={{
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              left: `${Math.random() * 100}vw`,
              top: `${Math.random() * 100}vh`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 15 - 7.5, 0],
              opacity: [0.03, 0.08, 0.03],
            }}
            transition={{
              duration: Math.random() * 15 + 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-[1500px] mx-auto px-6 lg:px-12 py-10">
        
        {/* Header */}
        <div className="mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <button
              onClick={() => navigate("/developer/dashboard")}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-6 group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-indigo-400" /> Back to Dashboard
            </button>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-48 bg-blue-500/10 blur-[100px] pointer-events-none -z-10" />
            
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight flex items-center gap-4">
                <BarChart3 className="w-10 h-10 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" /> Analytics Intelligence
              </h1>
              <p className="text-slate-400 font-medium text-lg max-w-xl">
                Monitor user engagement, platform growth, credit consumption, and operational insights in real time.
              </p>
            </div>

            {/* Live Status Bar */}
            <div className="flex flex-wrap items-center gap-4 px-6 py-3 rounded-full bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.35)] text-[10px] sm:text-xs font-bold tracking-widest text-slate-400 uppercase">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> Analytics Engine Active</span>
              <span className="hidden sm:flex items-center gap-2"><Activity className="w-3 h-3 text-blue-400" /> Live Metrics Streaming</span>
              <span className="hidden lg:flex items-center gap-2"><Cloud className="w-3 h-3 text-cyan-400" /> Cloud Data Synced</span>
              <span className="hidden xl:flex items-center gap-2"><Zap className="w-3 h-3 text-indigo-400" /> Real-Time Insights Enabled</span>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="mb-10 flex gap-2 p-1.5 bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-full w-fit shadow-[0_12px_40px_rgba(0,0,0,0.35)] relative z-20">
          {timeRanges.map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`relative px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-colors z-10 ${
                timeRange === range.id ? "text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {timeRange === range.id && (
                <motion.div
                  layoutId="activeTimeRange"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {range.label}
            </button>
          ))}
        </div>

        {/* Loading State / Metrics */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] mb-10">
             <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-4 shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
             <div className="text-white font-bold tracking-widest uppercase text-sm">Aggregating Metrics...</div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Daily Active Users", value: analytics?.dau?.toString() || "0", icon: Users, color: "blue", trend: "+12%" },
                { label: "Weekly Active Users", value: analytics?.wau?.toString() || "0", icon: UserPlus, color: "indigo", trend: "+8%" },
                { label: "Monthly Active Users", value: analytics?.mau?.toString() || "0", icon: Globe2, color: "cyan", trend: "+15%" },
                { label: "Retention Rate", value: analytics?.retentionRate || 0, icon: TrendingUp, color: "emerald", trend: "+2.4%", suffix: "%" },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                  className="group relative p-6 rounded-[24px] bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-[6px] hover:scale-[1.02] hover:border-blue-500/30 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)] overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 transition-opacity text-${stat.color}-400`}>
                    <stat.icon className="w-16 h-16" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all shadow-lg">
                        <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                      </div>
                      <span className={`flex items-center gap-1 text-[10px] font-bold text-${stat.color}-400 bg-${stat.color}-500/10 px-2 py-1 rounded-full border border-${stat.color}-500/20 uppercase tracking-widest`}>
                        <ArrowUpRight className="w-3 h-3" /> {stat.trend}
                      </span>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-4xl font-black text-white tracking-tight drop-shadow-md">
                        <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                </motion.div>
              ))}
            </div>

            {/* Analytics Snapshot Mini Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Clock, label: "Avg Session", value: "8m 42s", color: "blue" },
                { icon: Activity, label: "Growth", value: "+18.6%", color: "emerald" },
                { icon: Bot, label: "AI Requests", value: "48.2K", color: "indigo" },
                { icon: Server, label: "Sync Status", value: "Healthy", color: "cyan" },
              ].map((snapshot, i) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + (i * 0.1) }} key={i} className="group relative overflow-hidden flex flex-col items-center justify-center p-5 rounded-[20px] bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-250 hover:-translate-y-1 hover:scale-[1.04] hover:border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <snapshot.icon className={`w-6 h-6 text-${snapshot.color}-400 mb-2 group-hover:scale-110 transition-transform`} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{snapshot.label}</span>
                  <span className="text-lg font-black text-white">{snapshot.value}</span>
                </motion.div>
              ))}
            </div>

            {/* Feature Usage & Credits Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Feature Usage (Left Col - spans 8) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Most Used Features */}
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] pointer-events-none group-hover:bg-blue-500/20 transition-colors" />
                    <div className="relative z-10">
                      <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" /> Most Used Features
                      </h2>
                      <div className="space-y-6">
                        {(analytics?.featureUsage
                          ? (Object.entries(analytics.featureUsage) as [string, FeatureUsageStats][])
                              .sort((a, b) => (b[1]?.count || 0) - (a[1]?.count || 0))
                              .slice(0, 4)
                          : []
                        ).map(([feature, stats]: [string, any], index) => {
                          const maxCount = Math.max(...(analytics?.featureUsage ? Object.values(analytics.featureUsage).map((s: any) => s?.count || 0) : [100]));
                          const percentage = ((stats?.count || 0) / (maxCount || 1)) * 100;
                          return (
                            <div key={feature}>
                              <div className="flex justify-between mb-2 items-end">
                                <span className="text-sm font-bold text-white flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> {feature}
                                </span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/10">{stats?.count || 0} uses</span>
                              </div>
                              <div className="w-full bg-white/5 rounded-full h-3 border border-white/10 overflow-hidden relative">
                                <motion.div 
                                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full" 
                                  initial={{ width: "0%" }} animate={{ width: `${percentage}%` }} transition={{ duration: 1.5, delay: index * 0.1 }}
                                >
                                  <div className="w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
                                </motion.div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>

                  {/* Least Used Features */}
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />
                    <div className="relative z-10">
                      <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-400" /> Least Used Features
                      </h2>
                      <div className="space-y-6">
                        {(analytics?.featureUsage
                          ? (Object.entries(analytics.featureUsage) as [string, FeatureUsageStats][])
                              .sort((a, b) => (a[1]?.count || 0) - (b[1]?.count || 0))
                              .slice(0, 4)
                          : []
                        ).map(([feature, stats]: [string, any], index) => {
                          const maxCount = Math.max(...(analytics?.featureUsage ? Object.values(analytics.featureUsage).map((s: any) => s?.count || 0) : [100]));
                          const percentage = ((stats?.count || 0) / (maxCount || 1)) * 100;
                          return (
                            <div key={feature}>
                              <div className="flex justify-between mb-2 items-end">
                                <span className="text-sm font-bold text-white flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> {feature}
                                </span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/10">{stats?.count || 0} uses</span>
                              </div>
                              <div className="w-full bg-white/5 rounded-full h-3 border border-white/10 overflow-hidden relative">
                                <motion.div 
                                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full" 
                                  initial={{ width: "0%" }} animate={{ width: `${Math.max(percentage, 5)}%` }} transition={{ duration: 1.5, delay: index * 0.1 }}
                                >
                                  <div className="w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
                                </motion.div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>

                </div>

                {/* AI Platform Insights Panel */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start gap-5 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                      <Bot className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1 flex items-center gap-2">AI Platform Insight</h3>
                      <p className="text-slate-400 font-medium text-sm leading-relaxed">
                        User engagement remains <span className="text-white font-bold">stable</span> with no abnormal traffic spikes detected. Platform health score is <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 ml-1">Excellent</span>. Credit consumption is operating well within expected weekly thresholds.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Credit Consumption Timeline (Right Col - spans 4) */}
              <div className="lg:col-span-4 h-full">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-blue-500/20 rounded-[24px] shadow-[0_12px_40px_rgba(59,130,246,0.15)] p-8 h-full relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] pointer-events-none group-hover:bg-blue-500/20 transition-colors" />
                  <div className="relative z-10 flex flex-col h-full">
                    <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" /> Consumption Timeline
                    </h2>
                    <p className="text-xs font-medium text-slate-400 mb-8">Daily usage insights.</p>

                    <div className="space-y-6 flex-1 relative">
                      <div className="absolute top-2 bottom-2 left-4 w-px bg-white/10" />
                      {[
                        { day: "Today", consumed: 12450, remaining: 87550, pct: 15 },
                        { day: "Yesterday", consumed: 21000, remaining: 100000, pct: 21 },
                        { day: "Day 3", consumed: 18500, remaining: 121000, pct: 18 },
                        { day: "Day 4", consumed: 15000, remaining: 139500, pct: 15 },
                        { day: "Day 5", consumed: 22000, remaining: 154500, pct: 22 },
                      ].map((item, i) => (
                        <div key={item.day} className="flex gap-4 items-start relative z-10 group/row">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border backdrop-blur-md transition-transform group-hover/row:scale-110 ${i === 0 ? 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-slate-800 border-white/10'}`}>
                            <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-blue-400 animate-pulse' : 'bg-slate-400'}`} />
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="flex justify-between items-end mb-2">
                              <span className={`text-sm font-bold ${i === 0 ? 'text-white' : 'text-slate-300'}`}>{item.day}</span>
                              <div className="flex gap-2">
                                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">-{item.consumed}</span>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{item.remaining} rem</span>
                              </div>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5 border border-white/5 overflow-hidden">
                              <motion.div 
                                className={`h-full rounded-full ${i === 0 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-slate-600'}`}
                                initial={{ width: "0%" }} animate={{ width: `${item.pct}%` }} transition={{ duration: 1.5, delay: i * 0.1 }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Traffic & Errors Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Traffic Sources */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] pointer-events-none" />
                <div className="relative z-10">
                  <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                    <Globe2 className="w-5 h-5 text-cyan-400" /> Traffic Sources
                  </h2>
                  <div className="space-y-4">
                    {[
                      { source: "Direct", percentage: 45, icon: Rocket, color: "blue" },
                      { source: "Search", percentage: 32, icon: Search, color: "indigo" },
                      { source: "Social", percentage: 18, icon: MessageCircle, color: "purple" },
                      { source: "Referral", percentage: 5, icon: Link2, color: "cyan" },
                    ].map((item, i) => (
                      <div key={item.source} className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-[16px] hover:bg-white/[0.04] hover:border-white/10 transition-colors group">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-bold text-white flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-${item.color}-500/20 flex items-center justify-center`}>
                              <item.icon className={`w-4 h-4 text-${item.color}-400`} />
                            </div>
                            {item.source}
                          </span>
                          <span className={`text-sm font-black text-${item.color}-400 bg-${item.color}-500/10 px-3 py-1 rounded-full border border-${item.color}-500/20 shadow-[0_0_10px_rgba(0,0,0,0.2)] group-hover:scale-105 transition-transform`}>
                            {item.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2 border border-white/5 overflow-hidden relative">
                          <motion.div 
                            className={`absolute top-0 left-0 h-full bg-gradient-to-r from-${item.color}-600 to-${item.color}-400 rounded-full`}
                            initial={{ width: "0%" }} animate={{ width: `${item.percentage}%` }} transition={{ duration: 1.5, delay: i * 0.1 }}
                          >
                            <div className="w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
                          </motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Error Analytics */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[80px] pointer-events-none" />
                <div className="relative z-10">
                  <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-400" /> Error Categories
                  </h2>
                  <div className="space-y-4">
                    {[
                      { category: "API Request Timeouts", count: 142, icon: Cloud, color: "orange" },
                      { category: "Upload Failures", count: 86, icon: Server, color: "rose" },
                      { category: "Authentication Issues", count: 45, icon: Lock, color: "amber" },
                      { category: "Database Queries", count: 12, icon: Database, color: "red" },
                    ].map((item, i) => (
                      <div key={item.category} className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-[16px] hover:bg-white/[0.04] hover:border-rose-500/30 transition-colors group">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-bold text-white flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-${item.color}-500/10 flex items-center justify-center border border-${item.color}-500/20`}>
                              <item.icon className={`w-4 h-4 text-${item.color}-400`} />
                            </div>
                            {item.category}
                          </span>
                          <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded border border-white/10 uppercase tracking-widest group-hover:border-rose-500/50 group-hover:text-white transition-colors">
                            {item.count} errors
                          </span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 border border-white/5 overflow-hidden">
                          <motion.div 
                            className={`h-full bg-gradient-to-r from-${item.color}-600 to-${item.color}-400 rounded-full`}
                            initial={{ width: "0%" }} animate={{ width: `${(item.count / 142) * 100}%` }} transition={{ duration: 1.5, delay: i * 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        )}

        {/* Floating AI Orb */}
        <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-[30px] pointer-events-none hidden xl:block z-50" />
        <motion.div 
          className="fixed bottom-10 right-10 w-24 h-24 rounded-full bg-gradient-to-br from-[#0A0F1C] to-blue-900/50 border border-blue-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.3)] group cursor-pointer hidden xl:flex z-50"
          animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.15, rotate: 180, transition: { duration: 0.5 } }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-blue-400/20 border-t-blue-400 animate-[spin_4s_linear_infinite]" />
          <div className="absolute inset-2 rounded-full border border-indigo-400/20 border-b-indigo-400 animate-[spin_3s_linear_infinite_reverse]" />
          <BarChart3 className="w-8 h-8 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] group-hover:scale-110 transition-transform group-hover:text-cyan-300" />
        </motion.div>

      </div>
    </div>
  );
}

// Minimal missing icon
function Lock(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
}
