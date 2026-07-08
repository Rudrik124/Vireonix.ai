import { useNavigate } from "react-router";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
  Sparkles, 
  Rocket, 
  MonitorPlay, 
  Zap, 
  CheckCircle2, 
  Cloud,
  Lock,
  ChevronRight,
  LogOut,
  User,
  Menu,
  Wand2,
  Music,
  ArrowRight,
  Camera,
  BrainCircuit,
  PlayCircle,
  Activity,
  Check,
  Video,
  Wallet
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { LoginModal } from "../components/login-modal";
import { useAuth } from "../context/auth-context";
import { SuccessToast } from "../components/success-toast";
import { BrandLogo } from "../components/brand-logo";
import { UserProfileSidebar } from "../components/user-profile-sidebar";

const particles = Array.from({ length: 30 }); 
const AI_MODES = ["Cinematic", "Anime", "Realistic", "Commercial", "Viral Reel"];

export function VideoTypePage() {
  const navigate = useNavigate();
  const { isLoggedIn, logout, session, profile } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeMode, setActiveMode] = useState("Cinematic");

  const [promptText, setPromptText] = useState("");
  const [promptPhase, setPromptPhase] = useState("typing");
  const [progressValue, setProgressValue] = useState(0);
  
  const userName = profile?.fullName || session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";
  const fullPrompt = "Generate a cinematic cyberpunk travel reel with neon lights, drone shots and smooth transitions...";

  // Mouse Parallax Tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 100 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);
  
  const bgX = useTransform(smoothMouseX, [-1, 1], [-30, 30]);
  const bgY = useTransform(smoothMouseY, [-1, 1], [-30, 30]);
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
    setMounted(true);
    const loginFlag = localStorage.getItem("justLoggedIn");
    if (loginFlag && isLoggedIn) {
      setShowLoginSuccess(true);
      localStorage.removeItem("justLoggedIn");
      setTimeout(() => {
        setShowLoginSuccess(false);
      }, 2000);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    const runSequence = () => {
      setPromptText("");
      setPromptPhase("typing");
      setProgressValue(0);
      
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        if (charIndex <= fullPrompt.length) {
          setPromptText(fullPrompt.slice(0, charIndex));
          charIndex++;
        } else {
          clearInterval(typeInterval);
          timeout = setTimeout(() => {
            setPromptPhase("loading");
            timeout = setTimeout(() => {
              setPromptPhase("progress");
              let currentProgress = 0;
              const progressInterval = setInterval(() => {
                currentProgress += Math.floor(Math.random() * 15) + 5;
                if (currentProgress >= 100) {
                  currentProgress = 100;
                  clearInterval(progressInterval);
                  setProgressValue(100);
                  setPromptPhase("success");
                  timeout = setTimeout(runSequence, 4000);
                } else {
                  setProgressValue(currentProgress);
                }
              }, 300);
            }, 2000);
          }, 1000);
        }
      }, 50);
      
      return () => clearInterval(typeInterval);
    };

    runSequence();
    return () => clearTimeout(timeout);
  }, [fullPrompt]);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    setIsLoginOpen(false);
  };

  const handleStartCreating = () => {
    if (isLoggedIn) {
      navigate('/features');
    } else {
      localStorage.setItem("authRedirectUrl", "/features");
      setIsLoginOpen(true);
    }
  };

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col relative bg-gradient-to-b from-[#130E24] to-[#0B0815] font-sans selection:bg-purple-500/30 selection:text-white">
      {/* Global CSS to strictly prevent scrolling and add custom animations */}
      <style>{`
        html, body { overflow: hidden !important; height: 100vh !important; margin: 0; padding: 0; }
        @keyframes wave {
          0%, 100% { transform: scaleY(0.2); }
          50% { transform: scaleY(1); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px rgba(34,197,94,0.6); }
          50% { opacity: 0.4; box-shadow: 0 0 0px rgba(34,197,94,0); }
        }
        .glow-hover:hover {
          transform: translateY(-4px) scale(1.02) !important;
          box-shadow: 0 8px 30px rgba(168, 85, 247, 0.4), 0 0 20px rgba(168, 85, 247, 0.3) !important;
        }
      `}</style>
      
      {/* 2. NAVBAR (Fixed Top, ~10% Height - LAYER 4) */}
      <header className="h-[10%] min-h-[60px] w-full px-6 flex items-center justify-between z-50 border-b border-white/5 bg-[#130E24]/50 backdrop-blur-md">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.location.reload()}>
          <BrandLogo size={32} className="group-hover:scale-105 transition-transform" />
          <span className="text-xl font-black tracking-tight text-white drop-shadow-md">
            VEYTRIX<span className="text-purple-400">.AI</span>
          </span>
        </div>
        


        <div className="flex items-center gap-4">
          <button className="md:hidden text-white/70 hover:text-white" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-3 relative">
                <button 
                  onClick={() => navigate("/wallet")} 
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-bold text-fuchsia-400 hover:text-fuchsia-300"
                >
                  <Wallet className="w-4 h-4" /> Wallet
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => setIsLoginOpen(true)} className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
                  Login
                </button>
                <button onClick={() => setIsLoginOpen(true)} className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold text-white transition-all hover:shadow-[0_0_15px_rgba(168, 85, 247,0.3)]">
                  Start Free
                </button>
              </>
            )}
          </div>
        </div>

      </header>

      <div className="flex-1 flex overflow-hidden w-full">
        {/* Permanent Sidebar (Desktop) */}
        {isLoggedIn && (
          <div className="hidden lg:block w-[260px] xl:w-[320px] h-full overflow-y-auto border-r border-white/5 bg-[#130E24]/50 backdrop-blur-md shrink-0 z-40">
            <UserProfileSidebar
              isOpen={true}
              onClose={() => {}}
              userName={userName}
              onLogout={() => void logout()}
              variant="permanent"
            />
          </div>
        )}

        <div className="flex-1 h-full overflow-y-auto relative flex flex-col">
          {/* 1. BACKGROUND ELEMENTS (LAYER 0) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] bg-[url('/noise.svg')]" />
        
        {/* Glowing Blobs with Parallax */}
        <motion.div 
          style={{ x: glowX, y: glowY }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[20%] w-[40vw] h-[40vh] bg-purple-600/10 rounded-full blur-[100px]"
        />
        <motion.div 
          style={{ x: useTransform(smoothMouseX, [-1, 1], [50, -50]), y: useTransform(smoothMouseY, [-1, 1], [50, -50]) }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] right-[20%] w-[50vw] h-[50vh] bg-purple-600/10 rounded-full blur-[120px]"
        />
        
        {/* Particles with Parallax */}
        <motion.div style={{ x: bgX, y: bgY }} className="absolute inset-0">
          {mounted && particles.map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-purple-400/20"
              style={{
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* 3. MAIN HERO CONTENT (Center, ~75% Height - LAYER 1 & 3) */}
      <main className="flex-1 flex flex-col items-center justify-start relative z-10 w-full max-w-7xl mx-auto px-6 overflow-y-auto overflow-x-hidden scrollbar-hide">
        
        {/* LAYER 2: Cinematic Glow Behind Heading */}
        <motion.div 
          style={{ x: glowX, y: glowY }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[50%] bg-gradient-to-r from-purple-500/30 to-fuchsia-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen"
        />

        {/* --- LAYER 3: FLOATING WIDGETS --- */}
        
        {/* Mini Window 1: Timeline UI */}
        <motion.div 
          animate={{ y: [0, -10, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="hidden lg:flex flex-col absolute top-[12%] left-[4%] w-48 bg-white/[0.03] backdrop-blur-[12px] border border-white/10 p-3 rounded-xl shadow-xl glow-hover z-30"
        >
          <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
            <span>00:14</span><span>00:48</span>
          </div>
          <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-purple-500 w-[35%] rounded-full" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-pink-400">
            <Music className="w-3 h-3" /> Beat Sync: Enabled
          </div>
        </motion.div>

        {/* Mini Window 2: Camera Motion */}
        <motion.div 
          animate={{ y: [0, 8, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="hidden lg:flex flex-col absolute bottom-[25%] left-[6%] w-48 bg-white/[0.03] backdrop-blur-[12px] border border-white/10 p-3 rounded-xl shadow-xl glow-hover z-30"
        >
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-400 mb-2">
            <Camera className="w-3 h-3" /> Dynamic Camera
          </div>
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent mb-2 relative">
            <div className="absolute right-[20%] -top-1 w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_10px_#A855F7]" />
          </div>
          <div className="text-[10px] text-gray-400 font-semibold tracking-wider text-center">
            Pan • Zoom • Tilt
          </div>
        </motion.div>

        {/* Mini Window 3: Video Preview */}
        <motion.div 
          animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="hidden xl:flex flex-col absolute top-[18%] right-[4%] w-56 bg-white/[0.03] backdrop-blur-[12px] border border-white/10 p-2 rounded-xl shadow-xl glow-hover z-30"
        >
          <div className="relative w-full h-28 bg-[#0B0815] rounded-lg mb-2 overflow-hidden flex items-center justify-center border border-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20" />
            <PlayCircle className="w-8 h-8 text-white/50" />
            <div className="absolute bottom-1 left-1 right-1 h-1 bg-black/60 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400 w-[67%]" />
            </div>
            <div className="absolute top-2 left-2 text-[8px] font-bold bg-black/60 px-1.5 py-0.5 rounded text-white backdrop-blur-md">
              PREVIEW
            </div>
          </div>
          <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 px-1">
            <span className="flex items-center gap-1"><MonitorPlay className="w-3 h-3 text-purple-400" /> 4K</span>
            <span>60fps</span>
            <span>Vol.</span>
          </div>
        </motion.div>

        {/* Mini Window 4: AI Processing */}
        <motion.div 
          animate={{ y: [0, 12, 0] }} transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="hidden lg:flex flex-col absolute bottom-[28%] right-[6%] w-48 bg-white/[0.03] backdrop-blur-[12px] border border-white/10 p-3 rounded-xl shadow-xl glow-hover z-30"
        >
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-fuchsia-400 mb-2">
            <BrainCircuit className="w-3 h-3" /> AI Engine Active
          </div>
          <div className="text-[10px] text-gray-300 font-semibold mb-1">
            Neural Networks: <span className="text-white">12 Active</span>
          </div>
          <div className="text-[9px] text-gray-500 flex items-center gap-1">
            <Activity className="w-3 h-3 animate-pulse text-purple-400" /> Processing Frames...
          </div>
        </motion.div>

        {/* Recent Activity Cards (Floating below prompt box) */}
        <div className="hidden md:flex absolute bottom-[12%] left-[25%] flex-col gap-2 z-20">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2 }} className="bg-white/[0.02] backdrop-blur-md border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2 glow-hover shadow-lg">
            <Check className="w-3 h-3 text-green-400" />
            <div>
              <div className="text-[10px] font-bold text-gray-200">Fashion Ad Generated</div>
              <div className="text-[8px] text-gray-500">2 seconds ago</div>
            </div>
          </motion.div>
        </div>
        <div className="hidden md:flex absolute bottom-[15%] right-[25%] flex-col gap-2 z-20">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 4 }} className="bg-white/[0.02] backdrop-blur-md border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2 glow-hover shadow-lg">
            <Check className="w-3 h-3 text-green-400" />
            <div>
              <div className="text-[10px] font-bold text-gray-200">Travel Reel Exported</div>
              <div className="text-[8px] text-gray-500">5 seconds ago</div>
            </div>
          </motion.div>
        </div>


        {/* LAYER 1: Core Content */}
        <div className="text-center w-full max-w-4xl mx-auto flex flex-col items-center z-40 my-auto py-8">
          
          {/* AI Modes Toggle */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {AI_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={`text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200 ${
                  activeMode === mode
                    ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168, 85, 247,0.5)] border border-purple-400'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-purple-300 hover:shadow-[0_0_10px_rgba(168, 85, 247,0.3)]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-bold tracking-widest uppercase mb-3 shadow-[0_0_15px_rgba(168, 85, 247,0.2)] glow-hover">
            <Sparkles className="w-3 h-3 animate-pulse" /> AI-Powered Video Creation
          </div>
          
          <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[1.05] tracking-tighter text-white mb-3 drop-shadow-2xl">
            From Prompt To <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-400 drop-shadow-[0_0_20px_rgba(168, 85, 247,0.3)]">Professional Video</span>
          </h1>
          
          <p className="text-xs md:text-base text-gray-400 font-medium mb-6 max-w-2xl drop-shadow-md">
            Generate cinematic AI videos, animate images, and edit content professionally.
          </p>

          {/* Interactive Prompt Box */}
          <div className="w-full max-w-2xl bg-[#130E24]/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 md:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] glow-hover transition-all mb-6 text-left relative overflow-hidden">
            
            {/* Live Indicator inside prompt box (Top Right) */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded border border-white/5">
              <div className="w-2 h-2 rounded-full bg-green-500 live-dot" />
              <span className="text-[8px] font-bold tracking-widest text-green-400 uppercase">Live</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${promptPhase === 'success' ? 'bg-green-400' : 'bg-purple-400'} animate-pulse`} />
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-purple-300/70">
                {promptPhase === 'typing' && "AI Vision Input"}
                {promptPhase === 'loading' && "Neural Processing..."}
                {promptPhase === 'progress' && "Generating Cinematic Video..."}
                {promptPhase === 'success' && "✔ Cinematic Render Complete"}
              </span>
            </div>
            
            <div className="h-12 md:h-14 flex flex-col justify-center">
              {promptPhase === 'typing' && (
                <p className="text-sm md:text-base font-mono text-purple-100 leading-snug">
                  {promptText}
                  <span className="inline-block w-2 h-4 ml-1 bg-purple-400 animate-pulse align-middle" />
                </p>
              )}
              {promptPhase === 'loading' && (
                <div className="flex items-center gap-3 text-purple-200">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                  </div>
                  <span className="font-semibold text-sm md:text-base">Analyzing Prompt & Style...</span>
                </div>
              )}
              {promptPhase === 'progress' && (
                <div className="w-full flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-purple-300">Rendering Assets...</span>
                      <span className="text-white">{progressValue}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressValue}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                  
                  {/* Audio Waveform Animation */}
                  <div className="flex items-end gap-[2px] h-6 w-8">
                    {[1,2,3,4,5].map(i => (
                      <div
                        key={i}
                        className="w-1 bg-purple-400 rounded-t-sm"
                        style={{
                          animation: `wave ${0.5 + Math.random() * 0.5}s ease-in-out ${i * 0.1}s infinite alternate`,
                          transformOrigin: 'bottom',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {promptPhase === 'success' && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="font-bold text-sm md:text-base">Cinematic Render Complete</span>
                </div>
              )}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-row gap-4 justify-center items-center mb-3">
            <Button 
              onClick={handleStartCreating} 
              className="h-10 md:h-12 px-6 md:px-8 rounded-full bg-gradient-to-r from-purple-600 to-purple-600 border-0 shadow-[0_0_20px_rgba(168, 85, 247,0.4)] hover:shadow-[0_0_30px_rgba(168, 85, 247,0.7)] hover:-translate-y-1 transition-all text-white font-bold text-sm group"
            >
              Start Creating <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              className="h-10 md:h-12 px-6 md:px-8 rounded-full bg-white/5 border border-white/20 hover:bg-white/10 hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168, 85, 247,0.3)] transition-all text-white font-bold text-sm glow-hover"
            >
              Watch Demo
            </Button>
          </div>

          {/* Trust Text */}
          <div className="text-[10px] md:text-xs font-semibold text-gray-500">
            Trusted by 500K+ creators, editors & agencies
          </div>
          
        </div>
      </main>

      {/* 4. BOTTOM AREA (Showcase & Feature Strip, ~15% Height) */}
      <div className="w-full flex flex-col justify-end z-40 relative">
        
        {/* Showcase Text */}
        <div className="flex justify-center items-center gap-2 md:gap-4 mb-3 md:mb-5 text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <span className="hover:text-white transition-colors cursor-default">Prompt</span>
          <ArrowRight className="w-3 h-3 text-purple-500 animate-pulse" />
          <span className="hover:text-purple-400 transition-colors cursor-default flex items-center gap-1"><Zap className="w-3 h-3" /> AI</span>
          <ArrowRight className="w-3 h-3 text-purple-500 animate-pulse [animation-delay:0.2s]" />
          <span className="hover:text-purple-400 transition-colors cursor-default flex items-center gap-1"><MonitorPlay className="w-3 h-3" /> Render</span>
          <ArrowRight className="w-3 h-3 text-green-500 animate-pulse [animation-delay:0.4s]" />
          <span className="hover:text-green-400 transition-colors cursor-default flex items-center gap-1"><Rocket className="w-3 h-3" /> Export</span>
        </div>

        {/* Bottom Feature Strip */}
        <div className="w-full border-t border-white/10 bg-[#0B0815]/80 backdrop-blur-md flex flex-wrap justify-center md:justify-between items-center px-4 md:px-10 py-3 md:py-4 gap-2 md:gap-4">
          <div className="flex items-center gap-1.5 text-[9px] md:text-xs font-bold text-gray-300 glow-hover cursor-default px-2 py-1 rounded-full"><Zap className="w-3 h-3 text-purple-400" /> AI Powered</div>
          <div className="flex items-center gap-1.5 text-[9px] md:text-xs font-bold text-gray-300 glow-hover cursor-default px-2 py-1 rounded-full"><MonitorPlay className="w-3 h-3 text-purple-400" /> 4K Export</div>
          <div className="flex items-center gap-1.5 text-[9px] md:text-xs font-bold text-gray-300 glow-hover cursor-default px-2 py-1 rounded-full"><Rocket className="w-3 h-3 text-blue-400" /> Fast Render</div>
          <div className="flex items-center gap-1.5 text-[9px] md:text-xs font-bold text-gray-300 glow-hover cursor-default px-2 py-1 rounded-full"><Sparkles className="w-3 h-3 text-pink-400" /> 60+ Effects</div>
          <div className="flex items-center gap-1.5 text-[9px] md:text-xs font-bold text-gray-300 glow-hover cursor-default px-2 py-1 rounded-full"><Cloud className="w-3 h-3 text-fuchsia-400" /> Cloud</div>
          <div className="flex items-center gap-1.5 text-[9px] md:text-xs font-bold text-gray-300 glow-hover cursor-default px-2 py-1 rounded-full"><Lock className="w-3 h-3 text-green-400" /> No Watermark</div>
        </div>
      </div>
      
              </div>
      </div>
      
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      
      {/* User Profile Sidebar (Moved outside header to avoid transform constraints) */}
      <UserProfileSidebar
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
        userName={userName}
        onLogout={() => void handleLogout()}
      />
      
      <AnimatePresence>
        {showLoginSuccess && (
          <SuccessToast message="Login successful! Welcome back!" onDismiss={() => setShowLoginSuccess(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
