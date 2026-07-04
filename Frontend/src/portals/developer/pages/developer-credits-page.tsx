import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  Zap, 
  Users, 
  Code, 
  Activity, 
  BarChart3, 
  Database, 
  Cloud, 
  Plus, 
  RefreshCw, 
  Download, 
  Settings,
  CreditCard,
  Video,
  Image as ImageIcon,
  Scissors,
  Bot,
  AlertCircle
} from "lucide-react";
import { fetchCreditsStats, fetchCreditTransactions, addCreditsToUser } from "../../../services/developer-portal-api.service";

interface Transaction {
  id: string;
  user: string;
  type: string;
  amount: number;
  reason: string;
  date: string;
}

const particles = Array.from({ length: 40 });

// Animated Number Counter Component
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(Math.round(v))
    });
    return controls.stop;
  }, [value]);

  const formatted = displayValue >= 1000000 
    ? `${(displayValue / 1000000).toFixed(1)}M` 
    : displayValue >= 1000 
      ? `${(displayValue / 1000).toFixed(0)}K` 
      : displayValue.toLocaleString();

  return <span>{prefix}{formatted}{suffix}</span>;
}

// Circular Progress Component
function CircularProgress({ percentage, label, color, icon: Icon }: { percentage: number, label: string, color: string, icon: any }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[22px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-250 hover:-translate-y-[6px] hover:scale-[1.02] hover:border-blue-500/30 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)] group relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-b from-${color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="relative w-24 h-24 mb-4">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle className="text-white/5 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent" />
          <motion.circle 
            className={`text-${color}-500 stroke-current drop-shadow-[0_0_10px_currentColor]`}
            strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"
            strokeDasharray="251.2"
            initial={{ strokeDashoffset: 251.2 }}
            animate={{ strokeDashoffset: 251.2 - (251.2 * percentage) / 100 }}
            transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-xl font-black text-white"><AnimatedNumber value={percentage} suffix="%" /></span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
        <Icon className={`w-4 h-4 text-${color}-400`} /> {label}
      </div>
    </div>
  );
}

export function DeveloperCreditsPage() {
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "add">("overview");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [stats, setStats] = useState({
    userCreditsTotal: 0,
    developerCreditsTotal: 0,
    dailyConsumption: 0,
    averagePerUser: 0,
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, transactionsData] = await Promise.all([
        fetchCreditsStats(),
        fetchCreditTransactions(),
      ]);
      setStats({
        userCreditsTotal: statsData.userCreditsTotal || 0,
        developerCreditsTotal: statsData.developerCreditsTotal || 0,
        dailyConsumption: statsData.dailyConsumption || 0,
        averagePerUser: statsData.averagePerUser || 0,
      });
      setTransactions(transactionsData.transactions || []);
    } catch (error) {
      console.error("Failed to load credits data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !amount) {
      alert("Please fill in all fields");
      return;
    }

    setIsAdding(true);
    try {
      alert("User lookup by email coming soon");
    } catch (error) {
      console.error("Failed to add credits:", error);
      alert("Failed to add credits");
    } finally {
      setIsAdding(false);
      setEmail("");
      setAmount("");
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "transactions", label: "Transactions" },
    { id: "add", label: "Add Credits" },
  ] as const;

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-[#030712] font-sans selection:bg-blue-500/30 selection:text-white text-slate-200 pb-24">
      
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-[url('/noise.svg')]" />
        
        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.05, 1] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[30%] -right-[10%] w-[80vw] h-[80vh] bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_40%)]" 
          />
          <motion.div 
            animate={{ rotate: -360, scale: [1, 1.1, 1] }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] -left-[10%] w-[70vw] h-[70vh] bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_45%)]" 
          />
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />

        {/* Mouse Follow Ambient Glow */}
        <motion.div 
          style={{ x: glowX, y: glowY, background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(139,92,246,0.2) 100%)' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[100px] opacity-10 pointer-events-none"
        />

        {/* Floating Particles */}
        {particles.map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full blur-[1px] ${i % 3 === 0 ? 'bg-blue-400/10' : i % 3 === 1 ? 'bg-indigo-400/10' : 'bg-white/5'}`}
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

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 py-10">
        
        {/* Header */}
        <div className="mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <button
              onClick={() => navigate("/developer/dashboard")}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-6 group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-blue-400" /> Back to Dashboard
            </button>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-32 bg-blue-500/20 blur-[100px] pointer-events-none -z-10" />
            
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight flex items-center gap-4">
                <Zap className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" /> Credits Management
              </h1>
              <p className="text-slate-400 font-medium text-lg max-w-xl">
                Manage user and developer credits across the VEYTRIX AI ecosystem.
              </p>
            </div>

            {/* Live Status Bar */}
            <div className="flex flex-wrap items-center gap-4 px-6 py-3 rounded-full bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.35)] text-[10px] sm:text-xs font-bold tracking-widest text-slate-400 uppercase">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> Credit Engine Online</span>
              <span className="hidden sm:flex items-center gap-2"><CreditCard className="w-3 h-3 text-blue-400" /> Wallet API Connected</span>
              <span className="hidden lg:flex items-center gap-2"><Activity className="w-3 h-3 text-purple-400" /> Transactions Synced</span>
              <span className="hidden xl:flex items-center gap-2"><Cloud className="w-3 h-3 text-cyan-400" /> Cloud Database Healthy</span>
            </div>
          </motion.div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {[
            { icon: Users, label: "User Credits", value: stats.userCreditsTotal, color: "blue", change: "+0%" },
            { icon: Code, label: "Developer Credits", value: stats.developerCreditsTotal, color: "indigo", change: "+0%" },
            { icon: Zap, label: "Daily Consumption", value: stats.dailyConsumption, color: "yellow", change: "Today" },
            { icon: BarChart3, label: "Average Per User", value: stats.averagePerUser, color: "emerald", suffix: " Cr" },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative p-6 rounded-[22px] bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-250 hover:-translate-y-[6px] hover:scale-[1.02] hover:border-blue-500/30 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)] overflow-hidden"
            >
              <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${stat.color}-400`}>
                <stat.icon className="w-16 h-16" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  <stat.icon className={`w-4 h-4 text-${stat.color}-400`} /> {stat.label}
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </span>
                  {stat.change && <span className={`text-${stat.color}-400 text-xs font-bold bg-${stat.color}-500/10 px-2 py-1 rounded-md border border-${stat.color}-500/20`}>{stat.change}</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="mb-10 flex gap-2 p-1.5 bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-full w-fit shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-colors z-10 ${
                activeTab === tab.id ? "text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && (
              <div className="space-y-8">
                
                {/* Analytics Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Credit Distribution Panel */}
                  <div className="lg:col-span-2 bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] pointer-events-none group-hover:bg-blue-500/20 transition-colors" />
                    
                    <div className="relative z-10">
                      <h2 className="text-xl font-black text-white mb-1 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" /> Credit Distribution
                      </h2>
                      <p className="text-sm font-medium text-slate-400 mb-8">Live platform allocation overview</p>

                      <div className="space-y-8">
                        <div>
                          <div className="flex justify-between mb-3 text-sm font-bold uppercase tracking-widest">
                            <span className="text-blue-400 flex items-center gap-2"><Users className="w-4 h-4" /> User Credits</span>
                            <span className="text-white">0 / 0 <span className="text-slate-500 ml-2">0%</span></span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-3 border border-white/10 overflow-hidden relative">
                            <motion.div 
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full" 
                              initial={{ width: "0%" }}
                              animate={{ width: "0%" }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                            >
                              <div className="w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
                            </motion.div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-3 text-sm font-bold uppercase tracking-widest">
                            <span className="text-indigo-400 flex items-center gap-2"><Code className="w-4 h-4" /> Developer Credits</span>
                            <span className="text-white">0 / 0 <span className="text-slate-500 ml-2">0%</span></span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-3 border border-white/10 overflow-hidden relative">
                            <motion.div 
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full" 
                              initial={{ width: "0%" }}
                              animate={{ width: "0%" }}
                              transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                            >
                              <div className="w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Side Insight Panel */}
                  <div className="lg:col-span-1 bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-blue-500/20 rounded-[24px] shadow-[0_12px_40px_rgba(59,130,246,0.15)] p-8 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-50" />
                    <div className="relative z-10 flex flex-col h-full justify-center space-y-6">
                      <div className="flex items-center gap-3 text-lg font-black text-white">
                        <CreditCard className="w-6 h-6 text-blue-400" /> Wallet Health
                        <span className="ml-auto text-emerald-400 text-sm bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Excellent 🟢</span>
                      </div>
                      
                      <div className="h-px w-full bg-white/10" />
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm font-bold">
                          <span className="text-slate-400">Today's Allocation</span>
                          <span className="text-emerald-400">+0</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold">
                          <span className="text-slate-400">Remaining Capacity</span>
                          <span className="text-white">0</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold">
                          <span className="text-slate-400">Average Usage</span>
                          <span className="text-white">0 Credits/User</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Circular Visualizations & Timeline */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Col: Circular Visuals & AI Insight */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <CircularProgress percentage={0} label="Video Gen" color="blue" icon={Video} />
                      <CircularProgress percentage={0} label="Image AI" color="purple" icon={ImageIcon} />
                      <CircularProgress percentage={0} label="Manual Edit" color="emerald" icon={Scissors} />
                    </div>

                    {/* AI Insight Card */}
                    <div className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-6 flex items-start gap-5 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        <Bot className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1">AI Recommendation</h3>
                        <p className="text-slate-400 font-medium text-sm leading-relaxed">
                          Current usage suggests Developer credits are being underutilized. Consider reallocating <span className="text-cyan-400 font-bold">0%</span> to user credits to prevent a bottleneck during the next peak usage window.
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { icon: Plus, label: "Allocate", color: "text-emerald-400" },
                        { icon: RefreshCw, label: "Reset Pool", color: "text-amber-400" },
                        { icon: Download, label: "Export", color: "text-blue-400" },
                        { icon: Settings, label: "Settings", color: "text-slate-400" },
                      ].map((action, i) => (
                        <button key={i} className="group relative overflow-hidden flex flex-col items-center justify-center p-4 rounded-[20px] bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-250 hover:-translate-y-1 hover:scale-[1.04] hover:border-white/20">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                          <action.icon className={`w-6 h-6 ${action.color} mb-2`} />
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Col: Timeline & Floating Coin */}
                  <div className="lg:col-span-1 space-y-6 relative">
                    <div className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-6 h-full flex flex-col">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6">Recent Activity</h3>
                      
                      <div className="space-y-6 flex-1 relative">
                        <div className="absolute top-2 bottom-2 left-4 w-px bg-white/10" />
                        {[] as any[]}
                      </div>
                    </div>

                    {/* Floating Coin */}
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-[20px] pointer-events-none" />
                    <motion.div 
                      className="absolute -bottom-4 -right-4 w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-[#0A0F1C] to-blue-900/50 border border-blue-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.3)] group cursor-pointer"
                      animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      whileHover={{ scale: 1.1, rotate: 180, transition: { duration: 0.5 } }}
                    >
                      <div className="absolute inset-0 rounded-full border-2 border-blue-400/20 border-t-blue-400 animate-spin" style={{ animationDuration: '3s' }} />
                      <Zap className="w-10 h-10 md:w-12 md:h-12 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] group-hover:scale-110 transition-transform" />
                    </motion.div>

                  </div>
                </div>

              </div>
            )}

            {activeTab === "transactions" && (
              <div className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white/[0.02] border-b border-white/[0.06] sticky top-0 backdrop-blur-xl z-20">
                      <tr>
                        {['User', 'Type', 'Amount', 'Reason', 'Date'].map((head) => (
                          <th key={head} className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {transactions.map((tx, index) => (
                        <tr 
                          key={tx.id} 
                          className={`group transition-all duration-250 hover:bg-white/[0.04] hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] ${index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'}`}
                        >
                          <td className="px-6 py-4 group-hover:translate-x-1 transition-transform">
                            <span className="text-sm font-bold text-white">{tx.user}</span>
                          </td>
                          <td className="px-6 py-4 group-hover:translate-x-1 transition-transform">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                tx.type === "usage"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : tx.type === "purchase"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              }`}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 group-hover:translate-x-1 transition-transform">
                            <span className={`text-sm font-black tracking-widest ${tx.amount < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                              {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 group-hover:translate-x-1 transition-transform">
                            <span className="text-sm text-slate-300 font-medium">{tx.reason}</span>
                          </td>
                          <td className="px-6 py-4 group-hover:translate-x-1 transition-transform">
                            <span className="text-xs font-bold text-slate-500 uppercase">{tx.date}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "add" && (
              <div className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-8 max-w-xl mx-auto relative overflow-hidden group/form">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent opacity-0 group-hover/form:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                      <Plus className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Add Credits</h2>
                      <p className="text-sm text-slate-400 font-medium">Manually allocate credits to a user account.</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddCredits} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">User Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="developer@veytrix.ai"
                        required
                        className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-[16px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Credits Amount</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        min="1"
                        required
                        className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-[16px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all font-medium"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isAdding}
                      className="w-full group/submit relative overflow-hidden flex items-center justify-center gap-2 px-8 py-4 rounded-[16px] bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] text-sm font-black text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 mt-4"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/submit:animate-[shimmer_1.5s_infinite]" />
                      {isAdding ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                      <span className="relative z-10 uppercase tracking-widest">{isAdding ? "Allocating..." : "Allocate Credits"}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
