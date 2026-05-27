import { useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileVideo, Zap, Image as ImageIcon, ArrowLeft, LogOut, User, ChevronDown, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/auth-context";
import { SuccessToast } from "../components/success-toast";
import { BrandLogo } from "../components/brand-logo";
import { buildPortalAwarePath, usePortalTestingContext } from "../../shared/portal/testing-context";

const features = [
  {
    id: "ai-generated",
    title: "AI Generated Video",
    description: "Create stunning videos from text prompts using AI",
    icon: Sparkles,
    gradient: "from-cyan-400 to-blue-500",
    glow: "rgba(34, 211, 238, 0.25)",
    badge: "",
    route: "/create",
  },
  {
    id: "reference-video",
    title: "Generate Using Reference",
    description: "Generate new videos using reference video, prompt, and media",
    icon: FileVideo,
    gradient: "from-cyan-400 to-blue-500",
    glow: "rgba(34, 211, 238, 0.25)",
    badge: "SPECIAL",
    route: "/reference-video/setup",
  },
  {
    id: "media-to-video",
    title: "Direct Pic to Video",
    description: "Convert images or clips into AI-generated videos with audio and duration control",
    icon: ImageIcon,
    gradient: "from-cyan-400 to-blue-500",
    glow: "rgba(34, 211, 238, 0.25)",
    badge: "",
    route: "/images-to-video/upload",
  },
  {
    id: "quick-edit",
    title: "Quick AI Edit",
    description: "Automatically edit videos with AI-powered enhancements",
    icon: Zap,
    gradient: "from-cyan-400 to-blue-500",
    glow: "rgba(34, 211, 238, 0.25)",
    badge: "",
    route: "/quick-edit/upload",
  },
];

const particles = Array.from({ length: 60 });

export function FeaturesSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, logout, session } = useAuth();
  const { isDeveloperTestMode, search } = usePortalTestingContext();
  const [mounted, setMounted] = useState(false);
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
    navigate("/", { replace: true });
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-white"
      style={{
        background: 'linear-gradient(135deg, #0b0d1f 0%, #1a1b2e 30%, #2d3142 60%, #3f4a67 85%, #1a1b2e 100%)',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Corner Vignettes */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ boxShadow: 'inset 0 0 500px rgba(11,13,31,0.95)' }}
      />

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

      {/* Header with Back Button and User Actions */}
      <div className="pt-8 px-6 lg:px-12 flex justify-between items-center max-w-7xl mx-auto relative z-10 w-full mb-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={() => window.location.reload()}
          >
            <div className="relative">
              {/* Theme Background Glow */}
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <BrandLogo size={40} className="relative z-10" />
            </div>
            <span className="text-xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              VIREONIX<span className="text-cyan-400">.AI</span>
            </span>
          </div>

          <div className="h-6 w-[1px] bg-white/10" />

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-cyan-100/60 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold">Back</span>
          </button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          {isLoggedIn ? (
            <>
              <button 
                className="md:hidden p-2 text-white/70 hover:text-white"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden md:flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-cyan-500/20 text-white group shadow-xl"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <User className="w-4 h-4 text-[#0b0d1f]" />
                  </div>
                  <span className="text-sm font-bold tracking-tight">{userName}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>
              </div>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-6 top-24 md:right-0 md:top-auto md:mt-3 w-48 bg-[#0b0d1f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
                  >
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          void handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-bold uppercase tracking-widest group"
                      >
                        <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
             <div className="w-8" /> 
          )}
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex items-start justify-center px-6 relative z-10 pt-6 pb-20">
        <div className="w-full max-w-6xl">
          {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-10"
            >
            <h1 className="text-[clamp(2.5rem,8vw,4rem)] font-black text-white mb-4 tracking-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] leading-tight uppercase">
              Select Your Workflow
            </h1>
            <p className="text-lg md:text-xl text-slate-400/80 font-medium tracking-tight">
              Choose how you want to create your video
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-10">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                    whileHover={{ y: -8, scale: 1.01, boxShadow: `0 20px 80px -15px ${feature.glow}` }}
                    onClick={() => navigate(buildPortalAwarePath(feature.route, search))}
                    className="group relative bg-gradient-to-br from-[#1e293b]/80 to-[#0f172a]/90 border border-[#3f4a67]/30 hover:border-cyan-500/50 backdrop-blur-3xl rounded-3xl p-8 cursor-pointer transition-all duration-300 overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_30px_100px_rgba(34,211,238,0.15)] ring-1 ring-white/5 active:scale-[0.98]"
                  >
                  {/* Internal Ambient Glow */}
                  <div className="absolute inset-0 bg-cyan-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  {/* Glowing background accent inside card */}
                  <div className={`absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-bl ${feature.gradient} opacity-0 group-hover:opacity-[0.05] rounded-full blur-[120px] transition-opacity duration-1000 pointer-events-none`} />

                  {feature.badge && (
                    <div className="absolute top-8 right-8 z-20">
                      <div className={`bg-gradient-to-r ${feature.gradient} text-[#0b0d1f] text-[9px] font-black px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.4)] border border-cyan-400/50 uppercase tracking-[0.2em] drop-shadow-xl animate-pulse-slow`}>
                        {feature.badge}
                      </div>
                    </div>
                  )}

                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-[0_15px_40px_rgba(34,211,238,0.25)] group-hover:scale-[1.08] group-hover:rotate-2 transition-transform duration-700 border border-white/30 relative overflow-hidden`}>
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_2s_infinite]" />
                    <Icon className="w-10 h-10 text-[#0b0d1f] relative z-10 drop-shadow-xl" />
                  </div>

                  <h3 className="text-xl md:text-2xl font-black text-white mb-2 tracking-tighter relative z-10 transition-colors duration-300 group-hover:text-cyan-50 leading-none">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 group-hover:text-slate-200 leading-relaxed text-base md:text-lg transition-colors duration-300 relative z-10 font-medium">
                    {feature.description}
                  </p>

                  {/* Action Link Hint */}
                  <div className="mt-6 flex items-center gap-2 text-cyan-400/40 group-hover:text-cyan-400 transition-colors duration-500">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Enter Studio</span>
                    <div className="h-[1px] w-6 bg-current opacity-0 group-hover:opacity-100 transition-all duration-700 w-0 group-hover:w-10" />
                  </div>

                  {/* Arrow Indicator Overlay */}
                  <div className="absolute bottom-8 right-8 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-8 group-hover:translate-x-0 transition-all duration-700 border border-white/10 backdrop-blur-3xl z-10 shadow-xl">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {isDeveloperTestMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-[1.75rem] border border-emerald-300/20 bg-emerald-300/5 p-5 text-left"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-200">Developer Test Mode</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                You launched this chooser from the internal portal. Opening any workflow here keeps the session in testing mode so usage can stay separate from normal users.
              </p>
              <button
                onClick={() => navigate("/internal")}
                className="mt-4 rounded-full bg-emerald-300 px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-slate-950"
              >
                Back to Internal Portal
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {showLoginSuccess && (
        <SuccessToast
          message="Login successful! Welcome back!"
          onDismiss={() => setShowLoginSuccess(false)}
        />
      )}

      {/* Shimmer & Pulse CSS */}
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
