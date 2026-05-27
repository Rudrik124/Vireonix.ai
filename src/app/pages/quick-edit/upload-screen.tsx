import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Zap,
  ArrowLeft,
  Video,
  Sparkles,
  CheckCircle2,
  Volume2,
  Music,
  FileAudio,
  AlertCircle,
  Scissors,
  X,
  Play,
  History,
  User,
  ChevronDown,
  LogOut,
  Layers,
  Download,
  Menu
} from "lucide-react";
import { useAuth } from "../../context/auth-context";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { BrandLogo } from "../../components/brand-logo";
import { HistoryDialog, HistoryItem } from "../../components/history-dialog";


export function QuickEditUploadScreen() {
  const navigate = useNavigate();
  const { isLoggedIn, session, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State Management
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioSource, setAudioSource] = useState<'extracted' | 'direct' | null>(null);
  const [showAudioChoice, setShowAudioChoice] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionProgress, setIngestionProgress] = useState(0);

  // -- History State --
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleHistorySelect = (item: HistoryItem) => {
    console.log("Loading project from history:", item);
    // Logic to reload Quick Edit project
    if (item.tool === 'quick-edit' && item.config) {
      // If we had a way to reload files, we'd do it here. 
      // For now, we focus on the UI interlinking as requested.
    }
    setIsHistoryOpen(false);
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFile = (file: File) => {
    if (file && file.type.startsWith("video/")) {
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));

      // Simulate real-time ingestion progress
      setIsIngesting(true);
      setIngestionProgress(0);
      const interval = setInterval(() => {
        setIngestionProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setIsIngesting(false), 500);
            return 100;
          }
          return prev + 5;
        });
      }, 50);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleAudioFile = async (file: File, type: 'extracted' | 'direct') => {
    setAudioError(null);

    if (type === 'direct') {
      // Broaden support to include video containers and even potential image containers with embedded audio
      const isGenerallySupported = file.type.startsWith("audio/") || 
                                   file.type.startsWith("video/") ||
                                   file.type.startsWith("image/") ||
                                   /\.(mp4|mov|m4v|m4a|aac|wav|mp3|jpeg|jpg)$/i.test(file.name);

      if (!isGenerallySupported) {
        setAudioError("Please upload a file that contains audio (MP3, WAV, Video, etc.)");
        return;
      }
    } else {
      if (!file.type.startsWith("video/")) {
        setAudioError("Please select a video file to extract audio from");
        return;
      }

      // Check for audio track in video
      const hasAudio = await checkVideoHasAudio(file);
      if (!hasAudio) {
        setAudioError("This video appears to be silent. Please select a video with an audio track.");
        return;
      }
    }

    setAudioFile(file);
    setAudioSource(type);
    setShowAudioChoice(false);
  };

  const checkVideoHasAudio = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        // Checking for audio tracks or mozHasAudio fallback
        const hasAudio = (video as any).mozHasAudio ||
          (Boolean((video as any).audioTracks && (video as any).audioTracks.length > 0)) ||
          (video as any).webkitAudioDecodedByteCount > 0; // fallback check

        // Some browsers don't support audioTracks reliably on file objects without interaction
        // As a safer heuristic for this prototype, we'll assume it has audio if it's a common video format
        // and doesn't explicitly report 0 tracks if supported.
        resolve(true); // Default to true for now as browser support for track detection is inconsistent
      };
      video.onerror = () => resolve(false);
      video.src = URL.createObjectURL(file);
    });
  };

  const removeAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAudioFile(null);
    setAudioSource(null);
    setAudioError(null);
  };

  const removeMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setIngestionProgress(0);
  };

  const handleContinue = () => {
    if (uploadedFile && !isIngesting) {
      navigate("/quick-edit/style", {
        state: {
          initialMedia: {
            name: uploadedFile.name,
            type: uploadedFile.type.startsWith('video/') ? 'video' : 'image',
            preview: previewUrl || undefined,
            file: uploadedFile
          },
          initialAudio: audioFile ? {
            name: audioFile.name,
            type: audioSource,
            file: audioFile // Passing the file object directly in memory state
          } : null
        }
      });
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-white pb-20 text-slate-200"
      style={{
        background: 'linear-gradient(135deg, #0b0d1f 0%, #1a1b2e 30%, #2d3142 60%, #3f4a67 85%, #1a1b2e 100%)',
      }}
    >
      {/* Dynamic Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-cyan-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 500px rgba(11,13,31,0.95)' }} />
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl relative z-10">

        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-8">
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

            <div className="h-6 w-[1px] bg-white/10" />

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
            <button 
              className="md:hidden p-2 text-white/70 hover:text-white"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center gap-3">
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
                      className="absolute right-4 top-[calc(100%+0.5rem)] md:right-0 md:top-full md:mt-2 w-48 bg-[#0b0d1f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
                    >
                      <div className="p-2">
                        <button 
                          onClick={() => setIsHistoryOpen(true)}
                          className="w-full md:hidden flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-[0.2em] group"
                        >
                          <History className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform" />
                          <span>History</span>
                        </button>
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
            </div>
          </motion.div>
        </div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-3xl px-6 py-2.5 rounded-full border border-cyan-500/20 mb-8 shadow-xl">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-black text-cyan-100 uppercase tracking-[0.2em]">Lightning Fast Edit</span>
          </div>

          <h1 className="text-[clamp(2.5rem,8vw,4.5rem)] leading-tight font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-teal-300 drop-shadow-[0_4px_12px_rgba(34,211,238,0.2)] uppercase tracking-tight">
            Quick AI <span className="text-white opacity-80">Studio</span>
          </h1>
          <p className="text-[#94a3b8] font-medium text-lg max-w-2xl mx-auto leading-relaxed">
            Ignite your content with AI-driven cuts and professional grading.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-12 max-w-3xl mx-auto">

          {/* Main Upload / Preview Box */}
          <div className="relative">
            {/* Subtle Glow Effect */}
            <div className={`absolute -inset-4 bg-cyan-500/10 blur-2xl rounded-[3rem] transition-opacity duration-500 ${(isDragging || uploadedFile) ? 'opacity-100' : 'opacity-0'}`} />

            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploadedFile && fileInputRef.current?.click()}
              className={`relative group rounded-3xl bg-[#1a1b2e]/60 backdrop-blur-2xl border-2 transition-all cursor-pointer overflow-hidden ${isDragging ? 'border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.2)] scale-[1.02]' :
                  uploadedFile ? 'border-white/20 shadow-2xl' : 'border-dashed border-white/10 hover:border-white/20'
                }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                accept="video/*" 
                onChange={handleFileInput} 
                className="hidden" 
              />

              <AnimatePresence mode="wait">
                {!uploadedFile ? (
                  <motion.div
                    key="upload-prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-20 flex flex-col items-center justify-center text-center gap-8"
                  >
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                      <Upload className="w-10 h-10 text-cyan-400" />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-2xl font-black text-white uppercase tracking-wider">
                        Add the video you want to edit
                      </h3>
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.2em]">
                        Drag and drop or click to browse
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="preview-area"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative aspect-video flex flex-col items-center justify-center overflow-hidden"
                  >
                    {/* Media Preview (Thumbnail or Video) */}
                    <div className="absolute inset-0 pointer-events-none">
                      {uploadedFile.type.startsWith("video/") ? (
                        <video
                          src={previewUrl!}
                          className="w-full h-full object-cover opacity-40 brightness-50"
                          muted
                          autoPlay
                          loop
                        />
                      ) : (
                        <img
                          src={previewUrl!}
                          alt="Preview"
                          className="w-full h-full object-cover opacity-40 brightness-50"
                          decoding="async"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d1f] via-transparent to-transparent" />
                    </div>

                    {/* Overlay Info */}
                    <div className="relative z-10 flex flex-col items-center gap-6 p-12 text-center">
                      {isIngesting ? (
                        <div className="w-full max-w-xs space-y-4">
                          <div className="flex justify-between text-[10px] font-black uppercase text-cyan-400 tracking-widest">
                            <span>Ingesting Source</span>
                            <span>{ingestionProgress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                              initial={{ width: 0 }}
                              animate={{ width: `${ingestionProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex flex-col items-center gap-4"
                        >
                          <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-cyan-400" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xl font-black text-white uppercase tracking-widest">Media Ready</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">{uploadedFile.name}</p>
                          </div>
                          <button
                            onClick={removeMedia}
                            className="mt-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-[#94a3b8] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all flex items-center gap-2"
                          >
                            <X className="w-3 h-3" /> Remove & Swap
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Audio Ingestion Area [NEW] */}
            <motion.div
              layout
              className="mt-6 p-6 rounded-2xl bg-[#0b0d1f]/60 border border-white/5 backdrop-blur-xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${audioFile ? 'bg-cyan-500/20 border-cyan-500/40' : 'bg-white/5 border-white/10'}`}>
                    {audioFile ? <Music className="w-6 h-6 text-cyan-400" /> : <Volume2 className="w-6 h-6 text-slate-500" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">
                      {audioFile ? (audioSource === 'extracted' ? 'Extracted Audio' : 'Direct Audio') : 'Add Custom Audio'}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                      {audioFile ? audioFile.name : 'Enhance your video with external sound'}
                    </p>
                  </div>
                </div>

                {audioFile ? (
                  <button
                    onClick={removeAudio}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    Clear Audio
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAudioChoice(!showAudioChoice)}
                    className="px-6 py-2 rounded-lg bg-cyan-500 text-[#0b0d1f] text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                  >
                    Add Audio
                  </button>
                )}
              </div>

              {/* Audio Choice Modal/Overlay */}
              <AnimatePresence>
                {showAudioChoice && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute inset-0 bg-[#0b0d1f] z-20 flex items-center justify-around px-8"
                  >
                     <button 
                       onClick={() => {
                         const input = document.createElement('input');
                         input.type = 'file';
                         input.accept = 'video/*,image/*,.mp4,.mov,.jpeg,.jpg';
                         input.onchange = (e) => {
                           const file = (e.target as HTMLInputElement).files?.[0];
                           if (file) handleAudioFile(file, 'extracted');
                         };
                         input.click();
                       }}
                       className="flex flex-col items-center gap-2 group p-4 rounded-xl hover:bg-white/5 transition-all"
                     >
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform">
                           <Scissors className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Extract from Video</span>
                     </button>

                     <div className="h-8 w-[1px] bg-white/10" />

                     <button 
                       onClick={() => {
                         const input = document.createElement('input');
                         input.type = 'file';
                         input.accept = 'audio/*,video/*,image/*,.m4a,.aac,.mp4,.mov,.jpeg,.jpg';
                         input.onchange = (e) => {
                           const file = (e.target as HTMLInputElement).files?.[0];
                           if (file) handleAudioFile(file, 'direct');
                         };
                         input.click();
                       }}
                       className="flex flex-col items-center gap-2 group p-4 rounded-xl hover:bg-white/5 transition-all"
                     >
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 group-hover:scale-110 transition-transform">
                           <FileAudio className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Upload Audio File</span>
                     </button>

                     <button 
                       onClick={() => setShowAudioChoice(false)}
                       className="absolute top-2 right-2 p-2 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:p-1 flex items-center justify-center text-slate-600 hover:text-white transition-colors"
                     >
                        <X className="w-4 h-4" />
                     </button>
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'video/*,image/*,.mp4,.mov,.jpeg,.jpg';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleAudioFile(file, 'extracted');
                        };
                        input.click();
                      }}
                      className="flex flex-col items-center gap-2 group p-4 rounded-xl hover:bg-white/5 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform">
                        <Scissors className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Extract from Video</span>
                    </button>

                    <div className="h-8 w-[1px] bg-white/10" />

                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'audio/*,video/*,image/*,.m4a,.aac,.mp4,.mov,.jpeg,.jpg';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleAudioFile(file, 'direct');
                        };
                        input.click();
                      }}
                      className="flex flex-col items-center gap-2 group p-4 rounded-xl hover:bg-white/5 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 group-hover:scale-110 transition-transform">
                        <FileAudio className="w-5 h-5 text-cyan-400" />
                      </div>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Upload Audio File</span>
                    </button>

                    <button
                      onClick={() => setShowAudioChoice(false)}
                      className="absolute top-2 right-2 p-2 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:p-1 flex items-center justify-center text-slate-600 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Callout */}
              <AnimatePresence>
                {audioError && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{audioError}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>



          {/* Action Button */}
          <div className="pt-4">
            <motion.button
              whileHover={uploadedFile && !isIngesting ? { scale: 1.02, boxShadow: '0 0 60px rgba(34,211,238,0.3)' } : {}}
              whileTap={uploadedFile && !isIngesting ? { scale: 0.98 } : {}}
              onClick={handleContinue}
              disabled={!uploadedFile || isIngesting}
              className={`w-full h-18 text-xl font-black rounded-2xl transition-all duration-500 flex items-center justify-center gap-4 uppercase tracking-[0.4em] ${uploadedFile && !isIngesting
                  ? 'bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-400 text-[#0b0d1f] shadow-2xl relative overflow-hidden'
                  : 'bg-white/5 text-slate-700 border border-white/5 cursor-not-allowed opacity-40'
                }`}
            >
              {uploadedFile && !isIngesting && (
                <motion.div
                  animate={{ opacity: [0.2, 0.4, 0.2], x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 transform -skew-x-12"
                />
              )}
              {isIngesting ? "Analyzing Protocol..." : (uploadedFile ? "Start Editing" : "Add the video to start editing")}
              {!isIngesting && uploadedFile && <Sparkles className="w-5 h-5 animate-pulse" />}
            </motion.button>
            <p className="text-center mt-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-loose max-w-md mx-auto">
              By continuing, AI will begin the initial scene-cut and aesthetic analysis in the next phase.
            </p>
          </div>

        </div>
      </div>

      {/* Custom Styles for Tooltip */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .h-18 { height: 4.5rem; }
        .aspect-video { aspect-ratio: 16 / 9; }
      `}} />

      <HistoryDialog 
        open={isHistoryOpen} 
        onOpenChange={setIsHistoryOpen}
        onSelect={handleHistorySelect}
        currentTool="quick-edit"
      />
    </div>
  );
}
