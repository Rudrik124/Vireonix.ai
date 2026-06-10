import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { 
  AlertCircle, 
  Plus, 
  Filter, 
  ChevronDown,
  ArrowLeft,
  Bug,
  Activity,
  Globe2,
  Lock,
  Cloud,
  Zap,
  BarChart3,
  TestTube2,
  AlertTriangle
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  component: string;
  status: "open" | "in-review" | "fixed" | "verified";
  os: string;
  browser: string;
  device: string;
  attachment_count: number;
  created_at: string;
  updated_at: string;
}

const particles = Array.from({ length: 40 });

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

export function TesterBugReportsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "in-review" | "fixed" | "verified">("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "medium" as const,
    component: "video-generator",
    os: "windows",
    browser: "chrome",
    device: "desktop",
    attachments: [] as File[],
  });

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

  const severityColors = {
    critical: "bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]",
    low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
  };

  const statusColors = {
    open: "bg-red-500/10 text-red-400 border-red-500/30",
    "in-review": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    fixed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    verified: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  };

  const filteredBugs = bugReports.filter((bug) => {
    const statusMatch = filter === "all" || bug.status === filter;
    const severityMatch = severityFilter === "all" || bug.severity === severityFilter;
    return statusMatch && severityMatch;
  });

  useEffect(() => {
    if (!authLoading) {
      if (!profile) {
        navigate("/");
        return;
      }
      fetchBugReports();
    }
  }, [authLoading, profile, navigate]);

  const fetchBugReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bug_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bug reports:", error);
        return;
      }

      setBugReports(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from("bug_reports").insert({
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        component: formData.component,
        status: "open",
        os: formData.os,
        browser: formData.browser,
        device: formData.device,
        attachment_count: formData.attachments.length,
        submitted_by: profile?.id,
      });

      if (error) {
        console.error("Error submitting bug report:", error);
        return;
      }

      setFormData({
        title: "",
        description: "",
        severity: "medium",
        component: "video-generator",
        os: "windows",
        browser: "chrome",
        device: "desktop",
        attachments: [],
      });
      setShowForm(false);
      await fetchBugReports();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSubmitting(false);
    }
  }

  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050816] font-sans selection:bg-cyan-500/30 selection:text-white text-slate-200 pb-16">
      
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vh] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.12),transparent_50%)]" 
          />
          <motion.div 
            animate={{ rotate: -360, scale: [1, 1.2, 1] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] -right-[10%] w-[80vw] h-[80vh] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent_50%)]" 
          />
        </div>

        {/* Ambient Light Blobs */}
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-cyan-600/10 rounded-full blur-[100px] mix-blend-screen" />

        {/* Mouse Follow Ambient Glow */}
        <motion.div 
          style={{ x: glowX, y: glowY, background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, rgba(124,58,237,0.5) 100%)' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[80px] opacity-15 pointer-events-none"
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
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[15%] left-[5%] opacity-30">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><Bug className="w-3 h-3 text-cyan-400" /> Bug Tracker</div>
        </motion.div>
        <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[35%] right-[5%] opacity-30">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><Activity className="w-3 h-3 text-purple-400" /> AI Monitor</div>
        </motion.div>
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[20%] left-[8%] opacity-30">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><Lock className="w-3 h-3 text-emerald-400" /> Secure</div>
        </motion.div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        
        {/* Top Action Buttons */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex justify-between items-center">
          <button
            onClick={() => navigate("/tester/dashboard")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] border border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] text-sm font-bold text-slate-300 hover:text-white hover:-translate-y-1 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-cyan-400" /> Back
          </button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:opacity-90 text-white font-bold py-2.5 px-6 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.3)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <Plus className="w-4 h-4" /> Report Bug
          </motion.button>
        </motion.div>

        {/* Hero Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-black tracking-[0.2em] text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/30 px-4 py-1.5 rounded-full mb-6 shadow-[0_0_15px_rgba(217,70,239,0.1)]">
            <Bug className="w-4 h-4" /> 🐞 AI BUG TRACKING CENTER
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] tracking-tight">
            Bug Reports
          </h1>
          <p className="text-lg text-white/70 max-w-2xl font-medium mb-8">
            Monitor, report and resolve AI platform issues in real time.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-emerald-500/30 text-xs font-bold text-emerald-300 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Tracking Active
            </motion.div>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-purple-500/30 text-xs font-bold text-purple-300 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <Activity className="w-3 h-3" /> AI Monitoring
            </motion.div>
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-blue-500/30 text-xs font-bold text-blue-300 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <Globe2 className="w-3 h-3" /> Beta Build
            </motion.div>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-rose-500/30 text-xs font-bold text-rose-300 backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.1)]">
              <Lock className="w-3 h-3" /> Secure Reports
            </motion.div>
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-cyan-500/30 text-xs font-bold text-cyan-300 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <TestTube2 className="w-3 h-3" /> Sandbox Mode
            </motion.div>
          </div>
        </motion.div>

        {/* Bug Status Banner */}
        <div className="w-full flex items-center justify-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 text-xs font-mono font-bold tracking-widest text-slate-400 border border-white/5 bg-[rgba(18,22,40,0.65)] backdrop-blur-md px-6 py-2.5 rounded-full shadow-[0_0_30px_rgba(139,92,246,0.1)]"
          >
            <span className="hidden sm:inline opacity-50">━━━━━━━━━━━━</span>
            <span className="flex items-center gap-2 text-emerald-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> AI Bug Tracking Online</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="text-purple-400">Live Monitoring Enabled</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="text-blue-400">Auto Detection Running</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="text-cyan-400 flex items-center gap-1"><Cloud className="w-3 h-3" /> Cloud Sync Active</span>
            <span className="hidden sm:inline opacity-50">━━━━━━━━━━━━</span>
          </motion.div>
        </div>

        {/* Premium Analytics Cards */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {/* Critical */}
          <div className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 z-10 hover:-translate-y-2 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 opacity-20 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
            <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] p-6 border border-white/[0.08] group-hover:border-transparent transition-colors shadow-[0_0_40px_rgba(239,68,68,0.1)] group-hover:shadow-[0_0_40px_rgba(239,68,68,0.3)] flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Critical</p>
                <AlertTriangle className="w-6 h-6 text-red-500 group-hover:rotate-12 transition-transform" />
              </div>
              <p className="text-white text-5xl font-black drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                <AnimatedNumber value={bugReports.filter((b) => b.severity === "critical").length} />
              </p>
            </div>
          </div>
          {/* High */}
          <div className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 z-10 hover:-translate-y-2 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 opacity-20 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
            <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] p-6 border border-white/[0.08] group-hover:border-transparent transition-colors shadow-[0_0_40px_rgba(249,115,22,0.1)] group-hover:shadow-[0_0_40px_rgba(249,115,22,0.3)] flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">High</p>
                <AlertCircle className="w-6 h-6 text-orange-400 group-hover:rotate-12 transition-transform" />
              </div>
              <p className="text-white text-5xl font-black drop-shadow-[0_0_20px_rgba(249,115,22,0.5)]">
                <AnimatedNumber value={bugReports.filter((b) => b.severity === "high").length} />
              </p>
            </div>
          </div>
          {/* Open Bugs */}
          <div className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 z-10 hover:-translate-y-2 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-emerald-500 to-cyan-500 opacity-20 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
            <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] p-6 border border-white/[0.08] group-hover:border-transparent transition-colors shadow-[0_0_40px_rgba(234,179,8,0.1)] group-hover:shadow-[0_0_40px_rgba(234,179,8,0.3)] flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Open Bugs</p>
                <Bug className="w-6 h-6 text-yellow-400 group-hover:-rotate-12 transition-transform" />
              </div>
              <p className="text-white text-5xl font-black drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                <AnimatedNumber value={bugReports.filter((b) => b.status === "open").length} />
              </p>
            </div>
          </div>
          {/* Total Reported */}
          <div className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 z-10 hover:-translate-y-2 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-20 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
            <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] p-6 border border-white/[0.08] group-hover:border-transparent transition-colors shadow-[0_0_40px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Total Reported</p>
                <BarChart3 className="w-6 h-6 text-blue-400 group-hover:rotate-12 transition-transform" />
              </div>
              <p className="text-white text-5xl font-black drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                <AnimatedNumber value={bugReports.length} />
              </p>
            </div>
          </div>
        </motion.div>

        {/* Submit Form Modal */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 relative rounded-[24px] p-[1px] overflow-hidden z-20">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-cyan-500/50 opacity-30" />
            <div className="relative bg-[rgba(18,22,40,0.8)] backdrop-blur-[30px] rounded-[23px] p-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3"><AlertCircle className="w-6 h-6 text-cyan-400" /> Submit Bug Report</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bug Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Video generator crashes on Safari"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-white bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all outline-none placeholder-white/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Severity</label>
                    <div className="relative">
                      <select
                        value={formData.severity}
                        onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                        className="w-full px-4 py-3 rounded-xl text-white bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all outline-none appearance-none"
                      >
                        <option value="low" className="bg-[#0B1020]">Low Severity</option>
                        <option value="medium" className="bg-[#0B1020]">Medium Severity</option>
                        <option value="high" className="bg-[#0B1020]">High Severity</option>
                        <option value="critical" className="bg-[#0B1020]">Critical Severity</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Detailed Description</label>
                  <textarea
                    placeholder="Describe the bug in detail..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all outline-none placeholder-white/30 h-32 resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Component</label>
                    <div className="relative">
                      <select
                        value={formData.component}
                        onChange={(e) => setFormData({ ...formData, component: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg text-white bg-white/5 border border-white/10 text-sm appearance-none outline-none focus:border-purple-500/50"
                      >
                        <option value="video-generator" className="bg-[#0B1020]">Video Generator</option>
                        <option value="auth" className="bg-[#0B1020]">Authentication</option>
                        <option value="billing" className="bg-[#0B1020]">Billing</option>
                        <option value="ui" className="bg-[#0B1020]">UI</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/50 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">OS</label>
                    <div className="relative">
                      <select
                        value={formData.os}
                        onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg text-white bg-white/5 border border-white/10 text-sm appearance-none outline-none focus:border-purple-500/50"
                      >
                        <option value="windows" className="bg-[#0B1020]">Windows</option>
                        <option value="macos" className="bg-[#0B1020]">macOS</option>
                        <option value="linux" className="bg-[#0B1020]">Linux</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/50 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Browser</label>
                    <div className="relative">
                      <select
                        value={formData.browser}
                        onChange={(e) => setFormData({ ...formData, browser: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg text-white bg-white/5 border border-white/10 text-sm appearance-none outline-none focus:border-purple-500/50"
                      >
                        <option value="chrome" className="bg-[#0B1020]">Chrome</option>
                        <option value="firefox" className="bg-[#0B1020]">Firefox</option>
                        <option value="safari" className="bg-[#0B1020]">Safari</option>
                        <option value="edge" className="bg-[#0B1020]">Edge</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/50 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Device</label>
                    <div className="relative">
                      <select
                        value={formData.device}
                        onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg text-white bg-white/5 border border-white/10 text-sm appearance-none outline-none focus:border-purple-500/50"
                      >
                        <option value="desktop" className="bg-[#0B1020]">Desktop</option>
                        <option value="tablet" className="bg-[#0B1020]">Tablet</option>
                        <option value="mobile" className="bg-[#0B1020]">Mobile</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/50 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-white font-bold px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex justify-center items-center gap-2"
                  >
                    {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Submit Report"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-6 py-3 rounded-xl transition-all"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Filters Panel */}
        <div className="mb-8 flex flex-wrap gap-4 items-center bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] p-4 rounded-[20px] border border-white/10 shadow-[0_0_30px_rgba(139,92,246,0.1)] glow-button">
          <div className="flex items-center gap-2 px-2">
            <Filter className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-bold tracking-widest text-sm uppercase">Filters</span>
          </div>
          
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="pl-4 pr-10 py-2.5 rounded-xl text-white font-semibold bg-white/5 border border-white/10 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all outline-none appearance-none cursor-pointer"
            >
              <option value="all" className="bg-[#0B1020]">All Status</option>
              <option value="open" className="bg-[#0B1020]">Open</option>
              <option value="in-review" className="bg-[#0B1020]">In Review</option>
              <option value="fixed" className="bg-[#0B1020]">Fixed</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="pl-4 pr-10 py-2.5 rounded-xl text-white font-semibold bg-white/5 border border-white/10 hover:border-purple-500/50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all outline-none appearance-none cursor-pointer"
            >
              <option value="all" className="bg-[#0B1020]">All Severity</option>
              <option value="critical" className="bg-[#0B1020]">Critical</option>
              <option value="high" className="bg-[#0B1020]">High</option>
              <option value="medium" className="bg-[#0B1020]">Medium</option>
              <option value="low" className="bg-[#0B1020]">Low</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
          </div>
        </div>

        {/* Bug Reports List */}
        <div className="space-y-4">
          {filteredBugs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="relative p-[1px] rounded-[24px] overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/5 backdrop-blur-[24px] rounded-[23px] border border-white/10 flex flex-col items-center justify-center py-20" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                  <Bug className="w-16 h-16 text-slate-500/50 mb-4" />
                </motion.div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">No bug reports found.</h3>
                <p className="text-slate-400 font-medium text-center">Your selected filters returned no results.</p>
              </div>
            </motion.div>
          ) : (
            <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-4">
              {filteredBugs.map((bug) => (
                <motion.div
                  key={bug.id}
                  variants={itemVariants}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] p-6 rounded-[20px] border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] group"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="text-slate-500 font-mono text-xs bg-black/30 px-2 py-1 rounded">ID: {bug.id.split('-')[0]}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${severityColors[bug.severity]}`}>
                          {bug.severity.charAt(0).toUpperCase() + bug.severity.slice(1)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${statusColors[bug.status]}`}>
                          {bug.status === "in-review" ? "In Review" : bug.status.charAt(0).toUpperCase() + bug.status.slice(1)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">{bug.title}</h3>
                    </div>
                    <ChevronDown className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
                  </div>

                  <p className="text-slate-400 mb-6 line-clamp-2 leading-relaxed text-sm">{bug.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-black/20 border border-white/5 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">Component</span> 
                      {bug.component}
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">OS</span> 
                      {bug.os}
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">Browser</span> 
                      {bug.browser}
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">Device</span> 
                      {bug.device}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>Attachments: {bug.attachment_count}</span>
                    <span>Updated: {new Date(bug.updated_at).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Minimal Footer */}
        <footer className="mt-16 text-center pb-8">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 space-y-2">
            <p className="text-slate-500">VEYTRIX.AI AI BUG TRACKING CENTER</p>
            <p>Built by <span className="text-purple-400/70">Manjith Singh</span> • Founder & Lead Developer</p>
            <p className="font-mono text-cyan-600/50">Sandbox Build v2.1</p>
          </div>
        </footer>

      </div>
    </div>
  );
}
