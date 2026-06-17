import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
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
  ChevronLeft,
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
  MessageSquare,
  Edit2,
  Star,
  HelpCircle,
  Upload,
  Sliders,
  Activity,
  Ban,
  Sunrise,
  Wind,
  Vibrate,
  Flashlight,
  Tv,
  Clock3,
  Crosshair,
  Droplets,
  MoveHorizontal,
  MoveRight,
  Square,
  Gauge,
  CircleOff,
  Clapperboard,
  MoonStar,
  Sun,
  Snowflake,
  Contrast,
  Smile,
  Lightbulb,
  Aperture
} from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { Textarea } from "../../components/ui/textarea";
import { buildApiUrl } from "../../../lib/api";

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
  video.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Unable to load video file for audio extraction (timeout)."));
    }, 15000);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      resolve();
    };
    video.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Unable to load video file for audio extraction."));
    };
  });

  const captureStream = (video as any).captureStream || (video as any).mozCaptureStream;
  if (!captureStream) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Audio extraction requires browser support for video.captureStream(). Please try a different browser (Chrome, Firefox, or Edge).");
  }

  const stream = captureStream.call(video) as MediaStream;
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("No audio track was detected in the selected video. Make sure the video file contains audio.");
  }

  // Find supported MIME type
  let mimeType = "audio/webm";
  const possibleMimeTypes = [
    "audio/webm;codecs=opus",
    "audio/webm;codecs=vp9",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg"
  ];

  for (const type of possibleMimeTypes) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      mimeType = type;
      break;
    }
  }

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, { mimeType });
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw new Error(`Failed to initialize audio recorder. Your browser may not support audio recording. ${error instanceof Error ? error.message : ''}`);
  }

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const recordedBlobPromise = new Promise<Blob>((resolve, reject) => {
    const recordingTimeout = setTimeout(() => {
      reject(new Error("Audio extraction took too long and was cancelled."));
    }, 300000); // 5 minute timeout

    recorder.onstop = () => {
      clearTimeout(recordingTimeout);
      resolve(new Blob(chunks, { type: mimeType }));
    };
    recorder.onerror = (event) => {
      clearTimeout(recordingTimeout);
      reject(new Error(`Audio extraction failed: ${event.error?.message || 'Unknown error'}`));
    };
  });

  recorder.start();
  try {
    await video.play().catch(() => { });
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    if (duration > 0) {
      await new Promise<void>((resolve) => {
        video.onended = () => resolve();
        setTimeout(resolve, duration * 1000 + 500);
      });
    } else {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  } catch (error) {
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
    URL.revokeObjectURL(objectUrl);
    throw error;
  } finally {
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
    URL.revokeObjectURL(objectUrl);
  }

  const audioBlob = await recordedBlobPromise;
  if (audioBlob.size === 0) {
    throw new Error("Failed to extract audio - the resulting audio file is empty. Please try with a different video.");
  }

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
    gradient: "from-pink-500/20 to-fuchsia-600/20",
    ratio: '9:16'
  },
  {
    id: "cinematic",
    title: "Cinematic Film",
    description: "Ultra-wide cinematic look",
    icon: Film,
    gradient: "from-purple-500/20 to-fuchsia-600/20",
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
  { id: 'transitions', icon: Layers, label: 'Transitions', color: 'text-purple-300' },
  { id: 'filters', icon: Palette, label: 'Filters', color: 'text-pink-300' },
  { id: 'speed', icon: Timer, label: 'Speed', color: 'text-purple-300' },
  { id: 'trim', icon: Scissors, label: 'Trim', color: 'text-green-300' },
  { id: 'copy', icon: Copy, label: 'Copy', color: 'text-blue-300' },
  { id: 'text-tool', icon: Type, label: 'Text', color: 'text-fuchsia-300' },
  { id: 'rotate', icon: RotateCw, label: 'Rotate', color: 'text-fuchsia-300' },
  { id: 'volume', icon: Volume2, label: 'Volume', color: 'text-purple-300' },
  { id: 'crop', icon: Crop, label: 'Crop', color: 'text-red-300' },
  { id: 'zoom', icon: ZoomIn, label: 'Zoom', color: 'text-yellow-300' },
  { id: 'keyframe', icon: MonitorPlay, label: 'Keyframe', color: 'text-emerald-300' },
  { id: 'captions', icon: MessageSquare, label: 'Captions', color: 'text-green-300' },
];

const CANVAS_PREVIEW_EFFECTS = [
  'green-screen',
  'glitch',
  'motion-tracking',
  'old-tv',
  'soft-glow',
  'retro-film',
  'shake',
  'rgb-split',
  'film-grain',
];

const CANVAS_PREVIEW_FILTERS = [
  'vintage',
];

const TimelineHub = memo(({
  mediaItems,
  getClipGlobalStart,
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
  handleDeleteClip,
  getMediaDuration,
  setMediaItems,
  saveToUndo,
  timelineSize,
  setTimelineSize,
  overlayTextStylePreset,
  overlayTextStylePresetCss,
  extractingAudio,
  setExtractingAudio,
  audioError,
  setAudioError,
  showReadLine,
  setShowReadLine,
  selectPreviewWithTransition,
}: any) => {
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAudioChoiceLocal, setShowAudioChoice] = useState(false);
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
  const totalDuration = useMemo(() => {
    return mediaItems.reduce((acc: number, it: any) => {
      const t = getTrimRangeForItem(it.id, it.duration);
      const eff = it.type === 'video' ? (t.end - t.start) : it.duration;
      return acc + (Number(eff) || 3.0);
    }, 0) || 1;
  }, [mediaItems, getTrimRangeForItem]);

  const playheadLeft = useMemo(() => {
    return (progress / 100) * totalDuration * pixelsPerSecond;
  }, [progress, totalDuration, pixelsPerSecond]);

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
    const scrollOffset = timelineScrollRef.current?.scrollLeft || 0;
    const globalSeekTime = (clickX + scrollOffset) / pixelsPerSecond;
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
          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] uppercase tracking-wider font-black">Edit Mode</span>

          <div className="w-[1px] h-3 bg-white/10" />

          {/* Timeline height adjust controls */}
          <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
            <button
              onClick={() => setTimelineSize('minimized')}
              className={`p-1 rounded text-[8px] font-black uppercase tracking-wider flex items-center justify-center transition-all ${timelineSize === 'minimized'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              title="Minimize Timeline"
            >
              <Minimize2 className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => setTimelineSize('normal')}
              className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider flex items-center justify-center transition-all ${timelineSize === 'normal'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              title="Normal Timeline"
            >
              Normal
            </button>
            <button
              onClick={() => setTimelineSize('maximized')}
              className={`p-1 rounded text-[8px] font-black uppercase tracking-wider flex items-center justify-center transition-all ${timelineSize === 'maximized'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
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
        <div className="w-16 border-r border-white/5 bg-[#0d0e1f] flex flex-col flex-none select-none items-center pt-2 gap-4 pb-12">
          {/* Music Track */}
          <div className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all text-slate-400 hover:text-white cursor-pointer" title="Audio Track 1">
            <Music className="w-5 h-5" />
          </div>
          {/* Text/Captions Track */}
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 transition-all text-slate-300 hover:text-white cursor-pointer" title="Captions">
            <Type className="w-5 h-5" />
          </div>
          {/* Effects/Chart Track */}
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 transition-all text-slate-300 hover:text-white cursor-pointer" title="Effects">
            <Activity className="w-5 h-5" />
          </div>
          {/* Video Track */}
          <div className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all text-slate-400 hover:text-white cursor-pointer" title="Video Track">
            <Film className="w-5 h-5" />
          </div>
          {/* Speaker/Volume Track */}
          <div className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all text-slate-400 hover:text-white cursor-pointer" title="Audio Track 2">
            <Volume2 className="w-5 h-5" />
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

            <div className="flex-1 flex flex-col relative space-y-2" onClick={localHandleTimelineClick}>

              {/* Playhead (Red line) */}
              <motion.div
                initial={false}
                animate={{ left: `${playheadLeft}px` }}
                transition={{ duration: isDragging ? 0.05 : 0, type: "tween" }}
                className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-30 shadow-[0_0_10px_rgba(239,68,68,0.8)] pointer-events-none"
                style={{ transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-red-500 border border-red-400 rotate-45 transform origin-top -translate-y-1.5 shadow" />
                <div className="absolute inset-y-0 left-[-1px] right-[-1px] bg-red-500/20 blur-[1px]" />
              </motion.div>
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
                        selectPreviewWithTransition(item.id);
                      }
                    }
                  }
                }}
                className="flex-1 border-b border-white/5 relative flex items-center bg-white/[0.01]"
              >
                <div ref={trackRef} className="absolute inset-0 flex gap-1 p-0">
                  {mediaItems.map((item: any, i: number) => {
                    const trim = getTrimRangeForItem(item.id, item.duration);
                    const effectiveDuration = item.type === 'video' ? (trim.end - trim.start) : item.duration;
                    const widthPx = effectiveDuration * pixelsPerSecond;
                    const trimStartPercent = item.type === 'video' ? (trim.start / item.duration) * 100 : 0;
                    const trimEndRemovedPercent = item.type === 'video' ? ((item.duration - trim.end) / item.duration) * 100 : 0;
                    const isActive = activePreviewId === item.id;
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectPreviewWithTransition(item.id);
                        }}
                        draggable="true"
                        onDragStart={(e: any) => {
                          e.dataTransfer.setData('clipId', item.id);
                          e.dataTransfer.setData('dragIndex', String(i));
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e: any) => {
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
                        style={{
                          width: `${widthPx}px`,
                          backgroundColor: item.type === 'video' ? '#09101d' : undefined,
                          backgroundImage: item.type === 'image' && item.preview
                            ? `linear-gradient(180deg, rgba(15,23,42,0.72), rgba(15,23,42,0.35)), url("${item.preview}")`
                            : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                        className={`group h-full relative overflow-hidden rounded-xl border flex items-center px-2 cursor-pointer ${isDragging && dragRef.current?.itemId === item.id ? '' : 'transition-all duration-300 ease-out'
                          } ${isActive
                            ? 'bg-purple-500/20 border-purple-400 shadow-[inset_0_0_10px_rgba(168, 85, 247,0.2)] text-white'
                            : 'bg-cyan-950/20 border-white/5 hover:border-white/20 text-slate-400'
                          }`}
                      >
                        {item.type === 'video' && item.preview && (
                          <video
                            src={item.preview}
                            muted
                            playsInline
                            loop
                            autoPlay
                            preload="metadata"
                            className="absolute inset-0 w-full h-full object-cover opacity-90"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                        {item.type === 'video' ? (
                          <Video className="w-3.5 h-3.5 mr-1 flex-shrink-0 text-purple-200/90 z-10" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 mr-1 flex-shrink-0 text-purple-400/70 z-10" />
                        )}
                        <span className="text-[8px] font-black uppercase tracking-wider truncate mr-1 z-10">
                          {item.file ? item.file.name : `Clip ${i + 1}`}
                        </span>
                        <span className="text-[7px] text-slate-500 font-mono ml-auto flex-shrink-0 z-10">
                          {effectiveDuration.toFixed(1)}s
                        </span>

                        {item.type === 'video' && (
                          <>
                            <div
                              className="absolute inset-y-0 left-0 bg-emerald-500/20 pointer-events-none"
                              style={{ width: `${trimStartPercent}%` }}
                            />
                            <div
                              className="absolute inset-y-0 right-0 bg-rose-500/20 pointer-events-none"
                              style={{ width: `${trimEndRemovedPercent}%` }}
                            />
                            <div className="absolute inset-x-0 top-0 h-px bg-white/20 pointer-events-none" />
                          </>
                        )}

                        {isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClip(item.id);
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 border border-white/10 text-white flex items-center justify-center opacity-100 transition-opacity"
                            title="Delete this clip"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}

                        {/* Trimming Handles for Video Clips */}
                        {item.type === 'video' && (
                          <>
                            {/* Left Handle (Trim Start) */}
                            <div
                              draggable={false}
                              onMouseDown={(e) => handleMouseDown(e, item.id, 'start', item.duration)}
                              className="absolute left-0 top-0 bottom-0 w-2 bg-purple-400/90 cursor-ew-resize hover:bg-purple-300 hover:w-2.5 z-20 flex items-center justify-center border-r border-black/40 shadow-[0_0_8px_rgba(168, 85, 247,0.4)] transition-all"
                              title={`Trim Start: ${trim.start.toFixed(2)}s`}
                            >
                              <div className="w-[1px] h-3 bg-black/60 rounded" />
                            </div>

                            {/* Right Handle (Trim End) */}
                            <div
                              draggable={false}
                              onMouseDown={(e) => handleMouseDown(e, item.id, 'end', item.duration)}
                              className="absolute right-0 top-0 bottom-0 w-2 bg-purple-400/90 cursor-ew-resize hover:bg-purple-300 hover:w-2.5 z-20 flex items-center justify-center border-l border-black/40 shadow-[0_0_8px_rgba(168, 85, 247,0.4)] transition-all"
                              title={`Trim End: ${trim.end.toFixed(2)}s`}
                            >
                              <div className="w-[1px] h-3 bg-black/60 rounded" />
                            </div>
                          </>
                        )}
                      </motion.div>
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
                  <div key={idx} className="flex-1 border-b border-white/5 last:border-b-0 relative flex items-center bg-white/[0.01] rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 flex gap-1 p-0">
                      {laneAudios.map((track: any) => {
                        return (
                          <div
                            key={track.id}
                            style={{ width: `${totalDuration * pixelsPerSecond}px` }}
                            className="h-full flex-none rounded-md border border-fuchsia-500/30 bg-fuchsia-500/10 flex items-center justify-between px-2 select-none"
                          >
                            <div className="flex items-center overflow-hidden">
                              <Music className="w-3 h-3 mr-1 text-fuchsia-400 flex-shrink-0" />
                              <span className="text-[8px] font-black uppercase tracking-wider text-fuchsia-300 truncate">
                                {track.name}
                              </span>
                            </div>

                            {/* Waveform graphic */}
                            <div className="flex items-center gap-[1px] h-3 mr-2">
                              {[4, 8, 12, 6, 10, 4, 8, 12, 6, 2, 8, 4].map((h, index) => (
                                <div
                                  key={index}
                                  style={{ height: `${h}px` }}
                                  className={`w-[1px] bg-fuchsia-400/60 rounded-full ${isPlaying ? 'animate-pulse' : ''}`}
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
                            setShowAudioChoice(!showAudioChoiceLocal);
                          }}
                          className="w-full h-full flex flex-col items-center justify-center border border-dashed border-fuchsia-500/15 hover:border-fuchsia-500/40 hover:bg-fuchsia-500/[0.02] cursor-pointer rounded-lg transition-all group relative"
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
                          <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500 group-hover:text-fuchsia-400 uppercase tracking-widest transition-colors z-10">
                            <Plus className="w-3 h-3 text-fuchsia-500/60 group-hover:text-fuchsia-400" />
                            <span>Add Track A{idx + 1} Audio</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Caption Track Lane */}
              <div className="flex-1 border-b border-white/5 last:border-b-0 relative flex items-center bg-white/[0.01] rounded-2xl overflow-hidden">
                <div className="absolute inset-0 flex gap-1 p-0">
                  {captions.map((caption: any) => {
                    const clipStart = caption.clipId && getClipGlobalStart ? getClipGlobalStart(caption.clipId) : 0;
                    const captionLeft = (clipStart + caption.startTime) * pixelsPerSecond;
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
                        className={`absolute h-full top-0 rounded-md border flex items-center px-2 cursor-pointer transition-all ${isCaptionActive
                            ? 'bg-fuchsia-500/30 border-fuchsia-400 shadow-[inset_0_0_10px_rgba(20,184,166,0.2)] text-white'
                            : 'bg-teal-950/20 border-fuchsia-500/30 hover:border-fuchsia-400 text-slate-300'
                          }`}
                        title={`${caption.text} (${captionDuration.toFixed(1)}s)`}
                      >
                        <MessageSquare className="w-3 h-3 mr-1 flex-shrink-0 text-fuchsia-400/70" />
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
                    <div className="w-full h-full flex items-center justify-center border border-dashed border-fuchsia-500/15 rounded-lg">
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
              <Scissors className="w-4 h-4 text-fuchsia-400" />
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
              <FileAudio className="w-4 h-4 text-purple-400" />
              <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-300">Upload</span>
            </button>
            <button
              onClick={() => setShowAudioChoice(false)}
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
          className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border transition-all active:scale-[0.98] group ${isSelected
              ? 'bg-purple-500/20 border-purple-400 shadow-[0_0_10px_rgba(168, 85, 247,0.2)]'
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
  velocitySpeed,
  setVelocitySpeed,
  motionBlurAmount,
  setMotionBlurAmount,
  shakeStrength,
  setShakeStrength,
  flashIntensity,
  setFlashIntensity,
  rgbSplitAmount,
  setRgbSplitAmount,
  smoothZoomAmount,
  setSmoothZoomAmount,
  filmGrainOpacity,
  setFilmGrainOpacity,
  overlayTextStylePreset,
  setOverlayTextStylePreset,
  getOverlayTextEffectForPreset,
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
  overlayBgEnabled,
  setOverlayBgEnabled,
  overlayBgColorHex,
  setOverlayBgColorHex,
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
          <div className="grid grid-cols-3 gap-[16px] max-h-[350px] overflow-y-auto pr-2 pb-4 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gradient-to-b [&::-webkit-scrollbar-thumb]:from-[#7C3AED] [&::-webkit-scrollbar-thumb]:to-[#A855F7] [&::-webkit-scrollbar-thumb]:rounded-full">
            {[
              { id: 'none', label: 'No Filter', icon: CircleOff },
              { id: 'cinematic', label: 'Cinematic', icon: Clapperboard },
              { id: 'moody', label: 'Moody', icon: MoonStar },
              { id: 'warm-tone', label: 'Warm Tone', icon: Sun },
              { id: 'cool-tone', label: 'Cool Tone', icon: Snowflake },
              { id: 'vintage', label: 'Vintage', icon: Clock3 },
              { id: 'black-white', label: 'Black & White', icon: Contrast },
              { id: 'teal-orange', label: 'Teal & Orange', icon: Palette },
              { id: 'dreamy-glow', label: 'Dreamy Glow', icon: Sparkles },
              { id: 'film-look', label: 'Film Look', icon: Film },
              { id: 'vhs', label: 'VHS', icon: Tv },
              { id: 'soft-skin', label: 'Soft Skin', icon: Smile },
              { id: 'neon-glow', label: 'Neon Glow', icon: Lightbulb },
              { id: 'hdr-pop', label: 'HDR Pop', icon: Aperture },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id as any)}
                type="button"
                className={`flex flex-col items-center justify-center w-full h-[95px] rounded-[20px] backdrop-blur-[20px] transition-all duration-300 group ${
                  selectedFilter === f.id 
                    ? 'bg-gradient-to-b from-[rgba(168,85,247,0.18)] to-[rgba(124,58,237,0.08)] border border-[#A855F7] shadow-[0_0_25px_rgba(168,85,247,0.35)] scale-[1.03]' 
                    : 'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-[4px] hover:scale-[1.04] hover:border-[#A855F7] hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] cursor-pointer'
                }`}
              >
                <f.icon 
                  size={28} 
                  strokeWidth={2.2} 
                  className={`transition-colors duration-300 ${
                    selectedFilter === f.id ? 'text-[#FFD84D]' : 'text-[#B794F4] group-hover:drop-shadow-[0_0_8px_rgba(183,148,244,0.8)]'
                  }`} 
                />
                <span className={`mt-[12px] text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-center leading-tight px-2 line-clamp-2 ${
                  selectedFilter === f.id ? 'text-white' : 'text-white/90'
                }`}>
                  {f.label}
                </span>
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
          <div className="grid grid-cols-3 gap-[16px] max-h-[350px] overflow-y-auto pr-2 pb-4 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gradient-to-b [&::-webkit-scrollbar-thumb]:from-[#7C3AED] [&::-webkit-scrollbar-thumb]:to-[#A855F7] [&::-webkit-scrollbar-thumb]:rounded-full">
            {[
              { id: 'none', label: 'No Effect', icon: Ban },
              { id: 'fade-in', label: 'Fade In', icon: Sunrise },
              { id: 'velocity', label: 'Velocity Edit', icon: Zap },
              { id: 'motion-blur', label: 'Motion Blur', icon: Wind },
              { id: 'shake', label: 'Shake', icon: Vibrate },
              { id: 'flash-effect', label: 'Flash Transition', icon: Flashlight },
              { id: 'rgb-split', label: 'RGB Split', icon: Palette },
              { id: 'film-grain', label: 'Film Grain', icon: Film },
              { id: 'soft-glow', label: 'Soft Glow', icon: Sparkles },
              { id: 'old-tv', label: 'Old TV', icon: Tv },
              { id: 'slow-motion', label: 'Slow Motion', icon: Clock3 },
              { id: 'smooth-zoom', label: 'Smooth Zoom', icon: ZoomIn },
              { id: 'glitch', label: 'Glitch', icon: ScanLine },
              { id: 'motion-tracking', label: 'Motion Tracking', icon: Crosshair },
            ].map((eff) => (
              <button
                key={eff.id}
                onClick={() => setSelectedEffect(eff.id as any)}
                type="button"
                className={`flex flex-col items-center justify-center w-full h-[95px] rounded-[20px] backdrop-blur-[20px] transition-all duration-300 group ${
                  selectedEffect === eff.id 
                    ? 'bg-gradient-to-b from-[rgba(168,85,247,0.18)] to-[rgba(124,58,237,0.08)] border border-[#A855F7] shadow-[0_0_25px_rgba(168,85,247,0.35)] scale-[1.03]' 
                    : 'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-[4px] hover:scale-[1.04] hover:border-[#A855F7] hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] cursor-pointer'
                }`}
              >
                <eff.icon 
                  size={28} 
                  strokeWidth={2.2} 
                  className={`transition-colors duration-300 ${
                    selectedEffect === eff.id ? 'text-[#FFD84D]' : 'text-[#B794F4] group-hover:drop-shadow-[0_0_8px_rgba(183,148,244,0.8)]'
                  }`} 
                />
                <span className={`mt-[12px] text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-center leading-tight px-2 line-clamp-2 ${
                  selectedEffect === eff.id ? 'text-white' : 'text-white/90'
                }`}>
                  {eff.label}
                </span>
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
                className="w-full accent-purple-400"
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
                  className="w-full accent-purple-400"
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
                  className="w-full accent-purple-400"
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
                  className="w-full accent-purple-400"
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
                className="w-full accent-purple-400"
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
                className="w-full accent-purple-400"
              />
            </div>
          )}

          {selectedEffect === 'velocity' && (() => {
            const safeVelocitySpeed = typeof velocitySpeed === 'number' ? velocitySpeed : 1.5;
            return (
              <div className="mt-2 p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300">
                  <span>Velocity Ramp</span>
                  <span>{safeVelocitySpeed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.05}
                  value={safeVelocitySpeed}
                  onChange={(e) => setVelocitySpeed(Number(e.target.value))}
                  className="w-full accent-purple-400"
                />
              </div>
            );
          })()}

          {selectedEffect === 'motion-blur' && (
            <div className="mt-2 p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300">
                <span>Motion Blur</span>
                <span>{motionBlurAmount.toFixed(0)}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={12}
                step={1}
                value={motionBlurAmount}
                onChange={(e) => setMotionBlurAmount(Number(e.target.value))}
                className="w-full accent-purple-400"
              />
            </div>
          )}

          {selectedEffect === 'shake' && (
            <div className="mt-2 p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300">
                <span>Shake Strength</span>
                <span>{shakeStrength.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={4}
                step={0.1}
                value={shakeStrength}
                onChange={(e) => setShakeStrength(Number(e.target.value))}
                className="w-full accent-purple-400"
              />
            </div>
          )}

          {selectedEffect === 'flash-effect' && (
            <div className="mt-2 p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300">
                <span>Flash Strength</span>
                <span>{flashIntensity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={flashIntensity}
                onChange={(e) => setFlashIntensity(Number(e.target.value))}
                className="w-full accent-purple-400"
              />
            </div>
          )}

          {selectedEffect === 'rgb-split' && (
            <div className="mt-2 p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300">
                <span>RGB Split</span>
                <span>{rgbSplitAmount.toFixed(0)}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={28}
                step={1}
                value={rgbSplitAmount}
                onChange={(e) => setRgbSplitAmount(Number(e.target.value))}
                className="w-full accent-purple-400"
              />
            </div>
          )}

          {selectedEffect === 'smooth-zoom' && (
            <div className="mt-2 p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300">
                <span>Smooth Zoom</span>
                <span>{(smoothZoomAmount * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.7}
                step={0.05}
                value={smoothZoomAmount}
                onChange={(e) => setSmoothZoomAmount(Number(e.target.value))}
                className="w-full accent-purple-400"
              />
            </div>
          )}

          {selectedEffect === 'film-grain' && (
            <div className="mt-2 p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300">
                <span>Grain Opacity</span>
                <span>{filmGrainOpacity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={filmGrainOpacity}
                onChange={(e) => setFilmGrainOpacity(Number(e.target.value))}
                className="w-full accent-purple-400"
              />
            </div>
          )}

          {/* Settings inputs for text effects removed */}
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
          <div className="grid grid-cols-3 gap-[16px] max-h-[350px] overflow-y-auto pr-2 pb-4 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gradient-to-b [&::-webkit-scrollbar-thumb]:from-[#7C3AED] [&::-webkit-scrollbar-thumb]:to-[#A855F7] [&::-webkit-scrollbar-thumb]:rounded-full">
            {[
              { id: 'fade-transition', label: 'Fade Transition', icon: Droplets },
              { id: 'zoom-transition', label: 'Zoom Transition', icon: ZoomIn },
              { id: 'blur-transition', label: 'Blur Transition', icon: Wind },
              { id: 'swipe-transition', label: 'Swipe Transition', icon: MoveHorizontal },
              { id: 'spin-transition', label: 'Spin Transition', icon: RotateCw },
              { id: 'whip-pan-transition', label: 'Whip Pan Transition', icon: MoveRight },
              { id: 'glitch-transition', label: 'Glitch Transition', icon: ScanLine },
              { id: 'mask-transition', label: 'Mask Transition', icon: Square },
              { id: 'flash-transition', label: 'Flash Transition', icon: Zap },
              { id: 'camera-shake-transition', label: 'Camera Shake Transition', icon: Vibrate },
              { id: 'match-cut-transition', label: 'Match Cut Transition', icon: Scissors },
              { id: 'speed-ramp-transition', label: 'Speed Ramp Transition', icon: Gauge },
            ].map((tr) => (
              <button
                key={tr.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  applyTransitionForActiveClip(tr.id as any);
                }}
                type="button"
                className={`flex flex-col items-center justify-center w-full h-[95px] rounded-[20px] backdrop-blur-[20px] transition-all duration-300 group ${
                  activePreviewId && clipTransitions[activePreviewId] === tr.id 
                    ? 'bg-gradient-to-b from-[rgba(168,85,247,0.18)] to-[rgba(124,58,237,0.08)] border border-[#A855F7] shadow-[0_0_25px_rgba(168,85,247,0.35)] scale-[1.03]' 
                    : 'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-[4px] hover:scale-[1.04] hover:border-[#A855F7] hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] cursor-pointer'
                }`}
              >
                <tr.icon 
                  size={28} 
                  strokeWidth={2.2} 
                  className={`transition-colors duration-300 ${
                    activePreviewId && clipTransitions[activePreviewId] === tr.id ? 'text-[#FFD84D]' : 'text-[#B794F4] group-hover:drop-shadow-[0_0_8px_rgba(183,148,244,0.8)]'
                  }`} 
                />
                <span className={`mt-[12px] text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-center leading-tight px-2 line-clamp-2 ${
                  activePreviewId && clipTransitions[activePreviewId] === tr.id ? 'text-white' : 'text-white/90'
                }`}>
                  {tr.label}
                </span>
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
              className="w-full accent-purple-400"
            />
            <div className="flex gap-1">
              {[0.5, 1, 1.25, 1.5, 2].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setSpeedValue(preset)}
                  className={`flex-1 py-1 rounded text-[8px] font-black uppercase border transition-colors ${Math.abs(speedValue - preset) < 0.001 ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
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
                  className="w-full accent-purple-400"
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
                  className="w-full accent-purple-400"
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
                  className={`py-1.5 rounded text-[8px] font-black uppercase border transition-colors ${rotationDegrees === deg ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
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
              className="w-full accent-purple-400"
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
              <input type="range" min={30} max={100} step={1} value={cropWidthPct} onChange={(e) => setCropWidthPct(Number(e.target.value))} className="w-full accent-purple-400 font-sans" />
            </div>
            <div>
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300 mb-0.5">
                <span>Height</span>
                <span>{Math.round(cropHeightPct)}%</span>
              </div>
              <input type="range" min={30} max={100} step={1} value={cropHeightPct} onChange={(e) => setCropHeightPct(Number(e.target.value))} className="w-full accent-purple-400" />
            </div>
            <div>
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300 mb-0.5">
                <span>Center X</span>
                <span>{Math.round(cropCenterX)}%</span>
              </div>
              <input type="range" min={0} max={100} step={1} value={cropCenterX} onChange={(e) => setCropCenterX(Number(e.target.value))} className="w-full accent-purple-400" />
            </div>
            <div>
              <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300 mb-0.5">
                <span>Center Y</span>
                <span>{Math.round(cropCenterY)}%</span>
              </div>
              <input type="range" min={0} max={100} step={1} value={cropCenterY} onChange={(e) => setCropCenterY(Number(e.target.value))} className="w-full accent-purple-400" />
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
              className="w-full accent-purple-400"
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
                  className={`py-1.5 rounded text-[8px] font-black uppercase border transition-colors ${keyframeMode === preset.id ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
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
                className="w-full accent-purple-400"
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
                    className={`px-2 py-1 rounded text-left text-[8px] font-bold uppercase border transition-colors ${overlayFontId === font.id ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                    style={{ fontFamily: font.family }}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Text Style</label>
              <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto custom-scrollbar pr-0.5">
                {[
                  { id: 'cinematic-title', label: 'Cinematic Title' },
                  { id: 'animated-captions', label: 'Animated Captions' },
                  { id: 'kinetic-typography', label: 'Kinetic Typography' },
                  { id: 'neon-glow-text', label: 'Neon Glow Text' },
                  { id: 'glitch-text', label: 'Glitch Text' },
                  { id: 'typewriter-text', label: 'Typewriter Text' },
                  { id: 'bold-hype-text', label: 'Bold Hype Text' },
                  { id: 'lyrics-text', label: 'Lyrics Text' },
                  { id: 'minimal-clean-text', label: 'Minimal Clean Text' },
                  { id: '3d-text', label: '3D Text' },
                  { id: 'subtitle-style-text', label: 'Subtitle Style Text' },
                  { id: 'motion-tracking-text', label: 'Motion Tracking Text' },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      setOverlayTextStylePreset(style.id);
                      setSelectedEffect(getOverlayTextEffectForPreset(style.id));
                      if (style.id === 'animated-captions') {
                        setAnimatedText(overlayText);
                      }
                    }}
                    className={`px-2 py-2 rounded-lg text-left text-[8px] font-bold uppercase tracking-wider transition-colors ${overlayTextStylePreset === style.id ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}
                  >
                    {style.label}
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
                  className="w-full accent-purple-400"
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
                <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Background</label>
                <button
                  type="button"
                  onClick={() => setOverlayBgEnabled(!overlayBgEnabled)}
                  className={`w-full py-1.5 rounded text-[8px] font-black uppercase border transition-all ${overlayBgEnabled ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 ring-2 ring-purple-500/30' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                >
                  {overlayBgEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              {overlayBgEnabled && (
                <div>
                  <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400">BG Color</label>
                  <input
                    type="color"
                    value={overlayBgColorHex}
                    onChange={(e) => setOverlayBgColorHex(e.target.value)}
                    className="w-full h-6 rounded bg-transparent border border-white/10 cursor-pointer"
                  />
                </div>
              )}
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
                  className="w-full accent-purple-400"
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
                  className="w-full accent-purple-400"
                />
              </div>
            </div>
            <button
              onClick={() => setIsTextPlacementMode(!isTextPlacementMode)}
              className={`w-full py-1.5 rounded text-[8px] font-black uppercase border transition-colors ${isTextPlacementMode ? 'bg-purple-500 text-[#0B1020] border-purple-400' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/15'}`}
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
              className="w-full px-2.5 py-1.5 rounded bg-black/30 border border-white/10 text-white text-[9px] focus:outline-none focus:border-purple-500/50 font-bold"
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
              className={`flex-1 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all ${captionTab === 'list' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
            >
              List
            </button>
            <button
              onClick={() => setCaptionTab('style')}
              className={`flex-1 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all ${captionTab === 'style' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
            >
              Style
            </button>
          </div>

          {captionTab === 'list' ? (
            <div className="space-y-2">
              {/* Caption list */}
              <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pr-0.5">
                {captions.filter((cap: any) => !cap.clipId || cap.clipId === activePreviewId).length === 0 ? (
                  <div className="py-3 text-center text-[8px] font-bold uppercase tracking-widest text-slate-600">No captions yet</div>
                ) : (
                  captions
                    .filter((cap: any) => !cap.clipId || cap.clipId === activePreviewId)
                    .map((cap: any) => (
                    <div
                      key={cap.id}
                      onClick={() => setCurrentCaption(cap)}
                      className={`flex items-start gap-1.5 px-2 py-1.5 rounded-lg border cursor-pointer transition-all group ${currentCaption?.id === cap.id
                          ? 'bg-fuchsia-500/20 border-fuchsia-400 shadow-[inset_0_0_8px_rgba(20,184,166,0.1)]'
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
                  className="w-full px-2.5 py-1.5 rounded bg-black/30 border border-white/10 text-white text-[10px] focus:outline-none focus:border-purple-500/50 placeholder:text-slate-600"
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
                      clipId: activePreviewId,
                    }]);
                    setNewCaptionText('');
                    setNewCaptionStart(0);
                    setNewCaptionEnd(3);
                  }}
                  className="w-full py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[8px] font-black uppercase hover:bg-purple-500/30 transition-all"
                >
                  + Add Caption
                </button>
              </div>

              {/* Auto-caption via Gemini */}
              {autoCaptionStatus ? (
                <div className="px-2 py-1.5 rounded-lg bg-black/30 border border-white/10 text-[8px] font-bold text-slate-300 text-center leading-relaxed">
                  {autoCaptionStatus}
                </div>
              ) : null}
              <button
                onClick={handleAutoCaption}
                disabled={isAutoCapturing}
                className={`w-full py-2 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1.5 transition-all ${isAutoCapturing
                    ? 'bg-red-500/20 border border-red-500/40 text-red-300 animate-pulse cursor-not-allowed'
                    : 'bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-500/25'
                  }`}
              >
                {isAutoCapturing ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-ping mr-1" />
                    Transcribing…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Auto-Caption (Gemini)
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
                      className={`px-2 py-2 rounded text-left text-[7px] font-bold uppercase border transition-all ${captionStylePreset === preset.id ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 ring-2 ring-purple-500/30' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
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
                      className={`px-2 py-1 rounded text-left text-[7px] font-bold uppercase border transition-colors ${captionStyle.fontId === font.id
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
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
                    className="w-full accent-purple-400"
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
                    className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border transition-all ${captionStyle.bgEnabled
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
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
                    className={`flex-1 py-1.5 rounded border text-[8px] transition-all flex items-center justify-center ${captionStyle.bold ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                      }`}
                  >
                    <Bold className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setCaptionStyle((prev: any) => ({ ...prev, italic: !prev.italic }))}
                    className={`flex-1 py-1.5 rounded border text-[8px] transition-all flex items-center justify-center ${captionStyle.italic ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                      }`}
                  >
                    <Italic className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setCaptionStyle((prev: any) => ({ ...prev, outline: !prev.outline }))}
                    className={`flex-1 py-1.5 rounded border text-[8px] font-black uppercase transition-all ${captionStyle.outline ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
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
                        className={`flex-1 py-1.5 rounded border transition-all flex items-center justify-center ${captionStyle.alignment === align
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
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
                    className="w-full accent-purple-400"
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
                    className="w-full accent-purple-400"
                  />
                </div>
              </div>

              {/* Place on preview */}
              <button
                onClick={() => setIsCaptionPlacementMode(!isCaptionPlacementMode)}
                className={`w-full py-1.5 rounded text-[8px] font-black uppercase border transition-colors ${isCaptionPlacementMode
                    ? 'bg-purple-500 text-[#0B1020] border-purple-400'
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
    | 'cinematic'
    | 'moody'
    | 'warm-tone'
    | 'cool-tone'
    | 'vintage'
    | 'black-white'
    | 'teal-orange'
    | 'dreamy-glow'
    | 'film-look'
    | 'vhs'
    | 'soft-skin'
    | 'neon-glow'
    | 'hdr-pop';

  const navigate = useNavigate();
  const location = useLocation();
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // -- State Management --
  const [selectedStyle, setSelectedStyle] = useState("youtube");
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false);
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
  const [isMediaPoolVisible, setIsMediaPoolVisible] = useState(true);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [audioTracks, setAudioTracks] = useState<Array<{ id: string, name: string, type: 'extracted' | 'direct', file?: File }>>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [bgMusicUrl, setBgMusicUrl] = useState<string | null>(null);
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

  // Manage background music object URL/library URL
  useEffect(() => {
    if (selectedMusic) {
      if (selectedMusic.source === 'library' && selectedMusic.url) {
        setBgMusicUrl(selectedMusic.url);
      } else if (selectedMusic.source === 'device' && selectedMusic.file) {
        const url = URL.createObjectURL(selectedMusic.file);
        setBgMusicUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    } else {
      setBgMusicUrl(null);
    }
  }, [selectedMusic]);

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
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [overlayText, setOverlayText] = useState('');
  const [overlayFontId, setOverlayFontId] = useState('serif');
  const [overlayFontSize, setOverlayFontSize] = useState(48);
  const [overlayColor, setOverlayColor] = useState('#FFFFFF');
  const [overlayTextStylePreset, setOverlayTextStylePreset] = useState<string | null>(null);
  const [overlayPosX, setOverlayPosX] = useState(50);
  const [overlayPosY, setOverlayPosY] = useState(50);
  const [overlayBgEnabled, setOverlayBgEnabled] = useState(false);
  const [overlayBgColorHex, setOverlayBgColorHex] = useState('#000000');
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
    | 'fade-transition'
    | 'zoom-transition'
    | 'blur-transition'
    | 'swipe-transition'
    | 'spin-transition'
    | 'whip-pan-transition'
    | 'glitch-transition'
    | 'mask-transition'
    | 'flash-transition'
    | 'camera-shake-transition'
    | 'match-cut-transition'
    | 'speed-ramp-transition'
    | 'cross-dissolve'
    | 'slide-left'
    | 'slide-right'
    | 'dip-black'
    | 'dip-white';

  const [clipTransitions, setClipTransitions] = useState<Record<string, TransitionType>>({});
  const [transitionOverlay, setTransitionOverlay] = useState<{
    fromId: string;
    toId: string;
    type: TransitionType;
    startAt: number;
    durationMs: number;
  } | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const [blurAmount, setBlurAmount] = useState(10);
  const [selectedEffect, setSelectedEffect] = useState<'none' | 'fade-in' | 'blur' | 'zoom' | 'color-correction' | 'vintage' | 'black-white' | 'cinematic' | 'warm' | 'cool' | 'sepia' | 'hdr' | 'vivid' | 'soft-glow' | 'retro-film' | 'green-screen' | 'slow-motion' | 'glitch' | 'slide-left' | 'slide-right' | 'motion-tracking' | 'velocity' | 'motion-blur' | 'shake' | 'flash-effect' | 'rgb-split' | 'smooth-zoom' | 'film-grain' | 'old-tv'>('none');
  const [previewOpacity, setPreviewOpacity] = useState(1);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);
  const [slowMotionSpeed, setSlowMotionSpeed] = useState(0.25);
  const [glitchIntensity, setGlitchIntensity] = useState(1);
  const [velocitySpeed, setVelocitySpeed] = useState(1.5);
  const [motionBlurAmount, setMotionBlurAmount] = useState(3);
  const [shakeStrength, setShakeStrength] = useState(1.5);
  const [flashIntensity, setFlashIntensity] = useState(0.75);
  const [rgbSplitAmount, setRgbSplitAmount] = useState(12);
  const [smoothZoomAmount, setSmoothZoomAmount] = useState(0.35);
  const [filmGrainOpacity, setFilmGrainOpacity] = useState(0.4);
  const [animatedText, setAnimatedText] = useState('');

  // --- Caption state ---
  const [captions, setCaptions] = useState<Array<{ id: string; text: string; startTime: number; endTime: number; clipId?: string }>>([]);
  const [currentCaption, setCurrentCaption] = useState<{ id: string; text: string; startTime: number; endTime: number; clipId?: string } | null>(null);
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
  const getOverlayTextStylePresetCss = useCallback((preset: string | null) => {
    const baseStyle: any = {
      fontFamily: textFontOptions.find((f) => f.id === overlayFontId)?.family || textFontOptions[0].family,
      fontSize: `${overlayFontSize}px`,
      color: overlayColor,
      fontWeight: 700,
      letterSpacing: 'normal',
      textTransform: 'none',
      textShadow: '0 4px 14px rgba(0,0,0,0.75)',
      background: 'transparent',
      padding: undefined,
      borderRadius: undefined,
      border: undefined,
      lineHeight: 1.05,
      whiteSpace: 'pre-wrap',
    };

    switch (preset) {
      case 'cinematic-title':
        return {
          ...baseStyle,
          fontSize: `${Math.max(overlayFontSize, 60)}px`,
          color: '#F8F3E8',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          textShadow: '0 20px 48px rgba(0,0,0,0.55)',
          background: 'rgba(0,0,0,0.15)',
          padding: '6px 12px',
          borderRadius: '18px',
        };
      case 'animated-captions':
        return {
          ...baseStyle,
          fontSize: `${Math.max(overlayFontSize, 42)}px`,
          textShadow: '0 8px 20px rgba(0,0,0,0.45)',
          background: 'rgba(15,23,42,0.7)',
          padding: '10px 16px',
          borderRadius: '24px',
          letterSpacing: '0.04em',
        };
      case 'kinetic-typography':
        return {
          ...baseStyle,
          fontSize: `${Math.max(overlayFontSize, 54)}px`,
          fontWeight: 900,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          textShadow: '0 10px 34px rgba(0,0,0,0.35)',
          background: 'rgba(255,255,255,0.04)',
          padding: '8px 14px',
          borderRadius: '14px',
        };
      case 'neon-glow-text':
        return {
          ...baseStyle,
          color: '#7CFC00',
          textShadow: '0 0 12px rgba(124,252,0,0.8), 0 0 28px rgba(124,252,0,0.4), 0 0 48px rgba(124,252,0,0.2)',
          fontWeight: 800,
        };
      case 'glitch-text':
        return {
          ...baseStyle,
          color: '#FFFFFF',
          letterSpacing: '0.06em',
          textShadow: '0 0 4px rgba(255,0,120,0.8), 0 0 8px rgba(0,220,255,0.65)',
          fontWeight: 900,
          background: 'rgba(0,0,0,0.2)',
          padding: '8px 12px',
          borderRadius: '12px',
        };
      case 'typewriter-text':
        return {
          ...baseStyle,
          fontFamily: 'monospace, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          letterSpacing: '0.12em',
          color: '#E2E8F0',
          background: 'rgba(3,7,18,0.85)',
          border: '1px solid rgba(255,255,255,0.12)',
          padding: '10px 16px',
          borderRadius: '10px',
          textShadow: '0 3px 12px rgba(0,0,0,0.45)',
        };
      case 'bold-hype-text':
        return {
          ...baseStyle,
          color: '#FFD166',
          fontWeight: 900,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          textShadow: '0 0 20px rgba(255,209,102,0.65)',
          background: 'rgba(20,20,30,0.55)',
          padding: '8px 14px',
          borderRadius: '18px',
        };
      case 'lyrics-text':
        return {
          ...baseStyle,
          fontSize: `${Math.max(overlayFontSize, 36)}px`,
          color: '#F8FAFC',
          fontStyle: 'italic',
          letterSpacing: '0.04em',
          textShadow: '0 18px 36px rgba(0,0,0,0.3)',
          lineHeight: 1.2,
        };
      case 'minimal-clean-text':
        return {
          ...baseStyle,
          color: '#FFFFFF',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textShadow: 'none',
          background: 'rgba(255,255,255,0.08)',
          padding: '6px 10px',
          borderRadius: '10px',
        };
      case '3d-text':
        return {
          ...baseStyle,
          color: '#F8FAFC',
          textShadow: '2px 2px 0 rgba(15,23,42,0.95), 6px 6px 16px rgba(0,0,0,0.35)',
          letterSpacing: '0.05em',
          fontWeight: 900,
        };
      case 'subtitle-style-text':
        return {
          ...baseStyle,
          fontSize: `${Math.max(overlayFontSize * 0.75, 24)}px`,
          letterSpacing: '0.04em',
          color: '#FFFFFF',
          background: 'rgba(0,0,0,0.78)',
          padding: '8px 14px',
          borderRadius: '12px',
          textTransform: 'none',
          lineHeight: 1.2,
        };
      case 'motion-tracking-text':
        return {
          ...baseStyle,
          color: '#FFFFFF',
          letterSpacing: '0.16em',
          textShadow: '0 14px 28px rgba(0,0,0,0.35)',
          background: 'rgba(0,0,0,0.24)',
          padding: '10px 16px',
          borderRadius: '999px',
          fontWeight: 800,
        };
      default:
        return baseStyle;
    }
  }, [overlayFontId, overlayFontSize, overlayColor]);

  const getOverlayTextEffectForPreset = useCallback((preset: string | null) => {
    if (preset === 'animated-captions') return 'animated-captions';
    if (preset === 'motion-tracking-text') return 'motion-tracking';
    return 'none';
  }, []);
  const [isCaptionPlacementMode, setIsCaptionPlacementMode] = useState(false);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [autoCaptionStatus, setAutoCaptionStatus] = useState('');

  // --- Read-line state ---
  const [showReadLine, setShowReadLine] = useState(false);
  const [readLineDirection, setReadLineDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [readLinePosition, setReadLinePosition] = useState<number>(0);

  // --- Auto-caption: stopAutoCaptionRef lets us stop capture from outside the closure ---
  const stopAutoCaptionRef = useRef<(() => void) | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isToolboxOpen, setIsToolboxOpen] = useState(false);
  const [timelineSize, setTimelineSize] = useState<'minimized' | 'normal' | 'maximized'>('normal');

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewFrameRef = useRef<HTMLDivElement>(null);

  // --- Auto-caption handler (Gemini via backend) ---
  const handleAutoCaption = useCallback(async () => {
    // Find the active video clip or the first video clip
    const activeClip = mediaItems.find(item => item.id === activePreviewId && item.type === 'video')
      || mediaItems.find(item => item.type === 'video');

    if (!activeClip || !activeClip.file) {
      setAutoCaptionStatus('❌ No video clip loaded to transcribe. Add a video clip first.');
      return;
    }

    setIsAutoCapturing(true);
    setAutoCaptionStatus('🎙️ Sending video to Gemini for transcription…');

    try {
      const formData = new FormData();
      formData.append('file', activeClip.file);

      const response = await fetch(buildApiUrl('/api/transcribe'), {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to transcribe audio.');
      }

      const geminiSegments = data.segments || [];
      if (geminiSegments.length === 0) {
        setAutoCaptionStatus('⚠️ Transcription completed, but no speech was detected.');
        setIsAutoCapturing(false);
        return;
      }

      // Convert Gemini segments into the required captions format
      const newCaptions = geminiSegments.map((seg: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        text: (seg.text || '').trim(),
        startTime: seg.start,
        endTime: seg.end,
        clipId: activePreviewId,
      }));

      // Set the captions state, preserving other clips
      setCaptions((prev: any) => [
        ...prev.filter((c: any) => c.clipId !== activePreviewId),
        ...newCaptions
      ]);
      setAutoCaptionStatus('✅ Captions generated successfully using Gemini!');
    } catch (error: any) {
      console.error('Gemini transcription failed:', error);
      setAutoCaptionStatus(`❌ Transcription failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsAutoCapturing(false);
    }
  }, [mediaItems, activePreviewId, setCaptions, setIsAutoCapturing, setAutoCaptionStatus]);

  const greenScreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const greenScreenAnimationRef = useRef<number | null>(null);
  const previousFrameRef = useRef<ImageData | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const bgMusicRef = useRef<HTMLAudioElement>(null);
  const thumbnailVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const lastLoadedIdRef = useRef<string | null>(null);

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

  const getClipGlobalStart = useCallback((clipId: string) => {
    let accumulated = 0;
    for (const item of mediaItems) {
      if (item.id === clipId) {
        return accumulated;
      }
      accumulated += getEffectiveDurationForItem(item);
    }
    return 0;
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
    setOverlayTextStylePreset(settings.overlayTextStylePreset || null);
    setOverlayFontId(settings.overlayFontId || 'serif');
    setOverlayFontSize(settings.overlayFontSize ?? 48);
    setOverlayColor(settings.overlayColor || '#FFFFFF');
    setOverlayPosX(settings.overlayPosX ?? 50);
    setOverlayPosY(settings.overlayPosY ?? 50);
    setOverlayBgEnabled(settings.overlayBgEnabled ?? false);
    setOverlayBgColorHex(settings.overlayBgColorHex || '#000000');

    setBlurAmount(settings.blurAmount ?? 10);
    setBrightness(settings.brightness ?? 1);
    setContrast(settings.contrast ?? 1);
    setSaturation(settings.saturation ?? 1);
    setSlowMotionSpeed(settings.slowMotionSpeed ?? 0.25);
    setGlitchIntensity(settings.glitchIntensity ?? 1);
    // Existing effect params
    setVelocitySpeed(settings.velocitySpeed ?? 1.5);
    setMotionBlurAmount(settings.motionBlurAmount ?? 3);
    setShakeStrength(settings.shakeStrength ?? 1.5);
    setFlashIntensity(settings.flashIntensity ?? 0.75);
    setRgbSplitAmount(settings.rgbSplitAmount ?? 12);
    setSmoothZoomAmount(settings.smoothZoomAmount ?? 0.35);
    setFilmGrainOpacity(settings.filmGrainOpacity ?? 0.4);

    const timer = setTimeout(() => {
      lastLoadedIdRef.current = activePreviewId;
    }, 0);
    return () => clearTimeout(timer);
  }, [activePreviewId]);


  // Sync state changes to clipSettings per clip
  useEffect(() => {
    if (!activePreviewId) return;
    if (lastLoadedIdRef.current !== activePreviewId) return;
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
        current.overlayTextStylePreset === overlayTextStylePreset &&
        current.overlayFontId === overlayFontId &&
        current.overlayFontSize === overlayFontSize &&
        current.overlayColor === overlayColor &&
        current.overlayPosX === overlayPosX &&
        current.overlayPosY === overlayPosY &&
        current.overlayBgEnabled === overlayBgEnabled &&
        current.overlayBgColorHex === overlayBgColorHex &&
        current.blurAmount === blurAmount &&
        current.brightness === brightness &&
        current.contrast === contrast &&
        current.saturation === saturation &&
        current.slowMotionSpeed === slowMotionSpeed &&
        current.glitchIntensity === glitchIntensity &&
        current.velocitySpeed === velocitySpeed &&
        current.motionBlurAmount === motionBlurAmount &&
        current.shakeStrength === shakeStrength &&
        current.flashIntensity === flashIntensity &&
        current.rgbSplitAmount === rgbSplitAmount &&
        current.smoothZoomAmount === smoothZoomAmount &&
        current.filmGrainOpacity === filmGrainOpacity
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
          overlayTextStylePreset,
          overlayFontId,
          overlayFontSize,
          overlayColor,
          overlayPosX,
          overlayPosY,
          overlayBgEnabled,
          overlayBgColorHex,
          blurAmount,
          brightness,
          contrast,
          saturation,
          slowMotionSpeed,
          glitchIntensity,
          velocitySpeed,
          motionBlurAmount,
          shakeStrength,
          flashIntensity,
          rgbSplitAmount,
          smoothZoomAmount,
          filmGrainOpacity,
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
    overlayTextStylePreset,
    overlayFontId,
    overlayFontSize,
    overlayColor,
    overlayPosX,
    overlayPosY,
    overlayBgEnabled,
    overlayBgColorHex,
    blurAmount,
    brightness,
    contrast,
    saturation,
    slowMotionSpeed,
    glitchIntensity,
    velocitySpeed,
    motionBlurAmount,
    shakeStrength,
    flashIntensity,
    rgbSplitAmount,
    smoothZoomAmount,
    filmGrainOpacity,
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

    // Pause the main video during transition - the overlay will show both clips
    if (videoRef.current) {
      videoRef.current.pause();
      console.log("📹 [PLAYBACK] Paused main video during transition overlay");
    }

    setTransitionOverlay({
      fromId: activePreviewId,
      toId: nextId,
      type: transitionType,
      startAt: performance.now(),
      durationMs: 1400,
    });
    setTransitionProgress(0);
  }, [activePreviewId, clipTransitions]);

  // Select clip for preview, optionally triggering transition animation
  const selectPreviewWithTransition = useCallback((nextId: string | null) => {
    if (!nextId) {
      setActivePreviewId(null);
      return;
    }
    if (!activePreviewId || activePreviewId === nextId) {
      setActivePreviewId(nextId);
      return;
    }
    triggerClipTransition(nextId);
  }, [activePreviewId, triggerClipTransition]);

  const playNextMedia = useCallback(() => {
    console.log("📹 [PLAYBACK] playNextMedia called for item:", activePreviewId);
    const currentIndex = mediaItems.findIndex(i => i.id === activePreviewId);
    if (currentIndex !== -1 && currentIndex < mediaItems.length - 1) {
      const nextId = mediaItems[currentIndex + 1].id;
      console.log("📹 [PLAYBACK] Transitioning to next clip:", nextId);
      triggerClipTransition(nextId);
      // Don't try to play here - let the transition completion handler manage playback
      setIsPlaying(true);
    } else {
      console.log("📹 [PLAYBACK] No more clips to play");
      setIsPlaying(false);
    }
  }, [activePreviewId, mediaItems, triggerClipTransition]);

  const togglePlay = () => {
    console.log("📹 [PLAYBACK] togglePlay called, current isPlaying:", isPlaying);
    const activeItem = mediaItems.find(i => i.id === activePreviewId);

    console.log("📹 [PLAYBACK] Active item:", { id: activeItem?.id, type: activeItem?.type, hasVideoRef: !!videoRef.current });

    // If there are no media items, don't try to play
    if (!activeItem || mediaItems.length === 0) {
      console.log("📹 [PLAYBACK] No active item or media items");
      return;
    }

    // For video items, control the video element
    if (activeItem.type === 'video') {
      console.log("📹 [PLAYBACK] Detected video type, videoRef.current:", videoRef.current);
      const trim = getTrimRangeForItem(activeItem.id, activeItem.duration);
      if (isPlaying) {
        console.log("📹 [PLAYBACK] Pausing video");
        setIsPlaying(false);
      } else {
        console.log("📹 [PLAYBACK] Starting video from:", trim.start);
        // Reset to trim start if outside trim range
        if (videoRef.current && (videoRef.current.currentTime < trim.start || videoRef.current.currentTime > trim.end)) {
          videoRef.current.currentTime = trim.start;
        }
        setIsPlaying(true);
      }
    } else {
      // For images or when no video ref, just toggle the playing state
      console.log("📹 [PLAYBACK] Toggling play for image or no ref");
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && mediaItems.length > 0) {
      const activeIndex = mediaItems.findIndex(i => i.id === activePreviewId);
      if (activeIndex < 0) return; // Safety check

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

      // Sync background music time to match globalTime
      if (bgMusicRef.current && selectedMusic) {
        const targetTime = (selectedMusic.startTime ?? 0) + globalTime;
        if (Math.abs(bgMusicRef.current.currentTime - targetTime) > 0.3) {
          bgMusicRef.current.currentTime = targetTime;
        }
      }

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
      const activeCaption = captions.find(c => (!c.clipId || c.clipId === activePreviewId) && ct >= c.startTime && ct < c.endTime) ?? null;
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
          if (bgMusicRef.current && selectedMusic) {
            bgMusicRef.current.currentTime = (selectedMusic.startTime ?? 0) + globalSeekTime;
          }
        }, 10);
        break;
      }
      accumulated += itemEffectiveDuration;
    }
    setProgress(pos);
    setReadLinePosition(pos);
  }, [mediaItems, getEffectiveDurationForItem, getTotalEffectiveDuration, triggerClipTransition, getTrimRangeForItem]);

  const moveReadLine = (deltaSeconds: number) => {
    const totalDuration = getTotalEffectiveDuration();
    if (totalDuration === 0) return;
    const currentTime = (progress / 100) * totalDuration;
    const nextTime = Math.max(0, Math.min(totalDuration, currentTime + deltaSeconds));
    handleTimelineClick(nextTime);
    const nextPos = (nextTime / totalDuration) * 100;
    setReadLinePosition(nextPos);
    setProgress(nextPos);
  };

  useEffect(() => {
    if (showReadLine) {
      setReadLinePosition(progress);
    }
  }, [showReadLine, progress]);

  // Handle play/pause state
  useEffect(() => {
    const activeItem = mediaItems.find(i => i.id === activePreviewId);
    console.log("📹 [PLAYBACK] useEffect triggered:", {
      isPlaying,
      activeId: activePreviewId,
      activeItemType: activeItem?.type,
      hasVideoRef: !!videoRef.current
    });

    if (!videoRef.current || !activeItem || activeItem.type !== 'video') {
      console.log("📹 [PLAYBACK] useEffect skipped - video ref or active item missing", {
        videoRef: !!videoRef.current,
        activeItem: !!activeItem,
        isVideo: activeItem?.type === 'video'
      });
      return;
    }

    const video = videoRef.current;
    console.log("📹 [PLAYBACK] useEffect updating play state:", { isPlaying, videoElementExists: !!video });

    if (isPlaying) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn("📹 [PLAYBACK] useEffect play failed:", err);
        });
      }
    } else {
      video.pause();
    }
  }, [isPlaying, activePreviewId, mediaItems]);

  // Sync background audio with main playback
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Audio play blocked", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, audioTracks.length, audioUrl]);

  // Sync background music with main playback
  useEffect(() => {
    if (bgMusicRef.current && bgMusicUrl) {
      if (isPlaying) {
        bgMusicRef.current.play().catch(e => console.log("Background music play blocked", e));
      } else {
        bgMusicRef.current.pause();
      }
    }
  }, [isPlaying, bgMusicUrl]);

  useEffect(() => {
    const isMutedDeck = isMuted;

    // Set video element volume/mute
    if (videoRef.current) {
      const videoShouldMute = isMutedDeck || (selectedMusic ? selectedMusic.muteOriginal : false);
      videoRef.current.muted = videoShouldMute;
      videoRef.current.volume = videoShouldMute ? 0 : Math.max(0, Math.min(1, volumeLevel));
    }

    // Set upload audio track volume/mute
    if (audioRef.current) {
      audioRef.current.muted = isMutedDeck;
      audioRef.current.volume = isMutedDeck ? 0 : Math.max(0, Math.min(1, volumeLevel));
    }

    // Set background music volume/mute
    if (bgMusicRef.current && selectedMusic) {
      bgMusicRef.current.muted = isMutedDeck;
      const bgVolume = (selectedMusic.volume ?? 80) / 100;
      bgMusicRef.current.volume = isMutedDeck ? 0 : bgVolume;
    }
  }, [isMuted, volumeLevel, selectedMusic]);

  useEffect(() => {
    if (videoRef.current) {
      // Reset video to beginning when switching videos
      const activeItem = mediaItems.find(i => i.id === activePreviewId);
      if (activeItem?.type === 'video') {
        videoRef.current.currentTime = 0;
      }

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
  }, [isPlaying, activePreviewId, mediaItems]);

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
    let effectSpeed = 1;
    if (selectedEffect === 'slow-motion') effectSpeed = slowMotionSpeed;
    if (selectedEffect === 'velocity') effectSpeed = typeof velocitySpeed === 'number' ? velocitySpeed : 1.5;
    const manualSpeed = Math.abs(speedValue - 1) > 0.001 ? speedValue : effectSpeed;
    const resolvedSpeed = Math.max(0.1, Math.min(3, manualSpeed));
    videoRef.current.playbackRate = resolvedSpeed;
  }, [selectedEffect, slowMotionSpeed, velocitySpeed, speedValue, activePreviewId]);

  useEffect(() => {
    const activeItem = mediaItems.find((i) => i.id === activePreviewId);
    if (!activeItem || activeItem.type !== 'video' || !videoRef.current) return;
    const trim = getTrimRangeForItem(activeItem.id, activeItem.duration);
    if (videoRef.current.currentTime < trim.start || videoRef.current.currentTime > trim.end) {
      videoRef.current.currentTime = trim.start;
    }
  }, [activePreviewId, mediaItems, getTrimRangeForItem, clipTrimRanges]);

  // Compute overlay text style CSS from selected preset for use in preview
  const overlayTextStylePresetCss = getOverlayTextStylePresetCss(overlayTextStylePreset);

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

        ctx.save();
        if (activeCanvasMode === 'shake') {
          const strength = typeof shakeStrength !== 'undefined' ? shakeStrength : 1.5;
          const t = performance.now() / 1000;
          const x = Math.sin(t * 22) * strength * 4.5;
          const y = Math.cos(t * 17) * strength * 3.5;
          ctx.translate(x, y);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

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
          ctx.globalAlpha = 0.45;
          ctx.filter = 'blur(6px) brightness(1.2)';
          ctx.globalCompositeOperation = 'screen';
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          ctx.restore();
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

        if (activeCanvasMode === 'old-tv') {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const w = canvas.width;
          const h = canvas.height;

          // Faster chromatic aberration, noise, color grade, and scanlines in one pass
          const tempBuffer = new Uint8ClampedArray(data);

          for (let y = 0; y < h; y++) {
            const isScanline = (y % 4 === 0 || y % 4 === 1);
            const scanlineFactor = isScanline ? 0.82 : 1.0;

            for (let x = 0; x < w; x++) {
              const destIdx = (y * w + x) * 4;

              // Chromatic aberration (chromashift: cbh=3, cbv=2, crh=-3, crv=-2)
              const rx = Math.max(0, Math.min(w - 1, x - 3));
              const ry = Math.max(0, Math.min(h - 1, y - 2));
              const rIdx = (ry * w + rx) * 4;

              const bx = Math.max(0, Math.min(w - 1, x + 3));
              const by = Math.max(0, Math.min(h - 1, y + 2));
              const bIdx = (by * w + bx) * 4;

              let r = tempBuffer[rIdx];
              let g = tempBuffer[destIdx + 1];
              let b = tempBuffer[bIdx + 2];

              // Contrast (1.12), brightness (+5), and saturation (0.85) adjustments
              r = (r - 128) * 1.12 + 128 + 5;
              g = (g - 128) * 1.12 + 128 + 5;
              b = (b - 128) * 1.12 + 128 + 5;

              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              r = gray + (r - gray) * 0.85;
              g = gray + (g - gray) * 0.85;
              b = gray + (b - gray) * 0.85;

              // Warm hue/tint shift
              r = r * 1.02;
              g = g * 1.01;
              b = b * 0.96;

              // Per-frame noise
              const grain = (Math.random() - 0.5) * 26;
              r += grain;
              g += grain;
              b += grain;

              // Scanline factor
              r *= scanlineFactor;
              g *= scanlineFactor;
              b *= scanlineFactor;

              // Vignette (angle=0.6)
              const dx = (x - w / 2) / (w / 2);
              const dy = (y - h / 2) / (h / 2);
              const distSq = dx * dx + dy * dy;
              const vignette = Math.max(0.4, 1.0 - distSq * 0.45);

              data[destIdx] = Math.max(0, Math.min(255, r * vignette));
              data[destIdx + 1] = Math.max(0, Math.min(255, g * vignette));
              data[destIdx + 2] = Math.max(0, Math.min(255, b * vignette));
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }

        // Transition previews are handled by per-clip transition overlay,
        // not by global effect canvas rendering.

        if (activeCanvasMode === 'rgb-split') {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const w = canvas.width;
          const h = canvas.height;
          const amount = Math.max(1, rgbSplitAmount || 12);
          const shift = Math.round(amount * 0.5);

          const tempBuffer = new Uint8ClampedArray(data);

          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const destIdx = (y * w + x) * 4;

              // Shift red channel to the left, blue channel to the right
              const rx = Math.max(0, Math.min(w - 1, x - shift));
              const bx = Math.max(0, Math.min(w - 1, x + shift));

              data[destIdx] = tempBuffer[(y * w + rx) * 4];       // Red
              data[destIdx + 2] = tempBuffer[(y * w + bx) * 4 + 2]; // Blue
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }

        if (activeCanvasMode === 'film-grain') {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const opacity = typeof filmGrainOpacity !== 'undefined' ? filmGrainOpacity : 0.4;
          const grainRange = opacity * 40;

          for (let i = 0; i < data.length; i += 4) {
            const grain = (Math.random() - 0.5) * grainRange;
            data[i] = Math.max(0, Math.min(255, data[i] + grain));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
          }
          ctx.putImageData(imageData, 0, 0);
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
  }, [
    selectedEffect,
    selectedFilter,
    isPlaying,
    activePreviewId,
    glitchIntensity,
    overlayText,
    shakeStrength,
    rgbSplitAmount,
    filmGrainOpacity,
  ]);

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
        // Transition preview finished - update to the next clip
        console.log("✅ [TRANSITIONS] Preview animation completed for transition:", transitionOverlay.type);
        console.log("📹 [PLAYBACK] Switching to next clip after transition, isPlaying:", isPlaying);
        setActivePreviewId(transitionOverlay.toId);
        setTransitionOverlay(null);
        setTransitionProgress(0);

        // Ensure playback continues on the next clip
        if (isPlaying) {
          setTimeout(() => {
            if (videoRef.current) {
              console.log("📹 [PLAYBACK] Resuming playback on next clip");
              videoRef.current.play().catch((err) => {
                console.warn("📹 [PLAYBACK] Failed to resume playback after transition:", err);
              });
            }
          }, 50);
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [transitionOverlay, isPlaying]);

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
    if (style) {
      setAspectRatio(style.ratio);
      // Auto-set standard FPS based on style if needed
      if (style.id === 'youtube') setFps(60);
      else setFps(30);
    }
  }, [selectedStyle]);

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
    if (selectedEffect === 'motion-blur') return `blur(${motionBlurAmount}px) brightness(1.05)`;
    if (selectedEffect === 'rgb-split') return `contrast(1.2) saturate(1.3)`;
    if (selectedEffect === 'film-grain') return 'contrast(1.05) saturate(1.1)';
    if (selectedEffect === 'flash-effect') return 'brightness(1.4) contrast(1.15)';
    if (selectedEffect === 'smooth-zoom') return 'contrast(1.1)';
    if (selectedEffect === 'velocity') return 'saturate(1.1)';
    if (selectedEffect === 'glitch') return 'contrast(1.1) saturate(1.25)';
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

    if (selectedFilter === 'black-white') return 'grayscale(1) contrast(1.15)';
    if (selectedFilter === 'cinematic') return 'contrast(1.45) brightness(1.1) saturate(1.25)';
    if (selectedFilter === 'moody') return 'contrast(1.2) brightness(0.95) saturate(0.95) sepia(0.08)';
    if (selectedFilter === 'warm-tone') return 'sepia(0.2) saturate(1.25) hue-rotate(-8deg) brightness(1.05)';
    if (selectedFilter === 'cool-tone') return 'saturate(1.1) hue-rotate(14deg) brightness(0.98)';
    if (selectedFilter === 'vintage') return 'sepia(0.35) contrast(0.95) brightness(1.05) saturate(0.9)';
    if (selectedFilter === 'teal-orange') return 'contrast(1.3) saturate(1.25) hue-rotate(-7deg) brightness(1.02)';
    if (selectedFilter === 'dreamy-glow') return 'contrast(0.95) saturate(1.15) brightness(1.05)';
    if (selectedFilter === 'film-look') return 'contrast(1.2) brightness(1.05) saturate(1.15)';
    if (selectedFilter === 'vhs') return 'contrast(1.15) saturate(1.2) hue-rotate(2deg) sepia(0.05)';
    if (selectedFilter === 'soft-skin') return 'brightness(1.05) saturate(1.15) contrast(0.95)';
    if (selectedFilter === 'neon-glow') return 'saturate(1.4) brightness(1.05) contrast(1.2) hue-rotate(10deg)';
    if (selectedFilter === 'hdr-pop') return 'contrast(1.55) brightness(1.15) saturate(1.45)';

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
    const zoomScale = selectedEffect === 'zoom' ? previewZoom : selectedEffect === 'smooth-zoom' ? 1 + smoothZoomAmount * Math.sin((progress / 100) * Math.PI) : 1;
    let keyframeScale = 1;
    if (keyframeMode === 'zoom-in') {
      keyframeScale = 1 + (keyframeAmount - 1) * keyframeProgress;
    } else if (keyframeMode === 'zoom-out') {
      keyframeScale = keyframeAmount - (keyframeAmount - 1) * keyframeProgress;
    } else if (keyframeMode === 'pulse') {
      keyframeScale = 1 + (keyframeAmount - 1) * Math.sin(keyframeProgress * Math.PI);
    }

    let shakeOffset = '';
    if (selectedEffect === 'shake') {
      const t = performance.now() / 1000;
      const strength = typeof shakeStrength !== 'undefined' ? shakeStrength : 1.5;
      const x = Math.sin(t * 18) * strength * 1.2;
      const y = Math.cos(t * 14) * strength * 0.9;
      shakeOffset = ` translate(${x}px, ${y}px)`;
    }

    let rgbOffset = '';
    if (selectedEffect === 'rgb-split') {
      const offset = rgbSplitAmount;
      rgbOffset = ` translate(${Math.sin(performance.now() / 150) * offset * 0.4}px, ${Math.cos(performance.now() / 180) * offset * 0.25}px)`;
    }

    let glitchOffset = '';
    if (selectedEffect === 'glitch') {
      const t = performance.now() / 130;
      const x = Math.sin(t * 25) * 2.5;
      const y = Math.cos(t * 31) * 1.8;
      glitchOffset = ` translate(${x}px, ${y}px)`;
    }

    const baseTransform = `scale(${zoomScale * zoomToolAmount * keyframeScale}) rotate(${rotationDegrees}deg)`;
    return `${baseTransform}${shakeOffset}${rgbOffset}${glitchOffset}`;
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
      selectPreviewWithTransition(nextId);
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

    selectPreviewWithTransition(newItems[0].id);
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
      const nextItems = prev.filter(i => i.id !== id);
      if (activePreviewId === id) {
        selectPreviewWithTransition(nextItems[0]?.id || null);
      }
      saveToUndo(nextItems);
      return nextItems;
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

  const handleDeleteClip = useCallback((clipId: string) => {
    setMediaItems((prev) => {
      const updated = prev.filter((item) => item.id !== clipId);
      saveToUndo(updated);

      // If the deleted clip was active, select a new active clip
      if (activePreviewId === clipId) {
        const newActiveId = updated.length > 0 ? updated[0].id : null;
        setActivePreviewId(newActiveId);
      }

      return updated;
    });
  }, [activePreviewId, saveToUndo]);

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
    try {
      if (!activePreviewId) {
        console.warn("⚠️ [TRANSITIONS] No active clip selected");
        return;
      }

      console.log("📝 [TRANSITIONS] Applying transition to clip", {
        clipId: activePreviewId,
        transition,
        allClipTransitions: clipTransitions
      });

      // Save transition to state - this is what gets sent to the backend
      setClipTransitions((prev) => {
        const updated = { ...prev, [activePreviewId]: transition };
        console.log("✅ [TRANSITIONS] Transition saved to state", {
          clipId: activePreviewId,
          transition,
          updated
        });
        return updated;
      });

      const currentIndex = mediaItems.findIndex((item) => item.id === activePreviewId);
      if (currentIndex !== -1 && currentIndex < mediaItems.length - 1) {
        // Only show preview if there's a next clip
        const nextId = mediaItems[currentIndex + 1].id;

        console.log("📺 [TRANSITIONS] Playing preview animation", {
          from: activePreviewId,
          to: nextId,
          type: transition,
          message: "Preview shows what transition will look like in final video"
        });

        setTransitionOverlay({
          fromId: activePreviewId,
          toId: nextId,
          type: transition,
          startAt: performance.now(),
          durationMs: 1400,
        });
        setTransitionProgress(0);
      } else {
        console.log("📝 [TRANSITIONS] No preview (last clip or single clip selected)");
      }

      // Close tool panel after a brief delay to ensure state is saved
      setTimeout(() => {
        setActiveTool(null);
      }, 100);
    } catch (error) {
      console.error("❌ [TRANSITIONS] Error applying transition:", error);
    }
  };

  const handleGenerate = () => {
    const effectSettings = {
      blurAmount,
      brightness,
      contrast,
      saturation,
      slowMotionSpeed,
      glitchIntensity,
      velocitySpeed,
      motionBlurAmount,
      shakeStrength,
      flashIntensity,
      rgbSplitAmount,
      smoothZoomAmount,
      filmGrainOpacity,
      animatedText: overlayText.trim().length > 0 ? overlayText : animatedText,
    };

    const mediaForProcessing = mediaItems
      .filter((item) => item.file)
      .map((item) => {
        const settings = clipSettings[item.id] || {};
        return {
          id: item.id,
          file: item.file,
          type: item.type,
          duration: item.duration,
          effect: settings.selectedEffect || 'none',
          filter: settings.selectedFilter || 'none',
          effectSettings: {
            blurAmount: settings.blurAmount ?? 10,
            brightness: settings.brightness ?? 1,
            contrast: settings.contrast ?? 1,
            saturation: settings.saturation ?? 1,
            slowMotionSpeed: settings.slowMotionSpeed ?? 0.25,
            glitchIntensity: settings.glitchIntensity ?? 1,
            velocitySpeed: settings.velocitySpeed ?? 1.5,
            motionBlurAmount: settings.motionBlurAmount ?? 3,
            shakeStrength: settings.shakeStrength ?? 1.5,
            flashIntensity: settings.flashIntensity ?? 0.75,
            rgbSplitAmount: settings.rgbSplitAmount ?? 12,
            smoothZoomAmount: settings.smoothZoomAmount ?? 0.35,
            filmGrainOpacity: settings.filmGrainOpacity ?? 0.4,
          },
          textOverlay: {
            enabled: (settings.overlayText || '').trim().length > 0,
            text: settings.overlayText || '',
            stylePreset: settings.overlayTextStylePreset || 'none',
            fontId: settings.overlayFontId || 'serif',
            fontFamily: textFontOptions.find((f) => f.id === settings.overlayFontId)?.family || textFontOptions[0].family,
            fontSize: settings.overlayFontSize ?? 48,
            color: settings.overlayColor || '#FFFFFF',
            bgEnabled: settings.overlayBgEnabled ?? false,
            bgColorHex: settings.overlayBgColorHex || '#000000',
            position: {
              x: settings.overlayPosX ?? 50,
              y: settings.overlayPosY ?? 50,
            },
          },
        };
      });

    const transitionPlan = mediaForProcessing.map((item, index) => ({
      index,
      transition: clipTransitions[item.id] || 'none',
    }));

    console.log("🎬 [GENERATE] Transition plan created:", {
      mediaCount: mediaForProcessing.length,
      transitionPlan: transitionPlan,
      clipTransitions: clipTransitions,
      hasTransitions: transitionPlan.some(t => t.transition !== 'none'),
    });

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
        stylePreset: overlayTextStylePreset || 'none',
        fontId: overlayFontId,
        fontFamily: textFontOptions.find((f) => f.id === overlayFontId)?.family || textFontOptions[0].family,
        fontSize: overlayFontSize,
        color: overlayColor,
        bgEnabled: overlayBgEnabled,
        bgColorHex: overlayBgColorHex,
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
        items: mediaForProcessing.map((item) => ({
          id: item.id,
          type: item.type,
          duration: item.duration,
          effect: item.effect,
          filter: item.filter,
          effectSettings: item.effectSettings,
          textOverlay: item.textOverlay,
        })),
        count: mediaForProcessing.length,
      },
      audio: {
        tracks: audioForProcessing.map((track) => ({ id: track.id, name: track.name, type: track.type })),
        count: audioForProcessing.length,
      },
      captions: captions.map((caption) => ({
        id: caption.id,
        text: caption.text,
        startTime: caption.startTime,
        endTime: caption.endTime,
        clipId: caption.clipId,
      })),
      captionStyle: {
        fontId: captionStyle.fontId,
        fontFamily: textFontOptions.find((f) => f.id === captionStyle.fontId)?.family || 'Arial',
        fontSize: captionStyle.fontSize,
        color: captionStyle.color,
        bgEnabled: captionStyle.bgEnabled,
        bgColorHex: captionStyle.bgColorHex,
        alignment: captionStyle.alignment,
        bold: captionStyle.bold,
        italic: captionStyle.italic,
        outline: captionStyle.outline,
        posX: captionStyle.posX,
        posY: captionStyle.posY,
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

    // Debug logging for transitions
    console.log("📤 [QUICK-EDIT] Sending to processing screen:", {
      mediaCount: mediaForProcessing.length,
      transitionPlan: transitionPlan,
      clipTransitions: clipTransitions,
      editorSelectionsTransitions: editorSelections.transitions,
      hasTransitionsInPlan: transitionPlan.some(t => t.transition !== 'none'),
      hasTransitionsInClipMap: Object.values(clipTransitions).some(t => t !== 'none'),
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
    } else if (type === 'fade-transition') {
      base.opacity = isFrom ? 1 - p : p;
    } else if (type === 'swipe-transition') {
      base.opacity = isFrom ? 1 - p : p;
      base.transform = isFrom ? `translateX(${-p * 120}%)` : `translateX(${(1 - p) * 120}%)`;
    } else if (type === 'whip-pan-transition') {
      base.opacity = isFrom ? 1 - p : p;
      base.transform = isFrom
        ? `translateX(${-200 * p}%) skewX(${p * 10}deg) scale(${1 - p * 0.12})`
        : `translateX(${200 * (1 - p)}%) skewX(${-(1 - p) * 10}deg) scale(${0.88 + p * 0.12})`;
    } else if (type === 'mask-transition') {
      const clipValue = isFrom ? `inset(0 ${p * 100}% 0 0)` : `inset(0 0 0 ${(1 - p) * 100}%)`;
      base.clipPath = clipValue;
      base.opacity = isFrom ? 1 - p * 0.5 : p;
    } else if (type === 'camera-shake-transition') {
      const shake = isFrom ? Math.sin(p * 40) * 8 * p : Math.sin((1 - p) * 40) * 8 * (1 - p);
      base.opacity = isFrom ? 1 - p : p;
      base.transform = `translate(${shake}px, ${shake / 2}px) rotate(${shake * 0.12}deg)`;
      base.filter = `contrast(${1.1 + p * 0.2})`;
    } else if (type === 'match-cut-transition') {
      base.opacity = isFrom ? 1 - p * 0.9 : p * 0.9;
      base.transform = isFrom ? 'none' : 'none';
    } else if (type === 'speed-ramp-transition') {
      base.opacity = isFrom ? 1 - p : p;
      base.transform = isFrom ? `scale(${1 + p * 0.15})` : `scale(${0.85 + p * 0.15})`;
      base.filter = `blur(${p * 4}px)`;
    } else if (type === 'flash-transition') {
      base.opacity = isFrom ? 1 - p : p;
    } else if (type === 'dip-black' || type === 'dip-white') {
      base.opacity = isFrom ? (p < 0.5 ? 1 - p * 2 : 0) : (p < 0.5 ? 0 : (p - 0.5) * 2);
    }

    return base;
  };

  return (
    <div
      className="h-screen w-full flex flex-col overflow-hidden font-sans selection:bg-purple-500/30 selection:text-white text-slate-200"
      style={{
        background: 'linear-gradient(135deg, #0B1020 0%, #1a1b2e 30%, #2d3142 60%, #3f4a67 85%, #1a1b2e 100%)',
      }}
    >
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-purple-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-fuchsia-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 500px rgba(11,13,31,0.95)' }} />
      </div>

      {/* Top Header */}
      <header className="h-14 flex-none border-b border-white/10 flex items-center justify-between px-4 bg-black/20 backdrop-blur-3xl z-20">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/quick-edit/upload")}
            className="p-1.5 hover:bg-white/5 rounded transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors group">
              <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-bold">Photos</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors group">
              <Video className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-bold">Media</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors group">
              <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-bold">Elements</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors group">
              <div className="text-[12px] leading-none font-bold">T</div>
              <span className="text-[8px] font-bold">Text</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors group">
              <Music className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-bold">Music</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors group">
              <Volume2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-bold">Sound FX</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <span>Jun 09, 2026</span>
            <button className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400">
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-amber-400 text-[10px] font-bold px-2 py-1 bg-amber-400/10 rounded border border-amber-400/20">
            <Star className="w-3 h-3" />
            <span>+ 0.00</span>
          </div>
          <button className="p-1.5 hover:bg-white/10 rounded text-slate-400 transition-colors">
            <Monitor className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded text-slate-400 transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded text-slate-400 transition-colors">
            <HelpCircle className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded text-slate-400 transition-colors">
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Multi-Pane Studio Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">

        {/* Top Part of Workspace: Three Column Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden border-b border-white/10">

          {/* Left Column: Swapped Layout (Toolbox on Left, Categories/Media on Right) */}
          <aside className="w-[380px] flex-none flex bg-[#0B1020]/40 backdrop-blur-md overflow-hidden relative border-r border-white/10">

            {/* Toolbox Column (Left) */}
            <div className="flex-1 flex flex-col bg-[#0b0d26] border-r border-white/10 relative">
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">Toolbox Options</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
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
                        velocitySpeed={velocitySpeed} setVelocitySpeed={setVelocitySpeed}
                        motionBlurAmount={motionBlurAmount} setMotionBlurAmount={setMotionBlurAmount}
                        shakeStrength={shakeStrength} setShakeStrength={setShakeStrength}
                        flashIntensity={flashIntensity} setFlashIntensity={setFlashIntensity}
                        rgbSplitAmount={rgbSplitAmount} setRgbSplitAmount={setRgbSplitAmount}
                        smoothZoomAmount={smoothZoomAmount} setSmoothZoomAmount={setSmoothZoomAmount}
                        filmGrainOpacity={filmGrainOpacity} setFilmGrainOpacity={setFilmGrainOpacity}
                        overlayTextStylePreset={overlayTextStylePreset} setOverlayTextStylePreset={setOverlayTextStylePreset}
                        getOverlayTextEffectForPreset={getOverlayTextEffectForPreset}
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
                        overlayBgEnabled={overlayBgEnabled}
                        setOverlayBgEnabled={setOverlayBgEnabled}
                        overlayBgColorHex={overlayBgColorHex}
                        setOverlayBgColorHex={setOverlayBgColorHex}
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
                          { id: 'subtitles', label: 'Subtitles', icon: Layers, color: 'text-fuchsia-400' },
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
                              className="scale-50 data-[state=checked]:bg-purple-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Tools Grid */}
                    <div className="mt-4">
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
            </div>

            {/* Category / Items Column (Right) */}
            <div className={`flex-none flex flex-col bg-black/20 relative transition-all ${isCategoriesOpen ? 'w-[100px]' : 'w-[40px]'}`}>
              <div className="p-2 border-b border-white/5 flex items-center justify-center bg-black/30">
                <button
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-all w-full flex justify-center"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </div>

              {isCategoriesOpen && (
                <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar flex-1 border-b border-white/5">
                  {[
                    { label: 'Favorite', icon: Star },
                    { label: 'Cartoon', icon: Sparkles },
                    { label: 'Fast Swish', icon: Zap },
                    { label: 'Funny', icon: HelpCircle },
                    { label: 'Machine', icon: Monitor },
                    { label: 'Ringing', icon: Music },
                    { label: 'Vehicles', icon: Video },
                    { label: 'Transitions', icon: Sliders },
                    { label: 'My Effect', icon: Zap }
                  ].map((cat, idx) => (
                    <button key={cat.label} className={`w-full flex items-center gap-2 p-2 rounded transition-colors text-left group ${idx === 0 ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                      <cat.icon className={`w-3 h-3 ${idx === 0 ? 'text-purple-400' : 'group-hover:text-purple-400'}`} />
                      <span className="text-[9px] font-bold truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              )}



            </div>

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
                <AnimatePresence mode="wait">
                  {activePreviewId && activePreviewItem ? (
                    <motion.div
                      key={`preview-${activePreviewId}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 w-full h-full"
                    >
                      {activePreviewItem.type === 'video' ? (
                        <>
                          <video
                            ref={videoRef}
                            key={`video-${activePreviewItem.id}`}
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={playNextMedia}
                            onLoadStart={() => {
                              console.log("📹 [PLAYBACK] onLoadStart");
                            }}
                            onLoadedMetadata={() => {
                              console.log("📹 [PLAYBACK] onLoadedMetadata");
                              if (selectedEffect === 'fade-in') setPreviewOpacity(0);
                              else setPreviewOpacity(1);
                              if (selectedEffect !== 'zoom') setPreviewZoom(1);
                            }}
                            onLoadedData={() => {
                              console.log("📹 [PLAYBACK] onLoadedData, videoRef.current exists:", !!videoRef.current);
                              // Reset current time to trim start when new video is loaded
                              if (videoRef.current) {
                                const activeItem = mediaItems.find(i => i.id === activePreviewId);
                                if (activeItem?.type === 'video') {
                                  const trim = getTrimRangeForItem(activeItem.id, activeItem.duration);
                                  const videoElement = videoRef.current;
                                  videoElement.currentTime = trim.start;
                                  console.log("📹 [PLAYBACK] Video loaded, current time set to:", trim.start, "isPlaying:", isPlaying);
                                  // Immediately try to play if isPlaying is true
                                  if (isPlaying) {
                                    setTimeout(() => {
                                      if (videoElement) {
                                        videoElement.play().catch(err => {
                                          console.warn("📹 [PLAYBACK] Play attempt failed on load:", err);
                                        });
                                      }
                                    }, 10);
                                  }
                                } else {
                                  videoRef.current.currentTime = 0;
                                }
                              }
                            }}
                            onCanPlay={(e) => {
                              const videoElement = e.currentTarget;
                              console.log("📹 [PLAYBACK] onCanPlay fired, isPlaying:", isPlaying, "videoElement:", !!videoElement);
                              if (isPlaying && videoElement) {
                                setTimeout(() => {
                                  if (videoElement) {
                                    videoElement.play().catch(err => {
                                      console.warn("📹 [PLAYBACK] Play attempt failed:", err);
                                    });
                                  }
                                }, 10);
                              }
                            }}
                            onError={(e) => {
                              console.error("📹 [PLAYBACK] Video error:", e);
                            }}
                            src={activePreviewItem.preview}
                            className={CANVAS_PREVIEW_EFFECTS.includes(selectedEffect) || CANVAS_PREVIEW_FILTERS.includes(selectedFilter) ? 'hidden' : 'w-full h-full object-contain'}
                            style={{
                              opacity: selectedEffect === 'fade-in' ? previewOpacity : 1,
                              filter: getCombinedPreviewFilterCss(),
                              transform: getPreviewTransform(),
                              clipPath: getPreviewClipPath(),
                              transformOrigin: 'center center',
                            }}
                            muted={isMuted}
                            playsInline
                          />
                          {(CANVAS_PREVIEW_EFFECTS.includes(selectedEffect) || CANVAS_PREVIEW_FILTERS.includes(selectedFilter)) && (
                            <canvas
                              ref={greenScreenCanvasRef}
                              className="w-full h-full object-contain"
                              style={{
                                filter: getCombinedPreviewFilterCss(),
                                transform: getPreviewTransform(),
                                clipPath: getPreviewClipPath(),
                                transformOrigin: 'center center',
                              }}
                            />
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
                              transformOrigin: 'center center',
                            }}
                            alt="Preview"
                          />
                        </>
                      )}
                      {audioUrl && <audio ref={audioRef} src={audioUrl} muted={isMuted} className="hidden" />}
                      {bgMusicUrl && <audio ref={bgMusicRef} src={bgMusicUrl} className="hidden" />}
                      {selectedEffect === 'flash-effect' && (
                        <div
                          className="absolute inset-0 pointer-events-none bg-white"
                          style={{
                            opacity: Math.min(0.5, Math.max(0, Math.sin((progress / 100) * Math.PI * 10) * 0.24 + 0.18)),
                            mixBlendMode: 'screen',
                          }}
                        />
                      )}
                      {selectedEffect === 'film-grain' && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                            backgroundSize: '2px 2px, 2px 2px',
                            opacity: 0.18,
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                      {selectedEffect === 'rgb-split' && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            boxShadow: `inset 0 0 0 ${rgbSplitAmount / 5}px rgba(255,0,100,0.12), inset 0 0 0 ${rgbSplitAmount / 8}px rgba(0,255,255,0.08)`,
                          }}
                        />
                      )}
                      {/* Animated captions preview removed */}
                    </motion.div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-6">
                      <Video className="w-12 h-12 text-purple-400/10 animate-pulse" />
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

                {overlayText.trim().length > 0 && (
                  <div
                    className="absolute z-40 pointer-events-none select-none text-center"
                    style={{
                      left: `${overlayPosX}%`,
                      top: `${overlayPosY}%`,
                      transform: overlayTextStylePreset === 'motion-tracking-text'
                        ? `translate(-50%, -50%) translateX(${Math.sin((progress / 100) * Math.PI * 2) * 12}px)`
                        : 'translate(-50%, -50%)',
                      maxWidth: '88%',
                      ...getOverlayTextStylePresetCss(overlayTextStylePreset),
                      background: overlayBgEnabled ? `${overlayBgColorHex}cc` : getOverlayTextStylePresetCss(overlayTextStylePreset).background,
                      padding: overlayBgEnabled ? '4px 12px' : getOverlayTextStylePresetCss(overlayTextStylePreset).padding,
                      borderRadius: overlayBgEnabled ? '6px' : getOverlayTextStylePresetCss(overlayTextStylePreset).borderRadius,
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
                          top: `${readLinePosition}%`,
                          left: 0,
                          right: 0,
                          height: '2px',
                          background: 'linear-gradient(90deg, transparent 0%, rgba(168, 85, 247,0.9) 20%, rgba(168, 85, 247,1) 50%, rgba(168, 85, 247,0.9) 80%, transparent 100%)',
                          boxShadow: '0 0 8px rgba(168, 85, 247,0.7), 0 0 24px rgba(168, 85, 247,0.25)',
                        }
                        : {
                          left: `${readLinePosition}%`,
                          top: 0,
                          bottom: 0,
                          width: '2px',
                          background: 'linear-gradient(180deg, transparent 0%, rgba(168, 85, 247,0.9) 20%, rgba(168, 85, 247,1) 50%, rgba(168, 85, 247,0.9) 80%, transparent 100%)',
                          boxShadow: '0 0 8px rgba(168, 85, 247,0.7), 0 0 24px rgba(168, 85, 247,0.25)',
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
                  {Math.abs(speedValue - 1) > 0.001 && <div className="px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-400/30 text-[8px] font-black uppercase text-purple-200">Speed {speedValue.toFixed(2)}x</div>}
                  {hasTrimApplied && activePreviewId && <div className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30 text-[8px] font-black uppercase text-emerald-200">Trimmed</div>}
                  {rotationDegrees % 360 !== 0 && <div className="px-1.5 py-0.5 rounded bg-fuchsia-500/20 border border-fuchsia-400/30 text-[8px] font-black uppercase text-fuchsia-200">Rotated {rotationDegrees}°</div>}
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
                  className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-[#0B1020] hover:scale-105 active:scale-95 transition-all shadow-md shadow-purple-500/10"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
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
                  className={`p-1 rounded transition-all ${showReadLine ? 'text-purple-400 bg-purple-500/15' : 'text-slate-500 hover:text-white'
                    }`}
                >
                  <ScanLine className="w-4 h-4" />
                </button>

                {showReadLine && (
                  <>
                    <button
                      onClick={() => moveReadLine(-1)}
                      title="Move Read Line Left"
                      className="p-1 rounded transition-all text-slate-400 hover:text-white hover:bg-white/5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveReadLine(1)}
                      title="Move Read Line Right"
                      className="p-1 rounded transition-all text-slate-400 hover:text-white hover:bg-white/5"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setReadLineDirection(d => d === 'horizontal' ? 'vertical' : 'horizontal')}
                      title={`Direction: ${readLineDirection}`}
                      className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 transition-all"
                    >
                      {readLineDirection === 'horizontal' ? '↔' : '↕'}
                    </button>
                  </>
                )}
              </div>

              {/* FPS & Ratio status info */}
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                {aspectRatio} • {fps} FPS
              </div>
            </div>

          </section>

          {/* Toggle Media Pool Button */}
          <div className="relative flex items-center z-50" style={{ width: 0 }}>
            <button
              onClick={() => setIsMediaPoolVisible(!isMediaPoolVisible)}
              className="absolute right-0 w-6 h-12 bg-[#0B1020]/90 border border-white/10 border-r-0 rounded-l-md flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              {isMediaPoolVisible ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Right Column: Media Pool */}
          <motion.aside
            initial={false}
            animate={{ width: isMediaPoolVisible ? 280 : 0, opacity: isMediaPoolVisible ? 1 : 0 }}
            className="flex-none flex flex-col bg-[#0B1020]/40 border-l border-white/10 backdrop-blur-md overflow-hidden select-none"
          >
            <div className="w-[280px] h-full flex flex-col">
              <div className="p-4 border-b border-white/5 bg-black/20">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Media Pool</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="flex flex-col gap-3">
                {mediaItems.map((item, i) => (
                  <div
                    key={item.id}
                    onClick={() => triggerClipTransition(item.id)}
                    draggable="true"
                    onDragStart={(e: any) => {
                      e.dataTransfer.setData('clipId', item.id);
                    }}
                    className={`group relative aspect-video rounded-xl border-2 transition-all cursor-pointer overflow-hidden bg-slate-900 ${activePreviewId === item.id
                        ? 'border-purple-500 shadow-[0_0_15px_rgba(168, 85, 247,0.3)]'
                        : 'border-white/10 hover:border-white/30'
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); removeMediaItem(item.id); }}
                        className="p-1.5 rounded bg-red-500/80 text-white hover:bg-red-500 hover:scale-110 transition-all shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/80 backdrop-blur text-[8px] font-black text-white/90 uppercase tracking-wider">
                      {item.type}
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => mediaInputRef.current?.click()}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 transition-all text-slate-400 hover:text-white flex flex-col items-center justify-center gap-2"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Add Media</span>
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
            </div>
          </motion.aside>

        </div>

        {/* Bottom Panel: Multitrack Timeline lanes and Audio Mixer */}
        <div className={`${timelineSize === 'minimized' ? 'h-[120px]' :
            timelineSize === 'maximized' ? 'h-[460px]' : 'h-[280px]'
          } flex-none border-t border-white/10 bg-black/25 backdrop-blur-3xl flex p-4 gap-4 overflow-hidden select-none transition-all duration-300`}>
          {/* Timeline hub container */}
          <div className="flex-1 overflow-hidden h-full">
            <TimelineHub
              mediaItems={mediaItems}
              getClipGlobalStart={getClipGlobalStart}
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
              handleDeleteClip={handleDeleteClip}
              getMediaDuration={getMediaDuration}
              setMediaItems={setMediaItems}
              saveToUndo={saveToUndo}
              timelineSize={timelineSize}
              setTimelineSize={setTimelineSize}
              overlayTextStylePreset={overlayTextStylePreset}
              overlayTextStylePresetCss={getOverlayTextStylePresetCss(overlayTextStylePreset)}
              extractingAudio={extractingAudio}
              setExtractingAudio={setExtractingAudio}
              audioError={audioError}
              setAudioError={setAudioError}
              showReadLine={showReadLine}
              setShowReadLine={setShowReadLine}
              selectPreviewWithTransition={selectPreviewWithTransition}
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition-all font-bold text-[9px] uppercase tracking-wider"
            title="Add background music"
          >
            <Music className="w-3.5 h-3.5" />
            <span>{selectedMusic ? 'Music Added ✓' : 'Add Music'}</span>
          </button>
        </div>

        <div className="flex items-center relative">
          <button 
            onClick={() => setIsFormatMenuOpen(!isFormatMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 transition-all font-bold text-[9px] uppercase tracking-wider"
          >
            <Smartphone className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Format: {aspectRatio}</span>
            <ChevronRight className={`w-3 h-3 text-slate-500 transition-transform ${isFormatMenuOpen ? '-rotate-90' : ''}`} />
          </button>
          
          {isFormatMenuOpen && (
            <>
              {/* Invisible overlay to close on click outside */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsFormatMenuOpen(false)} 
              />
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#0B1020]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col py-1">
                {[
                  { id: '16:9', label: 'YouTube (16:9)', icon: Youtube },
                  { id: '9:16', label: 'Instagram (9:16)', icon: Instagram },
                  { id: '1:1', label: 'Square (1:1)', icon: Square },
                  { id: '4:3', label: 'Classic (4:3)', icon: Monitor },
                  { id: '21:9', label: 'Cinematic (21:9)', icon: Film },
                  { id: 'Custom', label: 'Custom Frame', icon: Maximize2 }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => {
                      setAspectRatio(fmt.id);
                      setIsFormatMenuOpen(false);
                      if (fmt.id === 'Custom') setIsCustomFrameOpen(true);
                    }}
                    className={`flex items-center gap-3 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors w-full text-left ${aspectRatio === fmt.id ? 'bg-purple-500/20 text-purple-300' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                  >
                    <fmt.icon className="w-4 h-4 opacity-70" />
                    {fmt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/quick-edit/upload")}
            className="px-5 h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Discard
          </button>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(168, 85, 247,0.2)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            className="relative h-9 px-6 rounded-lg flex items-center gap-2 transition-all overflow-hidden bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-400 text-[#0B1020] cursor-pointer"
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

      {/* Custom Frame Dialog */}
      <Dialog open={isCustomFrameOpen} onOpenChange={setIsCustomFrameOpen}>
        <DialogContent className="bg-[#0B1020] border-white/10 text-slate-200">
          <DialogHeader>
            <DialogTitle>Custom Frame Size</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Width (px)</Label>
              <input
                type="number"
                value={customFrame.width}
                onChange={(e) => setCustomFrame(prev => ({ ...prev, width: Number(e.target.value) || 0 }))}
                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-500 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Height (px)</Label>
              <input
                type="number"
                value={customFrame.height}
                onChange={(e) => setCustomFrame(prev => ({ ...prev, height: Number(e.target.value) || 0 }))}
                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-500 text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setIsCustomFrameOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                setAspectRatio('Custom');
                setIsCustomFrameOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>


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
          background: rgba(168, 85, 247, 0.2);
        }
      `}} />

    </div>
  );
});
