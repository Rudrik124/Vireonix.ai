import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
  Sparkles, 
  Film, 
  Image as ImageIcon, 
  Scissors, 
  ArrowLeft, 
  CheckCircle2,
  Zap,
  Activity,
  Lock,
  Globe2,
  RefreshCw,
  Cpu,
  Cloud
} from "lucide-react";

const particles = Array.from({ length: 40 });

export function TesterTestEnvironmentPage() {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();

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
    return <div className="flex items-center justify-center min-h-screen bg-[#050816] text-cyan-400 font-bold">Loading Test Environment...</div>;
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  const cards = [
    { 
      title: "Test AI Generate Video", 
      desc: "Create videos from text prompts using AI with unlimited credits", 
      path: "/create?redirect=/tester/test-environment", 
      icon: Sparkles,
      action: "Open Generator",
      status: "AI Powered"
    },
    { 
      title: "Reference Video", 
      desc: "Create videos based on reference footage and styling", 
      path: "/reference-video/setup?redirect=/tester/test-environment", 
      icon: Film,
      action: "Start Reference Video",
      status: "Experimental"
    },
    { 
      title: "Direct Pic to Video", 
      desc: "Convert your images directly into animated videos", 
      path: "/images-to-video/upload?redirect=/tester/test-environment", 
      icon: ImageIcon,
      action: "Upload Images",
      status: "Sandbox"
    },
    { 
      title: "Manual Edit", 
      desc: "Manually edit and fine-tune your videos with precision controls", 
      path: "/quick-edit/upload?redirect=/tester/test-environment", 
      icon: Scissors,
      action: "Open Editor",
      status: "Ready"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050816] font-sans selection:bg-cyan-500/30 selection:text-white text-slate-200">
      
      {/* 1. Global Theme & Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        {/* Animated Mesh Gradient equivalent: Multiple overlapping animated blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vh] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15),transparent_50%)]" 
          />
          <motion.div 
            animate={{ rotate: -360, scale: [1, 1.2, 1] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] -right-[10%] w-[80vw] h-[80vh] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),transparent_50%)]" 
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
            className={`absolute rounded-full blur-[1px] ${i % 2 === 0 ? 'bg-cyan-400/20' : 'bg-purple-400/20'}`}
            style={{
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              left: `${Math.random() * 100}vw`,
              top: `${Math.random() * 100}vh`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 15 - 7.5, 0],
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Floating Decorative Elements */}
        <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[20%] left-[5%] opacity-40">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/50 uppercase tracking-widest"><TestTube2 className="w-3 h-3 text-cyan-400" /> AI Sandbox</div>
        </motion.div>
        <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[40%] right-[8%] opacity-40">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/50 uppercase tracking-widest"><Cpu className="w-3 h-3 text-purple-400" /> Neural Engine</div>
        </motion.div>
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[30%] left-[10%] opacity-40">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/50 uppercase tracking-widest"><Cloud className="w-3 h-3 text-blue-400" /> Cloud Ready</div>
        </motion.div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        
        {/* Navigation / Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-12">
          <button
            onClick={() => navigate("/tester/dashboard")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] border border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] text-sm font-bold text-slate-300 hover:text-white hover:-translate-y-1 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-cyan-400" /> Back to Dashboard
          </button>
        </motion.div>

        {/* Hero Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-8 relative">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-xs font-black tracking-[0.2em] text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/30 px-4 py-1.5 rounded-full mb-6">
              <Sparkles className="w-4 h-4" /> 🧪 AI TEST ENVIRONMENT
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] tracking-tight">
              Test Environment
            </h1>
            <p className="text-lg text-white/70 max-w-2xl font-medium mb-8">
              Test every AI workflow inside a secure sandbox environment.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-emerald-500/30 text-xs font-bold text-emerald-300 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Sandbox Online
              </motion.div>
              <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-cyan-500/30 text-xs font-bold text-cyan-300 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                <Zap className="w-3 h-3" /> Unlimited Credits
              </motion.div>
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-purple-500/30 text-xs font-bold text-purple-300 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <Activity className="w-3 h-3" /> Render Engine Ready
              </motion.div>
              <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-blue-500/30 text-xs font-bold text-blue-300 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <Globe2 className="w-3 h-3" /> Beta Build
              </motion.div>
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-rose-500/30 text-xs font-bold text-rose-300 backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                <Lock className="w-3 h-3" /> Secure Session
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Section Separator */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mb-12 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />

        {/* Cards Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 relative"
        >
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 z-10"
            >
              {/* Animated Continuous Gradient Border */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-20 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
              
              <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] p-8 border border-white/[0.08] group-hover:border-transparent transition-colors shadow-[0_0_40px_rgba(139,92,246,0.12)] group-hover:shadow-[0_0_40px_rgba(6,182,212,0.2)] flex flex-col group-hover:bg-[rgba(18,22,40,0.75)] overflow-hidden">
                
                {/* Shine Sweep Animation on Hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_ease-out] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center border border-white/10 group-hover:border-cyan-500/50 transition-all shadow-lg group-hover:rotate-6">
                    <card.icon className="w-10 h-10 text-transparent bg-clip-text" style={{ stroke: 'url(#card-icon-grad)' }} />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                    <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin-slow" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{card.status}</span>
                  </div>
                </div>

                <h2 className="text-2xl font-black text-white mb-3 group-hover:text-cyan-300 transition-colors drop-shadow-sm">{card.title}</h2>
                <p className="text-white/70 text-sm font-medium mb-8 leading-relaxed flex-1">{card.desc}</p>
                
                <button 
                  onClick={() => navigate(card.path)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:opacity-90 text-white font-bold py-3.5 px-6 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.3)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all"
                >
                  {card.action} <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testing Benefits Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="relative rounded-[24px] p-[1px] overflow-hidden"
        >
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-cyan-400 to-purple-500 shadow-[0_0_20px_rgba(6,182,212,0.8)] z-20" />
          <div className="relative bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] p-8 md:p-10 border border-white/[0.08] shadow-[0_0_40px_rgba(139,92,246,0.12)]">
            <h2 className="text-xl font-black text-white mb-6 tracking-tight flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-cyan-400" /> Testing Mode Benefits
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Unlimited credits for all features",
                "Full access to all video creation tools",
                "Real-time error reporting and feedback",
                "Priority support and testing environment"
              ].map((benefit, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + (idx * 0.1) }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="text-white/80 text-sm font-semibold">{benefit}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>

      <svg width="0" height="0" className="hidden">
        <linearGradient id="card-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#7C3AED" offset="0%" />
          <stop stopColor="#06B6D4" offset="100%" />
        </linearGradient>
      </svg>
    </div>
  );
}

// Temporary icon fallback to ensure build success if TestTube2 isn't available
const TestTube2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 7 6.82 21.18a2.83 2.83 0 0 1-3.99-.01v0a2.83 2.83 0 0 1 0-4L17 3"></path>
    <path d="m16 2 6 6"></path>
    <path d="M12 16H4"></path>
  </svg>
);
