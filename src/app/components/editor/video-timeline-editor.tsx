import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Video,
  Play,
  Pause,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

type TransitionType = 'none' | 'fade' | 'slide' | 'wipe' | 'crossfade';

type TimelineClip = {
  id: string;
  label: string;
  preview: string;
  file?: File;  // Original file object for API submission
  duration: number;
  trackIndex: number;
  trimStart: number;
  trimEnd: number;
  transition: TransitionType;
};

const TRANSITION_LABELS: Record<TransitionType, string> = {
  none: 'None',
  fade: 'Fade',
  slide: 'Slide',
  wipe: 'Wipe',
  crossfade: 'Crossfade',
};

const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve(video.duration || 0.1);
      URL.revokeObjectURL(video.src);
    };
    video.onerror = () => {
      resolve(5.0);
      URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(file);
  });
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function VideoTimelineEditor() {
  const [clips, setClips] = useState<TimelineClip[]>([]);
  const [trackCount, setTrackCount] = useState(3);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [globalProgress, setGlobalProgress] = useState(0);
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [hoveredTrack, setHoveredTrack] = useState<number | null>(null);

  const previewRef = useRef<HTMLVideoElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlsRef = useRef<string[]>([]);

  const activeClip = useMemo(() => clips.find((clip) => clip.id === selectedClipId) ?? null, [clips, selectedClipId]);

  const trackGroups = useMemo(() => {
    return Array.from({ length: trackCount }, (_, trackIndex) => ({
      index: trackIndex,
      clips: clips.filter((clip) => clip.trackIndex === trackIndex),
    }));
  }, [clips, trackCount]);

  const trackDurations = useMemo(() => {
    return trackGroups.map((row) => row.clips.reduce((sum, clip) => sum + (clip.trimEnd - clip.trimStart), 0));
  }, [trackGroups]);

  const longestTrackDuration = useMemo(() => Math.max(0.01, ...trackDurations, 10), [trackDurations]);
  const basePixelsPerSecond = 80;
  const pixelsPerSecond = Math.max(40, basePixelsPerSecond * zoom);
  const timelineWidth = Math.max(560, longestTrackDuration * pixelsPerSecond + 120);

  // Calculate total duration across ALL clips for continuous playback
  const totalTimelineDuration = useMemo(() => {
    const allClips = clips.filter(c => c.trackIndex === 0); // Use first track duration
    if (allClips.length === 0) return 10;
    return allClips.reduce((sum, clip) => sum + (clip.trimEnd - clip.trimStart), 0);
  }, [clips]);

  const trackOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    trackGroups.forEach((row) => {
      let offset = 0;
      row.clips.forEach((clip) => {
        offsets[clip.id] = offset;
        offset += (clip.trimEnd - clip.trimStart) * pixelsPerSecond + 8;
      });
    });
    return offsets;
  }, [trackGroups, pixelsPerSecond]);

  const activeClipOffset = useMemo(() => {
    if (!activeClip) return 0;
    return trackOffsets[activeClip.id] ?? 0;
  }, [activeClip, trackOffsets]);

  const activeClipDuration = activeClip ? Math.max(0.1, activeClip.trimEnd - activeClip.trimStart) : 0.1;
  
  // Playhead position based on global progress across entire timeline
  const playheadLeft = useMemo(() => {
    // Global progress is 0-100, representing the entire timeline
    return (globalProgress / 100) * timelineWidth;
  }, [globalProgress, timelineWidth]);

  const updateClipRange = useCallback((clipId: string, values: Partial<Pick<TimelineClip, 'trimStart' | 'trimEnd'>>) => {
    setClips((prev) => prev.map((clip) => clip.id === clipId ? {
      ...clip,
      trimStart: clamp(values.trimStart ?? clip.trimStart, 0, clip.trimEnd - 0.15),
      trimEnd: clamp(values.trimEnd ?? clip.trimEnd, clip.trimStart + 0.15, clip.duration),
    } : clip));
  }, []);

  const importVideoFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const incoming = await Promise.all(Array.from(files).map(async (file) => {
      const duration = await getVideoDuration(file);
      const preview = URL.createObjectURL(file);
      previewUrlsRef.current.push(preview);
      return {
        id: Math.random().toString(36).slice(2, 11),
        label: file.name,
        preview,
        file,  // Store original File object for API submission
        trimStart: 0,
        trimEnd: Math.max(0.1, duration),
        duration: Math.max(0.1, duration),
        trackIndex: 0,
        transition: 'fade' as TransitionType,  // Default transition for all clips
      };
    }));

    setClips((prev) => {
      const result = [...prev, ...incoming];
      return result;
    });
    setSelectedClipId(incoming[0]?.id ?? selectedClipId);
    setIsPlaying(false);
  }, [selectedClipId]);

  const moveClipToTrack = useCallback((clipId: string, trackIndex: number) => {
    setClips((prev) => {
      const moved = prev.find((clip) => clip.id === clipId);
      if (!moved) return prev;
      const without = prev.filter((clip) => clip.id !== clipId);
      return [...without, { ...moved, trackIndex }];
    });
  }, []);

  const reorderClipInTrack = useCallback((clipId: string, targetClipId: string, targetTrack: number) => {
    setClips((prev) => {
      const moved = prev.find((clip) => clip.id === clipId);
      if (!moved) return prev;
      const without = prev.filter((clip) => clip.id !== clipId);
      const destination = without.filter((clip) => clip.trackIndex === targetTrack);
      const beforeIndex = destination.findIndex((clip) => clip.id === targetClipId);
      const inserted = [...destination];
      const movedClip = { ...moved, trackIndex: targetTrack };
      if (beforeIndex === -1) {
        inserted.push(movedClip);
      } else {
        inserted.splice(beforeIndex, 0, movedClip);
      }
      return [
        ...without.filter((clip) => clip.trackIndex !== targetTrack),
        ...inserted,
      ];
    });
  }, []);

  const removeClip = useCallback((clipId: string) => {
    setClips((prev) => {
      const removedClip = prev.find((clip) => clip.id === clipId);
      if (removedClip) {
        URL.revokeObjectURL(removedClip.preview);
      }
      return prev.filter((clip) => clip.id !== clipId);
    });
    if (selectedClipId === clipId) {
      setSelectedClipId(null);
      setIsPlaying(false);
      setGlobalProgress(0);
    }
  }, [selectedClipId]);

  const setTransitionForClip = useCallback((clipId: string, transition: TransitionType) => {
    setClips((prev) => {
      const updated = prev.map((clip) => clip.id === clipId ? { ...clip, transition } : clip);
      console.log(`✅ [TIMELINE] Clip ${clipId} transition updated to: ${transition}`);
      return updated;
    });
  }, []);

  /**
   * Generate transition plan for API submission
   * Returns array of { index, transition } objects
   */
  const buildTransitionPlan = useCallback(() => {
    if (clips.length === 0) return [];
    
    // Sort clips by track index and then by position
    const sortedClips = [...clips].sort((a, b) => {
      if (a.trackIndex !== b.trackIndex) return a.trackIndex - b.trackIndex;
      const offsetA = trackOffsets[a.id] ?? 0;
      const offsetB = trackOffsets[b.id] ?? 0;
      return offsetA - offsetB;
    });

    // Build transition plan - one entry per clip
    return sortedClips.map((clip, index) => ({
      index: index,
      transition: clip.transition,
    }));
  }, [clips, trackOffsets]);

  /**
   * Export timeline for video generation
   * Collects all clips and transitions, packages them for API
   */
  const exportTimeline = useCallback(async () => {
    if (clips.length === 0) {
      console.warn("❌ No clips in timeline");
      return;
    }

    try {
      const plan = buildTransitionPlan();
      
      console.log("📤 [TIMELINE] Exporting timeline:", {
        totalClips: clips.length,
        transitions: plan,
      });

      // Sort clips for consistent ordering
      const sortedClips = [...clips].sort((a, b) => {
        if (a.trackIndex !== b.trackIndex) return a.trackIndex - b.trackIndex;
        const offsetA = trackOffsets[a.id] ?? 0;
        const offsetB = trackOffsets[b.id] ?? 0;
        return offsetA - offsetB;
      });

      console.log("📋 [TIMELINE] Sorted clips:", sortedClips.map(c => ({
        id: c.id,
        label: c.label,
        hasFile: !!c.file,
        fileName: c.file?.name,
        duration: c.duration.toFixed(2),
        trimStart: c.trimStart.toFixed(2),
        trimEnd: c.trimEnd.toFixed(2),
        transition: c.transition,
      })));

      // Create FormData with all clips
      const formData = new FormData();
      
      // Add each clip video file with trim info
      for (let i = 0; i < sortedClips.length; i++) {
        const clip = sortedClips[i];
        
        // Add actual file if available
        if (clip.file) {
          formData.append(`media`, clip.file, clip.label);
          console.log(`✅ [TIMELINE] Added file ${i}: ${clip.label} (${(clip.file.size / 1024 / 1024).toFixed(2)}MB) | Transition: ${clip.transition}`);
        } else {
          console.warn(`⚠️  [TIMELINE] Clip ${i} has no file object!`);
        }
        
        // Add metadata with transition
        formData.append(`clip_${i}_label`, clip.label);
        formData.append(`clip_${i}_transition`, clip.transition);  // Add transition per clip
        formData.append(`clip_${i}_trimStart`, String(clip.trimStart));
        formData.append(`clip_${i}_trimEnd`, String(clip.trimEnd));
        formData.append(`clip_${i}_duration`, String(clip.duration));
      }

      // Add transition plan
      console.log("📋 [TIMELINE] Transition Plan:", plan);
      formData.append("transitionPlan", JSON.stringify(plan));
      formData.append("totalClips", String(sortedClips.length));

      // Dispatch event for parent component to handle submission
      const event = new CustomEvent('timeline-ready-for-export', {
        detail: {
          formData,
          clips: sortedClips,
          transitionPlan: plan,
        }
      });
      window.dispatchEvent(event);

      console.log("✅ [TIMELINE] Timeline ready for export with", sortedClips.length, "clips");
    } catch (error) {
      console.error("❌ [TIMELINE] Export failed:", error);
    }
  }, [clips, buildTransitionPlan, trackOffsets]);

  useEffect(() => {
    if (!previewRef.current || !activeClip) return;
    const video = previewRef.current;
    const onTimeUpdate = () => {
      const current = clamp(video.currentTime, activeClip.trimStart, activeClip.trimEnd);
      const timeWithin = current - activeClip.trimStart;
      // Calculate progress based on total timeline duration
      const progressPercent = (activeClipOffset + timeWithin) / (longestTrackDuration || 1) * 100;
      setGlobalProgress(Math.min(100, progressPercent));
      
      // Stop at end of clip
      if (current >= activeClip.trimEnd - 0.05) {
        video.pause();
        setIsPlaying(false);
      }
    };
    const onSeeked = () => {
      const current = clamp(video.currentTime, activeClip.trimStart, activeClip.trimEnd);
      const timeWithin = current - activeClip.trimStart;
      const progressPercent = (activeClipOffset + timeWithin) / (longestTrackDuration || 1) * 100;
      setGlobalProgress(Math.min(100, progressPercent));
    };
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('seeked', onSeeked);
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('seeked', onSeeked);
    };
  }, [activeClip, activeClipDuration, activeClipOffset, clips, longestTrackDuration, trackOffsets]);

  useEffect(() => {
    if (!previewRef.current || !activeClip) return;
    const video = previewRef.current;
    video.currentTime = activeClip.trimStart;
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [activeClip, isPlaying]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(URL.revokeObjectURL);
      previewUrlsRef.current = [];
    };
  }, []);

  const trackControls = (
    <div className="rounded-3xl border border-white/10 bg-[#0c0f1d] p-2 text-[10px] text-slate-300">
      <div className="flex items-center justify-between mb-2 text-slate-400 uppercase tracking-wider">Zoom</div>
      <input
        type="range"
        min={0.6}
        max={2.4}
        step={0.1}
        value={zoom}
        onChange={(event) => setZoom(Number(event.target.value))}
        className="w-full accent-cyan-400"
      />
    </div>
  );

  const handleDropOnTrack = (trackIndex: number) => {
    if (!draggingClipId) return;
    moveClipToTrack(draggingClipId, trackIndex);
    setDraggingClipId(null);
  };

  return (
    <div className="flex h-full flex-col rounded-3xl bg-[#080b16] border border-white/10 shadow-2xl overflow-hidden text-slate-200">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-[#09101d] px-5 py-4">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-[0.35em] text-slate-500 font-black">Video Timeline Editor</div>
          <div className="text-sm font-semibold text-white">Professional video-only editor</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-[#030617] shadow-lg shadow-cyan-500/10 hover:bg-cyan-400 transition"
          >
            <Plus className="w-4 h-4" />
            Add Clips
          </button>
          <button
            onClick={() => setIsPlaying((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-200 hover:border-cyan-500 hover:text-cyan-300 transition"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={() => exportTimeline()}
            disabled={clips.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-200 hover:border-green-400 hover:text-green-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export timeline with all clips and transitions"
          >
            <Sparkles className="w-4 h-4" />
            Generate Video
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-slate-400">
              <Layers className="w-4 h-4 text-cyan-300" />
              {trackCount} tracks
            </div>
            {trackControls}
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0c1225] shadow-inner shadow-black/20 overflow-hidden">
            <div className="border-b border-white/10 bg-[#09101f] p-3 text-[11px] uppercase tracking-[0.28em] text-slate-400 flex items-center justify-between">
              <span>Timeline</span>
              <span>{longestTrackDuration.toFixed(1)}s width</span>
            </div>
            <div className="relative overflow-x-auto overflow-y-hidden" ref={timelineRef} style={{ width: '100%' }}>
              <div className="absolute left-0 right-0 top-0 h-10 bg-gradient-to-b from-[#09101f] to-transparent pointer-events-none" />
              <div className="relative min-w-full" style={{ width: timelineWidth }}>
                <div className="absolute inset-x-0 top-0 flex h-10 items-end px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  {Array.from({ length: Math.max(4, Math.ceil(longestTrackDuration / 5)) }, (_, index) => (
                    <div key={index} className="relative flex-1 text-center">
                      <span>{`00:00:${String(index * 5).padStart(2, '0')}`}</span>
                      <div className="absolute bottom-0 left-1/2 h-2 w-px bg-white/10" />
                    </div>
                  ))}
                </div>

                <div className="absolute inset-x-0 top-10 h-2 bg-gradient-to-b from-transparent to-white/5" />
                <div className="absolute inset-x-0 top-16 bottom-0">
                  <div className="absolute top-0 left-0 h-full w-full bg-[repeating-linear-gradient(90deg,transparent,transparent_39px,rgba(255,255,255,0.02)_40px)]" />
                </div>

                <motion.div
                  className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-40 pointer-events-none"
                  animate={{ left: playheadLeft }}
                  transition={{ type: 'tween', duration: 0.1 }}
                  style={{ transform: 'translateX(-50%)' }}
                >
                  <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.45)]" />
                </motion.div>

                <div className="space-y-3 py-3">
                  {trackGroups.map((row) => (
                    <div
                      key={row.index}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setHoveredTrack(row.index);
                      }}
                      onDragLeave={() => setHoveredTrack(null)}
                      onDrop={() => handleDropOnTrack(row.index)}
                      className={`relative min-h-[72px] rounded-3xl border px-3 py-2.5 transition ${row.index % 2 === 0 ? 'bg-[#08111f]/80' : 'bg-[#09131f]/80'} ${hoveredTrack === row.index ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-white/10'}`}
                    >
                      <div className="absolute left-4 top-4 text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black">V{row.index + 1}</div>
                      <div className="absolute inset-y-0 left-[84px] right-0 top-0 flex items-center" />
                      <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-center text-[11px] font-semibold text-slate-300">
                        <div className="space-y-1">
                          <div className="text-slate-100">Track {row.index + 1}</div>
                          <div className="text-[9px] text-slate-500">{row.clips.length} clips</div>
                        </div>
                      </div>
                      <div className="ml-24 relative h-full">
                        {row.clips.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center text-[11px] uppercase tracking-[0.3em] text-slate-500/80">
                            Drop clips here or add new video
                          </div>
                        )}
                        {row.clips.reduce<{ clip: TimelineClip; left: number }[]>((acc, clip) => {
                          const previous = acc.length ? acc[acc.length - 1].left + (acc[acc.length - 1].clip.trimEnd - acc[acc.length - 1].clip.trimStart) * pixelsPerSecond + 8 : 0;
                          acc.push({ clip, left: previous });
                          return acc;
                        }, []).map(({ clip, left }) => {
                          const clipWidth = Math.max(80, (clip.trimEnd - clip.trimStart) * pixelsPerSecond);
                          const isSelected = selectedClipId === clip.id;
                          return (
                            <motion.div
                              key={clip.id}
                              layout
                              draggable="true"
                              onDragStart={(event: any) => {
                                event.dataTransfer.setData('clipId', clip.id);
                                setDraggingClipId(clip.id);
                              }}
                              onDragEnd={() => setDraggingClipId(null)}
                              onDrop={(event: any) => {
                                event.preventDefault();
                                const draggedId = event.dataTransfer.getData('clipId');
                                if (draggedId && draggedId !== clip.id) {
                                  reorderClipInTrack(draggedId, clip.id, row.index);
                                }
                                setDraggingClipId(null);
                              }}
                              onDragOver={(event) => event.preventDefault()}
                              onDoubleClick={() => setSelectedClipId(clip.id)}
                              className={`absolute top-5 rounded-3xl border px-3 py-2 overflow-hidden shadow-xl transition-all ${isSelected ? 'border-cyan-400 bg-cyan-500/20 shadow-cyan-500/20' : 'border-white/10 bg-[#09111f]/90 hover:bg-[#111a2f] hover:border-cyan-500/20'} z-20 cursor-grab`}
                              style={{ left, width: clipWidth }}
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedClipId(clip.id);
                              }}
                            >
                              <div className="absolute inset-0 overflow-hidden rounded-3xl">
                                <video
                                  src={clip.preview}
                                  muted
                                  playsInline
                                  autoPlay
                                  loop
                                  className="absolute inset-0 h-full w-full object-cover opacity-80"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#02060f]/95 via-transparent to-transparent" />
                              </div>
                              <div className="relative z-10 flex items-center gap-2">
                                <Video className="w-3.5 h-3.5 text-cyan-200" />
                                <div className="flex-1 overflow-hidden">
                                  <div className="truncate text-[11px] font-semibold text-white">{clip.label}</div>
                                  <div className="text-[9px] text-slate-300">{(clip.trimEnd - clip.trimStart).toFixed(1)}s</div>
                                </div>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    removeClip(clip.id);
                                  }}
                                  className="rounded-full bg-black/40 p-1 text-slate-200 hover:bg-red-500/90 hover:text-white transition"
                                  title="Delete clip"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-slate-300">
                                <span className="rounded-full bg-white/5 px-2 py-1">Trim {clip.trimStart.toFixed(1)}s → {clip.trimEnd.toFixed(1)}s</span>
                                <span className="rounded-full bg-white/5 px-2 py-1">{TRANSITION_LABELS[clip.transition]}</span>
                              </div>

                              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-300">
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    updateClipRange(clip.id, { trimStart: clamp(clip.trimStart - 0.2, 0, clip.trimEnd - 0.15) });
                                  }}
                                  className="rounded-full bg-white/5 px-2 py-1 hover:bg-cyan-500/20 transition"
                                  title="Trim start earlier"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    updateClipRange(clip.id, { trimStart: clamp(clip.trimStart + 0.2, 0, clip.trimEnd - 0.15) });
                                  }}
                                  className="rounded-full bg-white/5 px-2 py-1 hover:bg-cyan-500/20 transition"
                                  title="Trim start later"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    updateClipRange(clip.id, { trimEnd: clamp(clip.trimEnd - 0.2, clip.trimStart + 0.15, clip.duration) });
                                  }}
                                  className="rounded-full bg-white/5 px-2 py-1 hover:bg-cyan-500/20 transition"
                                  title="Trim end earlier"
                                >
                                  <ArrowDownRight className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    updateClipRange(clip.id, { trimEnd: clamp(clip.trimEnd + 0.2, clip.trimStart + 0.15, clip.duration) });
                                  }}
                                  className="rounded-full bg-white/5 px-2 py-1 hover:bg-cyan-500/20 transition"
                                  title="Trim end later"
                                >
                                  <ArrowUpRight className="w-3 h-3" />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[260px] border-l border-white/10 bg-[#080b16]/95 p-3 overflow-y-auto">
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-slate-500 mb-3">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Clip Inspector
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-[#0b1321] p-4">
              <div className="text-[9px] uppercase tracking-[0.3em] text-slate-500 mb-2">Preview</div>
              <div className="rounded-3xl overflow-hidden border border-white/10 bg-black">
                {activeClip ? (
                  <video
                    ref={previewRef}
                    src={activeClip.preview}
                    muted
                    playsInline
                    className="h-32 w-full bg-black object-cover"
                  />
                ) : (
                  <div className="h-40 w-full bg-[#060b14] flex items-center justify-center text-slate-500">Select a clip to preview</div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0b1321] p-4 space-y-3">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-slate-500">
                <span>Clip details</span>
                <span>{activeClip ? `V${activeClip.trackIndex + 1}` : '-'}</span>
              </div>
              {activeClip ? (
                <div className="space-y-2 text-sm text-slate-100">
                  <div className="flex justify-between"><span className="text-slate-400">Name</span><span>{activeClip.label}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Duration</span><span>{activeClip.duration.toFixed(1)}s</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Trim</span><span>{activeClip.trimStart.toFixed(1)}s - {activeClip.trimEnd.toFixed(1)}s</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Preview</span><span>{((activeClip.trimEnd - activeClip.trimStart) || 0).toFixed(1)}s</span></div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500">Select a clip to inspect its metadata and transition settings.</div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0b1321] p-4 space-y-3">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-slate-500">
                <span>Transition</span>
                <span className="text-slate-400">Next clip</span>
              </div>
              {activeClip ? (
                <select
                  value={activeClip.transition}
                  onChange={(event) => setTransitionForClip(activeClip.id, event.target.value as TransitionType)}
                  className="w-full rounded-2xl border border-white/10 bg-[#09101f] px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-400"
                >
                  {(['none', 'fade', 'slide', 'wipe', 'crossfade'] as TransitionType[]).map((type) => (
                    <option key={type} value={type}>{TRANSITION_LABELS[type]}</option>
                  ))}
                </select>
              ) : (
                <div className="text-[11px] text-slate-500">Pick a clip to add a transition.</div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0b1321] p-4">
              <div className="text-[9px] uppercase tracking-[0.3em] text-slate-500 mb-2">How to Use</div>
              <div className="space-y-2 text-[11px] leading-5 text-slate-300">
                <p>✅ <strong>Add Clips:</strong> Click "Add Clips" button to upload video files</p>
                <p>✅ <strong>Select:</strong> Click any clip in the timeline to select it</p>
                <p>✅ <strong>Transitions:</strong> Select a clip, then choose transition (Fade, Slide, Wipe, Crossfade, None)</p>
                <p>✅ <strong>Trim:</strong> Adjust start/end points using the arrow buttons</p>
                <p>✅ <strong>Arrange:</strong> Drag clips between tracks to organize layers</p>
                <p>✅ <strong>Generate:</strong> Click "Generate Video" to create final video with transitions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={(event) => importVideoFiles(event.target.files)}
      />
    </div>
  );
}
