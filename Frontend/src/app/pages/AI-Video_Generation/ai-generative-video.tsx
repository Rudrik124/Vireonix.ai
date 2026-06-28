import React, { useState, useEffect, useMemo, memo } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Sparkles, Video, Clock, History, Settings2, Crown, Check, Zap, Download, Layers, ChevronRight, User, ChevronDown, LogOut,
  Battery, Bell, Moon, Sun, Monitor, Menu, Wand2, Dice5, Save, LayoutTemplate, TrendingUp, AlertTriangle, Play, Copy, Trash2, Heart, Info, X, Camera, Palette, Sliders, Activity, Focus, Cpu
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { PremiumModal } from "../../components/premium-modal";
import { generateVideo } from "../../../api/generatevideo";
import { usePortalTestingContext } from "../../../shared/portal/testing-context";
import { useRedirectParam } from "../../lib/useRedirectParam";

const frameStyleOptions = [
  { label: "16:9", ratio: "YouTube", icon: Monitor },
  { label: "9:16", ratio: "TikTok/Reels", icon: Monitor },
  { label: "1:1", ratio: "Instagram", icon: Monitor },
  { label: "4:3", ratio: "Standard", icon: Monitor },
  { label: "3:4", ratio: "Portrait", icon: Monitor },
  { label: "21:9", ratio: "Ultrawide", icon: Monitor },
  { label: "2.35:1", ratio: "Cinematic", icon: Monitor },
];

const durationOptions = [
  { label: "5 sec", value: 5, credits: 5 },
  { label: "10 sec", value: 10, credits: 10 },
  { label: "15 sec", value: 15, credits: 15 },
  { label: "30 sec", value: 30, credits: 30 },
  { label: "60 sec", value: 60, credits: 60 },
  { label: "120 sec", value: 120, credits: 120 },
  { label: "Custom", value: "custom", credits: 0 },
];

const resolutionOptions = [
  { label: "720p", time: "~1m" },
  { label: "1080p", time: "~2m" },
  { label: "2K", time: "~4m" },
  { label: "4K", time: "~8m" },
  { label: "8K", time: "~15m" },
];

const qualityOptions = ["Draft", "Standard", "HD", "Ultra HD", "Cinema"];

const modelOptions = [
  "VEYTRIX Turbo",
  "VEYTRIX Cinema XL",
  "VEYTRIX Motion",
  "VEYTRIX Realistic",
  "VEYTRIX Anime",
  "VEYTRIX Experimental",
];

const promptSuggestions = [
  "Cinematic", "Photorealistic", "Drone Shot", "Volumetric Light", "Cyberpunk", "Slow Motion", "Ultra Realistic", "Anime", "Nature", "Commercial Ad"
];

const cameraStyles = [
  "Static", "Pan Left", "Pan Right", "Zoom In", "Zoom Out", "Orbit", "Drone", "Tracking", "Handheld", "Crane"
];

const lightingStyles = [
  "Natural", "Golden Hour", "Studio", "Sunset", "Moonlight", "Blue Hour", "Volumetric", "Neon", "Noir"
];

const visualStyles = [
  "Realistic", "Cinematic", "Anime", "Pixar", "Cyberpunk", "Fantasy", "Oil Painting", "3D", "Photorealistic", "Watercolor"
];

const premiumPrompts = [
  "A cinematic drone fly-through of a neon cyberpunk city at midnight, highly detailed, Unreal Engine 5 render, volumetric lighting",
  "A macro shot of a bioluminescent glowing jellyfish in a dark underwater cave, photorealistic, 8k resolution, ray tracing",
  "A sprawling alien landscape with two massive moons in a twilight sky, ethereal synthwave color palette, smooth camera pan"
];

const dummyQueue = [
  { id: 1, prompt: "Cyberpunk city fly-through...", status: "Generating", progress: 65, eta: "1m 12s" },
  { id: 2, prompt: "Neon signs glowing in the rain...", status: "Queued", progress: 0, eta: "Pending" },
];

const dummyRecent = [
  { id: 3, prompt: "Sunset over a vast mountain range...", duration: "10s", resolution: "4K", created: "10 mins ago", thumbnail: "https://images.unsplash.com/photo-1506744626753-1fa30a006c57?w=300" },
  { id: 4, prompt: "Futuristic spaceship cockpit view...", duration: "15s", resolution: "1080p", created: "1 hour ago", thumbnail: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=300" },
];

const BackgroundGlows = memo(() => (
  <>
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen opacity-20">
      <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[30vh] bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-[90px] rotate-[35deg]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[100vw] h-[25vh] bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent blur-[100px] rotate-[-25deg]" />
    </div>

    <div className="fixed top-[5%] left-[5%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-screen" />
    <div className="fixed bottom-[0%] right-[5%] w-[70%] h-[70%] bg-fuchsia-500/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-screen" />
    <div className="fixed top-[40%] left-[30%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-screen" />
  </>
));

const ParticleBackground = memo(() => {
  const particleData = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => {
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
        bgColor: isFlare ? 'rgba(168, 85, 247, 0.15)' : `rgba(165, 243, 252, ${Math.random() * 0.4 + 0.1})`,
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
            boxShadow: p.isFlare ? '0 0 20px rgba(168, 85, 247, 0.4)' : 'none',
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
  const redirectTo = useRedirectParam();
  const { isLoggedIn, session, logout, profile } = useAuth();
  const { isDeveloperTestMode, usageContext } = usePortalTestingContext();
  
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";
  const [recentGenerations, setRecentGenerations] = useState<HistoryItem[]>([]);

  const loadRecentGenerations = () => {
    try {
      const saved = localStorage.getItem('veytrix_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter((item: HistoryItem) => item.tool === 'forge');
        setRecentGenerations(filtered.slice(0, 4));
      }
    } catch (e) {}
  };
  
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<number | "custom">(5);
  const [customDuration, setCustomDuration] = useState(15);
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [selectedResolution, setSelectedResolution] = useState("1080p");
  const [selectedQuality, setSelectedQuality] = useState("Standard");
  const [selectedModel, setSelectedModel] = useState("VEYTRIX Turbo");
  
  const [creativity, setCreativity] = useState(50);
  const [motionStrength, setMotionStrength] = useState(50);
  const [cameraMovement, setCameraMovement] = useState(50);
  const [promptStrength, setPromptStrength] = useState(50);
  const [consistency, setConsistency] = useState(50);
  const [frameSmoothness, setFrameSmoothness] = useState(50);

  const [selectedCameraStyle, setSelectedCameraStyle] = useState("Static");
  const [selectedLighting, setSelectedLighting] = useState("Natural");
  const [selectedStyle, setSelectedStyle] = useState("Cinematic");
  
  const [isAdvancedConfigOpen, setIsAdvancedConfigOpen] = useState(false);
  const [seed, setSeed] = useState("");
  const [randomSeed, setRandomSeed] = useState(true);
  const [cfgScale, setCfgScale] = useState(7.5);
  const [samplingSteps, setSamplingSteps] = useState(30);
  const [fps, setFps] = useState(30);
  const [loopVideo, setLoopVideo] = useState(false);
  const [safetyFilter, setSafetyFilter] = useState(true);
  const [watermark, setWatermark] = useState(true);
  const [frameInterpolation, setFrameInterpolation] = useState(true);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingState, setLoadingState] = useState<LoadingState>(null);
  const [loadingMessage, setLoadingMessage] = useState("");

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState<"watermark" | "4k" | "60fps" | "general">("general");

  const handlePremiumIntercept = (feature: "watermark" | "4k" | "60fps") => {
    setPremiumFeature(feature);
    setIsPremiumModalOpen(true);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    if (item.tool === 'forge' && item.config) {
      if (item.config.prompt) setPrompt(item.config.prompt);
      if (item.config.frame) setSelectedRatio(item.config.frame);
    }
    setIsHistoryOpen(false);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    setErrorMessage("");
    loadRecentGenerations();
  }, []);

  const handleSurpriseMe = () => {
    const randomPrompt = premiumPrompts[Math.floor(Math.random() * premiumPrompts.length)];
    setPrompt(randomPrompt);
  };

  const handleGenerateVideo = async () => {
    if (!isLoggedIn) {
      setErrorMessage("");
      setIsLoginOpen(true);
      return;
    }

    if (!prompt.trim()) {
      setErrorMessage("Please enter a prompt.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");
    setLoadingState("loading");
    setLoadingMessage("Generating your video...");

    try {
      const duration = selectedDuration === "custom" ? customDuration : selectedDuration;
      const requestPayload = {
        prompt: prompt.trim(),
        duration,
        frame: selectedRatio,
        quality: selectedResolution, // Using resolution mapped to original quality prop
        fps,
        watermark,
        usageContext,
      };

      const data = await generateVideo(requestPayload);

      setLoadingState("success");
      setLoadingMessage("Video generated successfully!");

      saveToHistory({
        title: prompt.slice(0, 30) + (prompt.length > 30 ? "..." : ""),
        tool: 'forge',
        config: {
          prompt,
          ratio: selectedRatio,
          duration,
          quality: selectedResolution,
          fps,
          watermark
        }
      });
      
      loadRecentGenerations();

      localStorage.setItem("generatedVideo", data.video);
      localStorage.removeItem("generatedVideoError");
      if (data.storage) {
        localStorage.setItem("generatedVideoStorage", data.storage);
      } else {
        localStorage.removeItem("generatedVideoStorage");
      }

      setTimeout(() => {
        setLoadingState(null);
        navigate("/result");
      }, 2500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected generation error.";
      setLoadingState("error");
      setLoadingMessage(message);
      setErrorMessage(message);
      localStorage.removeItem("generatedVideo");
      localStorage.setItem("generatedVideoError", message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] relative overflow-x-hidden font-sans selection:bg-purple-500/30 selection:text-white pb-20 flex flex-col text-slate-200"
      style={{
        background: 'linear-gradient(135deg, #050812 0%, #0d1222 30%, #171d33 60%, #1f2540 85%, #0d1222 100%)',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="fixed inset-0 pointer-events-none z-0" style={{ boxShadow: 'inset 0 0 500px rgba(5,8,18,0.95)' }} />
      <BackgroundGlows />
      <ParticleBackground />

      {/* Modern Header */}
      <div className="pt-6 px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-50 w-full mb-8 border-b border-white/5 pb-6 bg-[#050812]/40 backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => window.location.reload()}
          >
            <BrandLogo size={42} className="relative z-10" />
            <span className="text-xl font-black tracking-tight text-white group-hover:text-purple-400 transition-colors">
              VEYTRIX<span className="text-purple-500">.AI</span>
            </span>
          </motion.div>
          <motion.button 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            onClick={() => navigate(redirectTo || '/features')}
            className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-white transition-colors ml-[54px]"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Features
          </motion.button>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
          <div className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mr-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400"><Battery className="w-3.5 h-3.5" /> {profile?.credits?.userCredits ?? 0} Credits</span>
          </div>



          <button onClick={() => setIsHistoryOpen(true)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all text-slate-300 hover:text-white shadow-lg">
            <History className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-widest hidden sm:inline">History</span>
          </button>

          {isLoggedIn ? (
            <div className="relative">
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-full border border-white/10 transition-all text-white shadow-lg">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">{userName}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-full mt-2 w-48 bg-[#0B1020]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]">
                    <div className="p-2">
                      <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-[10px] font-bold uppercase tracking-[0.2em]">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={() => setIsLoginOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors">
              Sign In
            </button>
          )}

          <button className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors sm:hidden">
            <Menu className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10 flex flex-col flex-1">
        
        {/* Modern Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-5 py-2 rounded-full mb-6 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-purple-200 tracking-[0.2em] uppercase">AI Generative Video</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 drop-shadow-2xl text-white">
            Generate Video with AI
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Create stunning AI-generated videos in seconds with cinematic quality and intelligent motion generation.
          </p>
        </motion.div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          
          {/* LEFT PANEL: Prompt Studio */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#10162A]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-white">Prompt Studio</h2>
                </div>
              </div>
              
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your dream video in as much detail as possible..."
                className="w-full h-36 resize-none bg-[#050812]/50 border border-white/10 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-white placeholder:text-slate-500 mb-4"
              />

              <div className="grid grid-cols-2 gap-2 mb-6">
                <button onClick={handleSurpriseMe} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold transition-colors border border-purple-500/20">
                  <Dice5 className="w-3.5 h-3.5" /> Surprise Me
                </button>
                <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors border border-white/5">
                  <Sparkles className="w-3.5 h-3.5" /> Enhance
                </button>
                <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors border border-white/5">
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
                <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors border border-white/5">
                  <LayoutTemplate className="w-3.5 h-3.5" /> Templates
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Negative Prompt</label>
                <Input
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Things you don't want in the video..."
                  className="bg-[#050812]/50 border-white/10 rounded-xl text-sm"
                />
              </div>

              <div className="mt-6">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">Prompt Suggestions</label>
                <div className="flex flex-wrap gap-2">
                  {promptSuggestions.map(s => (
                    <button key={s} onClick={() => setPrompt(p => p + (p ? ", " : "") + s)} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300 hover:bg-white/10 hover:border-white/20 transition-all font-medium">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CENTER PANEL: Video Configuration */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#10162A]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl relative h-full">
              <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                <Settings2 className="w-5 h-5 text-blue-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Video Configuration</h2>
              </div>

              {/* Aspect Ratio */}
              <div className="mb-8">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">Aspect Ratio</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {frameStyleOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setSelectedRatio(opt.label)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                        selectedRatio === opt.label 
                          ? "bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                          : "bg-[#050812]/50 border-white/10 hover:border-white/30"
                      }`}
                    >
                      <opt.icon className={`w-5 h-5 mb-2 ${selectedRatio === opt.label ? "text-blue-400" : "text-slate-500"}`} />
                      <span className={`text-sm font-bold ${selectedRatio === opt.label ? "text-blue-100" : "text-slate-300"}`}>{opt.label}</span>
                      <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-1 hidden sm:block">{opt.ratio}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="mb-8">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">Duration</label>
                <div className="grid grid-cols-4 gap-3">
                  {durationOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setSelectedDuration(opt.value as number | "custom")}
                      className={`py-3 rounded-2xl border transition-all flex flex-col items-center ${
                        selectedDuration === opt.value 
                          ? "bg-purple-500/10 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                          : "bg-[#050812]/50 border-white/10 hover:border-white/30"
                      }`}
                    >
                      <span className={`text-sm font-bold ${selectedDuration === opt.value ? "text-purple-100" : "text-slate-300"}`}>{opt.label}</span>
                      {opt.credits > 0 && <span className="text-[9px] text-slate-500 mt-1">{opt.credits} Credits</span>}
                    </button>
                  ))}
                </div>
                {selectedDuration === "custom" && (
                  <div className="mt-3">
                    <Input type="number" value={customDuration} onChange={e => setCustomDuration(Number(e.target.value))} className="bg-[#050812]/50 border-white/10 w-32" />
                  </div>
                )}
              </div>

              {/* Resolution & Quality */}
              <div className="grid sm:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">Resolution</label>
                  <div className="space-y-2">
                    {resolutionOptions.map(opt => (
                      <button key={opt.label} onClick={() => setSelectedResolution(opt.label)} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${selectedResolution === opt.label ? "bg-white/10 border-white/30" : "bg-transparent border-white/5 hover:bg-white/5"}`}>
                        <span className="text-sm font-bold text-slate-200">{opt.label}</span>
                        <span className="text-xs text-slate-500">{opt.time}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">Quality</label>
                  <div className="space-y-2">
                    {qualityOptions.map(opt => (
                      <button key={opt} onClick={() => setSelectedQuality(opt)} className={`w-full text-left px-4 py-2.5 rounded-xl border transition-all ${selectedQuality === opt ? "bg-white/10 border-white/30" : "bg-transparent border-white/5 hover:bg-white/5"}`}>
                        <span className="text-sm font-bold text-slate-200">{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Model Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">AI Model</label>
                <div className="relative">
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full appearance-none bg-[#050812]/50 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold text-white focus:border-purple-500 outline-none"
                  >
                    {modelOptions.map(opt => <option key={opt} value={opt} className="bg-[#0B1020]">{opt}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT PANEL: Creative Controls & Accordion */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-[#10162A]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative">
              <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                <Palette className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Creative Controls</h2>
              </div>

              <div className="space-y-5">
                {[
                  { label: "Creativity", val: creativity, set: setCreativity },
                  { label: "Motion Strength", val: motionStrength, set: setMotionStrength },
                  { label: "Camera Movement", val: cameraMovement, set: setCameraMovement },
                  { label: "Prompt Strength", val: promptStrength, set: setPromptStrength },
                ].map(slider => (
                  <div key={slider.label}>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                      <span>{slider.label}</span>
                      <span className="text-emerald-400">{slider.val}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={slider.val} onChange={e => slider.set(Number(e.target.value))} className="w-full accent-emerald-500 h-1.5 bg-white/10 rounded-full appearance-none" />
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">Camera Style</label>
                <div className="flex flex-wrap gap-2">
                  {cameraStyles.slice(0, 6).map(style => (
                    <button key={style} onClick={() => setSelectedCameraStyle(style)} className={`px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg border transition-all ${selectedCameraStyle === style ? "bg-emerald-500/20 border-emerald-500 text-emerald-300" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"}`}>
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="bg-[#10162A]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl relative">
              <button onClick={() => setIsAdvancedConfigOpen(!isAdvancedConfigOpen)} className="w-full flex items-center justify-between font-black uppercase tracking-widest text-xs text-white p-2">
                <div className="flex items-center gap-2"><Sliders className="w-4 h-4 text-slate-400" /> Advanced Settings</div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isAdvancedConfigOpen ? "rotate-180" : ""}`} />
              </button>
              
              <AnimatePresence>
                {isAdvancedConfigOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="pt-4 border-t border-white/5 mt-2 space-y-4 px-2 pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Random Seed</span>
                        <Switch checked={randomSeed} onCheckedChange={setRandomSeed} />
                      </div>
                      {!randomSeed && <Input value={seed} onChange={e => setSeed(e.target.value)} placeholder="Enter seed..." className="bg-white/5 border-white/10 text-xs h-8 rounded-lg" />}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Loop Video</span>
                        <Switch checked={loopVideo} onCheckedChange={setLoopVideo} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Watermark</span>
                        <Switch checked={watermark} onCheckedChange={setWatermark} />
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-2"><span>CFG Scale</span><span className="text-purple-400">{cfgScale}</span></div>
                        <input type="range" min="1" max="20" step="0.5" value={cfgScale} onChange={e => setCfgScale(Number(e.target.value))} className="w-full accent-purple-500 h-1.5 bg-white/10 rounded-full appearance-none" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* BOTTOM GENERATION CARD */}
        <div className="mt-8 mb-12">
          <div className="bg-[#10162A]/90 backdrop-blur-3xl border border-purple-500/30 rounded-[2rem] p-6 sm:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/5 to-transparent pointer-events-none" />
            
            <div className="flex flex-wrap items-center gap-6 relative z-10">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Est. Credits</p>
                <p className="text-xl font-black text-white flex items-center gap-1.5"><Battery className="w-5 h-5 text-fuchsia-400" /> {selectedDuration === "custom" ? customDuration : selectedDuration}</p>
              </div>
              <div className="w-px h-10 bg-white/10 hidden sm:block" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Est. Time</p>
                <p className="text-xl font-black text-white flex items-center gap-1.5"><Clock className="w-5 h-5 text-blue-400" /> ~2m</p>
              </div>
              <div className="w-px h-10 bg-white/10 hidden lg:block" />
              <div className="hidden lg:block">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Summary</p>
                <p className="text-sm font-bold text-slate-300">{selectedModel} • {selectedResolution} • {selectedRatio}</p>
              </div>
            </div>

            <Button
              onClick={handleGenerateVideo}
              disabled={!prompt.trim() || isGenerating}
              className="w-full sm:w-auto px-10 h-16 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-500 hover:opacity-100 hover:scale-105 transition-all text-white font-black tracking-widest border border-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] relative overflow-hidden group z-10"
            >
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_2s_infinite] skew-x-12" />
              <span className="flex items-center gap-3 relative z-10">
                <Video className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                {isGenerating ? "GENERATING..." : "GENERATE VIDEO"}
              </span>
            </Button>
          </div>
        </div>

        {/* RECENT GENERATIONS */}
        <div className="mb-20">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2"><History className="w-4 h-4" /> Recent Generations</h3>
          {recentGenerations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-[#10162A]/60 border border-white/5 rounded-3xl opacity-60">
              <History className="w-12 h-12 text-slate-500 mb-4" />
              <p className="text-sm font-black uppercase tracking-widest text-slate-400">No recent creations</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-2">Start generating to see your history here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentGenerations.map(r => (
                <div key={r.id} onClick={() => handleHistorySelect(r)} className="cursor-pointer bg-[#10162A]/60 border border-white/5 rounded-2xl overflow-hidden group hover:border-purple-500/30 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] flex flex-col">
                  <div className="relative aspect-video overflow-hidden bg-black/80 flex items-center justify-center">
                    <Video className="w-8 h-8 text-white/20 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                      <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform"><Play className="w-5 h-5 ml-1" /></div>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-sm font-medium text-slate-200 line-clamp-1 mb-2 flex-1">{r.title}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-auto">
                      <span>{r.config?.quality || '1080p'} • {r.config?.duration || '5'}s</span>
                      <span>{new Date(r.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Floating AI Assistant */}
      <div className="fixed bottom-6 right-6 z-50 hidden lg:block">
        <AnimatePresence>
          {isAIAssistantOpen ? (
            <motion.div 
              key="expanded"
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-[#10162A]/90 backdrop-blur-xl border border-fuchsia-500/30 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] w-72 origin-bottom-right relative"
            >
              <button 
                onClick={() => setIsAIAssistantOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10 pr-6">
                <Sparkles className="w-5 h-5 text-fuchsia-400" />
                <span className="text-xs font-black uppercase tracking-widest text-white">AI Assistant</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">Try enhancing your prompt with:</p>
              <div className="space-y-2">
                <button onClick={() => { setPrompt(p => p + " cinematic lighting"); setIsAIAssistantOpen(false); }} className="w-full text-left px-3 py-2 text-[11px] font-medium text-fuchsia-200 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 rounded-lg transition-colors border border-fuchsia-500/20">
                  + Add cinematic lighting
                </button>
                <button onClick={() => { setPrompt(p => p + " 8k resolution"); setIsAIAssistantOpen(false); }} className="w-full text-left px-3 py-2 text-[11px] font-medium text-fuchsia-200 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 rounded-lg transition-colors border border-fuchsia-500/20">
                  + Add 8k resolution
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button 
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 15 }}
              onClick={() => setIsAIAssistantOpen(true)}
              className="relative w-14 h-14 bg-fuchsia-500/20 backdrop-blur-xl border border-fuchsia-400/30 text-fuchsia-300 rounded-full shadow-[0_0_25px_rgba(168,85,247,0.4)] flex items-center justify-center overflow-hidden group cursor-pointer"
            >
              <motion.div 
                animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }} 
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-tr from-fuchsia-600/50 to-purple-600/50 rounded-full blur-md"
              />
              <Sparkles className="w-6 h-6 relative z-10 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <LoadingModal state={loadingState} message={loadingMessage} onDismiss={() => { setLoadingState(null); setErrorMessage(""); }} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} customTitle="Login Required" customMessage="Please sign in to generate your video." />
      <HistoryDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen} onSelect={handleHistorySelect} currentTool="forge" />
      <PremiumModal open={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen} feature={premiumFeature} />
    </div>
  );
}
