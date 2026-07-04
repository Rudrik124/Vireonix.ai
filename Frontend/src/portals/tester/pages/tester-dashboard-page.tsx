import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
  LogOut, 
  Bell, 
  User, 
  TestTube2, 
  Bug, 
  ClipboardList, 
  CreditCard, 
  Video, 
  BookOpen, 
  BarChart3, 
  MessageSquare, 
  Sparkles,
  Cpu,
  Activity,
  Globe2,
  Lock,
  ChevronRight
} from "lucide-react";

const particles = Array.from({ length: 30 });

export function TesterDashboardPage() {
  const { profile, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Mouse Parallax
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
    return <div className="flex items-center justify-center min-h-[100dvh] bg-[#050816] text-cyan-400 font-bold">Loading Sandbox...</div>;
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  // Prevent browser back button from navigating away from tester dashboard
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      window.history.forward();
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Scroll Restoration
  useEffect(() => {
    const savedScrollPos = sessionStorage.getItem("testerDashboardScrollPos");
    if (savedScrollPos) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPos, 10));
      }, 0);
      sessionStorage.removeItem("testerDashboardScrollPos");
    }
  }, []);

  const handleNavigate = (path: string) => {
    sessionStorage.setItem("testerDashboardScrollPos", window.scrollY.toString());
    navigate(path);
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("testerDashboardScrollPos");
    await logout();
    navigate("/", { replace: true });
  };

  const cards = [
    { title: "Test Environment", desc: "Access testing features and tools", path: "/tester/test-environment", icon: TestTube2 },
    { title: "Bug Reports", desc: "Submit and track bug reports", path: "/tester/bug-reports", icon: Bug },
    { title: "Test Cases", desc: "View assigned test cases", path: "/tester/test-cases", icon: ClipboardList },
    { title: "Testing Credits", desc: "View your testing credit balance", path: "/tester/credits", icon: CreditCard },
    { title: "Analytics", desc: "Track your testing performance metrics", path: "/tester/analytics", icon: BarChart3 },
    { title: "Feedback", desc: "Share ideas and feature requests", path: "/tester/feedback", icon: MessageSquare },
  ];

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-[#050816] font-sans selection:bg-cyan-500/30 selection:text-white text-slate-200">
      
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-[url('/noise.svg')]" />
        
        {/* Radial Glows */}
        <div className="absolute top-0 left-0 w-[50vw] h-[50vh] bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.25),transparent_40%)]" />
        <div className="absolute bottom-0 right-0 w-[60vw] h-[60vh] bg-[radial-gradient(circle_at_80%_70%,rgba(6,182,212,0.18),transparent_40%)]" />
        
        {/* Mouse Follow Ambient Glow */}
        <motion.div 
          style={{ x: glowX, y: glowY, background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, rgba(124,58,237,0.5) 100%)' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[80px] opacity-15 pointer-events-none"
        />

        {/* Ambient Light Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px] mix-blend-screen" />

        {/* Floating Particles & Stars */}
        {particles.map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full blur-[1px] ${i % 2 === 0 ? 'bg-cyan-400/20' : 'bg-purple-400/20'}`}
            style={{
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              left: `${Math.random() * 100}vw`,
              top: `${Math.random() * 100}vh`,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.1, 0.4, 0.1],
            }}
            transition={{
              duration: Math.random() * 8 + 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        
        {/* Header Redesign */}
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-cyan-400 animate-pulse">◉</span>
              <h1 className="text-2xl font-black text-white tracking-widest drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]">VEYTRIX.AI</h1>
              <span className="px-3 py-0.5 rounded border border-white/10 text-xs font-bold bg-white/5 text-purple-300 tracking-wider">TESTER PORTAL</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">AI Sandbox Environment</span>
              <span className="text-xs text-slate-500 font-mono bg-slate-900/50 px-2 py-1 rounded">Build v2.1 Beta</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/tester/notifications")}
              className="flex items-center gap-2 bg-gradient-to-r from-[#8B5CF6]/20 to-[#3B82F6]/20 hover:from-[#8B5CF6]/40 hover:to-[#3B82F6]/40 border border-white/10 text-white px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all glow-button relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <Bell className="w-4 h-4 text-cyan-400" /> <span className="text-sm font-bold">Notifications</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/tester/profile")}
              className="flex items-center gap-2 bg-gradient-to-r from-[#8B5CF6]/20 to-[#3B82F6]/20 hover:from-[#8B5CF6]/40 hover:to-[#3B82F6]/40 border border-white/10 text-white px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all glow-button relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <User className="w-4 h-4 text-purple-400" /> <span className="text-sm font-bold">Profile</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-5 py-2.5 rounded-full transition-all relative overflow-hidden group"
            >
              <LogOut className="w-4 h-4" /> <span className="text-sm font-bold">Logout</span>
            </motion.button>
          </div>
        </header>

        {/* Live Status Banner */}
        <div className="w-full flex items-center justify-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 text-xs font-mono font-bold tracking-widest text-slate-400 border border-white/5 bg-white/5 backdrop-blur-md px-6 py-2 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.05)]"
          >
            <span className="hidden sm:inline">━━━━━━━━━━━━━</span>
            <span className="flex items-center gap-2 text-cyan-400"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> AI Sandbox Active</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-purple-400">Latency 18ms</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-blue-400">Queue Healthy</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-emerald-400">Render Engine Online</span>
            <span className="hidden sm:inline">━━━━━━━━━━━━━</span>
          </motion.div>
        </div>

        {/* Hero Section */}
        <div className="relative text-center mb-16 pt-8 pb-12">
          
          {/* Floating Status Pills */}
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-0 left-10 hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-cyan-500/30 text-xs font-bold text-cyan-300 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <div className="w-2 h-2 rounded-full bg-cyan-400" /> Sandbox Online
          </motion.div>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-10 right-16 hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-purple-500/30 text-xs font-bold text-purple-300 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Activity className="w-3 h-3" /> Render Engine
          </motion.div>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-4 left-20 hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-blue-500/30 text-xs font-bold text-blue-300 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Lock className="w-3 h-3" /> Secure Testing
          </motion.div>
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute bottom-10 right-20 hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-emerald-500/30 text-xs font-bold text-emerald-300 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Globe2 className="w-3 h-3" /> Beta Build
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2 text-xs font-black tracking-[0.2em] text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="w-4 h-4" /> ✨ TEST ENVIRONMENT ACTIVE
          </motion.div>
          <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Welcome back, Tester
          </h2>
          <p className="text-xl font-medium text-slate-400 max-w-2xl mx-auto flex flex-col items-center gap-2">
            <span className="flex items-center gap-2 text-emerald-400 animate-[pulse_3s_ease-in-out_infinite]"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> 🟢 AI Sandbox Running</span>
            <span>All testing systems operational.</span>
          </p>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 relative">
          {/* Animated Gradient Border Layer for all cards (behind) */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-[0.03] blur-3xl animate-[spin_20s_linear_infinite] rounded-[40px]" />

          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => handleNavigate(card.path)}
              className="group cursor-pointer relative p-[1px] rounded-[20px] overflow-hidden bg-white/5 transition-all duration-300"
            >
              {/* Custom Animated Border */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-cyan-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[20px]" style={{ padding: '1px' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-cyan-500 to-blue-500 opacity-30 blur-md" />
              </div>
              
              <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[19px] p-6 border border-white/[0.08] group-hover:border-transparent transition-colors shadow-[0_0_40px_rgba(139,92,246,0.05)] group-hover:shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col">
                <div className="mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center border border-white/10 group-hover:border-cyan-500/30 transition-colors shadow-lg">
                    <card.icon className="w-7 h-7 text-transparent bg-clip-text" style={{ stroke: 'url(#cyan-purple-grad)' }} />
                    <svg width="0" height="0">
                      <linearGradient id="cyan-purple-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop stopColor="#06B6D4" offset="0%" />
                        <stop stopColor="#7C3AED" offset="100%" />
                      </linearGradient>
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">{card.title}</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed flex-1">{card.desc}</p>
                
                <div className="mt-4 flex items-center text-xs font-bold text-purple-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                  Launch Module <ChevronRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testing Status Glass Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="relative rounded-[24px] p-[1px] overflow-hidden mb-16"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 opacity-50" />
          <div className="relative bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] p-8 border border-white/[0.08] shadow-[0_0_40px_rgba(139,92,246,0.12)]">
            <h2 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase mb-8 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" /> Internal System Status
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><User className="w-3 h-3" /> Tester</p>
                <p className="text-xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{profile.name || profile.email}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><Activity className="w-3 h-3" /> Testing Mode</p>
                <p className="text-xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  {profile.testingModeEnabled ? "🟢 Enabled" : "Disabled"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Credits</p>
                <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                  {profile?.credits?.developerCredits?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><Globe2 className="w-3 h-3" /> Environment</p>
                <p className="text-xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  Beta <span className="text-sm text-slate-500 font-mono ml-2">v2.1</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Minimal Footer */}
        <footer className="text-center pb-8">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 space-y-2">
            <p className="text-slate-500">VEYTRIX.AI TESTER PORTAL</p>
          </div>
        </footer>

      </div>
    </div>
  );
}
