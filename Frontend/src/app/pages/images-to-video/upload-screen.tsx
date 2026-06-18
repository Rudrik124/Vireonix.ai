import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Upload, Image as ImageIcon, Sparkles, Video, Clock, History, Settings2, Download, User, ChevronDown, LogOut, Play,
  Battery, Monitor, Save, Copy, Trash2, X, Sliders, Activity, Cpu, Music, Focus, Palette
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { useAuth } from "../../context/auth-context";
import { BrandLogo } from "../../components/brand-logo";
import { Switch } from "../../components/ui/switch";
import { useRedirectParam } from "../../lib/useRedirectParam";
import { type HistoryItem } from "../../components/history-dialog";

const frameStyleOptions = [
  { label: "16:9", ratio: "YouTube", icon: Monitor },
  { label: "9:16", ratio: "TikTok/Reels", icon: Monitor },
  { label: "1:1", ratio: "Instagram", icon: Monitor },
  { label: "4:3", ratio: "Standard", icon: Monitor },
  { label: "3:4", ratio: "Portrait", icon: Monitor },
  { label: "21:9", ratio: "Ultrawide", icon: Monitor },
];

const durationOptions = [
  { label: "5 sec", value: 5, credits: 5 },
  { label: "10 sec", value: 10, credits: 10 },
  { label: "15 sec", value: 15, credits: 15 },
  { label: "30 sec", value: 30, credits: 30 },
  { label: "60 sec", value: 60, credits: 60 },
  { label: "Custom", value: "custom", credits: 0 },
];

const resolutionOptions = [
  { label: "720p", time: "~1m" },
  { label: "1080p", time: "~2m" },
  { label: "2K", time: "~4m" },
  { label: "4K", time: "~8m" },
];

const cameraMovements = [
  "Static", "Pan", "Zoom In", "Zoom Out", "Orbit", "Tracking", "Drone"
];

const styleOptions = [
  "Realistic", "Cinematic", "Dramatic", "Natural", "Anime", "Commercial", "Luxury", "Fantasy"
];

const promptSuggestions = [
  "Slow Camera", "Drone Shot", "Cinematic Lighting", "Volumetric Fog", "Ultra Realistic", "Golden Hour", "Luxury Commercial", "Nature Motion", "Product Showcase", "Soft Camera"
];

const dummyRecent = [
  { id: 1, prompt: "Cyberpunk street bustling with neon...", duration: "10s", resolution: "4K", created: "10 mins ago", status: "Completed", thumbnail: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=300" },
  { id: 2, prompt: "Foggy ancient forest awakening...", duration: "15s", resolution: "1080p", created: "1 hour ago", status: "Completed", thumbnail: "https://images.unsplash.com/photo-1506744626753-1fa30a006c57?w=300" },
];

export function ImagesToVideoUploadScreen() {
  const navigate = useNavigate();
  const { isLoggedIn, session, logout, profile } = useAuth();
  const redirectTo = useRedirectParam();
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";

  const [recentGenerations, setRecentGenerations] = useState<HistoryItem[]>([]);

  const loadRecentGenerations = () => {
    try {
      const saved = localStorage.getItem('veytrix_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter((item: HistoryItem) => item.tool === 'image-to-video');
        setRecentGenerations(filtered.slice(0, 4));
      }
    } catch (e) {}
  };

  React.useEffect(() => {
    loadRecentGenerations();
  }, []);

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");

  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [optionalAudio, setOptionalAudio] = useState<File | null>(null);
  const [audioVolume, setAudioVolume] = useState(50);
  const [selectedStyle, setSelectedStyle] = useState("Cinematic");

  const [selectedDuration, setSelectedDuration] = useState<number | "custom">(10);
  const [customDuration, setCustomDuration] = useState(15);
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [selectedResolution, setSelectedResolution] = useState("1080p");

  const [motionIntensity, setMotionIntensity] = useState(60);
  const [cameraMovementVal, setCameraMovementVal] = useState(50);
  const [imagePreservation, setImagePreservation] = useState(85);
  const [creativity, setCreativity] = useState(70);

  const [selectedCamera, setSelectedCamera] = useState("Static");

  const [isExpertOpen, setIsExpertOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const [selectedModel, setSelectedModel] = useState("VEYTRIX Cinema");
  const [randomSeed, setRandomSeed] = useState(true);
  const [seed, setSeed] = useState("");
  const [fps, setFps] = useState("30 FPS");
  const [watermark, setWatermark] = useState(true);
  const [safetyFilter, setSafetyFilter] = useState(true);
  const [loopVideo, setLoopVideo] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setReferenceImage(e.dataTransfer.files[0]);
    }
  };

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setOptionalAudio(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = () => {
    const duration = selectedDuration === "custom" ? customDuration : selectedDuration;
    // Route to the existing processing screen
    navigate("/images-to-video/processing", {
      state: {
        prompt,
        duration,
        aspectRatio: selectedRatio,
        mediaFiles: referenceImage ? [referenceImage] : []
      }
    });
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans selection:bg-purple-500/30 selection:text-white pb-20 flex flex-col text-slate-200"
      style={{
        background: 'linear-gradient(135deg, #050812 0%, #0d1222 30%, #171d33 60%, #1f2540 85%, #0d1222 100%)',
        backgroundAttachment: 'fixed'
      }}>

      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen opacity-20">
        <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[30vh] bg-gradient-to-r from-transparent via-blue-500 to-transparent blur-[90px] rotate-[35deg]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[100vw] h-[25vh] bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-[100px] rotate-[-25deg]" />
      </div>
      <div className="fixed top-[5%] left-[5%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-screen" />
      <div className="fixed bottom-[0%] right-[5%] w-[70%] h-[70%] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-screen" />

      {/* HEADER */}
      <div className="pt-6 px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-50 w-full mb-8 border-b border-white/5 pb-6 bg-[#050812]/40 backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate(redirectTo || '/features')}>
            <BrandLogo size={42} className="relative z-10" />
            <span className="text-xl font-black tracking-tight text-white group-hover:text-purple-400 transition-colors">
              VEYTRIX<span className="text-purple-500">.AI</span> <span className="text-sm text-slate-400 ml-2 font-medium tracking-widest uppercase">Studio</span>
            </span>
          </motion.div>
          <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} onClick={() => navigate(redirectTo || '/features')} className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-white transition-colors ml-[54px]">
            <ArrowLeft className="w-3 h-3" /> Exit Studio
          </motion.button>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
          <div className="hidden lg:flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mr-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-400"><Battery className="w-3.5 h-3.5" /> {profile?.credits?.userCredits ?? 0} Credits</span>
          </div>

          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all text-slate-300 hover:text-white shadow-lg">
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
          ) : null}
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10 flex flex-col flex-1">

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-4 py-1.5 rounded-full mb-4 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-bold text-blue-200 tracking-[0.2em] uppercase">AI Motion Studio</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 drop-shadow-2xl text-white">Direct Image to Video</h1>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
            Transform a single image into cinematic AI-generated videos with realistic motion and professional quality.
          </p>
        </motion.div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative">

          {/* LEFT PANEL */}
          <div className="xl:col-span-5 space-y-6">

            {/* Media Upload */}
            <div className="bg-[#10162A]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="flex items-center gap-2 mb-6">
                <ImageIcon className="w-5 h-5 text-blue-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Media Upload</h2>
              </div>

              {!referenceImage ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 hover:border-blue-500/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-[#050812]/50 hover:bg-blue-500/5"
                >
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Drag & Drop</h3>
                  <p className="text-xs text-slate-400 mb-4">Click or drag and drop to browse files</p>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span>PNG • JPG • WEBP</span>
                    <span>Max Size: 20MB</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 p-4 rounded-2xl border border-white/10 bg-[#050812]/50">
                  <div className="w-full aspect-video rounded-xl overflow-hidden relative bg-black flex-shrink-0 border border-white/10 group/img">
                    <img className="w-full h-full object-cover" src={URL.createObjectURL(referenceImage)} alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/40"><Focus className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="text-sm font-bold text-white line-clamp-1 mb-2">{referenceImage.name}</h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                      <span>{(referenceImage.size / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>IMAGE</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-colors border border-white/5">Replace Image</button>
                      <button onClick={() => setReferenceImage(null)} className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/png,image/jpeg,image/webp" onChange={(e) => { if (e.target.files?.length) setReferenceImage(e.target.files[0]); }} />
            </div>

            {/* Optional Audio */}
            <div className="bg-[#10162A]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="flex items-center gap-2 mb-6">
                <Music className="w-5 h-5 text-fuchsia-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Optional Audio</h2>
              </div>

              {!optionalAudio ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleAudioDrop}
                  onClick={() => audioInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 hover:border-fuchsia-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-[#050812]/50 hover:bg-fuchsia-500/5"
                >
                  <Music className="w-6 h-6 text-fuchsia-400 mb-2" />
                  <p className="text-xs font-bold text-white mb-1">Upload Background Audio</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">MP3 • WAV</p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-[#050812]/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-fuchsia-500/10 flex items-center justify-center">
                      <Music className="w-4 h-4 text-fuchsia-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white line-clamp-1">{optionalAudio.name}</h3>
                      <p className="text-[9px] uppercase tracking-widest text-slate-400">{(optionalAudio.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button onClick={() => setOptionalAudio(null)} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                </div>
              )}
              {optionalAudio && (
                <div className="mt-4 px-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-2"><span>Volume</span><span className="text-fuchsia-400">{audioVolume}%</span></div>
                  <input type="range" min="0" max="100" value={audioVolume} onChange={e => setAudioVolume(Number(e.target.value))} className="w-full accent-fuchsia-500 h-1.5 bg-white/10 rounded-full appearance-none" />
                </div>
              )}
              <input type="file" ref={audioInputRef} className="hidden" accept="audio/mp3,audio/wav" onChange={(e) => { if (e.target.files?.length) setOptionalAudio(e.target.files[0]); }} />
            </div>

            {/* Style Selection */}
            <div className="bg-[#10162A]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <Palette className="w-5 h-5 text-purple-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Style Selection</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {styleOptions.map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`py-3 rounded-xl border transition-all ${selectedStyle === style
                        ? "bg-purple-500/10 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)] text-purple-100"
                        : "bg-[#050812]/50 border-white/10 hover:border-white/30 text-slate-300 hover:text-white"
                      } text-xs font-bold uppercase tracking-wider`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: Video Configuration */}
          <div className="xl:col-span-7 space-y-6">
            <div className="bg-[#10162A]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl relative h-full">
              <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                <Settings2 className="w-5 h-5 text-purple-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Video Configuration</h2>
              </div>

              {/* Prompt Studio */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Prompt</label>
                  <span className="text-[10px] font-bold text-slate-500 tracking-widest">{prompt.length} / 500</span>
                </div>

                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
                  placeholder="Describe how you want the image to come alive with motion, camera movement, atmosphere, and cinematic effects..."
                  className="w-full h-32 resize-none bg-[#050812]/50 border border-white/10 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-white placeholder:text-slate-500 mb-4"
                />

                <div className="flex flex-wrap gap-2 mb-6">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[10px] uppercase font-bold tracking-wider transition-colors border border-purple-500/20">✨ Enhance Prompt</button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] uppercase font-bold tracking-wider transition-colors border border-white/5">🎲 Surprise Me</button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] uppercase font-bold tracking-wider transition-colors border border-white/5">📚 Templates</button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] uppercase font-bold tracking-wider transition-colors border border-white/5">⭐ Save Prompt</button>
                </div>

                <div className="space-y-3 mb-6">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Negative Prompt <span className="text-slate-600 ml-1">(Optional)</span></label>
                  <Input
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="Things to avoid in the generated video..."
                    className="bg-[#050812]/50 border-white/10 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Prompt Suggestions</label>
                  <div className="flex flex-wrap gap-2">
                    {promptSuggestions.map(s => (
                      <button key={s} onClick={() => setPrompt(p => p + (p ? ", " : "") + s)} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300 hover:bg-white/10 hover:border-white/20 transition-all font-medium whitespace-nowrap">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="mb-8 border-t border-white/5 pt-8">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Aspect Ratio</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {frameStyleOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setSelectedRatio(opt.label)}
                      className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${selectedRatio === opt.label
                          ? "bg-purple-500/10 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                          : "bg-[#050812]/50 border-white/10 hover:border-white/30"
                        }`}
                    >
                      <span className={`text-xs font-black ${selectedRatio === opt.label ? "text-purple-100" : "text-slate-300"}`}>{opt.label}</span>
                      <span className={`text-[8px] uppercase tracking-widest mt-1 ${selectedRatio === opt.label ? "text-purple-400" : "text-slate-500"}`}>{opt.ratio}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration & Resolution */}
              <div className="grid sm:grid-cols-2 gap-8 mb-8 border-b border-white/5 pb-8">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {durationOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setSelectedDuration(opt.value as number | "custom")}
                        className={`py-2 rounded-xl border transition-all flex flex-col items-center ${selectedDuration === opt.value
                            ? "bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                            : "bg-[#050812]/50 border-white/10 hover:border-white/30"
                          }`}
                      >
                        <span className={`text-xs font-bold ${selectedDuration === opt.value ? "text-blue-100" : "text-slate-300"}`}>{opt.label}</span>
                        {opt.credits > 0 && <span className="text-[9px] text-slate-500 mt-0.5">{opt.credits} Credits</span>}
                      </button>
                    ))}
                  </div>
                  {selectedDuration === "custom" && (
                    <div className="mt-3">
                      <Input type="number" value={customDuration} onChange={e => setCustomDuration(Number(e.target.value))} className="bg-[#050812]/50 border-white/10 w-full" placeholder="Enter custom seconds" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Resolution</label>
                  <div className="grid grid-cols-2 gap-2">
                    {resolutionOptions.map(opt => (
                      <button key={opt.label} onClick={() => setSelectedResolution(opt.label)} className={`py-2 rounded-xl border transition-all ${selectedResolution === opt.label ? "bg-white/10 border-white/30" : "bg-[#050812]/50 border-white/10 hover:border-white/30"}`}>
                        <span className="text-xs font-bold text-slate-200">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* MOTION CONTROLS */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Motion Controls</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 mb-6">
                  {[
                    { label: "Motion Intensity", val: motionIntensity, set: setMotionIntensity },
                    { label: "Camera Movement", val: cameraMovementVal, set: setCameraMovementVal },
                    { label: "Image Preservation", val: imagePreservation, set: setImagePreservation },
                    { label: "Creativity", val: creativity, set: setCreativity },
                  ].map(slider => (
                    <div key={slider.label}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{slider.label}</span>
                        <span className="text-emerald-400 text-xs font-bold">{slider.val}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={slider.val} onChange={e => slider.set(Number(e.target.value))} className="w-full accent-emerald-500 h-1.5 bg-white/10 rounded-full appearance-none" />
                    </div>
                  ))}
                </div>

                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Camera Movement</label>
                <div className="flex flex-wrap gap-2">
                  {cameraMovements.map(cam => (
                    <button
                      key={cam}
                      onClick={() => setSelectedCamera(cam)}
                      className={`px-4 py-2 rounded-xl border transition-all text-xs font-bold ${selectedCamera === cam
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                          : "bg-[#050812]/50 border-white/10 text-slate-400 hover:text-white hover:border-white/30"
                        }`}
                    >
                      {cam}
                    </button>
                  ))}
                </div>
              </div>

              {/* EXPERT AI SETTINGS */}
              <div className="bg-[#050812]/50 border border-white/5 rounded-2xl overflow-hidden mt-8">
                <button onClick={() => setIsExpertOpen(!isExpertOpen)} className="w-full flex items-center justify-between font-black uppercase tracking-widest text-xs text-white p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2"><Cpu className="w-4 h-4 text-purple-400" /> Advanced Settings</div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isExpertOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {isExpertOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/5">
                      <div className="p-4 space-y-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">AI Model</label>
                          <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none">
                            <option value="VEYTRIX Turbo" className="bg-[#0B1020]">VEYTRIX Turbo</option>
                            <option value="VEYTRIX Motion" className="bg-[#0B1020]">VEYTRIX Motion</option>
                            <option value="VEYTRIX Cinema" className="bg-[#0B1020]">VEYTRIX Cinema</option>
                            <option value="VEYTRIX Realistic" className="bg-[#0B1020]">VEYTRIX Realistic</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Random Seed</span>
                            <Switch checked={randomSeed} onCheckedChange={setRandomSeed} />
                          </div>
                          {!randomSeed && <Input value={seed} onChange={e => setSeed(e.target.value)} placeholder="Manual seed..." className="bg-white/5 border-white/10 text-xs h-10 rounded-xl" />}
                        </div>
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Loop Video</span>
                            <Switch checked={loopVideo} onCheckedChange={setLoopVideo} />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Frame Rate</label>
                          <div className="flex gap-2">
                            {["24 FPS", "30 FPS", "60 FPS"].map(rate => (
                              <button key={rate} onClick={() => setFps(rate)} className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${fps === rate ? "bg-purple-500/20 border-purple-500 text-purple-300" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"}`}>{rate}</button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Watermark</span>
                          <Switch checked={watermark} onCheckedChange={setWatermark} />
                        </div>
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Safety Filter</span>
                          <Switch checked={safetyFilter} onCheckedChange={setSafetyFilter} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </div>

        {/* PROJECT SUMMARY & GENERATE CARD */}
        <div className="mt-8 mb-12 relative z-20">
          <div className="bg-[#10162A]/90 backdrop-blur-3xl border border-blue-500/30 rounded-[2rem] p-6 lg:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.5)] flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent pointer-events-none" />

            <div className="flex flex-wrap items-center gap-6 lg:gap-8 relative z-10 w-full lg:w-auto">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Uploaded Image</p>
                <p className="text-sm font-bold text-white">{referenceImage ? "Ready" : "Missing"}</p>
              </div>
              <div className="w-px h-8 bg-white/10 hidden sm:block" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Style</p>
                <p className="text-sm font-bold text-white">{selectedStyle}</p>
              </div>
              <div className="w-px h-8 bg-white/10 hidden sm:block" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Duration & Res</p>
                <p className="text-sm font-bold text-white">{selectedDuration === "custom" ? customDuration : selectedDuration}s • {selectedResolution}</p>
              </div>
              <div className="w-px h-8 bg-white/10 hidden lg:block" />
              <div className="hidden lg:block">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">AI Model</p>
                <p className="text-sm font-bold text-white">{selectedModel}</p>
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-end w-full lg:w-auto z-10">
              <Button
                onClick={handleGenerate}
                disabled={!referenceImage}
                className="w-full sm:w-auto px-10 h-16 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-500 to-blue-500 hover:opacity-100 hover:scale-105 transition-all text-white font-black tracking-widest border border-blue-400/50 shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_50px_rgba(59,130,246,0.6)] relative overflow-hidden group mb-3 disabled:opacity-50 disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_2s_infinite] skew-x-12 pointer-events-none" />
                <span className="flex items-center gap-3 relative z-10 text-sm">
                  <Video className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  GENERATE VIDEO
                </span>
              </Button>
              <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-blue-400" /> Est. Time: 2-3 min</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Battery className="w-3 h-3 text-fuchsia-400" /> 45 Credits Required</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT FLOATING STATUS CARD (Minimized by Default) */}
        <div className="fixed top-32 right-6 z-40 hidden xl:flex flex-col items-end pointer-events-none">
          <AnimatePresence mode="wait">
            {!isStatusOpen ? (
              <motion.button
                key="minimized"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => setIsStatusOpen(true)}
                className="w-12 h-12 rounded-full bg-[#10162A]/90 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center justify-center text-slate-400 hover:text-white hover:border-purple-500/50 hover:bg-purple-500/10 transition-all pointer-events-auto"
              >
                <Activity className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.div
                key="expanded"
                initial={{ x: 50, opacity: 0, scale: 0.9 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: 50, opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-[#10162A]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] w-64 pointer-events-auto origin-top-right"
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">System Status</span>
                  </div>
                  <button onClick={() => setIsStatusOpen(false)} className="text-slate-500 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-4 text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">GPU Cluster</span>
                    <span className="text-emerald-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">AI Engine</span>
                    <span className="text-blue-400">Ready</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Storage</span>
                    <span className="text-slate-300">45 GB Available</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Credits</span>
                    <span className="text-amber-400">450</span>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Current Queue</span>
                      <span>0 Jobs</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RECENT CREATIONS */}
        <div className="mb-20">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2"><History className="w-4 h-4" /> Recent Creations</h3>
          {recentGenerations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-[#10162A]/60 border border-white/5 rounded-3xl opacity-60">
              <History className="w-12 h-12 text-slate-500 mb-4" />
              <p className="text-sm font-black uppercase tracking-widest text-slate-400">No recent projects</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-2">Start creating to see your history here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentGenerations.map(r => (
                <div key={r.id} className="cursor-pointer bg-[#10162A]/60 border border-white/5 rounded-2xl overflow-hidden group hover:border-blue-500/30 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] flex flex-col">
                  <div className="relative aspect-video overflow-hidden bg-black/80 flex items-center justify-center">
                    <Video className="w-8 h-8 text-white/20 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm pointer-events-none">
                      <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform pointer-events-auto"><Play className="w-5 h-5 ml-1" /></button>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-sm font-medium text-slate-200 line-clamp-1 mb-2 flex-1">{r.title}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-auto">
                      <span>{r.config?.quality || '1080p'} • {r.config?.duration || '10'}s</span>
                      <span>{new Date(r.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
