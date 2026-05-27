import { type ChangeEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, AudioLines, Image as ImageIcon, Upload, Film, Settings, 
  Settings2, Palette, Theater, Sparkles, Star, Target, Wand2, Waves, 
  LucideIcon, Clock, Crown, Download, Zap, Layers, X, Check, History,
  Instagram, Video, Youtube, User, ChevronDown, LogOut
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/auth-context";
import { LoginModal } from "../../components/login-modal";
import { Button } from "../../components/ui/button";
import { BrandLogo } from "../../components/brand-logo";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { LoadingModal, type LoadingState } from "../../components/loading-modal";
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
import { buildApiUrl } from "../../../lib/api";
import { buildVideoApiError, parseVideoApiResponse } from "../../../lib/video-response";
import { usePortalTestingContext } from "../../../shared/portal/testing-context";
import { buildPortalRequestHeaders } from "../../../lib/request-context";

const EmojiIcon = ({ icon: Icon, size = "md", className = "" }: { icon: LucideIcon, size?: "sm" | "md" | "lg" | "xl", className?: string }) => {
  const sizeClasses = {
    sm: "w-10 h-10 rounded-xl",
    md: "w-12 h-12 rounded-[1.25rem]",
    lg: "w-16 h-16 rounded-[1.5rem]",
    xl: "w-20 h-20 rounded-[1.75rem]",
  };
  const iconSizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10",
  };
  return (
    <div className={`flex items-center justify-center bg-cyan-950/40 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-colors ${sizeClasses[size]} ${className}`}>
      <Icon className={`${iconSizeClasses[size]} text-cyan-400`} strokeWidth={2.5} />
    </div>
  );
};

export function ImagesToVideoUploadScreen() {
  const navigate = useNavigate();
  const { isLoggedIn, session, logout } = useAuth();
  const { isDeveloperTestMode, usageContext } = usePortalTestingContext();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";
  const [prompt, setPrompt] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(1);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingState, setLoadingState] = useState<LoadingState>(null);
  const [loadingMessage, setLoadingMessage] = useState("");

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [selectedStyle, setSelectedStyle] = useState("Dramatic");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [frameRate, setFrameRate] = useState("30 FPS");
  const [isWatermarkEnabled, setIsWatermarkEnabled] = useState(true);

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
    if (item.tool === 'avatar' && item.config) {
      if (item.config.prompt) setPrompt(item.config.prompt);
      if (item.config.ratio) setSelectedRatio(item.config.ratio);
    }
    setIsHistoryOpen(false);
  };

  const styleOptions = [
    { name: "Dramatic", icon: Theater },
    { name: "Ethereal", icon: Sparkles },
    { name: "Vibrant", icon: Star },
    { name: "Cinematic", icon: Target },
    { name: "Animated", icon: Wand2 },
    { name: "Natural", icon: Waves }
  ];

  const handleMinutesInput = (value: string) => {
    const val = parseInt(value) || 0;
    const minutes = Math.max(0, Math.min(3, val));
    setDurationMinutes(minutes);
    if (minutes === 3) {
      setDurationSeconds(0);
    }
  };

  const handleSecondsInput = (value: string) => {
    if (durationMinutes === 3) {
      setDurationSeconds(0);
      return;
    }
    const val = parseInt(value) || 0;
    setDurationSeconds(Math.max(0, Math.min(59, val)));
  };

  const frameStyleOptions = [
    { label: "16:9", width: 32, height: 18 },
    { label: "9:16", width: 18, height: 32 },
    { label: "4:3", width: 28, height: 21 },
    { label: "3:4", width: 21, height: 28 },
    { label: "1:1", width: 24, height: 24 },
    { label: "4:5", width: 22, height: 28 },
    { label: "2.35:1", width: 36, height: 15 },
  ];

  const handleMediaChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).filter(
      (file: File) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );
    setMediaFiles((prev) => [...prev, ...files]);
  };

  const handleAudioChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const canGenerate = prompt.trim().length > 0 && mediaFiles.length > 0;

  const handleGenerateVideo = async () => {
    if (!canGenerate || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");
    setLoadingState("loading");
    setLoadingMessage("Generating your video...");

    try {
      const totalSeconds = durationMinutes * 60 + durationSeconds;

      const formData = new FormData();
      formData.append("prompt", prompt.trim());
      formData.append("duration", String(totalSeconds));
      formData.append("frame", selectedRatio);

      mediaFiles.forEach((file) => {
        formData.append("media", file);
      });

      if (audioFile) {
        formData.append("audio", audioFile);
      }

      const response = await fetch(buildApiUrl("/api/generate-from-media"), {
        method: "POST",
        body: formData,
        headers: await buildPortalRequestHeaders(usageContext),
      });

      const { data, rawBody, video, message } = await parseVideoApiResponse(response);
      const errorMessage = buildVideoApiError({ response, data, rawBody, message, video });

      if (errorMessage) {
        throw new Error(errorMessage);
      }

      setLoadingState("success");
      setLoadingMessage("Video generated successfully!");

      localStorage.setItem("generatedVideo", video);
      localStorage.removeItem("generatedVideoError");
      if (data.storage) {
        localStorage.setItem("generatedVideoStorage", data.storage);
      } else {
        localStorage.removeItem("generatedVideoStorage");
      }

      setTimeout(() => {
        setLoadingState(null);
        navigate("/images-to-video/preview");
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
      className="min-h-screen font-sans selection:bg-blue-500/30 selection:text-white pb-20 text-white"
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

      <div className="container mx-auto px-4 py-4 max-w-5xl relative z-10">
        <div className="flex justify-between items-center mb-4">
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
                
                <BrandLogo size={48} className="relative z-10" />
              </div>
              <span className="text-xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                VIREONIX<span className="text-cyan-400">.AI</span>
              </span>
            </div>

            <button
              onClick={() => navigate("/features")}
              className="flex items-center gap-2 text-[#94a3b8] hover:text-cyan-400 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-bold uppercase tracking-widest">Back</span>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
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
              <span className="text-xs font-bold uppercase tracking-widest">History</span>
            </button>

            <Dialog open={isAdvancedConfigOpen} onOpenChange={setIsAdvancedConfigOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 transition-all text-[#94a3b8] hover:text-white group shadow-xl">
                  <Settings2 className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                  <span className="text-xs font-bold uppercase tracking-widest">Advanced Config</span>
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
                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                           <Layers className="w-4 h-4" />
                        </div>
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
          </motion.div>
        </div>

        {isDeveloperTestMode && (
          <div className="mb-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
            Internal testing mode active: this workflow will use developer test tagging.
          </div>
        )}

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 bg-[#1a1b2e]/60 backdrop-blur-3xl px-6 py-2 rounded-full border border-cyan-500/20 mb-4 shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-cyan-100 tracking-wide uppercase font-sans tracking-[0.2em]">AI Motion Studio</span>
          </div>

          {/* Header */}
          <motion.div
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-center group"
          >
            <h1 className="text-4xl md:text-5xl font-black mb-2 uppercase tracking-tight drop-shadow-[0_0_15px_rgba(209,250,229,0.3)]">
              <span className="text-[#D1FAE5]">Direct Pic To</span>
              <span className="text-[#94A3B8] ml-3">Video</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide">Transform images into stunning videos in seconds with AI</p>
          </motion.div>
          </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch mb-4">
          {/* Left Column Container */}
          <div className="flex flex-col gap-4 h-full">
            {/* Left Column: Upload Media */}
            <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-[#1a1b2e]/60 backdrop-blur-xl rounded-[1.5rem] shadow-[0_8px_30px_rgba(11,13,31,0.5)] border border-[#3f4a67]/50 p-4 flex flex-col transition-all hover:shadow-[0_8px_30px_rgba(34,211,238,0.1)]"
            >
              <div className="text-lg font-semibold mb-4 text-slate-100 flex items-center gap-3">
                <EmojiIcon icon={Upload} size="sm" /> 
                <span>Upload Your Media</span>
              </div>
              
              <div className="flex flex-col gap-3">
                {/* Visual Media Upload */}
                <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-[#3f4a67]/80 rounded-2xl p-3 min-h-[110px] text-center cursor-pointer transition-all bg-[#2d3142]/40 hover:border-cyan-500/60 hover:bg-cyan-900/10 group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleMediaChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                <EmojiIcon icon={ImageIcon} size="md" className="mb-4 group-hover:scale-110 transition-transform duration-300" />
                <p className="text-lg font-medium mb-1">
                  {mediaFiles.length > 0 ? (
                    <span className="text-blue-400 font-bold">{mediaFiles.length} file(s) selected</span>
                  ) : (
                    "Drag & drop image"
                  )}
                </p>
                <p className="text-slate-400 text-sm mb-1">or click to browse from device</p>
                <p className="text-slate-500 text-xs mt-3 font-mono">PNG, JPG (Max 10MB)</p>
                
                {mediaFiles.length > 0 && (
                  <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-wider hover:bg-cyan-500/20 transition-all pointer-events-none">
                    <span>✏</span>
                    <span>edit</span>
                  </div>
                )}
              </div>

              {/* Audio Upload */}
              <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-[#3f4a67]/60 rounded-2xl p-3 min-h-[90px] text-center cursor-pointer transition-all bg-[#2d3142]/40 hover:border-cyan-500/60 hover:bg-cyan-900/10 group">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <EmojiIcon icon={AudioLines} size="md" className="mb-4 group-hover:scale-110 transition-transform duration-300" />
                <p className="text-lg font-medium mb-1">
                  {audioFile ? (
                    <span className="text-blue-400 font-bold block px-2 truncate max-w-full italic">"{audioFile.name}"</span>
                  ) : (
                    "Add background audio"
                  )}
                </p>
                <p className="text-slate-400 text-sm mb-1">Optional background music</p>
                <p className="text-slate-500 text-xs mt-3 font-mono uppercase tracking-widest">MP3, WAV</p>
              </div>
            </div>
          </motion.div>

            {/* Step 3: Choose Style */}
            <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.3 }}
               className="bg-[#1a1b2e]/60 backdrop-blur-xl rounded-[1.5rem] shadow-[0_8px_30px_rgba(11,13,31,0.5)] border border-[#3f4a67]/50 p-4 transition-all hover:shadow-[0_8px_30px_rgba(34,211,238,0.1)] flex-1"
            >
              <div className="text-lg font-semibold mb-5 text-slate-100 flex items-center gap-3">
                <EmojiIcon icon={Palette} size="sm" /> 
                <span>Choose Style</span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {styleOptions.map((style) => (
                  <div 
                    key={style.name}
                    onClick={() => setSelectedStyle(style.name)}
                    className={`flex flex-col items-center justify-center bg-[#1a1b2e]/80 border rounded-[1rem] p-3 text-center cursor-pointer transition-all ${
                      selectedStyle === style.name 
                        ? "border-cyan-400 bg-cyan-900/30 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]" 
                        : "border-[#3f4a67]/40 hover:border-cyan-500/40 hover:scale-[1.02]"
                    }`}
                  >
                    <EmojiIcon 
                      icon={style.icon} 
                      size="sm" 
                      className={selectedStyle === style.name ? "bg-cyan-500/20 border-cyan-400 w-8 h-8" : "border-slate-600/30 bg-slate-800/40 w-8 h-8"} 
                    />
                    <div className={`mt-2 font-black text-[10px] transition-colors uppercase tracking-widest ${selectedStyle === style.name ? "text-cyan-400" : "text-slate-400"}`}>
                      {style.name}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Configure Settings (Step 2) */}
          <div className="flex flex-col h-full">
            {/* Step 2: Video Specifications */}
            <motion.div
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.2 }}
               className="bg-[#1a1b2e]/60 backdrop-blur-xl rounded-[1.5rem] shadow-[0_8px_30px_rgba(11,13,31,0.5)] border border-[#3f4a67]/50 p-4 transition-all hover:shadow-[0_8px_30px_rgba(34,211,238,0.1)] h-full flex flex-col"
            >
              <div className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-3">
                <EmojiIcon icon={Settings} size="sm" /> 
                <span>Video Specifications</span>
              </div>
              
              <div className="mb-4 flex-1 flex flex-col">
                <label className="block text-slate-400 font-bold mb-2 text-[10px] uppercase tracking-[0.2em]">Prompt</label>
                <div className="relative flex-1 group/prompt min-h-[100px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 rounded-xl opacity-0 group-hover/prompt:opacity-100 transition-opacity duration-500 blur-md pointer-events-none" />
                  <textarea 
                    className="relative w-full h-full p-4 text-sm bg-[#0b0d1f]/80 border border-[#3f4a67]/60 rounded-xl text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 focus:shadow-[0_0_25px_rgba(34,211,238,0.15)] resize-none shadow-inner leading-relaxed" 
                    placeholder="Describe your video in detail here... e.g. 'A futuristic cyberpunk city skyline at sunset, with glowing neon signs and flying cars.'"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                  />
                  {prompt.length > 0 && (
                    <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                      {prompt.length} chars
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-slate-400 font-bold mb-2 text-[10px] uppercase tracking-[0.2em]">Aspect Ratio</label>
                <div className="grid grid-cols-4 gap-3">
                  {frameStyleOptions.map((opt) => (
                    <div 
                      key={opt.label}
                      onClick={() => setAspectRatio(opt.label)}
                      className={`flex flex-col items-center justify-center bg-[#1a1b2e]/40 border rounded-2xl p-4 cursor-pointer transition-all duration-300 group/frame ${
                        aspectRatio === opt.label 
                          ? "border-cyan-400 bg-cyan-900/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                          : "border-[#3f4a67]/40 hover:border-cyan-500/30 hover:bg-[#2d3142]/40"
                      }`}
                    >
                      <div className="h-10 flex items-center justify-center mb-3">
                        <div 
                          style={{ width: opt.width, height: opt.height }}
                          className={`border-2 rounded-[2px] transition-all duration-300 ${
                            aspectRatio === opt.label ? "border-cyan-400" : "border-slate-500/50 group-hover/frame:border-slate-400"
                          }`}
                        />
                      </div>
                      <div className={`text-[11px] font-bold tracking-wider transition-colors ${
                        aspectRatio === opt.label ? "text-cyan-400" : "text-slate-500 group-hover/frame:text-slate-300"
                      }`}>
                        {opt.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="group/input mb-2">
                <label className="block text-slate-400 font-bold mb-2 text-[10px] uppercase tracking-[0.2em]">
                  Runtime Duration
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <div className={`relative bg-[#0b0d1f]/60 border rounded-xl transition-all duration-300 ${
                    durationMinutes > 0 ? "border-cyan-400 bg-cyan-900/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]" : "border-[#3f4a67]/60 group-focus-within/input:border-cyan-400"
                  }`}>
                    <label className="absolute top-2 left-4 text-[7px] uppercase tracking-widest font-black text-slate-500">Minutes</label>
                    <input 
                      type="number"
                      min="0"
                      max="3"
                      value={durationMinutes}
                      onChange={e => handleMinutesInput(e.target.value)}
                      className="w-full pt-6 pb-2 px-4 bg-transparent text-lg font-black text-white outline-none text-left appearance-none"
                    />
                  </div>

                  <div className={`relative bg-[#0b0d1f]/60 border rounded-xl transition-all duration-300 ${
                    durationSeconds > 0 ? "border-cyan-400 bg-cyan-900/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]" : "border-[#3f4a67]/60 group-focus-within/input:border-cyan-400"
                  }`}>
                    <label className="absolute top-2 left-4 text-[7px] uppercase tracking-widest font-black text-slate-500">Seconds</label>
                    <input 
                      type="number"
                      min="0"
                      max="59"
                      value={durationSeconds.toString().padStart(2, '0')}
                      onChange={e => handleSecondsInput(e.target.value)}
                      className="w-full pt-6 pb-2 px-4 bg-transparent text-lg font-black text-white outline-none text-left appearance-none"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Global Column Row: Action */}
        <div className="flex flex-col gap-4 mb-4">
          {/* Action Button Section */}
          <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             className="flex flex-col w-full"
          >
            <motion.button 
              disabled={!canGenerate}
              onClick={() => {
                if (!isLoggedIn) {
                  setIsLoginOpen(true);
                } else {
                  void handleGenerateVideo();
                }
              }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full flex items-center justify-center gap-4 uppercase tracking-[0.25em] font-black bg-gradient-to-r from-[#00b4d8] to-[#01f9ff] text-[#0b0d1f] border-none rounded-2xl py-6 transition-all hover:shadow-[0_0_50px_rgba(0,245,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg overflow-hidden group"
            >
              {/* Continuous Shimmer Light Beam */}
              <motion.div 
                animate={{ left: ["-100%", "200%"] }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  repeatDelay: 1 
                }}
                className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 blur-sm pointer-events-none"
              />
              <Film className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
              GENERATE VIDEO
            </motion.button>
          </motion.div>
        </div>

        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.5 }}
           className="mt-6 text-center text-slate-500 text-[11px] font-medium"
        >
          <p>Processing time ~2-3 minutes</p>
        </motion.div>
      </div>

      {/* Production Settings Modal */}
      <AnimatePresence>
        {showAdvanced && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdvanced(false)}
              className="absolute inset-0 bg-[#0b0d1f]/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#16182c] border border-[#3f4a67]/50 rounded-[2.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              {/* Glow Effect */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full" />
              
              <div className="p-8 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <EmojiIcon icon={Settings2} size="sm" className="bg-cyan-500/10 border-cyan-500/30" />
                    <h2 className="text-2xl font-black uppercase tracking-wider text-slate-100">Production Settings</h2>
                  </div>
                  <button 
                    onClick={() => setShowAdvanced(false)}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1a1b2e] border border-[#3f4a67]/40 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-10">
                  {/* Export Quality */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 text-slate-400">
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Export Quality</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {["720P", "1080P", "4K"].map((q) => (
                        <button
                          key={q}
                          onClick={() => setExportQuality(q)}
                          className={`relative flex flex-col items-center justify-center py-5 rounded-2xl border transition-all duration-300 ${
                            exportQuality === q
                              ? "bg-cyan-500/10 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                              : "bg-[#1a1b2e]/60 border-[#3f4a67]/40 text-slate-500 hover:border-slate-600"
                          }`}
                        >
                          <span className={`text-sm font-black tracking-wider ${exportQuality === q ? "text-cyan-400" : "text-slate-500"}`}>{q}</span>
                          {q === "4K" && (
                            <div className="flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                              <Crown className="w-2.5 h-2.5 text-amber-500" />
                              <span className="text-[7px] font-black uppercase tracking-widest text-amber-500">Premium</span>
                            </div>
                          )}
                          {exportQuality === q && <div className="absolute top-2 right-2"><Check className="w-3 h-3 text-cyan-400" /></div>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frame Rate */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 text-slate-400">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Target Frame Rate</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {["24 FPS", "30 FPS", "60 FPS"].map((fps) => (
                        <button
                          key={fps}
                          onClick={() => setFrameRate(fps)}
                          className={`relative flex flex-col items-center justify-center py-5 rounded-2xl border transition-all duration-300 ${
                            frameRate === fps
                              ? "bg-purple-500/10 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                              : "bg-[#1a1b2e]/60 border-[#3f4a67]/40 text-slate-500 hover:border-slate-600"
                          }`}
                        >
                          <span className={`text-sm font-black tracking-wider ${frameRate === fps ? "text-purple-400" : "text-slate-500"}`}>{fps}</span>
                          {fps === "60 FPS" && (
                            <div className="flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                              <Crown className="w-2.5 h-2.5 text-amber-500" />
                              <span className="text-[7px] font-black uppercase tracking-widest text-amber-500">Premium</span>
                            </div>
                          )}
                          {frameRate === fps && <div className="absolute top-2 right-2"><Check className="w-3 h-3 text-purple-400" /></div>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Watermark Toggle */}
                  <div className="bg-[#1a1b2e]/40 border border-[#3f4a67]/30 rounded-3xl p-5 flex items-center justify-between transition-all hover:bg-[#1a1b2e]/60">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Layers className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-slate-200">Production Watermark</div>
                        <div className="text-[9px] font-medium uppercase tracking-[0.15em] text-slate-500 mt-1">Branded: Vireonix</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <Crown className="w-3 h-3 text-amber-500" />
                        <span className="text-[8px] font-black uppercase tracking-[0.1em] text-amber-500">Premium to remove</span>
                      </div>
                      
                      <button 
                        onClick={() => setIsWatermarkEnabled(!isWatermarkEnabled)}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-500 ${isWatermarkEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
                      >
                        <motion.div 
                          animate={{ x: isWatermarkEnabled ? 30 : 4 }}
                          className="absolute top-1.5 w-4 h-4 bg-white rounded-full shadow-lg"
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Save Button */}
                <div className="mt-12">
                  <motion.button
                    onClick={() => setShowAdvanced(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-5 rounded-2xl bg-[#2d3142] hover:bg-[#3f4a67] border border-[#3f4a67]/50 text-white font-black uppercase tracking-[0.25em] text-sm shadow-xl transition-all"
                  >
                    Save Changes
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        customTitle="Welcome back"
        customMessage="Sign in to continue and create your video."
      />

      <LoadingModal
        state={loadingState}
        message={loadingMessage}
        onDismiss={() => {
          setLoadingState(null);
          setErrorMessage("");
        }}
      />

      <HistoryDialog 
        open={isHistoryOpen} 
        onOpenChange={setIsHistoryOpen}
        onSelect={handleHistorySelect}
        currentTool="avatar"
      />

      <PremiumModal 
        open={isPremiumModalOpen} 
        onOpenChange={setIsPremiumModalOpen}
        feature={premiumFeature}
      />
    </div>
  );
}
