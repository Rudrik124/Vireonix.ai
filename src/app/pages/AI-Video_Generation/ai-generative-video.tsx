import React, { useState, useEffect, useMemo, memo } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Sparkles, 
  Video,
  Clock,
  History,
  Settings2,
  Crown,
  Check,
  Zap,
  Download,
  Layers,
  ChevronRight,
  User,
  ChevronDown,
  LogOut
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { useAuth } from "../../context/auth-context";
import { LoginModal } from "../../components/login-modal";
import { LoadingModal, type LoadingState } from "../../components/loading-modal";
import { BrandLogo } from "../../components/brand-logo";
import { HistoryDialog, type HistoryItem, saveToHistory } from "../../components/history-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { PremiumModal } from "../../components/premium-modal";
import { generateVideo } from "../../../api/generatevideo";
import { usePortalTestingContext } from "../../../shared/portal/testing-context";

const frameStyleOptions = [
  { label: "16:9", width: 32, height: 18 },
  { label: "9:16", width: 18, height: 32 },
  { label: "4:3", width: 28, height: 21 },
  { label: "3:4", width: 21, height: 28 },
  { label: "1:1", width: 24, height: 24 },
  { label: "4:5", width: 22, height: 28 },
  { label: "2.35:1", width: 36, height: 15 },
];

const premiumPrompts = [
  "A cinematic drone fly-through of a neon cyberpunk city at midnight, highly detailed, Unreal Engine 5 render, volumetric lighting",
  "A macro shot of a bioluminescent glowing jellyfish in a dark underwater cave, photorealistic, 8k resolution, ray tracing",
  "A sprawling alien landscape with two massive moons in a twilight sky, ethereal synthwave color palette, smooth camera pan",
  "A mysterious hooded figure walking through a hyper-realistic futuristic train station in heavy rain, cinematic lighting, 35mm lens",
  "A time-lapse of a glowing crystal flower blooming in a futuristic greenhouse, soft glowing particles, high contrast"
];

const BackgroundGlows = memo(() => (
  <>
    {/* Subtle Animated Light Rays */}
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen opacity-20">
      <motion.div
        animate={{ opacity: [0.1, 0.25, 0.1], scale: [1, 1.1, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] left-[-10%] w-[80vw] h-[30vh] bg-gradient-to-r from-transparent via-cyan-500 to-transparent blur-[90px] rotate-[35deg] transform origin-top-left"
        style={{ willChange: "transform, opacity" }}
      />
      <motion.div
        animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.15, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-20%] right-[-10%] w-[100vw] h-[25vh] bg-gradient-to-r from-transparent via-teal-500 to-transparent blur-[100px] rotate-[-25deg] transform origin-bottom-right"
        style={{ willChange: "transform, opacity" }}
      />
    </div>

    {/* Organic Breathing Glow Pulses (Enhanced Orbs) */}
    <motion.div
      animate={{ opacity: [0.03, 0.1, 0.03], scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="fixed top-[5%] left-[5%] w-[60%] h-[60%] bg-cyan-500/30 rounded-full blur-[300px] pointer-events-none z-0 mix-blend-screen"
      style={{ willChange: "transform, opacity" }}
    />
    <motion.div
      animate={{ opacity: [0.02, 0.08, 0.02], scale: [1, 1.3, 1], x: [0, -40, 0], y: [0, 50, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="fixed bottom-[0%] right-[5%] w-[70%] h-[70%] bg-teal-500/30 rounded-full blur-[350px] pointer-events-none z-0 mix-blend-screen"
      style={{ willChange: "transform, opacity" }}
    />
    <motion.div
      animate={{ opacity: [0.01, 0.05, 0.01], scale: [1, 1.5, 1], x: [0, 100, 0] }}
      transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      className="fixed top-[40%] left-[30%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[250px] pointer-events-none z-0 mix-blend-screen"
      style={{ willChange: "transform, opacity" }}
    />
  </>
));

const ParticleBackground = memo(() => {
  const particleData = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => {
      const isFlare = i % 8 === 0;
      const size = isFlare ? Math.random() * 40 + 20 : Math.random() * 2 + 1;
      const depth = Math.random() * 100 + 50;
      return {
        id: i,
        isFlare,
        size,
        depth,
        xInit: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
        yInit: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000),
        xOffset: (Math.random() - 0.5) * 60,
        yOffset: Math.random() * -150 - 50,
        opacityMax: isFlare ? 0.4 : 0.6,
        duration: Math.random() * 35 + 20,
        bgColor: isFlare ? 'rgba(34, 211, 238, 0.15)' : `rgba(165, 243, 252, ${Math.random() * 0.4 + 0.1})`,
        rotate: isFlare ? Math.random() * 180 : 0
      };
    });
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 perspective-[1000px]">
      {particleData.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            width: p.size,
            height: p.isFlare ? 2 : p.size,
            borderRadius: p.isFlare ? '100%' : '50%',
            backgroundColor: p.bgColor,
            filter: p.isFlare ? 'blur(3px)' : 'blur(0.5px)',
            boxShadow: p.isFlare ? '0 0 20px rgba(34, 211, 238, 0.4)' : 'none',
            rotate: p.rotate,
            willChange: "transform, opacity"
          }}
          initial={{ x: p.xInit, y: p.yInit, opacity: 0, z: p.depth }}
          animate={{
            y: [null, p.yOffset],
            x: [null, p.xOffset],
            opacity: [0, p.opacityMax, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
});

export function AIGenerativeVideoPage() {
  const navigate = useNavigate();
  const { isLoggedIn, session, logout } = useAuth();
  const { isDeveloperTestMode, usageContext } = usePortalTestingContext();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";
  const [prompt, setPrompt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(1);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingState, setLoadingState] = useState<LoadingState>(null);
  const [loadingMessage, setLoadingMessage] = useState("");

  // -- History State --
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // -- Advanced Config State --
  const [isAdvancedConfigOpen, setIsAdvancedConfigOpen] = useState(false);
  const [exportQuality, setExportQuality] = useState("1080p");
  const [fps, setFps] = useState(30);
  const [watermark, setWatermark] = useState(true);

  // -- Premium State --
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState<"watermark" | "4k" | "60fps" | "general">("general");

  const handlePremiumIntercept = (feature: "watermark" | "4k" | "60fps") => {
    setPremiumFeature(feature);
    setIsPremiumModalOpen(true);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    console.log("Loading project from history:", item);
    if (item.tool === 'forge' && item.config) {
      if (item.config.prompt) setPrompt(item.config.prompt);
      if (item.config.frame) setSelectedRatio(item.config.frame);
      // ... reload duration
    }
    setIsHistoryOpen(false);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Clear any stale error messages when page loads
    setErrorMessage("");
    // Debug: Log auth status
    console.log("✅ AI Page Loaded. isLoggedIn:", isLoggedIn);
  }, []);

  const handleSurpriseMe = () => {
    const randomPrompt = premiumPrompts[Math.floor(Math.random() * premiumPrompts.length)];
    setPrompt(randomPrompt);
  };

  const handleGenerateVideo = async () => {
    // Check if user is logged in
    console.log("🎬 Generate Video clicked. isLoggedIn:", isLoggedIn);
    
    if (!isLoggedIn) {
      console.log("❌ Not logged in. Showing login modal.");
      setErrorMessage(""); // Clear any previous error messages
      setIsLoginOpen(true);
      return;
    }

    console.log("✅ User is logged in. Proceeding with video generation.");

    if (!prompt.trim()) {
      console.log("⚠️ No prompt entered.");
      setErrorMessage("Please enter a prompt.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");
    setLoadingState("loading");
    setLoadingMessage("Generating your video...");

    try {
      console.log("📝 Current prompt from user input:", prompt);
      console.log("⏱️  Duration:", durationMinutes * 60 + durationSeconds, "seconds");
      console.log("📐 Frame ratio:", selectedRatio);

      const requestPayload = {
        prompt: prompt.trim(),
        duration: durationMinutes * 60 + durationSeconds,
        frame: selectedRatio,
        quality: exportQuality,
        fps,
        watermark,
        usageContext,
      };

      console.log("📤 [FINAL REQUEST] Sending to backend with prompt:", requestPayload.prompt);
      console.log("📤 [FULL PAYLOAD]", JSON.stringify(requestPayload, null, 2));
      const data = await generateVideo(requestPayload);

      console.log("✅ Generation successful:", data.video);

      // Show success state
      setLoadingState("success");
      setLoadingMessage("Video generated successfully!");

      saveToHistory({
        title: prompt.slice(0, 30) + (prompt.length > 30 ? "..." : ""),
        tool: 'forge',
        config: {
          prompt,
          ratio: selectedRatio,
          duration: durationMinutes * 60 + durationSeconds,
          quality: exportQuality,
          fps,
          watermark
        }
      });

      localStorage.setItem("generatedVideo", data.video);
      localStorage.removeItem("generatedVideoError");
      if (data.storage) {
        localStorage.setItem("generatedVideoStorage", data.storage);
      } else {
        localStorage.removeItem("generatedVideoStorage");
      }

      // Wait 2 seconds then navigate (modal auto-dismisses)
      setTimeout(() => {
        setLoadingState(null);
        navigate("/result");
      }, 2500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected generation error.";
      console.error("❌ Error in video generation:", message);
      setLoadingState("error");
      setLoadingMessage(message);
      setErrorMessage(message);
      localStorage.removeItem("generatedVideo");
      localStorage.setItem("generatedVideoError", message);
    } finally {
      setIsGenerating(false);
    }
  };

  const clampDuration = (minutes: number, seconds: number) => {
    let safeMinutes = Math.max(0, Math.min(3, Math.floor(minutes) || 0));
    let safeSeconds = Math.max(0, Math.min(59, Math.floor(seconds) || 0));
    if (safeMinutes === 3) {
      safeSeconds = 0;
    }
    return { safeMinutes, safeSeconds };
  };

  const handleMinutesInput = (value: string) => {
    const parsed = Number(value);
    const { safeMinutes, safeSeconds } = clampDuration(
      Number.isNaN(parsed) ? 0 : parsed,
      durationSeconds
    );
    setDurationMinutes(safeMinutes);
    setDurationSeconds(safeSeconds);
  };

  const handleSecondsInput = (value: string) => {
    const parsed = Number(value);
    const { safeMinutes, safeSeconds } = clampDuration(
      durationMinutes,
      Number.isNaN(parsed) ? 0 : parsed
    );
    setDurationMinutes(safeMinutes);
    setDurationSeconds(safeSeconds);
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-white pb-20 flex flex-col"
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

      <BackgroundGlows />
      <ParticleBackground />


      {/* Header with Logo */}
      <div className="pt-8 px-6 lg:px-12 flex justify-between items-center max-w-7xl mx-auto relative z-10 w-full mb-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 group cursor-pointer"
          onClick={() => window.location.reload()}
        >
          <div className="relative">
            {/* Theme Background Glow */}
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <BrandLogo size={48} className="relative z-10" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] group-hover:text-cyan-400/80 transition-colors">
            VIREONIX<span className="text-cyan-400">.AI</span>
          </span>
        </motion.div>

        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 transition-all text-white group shadow-xl"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <User className="w-3 h-3 text-[#0b0d1f]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">{userName}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-48 bg-[#0b0d1f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
                  >
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-[10px] font-bold uppercase tracking-[0.2em] group"
                      >
                        <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 transition-all text-[#94a3b8] hover:text-white group shadow-xl"
          >
            <History className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform" />
            <span className="text-[11px] font-bold uppercase tracking-widest">History</span>
          </button>

          <Dialog open={isAdvancedConfigOpen} onOpenChange={setIsAdvancedConfigOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 transition-all text-[#94a3b8] hover:text-white group shadow-xl">
                <Settings2 className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                <span className="text-[11px] font-bold uppercase tracking-widest">Advanced Config</span>
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#0b0d1f]/95 backdrop-blur-2xl border-white/10 text-white sm:max-w-[425px] rounded-3xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter">
                  <Settings2 className="w-5 h-5 text-cyan-400" />
                  Production Settings
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-6 py-6 font-sans">
                {/* Export Quality */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Export Quality</Label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['720p', '1080p', '4K'].map((res) => {
                      const isPremium = res === '4K';
                      return (
                        <button
                          key={res}
                          onClick={() => isPremium ? handlePremiumIntercept("4k") : setExportQuality(res)}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex flex-col items-center gap-1 ${
                            exportQuality === res 
                              ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                              : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'
                          }`}
                        >
                          <span>{res}</span>
                          {isPremium && (
                            <div className="flex items-center gap-1 text-[8px] text-amber-500">
                              <Crown className="w-2 h-2" />
                              <span>PREMIUM</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Frame Rate */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <Zap className="w-3 h-3" /> Target Frame Rate
                  </label>
                  <div className="flex gap-2">
                    {[24, 30, 60].map((f) => {
                      const isPremium = f === 60;
                      return (
                        <button
                          key={f}
                          onClick={() => isPremium ? handlePremiumIntercept("60fps") : setFps(f)}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex flex-col items-center gap-1 ${
                            fps === f
                              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                              : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'
                          }`}
                        >
                          <span>{f} FPS</span>
                          {isPremium && (
                            <div className="flex items-center gap-1 text-[8px] text-amber-500">
                              <Crown className="w-2 h-2" />
                              <span>PREMIUM</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Watermark Toggle */}
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <button className="text-slate-400 hover:text-white transition-colors">
                        <Settings2 className="w-4 h-4" />
                      </button>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white">Production Watermark</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Branded: VIREONIX</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 rounded-md text-amber-500 text-[8px] font-black uppercase tracking-widest">
                         <Crown className="w-3 h-3" />
                         <span>PREMIUM TO REMOVE</span>
                      </div>
                      <button
                        onClick={() => handlePremiumIntercept("watermark")}
                        className={`w-12 h-6 rounded-full relative transition-all bg-cyan-600 shadow-[0_0_10px_rgba(34,211,238,0.3)]`}
                      >
                        <div className={`absolute top-1 right-1 w-4 h-4 rounded-full bg-white transition-all`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <Button
                  onClick={() => setIsAdvancedConfigOpen(false)}
                  className="px-8 bg-white/10 hover:bg-white/20 text-white border-white/10 hover:border-white/20 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all py-6 h-auto"
                >
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8 max-w-7xl relative z-10 flex flex-col flex-1">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate("/features")}
            className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-cyan-300 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium tracking-wide">Back to selection</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-[#1a1b2e]/60 backdrop-blur-3xl px-6 py-2.5 rounded-full border border-cyan-500/20 mb-6 shadow-[0_4px_30px_rgba(0,0,0,0.2)] hover:bg-[#2d3142]/60 transition-colors cursor-default">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-cyan-100 tracking-wide uppercase font-sans tracking-[0.2em]">AI Generative Video</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-5xl font-black tracking-tighter mb-4 selection:bg-cyan-500/30">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-teal-300 drop-shadow-[0_2px_10px_rgba(34,211,238,0.2)]">
              Generate Video with AI
            </span>
          </h1>
          <p className="text-base md:text-lg text-[#94a3b8] max-w-2xl mx-auto leading-relaxed">
            Create stunning videos using AI in seconds
          </p>
          {isDeveloperTestMode && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
              Internal testing mode active
            </div>
          )}
        </motion.div>

        {/* 3-COLUMN LAYOUT (Staggered Animation Wrapper) */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.15 }
            }
          }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 lg:flex-1"
        >
          {/* LEFT: Prompt */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
            className="bg-[#1a1b2e]/50 backdrop-blur-3xl border border-[#3f4a67]/50 rounded-[2rem] p-6 lg:p-8 shadow-[0_8px_30px_rgba(11,13,31,0.5)] flex flex-col group hover:shadow-[0_8px_30px_rgba(34,211,238,0.15)] transition-all h-full min-h-[300px]"
          >
            <div className="flex items-center justify-between mb-4 border-b border-[#3f4a67]/50 pb-4">
              <label className="text-xs md:text-sm font-bold text-cyan-50/90 uppercase tracking-[0.15em] flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                Enter prompt manually
              </label>
              <button
                onClick={handleSurpriseMe}
                className="text-[10px] uppercase tracking-widest font-bold text-cyan-400 bg-cyan-900/30 hover:bg-cyan-800/50 px-3 py-1.5 rounded-full border border-cyan-500/30 hover:border-cyan-400 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-105 active:scale-95"
              >
                Surprise me
              </button>
            </div>
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Example: A cinematic fly-through of a futuristic city at sunrise with smooth camera motion and volumetric light."
              className="flex-1 w-full text-base resize-none rounded-2xl border border-[#3f4a67]/60 group-focus-within:border-cyan-400 hover:border-cyan-500/50 group-focus-within:ring-1 group-focus-within:ring-cyan-500/50 group-focus-within:shadow-[0_0_40px_rgba(34,211,238,0.15)] bg-[#0b0d1f]/60 text-white placeholder:text-slate-500 transition-all duration-300 p-5 shadow-inner"
            />
          </motion.div>

          {/* CENTER: Frame Selection */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
            className="bg-[#1a1b2e]/50 backdrop-blur-3xl border border-[#3f4a67]/50 rounded-[2rem] p-6 lg:p-8 shadow-[0_8px_30px_rgba(11,13,31,0.5)] flex flex-col h-full hover:shadow-[0_8px_30px_rgba(34,211,238,0.15)] transition-all min-h-[300px]"
          >
            <label className="text-xs md:text-sm font-bold mb-4 text-cyan-50/90 uppercase tracking-[0.15em] flex items-center gap-3 border-b border-[#3f4a67]/50 pb-4">
              <Video className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              Aspect Ratio
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1 content-start mt-2">
              {frameStyleOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setSelectedRatio(opt.label)}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-4 transition-all duration-300 group/frame ${
                    selectedRatio === opt.label
                      ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                      : "border-[#3f4a67]/80 bg-[#0b0d1f]/40 hover:border-cyan-500/60 hover:bg-[#1a1b2e]/80 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                  }`}
                >
                  <div className="h-10 flex items-center justify-center mb-2">
                    <div 
                      style={{ width: opt.width, height: opt.height }}
                      className={`border-2 rounded-[2px] transition-all duration-300 ${
                        selectedRatio === opt.label ? "border-cyan-400" : "border-slate-500/50 group-hover/frame:border-slate-400"
                      }`}
                    />
                  </div>
                  <div className={`text-[12px] font-black tracking-wider transition-all duration-300 ${
                    selectedRatio === opt.label ? "text-cyan-100 drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]" : "text-slate-500 group-hover/frame:text-slate-300"
                  }`}>
                    {opt.label}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
          {/* RIGHT: Duration & Generate Element */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
            className="bg-[#1a1b2e]/50 backdrop-blur-3xl border border-[#3f4a67]/50 rounded-[2rem] p-6 lg:p-8 shadow-[0_8px_30px_rgba(11,13,31,0.5)] flex flex-col h-full hover:shadow-[0_8px_30px_rgba(34,211,238,0.15)] transition-all min-h-[300px]"
          >
            <label className="text-xs md:text-sm font-bold mb-4 text-cyan-50/90 uppercase tracking-[0.15em] border-b border-[#3f4a67]/50 pb-4">
              Runtime Duration
            </label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className={`relative bg-[#0b0d1f]/60 border rounded-2xl transition-all duration-300 ${
                durationMinutes > 0 ? "border-cyan-400 bg-cyan-900/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]" : "border-[#3f4a67]/80"
              }`}>
                <label className="absolute top-2 left-4 text-[7px] uppercase tracking-widest font-black text-slate-500">Minutes</label>
                <input 
                  type="number"
                  min="0"
                  max="3"
                  value={durationMinutes}
                  onChange={e => handleMinutesInput(e.target.value)}
                  className="w-full h-16 pt-5 bg-transparent text-xl font-black text-white outline-none text-center appearance-none"
                />
              </div>

              <div className={`relative bg-[#0b0d1f]/60 border rounded-2xl transition-all duration-300 ${
                durationSeconds > 0 ? "border-cyan-400 bg-cyan-900/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]" : "border-[#3f4a67]/80"
              }`}>
                <label className="absolute top-2 left-4 text-[7px] uppercase tracking-widest font-black text-slate-500">Seconds</label>
                <input 
                  type="number"
                  min="0"
                  max="59"
                  value={durationSeconds}
                  onChange={e => handleSecondsInput(e.target.value)}
                  className="w-full h-16 pt-5 bg-transparent text-xl font-black text-white outline-none text-center appearance-none"
                />
              </div>
            </div>

            {errorMessage && (
              <p className="mt-2 mb-4 text-sm text-red-400 text-center font-bold bg-red-500/10 border border-red-500/30 py-3 px-4 rounded-xl backdrop-blur-sm">{errorMessage}</p>
            )}

            <div className="mt-auto relative group/btn w-full">
              {/* CSS Animations for button instead of Framer Motion to save main thread */}
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes bg-pan { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes gloss-pan { 0% { left: -100%; } 50% { left: 200%; } 100% { left: 200%; } }
              `}} />
              {/* Animated Button Sheen/Glow Background */}
              <div
                className="absolute -inset-1 rounded-[1.25rem] bg-gradient-to-r from-cyan-600 via-teal-400 to-blue-600 opacity-40 blur-xl group-hover/btn:opacity-70 transition-opacity duration-500"
                style={{ backgroundSize: '200% 200%', animation: 'bg-pan 5s linear infinite' }}
              />
              <Button
                onClick={handleGenerateVideo}
                disabled={!prompt.trim() || isGenerating}
                className="relative w-full h-16 text-lg rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-400 hover:opacity-100 hover:scale-[1.03] transition-all duration-300 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-[#0b0d1f] font-black tracking-widest border border-cyan-300/50 overflow-hidden z-10"
              >
                {/* Internal animated gloss */}
                <div
                  className="absolute inset-0 w-[50%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                  style={{ animation: 'gloss-pan 4s ease-in-out infinite' }}
                />
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <Video className="w-5 h-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] group-hover/btn:rotate-12 transition-transform duration-300" />
                  {isGenerating ? "GENERATING..." : "GENERATE VIDEO"}
                </span>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Loading Modal for Video Generation */}
      <LoadingModal
        state={loadingState}
        message={loadingMessage}
        onDismiss={() => {
          setLoadingState(null);
          setErrorMessage("");
        }}
      />

      {/* Login Modal for Video Generation */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        customTitle="Login Required"
        customMessage="Please sign in to generate your video."
      />

      <HistoryDialog 
        open={isHistoryOpen} 
        onOpenChange={setIsHistoryOpen}
        onSelect={handleHistorySelect}
        currentTool="forge"
      />

      <PremiumModal 
        open={isPremiumModalOpen} 
        onOpenChange={setIsPremiumModalOpen}
        feature={premiumFeature}
      />
    </div>
  );
}
