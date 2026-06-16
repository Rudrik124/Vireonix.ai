import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Upload, FileVideo, Sparkles, Video, Clock, History, Settings2, Check, Zap, Download, Layers, ChevronRight, User, ChevronDown, LogOut, Play,
  Battery, Bell, Moon, Monitor, Menu, Dice5, Save, LayoutTemplate, TrendingUp, AlertTriangle, Copy, Trash2, Heart, Info, X, Camera, Palette, Sliders, Activity, Cpu, Music, Mic, Volume2
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { useAuth } from "../../context/auth-context";
import { BrandLogo } from "../../components/brand-logo";
import { Switch } from "../../components/ui/switch";
import { useRedirectParam } from "../../lib/useRedirectParam";

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

const qualityOptions = ["Draft", "Standard", "HD", "Cinema"];

const promptSuggestions = [
  "Keep Camera Motion", "Preserve Subject", "Cinematic Lighting", "Ultra Realistic", "Slow Motion", "Drone Shot", "Golden Hour", "Commercial", "Music Video", "Luxury Ad"
];

const dummyRecent = [
  { id: 1, prompt: "Make the subject a futuristic cyborg...", duration: "10s", created: "10 mins ago", status: "Completed", thumbnail: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=300" },
  { id: 2, prompt: "Change environment to a snowy mountain...", duration: "15s", created: "1 hour ago", status: "Completed", thumbnail: "https://images.unsplash.com/photo-1506744626753-1fa30a006c57?w=300" },
];

export function ReferenceVideoSetupScreen() {
  const navigate = useNavigate();
  const { isLoggedIn, session, logout } = useAuth();
  const redirectTo = useRedirectParam();
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [referenceVideo, setReferenceVideo] = useState<File | null>(null);

  const [selectedDuration, setSelectedDuration] = useState<number | "custom">(10);
  const [customDuration, setCustomDuration] = useState(15);
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [selectedResolution, setSelectedResolution] = useState("1080p");
  const [selectedQuality, setSelectedQuality] = useState("Standard");

  const [referenceStrength, setReferenceStrength] = useState(80);
  const [motionPreservation, setMotionPreservation] = useState(70);
  const [stylePreservation, setStylePreservation] = useState(75);
  const [sceneConsistency, setSceneConsistency] = useState(85);
  const [characterConsistency, setCharacterConsistency] = useState(90);

  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [bgMusic, setBgMusic] = useState<File | null>(null);
  const [voiceover, setVoiceover] = useState<File | null>(null);
  const [sfxToggle, setSfxToggle] = useState(true);
  const [keepOriginalAudio, setKeepOriginalAudio] = useState(false);
  const [muteOriginalAudio, setMuteOriginalAudio] = useState(true);
  const [bgmVolume, setBgmVolume] = useState(50);

  const [isExpertOpen, setIsExpertOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("VEYTRIX Cinema");
  const [randomSeed, setRandomSeed] = useState(true);
  const [seed, setSeed] = useState("");
  const [fps, setFps] = useState("30 FPS");
  const [creativity, setCreativity] = useState(50);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [noiseStrength, setNoiseStrength] = useState(20);
  const [frameInterpolation, setFrameInterpolation] = useState(true);
  const [loopVideo, setLoopVideo] = useState(false);
  const [watermark, setWatermark] = useState(true);
  const [safetyFilter, setSafetyFilter] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setReferenceVideo(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = () => {
    const duration = selectedDuration === "custom" ? customDuration : selectedDuration;
    navigate("/reference-video/processing", {
      state: {
        prompt,
        duration,
        aspectRatio: selectedRatio,
        referenceVideo
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
        <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[30vh] bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-[90px] rotate-[35deg]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[100vw] h-[25vh] bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent blur-[100px] rotate-[-25deg]" />
      </div>
      <div className="fixed top-[5%] left-[5%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-screen" />
      <div className="fixed bottom-[0%] right-[5%] w-[70%] h-[70%] bg-fuchsia-500/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-screen" />

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
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> GPU Online</span>
            <span className="w-px h-3 bg-white/20" />
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400"><Save className="w-3 h-3" /> Auto Saved 1m ago</span>
            <span className="w-px h-3 bg-white/20" />
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-400"><Battery className="w-3 h-3" /> 450 Credits</span>
          </div>

          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all text-slate-300 hover:text-white shadow-lg">
            <History className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-widest hidden sm:inline">History</span>
          </button>
          
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all text-slate-300 hover:text-white shadow-lg">
            <Settings2 className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-widest hidden sm:inline">Advanced Config</span>
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
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 drop-shadow-2xl text-white">Reference Production</h1>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
            Generate cinematic AI videos using a reference video while preserving composition, style, and motion consistency.
          </p>
        </motion.div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative">
          
          {/* LEFT MAIN PANEL */}
          <div className="xl:col-span-7 space-y-6">
            
            {/* Reference Video Upload */}
            <div className="bg-[#10162A]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="flex items-center gap-2 mb-6">
                <FileVideo className="w-5 h-5 text-blue-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Reference Video</h2>
              </div>

              {!referenceVideo ? (
                <div 
                  onDragOver={(e) => e.preventDefault()} 
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 hover:border-purple-500/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-[#050812]/50 hover:bg-purple-500/5"
                >
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Drop Reference Video</h3>
                  <p className="text-xs text-slate-400 mb-4">Click or drag and drop to set visual reference</p>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span>MP4 • MOV • WEBM</span>
                    <span>Max Size: 500MB</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-6 p-4 rounded-2xl border border-white/10 bg-[#050812]/50">
                  <div className="w-full sm:w-48 aspect-video rounded-xl overflow-hidden relative bg-black flex-shrink-0 border border-white/10">
                    <video className="w-full h-full object-cover" src={URL.createObjectURL(referenceVideo)} />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/40"><Play className="w-4 h-4 ml-1" /></button>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-sm font-bold text-white line-clamp-1 mb-2">{referenceVideo.name}</h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                      <span>{(referenceVideo.size / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>MP4</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-colors">Replace Video</button>
                      <button onClick={() => setReferenceVideo(null)} className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold text-red-400 transition-colors">Remove</button>
                    </div>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="video/mp4,video/quicktime,video/webm" onChange={(e) => { if (e.target.files?.length) setReferenceVideo(e.target.files[0]); }} />
            </div>

            {/* Creative Prompt */}
            <div className="bg-[#10162A]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-white">Creative Prompt</h2>
                </div>
                <span className="text-[10px] font-bold text-slate-500 tracking-widest">{prompt.length} / 500 CHARACTERS</span>
              </div>
              
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
                placeholder="Describe how AI should transform the reference while preserving important elements..."
                className="w-full h-32 resize-none bg-[#050812]/50 border border-white/10 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-white placeholder:text-slate-500 mb-4"
              />

              <div className="flex flex-wrap gap-2 mb-6">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[10px] uppercase font-bold tracking-wider transition-colors border border-purple-500/20">✨ Enhance Prompt</button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] uppercase font-bold tracking-wider transition-colors border border-white/5">🎲 Surprise Me</button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] uppercase font-bold tracking-wider transition-colors border border-white/5">📚 Templates</button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] uppercase font-bold tracking-wider transition-colors border border-white/5">⭐ Save Prompt</button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] uppercase font-bold tracking-wider transition-colors border border-white/5">🕒 Prompt History</button>
              </div>

              <div className="space-y-3 mb-6">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Negative Prompt <span className="text-[10px] text-slate-600 ml-2">(Optional)</span></label>
                <Input
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Objects or styles you want AI to avoid..."
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
            
          </div>

          {/* RIGHT SIDEBAR: Project Settings */}
          <div className="xl:col-span-5 space-y-6">
            <div className="bg-[#10162A]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl relative h-full">
              <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                <Settings2 className="w-5 h-5 text-fuchsia-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Project Settings</h2>
              </div>

              {/* Aspect Ratio */}
              <div className="mb-8">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Aspect Ratio</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {frameStyleOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setSelectedRatio(opt.label)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                        selectedRatio === opt.label 
                          ? "bg-fuchsia-500/10 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.2)]" 
                          : "bg-[#050812]/50 border-white/10 hover:border-white/30"
                      }`}
                    >
                      <opt.icon className={`w-4 h-4 mb-1 ${selectedRatio === opt.label ? "text-fuchsia-400" : "text-slate-500"}`} />
                      <span className={`text-[10px] font-bold ${selectedRatio === opt.label ? "text-fuchsia-100" : "text-slate-300"}`}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="mb-8">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {durationOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setSelectedDuration(opt.value as number | "custom")}
                      className={`py-2 rounded-xl border transition-all flex flex-col items-center ${
                        selectedDuration === opt.value 
                          ? "bg-purple-500/10 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                          : "bg-[#050812]/50 border-white/10 hover:border-white/30"
                      }`}
                    >
                      <span className={`text-xs font-bold ${selectedDuration === opt.value ? "text-purple-100" : "text-slate-300"}`}>{opt.label}</span>
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

              {/* Resolution & Quality */}
              <div className="grid sm:grid-cols-2 gap-6 mb-8 border-b border-white/5 pb-8">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Resolution</label>
                  <div className="space-y-2">
                    {resolutionOptions.map(opt => (
                      <button key={opt.label} onClick={() => setSelectedResolution(opt.label)} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${selectedResolution === opt.label ? "bg-white/10 border-white/30" : "bg-transparent border-white/5 hover:bg-white/5"}`}>
                        <span className="text-xs font-bold text-slate-200">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Output Quality</label>
                  <div className="space-y-2">
                    {qualityOptions.map(opt => (
                      <button key={opt} onClick={() => setSelectedQuality(opt)} className={`w-full text-left px-3 py-2 rounded-xl border transition-all ${selectedQuality === opt ? "bg-white/10 border-white/30" : "bg-transparent border-white/5 hover:bg-white/5"}`}>
                        <span className="text-xs font-bold text-slate-200">{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* REFERENCE CONTROL SECTION */}
              <div className="mb-8 border-b border-white/5 pb-8">
                <div className="flex items-center gap-2 mb-6">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Reference Control</h3>
                </div>
                <div className="space-y-5">
                  {[
                    { label: "Reference Strength", val: referenceStrength, set: setReferenceStrength, desc: "Controls how closely output follows reference." },
                    { label: "Motion Preservation", val: motionPreservation, set: setMotionPreservation },
                    { label: "Style Preservation", val: stylePreservation, set: setStylePreservation },
                    { label: "Scene Consistency", val: sceneConsistency, set: setSceneConsistency },
                    { label: "Character Consistency", val: characterConsistency, set: setCharacterConsistency },
                  ].map(slider => (
                    <div key={slider.label}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{slider.label}</span>
                        <span className="text-emerald-400 text-xs font-bold">{slider.val}%</span>
                      </div>
                      {slider.desc && <p className="text-[9px] text-slate-500 mb-2 -mt-1">{slider.desc}</p>}
                      <input type="range" min="0" max="100" value={slider.val} onChange={e => slider.set(Number(e.target.value))} className="w-full accent-emerald-500 h-1.5 bg-white/10 rounded-full appearance-none" />
                    </div>
                  ))}
                </div>
              </div>

              {/* ASSETS & AUDIO */}
              <div className="mb-4 bg-[#050812]/50 border border-white/5 rounded-2xl overflow-hidden">
                <button onClick={() => setIsAssetsOpen(!isAssetsOpen)} className="w-full flex items-center justify-between font-black uppercase tracking-widest text-xs text-white p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2"><Music className="w-4 h-4 text-blue-400" /> Assets & Audio</div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isAssetsOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {isAssetsOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/5">
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Background Music Upload</label>
                          <input type="file" accept="audio/*" className="text-xs text-slate-400 w-full file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Voiceover Upload</label>
                          <input type="file" accept="audio/*" className="text-xs text-slate-400 w-full file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-fuchsia-500/20 file:text-fuchsia-400 hover:file:bg-fuchsia-500/30" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Sound Effects</span>
                          <Switch checked={sfxToggle} onCheckedChange={setSfxToggle} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Keep Original Audio</span>
                          <Switch checked={keepOriginalAudio} onCheckedChange={setKeepOriginalAudio} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Mute Original Audio</span>
                          <Switch checked={muteOriginalAudio} onCheckedChange={setMuteOriginalAudio} />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-2"><span>BGM Volume</span><span className="text-blue-400">{bgmVolume}%</span></div>
                          <input type="range" min="0" max="100" value={bgmVolume} onChange={e => setBgmVolume(Number(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-white/10 rounded-full appearance-none" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* EXPERT AI SETTINGS */}
              <div className="bg-[#050812]/50 border border-white/5 rounded-2xl overflow-hidden">
                <button onClick={() => setIsExpertOpen(!isExpertOpen)} className="w-full flex items-center justify-between font-black uppercase tracking-widest text-xs text-white p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2"><Cpu className="w-4 h-4 text-purple-400" /> Expert AI Settings</div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isExpertOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {isExpertOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/5">
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">AI Model</label>
                          <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none">
                            <option value="VEYTRIX Studio" className="bg-[#0B1020]">VEYTRIX Studio</option>
                            <option value="VEYTRIX Cinema" className="bg-[#0B1020]">VEYTRIX Cinema</option>
                            <option value="VEYTRIX Turbo" className="bg-[#0B1020]">VEYTRIX Turbo</option>
                            <option value="VEYTRIX Realistic" className="bg-[#0B1020]">VEYTRIX Realistic</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Random Seed</span>
                          <Switch checked={randomSeed} onCheckedChange={setRandomSeed} />
                        </div>
                        {!randomSeed && <Input value={seed} onChange={e => setSeed(e.target.value)} placeholder="Manual seed..." className="bg-white/5 border-white/10 text-xs h-8 rounded-lg" />}
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Frame Rate</label>
                          <div className="flex gap-2">
                            {["24 FPS", "30 FPS", "60 FPS"].map(rate => (
                              <button key={rate} onClick={() => setFps(rate)} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${fps === rate ? "bg-purple-500/20 border-purple-500 text-purple-300" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"}`}>{rate}</button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-2"><span>Creativity</span><span className="text-slate-300">{creativity}%</span></div>
                          <input type="range" min="0" max="100" value={creativity} onChange={e => setCreativity(Number(e.target.value))} className="w-full accent-slate-500 h-1.5 bg-white/10 rounded-full appearance-none" />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-2"><span>Guidance Scale</span><span className="text-slate-300">{guidanceScale}</span></div>
                          <input type="range" min="1" max="20" step="0.5" value={guidanceScale} onChange={e => setGuidanceScale(Number(e.target.value))} className="w-full accent-slate-500 h-1.5 bg-white/10 rounded-full appearance-none" />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-2"><span>Noise Strength</span><span className="text-slate-300">{noiseStrength}%</span></div>
                          <input type="range" min="0" max="100" value={noiseStrength} onChange={e => setNoiseStrength(Number(e.target.value))} className="w-full accent-slate-500 h-1.5 bg-white/10 rounded-full appearance-none" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Frame Interpolation</span>
                          <Switch checked={frameInterpolation} onCheckedChange={setFrameInterpolation} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Loop Video</span>
                          <Switch checked={loopVideo} onCheckedChange={setLoopVideo} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Watermark</span>
                          <Switch checked={watermark} onCheckedChange={setWatermark} />
                        </div>
                        <div className="flex items-center justify-between">
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
          <div className="bg-[#10162A]/90 backdrop-blur-3xl border border-purple-500/30 rounded-[2rem] p-6 lg:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.5)] flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/5 to-transparent pointer-events-none" />
            
            <div className="flex flex-wrap items-center gap-6 lg:gap-8 relative z-10 w-full lg:w-auto">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Reference</p>
                <p className="text-sm font-bold text-white">{referenceVideo ? "Ready" : "Missing"}</p>
              </div>
              <div className="w-px h-8 bg-white/10 hidden sm:block" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Ratio & Res</p>
                <p className="text-sm font-bold text-white">{selectedRatio} • {selectedResolution}</p>
              </div>
              <div className="w-px h-8 bg-white/10 hidden sm:block" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Duration</p>
                <p className="text-sm font-bold text-white">{selectedDuration === "custom" ? customDuration : selectedDuration}s</p>
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
                disabled={!referenceVideo}
                className="w-full sm:w-auto px-10 h-16 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-500 hover:opacity-100 hover:scale-105 transition-all text-white font-black tracking-widest border border-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] relative overflow-hidden group mb-3"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_2s_infinite] skew-x-12 pointer-events-none" />
                <span className="flex items-center gap-3 relative z-10 text-sm">
                  <Video className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  GENERATE STUDIO PREVIEW
                </span>
              </Button>
              <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-blue-400" /> Render: 2-3 min</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Battery className="w-3 h-3 text-fuchsia-400" /> 60 Credits</span>
                <span>•</span>
                <span className="text-emerald-400">Queue: Instant</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT FLOATING STATUS CARD */}
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
                    <span className="text-emerald-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/> Online</span>
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

        {/* RECENT STUDIO PROJECTS */}
        <div className="mb-20">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2"><History className="w-4 h-4" /> Recent Studio Projects</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dummyRecent.map(r => (
              <div key={r.id} className="bg-[#10162A]/60 border border-white/5 rounded-2xl overflow-hidden group hover:border-purple-500/30 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                <div className="relative aspect-video overflow-hidden bg-black/50">
                  <img src={r.thumbnail} alt="Thumbnail" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm pointer-events-none">
                    <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform pointer-events-auto"><Play className="w-5 h-5 ml-1" /></button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-slate-200 line-clamp-1 mb-2">{r.prompt}</p>
                  <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-3">
                    <span>{r.duration} • {r.created}</span>
                    <span className="text-purple-400">{r.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-300 transition-colors">Preview</button>
                    <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-slate-300 transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-slate-300 transition-colors"><Download className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded border border-white/5 text-slate-300 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
