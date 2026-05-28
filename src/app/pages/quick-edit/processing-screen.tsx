import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router";
import {
  Zap, 
  Activity, 
  Loader2, 
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  RefreshCcw,
  X
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { buildApiUrl } from "../../../lib/api";
import { buildVideoApiError, parseVideoApiResponse } from "../../../lib/video-response";

export function QuickEditProcessingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const editConfig = location.state as any;
  
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isCanceled, setIsCanceled] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const processingStarted = useRef(false);

  const steps = [
    "Analyzing video sequence",
    "Detecting silences & jump-cuts",
    "Synthesizing smart captions",
    "Applying chosen style profile",
    "Final AI encoding"
  ];

  useEffect(() => {
    // If we land here without state, go back
    if (!editConfig) {
      navigate("/quick-edit/upload");
      return;
    }

    if (processingStarted.current || isCanceled) return;
    processingStarted.current = true;

    // Fake progress for visual smoothness
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) return 98;
        return prev + 1;
      });
    }, 120);

    const stepTimer = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2500);

    const runProcessing = async () => {
      try {
        const mediaItems = Array.isArray(editConfig.mediaItems) ? editConfig.mediaItems : [];
        const audioTracks = Array.isArray(editConfig.audioTracks) ? editConfig.audioTracks : [];

        if (mediaItems.length === 0) {
          setError("No media found for Quick Edit. Please upload media and try again.");
          return;
        }

        // Construct a logical prompt for the backend AI
        let aiPrompt = `[QuickAI Mode] Style: ${editConfig.selectedStyle}. `;
        if (editConfig.prompt) aiPrompt += `User Instructions: ${editConfig.prompt}. `;

        if (editConfig.selectedEffect && editConfig.selectedEffect !== "none") {
          aiPrompt += `Apply video effect: ${editConfig.selectedEffect}. `;
        }
        
        // Add specific modifiers based on toggles
        if (editConfig.aiOptions.subtitles) aiPrompt += "Include dynamic subtitles/captions. ";
        if (editConfig.aiOptions.autoCuts) aiPrompt += "Apply smart cuts to remove long pauses. ";
        if (editConfig.aiOptions.faceTracking) aiPrompt += "Focus on facial expressions and tracking. ";

        const formData = new FormData();
        formData.append("prompt", aiPrompt);
        formData.append("duration", "10");
        formData.append("frame", editConfig.aspectRatio || "16:9");
        formData.append("selectedEffect", editConfig.selectedEffect || "none");
        formData.append(
          "selectedFilter",
          editConfig.selectedFilter || editConfig.editorSelections?.filters?.selected || "none",
        );
        formData.append("effectSettings", JSON.stringify(editConfig.effectSettings || {}));
        formData.append("transitionPlan", JSON.stringify(editConfig.transitionPlan || []));
        formData.append("editorSelections", JSON.stringify(editConfig.editorSelections || {}));
        formData.append(
          "speedValue",
          String(editConfig.editorSelections?.speed?.value ?? 1),
        );
        formData.append(
          "trimEnabled",
          String(Boolean(editConfig.editorSelections?.trim?.enabled)),
        );
        formData.append(
          "trimStart",
          String(editConfig.editorSelections?.trim?.start ?? 0),
        );
        formData.append(
          "trimEnd",
          editConfig.editorSelections?.trim?.end == null
            ? ""
            : String(editConfig.editorSelections.trim.end),
        );
        formData.append(
          "trimClipRanges",
          JSON.stringify(editConfig.editorSelections?.trim?.clipRanges || {}),
        );
        formData.append(
          "rotateDegrees",
          String(editConfig.editorSelections?.rotate?.degrees ?? 0),
        );
        formData.append(
          "volumeMuted",
          String(Boolean(editConfig.editorSelections?.volume?.muted)),
        );
        formData.append(
          "volumeLevel",
          String(editConfig.editorSelections?.volume?.level ?? 1),
        );
        formData.append(
          "zoomEnabled",
          String(Boolean(editConfig.editorSelections?.zoom?.enabled)),
        );
        formData.append(
          "zoomAmount",
          String(editConfig.editorSelections?.zoom?.amount ?? 1),
        );
        formData.append(
          "cropEnabled",
          String(Boolean(editConfig.editorSelections?.crop?.enabled)),
        );
        formData.append(
          "cropCenterX",
          String(editConfig.editorSelections?.crop?.centerX ?? 50),
        );
        formData.append(
          "cropCenterY",
          String(editConfig.editorSelections?.crop?.centerY ?? 50),
        );
        formData.append(
          "cropWidthPct",
          String(editConfig.editorSelections?.crop?.widthPct ?? 100),
        );
        formData.append(
          "cropHeightPct",
          String(editConfig.editorSelections?.crop?.heightPct ?? 100),
        );
        formData.append(
          "keyframeEnabled",
          String(Boolean(editConfig.editorSelections?.keyframe?.enabled)),
        );
        formData.append(
          "keyframeMode",
          String(editConfig.editorSelections?.keyframe?.mode ?? "none"),
        );
        formData.append(
          "keyframeAmount",
          String(editConfig.editorSelections?.keyframe?.amount ?? 1.25),
        );
        formData.append("quickEditMode", "true");
        formData.append("tool", "quick-edit");
        formData.append("flow", "quick-edit");

        mediaItems.forEach((item: any) => {
          if (item?.file instanceof File) {
            formData.append("media", item.file, item.file.name || "media-file");
          }
        });

        const firstAudioWithFile = audioTracks.find((track: any) => track?.file instanceof File);
        if (firstAudioWithFile?.file) {
          formData.append("audio", firstAudioWithFile.file, firstAudioWithFile.file.name || "audio-file");
        }

        const controller = new AbortController();
        const timeoutMs = 180000; // 3 minutes
        const timeoutHandle = window.setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(buildApiUrl("/api/generate-from-media"), {
          method: "POST",
          body: formData,
          headers: {
            "x-vireonix-flow": "quick-edit",
          },
          signal: controller.signal,
        });

        window.clearTimeout(timeoutHandle);

        const { data, rawBody, video, message } = await parseVideoApiResponse(response);
        const errorMessage = buildVideoApiError({ response, data, rawBody, message, video });

        if (errorMessage) {
          throw new Error(errorMessage);
        }
        
        if (data.success && !isCanceled) {
          let finalVideo = video;

          // Merge music if selected
          if (editConfig?.selectedMusic) {
            try {
              setCurrentStep(4);
              const musicData = editConfig.selectedMusic;
              const mergeFormData = new FormData();
              
              // Add video file
              const videoBlob = await fetch(video).then(r => r.blob());
              mergeFormData.append("videoFile", videoBlob, "video.mp4");
              
              // Add music URL or file
              if (musicData.source === 'device' && musicData.file) {
                mergeFormData.append("musicFile", musicData.file);
              } else if (musicData.url) {
                mergeFormData.append("musicUrl", musicData.url);
              }
              
              // Add audio settings
              mergeFormData.append("volume", String(musicData.volume || 80));
              mergeFormData.append("startTime", String(musicData.startTime || 0));
              mergeFormData.append("endTime", String(musicData.endTime || musicData.duration || 30));
              mergeFormData.append("muteOriginal", String(musicData.muteOriginal || false));

              const mergeResponse = await fetch(buildApiUrl("/api/merge-audio"), {
                method: "POST",
                body: mergeFormData,
                signal: controller.signal,
              });

              if (mergeResponse.ok) {
                const mergeBlob = await mergeResponse.blob();
                finalVideo = URL.createObjectURL(mergeBlob);
              }
            } catch (musicErr) {
              console.error("Music merge failed, continuing with original video:", musicErr);
            }
          }

          // Persist quick-edit outputs so result screen still works after refresh/navigation.
          localStorage.setItem("quickEditGeneratedVideo", finalVideo);
          localStorage.setItem("quickEditConfig", JSON.stringify(editConfig || {}));
          localStorage.setItem(
            "quickEditMetrics",
            JSON.stringify({
              editTime: "4.2s",
              sceneCuts: editConfig.aiOptions.autoCuts ? "12 Smart Cuts" : "0 Cuts",
              res: editConfig.exportQuality || "1080p",
            }),
          );

          setProgress(100);
          setCurrentStep(steps.length - 1);
          
          // Small delay for the "100%" to be seen
          setTimeout(() => {
            navigate("/quick-edit/result", { 
              state: { 
                videoUrl: finalVideo, 
                config: editConfig,
                metrics: {
                  editTime: "4.2s",
                  sceneCuts: editConfig.aiOptions.autoCuts ? "12 Smart Cuts" : "0 Cuts",
                  res: editConfig.exportQuality || "1080p"
                }
              } 
            });
          }, 1200);
        } else if (!isCanceled) {
          setError(typeof data.error === "string" ? data.error : "The AI encountered an error while processing your request.");
        }
      } catch (err: any) {
        if (!isCanceled) {
          if (err?.name === "AbortError") {
            setError("Processing timed out. Try again with fewer clips/effects or retry once.");
          } else {
            setError(err?.message || "Connection lost. Please ensure the local Studio Engine is running.");
          }
        }
      }
    };

    runProcessing();

    return () => {
      clearInterval(timer);
      clearInterval(stepTimer);
    };
  }, [editConfig, navigate, isCanceled, retryToken]);

  const handleCancel = () => {
    setIsCanceled(true);
    navigate("/quick-edit/style", { state: editConfig });
  };

  const handleRetry = () => {
    setError(null);
    processingStarted.current = false;
    setProgress(0);
    setCurrentStep(0);
    setRetryToken((prev) => prev + 1);
  };

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0b0d1f] text-slate-200 p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-red-500/5 border border-red-500/20 rounded-3xl p-10 text-center space-y-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-black uppercase tracking-widest text-red-100">Workflow Interrupted</h2>
            <p className="text-xs text-red-200/60 font-medium leading-relaxed uppercase tracking-tighter">
              {error}
            </p>
          </div>
          <div className="flex flex-col gap-3">
             <Button onClick={handleRetry} className="bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl h-12">
                <RefreshCcw className="w-4 h-4 mr-2" /> Try Again
             </Button>
             <Button onClick={handleCancel} variant="ghost" className="text-slate-500 hover:text-white font-bold uppercase text-[10px] tracking-widest">
                Return to Studio
             </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-full flex flex-col overflow-hidden font-sans text-slate-200"
      style={{
        background: 'linear-gradient(135deg, #0b0d1f 0%, #1a1b2e 30%, #2d3142 60%, #3f4a67 85%, #1a1b2e 100%)',
      }}
    >
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 500px rgba(11,13,31,0.95)' }} />
      </div>

      {/* Header */}
      <header className="h-16 flex-none border-b border-white/10 flex items-center justify-between px-6 bg-black/20 backdrop-blur-3xl z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleCancel}
            className="p-2 text-slate-600 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="h-8 w-[1px] bg-white/10 mx-2" />
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-white uppercase tracking-[0.1em]">Quick Edit <span className="text-cyan-400">Studio</span></h1>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
               <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Processing Node #84</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main View */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 p-8">
        
        <div className="max-w-4xl w-full flex flex-col gap-10">
          
          <div className="relative group p-[2px] rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20">
            <div className="relative bg-[#0b0d1f]/60 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden p-10 flex flex-col items-center text-center gap-8">
                
                <div className="relative h-32 w-32">
                   <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-0 rounded-full border border-dashed border-cyan-500/30"
                   />
                   <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                           <Zap className="w-8 h-8 text-[#0b0d1f]" fill="currentColor" />
                        </div>
                   </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-white uppercase tracking-widest">
                    {progress === 100 ? "Optimization Complete" : "Initializing Quick-Edit"}
                  </h2>
                  <p className="text-sm text-[#94a3b8] font-medium max-w-md italic tracking-tight">
                    {progress === 100 
                      ? "Assets have been synthesized and are ready for delivery."
                      : "AI is currently analyzing your footage for silences, face-tracks, and optimal subtitle placement."}
                  </p>
                </div>

                <div className="w-full max-w-md space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                      <span>{progress === 100 ? "Pipeline Finalized" : "AI Progress"}</span>
                      <span className="text-cyan-400">{progress}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                   </div>
                </div>

            </div>
          </div>

          {/* Execution Pipeline */}
          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-3">
                {steps.map((step, idx) => (
                  <motion.div 
                    key={idx}
                    animate={{ 
                      opacity: idx <= currentStep ? 1 : 0.2,
                      x: idx === currentStep ? 5 : 0
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      idx === currentStep ? 'bg-cyan-500/5 border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'border-white/5 bg-transparent'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-none">
                      {idx < currentStep || progress === 100 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : idx === currentStep ? (
                        <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest transition-colors">{step}</span>
                  </motion.div>
                ))}
             </div>

             <div className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                <div className="space-y-4">
                   <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node Analytics</span>
                   </div>
                   <div className="space-y-4">
                      {[
                        { label: 'Compute Speed', val: '0.4s / frame', p: 92 },
                        { label: 'Analysis Depth', val: 'Advanced', p: 100 },
                        { label: 'AI Buffer', val: 'Optimized', p: 88 },
                      ].map((t) => (
                        <div key={t.label} className="space-y-1.5">
                           <div className="flex items-center justify-between text-[8px] font-black uppercase">
                              <span className="text-slate-600">{t.label}</span>
                              <span className="text-slate-300">{t.val}</span>
                           </div>
                           <div className="h-0.5 w-full bg-white/5 rounded-full">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${t.p}%` }} className="h-full bg-white/20" />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                   <span className="text-[8px] font-mono text-cyan-500/40 uppercase">ENV_MODE: Studio_Accel</span>
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">System Stable</span>
                   </div>
                </div>
             </div>
          </div>

        </div>

      </main>

      <footer className="h-12 border-t border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-center px-8 z-20">
         <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{progress === 100 ? "Ready for delivery" : "AI is working its magic..."}</span>
         </div>
      </footer>

    </div>
  );
}
