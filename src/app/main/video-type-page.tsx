import { useNavigate } from "react-router";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Rocket, 
  MonitorPlay, 
  Zap, 
  FileVideo, 
  Gauge,
  Play,
  ArrowRight,
  LogOut,
  User,
  ChevronDown,
  Menu
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Button } from "../components/ui/button";
import { LoginModal } from "../components/login-modal";
import { useAuth } from "../context/auth-context";
import { SuccessToast } from "../components/success-toast";
import { BrandLogo } from "../components/brand-logo";

const particles = Array.from({ length: 60 }); 

export function VideoTypePage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const { isLoggedIn, logout, session } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";

  useEffect(() => {
    setMounted(true);
    // Check if user just logged in
    const loginFlag = localStorage.getItem("justLoggedIn");
    if (loginFlag && isLoggedIn) {
      setShowLoginSuccess(true);
      localStorage.removeItem("justLoggedIn");
    }
  }, [isLoggedIn]);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    setIsLoginOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-white pb-20">
      
      {/* Background with animated gradient */}
      <motion.div 
        className="fixed inset-0 z-0"
        animate={{
          background: [
            'linear-gradient(135deg, #0b0d1f 0%, #1a1b2e 30%, #2d3142 60%, #3f4a67 85%, #1a1b2e 100%)',
            'linear-gradient(135deg, #1a1b2e 0%, #2d3142 30%, #3f4a67 60%, #0b0d1f 85%, #2d3142 100%)',
            'linear-gradient(135deg, #0b0d1f 0%, #1a1b2e 30%, #2d3142 60%, #3f4a67 85%, #1a1b2e 100%)',
          ]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ backgroundAttachment: 'fixed' }}
      />
      
      {/* Corner Vignettes */}
      <div 
        className="fixed inset-0 pointer-events-none z-10"
        style={{ boxShadow: 'inset 0 0 500px rgba(11,13,31,0.95)' }}
      />

      {/* Radial Cyan Glow behind title */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Subtle Animated Light Rays */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen opacity-20">
        <motion.div
           animate={{ opacity: [0.1, 0.25, 0.1], scale: [1, 1.1, 1] }}
           transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-[-20%] left-[-10%] w-[80vw] h-[30vh] bg-gradient-to-r from-transparent via-cyan-500 to-transparent blur-[90px] rotate-[35deg] transform origin-top-left"
        />
        <motion.div
           animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.15, 1] }}
           transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
           className="absolute bottom-[-20%] right-[-10%] w-[100vw] h-[25vh] bg-gradient-to-r from-transparent via-teal-500 to-transparent blur-[100px] rotate-[-25deg] transform origin-bottom-right"
        />
      </div>

      {/* Organic Breathing Glow Pulses */}
      <motion.div 
        animate={{ opacity: [0.05, 0.12, 0.05], scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-[15%] left-[20%] w-[50%] h-[50%] bg-cyan-600/20 rounded-full blur-[250px] pointer-events-none z-0 mix-blend-screen" 
      />
      <motion.div 
        animate={{ opacity: [0.05, 0.1, 0.05], scale: [1, 1.08, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="fixed bottom-[10%] right-[15%] w-[60%] h-[60%] bg-teal-600/20 rounded-full blur-[250px] pointer-events-none z-0 mix-blend-screen" 
      />

      {/* Floating Cyan Particles - Parallax Effect */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 perspective-[1000px]">
          {particles.map((_, i) => {
            const isFlare = i % 8 === 0;
            const size = isFlare ? Math.random() * 40 + 20 : Math.random() * 2 + 1; 
            const depth = Math.random() * 100 + 50; 
            
            return (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  width: isFlare ? size : size,
                  height: isFlare ? 2 : size, 
                  borderRadius: isFlare ? '100%' : '50%',
                  backgroundColor: isFlare ? 'rgba(34, 211, 238, 0.15)' : `rgba(165, 243, 252, ${Math.random() * 0.4 + 0.1})`,
                  filter: isFlare ? 'blur(3px)' : 'blur(0.5px)',
                  boxShadow: isFlare ? '0 0 20px rgba(34, 211, 238, 0.4)' : 'none',
                  rotate: isFlare ? Math.random() * 180 : 0
                }}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  opacity: 0,
                  z: depth
                }}
                animate={{
                  y: [null, Math.random() * -150 - 50],
                  x: [null, (Math.random() - 0.5) * 60],
                  opacity: isFlare ? [0, 0.5, 0] : [0, 0.8, 0],
                }}
                transition={{
                  duration: Math.random() * 35 + 20, 
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Header */}
      <div className="pt-8 px-6 lg:px-12 flex justify-between items-center max-w-7xl mx-auto relative z-20 w-full mb-16">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 group cursor-pointer"
          onClick={() => window.location.reload()}
        >
          <div className="relative">
            {/* Theme Background Glow */}
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <BrandLogo size={56} className="relative z-10" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] group-hover:text-cyan-400/80 transition-colors">
            VIREONIX<span className="text-cyan-400">.AI</span>
          </span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <button 
            className="md:hidden p-2 text-white/70 hover:text-white"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 transition-all text-white group shadow-xl"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <User className="w-4 h-4 text-[#0b0d1f]" />
                  </div>
                  <span className="text-sm font-bold tracking-tight">{userName}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="text-sm font-semibold text-cyan-50 transition-all bg-white/5 hover:bg-white/10 px-7 py-3 rounded-full border border-cyan-500/20 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_40px_rgba(34,211,238,0.3)] group"
              >
                <span className="group-hover:text-cyan-300 transition-colors">Login</span>
              </button>
            )}
          </div>

          <AnimatePresence>
            {isUserMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-6 top-[calc(100%+0.5rem)] md:right-0 md:top-full md:mt-2 w-48 bg-[#0b0d1f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
              >
                <div className="p-2">
                  {!isLoggedIn && (
                    <button 
                      onClick={() => {
                        setIsLoginOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all text-sm font-bold tracking-widest group"
                    >
                      <span>Login</span>
                    </button>
                  )}
                  {isLoggedIn && (
                    <button 
                      onClick={() => {
                        void handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-bold uppercase tracking-widest group"
                    >
                      <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      <span>Logout</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        
        {/* HERO SECTION */}
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="text-center max-w-5xl mx-auto pt-12 pb-24"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 bg-[#1a1b2e]/60 backdrop-blur-3xl px-6 py-2.5 rounded-full border border-cyan-500/20 mb-8 shadow-[0_4px_30px_rgba(0,0,0,0.2)] hover:bg-[#2d3142]/60 transition-colors cursor-default"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-cyan-100 tracking-wide uppercase font-sans tracking-[0.2em]">Next-Gen Creation</span>
          </motion.div>

          <h1 className="text-[clamp(3.5rem,10vw,7.5rem)] font-black tracking-tighter mb-8 leading-[1.1] selection:bg-cyan-500/30 relative text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-teal-300 drop-shadow-[0_2px_10px_rgba(34,211,238,0.2)]">
            AI Video Editor
          </h1>

          <p className="text-xl md:text-2xl text-[#94a3b8] font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
            Create stunning videos using AI in seconds.
          </p>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 80px rgba(34, 211, 238, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/features")}
            className="relative px-14 py-5 rounded-full bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-400 text-[#0b0d1f] text-xl font-black shadow-2xl shadow-cyan-500/30 transition-all overflow-hidden group border border-cyan-300/40"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
            <span className="relative z-10 flex items-center gap-3 drop-shadow-sm uppercase">
              Start Creating <Rocket className="w-5 h-5 text-[#0b0d1f]" />
            </span>
          </motion.button>
        </motion.div>

        {/* VIDEO PREVIEW TEXT ONLY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <p className="text-gray-400 font-medium italic text-lg lg:text-xl opacity-60">
            “Watch AI turn prompts into videos”
          </p>
        </motion.div>

        {/* TRUST BAR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-wrap justify-center items-center gap-8 md:gap-16 py-8 px-12 rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl max-w-4xl mx-auto mb-32"
        >
          {[
            { icon: MonitorPlay, text: "4K Export" },
            { icon: Zap, text: "60+ Effects" },
            { icon: FileVideo, text: "No Watermark" },
            { icon: Gauge, text: "Lightning Fast" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 group cursor-default">
              <item.icon className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-bold text-gray-400 group-hover:text-cyan-100 transition-colors">{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>

      {/* Success Toast */}
      {showLoginSuccess && (
        <SuccessToast
          message="Login successful! Welcome back!"
          onDismiss={() => setShowLoginSuccess(false)}
        />
      )}

      {/* Login Modal */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
