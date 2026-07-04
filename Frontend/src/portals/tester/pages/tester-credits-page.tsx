import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  TrendingDown, 
  AlertTriangle, 
  ArrowLeft,
  Activity,
  Cloud,
  Lock,
  Globe2,
  Calendar,
  BarChart3,
  Film,
  Image as ImageIcon,
  TestTube2,
  ChevronRight,
  Database
} from "lucide-react";
import { fetchTesterCredits, fetchTesterCreditHistory } from "../../../services/developer-portal-api.service";

interface CreditTransaction {
  id: string;
  type: "usage" | "refund" | "topup" | "allocation";
  description: string;
  amount: number;
  balance: number;
  timestamp: string;
  details?: string;
}

interface CreditData {
  currentBalance: number;
  weeklyAllocation: number;
  weeklyUsed: number;
  monthlyUsed: number;
}

const particles = Array.from({ length: 30 });

// Animated Number Counter Component
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(Math.round(v))
    });
    return controls.stop;
  }, [value]);

  return <span>{displayValue}</span>;
}

export function TesterCreditsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month");
  const [creditData, setCreditData] = useState<CreditData>({
    currentBalance: 0,
    weeklyAllocation: 0,
    weeklyUsed: 0,
    monthlyUsed: 0,
  });
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    if (!authLoading && profile?.id) {
      loadCreditData();
    }
  }, [profile, authLoading]);

  const loadCreditData = async () => {
    setIsLoading(true);
    try {
      const creditsData = await fetchTesterCredits(profile!.id);
      setCreditData({
        currentBalance: creditsData.currentBalance || 0,
        weeklyAllocation: creditsData.weeklyAllocation || 0,
        weeklyUsed: creditsData.weeklyUsed || 0,
        monthlyUsed: creditsData.monthlyUsed || 0,
      });

      const historyData = await fetchTesterCreditHistory(profile!.id);
      let runningBalance = creditsData.currentBalance || 0;
      const mappedTransactions: CreditTransaction[] = (historyData.transactions || []).map((transaction: any) => {
        const isUsage = transaction.type === "used";
        const signedAmount = isUsage ? -Math.abs(transaction.amount || 0) : Math.abs(transaction.amount || 0);
        const normalized = {
          id: transaction.id,
          type: isUsage
            ? "usage"
            : transaction.type === "refunded"
            ? "refund"
            : "allocation",
          description: transaction.reason || "Credit update",
          amount: signedAmount,
          balance: runningBalance,
          timestamp: transaction.timestamp,
          details: transaction.assignedBy ? `By ${transaction.assignedBy}` : undefined,
        } satisfies CreditTransaction;

        runningBalance -= signedAmount;
        return normalized;
      });

      setTransactions(mappedTransactions);
    } catch (error) {
      console.error("Failed to load credit data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return <div className="flex items-center justify-center min-h-[100dvh] bg-[#050816] text-cyan-400 font-bold">Loading your credits...</div>;
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  const getLowBalanceAlert = () => {
    if (creditData.currentBalance < 50) {
      return { show: true, level: "critical", message: "LOW CREDIT BALANCE" };
    } else if (creditData.currentBalance < 100) {
      return { show: true, level: "warning", message: "CREDIT WARNING" };
    }
    return { show: false, level: "", message: "" };
  };

  const alert = getLowBalanceAlert();
  const filteredTransactions = transactions;

  const usagePercentage = creditData.weeklyAllocation > 0 
    ? Math.min(100, (creditData.weeklyUsed / creditData.weeklyAllocation) * 100) 
    : 0;

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-[#050816] font-sans selection:bg-cyan-500/30 selection:text-white text-slate-200 pb-16">
      
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('/noise.svg')]" />
        
        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vh] bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.25),transparent_40%)]" 
          />
          <motion.div 
            animate={{ rotate: -360, scale: [1, 1.2, 1] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] -right-[10%] w-[80vw] h-[80vh] bg-[radial-gradient(circle_at_80%_70%,rgba(6,182,212,0.18),transparent_40%)]" 
          />
          <motion.div 
            animate={{ rotate: 180, scale: [1, 1.15, 1] }} transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="absolute top-[20%] left-[20%] w-[60vw] h-[60vh] bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.12),transparent_50%)]" 
          />
        </div>

        {/* Ambient Light Blobs */}
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-purple-600/12 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-blue-600/12 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-cyan-600/12 rounded-full blur-[100px] mix-blend-screen" />

        {/* Mouse Follow Ambient Glow */}
        <motion.div 
          style={{ x: glowX, y: glowY, background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, rgba(124,58,237,0.5) 100%)' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[90px] opacity-15 pointer-events-none"
        />

        {/* Floating Particles */}
        {particles.map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full blur-[1px] ${i % 3 === 0 ? 'bg-cyan-400/20' : i % 3 === 1 ? 'bg-purple-400/20' : 'bg-blue-400/20'}`}
            style={{
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              left: `${Math.random() * 100}vw`,
              top: `${Math.random() * 100}vh`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 15 - 7.5, 0],
              opacity: [0.04, 0.12, 0.04],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Floating Decorative Labels */}
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[25%] left-[5%] opacity-30">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><Zap className="w-3 h-3 text-cyan-400" /> Credit Engine</div>
        </motion.div>
        <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[45%] right-[5%] opacity-30">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><Cloud className="w-3 h-3 text-purple-400" /> Cloud Sync</div>
        </motion.div>
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[20%] left-[8%] opacity-30">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><Lock className="w-3 h-3 text-emerald-400" /> Protected</div>
        </motion.div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        
        {/* Navigation / Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-10">
          <button
            onClick={() => navigate("/tester/dashboard")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] border border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] text-sm font-bold text-slate-300 hover:text-white hover:-translate-y-1 hover:scale-105 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-cyan-400" /> Back
          </button>
        </motion.div>

        {/* Hero Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-black tracking-[0.2em] text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-4 py-1.5 rounded-full mb-6 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <Zap className="w-4 h-4" /> ⚡ AI CREDIT MANAGEMENT
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] tracking-tight">
            TESTING CREDITS
          </h1>
          <p className="text-lg text-white/72 max-w-2xl font-medium mb-8">
            Monitor testing credits, usage analytics and allocation across the AI sandbox.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-emerald-500/30 text-xs font-bold text-emerald-300 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Credit Engine Active
            </motion.div>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-cyan-500/30 text-xs font-bold text-cyan-300 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <Zap className="w-3 h-3" /> Allocation Ready
            </motion.div>
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-blue-500/30 text-xs font-bold text-blue-300 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <Cloud className="w-3 h-3" /> Cloud Synced
            </motion.div>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-purple-500/30 text-xs font-bold text-purple-300 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <Globe2 className="w-3 h-3" /> Sandbox Mode
            </motion.div>
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-rose-500/30 text-xs font-bold text-rose-300 backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.1)]">
              <Lock className="w-3 h-3" /> Secure Credits
            </motion.div>
          </div>
        </motion.div>

        {/* Top Status Banner */}
        <div className="w-full flex items-center justify-center mb-8">
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 text-xs font-mono font-bold tracking-widest text-slate-400 border border-white/5 bg-[rgba(18,22,40,0.65)] backdrop-blur-md px-6 py-2.5 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.1)]"
          >
            <span className="hidden sm:inline opacity-50">━━━━━━━━━━━━</span>
            <span className="flex items-center gap-2 text-emerald-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Credit System Online</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="text-cyan-400">Allocation Active</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="text-purple-400">Sync Complete</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="text-blue-400 flex items-center gap-1">Usage Tracking Enabled</span>
            <span className="hidden sm:inline opacity-50">━━━━━━━━━━━━</span>
          </motion.div>
        </div>

        {/* Low Balance Alert */}
        <AnimatePresence>
          {alert.show && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
              className="relative rounded-[20px] p-[1px] overflow-hidden"
            >
              <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${alert.level === 'critical' ? 'from-red-500 to-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]' : 'from-yellow-400 to-orange-500 shadow-[0_0_20px_rgba(250,204,21,0.8)]'} z-20 animate-pulse`} />
              <div className={`relative flex items-start sm:items-center gap-4 p-5 sm:p-6 backdrop-blur-[24px] rounded-[19px] border border-white/5 ${alert.level === 'critical' ? 'bg-red-950/40 shadow-[0_0_40px_rgba(239,68,68,0.15)]' : 'bg-yellow-950/40 shadow-[0_0_40px_rgba(250,204,21,0.15)]'}`}>
                <div className={`shrink-0 p-3 rounded-full ${alert.level === 'critical' ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                  <AlertTriangle className={`w-6 h-6 ${alert.level === 'critical' ? 'text-red-400' : 'text-yellow-400'} animate-pulse`} />
                </div>
                <div>
                  <h3 className={`text-sm font-black uppercase tracking-widest mb-1 ${alert.level === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}>⚠ {alert.message}</h3>
                  <p className={`text-sm font-medium ${alert.level === 'critical' ? 'text-red-200/80' : 'text-yellow-200/80'}`}>
                    Testing allocation is running low. Request additional credits or optimize AI usage.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Balance Hero Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-8 relative p-[1px] rounded-[32px] overflow-hidden bg-white/5 group"
        >
          {/* Animated Continuous Border */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-30 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
          
          <div className="relative bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[31px] p-8 md:p-12 border border-white/[0.08] shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
            
            {/* Background Decorative Energy Rings */}
            <div className="absolute top-1/2 right-10 -translate-y-1/2 w-64 h-64 border-[40px] border-cyan-500/5 rounded-full blur-[2px] opacity-0 md:opacity-100" />
            <div className="absolute top-1/2 right-16 -translate-y-1/2 w-48 h-48 border-[20px] border-blue-500/10 rounded-full blur-[1px] opacity-0 md:opacity-100" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                    <Zap className="w-6 h-6 text-cyan-400" />
                  </div>
                  <span className="text-cyan-400/80 text-sm font-black uppercase tracking-[0.2em]">Current Balance</span>
                </div>
                
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 drop-shadow-[0_0_30px_rgba(6,182,212,0.4)] tracking-tighter">
                    <AnimatedNumber value={creditData.currentBalance} />
                  </span>
                </div>
                <p className="text-slate-300 text-lg font-bold mb-8">Testing Credits Available</p>
                
                {/* Premium Chips */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                    <Database className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-slate-300">Est. {Math.floor(creditData.currentBalance / 25)} Tests Remaining</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-300">Weekly Allocation: {creditData.weeklyAllocation}</span>
                  </div>
                </div>
              </div>

              {/* Right Side Animated Lightning (visible on md+) */}
              <div className="hidden md:flex relative items-center justify-center w-48 h-48">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-dashed border-cyan-500/30 rounded-full" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute inset-4 border border-blue-500/40 rounded-full" />
                <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                  <Zap className="w-20 h-20 text-cyan-300 drop-shadow-[0_0_30px_rgba(6,182,212,0.8)]" />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {/* Weekly Allocation */}
          <div className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-20 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
            <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] p-6 border border-white/[0.08] group-hover:border-transparent transition-colors shadow-[0_0_40px_rgba(139,92,246,0.1)] flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <p className="text-purple-300/80 text-xs font-bold uppercase tracking-widest">Weekly Allocation</p>
                <Calendar className="w-6 h-6 text-purple-400 group-hover:rotate-12 transition-transform" />
              </div>
              <p className="text-white text-4xl font-black mb-2"><AnimatedNumber value={creditData.weeklyAllocation} /></p>
              <p className="text-purple-400/60 text-xs font-bold uppercase tracking-wider">Resets every Monday</p>
            </div>
          </div>

          {/* Used This Week */}
          <div className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
            <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] p-6 border border-white/[0.08] group-hover:border-transparent transition-colors shadow-[0_0_40px_rgba(59,130,246,0.1)] flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <p className="text-blue-300/80 text-xs font-bold uppercase tracking-widest">Used This Week</p>
                <Activity className="w-6 h-6 text-blue-400 group-hover:rotate-12 transition-transform" />
              </div>
              <p className="text-white text-4xl font-black mb-4"><AnimatedNumber value={creditData.weeklyUsed} /></p>
              
              {/* Animated Progress */}
              <div className="w-full bg-black/40 rounded-full h-2 mb-2 overflow-hidden relative border border-white/5">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${usagePercentage}%` }} transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`absolute top-0 left-0 h-full rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)] overflow-hidden ${usagePercentage > 90 ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400'}`}
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </motion.div>
              </div>
              <p className="text-blue-400/60 text-xs font-bold uppercase tracking-wider">{usagePercentage.toFixed(0)}% Utilized</p>
            </div>
          </div>

          {/* Used This Month */}
          <div className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-500 opacity-20 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
            <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] p-6 border border-white/[0.08] group-hover:border-transparent transition-colors shadow-[0_0_40px_rgba(6,182,212,0.1)] flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <p className="text-cyan-300/80 text-xs font-bold uppercase tracking-widest">Used This Month</p>
                <BarChart3 className="w-6 h-6 text-cyan-400 group-hover:rotate-12 transition-transform" />
              </div>
              <p className="text-white text-4xl font-black mb-2"><AnimatedNumber value={creditData.monthlyUsed} /></p>
              <p className="text-cyan-400/60 text-xs font-bold uppercase tracking-wider">Cumulative usage</p>
            </div>
          </div>
        </motion.div>

        {/* Credit Cost Reference (Pricing Grid) */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-12">
          <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3"><TrendingDown className="w-5 h-5 text-purple-400" /> Credit Cost Reference</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="group bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] p-5 rounded-2xl border border-white/5 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 flex flex-col items-center justify-center text-center">
              <Film className="w-8 h-8 text-cyan-400 mb-3 group-hover:rotate-12 transition-transform" />
              <p className="text-white font-bold mb-1">720p Video <span className="text-slate-400 text-xs font-normal">(10s)</span></p>
              <p className="text-cyan-400 font-black text-xl">10 Credits</p>
            </div>
            <div className="group bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] p-5 rounded-2xl border border-white/5 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 flex flex-col items-center justify-center text-center">
              <Film className="w-8 h-8 text-blue-400 mb-3 group-hover:rotate-12 transition-transform" />
              <p className="text-white font-bold mb-1">1080p Video <span className="text-slate-400 text-xs font-normal">(15s)</span></p>
              <p className="text-blue-400 font-black text-xl">25 Credits</p>
            </div>
            <div className="group bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] p-5 rounded-2xl border border-white/5 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 flex flex-col items-center justify-center text-center">
              <ImageIcon className="w-8 h-8 text-purple-400 mb-3 group-hover:rotate-12 transition-transform" />
              <p className="text-white font-bold mb-1">4K Video <span className="text-slate-400 text-xs font-normal">(30s)</span></p>
              <p className="text-purple-400 font-black text-xl">50 Credits</p>
            </div>
            <div className="group bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] p-5 rounded-2xl border border-white/5 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 flex flex-col items-center justify-center text-center">
              <Cloud className="w-8 h-8 text-emerald-400 mb-3 group-hover:rotate-12 transition-transform" />
              <p className="text-white font-bold mb-1">API Test Call</p>
              <p className="text-emerald-400 font-black text-xl">2 Credits</p>
            </div>
          </div>
        </motion.div>

        {/* Transaction History Panel */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mb-12 relative p-[1px] rounded-[24px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-20" style={{ padding: '1px' }} />
          <div className="relative bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] border border-white/[0.08] shadow-[0_0_40px_rgba(0,0,0,0.3)]">
            
            <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
                📜 TRANSACTION HISTORY
              </h2>
              
              <div className="flex bg-black/40 p-1 rounded-full border border-white/5">
                {(["week", "month", "all"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`relative px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                      timeRange === range ? "text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {timeRange === range && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{range === "week" ? "This Week" : range === "month" ? "This Month" : "All Time"}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                    <Zap className="w-16 h-16 text-slate-500/30 mb-4" />
                  </motion.div>
                  <p className="text-xl font-black text-white mb-2">No Transactions Yet</p>
                  <p className="text-slate-400">Your testing activity will appear here once credits are consumed.</p>
                </div>
              ) : (
                filteredTransactions.map((transaction) => {
                  const isCredit = transaction.amount > 0;
                  return (
                    <div key={transaction.id} className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <span className="text-slate-500 font-mono text-xs">{transaction.id}</span>
                          <h4 className="text-white font-bold">{transaction.description}</h4>
                          {transaction.details && (
                            <span className="text-cyan-300/80 text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                              {transaction.details}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs font-medium">{new Date(transaction.timestamp).toLocaleString()}</p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className={`text-xl font-black tracking-tight mb-1 ${isCredit ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]"}`}>
                          {isCredit ? "+" : ""}{transaction.amount}
                        </p>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Balance: <span className="text-white">{transaction.balance}</span></p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* Need More Credits Upgrade Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="relative p-[1px] rounded-[24px] overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-50" style={{ padding: '1px' }} />
          <div className="relative bg-[#0B1020]/90 backdrop-blur-[24px] p-8 md:p-10 rounded-[23px] flex flex-col md:flex-row justify-between items-center gap-8 shadow-[inset_0_0_60px_rgba(59,130,246,0.15)]">
            
            {/* Ambient Lighting Inside Card */}
            <div className="absolute top-1/2 left-10 -translate-y-1/2 w-48 h-48 bg-blue-600/20 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10 flex-1 text-center md:text-left">
              <h3 className="text-2xl font-black text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <Zap className="w-6 h-6 text-cyan-400" /> Need More Credits?
              </h3>
              <p className="text-blue-200/80 font-medium max-w-lg">
                Request additional testing allocation from your administrator. Ensure your justification aligns with active QA sprint goals.
              </p>
            </div>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10 w-full md:w-auto bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold px-8 py-4 rounded-full shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all overflow-hidden group/btn flex items-center justify-center gap-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              Request Credits <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>

        {/* Minimal Footer */}
        <footer className="mt-16 text-center pb-8">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 space-y-2">
            <p className="text-slate-500">VEYTRIX.AI TESTER PORTAL</p>
          </div>
        </footer>

      </div>
    </div>
  );
}
