import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router";
import {
  ArrowLeft,
  AudioLines,
  Image as ImageIcon,
  Instagram,
  Sparkles,
  Upload,
  Video,
  Youtube,
  Settings2,
  Music,
  Clock,
  Layout,
  CheckCircle2,
  History,
  Download,
  Zap,
  Palette,
  Timer,
  Crown,
  Layers,
  ExternalLink,
  User,
  ChevronDown,
  LogOut
} from "lucide-react";
import { useAuth } from "../../context/auth-context";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { BrandLogo } from "../../components/brand-logo";
import { CollapsibleCard } from "../../components/ui/collapsible-card";
import { Toggle } from "../../components/ui/toggle";
import { PremiumModal } from "../../components/premium-modal";
import { HistoryDialog, HistoryItem, saveToHistory } from "../../components/history-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";

const ratioOptions = ["16:9", "9:16", "4:3", "3:4", "1:1", "4:5", "2.35:1"];
const ratioPreviewClasses: Record<string, string> = {
  "16:9": "w-10 h-6",
  "9:16": "w-6 h-10",
  "1:1": "w-8 h-8",
  "4:3": "w-9 h-7",
  "3:4": "w-7 h-9",
  "4:5": "w-7 h-9",
  "2.35:1": "w-11 h-5",
};

const getFrameType = (ratio: string) => {
  if (["9:16", "1:1", "4:5"].includes(ratio)) return "Instagram";
  if (["16:9", "2.35:1"].includes(ratio)) return "YouTube";
  return "Social";
};

export function ReferenceVideoSetupScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, session, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";
  const [prompt, setPrompt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(1);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [referenceVideo, setReferenceVideo] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Advanced Studio State
  const [highQuality, setHighQuality] = useState(true);
  const [aiEnhance, setAiEnhance] = useState(false);
  const [removeFlicker, setRemoveFlicker] = useState(true);

  // -- Advanced Config State --
  const [isAdvancedConfigOpen, setIsAdvancedConfigOpen] = useState(false);
  const [exportQuality, setExportQuality] = useState("1080p");
  const [fps, setFps] = useState(60);
  const [watermark, setWatermark] = useState(true);

  // -- History State --
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // -- Premium State --
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState<"watermark" | "4k" | "60fps" | "general">("general");

  const handlePremiumIntercept = (feature: "watermark" | "4k" | "60fps") => {
    setPremiumFeature(feature);
    setIsPremiumModalOpen(true);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    // Logic to reload configuration from history item
    console.log("Loading project from history:", item);
    const { config } = item;
    if (config) {
      if (config.prompt) setPrompt(config.prompt);
      if (config.exportQuality) setExportQuality(config.exportQuality);
      if (config.fps) setFps(config.fps);
      if (config.watermark !== undefined) setWatermark(config.watermark);
      // ... other config mappings
    }
    setIsHistoryOpen(false);
  };

  const imageCount = useMemo(
    () => mediaFiles.filter((file) => file.type.startsWith("image/")).length,
    [mediaFiles]
  );
  const videoCount = useMemo(
    () => mediaFiles.filter((file) => file.type.startsWith("video/")).length,
    [mediaFiles]
  );

  const clampDuration = (minutes: number, seconds: number) => {
    let safeMinutes = Math.max(0, Math.min(3, Math.floor(minutes) || 0));
    let safeSeconds = Math.max(0, Math.min(59, Math.floor(seconds) || 0));
    if (safeMinutes === 3) safeSeconds = 0;
    return { safeMinutes, safeSeconds };
  };

  const handleMinutesInput = (value: string) => {
    const { safeMinutes, safeSeconds } = clampDuration(Number(value) || 0, durationSeconds);
    setDurationMinutes(safeMinutes);
    setDurationSeconds(safeSeconds);
  };

  const handleSecondsInput = (value: string) => {
    const { safeMinutes, safeSeconds } = clampDuration(durationMinutes, Number(value) || 0);
    setDurationMinutes(safeMinutes);
    setDurationSeconds(safeSeconds);
  };

  const handleReferenceVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setReferenceVideo(file);
  };

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const next = Array.from(files).filter(f => f.type.startsWith("image/") || f.type.startsWith("video/"));
    setMediaFiles(prev => [...prev, ...next]);
  };

  const handleAudioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setAudioFile(file);
  };

  const canGenerate = prompt.trim().length > 0 && referenceVideo !== null;

  return (
    <div 
      className="min-h-screen relative overflow-hidden font-sans selection:bg-purple-500/30 selection:text-white pb-12"
      style={{
        background: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 50%, #020617 100%)',
        backgroundAttachment: 'fixed'
      }}
    >

      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate("/video-type")}>
              <BrandLogo size={42} className="relative z-10" />
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter text-white">
                  VEYTRIX<span className="text-purple-400">.AI</span>
                </span>
                <span className="text-[10px] font-bold text-purple-500/60 tracking-[0.3em] uppercase">Studio</span>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-white/10 hidden md:block" />
            <button
              onClick={() => navigate("/features")}
              className="flex items-center gap-2 text-[#94a3b8] hover:text-white transition-all group px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest">Exit Studio</span>
            </button>
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
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <User className="w-3 h-3 text-[#0B1020]" />
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
                      className="absolute right-0 top-full mt-2 w-48 bg-[#0B1020]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
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
                <button
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 transition-all text-[#94a3b8] hover:text-white group shadow-xl"
                >
                  <Settings2 className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Advanced Config</span>
                </button>
              </DialogTrigger>
              <DialogContent className="bg-[#0B1020]/95 backdrop-blur-2xl border-white/10 text-white sm:max-w-[425px] rounded-3xl shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter">
                    <Settings2 className="w-5 h-5 text-purple-400" />
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
                            onClick={() => isPremium ? handlePremiumIntercept("4k") : setExportQuality(res as any)}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex flex-col items-center gap-1 ${
                              exportQuality === res 
                                ? 'bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168, 85, 247,0.2)]' 
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

                  {/* FPS Settings */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Zap className="w-3 h-3" /> Target Frame Rate
                    </label>
                    <div className="flex gap-2">
                      {[24, 30, 60].map((fpsValue) => {
                        const isPremium = fpsValue === 60;
                        return (
                          <button
                            key={fpsValue}
                            onClick={() => isPremium ? handlePremiumIntercept("60fps") : setFps(fpsValue)}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex flex-col items-center gap-1 ${
                              fps === fpsValue
                                ? 'bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168, 85, 247,0.2)]' 
                                : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'
                            }`}
                          >
                            <span>{fpsValue} FPS</span>
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
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Branded: VEYTRIX</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 rounded-md text-amber-500 text-[8px] font-black uppercase tracking-widest">
                           <Crown className="w-3 h-3" />
                           <span>PREMIUM TO REMOVE</span>
                        </div>
                        <button
                          onClick={() => handlePremiumIntercept("watermark")}
                          className={`w-12 h-6 rounded-full relative transition-all bg-purple-600 shadow-[0_0_10px_rgba(168, 85, 247,0.3)]`}
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
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Production Space */}
          <div className="lg:col-span-8 space-y-8">
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1a1b2e]/40 backdrop-blur-3xl rounded-3xl border border-white/10 p-1 shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Video className="w-5 h-5 text-purple-400" />
                      </div>
                      <h2 className="text-xl font-black text-white tracking-tight">Reference Production</h2>
                    </div>
                    {referenceVideo && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Uploaded</span>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="relative group overflow-hidden rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500/50 transition-all duration-500 active:scale-[0.99]">
                    <input type="file" accept="video/*" onChange={handleReferenceVideoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                    <div className="p-12 text-center bg-[#0B1020]/40 group-hover:bg-purple-500/[0.02] transition-colors">
                      <div className="mb-4 relative">
                        <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-2xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Upload className="w-10 h-10 text-purple-400 mx-auto relative z-10 group-hover:translate-y-[-4px] transition-transform" />
                      </div>
                      <p className="text-[#cbd5e1] font-bold text-lg mb-1">
                        {referenceVideo ? referenceVideo.name : "Drop Reference Video"}
                      </p>
                      <p className="text-[#64748b] text-sm font-medium">Click or drag and drop to set visual reference</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-fuchsia-500/10 rounded-lg">
                        <Sparkles className="w-5 h-5 text-fuchsia-400" />
                      </div>
                      <h2 className="text-xl font-black text-white tracking-tight">Creative Prompt</h2>
                    </div>
                    <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">
                      {prompt.length} / 500 characters
                    </div>
                  </div>
                  <div className="relative group">
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the cinematic style, desired changes from the reference, lighting, and visual narrative..."
                      className="min-h-[220px] text-lg leading-relaxed p-6 resize-none rounded-2xl border-white/10 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 bg-[#0B1020]/40 text-white placeholder:text-[#475569] transition-all"
                    />
                    <div className="absolute bottom-4 right-4 text-[#475569] group-focus-within:text-purple-400 transition-colors pointer-events-none">
                      <Layout className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>

          {/* RIGHT COLUMN: Sidebar Configuration */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Project Specs Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#1a1b2e]/60 backdrop-blur-3xl rounded-3xl border border-white/10 p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <Settings2 className="w-5 h-5 text-purple-400" />
                <h3 className="font-black text-white tracking-tight uppercase text-sm">Project Specification</h3>
              </div>

              <div className="space-y-6">
                {/* Frame Style Grid */}
                <div>
                  <label className="block text-[10px] font-black text-[#64748b] mb-4 uppercase tracking-[0.15em]">Frame Style</label>
                  <div className="grid grid-cols-4 gap-2">
                    {ratioOptions.map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setSelectedRatio(ratio)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 ${
                          selectedRatio === ratio
                            ? "bg-purple-500/10 border-purple-500 shadow-[0_0_15px_rgba(168, 85, 247,0.2)]"
                            : "bg-white/5 border-white/5 hover:border-white/20"
                        }`}
                      >
                        <div className={`${ratioPreviewClasses[ratio]} rounded-[1px] border-2 mb-2 ${selectedRatio === ratio ? 'border-purple-400' : 'border-[#475569]/50 transition-colors'}`} />
                        <span className={`text-[9px] font-black tracking-tighter ${selectedRatio === ratio ? 'text-white' : 'text-[#64748b]'}`}>{ratio}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Inputs */}
                <div>
                  <label className="block text-[10px] font-black text-[#64748b] mb-4 uppercase tracking-[0.15em] flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Runtime Duration
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#0B1020]/40 p-3 rounded-2xl border border-white/5 focus-within:border-purple-500/40 transition-colors">
                      <span className="text-[9px] font-black text-[#475569] uppercase mb-1 block">Minutes</span>
                      <input 
                        type="number" 
                        value={durationMinutes} 
                        onChange={(e) => handleMinutesInput(e.target.value)}
                        className="bg-transparent border-none p-0 w-full text-xl font-black text-white focus:ring-0"
                      />
                    </div>
                    <div className="bg-[#0B1020]/40 p-3 rounded-2xl border border-white/5 focus-within:border-purple-500/40 transition-colors">
                      <span className="text-[9px] font-black text-[#475569] uppercase mb-1 block">Seconds</span>
                      <input 
                        type="number" 
                        value={durationSeconds} 
                        onChange={(e) => handleSecondsInput(e.target.value)}
                        className="bg-transparent border-none p-0 w-full text-xl font-black text-white focus:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Assets Collapsible */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <div className="space-y-4">
                <CollapsibleCard title="Assets & Audio" icon={<ImageIcon className="w-4 h-4" />}>
                  <div className="space-y-4">
                    <div className="relative group">
                      <input type="file" multiple accept="image/*,video/*" onChange={handleMediaChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="p-4 rounded-xl border border-white/5 bg-white/5 group-hover:bg-white/10 transition-colors flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg"><ImageIcon className="w-4 h-4 text-purple-400" /></div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">Project Assets</span>
                          <span className="text-[10px] text-[#64748b]">{mediaFiles.length > 0 ? `${mediaFiles.length} files selected` : 'Select reference images'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="relative group">
                      <input type="file" accept="audio/*" onChange={handleAudioChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="p-4 rounded-xl border border-white/5 bg-white/5 group-hover:bg-white/10 transition-colors flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg"><Music className="w-4 h-4 text-purple-400" /></div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">Studio Audio</span>
                          <span className="text-[10px] text-[#64748b] truncate max-w-[150px]">{audioFile ? audioFile.name : 'Select backing track'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleCard>

                <CollapsibleCard title="Expert AI Settings" icon={<Sparkles className="w-4 h-4" />}>
                  <div className="space-y-2 divide-y divide-white/5">
                    <Toggle 
                      enabled={highQuality} 
                      onChange={setHighQuality} 
                      label="Ultra Rendering" 
                      description="Render at 4K resolution with high-bitrate output" 
                    />
                    <Toggle 
                      enabled={aiEnhance} 
                      onChange={setAiEnhance} 
                      label="Neural Enhancement" 
                      description="Use advanced AI models for super-resolution" 
                    />
                    <Toggle 
                      enabled={removeFlicker} 
                      onChange={setRemoveFlicker} 
                      label="Flicker Removal" 
                      description="Stabilize lighting and remove temporal artifacts" 
                    />
                  </div>
                </CollapsibleCard>
              </div>
            </motion.div>

            {/* Final Action Button */}
            <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="pt-4"
            >
              <Button
                onClick={() => {
                  const config = {
                    prompt,
                    duration: durationMinutes * 60 + durationSeconds,
                    aspectRatio: selectedRatio,
                    referenceVideo,
                    mediaFiles,
                    audioFile,
                    exportQuality,
                    fps,
                    watermark,
                    aiSettings: {
                      highQuality,
                      aiEnhance,
                      removeFlicker
                    }
                  };
                  saveToHistory({
                    title: referenceVideo?.name || "Reference Video Studio Project",
                    tool: 'reference-video',
                    config: config
                  });
                  navigate(`${"/reference-video/processing"}${location.search}`, { state: config });
                }}
                disabled={!canGenerate}
                className="w-full h-16 text-lg font-black bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 hover:scale-[1.02] active:scale-[0.98] text-white shadow-[0_8px_30px_rgba(168, 85, 247,0.3)] hover:shadow-[0_12px_40px_rgba(168, 85, 247,0.5)] transition-all rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed border border-purple-400/20"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  <span>GENERATE STUDIO PREVIEW</span>
                </div>
              </Button>
              <p className="text-[10px] text-center text-[#475569] mt-4 uppercase font-bold tracking-[0.2em]">
                Render time estimate: 2-3 minutes
              </p>
            </motion.div>

          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-8 text-[10px] font-extrabold text-[#475569] uppercase tracking-[0.25em]">
            <a href="#" className="hover:text-purple-400 transition-all hover:translate-y-[-1px] active:translate-y-[0px]">Documentation</a>
            <a href="#" className="hover:text-purple-400 transition-all hover:translate-y-[-1px] active:translate-y-[0px]">Studio Support</a>
            <a href="#" className="hover:text-purple-400 transition-all hover:translate-y-[-1px] active:translate-y-[0px]">System Status</a>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-1 w-1 rounded-full bg-purple-500/40" />
            <p className="text-[10px] font-extrabold text-[#475569] uppercase tracking-[0.25em]">
              © 2026 VEYTRIX.AI • PROFESSIONAL PRODUCTION ENGINE
            </p>
          </div>
        </footer>
      </div>

      <HistoryDialog 
        open={isHistoryOpen} 
        onOpenChange={setIsHistoryOpen}
        onSelect={handleHistorySelect}
        currentTool="reference-video"
      />

      <PremiumModal 
        open={isPremiumModalOpen} 
        onOpenChange={setIsPremiumModalOpen}
        feature={premiumFeature}
      />
    </div>
  );
}
