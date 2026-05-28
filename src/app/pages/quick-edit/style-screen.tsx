import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Youtube,
  Instagram,
  Music2,
  Briefcase,
  ArrowLeft,
  Sparkles,
  Wand2,
  History as HistoryIcon,
  Trash2,
  RefreshCw,
  Music,
  Mic,
  Plus,
  Monitor,
  Smartphone,
  Play,
  Settings,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
  Zap,
  Video,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  X,
  Scissors,
  FileAudio,
  Timer,
  Palette,
  Sparkle,
  Download,
  Copy,
  Type,
  RotateCw,
  Crop,
  ZoomIn,
  MonitorPlay,
  Film,
  Crown,
  Settings2,
  Check,
  Pause,
  Undo2,
  Redo2,
  ScanLine,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  MessageSquare
} from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { Textarea } from "../../components/ui/textarea";

import { HistoryDialog, type HistoryItem, saveToHistory } from "../../components/history-dialog";
import { PremiumModal } from "../../components/premium-modal";
import { MusicPickerModal } from "../../components/editor/music-picker-modal";
import { MusicStrip } from "../../components/editor/music-strip";
import { useMusicContext } from "../../context/music-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";

async function extractAudioFromVideoFile(videoFile: File): Promise<File> {
  if (!videoFile.type.startsWith("video/")) {
    throw new Error("Please select a video file to extract audio from.");
  }

  const objectUrl = URL.createObjectURL(videoFile);
  const video = document.createElement("video");
  video.src = objectUrl;
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Unable to load video file for audio extraction."));
  });

  const captureStream = (video as any).captureStream || (video as any).mozCaptureStream;
  if (!captureStream) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Audio extraction requires browser support for video.captureStream().");
  }

  const stream = captureStream.call(video) as MediaStream;
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("No audio track was detected in the selected video.");
  }

  const supportsWebmOpus = typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm;codecs=opus");
  const supportsWebm = typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm");
  const mimeType = supportsWebmOpus ? "audio/webm;codecs=opus" : supportsWebm ? "audio/webm" : "audio/webm";

  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const recordedBlobPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = () => reject(new Error("Audio extraction failed while recording."));
  });

  recorder.start();
  try {
    await video.play().catch(() => {});
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    if (duration > 0) {
      await new Promise<void>((resolve) => {
        video.onended = () => resolve();
        setTimeout(resolve, duration * 1000 + 500);
      });
    } else {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  } finally {
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
    URL.revokeObjectURL(objectUrl);
  }

  const audioBlob = await recordedBlobPromise;
  const outputName = `${videoFile.name.replace(/\.[^/.]+$/, "")}.webm`;
  return new File([audioBlob], outputName, { type: audioBlob.type || "audio/webm" });
}

const editingStyles = [
  {
    id: "youtube",
    title: "YouTube Edit",
    description: "Professional vlog style",
    icon: Youtube,
    gradient: "from-red-500/20 to-red-600/20",
    ratio: '16:9'
  },
  {
    id: "instagram",
    title: "Instagram Reel",
    description: "Vertical trendy format",
    icon: Instagram,
    gradient: "from-pink-500/20 to-purple-600/20",
    ratio: '9:16'
  },
  {
    id: "cinematic",
    title: "Cinematic Film",
    description: "Ultra-wide cinematic look",
    icon: Film,
    gradient: "from-indigo-500/20 to-purple-600/20",
    ratio: '21:9'
  },
  {
    id: "professional",
    title: "Professional Clean",
    description: "Polished corporate look",
    icon: Briefcase,
    gradient: "from-gray-700/20 to-gray-900/20",
    ratio: '16:9'
  },
];

const textFontOptions = [
  { id: 'serif', label: 'SERIF FONT', family: 'Georgia, Times New Roman, serif' },
  { id: 'sans', label: 'SANS SERIF FONT', family: 'Helvetica, Arial, sans-serif' },
  { id: 'script', label: 'SCRIPT FONT', family: 'Brush Script MT, cursive' },
  { id: 'display', label: 'DISPLAY FONT', family: 'Impact, fantasy' },
  { id: 'mono', label: 'MONOSPACE FONT', family: 'Courier New, monospace' },
  { id: 'handwritten', label: 'HANDWRITTEN FONT', family: 'Comic Sans MS, cursive' },
  { id: 'slab', label: 'SLAB SERIF FONT', family: 'Rockwell, Roboto Slab, serif' },
  { id: 'brush', label: 'BRUSH FONT', family: 'Segoe Script, Brush Script MT, cursive' },
  { id: 'calligraphy', label: 'CALLIGRAPHY FONT', family: 'Lucida Calligraphy, cursive' },
  { id: 'vintage', label: 'VINTAGE FONT', family: 'Copperplate, Papyrus, serif' },
];

const CAPTION_LANGUAGES = [
  { id: 'en', label: 'English', name: 'English' },
  { id: 'es', label: 'Spanish', name: 'Español' },
  { id: 'fr', label: 'French', name: 'Français' },
  { id: 'de', label: 'German', name: 'Deutsch' },
  { id: 'it', label: 'Italian', name: 'Italiano' },
  { id: 'pt', label: 'Portuguese', name: 'Português' },
  { id: 'ja', label: 'Japanese', name: '日本語' },
  { id: 'zh', label: 'Chinese', name: '中文' },
  { id: 'ko', label: 'Korean', name: '한국어' },
  { id: 'ru', label: 'Russian', name: 'Русский' },
  { id: 'ar', label: 'Arabic', name: 'العربية' },
  { id: 'hi', label: 'Hindi', name: 'हिंदी' },
];

const CAPTION_STYLE_PRESETS = [
  { id: 'modern', label: 'Modern', description: 'Clean & Contemporary', fontId: 'sans', fontSize: 36, color: '#FFFFFF', bgEnabled: true, bgColorHex: '#000000', bold: true, italic: false, outline: false, alignment: 'center' as const },
  { id: 'cinematic', label: 'Cinematic', description: 'Film-style subtitles', fontId: 'serif', fontSize: 42, color: '#FFFFFF', bgEnabled: true, bgColorHex: '#1a1a1a', bold: true, italic: false, outline: true, alignment: 'center' as const },
  { id: 'neon', label: 'Neon', description: 'Vibrant & Bold', fontId: 'display', fontSize: 48, color: '#00FF00', bgEnabled: true, bgColorHex: '#000000', bold: true, italic: false, outline: true, alignment: 'center' as const },
  { id: 'retro', label: 'Retro', description: 'Vintage style', fontId: 'vintage', fontSize: 40, color: '#FFD700', bgEnabled: true, bgColorHex: '#663300', bold: true, italic: false, outline: false, alignment: 'center' as const },
  { id: 'comic', label: 'Comic', description: 'Fun & Playful', fontId: 'handwritten', fontSize: 38, color: '#FF00FF', bgEnabled: true, bgColorHex: '#FFFF00', bold: true, italic: true, outline: false, alignment: 'center' as const },
  { id: 'elegant', label: 'Elegant', description: 'Sophisticated', fontId: 'calligraphy', fontSize: 44, color: '#E8D5C4', bgEnabled: false, bgColorHex: '#000000', bold: false, italic: true, outline: false, alignment: 'center' as const },
];

const QUICK_TOOLS = [
  { id: 'effects', icon: Sparkle, label: 'Effects', color: 'text-amber-300' },
  { id: 'transitions', icon: Layers, label: 'Transitions', color: 'text-cyan-300' },
  { id: 'filters', icon: Palette, label: 'Filters', color: 'text-pink-300' },
  { id: 'speed', icon: Timer, label: 'Speed', color: 'text-cyan-300' },
  { id: 'trim', icon: Scissors, label: 'Trim', color: 'text-green-300' },
  { id: 'copy', icon: Copy, label: 'Copy', color: 'text-blue-300' },
  { id: 'text-tool', icon: Type, label: 'Text', color: 'text-purple-300' },
  { id: 'rotate', icon: RotateCw, label: 'Rotate', color: 'text-teal-300' },
  { id: 'volume', icon: Volume2, label: 'Volume', color: 'text-indigo-300' },
  { id: 'crop', icon: Crop, label: 'Crop', color: 'text-red-300' },
  { id: 'zoom', icon: ZoomIn, label: 'Zoom', color: 'text-yellow-300' },
  { id: 'keyframe', icon: MonitorPlay, label: 'Keyframe', color: 'text-emerald-300' },
  { id: 'captions', icon: MessageSquare, label: 'Captions', color: 'text-green-300' },
];

const CANVAS_PREVIEW_EFFECTS = [
  'green-screen',
  'glitch',
  'text-animation',
  'motion-tracking',
];

const CANVAS_PREVIEW_FILTERS = [
  'vintage',
  'soft-glow',
  'retro-film',
];

const TimelineHub = memo(({
  mediaItems,
  audioTracks,
  captions,
  currentCaption,
  setCurrentCaption,
  progress,
  handleTimelineClick,
  activePreviewId,
  setActivePreviewId,
  isPlaying,
  clipTrimRanges,
  setClipTrimRanges,
  getTrimRangeForItem,
  videoRef,
  handleAddAudio,
  handleAddVideo,
  handleReorderClips,
  getMediaDuration,
  setMediaItems,
  saveToUndo,
  timelineSize,
  setTimelineSize
}: any) => {
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAudioChoiceLocal, setShowAudioChoiceLocal] = useState(false);
  const [selectedAudioLane, setSelectedAudioLane] = useState(0);

  const pixelsPerSecond = 20; // 20px represents 1 second on the timeline

  const dragRef = useRef<{
    itemId: string;
    type: 'start' | 'end';
    initialX: number;
    initialVal: number;
    itemDuration: number;
    currentTrim: { start: number; end: number };
  } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, itemId: string, type: 'start' | 'end', itemDuration: number) => {
    e.stopPropagation();
    e.preventDefault();

    const currentTrim = getTrimRangeForItem(itemId, itemDuration);
    const initialVal = type === 'start' ? currentTrim.start : currentTrim.end;

    dragRef.current = {
      itemId,
      type,
      initialX: e.clientX,
      initialVal,
      itemDuration,
      currentTrim
    };
    setIsDragging(true);

    const handleMouseMove = (ev: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const dx = ev.clientX - drag.initialX;
      const dt = dx / pixelsPerSecond; // Convert pixel delta straight to seconds

      let newVal = drag.initialVal + dt;

      if (drag.type === 'start') {
        newVal = Math.max(0, Math.min(drag.currentTrim.end - 0.1, newVal));
        setClipTrimRanges((prev: any) => ({
          ...prev,
          [drag.itemId]: {
            start: newVal,
            end: drag.currentTrim.end
          }
        }));
        if (videoRef && videoRef.current && drag.itemId === activePreviewId) {
          videoRef.current.currentTime = newVal;
        }
      } else {
        newVal = Math.max(drag.currentTrim.start + 0.1, Math.min(drag.itemDuration, newVal));
        setClipTrimRanges((prev: any) => ({
          ...prev,
          [drag.itemId]: {
            start: drag.currentTrim.start,
            end: newVal
          }
        }));
        if (videoRef && videoRef.current && drag.itemId === activePreviewId) {
          videoRef.current.currentTime = newVal;
        }
      }
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Calculate timeline durations
  const totalDuration = mediaItems.reduce((acc: number, it: any) => {
    const t = getTrimRangeForItem(it.id, it.duration);
    const eff = it.type === 'video' ? (t.end - t.start) : it.duration;
    return acc + (Number(eff) || 3.0);
  }, 0) || 1;

  const playheadLeft = (progress / 100) * totalDuration * pixelsPerSecond;

  useEffect(() => {
    if (!timelineScrollRef.current || isDragging) return;
    const container = timelineScrollRef.current;
    const padding = 80;
    const visibleStart = container.scrollLeft;
    const visibleEnd = visibleStart + container.clientWidth;
    const target = playheadLeft;
    if (target < visibleStart + padding) {
      container.scrollTo({ left: Math.max(0, target - padding), behavior: 'smooth' });
    } else if (target > visibleEnd - padding) {
      container.scrollTo({ left: Math.max(0, target - container.clientWidth + padding), behavior: 'smooth' });
    }
  }, [playheadLeft, isDragging]);

  const localHandleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (totalDuration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const globalSeekTime = clickX / pixelsPerSecond;
    const clampedSeekTime = Math.max(0, Math.min(totalDuration, globalSeekTime));
    
    handleTimelineClick(clampedSeekTime);
  };

  return (
    <div className="flex flex-col h-full bg-[#080914] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">
      {/* Timeline Header Toolbar */}
      <div className="h-8 border-b border-white/5 bg-[#0d0e1f]/60 px-4 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest flex-none">
        <div className="flex items-center gap-4">
          <span className="text-white">Timeline 1</span>
          <div className="w-[1px] h-3 bg-white/10" />
          <span>{mediaItems.length} Video Clips • {audioTracks.length} Audio Tracks • {captions.length} Captions</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[8px] uppercase tracking-wider font-black">Edit Mode</span>
          
          <div className="w-[1px] h-3 bg-white/10" />

          {/* Timeline height adjust controls */}
          <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
            <button
              onClick={() => setTimelineSize('minimized')}
              className={`p-1 rounded text-[8px] font-black uppercase tracking-wider flex items-center justify-center transition-all ${
                timelineSize === 'minimized'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
              title="Minimize Timeline"
            >
              <Minimize2 className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => setTimelineSize('normal')}
              className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider flex items-center justify-center transition-all ${
                timelineSize === 'normal'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
              title="Normal Timeline"
            >
              Normal
            </button>
            <button
              onClick={() => setTimelineSize('maximized')}
              className={`p-1 rounded text-[8px] font-black uppercase tracking-wider flex items-center justify-center transition-all ${
                timelineSize === 'maximized'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
              title="Maximize Timeline"
            >
              <Maximize2 className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers (Left Pane of Timeline) */}
        <div className="w-16 md:w-20 border-r border-white/10 bg-[#0d0e1f]/40 flex flex-col flex-none select-none">
          {/* Timeline ruler spacer */}
          <div className="h-6 border-b border-white/5 bg-black/20" />
          
          {/* Video track header */}
          <div className="flex-1 border-b border-white/5 p-2 flex flex-col justify-center min-h-[44px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-300">V1</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddVideo();
                }}
                className="w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500 hover:text-[#0b0d1f] hover:border-cyan-400 transition-all flex items-center justify-center cursor-pointer shadow-md"
                title="Add Video/Image"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
            <span className="text-[7px] text-slate-600 font-bold uppercase mt-0.5">Video</span>
          </div>

          {/* Audio track headers A1 to A4 */}
          {[0, 1, 2, 3].map((idx) => {
            const laneName = `A${idx + 1}`;
            return (
              <div key={idx} className="flex-1 p-2 flex flex-col justify-center min-h-[30px] border-b border-white/5 relative group/audioheader">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-300">{laneName}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAudioLane(idx);
                      setShowAudioChoiceLocal(true);
                    }}
                    className="w-4 h-4 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500 hover:text-[#0b0d1f] hover:border-purple-400 transition-all flex items-center justify-center cursor-pointer shadow-md"
                    title={`Add Audio to ${laneName}`}
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
                <span className="text-[7px] text-slate-600 font-bold uppercase mt-0.5">Audio</span>
              </div>
            );
          })}

          {/* Caption Track Header */}
          <div className="flex-1 p-2 flex flex-col justify-center min-h-[30px] border-b border-white/5 last:border-b-0 relative group/captionheader">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-300">CC</span>
              <div className="w-4 h-4 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center cursor-default shadow-md" title="Captions">
                <MessageSquare className="w-2.5 h-2.5" />
              </div>
            </div>
            <span className="text-[7px] text-slate-600 font-bold uppercase mt-0.5">Captions</span>
          </div>
        </div>

        {/* Tracks Area (Right Pane of Timeline) - Horizontally Scrollable! */}
        <div ref={timelineScrollRef} className="flex-1 flex flex-col relative overflow-x-auto overflow-y-hidden custom-scrollbar bg-black/10 select-none">
          <div 
            style={{ width: `${Math.max(400, totalDuration * pixelsPerSecond + 100)}px`, minWidth: '100%' }} 
            className="flex-1 flex flex-col relative h-full"
          >
            
            {/* Time Ruler */}
            <div 
              className="h-6 border-b border-white/5 bg-black/30 relative flex items-end px-1 select-none cursor-pointer" 
              onClick={localHandleTimelineClick}
            >
              <div className="absolute inset-0 pointer-events-none flex justify-between px-2 text-[8px] text-slate-600 font-mono py-0.5">
                <span>00:00:00</span>
                <span>00:00:05</span>
                <span>00:00:10</span>
                <span>00:00:15</span>
                <span>00:00:20</span>
                <span>00:00:25</span>
                <span>00:00:30</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col relative" onClick={localHandleTimelineClick}>
              
              {/* Playhead (Red line) */}
              <motion.div
                initial={false}
                animate={{ left: `${playheadLeft}px` }}
                transition={isPlaying ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
                className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-30 shadow-[0_0_10px_rgba(239,68,68,0.8)] pointer-events-none"
                style={{ transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-red-500 border border-red-400 rotate-45 transform origin-top -translate-y-1.5 shadow" />
                <div className="absolute inset-y-0 left-[-1px] right-[-1px] bg-red-500/20 blur-[1px]" />
              </motion.div>

              {/* Video Track Lane (V1) */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files || []);
                  if (files.length > 0) {
                    const newItems = await Promise.all(files.map(async file => ({
                      id: Math.random().toString(36).substr(2, 9),
                      file,
                      preview: URL.createObjectURL(file),
                      type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
                      duration: await getMediaDuration(file)
                    })));
                    setMediaItems((prev: any) => {
                      const filteredPrev = prev.filter((p: any) => p.id !== 'initial' || p.file !== null);
                      const updated = [...filteredPrev, ...newItems];
                      saveToUndo(updated);
                      return updated;
                    });
                  } else {
                    const clipId = e.dataTransfer.getData('clipId');
                    const fromIndexStr = e.dataTransfer.getData('dragIndex');
                    if (clipId && !fromIndexStr) {
                      const item = mediaItems.find((m: any) => m.id === clipId);
                      if (item) {
                        setActivePreviewId(item.id);
                      }
                    }
                  }
                }}
                className="flex-1 border-b border-white/5 relative flex items-center bg-white/[0.01]"
              >
                <div ref={trackRef} className="absolute inset-0 flex gap-0 p-0">
                  {mediaItems.map((item: any, i: number) => {
                    const trim = getTrimRangeForItem(item.id, item.duration);
                    const effectiveDuration = item.type === 'video' ? (trim.end - trim.start) : item.duration;
                    const widthPx = effectiveDuration * pixelsPerSecond;
                    const isActive = activePreviewId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePreviewId(item.id);
                        }}
                        draggable="true"
                        onDragStart={(e) => {
                          e.dataTransfer.setData('clipId', item.id);
                          e.dataTransfer.setData('dragIndex', String(i));
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const draggedId = e.dataTransfer.getData('clipId');
                          const fromIndexStr = e.dataTransfer.getData('dragIndex');
                          if (fromIndexStr) {
                            const fromIdx = Number(fromIndexStr);
                            const toIdx = i;
                            if (fromIdx !== toIdx) {
                              handleReorderClips(fromIdx, toIdx);
                            }
                          } else if (draggedId) {
                            handleReorderClips(draggedId, i);
                          }
                        }}
                        style={{ width: `${widthPx}px` }}
                        className={`h-full relative overflow-hidden rounded-md border flex items-center px-2 cursor-pointer ${
                          isDragging && dragRef.current?.itemId === item.id ? '' : 'transition-all duration-300'
                        } ${isActive
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-[inset_0_0_10px_rgba(34,211,238,0.2)] text-white'
                          : 'bg-cyan-950/20 border-white/5 hover:border-white/20 text-slate-400'
                          }`}
                      >
                        {item.type === 'video' ? (
                          <Video className="w-3.5 h-3.5 mr-1 flex-shrink-0 text-cyan-400/70" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 mr-1 flex-shrink-0 text-cyan-400/70" />
                        )}
                        <span className="text-[8px] font-black uppercase tracking-wider truncate mr-1">
                          {item.file ? item.file.name : `Clip ${i + 1}`}
                        </span>
                        <span className="text-[7px] text-slate-500 font-mono ml-auto flex-shrink-0 z-10">
                          {effectiveDuration.toFixed(1)}s
                        </span>

                        {/* Trimming Handles for Video Clips */}
                        {item.type === 'video' && (
                          <>
                            {/* Left Handle (Trim Start) */}
                            <div
                              draggable={false}
                              onMouseDown={(e) => handleMouseDown(e, item.id, 'start', item.duration)}
                              className="absolute left-0 top-0 bottom-0 w-2 bg-cyan-400/90 cursor-ew-resize hover:bg-cyan-300 hover:w-2.5 z-20 flex items-center justify-center border-r border-black/40 shadow-[0_0_8px_rgba(34,211,238,0.4)] transition-all"
                              title="Trim Start"
                            >
                              <div className="w-[1px] h-3 bg-black/60 rounded" />
                            </div>
                            
                            {/* Right Handle (Trim End) */}
                            <div
                              draggable={false}
                              onMouseDown={(e) => handleMouseDown(e, item.id, 'end', item.duration)}
                              className="absolute right-0 top-0 bottom-0 w-2 bg-cyan-400/90 cursor-ew-resize hover:bg-cyan-300 hover:w-2.5 z-20 flex items-center justify-center border-l border-black/40 shadow-[0_0_8px_rgba(34,211,238,0.4)] transition-all"
                              title="Trim End"
                            >
                              <div className="w-[1px] h-3 bg-black/60 rounded" />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {mediaItems.length === 0 && (
                    <div className="w-full h-full flex items-center justify-center border border-dashed border-white/5 rounded-lg">
                      <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Empty Video Track</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Audio Track Lanes A1 to A4 */}
              {[0, 1, 2, 3].map((idx) => {
                const laneAudios = audioTracks.filter((t: any) => (t.trackIndex ?? 0) === idx);
                return (
                  <div key={idx} className="flex-1 border-b border-white/5 last:border-b-0 relative flex items-center bg-white/[0.01]">
                    <div className="absolute inset-0 flex gap-0 p-0">
                      {laneAudios.map((track: any) => {
                        return (
                          <div
                            key={track.id}
                            style={{ width: `${totalDuration * pixelsPerSecond}px` }}
                            className="h-full flex-none rounded-md border border-purple-500/30 bg-purple-500/10 flex items-center justify-between px-2 select-none"
                          >
                            <div className="flex items-center overflow-hidden">
                              <Music className="w-3 h-3 mr-1 text-purple-400 flex-shrink-0" />
                              <span className="text-[8px] font-black uppercase tracking-wider text-purple-300 truncate">
                                {track.name}
                              </span>
                            </div>
                            
                            {/* Waveform graphic */}
                            <div className="flex items-center gap-[1px] h-3 mr-2">
                              {[4, 8, 12, 6, 10, 4, 8, 12, 6, 2, 8, 4].map((h, index) => (
                                <div
                                  key={index}
                                  style={{ height: `${h}px` }}
                                  className={`w-[1px] bg-purple-400/60 rounded-full ${isPlaying ? 'animate-pulse' : ''}`}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {laneAudios.length === 0 && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAudioLane(idx);
                            setShowAudioChoiceLocal(!showAudioChoiceLocal);
                          }}
                          className="w-full h-full flex flex-col items-center justify-center border border-dashed border-purple-500/15 hover:border-purple-500/40 hover:bg-purple-500/[0.02] cursor-pointer rounded-lg transition-all group relative"
                        >
                          <div className="absolute inset-0 flex items-center gap-[2px] opacity-[0.01] pointer-events-none">
                            {Array.from({ length: 40 }).map((_, i) => (
                              <div
                                key={i}
                                style={{ height: `${Math.sin(i * 0.5) * 12 + 16}px` }}
                                className="w-[2px] bg-white rounded-full"
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500 group-hover:text-purple-400 uppercase tracking-widest transition-colors z-10">
                            <Plus className="w-3 h-3 text-purple-500/60 group-hover:text-purple-400" />
                            <span>Add Track A{idx + 1} Audio</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Caption Track Lane */}
              <div className="flex-1 border-b border-white/5 last:border-b-0 relative flex items-center bg-white/[0.01]">
                <div className="absolute inset-0 flex gap-0 p-0">
                  {captions.map((caption: any) => {
                    const captionLeft = caption.startTime * pixelsPerSecond;
                    const captionDuration = (caption.endTime - caption.startTime);
                    const captionWidth = Math.max(8, captionDuration * pixelsPerSecond);
                    const isCaptionActive = currentCaption?.id === caption.id;
                    return (
                      <div
                        key={caption.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentCaption(caption);
                        }}
                        style={{ width: `${captionWidth}px`, left: `${captionLeft}px` }}
                        className={`absolute h-full top-0 rounded-md border flex items-center px-2 cursor-pointer transition-all ${
                          isCaptionActive
                            ? 'bg-teal-500/30 border-teal-400 shadow-[inset_0_0_10px_rgba(20,184,166,0.2)] text-white'
                            : 'bg-teal-950/20 border-teal-500/30 hover:border-teal-400 text-slate-300'
                        }`}
                        title={`${caption.text} (${captionDuration.toFixed(1)}s)`}
                      >
                        <MessageSquare className="w-3 h-3 mr-1 flex-shrink-0 text-teal-400/70" />
                        <span className="text-[8px] font-black uppercase tracking-wider truncate mr-1">
                          {caption.text}
                        </span>
                        <span className="text-[7px] text-slate-500 font-mono ml-auto flex-shrink-0 z-10">
                          {captionDuration.toFixed(1)}s
                        </span>
                      </div>
                    );
                  })}
                  {captions.length === 0 && (
                    <div className="w-full h-full flex items-center justify-center border border-dashed border-teal-500/15 rounded-lg">
                      <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">No Captions</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Floating Audio Tracks Choice Overlay inside TimelineHub */}
      <AnimatePresence>
        {showAudioChoiceLocal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute left-20 bottom-3 z-45 flex items-center gap-3 bg-[#0c0d1ebf] border border-white/10 p-2.5 rounded-xl shadow-2xl backdrop-blur-2xl"
          >
            <button
              disabled={extractingAudio}
              onClick={() => {
                handleAddAudio('extracted', selectedAudioLane);
              }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/5 text-slate-300 w-20 transition-all border border-transparent hover:border-white/5 active:scale-95 disabled:cursor-wait disabled:opacity-60"
            >
              <Scissors className="w-4 h-4 text-purple-400" />
              <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-300">
                {extractingAudio ? "Extracting..." : "Extract"}
              </span>
            </button>
            <div className="w-[1px] h-8 bg-white/10" />
            <button
              onClick={() => {
                handleAddAudio('direct', selectedAudioLane);
              }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/5 text-slate-300 w-20 transition-all border border-transparent hover:border-white/5 active:scale-95"
            >
              <FileAudio className="w-4 h-4 text-cyan-400" />
              <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-300">Upload</span>
            </button>
            <button 
              onClick={() => setShowAudioChoiceLocal(false)} 
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
            {audioError && (
              <div className="absolute left-full ml-3 w-64 rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-[10px] font-bold text-red-200">
                {audioError}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const AudioMixer = memo(({ isPlaying, isMuted }: any) => {
  // Use stable/constant values if not playing, animate slightly if playing
  const val1 = isMuted ? 0 : isPlaying ? Math.floor(Math.sin(Date.now() / 200) * 15) + 60 : 50;
  const val2 = isMuted ? 0 : isPlaying ? Math.floor(Math.cos(Date.now() / 150) * 10) + 65 : 55;

  return (
    <div className="w-24 md:w-28 bg-[#0c0d1e] border border-white/10 rounded-xl p-2.5 flex flex-col h-full select-none shadow-xl flex-none">
      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 text-center block">Mixer</span>
      <div className="flex-1 flex gap-2 justify-center items-stretch h-[80px]">
        {/* A1 Track volume meter */}
        <div className="flex flex-col items-center flex-1">
          <div className="flex-1 w-2 bg-black/40 rounded-full overflow-hidden flex flex-col justify-end p-[1px] relative">
            <div
              className="w-full rounded-full transition-all duration-100 bg-gradient-to-t from-emerald-500 via-yellow-400 to-red-500"
              style={{ height: `${val1}%` }}
            />
          </div>
          <span className="text-[7px] text-slate-500 font-bold uppercase mt-1">A1</span>
        </div>

        {/* Master Output meter */}
        <div className="flex flex-col items-center flex-1">
          <div className="flex-1 w-2 bg-black/40 rounded-full overflow-hidden flex flex-col justify-end p-[1px] relative">
            <div
              className="w-full rounded-full transition-all duration-100 bg-gradient-to-t from-emerald-500 via-yellow-400 to-red-500"
              style={{ height: `${val2}%` }}
            />
          </div>
          <span className="text-[7px] text-slate-500 font-bold uppercase mt-1">MST</span>
        </div>
      </div>
    </div>
  );
});

const QuickToolsGrid = memo(({ QUICK_TOOLS, activeTool, setActiveTool, copyActiveClip, setExpandedSections }: any) => (
  <div className="grid grid-cols-3 gap-2">
    {QUICK_TOOLS.map((tool: any, index: number) => {
      const isSelected = activeTool === tool.id;
      return (
        <button
          key={index}
          onClick={() => {
            if (tool.id === 'copy') {
              copyActiveClip();
              return;
            }
            setActiveTool(tool.id);
            
            // Auto expand the corresponding Inspector accordion group
            if (['effects', 'transitions', 'filters'].includes(tool.id)) {
              setExpandedSections((prev: any) => ({ ...prev, fx: true }));
            } else if (['speed', 'trim'].includes(tool.id)) {
              setExpandedSections((prev: any) => ({ ...prev, speed: true }));
            } else if (['rotate', 'zoom', 'keyframe'].includes(tool.id)) {
              setExpandedSections((prev: any) => ({ ...prev, transform: true }));
            } else if (tool.id === 'crop') {
              setExpandedSections((prev: any) => ({ ...prev, cropping: true }));
            } else if (tool.id === 'volume') {
              setExpandedSections((prev: any) => ({ ...prev, audio: true }));
            } else if (tool.id === 'text-tool') {
              setExpandedSections((prev: any) => ({ ...prev, text: true }));
            }
          }}
          className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border transition-all active:scale-[0.98] group ${
            isSelected 
              ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
              : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15'
          }`}
        >
          <tool.icon className={`w-4 h-4 ${tool.color} group-hover:scale-105 transition-transform`} />
          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider text-center line-clamp-1">{tool.label}</span>
        </button>
      );
    })}
  </div>
));

const ToolInspector = memo(({
  activeTool,
  setActiveTool,
  selectedFilter,
  setSelectedFilter,
  selectedEffect,
  setSelectedEffect,
  blurAmount,
  setBlurAmount,
  brightness,
  setBrightness,
  contrast,
  setContrast,
  saturation,
  setSaturation,
  slowMotionSpeed,
  setSlowMotionSpeed,
  glitchIntensity,
  setGlitchIntensity,
  animatedText,
  setAnimatedText,
  overlayText,
  setOverlayText,
  overlayFontId,
  setOverlayFontId,
  overlayFontSize,
  setOverlayFontSize,
  overlayColor,
  setOverlayColor,
  overlayPosX,
  setOverlayPosX,
  overlayPosY,
  setOverlayPosY,
  isTextPlacementMode,
  setIsTextPlacementMode,
  clipTransitions,
  applyTransitionForActiveClip,
  speedValue,
  setSpeedValue,
  activePreviewId,
  activePreviewItem,
  getTrimRangeForItem,
  clipTrimRanges,
  setClipTrimRanges,
  rotationDegrees,
  setRotationDegrees,
  volumeLevel,
  setVolumeLevel,
  isMuted,
  setIsMuted,
  cropWidthPct,
  setCropWidthPct,
  cropHeightPct,
  setCropHeightPct,
  cropCenterX,
  setCropCenterX,
  cropCenterY,
  setCropCenterY,
  zoomToolAmount,
  setZoomToolAmount,
  keyframeMode,
  setKeyframeMode,
  keyframeAmount,
  setKeyframeAmount,
  videoRef,
  captions,
  setCaptions,
  currentCaption,
  setCurrentCaption,
  captionLanguage,
  setCaptionLanguage,
  captionStyle,
  setCaptionStyle,
  captionStylePreset,
  setCaptionStylePreset,
  isCaptionPlacementMode,
  setIsCaptionPlacementMode,
  handleAutoCaption,
  isAutoCapturing,
  autoCaptionStatus
}: any) => {
  const [captionTab, setCaptionTab] = useState<'list' | 'style'>('list');
  const [newCaptionText, setNewCaptionText] = useState('');
  const [newCaptionStart, setNewCaptionStart] = useState(0);
  const [newCaptionEnd, setNewCaptionEnd] = useState(3);

  switch (activeTool) {
    case 'filters':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Filters</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">Color Presets</span>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            <button
              onClick={() => setSelectedFilter('none')}
              className={`w-full px-2.5 py-2 rounded-lg text-left text-[9px] font-bold uppercase tracking-wider transition-colors ${selectedFilter === 'none' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}
            >
              No Filter
            </button>
            {[
              { id: 'vintage', label: 'Vintage (Old Film)' },
              { id: 'black-white', label: 'Black and White' },
              { id: 'cinematic', label: 'Cinematic' },
              { id: 'warm', label: 'Warm' },
              { id: 'cool', label: 'Cool' },
              { id: 'sepia', label: 'Sepia' },
              { id: 'hdr', label: 'HDR' },
              { id: 'vivid', label: 'Vivid' },
              { id: 'soft-glow', label: 'Soft Glow' },
              { id: 'retro-film', label: 'Retro Film (VHS)' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id as any)}
                className={`w-full px-2.5 py-2 rounded-lg text-left text-[9px] font-bold uppercase tracking-wider transition-colors ${selectedFilter === f.id ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      );
    case 'effects':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Effects</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">Visual FX</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            <button
              onClick={() => setSelectedEffect('none')}
              className={`w-full px-2.5 py-2 rounded-lg text-left text-[9px] font-bold uppercase tracking-wider transition-colors ${selectedEffect === 'none' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}
            >
              No Effect
            </button>
            {[
              { id: 'fade-in', label: 'Fade In' },
              { id: 'blur', label: 'Blur' },
              { id: 'zoom', label: 'Zoom' },
              { id: 'color-correction', label: 'Color Correction' },
              { id: 'green-screen', label: 'Green Screen' },
              { id: 'slow-motion', label: 'Slow Motion' },
              { id: 'glitch', label: 'Glitch' },
              { id: 'transition', label: 'Transition' },
              { id: 'text-animation', label: 'Text Animation' },
              { id: 'motion-tracking', label: 'Motion Tracking' },
            ].map((eff) => (
              <button
                key={eff.id}
                onClick={() => setSelectedEffect(eff.id as any)}
                className={`w-full px-2.5 py-2 rounded-lg text-left text-[9px] font-bold uppercase tracking-wider transition-colors ${selectedEffect === eff.id ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}
              >
                {eff.label}
              </button>
            ))}
          </div>

          {selectedEffect === 'blur' && (
            <div className="mt-2 p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300">
                <span>Blur Amount</span>
                <span>{blurAmount}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={blurAmount}
                onChange={(e) => setBlurAmount(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          )}

          {selectedEffect === 'color-correction' && (
            <div className="mt-2 p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-2.5">
              <div>
                <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300 mb-0.5">
                  <span>Brightness</span>
                  <span>{brightness.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={3}
                  step={0.1}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300 mb-0.5">
                  <span>Contrast</span>
                  <span>{contrast.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={3}
                  step={0.1}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300 mb-0.5">
                  <span>Saturation</span>
                  <span>{saturation.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={0.1}
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>
          )}

          {selectedEffect === 'slow-motion' && (
            <div className="mt-2 p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300">
                <span>Speed</span>
                <span>{slowMotionSpeed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.1}
                value={slowMotionSpeed}
                onChange={(e) => setSlowMotionSpeed(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          )}

          {selectedEffect === 'glitch' && (
            <div className="mt-2 p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300">
                <span>Glitch Intensity</span>
                <span>{glitchIntensity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={3}
                step={0.5}
                value={glitchIntensity}
                onChange={(e) => setGlitchIntensity(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          )}

          {selectedEffect === 'text-animation' && (
            <div className="mt-2 p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
              <label className="text-[8px] font-bold uppercase tracking-widest text-slate-300">Overlay Text</label>
              <input
                value={animatedText}
                onChange={(e) => {
                  setAnimatedText(e.target.value);
                  setOverlayText(e.target.value);
                }}
                placeholder="Enter text"
                className="w-full px-2.5 py-1.5 rounded bg-black/30 border border-white/10 text-white text-xs focus:outline-none"
              />
            </div>
          )}
        </div>
      );
    case 'transitions':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Transitions</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">Cuts</span>
          </div>
          <div className="rounded border border-white/5 bg-white/[0.02] px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-slate-400 text-center">
            {activePreviewId
              ? `Clip: ${activePreviewId.slice(0, 8)} • ${clipTransitions[activePreviewId] || 'none'}`
              : 'Select clip from Timeline first'}
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {[
              { id: 'cross-dissolve', label: 'Cross Dissolve' },
              { id: 'slide-left', label: 'Slide Left' },
              { id: 'slide-right', label: 'Slide Right' },
              { id: 'dip-black', label: 'Dip to Black' },
              { id: 'dip-white', label: 'Dip to White' },
              { id: 'zoom-transition', label: 'Zoom Transition' },
              { id: 'blur-transition', label: 'Blur Transition' },
              { id: 'spin-transition', label: 'Spin Transition' },
              { id: 'glitch-transition', label: 'Glitch Transition' },
              { id: 'flash-transition', label: 'Flash Transition' },
            ].map((tr) => (
              <button
                key={tr.id}
                onClick={() => applyTransitionForActiveClip(tr.id as any)}
                className={`w-full px-2.5 py-2 rounded-lg text-left text-[9px] font-bold uppercase tracking-wider transition-colors ${activePreviewId && clipTransitions[activePreviewId] === tr.id ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}
              >
                {tr.label}
              </button>
            ))}
          </div>
        </div>
      );
    case 'speed':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Speed Change</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">Rate</span>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300">
              <span>Speed</span>
              <span>{speedValue.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0.25}
              max={2}
              step={0.05}
              value={speedValue}
              onChange={(e) => setSpeedValue(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="flex gap-1">
              {[0.5, 1, 1.25, 1.5, 2].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setSpeedValue(preset)}
                  className={`flex-1 py-1 rounded text-[8px] font-black uppercase border transition-colors ${Math.abs(speedValue - preset) < 0.001 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                >
                  {preset}x
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    case 'trim':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Trim Clip</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">Cut</span>
          </div>
          {activePreviewItem?.type === 'video' ? (
            <div className="space-y-3">
              <div className="text-[8px] font-bold uppercase tracking-widest text-slate-400">
                Duration: {activePreviewItem.duration.toFixed(2)}s
              </div>
              <div>
                <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300 mb-0.5">
                  <span>Start</span>
                  <span>{getTrimRangeForItem(activePreviewItem.id, activePreviewItem.duration).start.toFixed(2)}s</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, activePreviewItem.duration - 0.01)}
                  step={0.01}
                  value={getTrimRangeForItem(activePreviewItem.id, activePreviewItem.duration).start}
                  onChange={(e) => {
                    const nextStart = Number(e.target.value);
                    const current = getTrimRangeForItem(activePreviewItem.id, activePreviewItem.duration);
                    const safeEnd = Math.max(nextStart + 0.01, current.end);
                    setClipTrimRanges((prev: any) => ({
                      ...prev,
                      [activePreviewItem.id]: {
                        start: nextStart,
                        end: Math.min(activePreviewItem.duration, safeEnd),
                      },
                    }));
                    if (videoRef.current) {
                      videoRef.current.currentTime = nextStart;
                    }
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300 mb-0.5">
                  <span>End</span>
                  <span>{getTrimRangeForItem(activePreviewItem.id, activePreviewItem.duration).end.toFixed(2)}s</span>
                </div>
                <input
                  type="range"
                  min={0.01}
                  max={activePreviewItem.duration}
                  step={0.01}
                  value={getTrimRangeForItem(activePreviewItem.id, activePreviewItem.duration).end}
                  onChange={(e) => {
                    const nextEnd = Number(e.target.value);
                    const current = getTrimRangeForItem(activePreviewItem.id, activePreviewItem.duration);
                    setClipTrimRanges((prev: any) => ({
                      ...prev,
                      [activePreviewItem.id]: {
                        start: current.start,
                        end: Math.max(current.start + 0.01, nextEnd),
                      },
                    }));
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>
              <button
                onClick={() => {
                  if (activePreviewItem) {
                    setClipTrimRanges((prev: any) => ({
                      ...prev,
                      [activePreviewItem.id]: { start: 0, end: activePreviewItem.duration },
                    }));
                  }
                }}
                className="w-full py-1.5 rounded bg-white/5 border border-white/10 text-slate-300 text-[8px] font-black uppercase hover:bg-white/10"
              >
                Reset Trim
              </button>
            </div>
          ) : (
            <div className="py-3 text-center text-[8px] font-bold uppercase tracking-widest text-slate-500">
              Select a video clip
            </div>
          )}
        </div>
      );
    case 'rotate':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Rotation</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">Angle</span>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300">
              <span>Degrees</span>
              <span>{rotationDegrees}°</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[0, 90, 180, 270].map((deg) => (
                <button
                  key={deg}
                  onClick={() => setRotationDegrees(deg)}
                  className={`py-1.5 rounded text-[8px] font-black uppercase border transition-colors ${rotationDegrees === deg ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    case 'volume':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Volume</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">Audio Level</span>
          </div>
          <div className="space-y-2.5">
            <button
              onClick={() => setIsMuted((prev: any) => !prev)}
              className={`w-full py-2 rounded-lg text-[8px] font-black uppercase border transition-colors ${isMuted ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/15'}`}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300">
              <span>Volume</span>
              <span>{Math.round(volumeLevel * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volumeLevel}
              onChange={(e) => {
                const next = Number(e.target.value);
                setVolumeLevel(next);
                if (next > 0 && isMuted) {
                  setIsMuted(false);
                }
              }}
              className="w-full accent-cyan-400"
            />
          </div>
        </div>
      );
    case 'crop':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Cropping</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">Dimensions</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300 mb-0.5">
                <span>Width</span>
                <span>{Math.round(cropWidthPct)}%</span>
              </div>
              <input type="range" min={30} max={100} step={1} value={cropWidthPct} onChange={(e) => setCropWidthPct(Number(e.target.value))} className="w-full accent-cyan-400 font-sans" />
            </div>
            <div>
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300 mb-0.5">
                <span>Height</span>
                <span>{Math.round(cropHeightPct)}%</span>
              </div>
              <input type="range" min={30} max={100} step={1} value={cropHeightPct} onChange={(e) => setCropHeightPct(Number(e.target.value))} className="w-full accent-cyan-400" />
            </div>
            <div>
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300 mb-0.5">
                <span>Center X</span>
                <span>{Math.round(cropCenterX)}%</span>
              </div>
              <input type="range" min={0} max={100} step={1} value={cropCenterX} onChange={(e) => setCropCenterX(Number(e.target.value))} className="w-full accent-cyan-400" />
            </div>
            <div>
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300 mb-0.5">
                <span>Center Y</span>
                <span>{Math.round(cropCenterY)}%</span>
              </div>
              <input type="range" min={0} max={100} step={1} value={cropCenterY} onChange={(e) => setCropCenterY(Number(e.target.value))} className="w-full accent-cyan-400" />
            </div>
            <button
              onClick={() => {
                setCropWidthPct(100);
                setCropHeightPct(100);
                setCropCenterX(50);
                setCropCenterY(50);
              }}
              className="w-full py-1.5 rounded bg-white/5 border border-white/10 text-slate-300 text-[8px] font-black uppercase hover:bg-white/10"
            >
              Reset Crop
            </button>
          </div>
        </div>
      );
    case 'zoom':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Zoom</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">Scale</span>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300">
              <span>Zoom Factor</span>
              <span>{zoomToolAmount.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={2.5}
              step={0.05}
              value={zoomToolAmount}
              onChange={(e) => setZoomToolAmount(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <button
              onClick={() => setZoomToolAmount(1)}
              className="w-full py-1.5 rounded bg-white/5 border border-white/10 text-slate-300 text-[8px] font-black uppercase hover:bg-white/10"
            >
              Reset Zoom
            </button>
          </div>
        </div>
      );
    case 'keyframe':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Keyframe</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">Animation</span>
          </div>
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-1">
              {[
                { id: 'none', label: 'None' },
                { id: 'zoom-in', label: 'Zoom In' },
                { id: 'zoom-out', label: 'Zoom Out' },
                { id: 'pulse', label: 'Pulse' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setKeyframeMode(preset.id as any)}
                  className={`py-1.5 rounded text-[8px] font-black uppercase border transition-colors ${keyframeMode === preset.id ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300 mb-0.5">
                <span>Strength</span>
                <span>{keyframeAmount.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={1.05}
                max={1.8}
                step={0.05}
                value={keyframeAmount}
                onChange={(e) => setKeyframeAmount(Number(e.target.value))}
                className="w-full accent-cyan-400"
                disabled={keyframeMode === 'none'}
              />
            </div>
          </div>
        </div>
      );
    case 'text-tool':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Text overlay</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">Titles</span>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Content</label>
              <Textarea
                value={overlayText}
                onChange={(e) => {
                  setOverlayText(e.target.value);
                  setAnimatedText(e.target.value);
                }}
                placeholder="Overlay text"
                className="mt-0.5 bg-black/30 border-white/10 text-white text-[11px] min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Font</label>
              <div className="mt-0.5 grid grid-cols-2 gap-1 max-h-24 overflow-y-auto custom-scrollbar pr-0.5">
                {textFontOptions.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => setOverlayFontId(font.id)}
                    className={`px-2 py-1 rounded text-left text-[8px] font-bold uppercase border transition-colors ${overlayFontId === font.id ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                    style={{ fontFamily: font.family }}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Size</label>
                <input
                  type="range"
                  min={18}
                  max={96}
                  value={overlayFontSize}
                  onChange={(e) => setOverlayFontSize(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
              <div>
                <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Color</label>
                <input
                  type="color"
                  value={overlayColor}
                  onChange={(e) => setOverlayColor(e.target.value)}
                  className="w-full h-6 rounded bg-transparent border border-white/10 cursor-pointer"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Position X</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={overlayPosX}
                  onChange={(e) => setOverlayPosX(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
              <div>
                <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Position Y</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={overlayPosY}
                  onChange={(e) => setOverlayPosY(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>
            <button
              onClick={() => setIsTextPlacementMode(!isTextPlacementMode)}
              className={`w-full py-1.5 rounded text-[8px] font-black uppercase border transition-colors ${isTextPlacementMode ? 'bg-cyan-500 text-[#0b0d1f] border-cyan-400' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/15'}`}
            >
              {isTextPlacementMode ? 'Click Preview' : 'Place on Preview'}
            </button>
            <button
              onClick={() => {
                setOverlayText('');
                setAnimatedText('');
                setIsTextPlacementMode(false);
              }}
              className="w-full py-1.5 rounded bg-red-500/15 border border-red-500/40 text-red-300 text-[8px] font-black uppercase hover:bg-red-500/25"
            >
              Delete Text
            </button>
          </div>
        </div>
      );
    case 'captions':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Captions</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">Multilingual</span>
          </div>

          {/* Language Selector */}
          <div>
            <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Language</label>
            <select
              value={captionLanguage}
              onChange={(e) => setCaptionLanguage(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded bg-black/30 border border-white/10 text-white text-[9px] focus:outline-none focus:border-cyan-500/50 font-bold"
            >
              {CAPTION_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-0.5 bg-black/40 p-0.5 rounded-lg border border-white/5">
            <button
              onClick={() => setCaptionTab('list')}
              className={`flex-1 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all ${captionTab === 'list' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
            >
              List
            </button>
            <button
              onClick={() => setCaptionTab('style')}
              className={`flex-1 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all ${captionTab === 'style' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
            >
              Style
            </button>
          </div>

          {captionTab === 'list' ? (
            <div className="space-y-2">
              {/* Caption list */}
              <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pr-0.5">
                {captions.length === 0 ? (
                  <div className="py-3 text-center text-[8px] font-bold uppercase tracking-widest text-slate-600">No captions yet</div>
                ) : (
                  captions.map((cap: any) => (
                    <div 
                      key={cap.id} 
                      onClick={() => setCurrentCaption(cap)}
                      className={`flex items-start gap-1.5 px-2 py-1.5 rounded-lg border cursor-pointer transition-all group ${
                        currentCaption?.id === cap.id
                          ? 'bg-teal-500/20 border-teal-400 shadow-[inset_0_0_8px_rgba(20,184,166,0.1)]'
                          : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-bold text-slate-200 truncate">{cap.text}</div>
                        <div className="text-[7px] text-slate-500 font-mono mt-0.5">{cap.startTime.toFixed(1)}s → {cap.endTime.toFixed(1)}s</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCaptions((prev: any) => prev.filter((c: any) => c.id !== cap.id));
                          if (currentCaption?.id === cap.id) {
                            setCurrentCaption(null);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-red-400 hover:bg-red-500/20 transition-all flex-shrink-0 mt-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add caption form */}
              <div className="space-y-1.5 p-2.5 rounded-lg bg-white/5 border border-white/10">
                <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Caption Text</label>
                <input
                  value={newCaptionText}
                  onChange={(e) => setNewCaptionText(e.target.value)}
                  placeholder="Enter caption..."
                  className="w-full px-2.5 py-1.5 rounded bg-black/30 border border-white/10 text-white text-[10px] focus:outline-none focus:border-cyan-500/50 placeholder:text-slate-600"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[7px] font-bold uppercase text-slate-500 block mb-0.5">Start (sec)</label>
                    <input
                      type="number"
                      value={newCaptionStart}
                      onChange={(e) => setNewCaptionStart(Number(e.target.value))}
                      step={0.1}
                      min={0}
                      className="w-full px-2 py-1 rounded bg-black/30 border border-white/10 text-white text-[10px] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[7px] font-bold uppercase text-slate-500 block mb-0.5">End (sec)</label>
                    <input
                      type="number"
                      value={newCaptionEnd}
                      onChange={(e) => setNewCaptionEnd(Number(e.target.value))}
                      step={0.1}
                      min={0}
                      className="w-full px-2 py-1 rounded bg-black/30 border border-white/10 text-white text-[10px] focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!newCaptionText.trim()) return;
                    setCaptions((prev: any) => [...prev, {
                      id: Math.random().toString(36).substr(2, 9),
                      text: newCaptionText.trim(),
                      startTime: newCaptionStart,
                      endTime: Math.max(newCaptionStart + 0.1, newCaptionEnd),
                    }]);
                    setNewCaptionText('');
                    setNewCaptionStart(0);
                    setNewCaptionEnd(3);
                  }}
                  className="w-full py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[8px] font-black uppercase hover:bg-cyan-500/30 transition-all"
                >
                  + Add Caption
                </button>
              </div>

              {/* Auto-caption via Web Speech API + captureStream */}
              {autoCaptionStatus ? (
                <div className="px-2 py-1.5 rounded-lg bg-black/30 border border-white/10 text-[8px] font-bold text-slate-300 text-center leading-relaxed">
                  {autoCaptionStatus}
                </div>
              ) : null}
              <button
                onClick={handleAutoCaption}
                disabled={isAutoCapturing}
                className={`w-full py-2 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1.5 transition-all ${
                  isAutoCapturing
                    ? 'bg-red-500/20 border border-red-500/40 text-red-300 animate-pulse cursor-not-allowed'
                    : 'bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25'
                }`}
              >
                {isAutoCapturing ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-ping mr-1" />
                    Capturing Audio…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Auto-Caption from Audio
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Style Presets */}
              <div>
                <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block mb-1">🎨 Presets</label>
                <div className="grid grid-cols-2 gap-1 max-h-[92px] overflow-y-auto custom-scrollbar">
                  {CAPTION_STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setCaptionStylePreset(preset.id);
                        setCaptionStyle((prev: any) => ({
                          ...prev,
                          fontId: preset.fontId,
                          fontSize: preset.fontSize,
                          color: preset.color,
                          bgEnabled: preset.bgEnabled,
                          bgColorHex: preset.bgColorHex,
                          bold: preset.bold,
                          italic: preset.italic,
                          outline: preset.outline,
                          alignment: preset.alignment,
                        }));
                      }}
                      className={`px-2 py-2 rounded text-left text-[7px] font-bold uppercase border transition-all ${captionStylePreset === preset.id ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 ring-2 ring-cyan-500/30' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                    >
                      <div>{preset.label}</div>
                      <div className="text-[6px] text-slate-500 normal-case font-normal">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Font picker */}
              <div>
                <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Font</label>
                <div className="grid grid-cols-2 gap-1 max-h-[68px] overflow-y-auto custom-scrollbar">
                  {textFontOptions.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => {
                        setCaptionStylePreset(null);
                        setCaptionStyle((prev: any) => ({ ...prev, fontId: font.id }));
                      }}
                      className={`px-2 py-1 rounded text-left text-[7px] font-bold uppercase border transition-colors ${
                        captionStyle.fontId === font.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                      }`}
                      style={{ fontFamily: font.family }}
                    >
                      {font.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size & Color */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block">Size <span className="text-slate-600 font-mono normal-case">{captionStyle.fontSize}px</span></label>
                  <input
                    type="range"
                    min={14}
                    max={72}
                    value={captionStyle.fontSize}
                    onChange={(e) => setCaptionStyle((prev: any) => ({ ...prev, fontSize: Number(e.target.value) }))}
                    className="w-full accent-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block">Color</label>
                  <input
                    type="color"
                    value={captionStyle.color}
                    onChange={(e) => setCaptionStyle((prev: any) => ({ ...prev, color: e.target.value }))}
                    className="w-full h-7 rounded bg-transparent border border-white/10 cursor-pointer mt-0.5"
                  />
                </div>
              </div>

              {/* Background box */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Background Box</label>
                  <button
                    onClick={() => setCaptionStyle((prev: any) => ({ ...prev, bgEnabled: !prev.bgEnabled }))}
                    className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border transition-all ${
                      captionStyle.bgEnabled
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        : 'bg-white/5 text-slate-500 border-white/10'
                    }`}
                  >
                    {captionStyle.bgEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                {captionStyle.bgEnabled && (
                  <input
                    type="color"
                    value={captionStyle.bgColorHex}
                    onChange={(e) => setCaptionStyle((prev: any) => ({ ...prev, bgColorHex: e.target.value }))}
                    className="w-full h-6 rounded bg-transparent border border-white/10 cursor-pointer"
                  />
                )}
              </div>

              {/* Bold / Italic / Outline */}
              <div>
                <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Text Style</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCaptionStyle((prev: any) => ({ ...prev, bold: !prev.bold }))}
                    className={`flex-1 py-1.5 rounded border text-[8px] transition-all flex items-center justify-center ${
                      captionStyle.bold ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Bold className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setCaptionStyle((prev: any) => ({ ...prev, italic: !prev.italic }))}
                    className={`flex-1 py-1.5 rounded border text-[8px] transition-all flex items-center justify-center ${
                      captionStyle.italic ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Italic className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setCaptionStyle((prev: any) => ({ ...prev, outline: !prev.outline }))}
                    className={`flex-1 py-1.5 rounded border text-[8px] font-black uppercase transition-all ${
                      captionStyle.outline ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                    }`}
                    title="Text Outline"
                  >
                    T
                  </button>
                </div>
              </div>

              {/* Alignment */}
              <div>
                <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Alignment</label>
                <div className="flex gap-1">
                  {(['left', 'center', 'right'] as const).map((align) => {
                    const AlignIcon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
                    return (
                      <button
                        key={align}
                        onClick={() => setCaptionStyle((prev: any) => ({ ...prev, alignment: align }))}
                        className={`flex-1 py-1.5 rounded border transition-all flex items-center justify-center ${
                          captionStyle.alignment === align
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <AlignIcon className="w-3 h-3" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Position */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Pos X</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={captionStyle.posX}
                    onChange={(e) => setCaptionStyle((prev: any) => ({ ...prev, posX: Number(e.target.value) }))}
                    className="w-full accent-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Pos Y</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={captionStyle.posY}
                    onChange={(e) => setCaptionStyle((prev: any) => ({ ...prev, posY: Number(e.target.value) }))}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>

              {/* Place on preview */}
              <button
                onClick={() => setIsCaptionPlacementMode(!isCaptionPlacementMode)}
                className={`w-full py-1.5 rounded text-[8px] font-black uppercase border transition-colors ${
                  isCaptionPlacementMode
                    ? 'bg-cyan-500 text-[#0b0d1f] border-cyan-400'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/15'
                }`}
              >
                {isCaptionPlacementMode ? 'Click Preview to Place' : 'Place on Preview'}
              </button>
            </div>
          )}
        </div>
      );
    default:
      return null;
  }
});

export const QuickEditStyleScreen = memo(function QuickEditStyleScreen() {
    type FilterType =
      | 'none'
      | 'vintage'
      | 'black-white'
      | 'cinematic'
      | 'warm'
      | 'cool'
      | 'sepia'
      | 'hdr'
      | 'vivid'
      | 'soft-glow'
      | 'retro-film';

  const navigate = useNavigate();
  const location = useLocation();
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // -- State Management --
  const [selectedStyle, setSelectedStyle] = useState("youtube");
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isCustomFrameOpen, setIsCustomFrameOpen] = useState(false);
  const [customFrame, setCustomFrame] = useState({ width: 1920, height: 1080 });
  const [fps, setFps] = useState(60);
  const [exportQuality, setExportQuality] = useState("1080p");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    preset: true,
    transform: false,
    cropping: false,
    speed: false,
    audio: false,
    text: false,
    fx: false
  });

  const [watermark, setWatermark] = useState(true);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState<"watermark" | "4k" | "60fps" | "general">("general");
  const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false);
  const { selectedMusic, clearMusic } = useMusicContext();

  const handlePremiumIntercept = (feature: "watermark" | "4k" | "60fps") => {
    setPremiumFeature(feature);
    setIsPremiumModalOpen(true);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    console.log("Loading project from history:", item);
    if (item.config) {
      if (item.config.style) setSelectedStyle(item.config.style);
      if (item.config.ratio) setAspectRatio(item.config.ratio);
      if (item.config.fps) setFps(item.config.fps);
      if (item.config.exportQuality) setExportQuality(item.config.exportQuality);
      if (item.config.watermark !== undefined) setWatermark(item.config.watermark);
      if (item.config.aiOptions) setAiOptions(prev => ({ ...prev, ...item.config.aiOptions }));
    }
    setActiveTool(null);
  };

  const [mediaItems, setMediaItems] = useState<Array<{ id: string, file: File | null, preview: string, type: 'video' | 'image', duration: number }>>([]);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [audioTracks, setAudioTracks] = useState<Array<{ id: string, name: string, type: 'extracted' | 'direct', file?: File }>>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showAudioChoice, setShowAudioChoice] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [extractingAudio, setExtractingAudio] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [history, setHistory] = useState<Array<string>>([]); // Store as JSON strings for easier comparison
  const [historyIndex, setHistoryIndex] = useState(-1);
  const createdPreviewUrlsRef = useRef<string[]>([]);

  // Manage audio object URL to prevent memory leaks
  useEffect(() => {
    if (audioTracks.length > 0 && audioTracks[0].file) {
      const url = URL.createObjectURL(audioTracks[0].file);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAudioUrl(null);
    }
  }, [audioTracks]);

  useEffect(() => {
    return () => {
      createdPreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      createdPreviewUrlsRef.current = [];
    };
  }, []);

  const saveToUndo = useCallback((items: typeof mediaItems) => {
    const itemsStr = JSON.stringify(items);
    setHistory(prev => {
      // Don't save if identical to last state
      if (prev[historyIndex] === itemsStr) return prev;
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, itemsStr];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevItems = JSON.parse(history[historyIndex - 1]);
      setMediaItems(prevItems);
      setHistoryIndex(prev => prev - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextItems = JSON.parse(history[historyIndex + 1]);
      setMediaItems(nextItems);
      setHistoryIndex(prev => prev + 1);
    }
  };

  const getMediaDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        resolve(3.0); // Default 3s for images
        return;
      }
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.onerror = () => resolve(3.0);
      video.src = URL.createObjectURL(file);
    });
  };

  const getMediaDurationFromPreview = (previewUrl: string, type: 'video' | 'image'): Promise<number> => {
    return new Promise((resolve) => {
      if (type === 'image') {
        resolve(3.0);
        return;
      }
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const duration = Number(video.duration || 0);
        resolve(duration > 0 ? duration : 10);
      };
      video.onerror = () => resolve(10);
      video.src = previewUrl;
    });
  };

  const [aiOptions, setAiOptions] = useState({
    subtitles: true,
    autoCuts: true,
    backgroundMusic: false,
    faceTracking: true,
  });
  const [prompt, setPrompt] = useState("");
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isTextPlacementMode, setIsTextPlacementMode] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const [overlayFontId, setOverlayFontId] = useState('serif');
  const [overlayFontSize, setOverlayFontSize] = useState(48);
  const [overlayColor, setOverlayColor] = useState('#FFFFFF');
  const [overlayPosX, setOverlayPosX] = useState(50);
  const [overlayPosY, setOverlayPosY] = useState(50);
  const [speedValue, setSpeedValue] = useState(1);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(1);
  const [zoomToolAmount, setZoomToolAmount] = useState(1);
  const [cropCenterX, setCropCenterX] = useState(50);
  const [cropCenterY, setCropCenterY] = useState(50);
  const [cropWidthPct, setCropWidthPct] = useState(100);
  const [cropHeightPct, setCropHeightPct] = useState(100);
  const [keyframeMode, setKeyframeMode] = useState<'none' | 'zoom-in' | 'zoom-out' | 'pulse'>('none');
  const [keyframeAmount, setKeyframeAmount] = useState(1.25);
  const [keyframeProgress, setKeyframeProgress] = useState(0);
  const [clipTrimRanges, setClipTrimRanges] = useState<Record<string, { start: number; end: number | null }>>({});
  const [clipSettings, setClipSettings] = useState<Record<string, any>>({});

  type TransitionType =
    | 'none'
    | 'cross-dissolve'
    | 'slide-left'
    | 'slide-right'
    | 'dip-black'
    | 'dip-white'
    | 'zoom-transition'
    | 'blur-transition'
    | 'spin-transition'
    | 'glitch-transition'
    | 'flash-transition';

  const [clipTransitions, setClipTransitions] = useState<Record<string, TransitionType>>({});
  const [transitionOverlay, setTransitionOverlay] = useState<{
    fromId: string;
    toId: string;
    type: TransitionType;
    startAt: number;
    durationMs: number;
  } | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [selectedEffect, setSelectedEffect] = useState<'none' | 'fade-in' | 'blur' | 'zoom' | 'color-correction' | 'vintage' | 'black-white' | 'cinematic' | 'warm' | 'cool' | 'sepia' | 'hdr' | 'vivid' | 'soft-glow' | 'retro-film' | 'green-screen' | 'slow-motion' | 'glitch' | 'transition' | 'slide-left' | 'slide-right' | 'text-animation' | 'motion-tracking'>('none');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const [blurAmount, setBlurAmount] = useState(10);
  const [previewOpacity, setPreviewOpacity] = useState(1);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);
  const [slowMotionSpeed, setSlowMotionSpeed] = useState(0.25);
  const [glitchIntensity, setGlitchIntensity] = useState(1);
  const [animatedText, setAnimatedText] = useState('');

  // --- Caption state ---
  const [captions, setCaptions] = useState<Array<{ id: string; text: string; startTime: number; endTime: number }>>([]);
  const [currentCaption, setCurrentCaption] = useState<{ id: string; text: string; startTime: number; endTime: number } | null>(null);
  const [captionLanguage, setCaptionLanguage] = useState('en');
  const [captionStyle, setCaptionStyle] = useState({
    fontId: 'sans',
    fontSize: 32,
    color: '#FFFFFF',
    bgEnabled: true,
    bgColorHex: '#000000',
    alignment: 'center' as 'left' | 'center' | 'right',
    bold: true,
    italic: false,
    outline: false,
    posX: 50,
    posY: 85,
  });
  const [captionStylePreset, setCaptionStylePreset] = useState<string | null>(null);
  const [isCaptionPlacementMode, setIsCaptionPlacementMode] = useState(false);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [autoCaptionStatus, setAutoCaptionStatus] = useState('');

  // --- Read-line state ---
  const [showReadLine, setShowReadLine] = useState(false);
  const [readLineDirection, setReadLineDirection] = useState<'horizontal' | 'vertical'>('horizontal');

  // --- Auto-caption: stopAutoCaptionRef lets us stop capture from outside the closure ---
  const stopAutoCaptionRef = useRef<(() => void) | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isToolboxOpen, setIsToolboxOpen] = useState(false);
  const [timelineSize, setTimelineSize] = useState<'minimized' | 'normal' | 'maximized'>('normal');

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewFrameRef = useRef<HTMLDivElement>(null);

  // --- Auto-caption handler (Web Speech API + video captureStream trick) ---
  const handleAutoCaption = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setAutoCaptionStatus('❌ Speech recognition not supported. Please use Chrome or Edge.');
      return;
    }
    if (!videoRef.current) {
      setAutoCaptionStatus('❌ No video loaded. Add a video clip first.');
      return;
    }

    setIsAutoCapturing(true);
    setAutoCaptionStatus('🎤 Initializing…');

    const video = videoRef.current;
    
    // Ensure video is loaded before capturing
    if (!video.src) {
      setAutoCaptionStatus('❌ Video source not ready. Please wait for video to load.');
      setIsAutoCapturing(false);
      return;
    }

    // Grab the video element’s live audio stream
    const capturedStream: MediaStream | null =
      (video as any).captureStream?.() ||
      (video as any).mozCaptureStream?.() ||
      null;
    const audioTracks = capturedStream ? capturedStream.getAudioTracks() : [];
    const audioStream = audioTracks.length > 0 ? new MediaStream(audioTracks) : null;

    // Temporarily override getUserMedia so SpeechRecognition uses video audio
    const origGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    let gumRestored = false;
    
    if (audioStream) {
      navigator.mediaDevices.getUserMedia = async (constraints: any) => {
        if (constraints?.audio) return audioStream;
        return origGUM(constraints);
      };
      
      // Restore after giving recognition time to grab the stream
      const restoreTimeout = setTimeout(() => {
        if (!gumRestored) {
          gumRestored = true;
          navigator.mediaDevices.getUserMedia = origGUM;
        }
      }, 2500);
    } else {
      setAutoCaptionStatus('❌ Could not setup audio stream for recognition.');
      setIsAutoCapturing(false);
      return;
    }

    recognition.onstart = () => {
      setAutoCaptionStatus(
        audioStream
          ? '🎤 Capturing video audio… (play is running)'
          : '🎤 Listening via microphone…'
      );
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = (event.results[i][0].transcript || '').trim();
          if (text) {
            const endTime = videoRef.current ? videoRef.current.currentTime : 0;
            const wordCount = text.split(/\s+/).length;
            const startTime = Math.max(0, endTime - wordCount * 0.45);
            setCaptions(prev => [
              ...prev,
              { id: Math.random().toString(36).substr(2, 9), text, startTime, endTime },
            ]);
            setAutoCaptionStatus(`✅ "${text.length > 32 ? text.slice(0, 32) + '…' : text}"`);
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return; // ignore silence
      console.error('Speech Recognition error:', event.error);
      setAutoCaptionStatus(`❌ Error: ${event.error || 'Unknown error'}`);
      cleanup();
    };

    recognition.onend = () => {
      // Chrome stops recognition after ~60s — restart if video is still playing
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        try { recognition.start(); } catch {}
      } else {
        cleanup();
      }
    };

    const cleanup = () => {
      navigator.mediaDevices.getUserMedia = origGUM;
      setIsAutoCapturing(false);
      if (videoRef.current) videoRef.current.pause();
      setIsPlaying(false);
      setAutoCaptionStatus(prev =>
        prev.startsWith('❌') ? prev : '✅ Captions generated successfully!'
      );
      stopAutoCaptionRef.current = null;
    };

    stopAutoCaptionRef.current = () => { recognition.stop(); cleanup(); };

    const onEnded = () => {
      recognition.stop();
      cleanup();
      video.removeEventListener('ended', onEnded);
    };
    video.addEventListener('ended', onEnded);

    // Seek to start and play the video
    video.currentTime = 0;
    setIsPlaying(true);
    video.play().catch(() => {});

    try {
      recognition.start();
    } catch (err: any) {
      setAutoCaptionStatus(`❌ Could not start: ${err.message}`);
      cleanup();
    }
  }, [setCaptions, setIsPlaying, setIsAutoCapturing, setAutoCaptionStatus]);

  const greenScreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const greenScreenAnimationRef = useRef<number | null>(null);
  const previousFrameRef = useRef<ImageData | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const thumbnailVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const activePreviewItem = mediaItems.find((i) => i.id === activePreviewId) || null;

  const getTrimRangeForItem = useCallback((itemId: string, duration: number) => {
    const range = clipTrimRanges[itemId];
    const safeDuration = Math.max(0.01, Number(duration) || 0.01);
    const start = Math.max(0, Math.min(safeDuration - 0.01, Number(range?.start) || 0));
    const rawEnd = range?.end;
    const end = rawEnd == null
      ? safeDuration
      : Math.max(start + 0.01, Math.min(safeDuration, Number(rawEnd) || safeDuration));
    return { start, end };
  }, [clipTrimRanges]);

  const getEffectiveDurationForItem = useCallback((item: { id: string; type: 'video' | 'image'; duration: number }) => {
    if (item.type !== 'video') return item.duration;
    const { start, end } = getTrimRangeForItem(item.id, item.duration);
    return Math.max(0.01, end - start);
  }, [getTrimRangeForItem]);

  const getTotalEffectiveDuration = useCallback(() => {
    return mediaItems.reduce((acc, item) => acc + getEffectiveDurationForItem(item), 0);
  }, [mediaItems, getEffectiveDurationForItem]);

  // Load settings per clip when switching activePreviewId
  useEffect(() => {
    if (!activePreviewId) return;
    const settings = clipSettings[activePreviewId] || {};
    
    setSelectedEffect(settings.selectedEffect || 'none');
    setSelectedFilter(settings.selectedFilter || 'none');
    setSpeedValue(settings.speedValue ?? 1);
    setRotationDegrees(settings.rotationDegrees ?? 0);
    setVolumeLevel(settings.volumeLevel ?? 1);
    setZoomToolAmount(settings.zoomToolAmount ?? 1);
    
    setCropCenterX(settings.cropCenterX ?? 50);
    setCropCenterY(settings.cropCenterY ?? 50);
    setCropWidthPct(settings.cropWidthPct ?? 100);
    setCropHeightPct(settings.cropHeightPct ?? 100);
    
    setKeyframeMode(settings.keyframeMode || 'none');
    setKeyframeAmount(settings.keyframeAmount ?? 1.25);
    
    setOverlayText(settings.overlayText || '');
    setOverlayFontId(settings.overlayFontId || 'serif');
    setOverlayFontSize(settings.overlayFontSize ?? 48);
    setOverlayColor(settings.overlayColor || '#FFFFFF');
    setOverlayPosX(settings.overlayPosX ?? 50);
    setOverlayPosY(settings.overlayPosY ?? 50);
    
    setBlurAmount(settings.blurAmount ?? 10);
    setBrightness(settings.brightness ?? 1);
    setContrast(settings.contrast ?? 1);
    setSaturation(settings.saturation ?? 1);
    setSlowMotionSpeed(settings.slowMotionSpeed ?? 0.25);
    setGlitchIntensity(settings.glitchIntensity ?? 1);
  }, [activePreviewId]);

  // Sync state changes to clipSettings per clip
  useEffect(() => {
    if (!activePreviewId) return;
    setClipSettings(prev => {
      const current = prev[activePreviewId] || {};
      if (
        current.selectedEffect === selectedEffect &&
        current.selectedFilter === selectedFilter &&
        current.speedValue === speedValue &&
        current.rotationDegrees === rotationDegrees &&
        current.volumeLevel === volumeLevel &&
        current.zoomToolAmount === zoomToolAmount &&
        current.cropCenterX === cropCenterX &&
        current.cropCenterY === cropCenterY &&
        current.cropWidthPct === cropWidthPct &&
        current.cropHeightPct === cropHeightPct &&
        current.keyframeMode === keyframeMode &&
        current.keyframeAmount === keyframeAmount &&
        current.overlayText === overlayText &&
        current.overlayFontId === overlayFontId &&
        current.overlayFontSize === overlayFontSize &&
        current.overlayColor === overlayColor &&
        current.overlayPosX === overlayPosX &&
        current.overlayPosY === overlayPosY &&
        current.blurAmount === blurAmount &&
        current.brightness === brightness &&
        current.contrast === contrast &&
        current.saturation === saturation &&
        current.slowMotionSpeed === slowMotionSpeed &&
        current.glitchIntensity === glitchIntensity
      ) {
        return prev;
      }
      
      return {
        ...prev,
        [activePreviewId]: {
          selectedEffect,
          selectedFilter,
          speedValue,
          rotationDegrees,
          volumeLevel,
          zoomToolAmount,
          cropCenterX,
          cropCenterY,
          cropWidthPct,
          cropHeightPct,
          keyframeMode,
          keyframeAmount,
          overlayText,
          overlayFontId,
          overlayFontSize,
          overlayColor,
          overlayPosX,
          overlayPosY,
          blurAmount,
          brightness,
          contrast,
          saturation,
          slowMotionSpeed,
          glitchIntensity
        }
      };
    });
  }, [
    activePreviewId,
    selectedEffect,
    selectedFilter,
    speedValue,
    rotationDegrees,
    volumeLevel,
    zoomToolAmount,
    cropCenterX,
    cropCenterY,
    cropWidthPct,
    cropHeightPct,
    keyframeMode,
    keyframeAmount,
    overlayText,
    overlayFontId,
    overlayFontSize,
    overlayColor,
    overlayPosX,
    overlayPosY,
    blurAmount,
    brightness,
    contrast,
    saturation,
    slowMotionSpeed,
    glitchIntensity
  ]);

  const triggerClipTransition = useCallback((nextId: string) => {
    if (!activePreviewId || activePreviewId === nextId) {
      setActivePreviewId(nextId);
      return;
    }

    // Transition is primarily defined by the outgoing (currently playing) clip.
    // Keep next-clip fallback so existing assignments still work.
    const transitionType = clipTransitions[activePreviewId] || clipTransitions[nextId] || 'none';
    if (transitionType === 'none') {
      setActivePreviewId(nextId);
      return;
    }

    setTransitionOverlay({
      fromId: activePreviewId,
      toId: nextId,
      type: transitionType,
      startAt: performance.now(),
      durationMs: 1400,
    });
    setTransitionProgress(0);
    setActivePreviewId(nextId);
  }, [activePreviewId, clipTransitions]);

  const playNextMedia = useCallback(() => {
    const currentIndex = mediaItems.findIndex(i => i.id === activePreviewId);
    if (currentIndex !== -1 && currentIndex < mediaItems.length - 1) {
      const nextId = mediaItems[currentIndex + 1].id;
      triggerClipTransition(nextId);
      // Ensure we keep playing the next track
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [activePreviewId, mediaItems, triggerClipTransition]);

  const togglePlay = () => {
    const activeItem = mediaItems.find(i => i.id === activePreviewId);
    if (activeItem?.type === 'video' && videoRef.current) {
      const trim = getTrimRangeForItem(activeItem.id, activeItem.duration);
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        if (videoRef.current.currentTime < trim.start || videoRef.current.currentTime > trim.end) {
          videoRef.current.currentTime = trim.start;
        }
        videoRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && mediaItems.length > 0) {
      const activeIndex = mediaItems.findIndex(i => i.id === activePreviewId);
      const activeItem = activeIndex >= 0 ? mediaItems[activeIndex] : null;
      const timeBefore = mediaItems
        .slice(0, activeIndex)
        .reduce((acc, item) => acc + getEffectiveDurationForItem(item), 0);
      const totalDuration = getTotalEffectiveDuration();

      let currentLocalTime = videoRef.current.currentTime;
      if (activeItem?.type === 'video') {
        const trim = getTrimRangeForItem(activeItem.id, activeItem.duration);
        if (currentLocalTime < trim.start) {
          videoRef.current.currentTime = trim.start;
          currentLocalTime = trim.start;
        }
        if (currentLocalTime >= trim.end) {
          videoRef.current.currentTime = trim.end;
          setProgress(((timeBefore + (trim.end - trim.start)) / (totalDuration || 1)) * 100 || 0);
          playNextMedia();
          return;
        }
        currentLocalTime = Math.max(0, currentLocalTime - trim.start);
      }

      const globalTime = timeBefore + currentLocalTime;
      const p = (globalTime / totalDuration) * 100;
      setProgress(p || 0);

      if (selectedEffect === 'fade-in') {
        const duration = videoRef.current.duration || 0;
        if (duration > 0) {
          const fadeWindow = duration * 0.5;
          const opacity = Math.min(1, videoRef.current.currentTime / Math.max(fadeWindow, 0.001));
          setPreviewOpacity(opacity);
        } else {
          setPreviewOpacity(0);
        }
      } else {
        setPreviewOpacity(1);
      }

      if (selectedEffect === 'zoom') {
        const duration = videoRef.current.duration || 0;
        const progress = duration > 0 ? videoRef.current.currentTime / duration : 0;
        setPreviewZoom(1 + progress * 1.5);
      } else {
        setPreviewZoom(1);
      }

      if (activeItem?.type === 'video') {
        const trim = getTrimRangeForItem(activeItem.id, activeItem.duration);
        const localDuration = Math.max(0.01, trim.end - trim.start);
        const localTime = Math.max(0, (videoRef.current.currentTime || 0) - trim.start);
        setKeyframeProgress(Math.max(0, Math.min(1, localTime / localDuration)));
      }

      // Update active caption based on current video time
      const ct = videoRef.current.currentTime;
      const activeCaption = captions.find(c => ct >= c.startTime && ct < c.endTime) ?? null;
      setCurrentCaption(activeCaption);
    }
  };

  const handleTimelineClick = useCallback((globalSeekTime: number) => {
    const totalDuration = getTotalEffectiveDuration();
    if (totalDuration === 0) return;

    const clampedSeekTime = Math.max(0, Math.min(totalDuration, globalSeekTime));
    const pos = (clampedSeekTime / totalDuration) * 100;

    // Find which item this global time corresponds to
    let accumulated = 0;
    for (const item of mediaItems) {
      const itemEffectiveDuration = getEffectiveDurationForItem(item);
      if (clampedSeekTime <= accumulated + itemEffectiveDuration) {
        const offset = clampedSeekTime - accumulated;
        triggerClipTransition(item.id);
        // Use a tiny timeout to let the video/img mount before seeking
        setTimeout(() => {
          if (videoRef.current && item.type === 'video') {
            const trim = getTrimRangeForItem(item.id, item.duration);
            videoRef.current.currentTime = Math.max(trim.start, Math.min(trim.end, trim.start + offset));
          }
        }, 10);
        break;
      }
      accumulated += itemEffectiveDuration;
    }
    setProgress(pos);
  }, [mediaItems, getEffectiveDurationForItem, getTotalEffectiveDuration, triggerClipTransition, getTrimRangeForItem]);

  // Sync background audio with main playback
  useEffect(() => {
    if (audioRef.current && audioTracks.length > 0) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Audio play blocked", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, audioTracks.length]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.volume = Math.max(0, Math.min(1, volumeLevel));
    }
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = Math.max(0, Math.min(1, volumeLevel));
    }
  }, [isMuted, volumeLevel]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {
          // If autoplay with audio is blocked, force muted playback for reliable preview.
          setIsMuted(true);
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(e => console.log("Video play failed", e));
          }
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, activePreviewId]);

  useEffect(() => {
    if (selectedEffect === 'none') {
      setPreviewOpacity(1);
      setPreviewZoom(1);
      return;
    }
    if (selectedEffect === 'fade-in') {
      setPreviewOpacity(0);
    } else {
      setPreviewOpacity(1);
    }

    if (selectedEffect !== 'zoom') {
      setPreviewZoom(1);
    }
  }, [selectedEffect, activePreviewId]);

  useEffect(() => {
    if (!videoRef.current) return;
    const effectSpeed = selectedEffect === 'slow-motion' ? slowMotionSpeed : 1;
    const manualSpeed = Math.abs(speedValue - 1) > 0.001 ? speedValue : effectSpeed;
    const resolvedSpeed = Math.max(0.1, Math.min(3, manualSpeed));
    videoRef.current.playbackRate = resolvedSpeed;
  }, [selectedEffect, slowMotionSpeed, speedValue, activePreviewId]);

  useEffect(() => {
    const activeItem = mediaItems.find((i) => i.id === activePreviewId);
    if (!activeItem || activeItem.type !== 'video' || !videoRef.current) return;
    const trim = getTrimRangeForItem(activeItem.id, activeItem.duration);
    if (videoRef.current.currentTime < trim.start || videoRef.current.currentTime > trim.end) {
      videoRef.current.currentTime = trim.start;
    }
  }, [activePreviewId, mediaItems, getTrimRangeForItem, clipTrimRanges]);

  useEffect(() => {
    const activeCanvasMode = CANVAS_PREVIEW_EFFECTS.includes(selectedEffect)
      ? selectedEffect
      : CANVAS_PREVIEW_FILTERS.includes(selectedFilter)
      ? selectedFilter
      : null;

    if (!activeCanvasMode) {
      if (greenScreenAnimationRef.current !== null) {
        cancelAnimationFrame(greenScreenAnimationRef.current);
        greenScreenAnimationRef.current = null;
      }
      previousFrameRef.current = null;
      return;
    }

    const video = videoRef.current;
    const canvas = greenScreenCanvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawGreenScreen = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (activeCanvasMode === 'green-screen') {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (g > 120 && Math.abs(r - b) < 40) {
              data[i + 3] = 0;
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }

        if (activeCanvasMode === 'glitch') {
          for (let i = 0; i < glitchIntensity * 30; i++) {
            const x = (Math.sin(Date.now() * 0.01 + i) + 1) * canvas.width * 0.5;
            const y = Math.random() * canvas.height;
            ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
            ctx.fillRect(x, y, 3, 1);
          }
        }

        if (activeCanvasMode === 'vintage') {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Old-film wash: warmer lows + reduced saturation.
            data[i] = r * 0.7 + 20;
            data[i + 1] = g * 0.6 + 15;
            data[i + 2] = b * 0.5 + 10;

            const grain = (Math.random() - 0.5) * 30;
            data[i] = Math.max(0, Math.min(255, data[i] + grain));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
          }

          ctx.putImageData(imageData, 0, 0);
        }

        if (activeCanvasMode === 'soft-glow') {
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.filter = 'blur(2px) brightness(1.1)';
          ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
          ctx.restore();
          ctx.filter = 'none';
        }

        if (activeCanvasMode === 'retro-film') {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            data[i + 2] = data[i + 2] * 0.85;
            data[i + 1] = Math.min(255, data[i + 1] * 1.05);

            if (Math.random() < 0.001) {
              data[i] = 255;
              data[i + 1] = 255;
              data[i + 2] = 255;
            }
          }

          ctx.putImageData(imageData, 0, 0);

          ctx.save();
          ctx.strokeStyle = 'rgba(0,0,0,0.08)';
          ctx.lineWidth = 1;
          for (let y = 0; y < canvas.height; y += 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Transition previews are handled by per-clip transition overlay,
        // not by global effect canvas rendering.

        if (activeCanvasMode === 'text-animation' && overlayText.trim().length > 0) {
          const textProgress = (video.currentTime * 2) % 2;
          const scale = 1 + Math.sin(textProgress * Math.PI) * 0.3;
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = 'bold 64px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 20;
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.scale(scale, scale);
          ctx.fillText(overlayText, 0, 0);
          ctx.restore();
        }

        if (activeCanvasMode === 'motion-tracking') {
          const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          if (previousFrameRef.current) {
            const currentData = currentFrame.data;
            const prevData = previousFrameRef.current.data;
            const step = 80;
            for (let y = 0; y < canvas.height; y += step) {
              for (let x = 0; x < canvas.width; x += step) {
                const idx = (y * canvas.width + x) * 4;
                const motion = Math.abs(currentData[idx] - prevData[idx]) + Math.abs(currentData[idx + 1] - prevData[idx + 1]) + Math.abs(currentData[idx + 2] - prevData[idx + 2]);
                if (motion > 70) {
                  ctx.fillStyle = `rgba(255, 0, 0, ${Math.min(0.8, motion / 255)})`;
                  ctx.beginPath();
                  ctx.arc(x, y, 10, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }
          }
          previousFrameRef.current = currentFrame;
        }
      }

      if (isPlaying) {
        greenScreenAnimationRef.current = requestAnimationFrame(drawGreenScreen);
      }
    };

    drawGreenScreen();

    return () => {
      if (greenScreenAnimationRef.current !== null) {
        cancelAnimationFrame(greenScreenAnimationRef.current);
        greenScreenAnimationRef.current = null;
      }
    };
  }, [selectedEffect, selectedFilter, isPlaying, activePreviewId, glitchIntensity, overlayText]);

  // Keep timeline thumbnail videos in sync with the main preview transport state.
  useEffect(() => {
    mediaItems.forEach((item) => {
      if (item.type !== 'video') return;
      const thumbVideo = thumbnailVideoRefs.current[item.id];
      if (!thumbVideo) return;

      if (isPlaying && activePreviewId === item.id) {
        thumbVideo.play().catch(() => { });
      } else {
        thumbVideo.pause();
      }
    });
  }, [isPlaying, activePreviewId, mediaItems]);

  useEffect(() => {
    if (!transitionOverlay) return;

    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - transitionOverlay.startAt;
      const p = Math.min(1, elapsed / transitionOverlay.durationMs);
      setTransitionProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setTransitionOverlay(null);
        setTransitionProgress(0);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [transitionOverlay]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let progressInterval: ReturnType<typeof setInterval>;
    const activeItem = mediaItems.find(i => i.id === activePreviewId);

    if (isPlaying && activeItem?.type === 'image') {
      const startTime = Date.now();
      const imageDuration = (activeItem.duration || 3) * 1000;

      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const activeIndex = mediaItems.findIndex(i => i.id === activePreviewId);
        const timeBefore = mediaItems.slice(0, activeIndex).reduce((acc, item) => acc + item.duration, 0);
        const totalDuration = mediaItems.reduce((acc, item) => acc + item.duration, 0);

        const globalTime = timeBefore + Math.min(elapsed / 1000, activeItem.duration);
        const p = (globalTime / (totalDuration || 1)) * 100;
        setProgress(Math.min(p, 100) || 0);
        const localProgress = Math.min(1, (elapsed / 1000) / Math.max(0.01, activeItem.duration));
        setKeyframeProgress(localProgress);
      }, 100);

      timer = setTimeout(() => {
        playNextMedia();
      }, imageDuration);
    }
    return () => {
      clearTimeout(timer);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isPlaying, activePreviewId, mediaItems, playNextMedia]);

  useEffect(() => {
    if (location.state && typeof location.state === 'object') {
      const state = location.state as any;
      const { initialMedia, initialAudio } = state;

      if (initialMedia && (initialMedia.file || initialMedia.preview)) {
        const preview = initialMedia.file
          ? URL.createObjectURL(initialMedia.file)
          : initialMedia.preview;

        if (initialMedia.file && preview) {
          createdPreviewUrlsRef.current.push(preview);
        }

        const initialType = initialMedia.type || 'video' as const;
        getMediaDurationFromPreview(preview, initialType).then((resolvedDuration) => {
          const newItem = {
            id: 'initial',
            file: initialMedia.file || null,
            preview,
            type: initialType,
            duration: resolvedDuration,
          };
          setMediaItems([newItem]);
          setActivePreviewId('initial');
          // Initialize undo history with initial state
          setHistory([JSON.stringify([newItem])]);
          setHistoryIndex(0);
        });
      }

      if (initialAudio && initialAudio.file) {
        setAudioTracks([{
          id: 'initial-audio',
          name: initialAudio.name,
          type: initialAudio.type || 'direct',
          file: initialAudio.file
        }]);
      }
    }
  }, []);

  // -- Effects --
  useEffect(() => {
    const style = editingStyles.find(s => s.id === selectedStyle);
    if (style && !isCustomFrameOpen) {
      setAspectRatio(style.ratio);
      // Auto-set standard FPS based on style if needed
      if (style.id === 'youtube') setFps(60);
      else setFps(30);
    }
  }, [selectedStyle, isCustomFrameOpen]);

  const getRatioValue = () => {
    if (aspectRatio === '16:9') return 16 / 9;
    if (aspectRatio === '9:16') return 9 / 16;
    if (aspectRatio === '1:1') return 1;
    if (aspectRatio === '4:3') return 4 / 3;
    if (aspectRatio === '4:5') return 4 / 5;
    if (aspectRatio === '21:9') return 21 / 9;
    if (aspectRatio === 'Custom') return customFrame.width / customFrame.height;
    return 16 / 9;
  };

  const getPreviewCssFilter = () => {
    if (selectedEffect === 'blur') return `blur(${blurAmount}px)`;
    if (selectedEffect === 'color-correction') return `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
    return 'none';
  };

  const getPreviewFilterCss = () => {
    if (selectedEffect === 'black-white') return 'grayscale(1)';
    if (selectedEffect === 'cinematic') return 'contrast(1.4) brightness(1.1) saturate(1.2)';
    if (selectedEffect === 'warm') return 'sepia(0.22) saturate(1.15) hue-rotate(-10deg)';
    if (selectedEffect === 'cool') return 'saturate(1.08) hue-rotate(18deg)';
    if (selectedEffect === 'sepia') return 'sepia(1)';
    if (selectedEffect === 'hdr') return 'contrast(1.6) brightness(1.2) saturate(1.4)';
    if (selectedEffect === 'vivid') return 'contrast(1.3) brightness(1.1) saturate(2.5)';

    if (selectedFilter === 'black-white') return 'grayscale(1)';
    if (selectedFilter === 'cinematic') return 'contrast(1.4) brightness(1.1) saturate(1.2)';
    if (selectedFilter === 'warm') return 'sepia(0.22) saturate(1.15) hue-rotate(-10deg)';
    if (selectedFilter === 'cool') return 'saturate(1.08) hue-rotate(18deg)';
    if (selectedFilter === 'sepia') return 'sepia(1)';
    if (selectedFilter === 'hdr') return 'contrast(1.6) brightness(1.2) saturate(1.4)';
    if (selectedFilter === 'vivid') return 'contrast(1.3) brightness(1.1) saturate(2.5)';

    return 'none';
  };

  const getCombinedPreviewFilterCss = () => {
    const effectFilter = getPreviewCssFilter();
    const filterFilter = getPreviewFilterCss();
    if (effectFilter !== 'none' && filterFilter !== 'none') return `${effectFilter} ${filterFilter}`;
    if (effectFilter !== 'none') return effectFilter;
    if (filterFilter !== 'none') return filterFilter;
    return 'none';
  };

  const getCropInsets = () => {
    const halfW = cropWidthPct / 2;
    const halfH = cropHeightPct / 2;
    const left = Math.max(0, Math.min(100, cropCenterX - halfW));
    const right = Math.max(0, Math.min(100, 100 - (cropCenterX + halfW)));
    const top = Math.max(0, Math.min(100, cropCenterY - halfH));
    const bottom = Math.max(0, Math.min(100, 100 - (cropCenterY + halfH)));
    return { left, right, top, bottom };
  };

  const getPreviewClipPath = () => {
    const insets = getCropInsets();
    if (
      Math.abs(insets.left) < 0.001 &&
      Math.abs(insets.right) < 0.001 &&
      Math.abs(insets.top) < 0.001 &&
      Math.abs(insets.bottom) < 0.001
    ) {
      return 'none';
    }
    return `inset(${insets.top}% ${insets.right}% ${insets.bottom}% ${insets.left}%)`;
  };

  const getPreviewTransform = () => {
    const zoomScale = selectedEffect === 'zoom' ? previewZoom : 1;
    let keyframeScale = 1;
    if (keyframeMode === 'zoom-in') {
      keyframeScale = 1 + (keyframeAmount - 1) * keyframeProgress;
    } else if (keyframeMode === 'zoom-out') {
      keyframeScale = keyframeAmount - (keyframeAmount - 1) * keyframeProgress;
    } else if (keyframeMode === 'pulse') {
      keyframeScale = 1 + (keyframeAmount - 1) * Math.sin(keyframeProgress * Math.PI);
    }
    return `scale(${zoomScale * zoomToolAmount * keyframeScale}) rotate(${rotationDegrees}deg)`;
  };

  const activeTrim = activePreviewItem && activePreviewItem.type === 'video'
    ? getTrimRangeForItem(activePreviewItem.id, activePreviewItem.duration)
    : null;

  const hasTrimApplied = activeTrim
    ? activeTrim.start > 0 || (activeTrim.end < (activePreviewItem?.duration || 0) - 0.01)
    : false;

  // -- Handlers --
  const toggleOption = (option: keyof typeof aiOptions) => {
    setAiOptions((prev) => ({ ...prev, [option]: !prev[option] }));
  };

  const copyActiveClip = () => {
    if (!activePreviewId) return;

    setMediaItems((prev) => {
      const index = prev.findIndex((item) => item.id === activePreviewId);
      if (index === -1) return prev;

      const source = prev[index];
      const nextId = Math.random().toString(36).substr(2, 9);
      const preview = source.file ? URL.createObjectURL(source.file) : source.preview;

      if (source.file) {
        createdPreviewUrlsRef.current.push(preview);
      }

      const copyItem = {
        ...source,
        id: nextId,
        preview,
      };

      const updated = [...prev];
      updated.splice(index + 1, 0, copyItem);
      saveToUndo(updated);
      setActivePreviewId(nextId);
      return updated;
    });
  };

  const handleMediaImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems = await Promise.all(files.map(async file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
      duration: await getMediaDuration(file)
    })));

    setActivePreviewId(newItems[0].id);
    setIsPlaying(false);

    setMediaItems(prev => {
      // Clear out initial empty placeholder if dragging in first real item
      const filteredPrev = prev.filter(p => p.id !== 'initial' || p.file !== null);
      const updated = [...filteredPrev, ...newItems];
      saveToUndo(updated);
      return updated;
    });

    if (e.target) {
      e.target.value = '';
    }
  };

  const removeMediaItem = (id: string) => {
    setMediaItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleReorderClips = useCallback((fromIndexOrId: number | string, toIndex: number) => {
    setMediaItems((prev) => {
      const updated = [...prev];
      let fromIdx = -1;
      
      if (typeof fromIndexOrId === 'number') {
        fromIdx = fromIndexOrId;
      } else {
        fromIdx = prev.findIndex((item) => item.id === fromIndexOrId);
      }

      if (fromIdx === -1 || fromIdx === toIndex) return prev;

      const [removed] = updated.splice(fromIdx, 1);
      updated.splice(toIndex, 0, removed);
      
      saveToUndo(updated);
      return updated;
    });
  }, [saveToUndo]);

  const handleAddAudio = (type: 'extracted' | 'direct', trackIndex = 0) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'extracted' ? 'video/*' : 'audio/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        setShowAudioChoice(false);
        return;
      }

      if (type === 'extracted') {
        setAudioError(null);
        setExtractingAudio(true);
        try {
          const extractedFile = await extractAudioFromVideoFile(file);
          setAudioTracks(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            name: extractedFile.name,
            type,
            file: extractedFile,
            trackIndex
          }]);
        } catch (error: any) {
          setAudioError(error?.message || "Failed to extract audio from the selected video.");
        } finally {
          setExtractingAudio(false);
          setShowAudioChoice(false);
        }
      } else {
        setAudioTracks(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type,
          file,
          trackIndex
        }]);
        setShowAudioChoice(false);
      }
    };
    input.click();
  };

  const removeAudioTrack = (id: string) => {
    setAudioTracks(prev => prev.filter(t => t.id !== id));
  };

  const applyTransitionForActiveClip = (transition: TransitionType) => {
    if (!activePreviewId) return;

    setClipTransitions((prev) => ({ ...prev, [activePreviewId]: transition }));

    const currentIndex = mediaItems.findIndex((item) => item.id === activePreviewId);
    if (currentIndex !== -1 && currentIndex < mediaItems.length - 1) {
      const nextId = mediaItems[currentIndex + 1].id;
      setTransitionOverlay({
        fromId: activePreviewId,
        toId: nextId,
        type: transition,
        startAt: performance.now(),
        durationMs: 1400,
      });
      setTransitionProgress(0);
      setActivePreviewId(nextId);
    }

    setActiveTool(null);
  };

  const handleGenerate = () => {
    const effectSettings = {
      blurAmount,
      brightness,
      contrast,
      saturation,
      slowMotionSpeed,
      glitchIntensity,
      animatedText: overlayText.trim().length > 0 ? overlayText : animatedText,
    };

    const mediaForProcessing = mediaItems
      .filter((item) => item.file)
      .map((item) => ({
        id: item.id,
        file: item.file,
        type: item.type,
        duration: item.duration,
      }));

    const transitionPlan = mediaForProcessing.map((item, index) => ({
      index,
      transition: clipTransitions[item.id] || 'none',
    }));

    const audioForProcessing = audioTracks
      .filter((track) => track.file)
      .map((track) => ({
        id: track.id,
        name: track.name,
        type: track.type,
        file: track.file,
      }));

    const editorSelections = {
      style: {
        selected: selectedStyle,
        aspectRatio,
        fps,
        exportQuality,
        watermark,
      },
      effect: {
        selected: selectedEffect,
        enabled: selectedEffect !== 'none',
        settings: effectSettings,
      },
      transitions: {
        transitionPlan,
        clipTransitions,
      },
      filters: {
        enabled: selectedFilter !== 'none' || selectedEffect === 'color-correction',
        selected: selectedFilter,
        brightness,
        contrast,
        saturation,
      },
      speed: {
        enabled: Math.abs(speedValue - 1) > 0.001 || selectedEffect === 'slow-motion',
        value: speedValue,
      },
      trim: {
        enabled: Object.keys(clipTrimRanges).length > 0,
        activeClipId: activePreviewId,
        start: activePreviewId ? (clipTrimRanges[activePreviewId]?.start ?? 0) : 0,
        end: activePreviewId ? (clipTrimRanges[activePreviewId]?.end ?? null) : null,
        clipRanges: clipTrimRanges,
      },
      textOverlay: {
        enabled: overlayText.trim().length > 0,
        text: overlayText,
        fontId: overlayFontId,
        fontFamily: textFontOptions.find((f) => f.id === overlayFontId)?.family || textFontOptions[0].family,
        fontSize: overlayFontSize,
        color: overlayColor,
        position: {
          x: overlayPosX,
          y: overlayPosY,
        },
      },
      rotate: {
        enabled: rotationDegrees % 360 !== 0,
        degrees: rotationDegrees,
      },
      volume: {
        muted: isMuted,
        level: isMuted ? 0 : volumeLevel,
      },
      zoom: {
        enabled: zoomToolAmount > 1.001 || selectedEffect === 'zoom',
        mode: 'in',
        amount: zoomToolAmount,
      },
      crop: {
        enabled:
          cropWidthPct < 99.99 ||
          cropHeightPct < 99.99 ||
          Math.abs(cropCenterX - 50) > 0.01 ||
          Math.abs(cropCenterY - 50) > 0.01,
        centerX: cropCenterX,
        centerY: cropCenterY,
        widthPct: cropWidthPct,
        heightPct: cropHeightPct,
      },
      keyframe: {
        enabled: keyframeMode !== 'none',
        mode: keyframeMode,
        amount: keyframeAmount,
        points:
          keyframeMode === 'none'
            ? []
            : [
                { time: 0, value: keyframeMode === 'zoom-out' ? keyframeAmount : 1 },
                { time: 1, value: keyframeMode === 'zoom-in' ? keyframeAmount : 1 },
              ],
      },
      aiOptions,
      prompt,
      media: {
        items: mediaForProcessing.map((item) => ({ id: item.id, type: item.type, duration: item.duration })),
        count: mediaForProcessing.length,
      },
      audio: {
        tracks: audioForProcessing.map((track) => ({ id: track.id, name: track.name, type: track.type })),
        count: audioForProcessing.length,
      },
    };

    saveToHistory({
      title: `${mediaItems.length > 0 ? mediaItems.length + ' Media Items' : 'Quick Edit'} • ${editingStyles.find(s => s.id === selectedStyle)?.title || selectedStyle}`,
      tool: 'quick-edit',
      config: {
        style: selectedStyle,
        ratio: aspectRatio,
        fps,
        exportQuality,
        watermark,
        aiOptions,
        selectedEffect,
        effectSettings,
        transitionPlan,
        editorSelections,
      }
    });
    navigate(`/quick-edit/processing${location.search}`, {
      state: {
        selectedStyle,
        aspectRatio,
        fps,
        exportQuality,
        watermark,
        aiOptions,
        prompt,
        selectedEffect,
        selectedFilter,
        effectSettings,
        transitionPlan,
        editorSelections,
        mediaItems: mediaForProcessing,
        audioTracks: audioForProcessing,
        selectedMusic: selectedMusic ? {
          id: selectedMusic.id,
          name: selectedMusic.name,
          artist: selectedMusic.artist,
          url: selectedMusic.url,
          volume: selectedMusic.volume,
          startTime: selectedMusic.startTime,
          endTime: selectedMusic.endTime,
          muteOriginal: selectedMusic.muteOriginal,
          source: selectedMusic.source,
        } : null,
      },
    });
  };

  const getTransitionLayerStyle = (
    layer: 'from' | 'to',
    type: TransitionType,
    p: number
  ): React.CSSProperties => {
    const isFrom = layer === 'from';
    const base: React.CSSProperties = { opacity: 1, transform: 'none', filter: 'none' };

    if (type === 'cross-dissolve') {
      base.opacity = isFrom ? 1 - p : p;
    } else if (type === 'slide-left') {
      base.transform = isFrom ? `translateX(${-p * 100}%)` : `translateX(${(1 - p) * 100}%)`;
    } else if (type === 'slide-right') {
      base.transform = isFrom ? `translateX(${p * 100}%)` : `translateX(${-(1 - p) * 100}%)`;
    } else if (type === 'zoom-transition') {
      base.opacity = isFrom ? 1 - p : p;
      base.transform = isFrom ? `scale(${1 + p * 0.25})` : `scale(${1.25 - p * 0.25})`;
    } else if (type === 'blur-transition') {
      base.opacity = isFrom ? 1 - p : p;
      base.filter = `blur(${isFrom ? p * 10 : (1 - p) * 10}px)`;
    } else if (type === 'spin-transition') {
      base.opacity = isFrom ? 1 - p : p;
      base.transform = `rotate(${isFrom ? -120 * p : 120 * (1 - p)}deg) scale(${isFrom ? 1 - p * 0.15 : 0.85 + p * 0.15})`;
    } else if (type === 'glitch-transition') {
      const jitter = Math.sin(p * 80) * (isFrom ? 6 : 4);
      base.opacity = isFrom ? 1 - p : p;
      base.transform = `translateX(${jitter}px)`;
      base.filter = `contrast(${1.2 + p}) saturate(${1.1 + p * 0.7}) hue-rotate(${isFrom ? p * 45 : (1 - p) * 45}deg)`;
    } else if (type === 'flash-transition') {
      base.opacity = isFrom ? 1 - p : p;
    } else if (type === 'dip-black' || type === 'dip-white') {
      base.opacity = isFrom ? (p < 0.5 ? 1 - p * 2 : 0) : (p < 0.5 ? 0 : (p - 0.5) * 2);
    }

    return base;
  };

  return (
    <div
      className="h-screen w-full flex flex-col overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-white text-slate-200"
      style={{
        background: 'linear-gradient(135deg, #0b0d1f 0%, #1a1b2e 30%, #2d3142 60%, #3f4a67 85%, #1a1b2e 100%)',
      }}
    >
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-cyan-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 500px rgba(11,13,31,0.95)' }} />
      </div>

      {/* Top Header */}
      <header className="h-14 flex-none border-b border-white/10 flex items-center justify-between px-6 bg-black/20 backdrop-blur-3xl z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/quick-edit/upload")}
            className="p-1.5 hover:bg-white/5 rounded transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-2">
            <h1 className="text-[11px] font-black tracking-widest text-white uppercase">Studio Engine</h1>
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[8px] font-bold uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setActiveTool('history')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded px-3 py-1 flex items-center gap-1.5 transition-colors"
          >
            <HistoryIcon className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-300">History</span>
          </motion.button>
        </div>
      </header>

      {/* Main Multi-Pane Studio Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* Top Part of Workspace: Three Column Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden border-b border-white/10">
          
          {/* Left Column: Media Pool & Toolbox */}
          <aside className="w-full md:w-[350px] flex-none border-r border-white/10 flex flex-col bg-[#0b0d1f]/40 backdrop-blur-md overflow-hidden relative">
            
            {/* Media Pool Title Header */}
            <div className="p-4 border-b border-white/5 flex-none bg-black/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Media Pool</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setIsToolboxOpen(true); setActiveTool(null); }}
                    className="px-2 py-1 rounded-md bg-gradient-to-r from-cyan-500/20 to-purple-600/20 hover:from-cyan-500 hover:to-purple-600 hover:text-[#0b0d26] border border-cyan-500/35 hover:border-cyan-400 text-cyan-300 text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-[0_0_8px_rgba(6,182,212,0.1)] cursor-pointer"
                  >
                    <Zap className="w-2.5 h-2.5 animate-pulse" />
                    <span>Toolbox</span>
                  </button>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">{mediaItems.length} Clips</span>
                </div>
              </div>
            </div>

            {/* Media Clips Grid List */}
            <div className="h-[210px] flex-none overflow-y-auto p-4 custom-scrollbar bg-black/5">
              <div className="grid grid-cols-2 gap-2">
                {mediaItems.map((item, i) => (
                  <div
                    key={item.id}
                    onClick={() => triggerClipTransition(item.id)}
                    draggable="true"
                    onDragStart={(e) => {
                      e.dataTransfer.setData('clipId', item.id);
                    }}
                    className={`group relative aspect-video rounded-lg border transition-all cursor-pointer overflow-hidden bg-slate-900 ${
                      activePreviewId === item.id
                        ? 'border-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {item.type === 'video' ? (
                      <video
                        ref={(el) => { thumbnailVideoRefs.current[item.id] = el; }}
                        src={item.preview}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img src={item.preview} alt="" className="w-full h-full object-cover" loading="lazy" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); removeMediaItem(item.id); }}
                        className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-black/60 text-[7px] font-black text-white/70 uppercase">
                      {item.type}
                    </div>
                    {!!clipTransitions[item.id] && clipTransitions[item.id] !== 'none' && (
                      <div className="absolute top-1 right-1 px-1 py-0.5 rounded bg-cyan-500/25 border border-cyan-400/40 text-[7px] font-black text-cyan-200 uppercase">
                        {clipTransitions[item.id].replace('-transition', '')}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => mediaInputRef.current?.click()}
                  className="aspect-video rounded-lg border border-dashed border-white/10 bg-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-slate-500 hover:text-cyan-400 flex flex-col items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Add Media</span>
                </button>

                <input
                  type="file"
                  ref={mediaInputRef}
                  multiple
                  accept="video/*,image/*"
                  onChange={handleMediaImport}
                  className="hidden"
                />
              </div>
            </div>

            {/* Floating Toolbox Overlay */}
            <AnimatePresence>
              {isToolboxOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute inset-0 z-30 flex flex-col bg-[#0b0d26] p-4 border-t border-white/10"
                >
                  <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-200">Toolbox Options</span>
                    </div>
                    <button
                      onClick={() => setIsToolboxOpen(false)}
                      className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                    {activeTool ? (
                      <div className="space-y-3">
                        <button
                          onClick={() => setActiveTool(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] font-black uppercase tracking-wider text-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          ← Back to Tools
                        </button>
                        <div className="p-3 bg-black/40 rounded-xl border border-white/5 shadow-inner">
                          <ToolInspector
                            activeTool={activeTool}
                            setActiveTool={setActiveTool}
                            selectedFilter={selectedFilter}
                            setSelectedFilter={setSelectedFilter}
                            selectedEffect={selectedEffect}
                            setSelectedEffect={setSelectedEffect}
                            blurAmount={blurAmount}
                            setBlurAmount={setBlurAmount}
                            brightness={brightness}
                            setBrightness={setBrightness}
                            contrast={contrast}
                            setContrast={setContrast}
                            saturation={saturation}
                            setSaturation={setSaturation}
                            slowMotionSpeed={slowMotionSpeed}
                            setSlowMotionSpeed={setSlowMotionSpeed}
                            glitchIntensity={glitchIntensity}
                            setGlitchIntensity={setGlitchIntensity}
                            animatedText={animatedText}
                            setAnimatedText={setAnimatedText}
                            overlayText={overlayText}
                            setOverlayText={setOverlayText}
                            overlayFontId={overlayFontId}
                            setOverlayFontId={setOverlayFontId}
                            overlayFontSize={overlayFontSize}
                            setOverlayFontSize={setOverlayFontSize}
                            overlayColor={overlayColor}
                            setOverlayColor={setOverlayColor}
                            overlayPosX={overlayPosX}
                            setOverlayPosX={setOverlayPosX}
                            overlayPosY={overlayPosY}
                            setOverlayPosY={setOverlayPosY}
                            isTextPlacementMode={isTextPlacementMode}
                            setIsTextPlacementMode={setIsTextPlacementMode}
                            clipTransitions={clipTransitions}
                            applyTransitionForActiveClip={applyTransitionForActiveClip}
                            speedValue={speedValue}
                            setSpeedValue={setSpeedValue}
                            activePreviewId={activePreviewId}
                            activePreviewItem={activePreviewItem}
                            getTrimRangeForItem={getTrimRangeForItem}
                            clipTrimRanges={clipTrimRanges}
                            setClipTrimRanges={setClipTrimRanges}
                            rotationDegrees={rotationDegrees}
                            setRotationDegrees={setRotationDegrees}
                            volumeLevel={volumeLevel}
                            setVolumeLevel={setVolumeLevel}
                            isMuted={isMuted}
                            setIsMuted={setIsMuted}
                            cropWidthPct={cropWidthPct}
                            setCropWidthPct={setCropWidthPct}
                            cropHeightPct={cropHeightPct}
                            setCropHeightPct={setCropHeightPct}
                            cropCenterX={cropCenterX}
                            setCropCenterX={setCropCenterX}
                            cropCenterY={cropCenterY}
                            setCropCenterY={setCropCenterY}
                            zoomToolAmount={zoomToolAmount}
                            setZoomToolAmount={setZoomToolAmount}
                            keyframeMode={keyframeMode}
                            setKeyframeMode={setKeyframeMode}
                            keyframeAmount={keyframeAmount}
                            setKeyframeAmount={setKeyframeAmount}
                            videoRef={videoRef}
                            captions={captions}
                            setCaptions={setCaptions}
                            currentCaption={currentCaption}
                            setCurrentCaption={setCurrentCaption}
                            captionLanguage={captionLanguage}
                            setCaptionLanguage={setCaptionLanguage}
                            captionStyle={captionStyle}
                            setCaptionStyle={setCaptionStyle}
                            captionStylePreset={captionStylePreset}
                            setCaptionStylePreset={setCaptionStylePreset}
                            isCaptionPlacementMode={isCaptionPlacementMode}
                            setIsCaptionPlacementMode={setIsCaptionPlacementMode}
                            handleAutoCaption={handleAutoCaption}
                            isAutoCapturing={isAutoCapturing}
                            autoCaptionStatus={autoCaptionStatus}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* AI Settings Switches */}
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Smart Auto Features</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { id: 'subtitles', label: 'Subtitles', icon: Layers, color: 'text-purple-400' },
                              { id: 'autoCuts', label: 'Auto-Cuts', icon: Trash2, color: 'text-red-400' },
                              { id: 'backgroundMusic', label: 'Music', icon: Music, color: 'text-amber-400' },
                              { id: 'faceTracking', label: 'Tracking', icon: Monitor, color: 'text-emerald-400' },
                            ].map((opt) => (
                              <div key={opt.id} className="flex items-center justify-between p-1.5 rounded bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all">
                                <div className="flex items-center gap-1.5">
                                  <opt.icon className={`w-3 h-3 ${opt.color}`} />
                                  <span className="text-[8px] font-bold text-slate-300">{opt.label}</span>
                                </div>
                                <Switch
                                  checked={aiOptions[opt.id as keyof typeof aiOptions]}
                                  onCheckedChange={() => toggleOption(opt.id as keyof typeof aiOptions)}
                                  className="scale-50 data-[state=checked]:bg-cyan-500"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Quick Tools Grid */}
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Creative Quick Tools</span>
                          <QuickToolsGrid
                            QUICK_TOOLS={QUICK_TOOLS}
                            activeTool={activeTool}
                            setActiveTool={(toolId: string) => {
                              setActiveTool(toolId);
                            }}
                            copyActiveClip={copyActiveClip}
                            setExpandedSections={setExpandedSections}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </aside>

          {/* Center Column: Video Monitor */}
          <section className="flex-1 flex flex-col bg-black/15 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            </div>

            {/* Video Canvas Container */}
            <div className="flex-1 relative p-4 flex items-center justify-center overflow-hidden z-10">
              <motion.div
                ref={previewFrameRef}
                layout
                style={{ 
                  aspectRatio: getRatioValue(), 
                  width: getRatioValue() > 1 ? '100%' : 'auto', 
                  height: getRatioValue() > 1 ? 'auto' : '100%',
                  maxWidth: '100%',
                  maxHeight: '90%'
                }}
                onClick={(e) => {
                  if (!previewFrameRef.current) return;
                  const rect = previewFrameRef.current.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  if (isTextPlacementMode) {
                    setOverlayPosX(Math.max(0, Math.min(100, x)));
                    setOverlayPosY(Math.max(0, Math.min(100, y)));
                    setIsTextPlacementMode(false);
                  } else if (isCaptionPlacementMode) {
                    setCaptionStyle(prev => ({ ...prev, posX: Math.max(0, Math.min(100, x)), posY: Math.max(0, Math.min(100, y)) }));
                    setIsCaptionPlacementMode(false);
                  }
                }}
                className={`relative rounded-xl bg-slate-950 border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center transition-all ${(isTextPlacementMode || isCaptionPlacementMode) ? 'cursor-crosshair' : 'cursor-default'}`}
              >
                <AnimatePresence mode="popLayout">
                  {activePreviewId && activePreviewItem ? (
                    <motion.div
                      key={activePreviewId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 w-full h-full"
                    >
                      {activePreviewItem.type === 'video' ? (
                        <>
                          <video
                            ref={videoRef}
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={playNextMedia}
                            onLoadedMetadata={() => {
                              if (selectedEffect === 'fade-in') setPreviewOpacity(0);
                              else setPreviewOpacity(1);
                              if (selectedEffect !== 'zoom') setPreviewZoom(1);
                            }}
                            onCanPlay={(e) => { if (isPlaying) e.currentTarget.play().catch(() => {}); }}
                            src={activePreviewItem.preview}
                            className={CANVAS_PREVIEW_EFFECTS.includes(selectedEffect) || CANVAS_PREVIEW_FILTERS.includes(selectedFilter) ? 'hidden' : 'w-full h-full object-contain'}
                            style={{
                              opacity: selectedEffect === 'fade-in' ? previewOpacity : 1,
                              filter: getCombinedPreviewFilterCss(),
                              transform: getPreviewTransform(),
                              clipPath: getPreviewClipPath(),
                              transformOrigin: 'center center'
                            }}
                            muted={isMuted}
                            playsInline
                          />
                          {(CANVAS_PREVIEW_EFFECTS.includes(selectedEffect) || CANVAS_PREVIEW_FILTERS.includes(selectedFilter)) && (
                            <canvas ref={greenScreenCanvasRef} className="w-full h-full object-contain" />
                       )}
                        </>
                      ) : (
                        <>
                          <img
                            src={activePreviewItem.preview}
                            className="w-full h-full object-contain"
                            style={{
                              opacity: selectedEffect === 'fade-in' ? previewOpacity : 1,
                              filter: getCombinedPreviewFilterCss(),
                              transform: getPreviewTransform(),
                              clipPath: getPreviewClipPath(),
                              transformOrigin: 'center center'
                            }}
                            alt="Preview"
                          />
                          {audioUrl && <audio ref={audioRef} src={audioUrl} muted={isMuted} className="hidden" />}
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-6">
                      <Video className="w-12 h-12 text-cyan-400/10 animate-pulse" />
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Source Preview Empty</span>
                    </div>
                  )}
                </AnimatePresence>

                {/* Transition overlay */}
                {transitionOverlay && (
                  <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                    {(() => {
                      const fromItem = mediaItems.find((m) => m.id === transitionOverlay.fromId);
                      const toItem = mediaItems.find((m) => m.id === transitionOverlay.toId);
                      if (!fromItem || !toItem) return null;
                      const transitionFilter = getCombinedPreviewFilterCss();
                      const fromStyle = {
                        ...getTransitionLayerStyle('from', transitionOverlay.type, transitionProgress),
                        filter: transitionFilter !== 'none'
                          ? `${getTransitionLayerStyle('from', transitionOverlay.type, transitionProgress).filter === 'none' ? '' : `${getTransitionLayerStyle('from', transitionOverlay.type, transitionProgress).filter} `}${transitionFilter}`.trim()
                          : getTransitionLayerStyle('from', transitionOverlay.type, transitionProgress).filter,
                      };
                      const toStyle = {
                        ...getTransitionLayerStyle('to', transitionOverlay.type, transitionProgress),
                        filter: transitionFilter !== 'none'
                          ? `${getTransitionLayerStyle('to', transitionOverlay.type, transitionProgress).filter === 'none' ? '' : `${getTransitionLayerStyle('to', transitionOverlay.type, transitionProgress).filter} `}${transitionFilter}`.trim()
                          : getTransitionLayerStyle('to', transitionOverlay.type, transitionProgress).filter,
                      };
                      return (
                        <>
                          <div className="absolute inset-0" style={fromStyle}>
                            {fromItem.type === 'video' ? <video src={fromItem.preview} className="w-full h-full object-contain" muted playsInline autoPlay loop /> : <img src={fromItem.preview} className="w-full h-full object-contain" alt="" />}
                          </div>
                          <div className="absolute inset-0" style={toStyle}>
                            {toItem.type === 'video' ? <video src={toItem.preview} className="w-full h-full object-contain" muted playsInline autoPlay loop /> : <img src={toItem.preview} className="w-full h-full object-contain" alt="" />}
                          </div>
                          {(transitionOverlay.type === 'dip-black' || transitionOverlay.type === 'dip-white' || transitionOverlay.type === 'flash-transition') && (
                            <div
                              className="absolute inset-0"
                              style={{
                                background: transitionOverlay.type === 'dip-white' || transitionOverlay.type === 'flash-transition' ? '#ffffff' : '#000000',
                                opacity: transitionOverlay.type === 'flash-transition' ? Math.max(0, 1 - Math.abs(transitionProgress - 0.5) * 4) : transitionProgress < 0.5 ? transitionProgress * 2 : (1 - transitionProgress) * 2,
                              }}
                            />
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {selectedEffect !== 'text-animation' && overlayText.trim().length > 0 && (
                  <div
                    className="absolute z-40 pointer-events-none select-none text-center"
                    style={{
                      left: `${overlayPosX}%`,
                      top: `${overlayPosY}%`,
                      transform: 'translate(-50%, -50%)',
                      fontFamily: textFontOptions.find((f) => f.id === overlayFontId)?.family || textFontOptions[0].family,
                      fontSize: `${overlayFontSize}px`,
                      color: overlayColor,
                      textShadow: '0 4px 14px rgba(0,0,0,0.8)',
                      fontWeight: 700,
                      whiteSpace: 'pre-wrap',
                      maxWidth: '88%',
                    }}
                  >
                    {overlayText}
                  </div>
                )}

                {/* Read Line — sweeps across the preview in sync with video playback */}
                {showReadLine && (
                  <div
                    className="absolute z-[45] pointer-events-none"
                    style={
                      readLineDirection === 'horizontal'
                        ? {
                            top: `${progress}%`,
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.9) 20%, rgba(34,211,238,1) 50%, rgba(34,211,238,0.9) 80%, transparent 100%)',
                            boxShadow: '0 0 8px rgba(34,211,238,0.7), 0 0 24px rgba(34,211,238,0.25)',
                          }
                        : {
                            left: `${progress}%`,
                            top: 0,
                            bottom: 0,
                            width: '2px',
                            background: 'linear-gradient(180deg, transparent 0%, rgba(34,211,238,0.9) 20%, rgba(34,211,238,1) 50%, rgba(34,211,238,0.9) 80%, transparent 100%)',
                            boxShadow: '0 0 8px rgba(34,211,238,0.7), 0 0 24px rgba(34,211,238,0.25)',
                          }
                    }
                  />
                )}

                {/* Caption overlay — visible when a caption is active at current playback time */}
                {currentCaption && (
                  <div
                    className="absolute z-[50] pointer-events-none select-none"
                    style={{
                      left: `${captionStyle.posX}%`,
                      top: `${captionStyle.posY}%`,
                      transform: 'translate(-50%, -50%)',
                      fontFamily: textFontOptions.find((f) => f.id === captionStyle.fontId)?.family || textFontOptions[0].family,
                      fontSize: `${captionStyle.fontSize}px`,
                      color: captionStyle.color,
                      background: captionStyle.bgEnabled ? `${captionStyle.bgColorHex}cc` : 'transparent',
                      textAlign: captionStyle.alignment,
                      fontWeight: captionStyle.bold ? 700 : 400,
                      fontStyle: captionStyle.italic ? 'italic' : 'normal',
                      WebkitTextStroke: captionStyle.outline ? '1px rgba(0,0,0,0.8)' : undefined,
                      padding: captionStyle.bgEnabled ? '4px 12px' : undefined,
                      borderRadius: captionStyle.bgEnabled ? '6px' : undefined,
                      maxWidth: '88%',
                      textShadow: '0 2px 10px rgba(0,0,0,0.9)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {currentCaption.text}
                  </div>
                )}

                {/* HUD Overlay Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-40 max-w-[80%]">
                  {Math.abs(speedValue - 1) > 0.001 && <div className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/30 text-[8px] font-black uppercase text-cyan-200">Speed {speedValue.toFixed(2)}x</div>}
                  {hasTrimApplied && activePreviewId && <div className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30 text-[8px] font-black uppercase text-emerald-200">Trimmed</div>}
                  {rotationDegrees % 360 !== 0 && <div className="px-1.5 py-0.5 rounded bg-teal-500/20 border border-teal-400/30 text-[8px] font-black uppercase text-teal-200">Rotated {rotationDegrees}°</div>}
                  {isMuted && <div className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-400/30 text-[8px] font-black uppercase text-red-200">Muted</div>}
                  {zoomToolAmount > 1.001 && <div className="px-1.5 py-0.5 rounded bg-yellow-500/20 border border-yellow-400/30 text-[8px] font-black uppercase text-yellow-200">Zoom {zoomToolAmount.toFixed(2)}x</div>}
                </div>

              </motion.div>
            </div>

            {/* Video Player Transport Bar */}
            <div className="h-12 border-t border-white/10 bg-black/35 flex items-center justify-between px-6 z-10 flex-none select-none">
              {/* Timeline Time Code display */}
              <div className="font-mono text-[10px] text-slate-400 tracking-wider">
                {activePreviewId && activePreviewItem ? (
                  <span>
                    00:00:
                    {Math.floor((progress * activePreviewItem.duration) / 100).toString().padStart(2, '0')}
                    :
                    {Math.floor((progress * fps) % fps).toString().padStart(2, '0')}
                  </span>
                ) : (
                  <span>00:00:00:00</span>
                )}
              </div>

              {/* Hardware Transport Deck buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-colors"
                >
                  <Undo2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (videoRef.current) videoRef.current.currentTime = 0;
                    if (audioRef.current) audioRef.current.currentTime = 0;
                    setProgress(0);
                  }}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-[#0b0d1f] hover:scale-105 active:scale-95 transition-all shadow-md shadow-cyan-500/10"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                </button>

                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-colors"
                >
                  <Redo2 className="w-4 h-4" />
                </button>

                <div className="w-[1px] h-4 bg-white/10 mx-1" />

                {/* Read-line toggle */}
                <button
                  onClick={() => setShowReadLine(v => !v)}
                  title={showReadLine ? 'Hide Read Line' : 'Show Read Line'}
                  className={`p-1 rounded transition-all ${
                    showReadLine ? 'text-cyan-400 bg-cyan-500/15' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  <ScanLine className="w-4 h-4" />
                </button>

                {/* Direction toggle — only when read-line is on */}
                {showReadLine && (
                  <button
                    onClick={() => setReadLineDirection(d => d === 'horizontal' ? 'vertical' : 'horizontal')}
                    title={`Direction: ${readLineDirection}`}
                    className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all"
                  >
                    {readLineDirection === 'horizontal' ? '↔' : '↕'}
                  </button>
                )}
              </div>

              {/* FPS & Ratio status info */}
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                {aspectRatio} • {fps} FPS
              </div>
            </div>

          </section>

          {/* Right Column: Inspector Panel */}
          <aside className="w-full md:w-[340px] flex-none flex flex-col bg-[#080914]/95 border-l border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden select-none">
            
            {/* Inspector Header */}
            <div className="p-4 border-b border-white/10 bg-black/20 flex items-center gap-2 flex-none">
              <Settings2 className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">Inspector</span>
            </div>

            {/* Accordion list details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              
              {/* Presets / Style Atelier panel */}
              <div className="border border-white/5 rounded-xl overflow-hidden bg-black/10">
                <button
                  onClick={() => setExpandedSections(prev => ({ ...prev, preset: !prev.preset }))}
                  className="w-full p-3 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white/[0.02] border-b border-white/5"
                >
                  <div className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-pink-400" />
                    <span>Presets & Framing</span>
                  </div>
                  <span className="text-[8px] text-slate-500">{expandedSections.preset ? 'COLLAPSE' : 'EXPAND'}</span>
                </button>
                {expandedSections.preset && (
                  <div className="p-3 space-y-3 bg-black/20">
                    <div className="grid grid-cols-1 gap-2">
                      {editingStyles.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => {
                            setSelectedStyle(style.id);
                            setIsCustomFrameOpen(false);
                          }}
                          className={`relative p-3 rounded-xl border transition-all text-left overflow-hidden ${
                            selectedStyle === style.id && !isCustomFrameOpen
                              ? 'border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                              : 'border-white/5 bg-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-20`} />
                          <div className="relative flex items-center gap-3">
                            <style.icon className={`w-4 h-4 ${selectedStyle === style.id ? 'text-cyan-400' : 'text-slate-500'}`} />
                            <div className="flex flex-col">
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedStyle === style.id ? 'text-cyan-200' : 'text-slate-400'}`}>
                                {style.title}
                              </span>
                            </div>
                            {selectedStyle === style.id && !isCustomFrameOpen && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {/* Framing / Aspect Ratio Quick Selection Grid */}
                    <div className="space-y-2 border-t border-white/5 pt-3">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Format Aspect Ratio</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { ratio: '16:9' },
                          { ratio: '9:16' },
                          { ratio: '1:1' },
                          { ratio: '4:3' },
                          { ratio: '4:5' },
                          { ratio: '21:9' },
                        ].map((item) => (
                          <button
                            key={item.ratio}
                            onClick={() => {
                              setAspectRatio(item.ratio);
                              setIsCustomFrameOpen(false);
                            }}
                            className={`py-1.5 px-2 rounded-lg border text-[8px] font-black uppercase transition-all ${
                              aspectRatio === item.ratio && !isCustomFrameOpen
                                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 font-bold'
                                : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/10 hover:text-slate-300'
                            }`}
                          >
                            {item.ratio}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsCustomFrameOpen(!isCustomFrameOpen);
                        if (!isCustomFrameOpen) setAspectRatio('Custom');
                      }}
                      className={`w-full py-2.5 rounded-lg border border-dashed transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 ${
                        isCustomFrameOpen ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-white/10 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      Customize Frame
                    </button>

                    {isCustomFrameOpen && (
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[7px] font-black text-slate-500 uppercase">Width (px)</label>
                            <input
                              type="number"
                              value={customFrame.width}
                              onChange={(e) => setCustomFrame(prev => ({ ...prev, width: Number(e.target.value) }))}
                              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-bold text-white focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[7px] font-black text-slate-500 uppercase">Height (px)</label>
                            <input
                              type="number"
                              value={customFrame.height}
                              onChange={(e) => setCustomFrame(prev => ({ ...prev, height: Number(e.target.value) }))}
                              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-bold text-white focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {['1:1', '4:3', '4:5'].map(r => (
                            <button
                              key={r}
                              onClick={() => setAspectRatio(r)}
                              className={`flex-1 py-1 rounded border text-[8px] font-black transition-all ${aspectRatio === r ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-white/5 bg-white/5 text-slate-500'}`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Clip Metadata display card */}
              <div className="border border-white/5 rounded-xl overflow-hidden bg-black/10 p-3.5 space-y-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block border-b border-white/5 pb-1.5">Clip Metadata</span>
                  {activePreviewId && activePreviewItem ? (
                    <div className="space-y-2 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                      <div className="flex justify-between"><span className="text-slate-600">Format:</span><span className="text-slate-300">{activePreviewItem.type}</span></div>
                      <div className="flex justify-between"><span className="text-slate-600">Duration:</span><span className="text-slate-300">{activePreviewItem.duration.toFixed(2)}s</span></div>
                      <div className="flex justify-between"><span className="text-slate-600">Source:</span><span className="text-slate-300 truncate max-w-[120px]">{activePreviewItem.file ? activePreviewItem.file.name : 'Bench anime clip.mp4'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-600">Track:</span><span className="text-cyan-400">V1</span></div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                      Select clip from timeline
                    </div>
                  )}
                </div>

            </div>
          </aside>

        </div>

        {/* Bottom Panel: Multitrack Timeline lanes and Audio Mixer */}
        <div className={`${
          timelineSize === 'minimized' ? 'h-[120px]' : 
          timelineSize === 'maximized' ? 'h-[460px]' : 'h-[280px]'
        } flex-none border-t border-white/10 bg-black/25 backdrop-blur-3xl flex p-4 gap-4 overflow-hidden select-none transition-all duration-300`}>
          {/* Timeline hub container */}
          <div className="flex-1 overflow-hidden h-full">
            <TimelineHub
              mediaItems={mediaItems}
              audioTracks={audioTracks}
              captions={captions}
              currentCaption={currentCaption}
              setCurrentCaption={setCurrentCaption}
              progress={progress}
              handleTimelineClick={handleTimelineClick}
              activePreviewId={activePreviewId}
              setActivePreviewId={setActivePreviewId}
              isPlaying={isPlaying}
              clipTrimRanges={clipTrimRanges}
              setClipTrimRanges={setClipTrimRanges}
              getTrimRangeForItem={getTrimRangeForItem}
              videoRef={videoRef}
              handleAddAudio={handleAddAudio}
              handleAddVideo={() => mediaInputRef.current?.click()}
              handleReorderClips={handleReorderClips}
              getMediaDuration={getMediaDuration}
              setMediaItems={setMediaItems}
              saveToUndo={saveToUndo}
              timelineSize={timelineSize}
              setTimelineSize={setTimelineSize}
            />
          </div>

          {/* Simulated hardware volume Mixer */}
          <AudioMixer isPlaying={isPlaying} isMuted={isMuted} />
        </div>
      </main>

      {/* Global Actions Footer Bar */}
      <footer className="h-16 flex-none border-t border-white/10 bg-[#070814]/80 flex items-center justify-between px-6 z-20 select-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMusicPickerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 transition-all font-bold text-[9px] uppercase tracking-wider"
            title="Add background music"
          >
            <Music className="w-3.5 h-3.5" />
            <span>{selectedMusic ? 'Music Added ✓' : 'Add Music'}</span>
          </button>
        </div>

        <div className="flex items-center">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 transition-all font-bold text-[9px] uppercase tracking-wider">
            <Smartphone className="w-3.5 h-3.5 text-purple-400" />
            <span>Format: {aspectRatio}</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/quick-edit/upload")}
            className="px-5 h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Discard
          </button>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(34,211,238,0.2)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            className="relative h-9 px-6 rounded-lg flex items-center gap-2 transition-all overflow-hidden bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-400 text-[#0b0d1f] cursor-pointer"
          >
            <motion.div
              animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-white/15 blur-lg"
            />
            <Sparkles className="w-3.5 h-3.5 relative z-10" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] relative z-10">Generate Quick Edit</span>
          </motion.button>
        </div>
      </footer>

      <HistoryDialog
        open={activeTool === 'history'}
        onOpenChange={(open) => setActiveTool(open ? 'history' : null)}
        onSelect={handleHistorySelect}
        currentTool="quick-edit"
      />

      <PremiumModal
        open={isPremiumModalOpen}
        onOpenChange={setIsPremiumModalOpen}
        feature={premiumFeature}
      />

      {/* Music Picker Modal */}
      <MusicPickerModal
        isOpen={isMusicPickerOpen}
        onClose={() => setIsMusicPickerOpen(false)}
        videoDuration={Math.max(...mediaItems.map(m => m.duration), 10)}
      />

      {/* Custom Styles overrides */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.2);
        }
      `}} />

    </div>
  );
});
