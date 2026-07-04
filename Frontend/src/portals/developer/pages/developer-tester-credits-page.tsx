import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Send, 
  AlertCircle, 
  Zap, 
  TrendingUp, 
  ChevronLeft,
  Users,
  CreditCard,
  Cloud,
  Database,
  Bot,
  RefreshCw,
  Activity,
  BarChart3,
  CheckCircle2,
  Video
} from "lucide-react";
import {
  assignCreditsToTester,
  createTester,
  fetchTesterCreditHistory,
  fetchTesters,
} from "../../../services/developer-portal-api.service";

interface Tester {
  id: string;
  email: string;
  name: string;
  currentCredits: number;
  weeklyAllocation: number;
  totalUsed: number;
  status: "active" | "inactive";
}

interface CreditTransaction {
  id: string;
  testerId: string;
  amount: number;
  reason: string;
  assignedBy: string;
  timestamp: string;
  type: "assigned" | "used" | "refunded";
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

export function DeveloperTesterCreditsPage() {
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [testers, setTesters] = useState<Tester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTester, setSelectedTester] = useState<Tester | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showAddTester, setShowAddTester] = useState(false);
  const [newTesterEmail, setNewTesterEmail] = useState("");
  const [newTesterName, setNewTesterName] = useState("");

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

  const loadTesters = async () => {
    setIsLoading(true);
    try {
      const testerData = await fetchTesters();
      setTesters(testerData.testers || []);
    } catch (error) {
      console.error("Failed to load testers:", error);
      setTesters([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTesters();
  }, []);

  const handleAddTester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTesterEmail || !newTesterName) {
      alert("Please fill in all fields");
      return;
    }
    try {
      const response = await createTester(newTesterEmail, newTesterName);
      setNewTesterEmail("");
      setNewTesterName("");
      setShowAddTester(false);
      await loadTesters();
      const message = response.temporaryPassword
        ? `Tester created for ${response.email}. Temporary password: ${response.temporaryPassword}`
        : `Tester access updated for ${response.email}.`;
      alert(message);
    } catch (error) {
      console.error("Failed to add tester:", error);
      alert(error instanceof Error ? error.message : "Failed to add tester");
    }
  };

  const handleSelectTester = async (tester: Tester) => {
    setSelectedTester(tester);
    setShowForm(false);
    try {
      const historyData = await fetchTesterCreditHistory(tester.id);
      setHistory(historyData.transactions || []);
    } catch (error) {
      console.error("Failed to load tester history:", error);
      setHistory([]);
    }
  };

  const handleAssignCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTester || !creditAmount || !reason) {
      alert("Please fill in all fields");
      return;
    }
    const amount = parseInt(creditAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid credit amount");
      return;
    }

    setIsAssigning(true);
    try {
      const response = await assignCreditsToTester(selectedTester.id, amount, reason);
      const updatedBalance = response.newBalance ?? selectedTester.currentCredits + amount;

      setTesters((prev) =>
        prev.map((tester) =>
          tester.id === selectedTester.id
            ? { ...tester, currentCredits: updatedBalance }
            : tester,
        ),
      );
      setSelectedTester((prev) =>
        prev ? { ...prev, currentCredits: updatedBalance } : null,
      );

      const newTransaction: CreditTransaction = {
        id: `TXN-${Date.now()}`,
        testerId: selectedTester.id,
        amount,
        reason,
        assignedBy: "Developer",
        timestamp: new Date().toLocaleString(),
        type: "assigned",
      };

      setHistory((prev) => [newTransaction, ...prev]);
      setCreditAmount("");
      setReason("");
      setShowForm(false);
      alert(`Assigned ${amount} credits to ${selectedTester.email}`);
    } catch (error: any) {
      alert(`Failed to assign credits: ${error.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#030712] font-sans">
        <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-4 shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
        <div className="text-white font-bold tracking-widest uppercase">Loading Tester Data...</div>
      </div>
    );
  }

  const totalCreditsAssigned = testers.reduce((sum, tester) => sum + tester.currentCredits, 0);
  const totalCreditsUsed = testers.reduce((sum, tester) => sum + tester.totalUsed, 0);

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
            className="absolute -bottom-[20%] -left-[10%] w-[70vw] h-[70vh] bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.10),transparent_45%)]" 
          />
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-[30%] left-[10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />

        {/* Mouse Follow Ambient Glow */}
        <motion.div 
          style={{ x: glowX, y: glowY, background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(59,130,246,0.1) 100%)' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[100px] opacity-10 pointer-events-none"
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
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-blue-400" /> Back to Dashboard
            </button>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-48 bg-blue-500/10 blur-[100px] pointer-events-none -z-10" />
            
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight flex items-center gap-4">
                <Users className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" /> Tester Credits Management
              </h1>
              <p className="text-slate-400 font-medium text-lg max-w-xl">
                Manage testing credits and sandbox allocations for all QA testers.
              </p>
            </div>

            {/* Live Status Bar */}
            <div className="flex flex-wrap items-center gap-4 px-6 py-3 rounded-full bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.35)] text-[10px] sm:text-xs font-bold tracking-widest text-slate-400 uppercase">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> Tester Wallet Online</span>
              <span className="hidden sm:flex items-center gap-2"><Zap className="w-3 h-3 text-yellow-400" /> Credit Allocation Active</span>
              <span className="hidden lg:flex items-center gap-2"><Database className="w-3 h-3 text-blue-400" /> Database Connected</span>
              <span className="hidden xl:flex items-center gap-2"><Cloud className="w-3 h-3 text-indigo-400" /> Sandbox Healthy</span>
            </div>
          </motion.div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {[
            { icon: Users, label: "Total Testers", value: testers.length, color: "blue", change: "+0 Today" },
            { icon: Zap, label: "Credits Assigned", value: totalCreditsAssigned, color: "indigo", change: "+0%" },
            { icon: TrendingUp, label: "Total Used", value: totalCreditsUsed, color: "emerald", change: "Today" },
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
                  <span className="text-4xl font-black text-white tracking-tight drop-shadow-md">
                    <AnimatedNumber value={stat.value} />
                  </span>
                  {stat.change && <span className={`text-${stat.color}-400 text-xs font-bold bg-${stat.color}-500/10 px-2 py-1 rounded-md border border-${stat.color}-500/20`}>{stat.change}</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: Your Testers Panel */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] flex flex-col h-[700px] overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[80px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />
              
              <div className="p-6 border-b border-white/[0.06] relative z-10 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" /> Your Testers
                  </h2>
                  <p className="text-xs font-medium text-slate-400 mt-1">Manage assigned QA accounts.</p>
                </div>
                <button
                  onClick={() => setShowAddTester(!showAddTester)}
                  className="group/add flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.4)] text-white transition-all hover:scale-110 hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] bg-no-repeat group-hover/add:animate-[shimmer_1.5s_infinite]" />
                  {showAddTester ? <ChevronLeft className="w-5 h-5 relative z-10" /> : <Plus className="w-5 h-5 relative z-10" />}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 relative z-10 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {showAddTester ? (
                    <motion.form 
                      key="add-form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onSubmit={handleAddTester} 
                      className="bg-white/[0.03] border border-white/[0.08] p-5 rounded-[20px] space-y-4 mb-4"
                    >
                      <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-2">Tester Email</label>
                        <input
                          type="email"
                          value={newTesterEmail}
                          onChange={(e) => setNewTesterEmail(e.target.value)}
                          placeholder="qa@veytrix.ai"
                          className="w-full px-4 py-3 rounded-[12px] text-white bg-black/40 border border-white/10 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all text-sm font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-2">Tester Name</label>
                        <input
                          type="text"
                          value={newTesterName}
                          onChange={(e) => setNewTesterName(e.target.value)}
                          placeholder="Alex QA"
                          className="w-full px-4 py-3 rounded-[12px] text-white bg-black/40 border border-white/10 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all text-sm font-medium"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-[12px] transition font-bold text-sm shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                      >
                        Create Sandbox Tester
                      </button>
                    </motion.form>
                  ) : testers.length === 0 ? (
                    <motion.div 
                      key="empty-list"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full text-center py-10"
                    >
                      <motion.div 
                        animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-[24px] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                      >
                        <Users className="w-10 h-10 text-indigo-400" />
                      </motion.div>
                      <p className="text-xl font-black text-white mb-2">No Testers Assigned</p>
                      <p className="text-sm font-medium text-slate-400 max-w-[200px]">Create your first sandbox tester to begin allocating credits.</p>
                    </motion.div>
                  ) : (
                    <motion.div key="tester-list" className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {testers.map((tester) => (
                        <div
                          key={tester.id}
                          onClick={() => handleSelectTester(tester)}
                          className={`w-full text-left p-4 rounded-[16px] transition-all duration-300 cursor-pointer group/item relative overflow-hidden ${
                            selectedTester?.id === tester.id
                              ? "bg-indigo-500/10 border border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)] scale-[1.02]"
                              : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-indigo-500/30 hover:-translate-y-1"
                          }`}
                        >
                          {selectedTester?.id === tester.id && (
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-transparent opacity-50 pointer-events-none" />
                          )}
                          <div className="relative z-10">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className={`font-bold text-sm ${selectedTester?.id === tester.id ? 'text-white' : 'text-slate-200 group-hover/item:text-white transition-colors'}`}>{tester.name || tester.email}</p>
                                <p className="text-slate-500 text-xs truncate max-w-[150px]">{tester.email}</p>
                              </div>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
                                  tester.status === "active"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-slate-800 text-slate-400 border-slate-700"
                                }`}
                              >
                                {tester.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                                <Zap className="w-3 h-3" /> {tester.currentCredits.toLocaleString()}
                              </span>
                              {selectedTester?.id !== tester.id && (
                                <button className="text-xs font-bold text-slate-400 group-hover/item:text-indigo-400 transition-colors">Select &rarr;</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* AI Recommendation Panel */}
            <div className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <Bot className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-1">AI Suggestion</h3>
                  <p className="text-slate-400 font-medium text-xs leading-relaxed">
                    Current usage indicates <span className="text-white font-bold">0 testers</span> are consuming less than 0% of allocated credits. Recommended: Reallocate unused credits to active testers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Credit Assignment & Activity */}
          <div className="lg:col-span-2 flex flex-col gap-6 relative">
            
            <AnimatePresence mode="wait">
              {selectedTester ? (
                <motion.div
                  key="assignment"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-blue-500/20 rounded-[24px] shadow-[0_12px_40px_rgba(59,130,246,0.15)] p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] pointer-events-none group-hover:bg-blue-500/20 transition-colors" />
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h3 className="text-3xl font-black text-white mb-1">{selectedTester.name || selectedTester.email}</h3>
                          <p className="text-slate-400 font-medium">{selectedTester.email}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Active</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-white/[0.03] border border-white/[0.06] p-5 rounded-[20px]">
                          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><CreditCard className="w-3 h-3 text-blue-400" /> Balance</p>
                          <p className="text-white text-3xl font-black"><AnimatedNumber value={selectedTester.currentCredits} /></p>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.06] p-5 rounded-[20px]">
                          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><RefreshCw className="w-3 h-3 text-indigo-400" /> Weekly Limit</p>
                          <p className="text-white text-3xl font-black"><AnimatedNumber value={selectedTester.weeklyAllocation} /></p>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.06] p-5 rounded-[20px]">
                          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><TrendingUp className="w-3 h-3 text-emerald-400" /> Total Used</p>
                          <p className="text-white text-3xl font-black"><AnimatedNumber value={selectedTester.totalUsed} /></p>
                        </div>
                      </div>

                      <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-[20px]">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-lg font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400" /> Assign Credits</h4>
                          <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full transition-colors text-xs font-bold uppercase tracking-widest border border-white/10"
                          >
                            {showForm ? "Cancel" : "Open Form"}
                          </button>
                        </div>

                        <AnimatePresence>
                          {showForm && (
                            <motion.form 
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              onSubmit={handleAssignCredits} className="space-y-5 overflow-hidden"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                  <label className="text-slate-400 font-bold text-xs uppercase tracking-widest block mb-2">Credit Amount</label>
                                  <input
                                    type="number"
                                    value={creditAmount}
                                    onChange={(e) => setCreditAmount(e.target.value)}
                                    placeholder="e.g. 5000"
                                    className="w-full px-5 py-4 rounded-[16px] text-white bg-black/40 border border-white/10 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all font-medium"
                                    min="1"
                                    max="10000"
                                  />
                                </div>
                                <div>
                                  <label className="text-slate-400 font-bold text-xs uppercase tracking-widest block mb-2">Reason</label>
                                  <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Sprint 26 testing"
                                    className="w-full px-5 py-4 rounded-[16px] text-white bg-black/40 border border-white/10 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all font-medium"
                                  />
                                </div>
                              </div>
                              <button
                                type="submit"
                                disabled={isAssigning}
                                className="w-full group/submit relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white px-6 py-4 rounded-[16px] transition-all font-black shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-[1.02] flex items-center justify-center gap-2 disabled:hover:scale-100"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/submit:animate-[shimmer_1.5s_infinite]" />
                                {isAssigning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 relative z-10" />}
                                <span className="relative z-10 uppercase tracking-widest">{isAssigning ? "Assigning..." : "Confirm Assignment"}</span>
                              </button>
                            </motion.form>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Analytics & Timeline Split */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Distribution Analytics */}
                    <div className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-400" /> Distribution</h3>
                      <div className="space-y-6">
                        {[
                          { label: "Today's Allocation", pct: 0, color: "blue" },
                          { label: "Weekly Usage", pct: 0, color: "indigo" },
                          { label: "Monthly Budget", pct: 0, color: "purple" }
                        ].map((bar, i) => (
                          <div key={i}>
                            <div className="flex justify-between mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                              <span>{bar.label}</span>
                              <span className="text-white">{bar.pct}%</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden relative">
                              <motion.div 
                                className={`absolute top-0 left-0 h-full bg-gradient-to-r from-${bar.color}-600 to-${bar.color}-400 rounded-full`}
                                initial={{ width: "0%" }}
                                animate={{ width: `${bar.pct}%` }}
                                transition={{ duration: 1.5, delay: i * 0.2 }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Tester Activity</h3>
                      {history.length === 0 ? (
                        <p className="text-slate-500 text-sm font-medium text-center py-6">No transaction history found.</p>
                      ) : (
                        <div className="space-y-5 relative">
                          <div className="absolute top-2 bottom-2 left-[15px] w-px bg-white/10" />
                          {history.map((tx, i) => (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                              key={tx.id} className="flex gap-4 items-start relative z-10"
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                                tx.type === "assigned" ? "bg-emerald-500/20 border-emerald-500/30" : 
                                tx.type === "used" ? "bg-rose-500/20 border-rose-500/30" : "bg-blue-500/20 border-blue-500/30"
                              }`}>
                                {tx.type === "assigned" ? <Plus className="w-3.5 h-3.5 text-emerald-400" /> : <Minus className="w-3.5 h-3.5 text-rose-400" />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{tx.reason}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs font-black tracking-widest ${tx.type === "assigned" ? "text-emerald-400" : "text-rose-400"}`}>
                                    {tx.type === "assigned" ? "+" : "-"}{tx.amount}
                                  </span>
                                  <span className="text-slate-600 text-xs">•</span>
                                  <span className="text-[10px] uppercase font-bold text-slate-500">{tx.timestamp}</span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] flex flex-col items-center justify-center h-[700px] text-center p-10 relative overflow-hidden"
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] pointer-events-none rounded-full" />
                  
                  <motion.div 
                    animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="w-32 h-32 bg-gradient-to-br from-[#0A0F1C] to-blue-900/50 border border-blue-500/30 rounded-[32px] flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(59,130,246,0.2)] relative"
                  >
                    <div className="absolute inset-0 bg-blue-500/20 rounded-[32px] blur-xl -z-10" />
                    <CreditCard className="w-16 h-16 text-blue-400" />
                  </motion.div>
                  <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Select a tester to manage credits</h3>
                  <p className="text-slate-400 text-lg font-medium max-w-md">
                    Choose a tester from the left panel to assign credits, view their usage history, and manage their sandbox allocation.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Plus, label: "Assign Credits", color: "text-emerald-400" },
                { icon: RefreshCw, label: "Reset Limit", color: "text-amber-400" },
                { icon: Zap, label: "Boost Tester", color: "text-blue-400" },
                { icon: BarChart3, label: "View Usage", color: "text-purple-400" },
              ].map((action, i) => (
                <button key={i} className="group relative overflow-hidden flex flex-col items-center justify-center p-5 rounded-[20px] bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-250 hover:-translate-y-1 hover:scale-[1.04] hover:border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <action.icon className={`w-7 h-7 ${action.color} mb-3`} />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest text-center">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Floating Credit Orb */}
            <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-[30px] pointer-events-none hidden xl:block" />
            <motion.div 
              className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-gradient-to-br from-[#0A0F1C] to-blue-900/50 border border-blue-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.3)] group cursor-pointer hidden xl:flex"
              animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.15, rotate: 180, transition: { duration: 0.5 } }}
            >
              <div className="absolute inset-0 rounded-full border-2 border-blue-400/20 border-t-blue-400 animate-spin" style={{ animationDuration: '4s' }} />
              <Zap className="w-12 h-12 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] group-hover:scale-110 transition-transform group-hover:text-cyan-300" />
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal missing component hack for timeline icon
function Minus(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
