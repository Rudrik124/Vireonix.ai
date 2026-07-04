import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  Circle, 
  AlertCircle, 
  Plus,
  ArrowLeft,
  TestTube2,
  Activity,
  Globe2,
  Lock,
  Cloud,
  ChevronDown,
  ListTodo,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  SkipForward,
  Filter,
  Zap,
  Bug,
  BarChart3,
  Paperclip
} from "lucide-react";

interface TestCase {
  id: string;
  name: string;
  featureArea: string;
  description: string;
  steps: string[];
  expectedResult: string;
  status: "pass" | "fail" | "blocked" | "skipped";
  evidence?: string;
  notes?: string;
  assignedSprint: string;
}

const particles = Array.from({ length: 40 });

// Animated Number Counter Component
function AnimatedNumber({ value, isPercent = false }: { value: number, isPercent?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(Math.round(v))
    });
    return controls.stop;
  }, [value]);

  return <span>{displayValue}{isPercent && "%"}</span>;
}

export function TesterTestCasesPage() {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterFeature, setFilterFeature] = useState<string>("all");

  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      id: "TC-001",
      name: "Generate video with basic prompt",
      featureArea: "Video Generator",
      description: "Test basic video generation with a simple text prompt",
      steps: [
        "Navigate to Video Generator",
        "Enter prompt: 'A cat playing with a ball'",
        "Click Generate",
        "Wait for completion",
      ],
      expectedResult: "Video generated successfully within 60 seconds",
      status: "pass",
      evidence: "Screenshot: generation-result-01.png",
      notes: "Generation completed in 45 seconds",
      assignedSprint: "Sprint 25",
    },
    {
      id: "TC-002",
      name: "Test authentication with invalid credentials",
      featureArea: "Authentication",
      description: "Verify system rejects invalid login attempts",
      steps: [
        "Open login page",
        "Enter invalid email and password",
        "Click Sign In",
        "Observe error message",
      ],
      expectedResult: "Error message displayed: 'Invalid credentials'",
      status: "pass",
      evidence: "Screenshot: auth-error-message.png",
      notes: "Error appears after 1 second",
      assignedSprint: "Sprint 25",
    },
    {
      id: "TC-003",
      name: "Generate video with advanced parameters",
      featureArea: "Video Generator",
      description: "Test video generation with custom style, duration, and resolution",
      steps: [
        "Navigate to Video Generator",
        "Enter prompt with advanced options",
        "Set style to 'Cinematic'",
        "Set duration to 30 seconds",
        "Set resolution to 4K",
        "Click Generate",
      ],
      expectedResult: "Video generated with correct parameters",
      status: "blocked",
      notes: "Waiting for 4K feature release",
      assignedSprint: "Sprint 25",
    },
    {
      id: "TC-004",
      name: "Payment processing with test card",
      featureArea: "Billing",
      description: "Verify payment processing works with test credit card",
      steps: [
        "Initiate purchase",
        "Enter test card details",
        "Complete payment",
        "Verify confirmation email",
      ],
      expectedResult: "Payment processed successfully",
      status: "skipped",
      notes: "Deferred until staging environment is ready",
      assignedSprint: "Sprint 25",
    },
  ]);

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

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[100dvh] bg-[#050816] text-cyan-400 font-bold">Loading...</div>;
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  const featureAreas = ["all", ...new Set(testCases.map((tc) => tc.featureArea))];
  const filteredCases = testCases.filter((tc) => filterFeature === "all" || tc.featureArea === filterFeature);

  const stats = {
    total: filteredCases.length,
    pass: filteredCases.filter((tc) => tc.status === "pass").length,
    fail: filteredCases.filter((tc) => tc.status === "fail").length,
    blocked: filteredCases.filter((tc) => tc.status === "blocked").length,
    skipped: filteredCases.filter((tc) => tc.status === "skipped").length,
  };

  const passPercentage = stats.total > 0 ? Math.round((stats.pass / (stats.total - stats.skipped)) * 100) : 0;

  const statusIcons = {
    pass: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    fail: <XCircle className="w-5 h-5 text-red-400" />,
    blocked: <AlertTriangle className="w-5 h-5 text-orange-400" />,
    skipped: <SkipForward className="w-5 h-5 text-slate-400" />,
  };

  const handleStatusChange = (id: string, newStatus: TestCase["status"]) => {
    setTestCases(
      testCases.map((tc) => (tc.id === id ? { ...tc, status: newStatus } : tc))
    );
  };

  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

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
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-cyan-600/10 rounded-full blur-[100px] mix-blend-screen" />

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
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[15%] left-[5%] opacity-30">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><TestTube2 className="w-3 h-3 text-cyan-400" /> QA Ready</div>
        </motion.div>
        <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[35%] right-[5%] opacity-30">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><Activity className="w-3 h-3 text-purple-400" /> AI Test</div>
        </motion.div>
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[20%] left-[8%] opacity-30">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><Lock className="w-3 h-3 text-emerald-400" /> Secure</div>
        </motion.div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        
        {/* Navigation / Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-10">
          <button
            onClick={() => navigate("/tester/dashboard")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] border border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] text-sm font-bold text-slate-300 hover:text-white hover:-translate-y-1 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-cyan-400" /> Back
          </button>
        </motion.div>

        {/* Hero Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-black tracking-[0.2em] text-blue-400 bg-blue-500/10 border border-blue-500/30 px-4 py-1.5 rounded-full mb-6 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <TestTube2 className="w-4 h-4" /> 🧪 AI QUALITY ASSURANCE
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] tracking-tight">
            TEST CASES
          </h1>
          <p className="text-lg text-white/72 max-w-2xl font-medium mb-8">
            Execute, monitor and validate AI workflows with real-time testing intelligence.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-emerald-500/30 text-xs font-bold text-emerald-300 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Test Engine Active
            </motion.div>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-purple-500/30 text-xs font-bold text-purple-300 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <Zap className="w-3 h-3" /> AI Sandbox
            </motion.div>
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-blue-500/30 text-xs font-bold text-blue-300 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <Globe2 className="w-3 h-3" /> Beta Build
            </motion.div>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-rose-500/30 text-xs font-bold text-rose-300 backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.1)]">
              <Lock className="w-3 h-3" /> Secure Validation
            </motion.div>
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-cyan-500/30 text-xs font-bold text-cyan-300 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <Cloud className="w-3 h-3" /> Cloud Connected
            </motion.div>
          </div>
        </motion.div>

        {/* Top Status Banner */}
        <div className="w-full flex items-center justify-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 text-xs font-mono font-bold tracking-widest text-slate-400 border border-white/5 bg-[rgba(18,22,40,0.65)] backdrop-blur-md px-6 py-2.5 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.1)]"
          >
            <span className="hidden sm:inline opacity-50">━━━━━━━━━━━━</span>
            <span className="flex items-center gap-2 text-emerald-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Test Engine Online</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="text-purple-400">Latency 15ms</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="text-blue-400">Validation Running</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="text-cyan-400 flex items-center gap-1">AI Models Synced</span>
            <span className="hidden sm:inline opacity-50">━━━━━━━━━━━━</span>
          </motion.div>
        </div>

        {/* Progress Overview Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mb-8 relative p-[1px] rounded-[24px] overflow-hidden bg-white/5"
        >
          {/* Animated Continuous Border */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-20 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
          
          <div className="relative bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] p-8 border border-white/[0.08] shadow-[0_0_40px_rgba(139,92,246,0.12)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Activity className="w-6 h-6 text-cyan-400" /> Progress Overview
              </h2>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <AnimatedNumber value={passPercentage} isPercent />
              </div>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-black/40 rounded-full h-4 mb-8 overflow-hidden relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${passPercentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              </motion.div>
            </div>

            {/* Premium Mini Cards for Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Total */}
              <div className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-blue-300/70 text-xs font-bold uppercase tracking-widest">Total</p>
                  <ListTodo className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-white text-3xl font-black"><AnimatedNumber value={stats.total} /></p>
              </div>
              {/* Passed */}
              <div className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-emerald-300/70 text-xs font-bold uppercase tracking-widest">Passed</p>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-white text-3xl font-black"><AnimatedNumber value={stats.pass} /></p>
              </div>
              {/* Failed */}
              <div className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-red-500/30 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-red-300/70 text-xs font-bold uppercase tracking-widest">Failed</p>
                  <XCircle className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-white text-3xl font-black"><AnimatedNumber value={stats.fail} /></p>
              </div>
              {/* Blocked */}
              <div className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-orange-500/30 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-orange-300/70 text-xs font-bold uppercase tracking-widest">Blocked</p>
                  <AlertTriangle className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-white text-3xl font-black"><AnimatedNumber value={stats.blocked} /></p>
              </div>
              {/* Skipped */}
              <div className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-slate-400/30 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(148,163,184,0.2)]">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-slate-400/70 text-xs font-bold uppercase tracking-widest">Skipped</p>
                  <SkipForward className="w-5 h-5 text-slate-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-white text-3xl font-black"><AnimatedNumber value={stats.skipped} /></p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters Panel */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-8 flex flex-wrap gap-4 items-center bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] p-4 rounded-[18px] border border-white/10 shadow-[0_0_30px_rgba(139,92,246,0.1)] glow-button">
          <div className="flex items-center gap-2 px-2">
            <Filter className="w-5 h-5 text-purple-400" />
            <span className="text-white font-bold tracking-widest text-sm uppercase">Filter by Feature</span>
          </div>
          
          <div className="relative">
            <select
              value={filterFeature}
              onChange={(e) => setFilterFeature(e.target.value)}
              className="pl-4 pr-10 py-2.5 rounded-xl text-white font-semibold bg-white/5 border border-white/10 hover:border-purple-500/50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all outline-none appearance-none cursor-pointer"
            >
              {featureAreas.map((area) => (
                <option key={area} value={area} className="bg-[#0B1020]">
                  {area === "all" ? "All Features" : area}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
          </div>
        </motion.div>

        {/* Test Cases List */}
        <div className="space-y-4">
          {filteredCases.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="relative p-[1px] rounded-[24px] overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/5 backdrop-blur-[24px] rounded-[23px] border border-white/10 flex flex-col items-center justify-center py-24" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                  <TestTube2 className="w-16 h-16 text-slate-500/50 mb-4" />
                </motion.div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">No Test Cases Available</h3>
                <p className="text-slate-400 font-medium text-center">Create or assign a new test case to begin AI validation.</p>
              </div>
            </motion.div>
          ) : (
            <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-4">
              {filteredCases.map((testCase) => (
                <motion.div
                  key={testCase.id}
                  variants={itemVariants}
                  className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.015] z-10"
                >
                  {/* Animated Border */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-0 group-hover:opacity-30 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
                  
                  <div className="relative bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] border border-white/[0.08] group-hover:border-cyan-500/30 group-hover:bg-[rgba(18,22,40,0.8)] group-hover:shadow-[0_0_40px_rgba(6,182,212,0.15)] transition-all overflow-hidden flex flex-col">
                    
                    {/* Main Row */}
                    <div 
                      onClick={() => setExpandedId(expandedId === testCase.id ? null : testCase.id)}
                      className="p-6 cursor-pointer flex items-center gap-6"
                    >
                      {/* Left: Glowing Vertical Status Indicator */}
                      <div className="flex flex-col items-center justify-center shrink-0 w-8">
                        <div className={`w-1.5 h-12 rounded-full mb-2 ${
                          testCase.status === 'pass' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]' :
                          testCase.status === 'fail' ? 'bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]' :
                          testCase.status === 'blocked' ? 'bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.8)]' :
                          'bg-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.8)]'
                        }`} />
                        <div className="group-hover:rotate-12 transition-transform">
                          {statusIcons[testCase.status]}
                        </div>
                      </div>

                      {/* Center Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className="text-slate-400 font-mono text-xs font-bold">{testCase.id}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-sm ${
                            testCase.status === 'pass' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            testCase.status === 'fail' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                            testCase.status === 'blocked' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                            'bg-slate-500/10 text-slate-400 border-slate-500/30'
                          }`}>
                            {testCase.status}
                          </span>
                          <span className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {testCase.featureArea}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors truncate">{testCase.name}</h3>
                        <p className="text-white/70 text-sm mt-1 truncate">{testCase.description}</p>
                      </div>

                      {/* Right Side */}
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <span className="bg-white/5 border border-white/10 text-slate-300 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                          {testCase.assignedSprint}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${expandedId === testCase.id ? 'rotate-180 text-cyan-400' : 'group-hover:text-cyan-400'}`} />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedId === testCase.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-black/30 border-t border-white/10 px-6 py-6 md:px-14 space-y-8"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Steps */}
                            <div>
                              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><ListTodo className="w-4 h-4" /> Test Steps</h4>
                              <ol className="space-y-3">
                                {testCase.steps.map((step, idx) => (
                                  <li key={idx} className="flex gap-3 text-sm">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-slate-400 text-xs font-bold shrink-0">{idx + 1}</span>
                                    <span className="text-slate-300 leading-relaxed">{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>

                            <div className="space-y-6">
                              {/* Expected Result */}
                              <div>
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Expected Result</h4>
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm">
                                  {testCase.expectedResult}
                                </div>
                              </div>

                              {/* Evidence & Notes */}
                              {(testCase.evidence || testCase.notes) && (
                                <div className="space-y-4">
                                  {testCase.evidence && (
                                    <div>
                                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Paperclip className="w-4 h-4" /> Evidence</h4>
                                      <p className="text-cyan-300 text-sm hover:underline cursor-pointer">{testCase.evidence}</p>
                                    </div>
                                  )}
                                  {testCase.notes && (
                                    <div>
                                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Notes</h4>
                                      <p className="text-slate-400 text-sm italic border-l-2 border-slate-600 pl-3">{testCase.notes}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="w-full h-px bg-white/10" />

                          {/* Action Row */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Update Status</h4>
                              <div className="flex gap-2 flex-wrap">
                                {(["pass", "fail", "blocked", "skipped"] as const).map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => handleStatusChange(testCase.id, status)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                                      testCase.status === status
                                        ? status === 'pass' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' :
                                          status === 'fail' ? 'bg-red-500/20 text-red-400 border-red-500' :
                                          status === 'blocked' ? 'bg-orange-500/20 text-orange-400 border-orange-500' :
                                          'bg-slate-500/20 text-slate-300 border-slate-500'
                                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                                    }`}
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-bold px-5 py-2 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all hover:scale-105">
                              <Plus className="w-4 h-4" /> Attach Evidence
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
            <p className="text-slate-500">VEYTRIX.AI TESTER PORTAL</p>
          </div>
        </footer>

      </div>
    </div>
  );
}
