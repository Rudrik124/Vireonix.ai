import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoTimelineEditor } from "../../components/editor/video-timeline-editor";
import { BrandLogo } from "../../components/brand-logo";
import { buildApiUrl } from "../../../lib/api";
import { useAuth } from "../../context/auth-context";
import { LoginModal } from "../../components/login-modal";

type LoadingState = "idle" | "generating" | "processing" | "success" | "error";

export function TimelineEditorPage() {
  const navigate = useNavigate();
  const { isLoggedIn, session } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false); // Changed: skip login for testing
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Commented out for testing - allow access without login
    // if (!isLoggedIn) {
    //   setIsLoginOpen(true);
    // }
  }, [isLoggedIn]);

  useEffect(() => {
    /**
     * Handle timeline export event with clip data and transitions
     */
    const handleTimelineExport = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { formData, clips, transitionPlan } = customEvent.detail;

      if (!formData || !clips || !transitionPlan) {
        console.error("❌ Invalid timeline export data");
        setErrorMessage("Invalid timeline data");
        return;
      }

      // Commented out for testing - allow export without login
      // if (!isLoggedIn) {
      //   setIsLoginOpen(true);
      //   return;
      // }

      try {
        setLoadingState("generating");
        setLoadingMessage("Preparing video clips...");

        console.log("📤 [TIMELINE-PAGE] Submitting timeline to API:", {
          totalClips: clips.length,
          transitions: transitionPlan,
          clipDetails: clips.map(c => ({
            id: c.id,
            label: c.label,
            duration: c.duration,
            trimStart: c.trimStart,
            trimEnd: c.trimEnd,
            hasFile: !!c.file,
          })),
        });

        // Add additional form fields expected by API
        formData.append("prompt", "Video created with timeline editor");
        formData.append("duration", "30");
        formData.append("quickEditMode", "true");  // Enable multi-clip processing
        
        // Build media and trim information for server
        const mediaItems = clips.map((clip, index) => ({
          id: clip.id,
          index: index,
          label: clip.label,
        }));
        
        const trimRanges: Record<string, { start: number; end: number }> = {};
        clips.forEach((clip) => {
          trimRanges[clip.id] = {
            start: clip.trimStart,
            end: clip.trimEnd,
          };
        });

        const editorSelections = {
          media: {
            items: mediaItems,
          },
          trim: {
            clipRanges: trimRanges,
          },
          transitions: {
            transitionPlan: transitionPlan,
          },
        };

        formData.append("editorSelections", JSON.stringify(editorSelections));

        console.log("📋 [TIMELINE-PAGE] EditorSelections:", editorSelections);
        console.log("📋 [TIMELINE-PAGE] FormData entries:", Array.from(formData.entries()).map(([key, value]) => ({
          key,
          type: value instanceof File ? `File: ${value.name}` : typeof value,
          size: value instanceof File ? `${(value.size / 1024 / 1024).toFixed(2)}MB` : String(value).substring(0, 50),
        })));

        setLoadingMessage("Processing video generation...");

        // Submit to API
        const response = await fetch(buildApiUrl("/api/generate-from-media"), {
          method: "POST",
          body: formData,
          headers: {
            "Authorization": `Bearer ${session?.access_token || ""}`,
          },
        });

        console.log("📡 [TIMELINE-PAGE] API Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("✅ [TIMELINE-PAGE] Video generated successfully:", data);

        setLoadingMessage("Finalizing...");
        setLoadingState("success");

        // Auto-download or show result
        if (data.downloadUrl) {
          setVideoUrl(data.downloadUrl);
          setTimeout(() => {
            window.open(data.downloadUrl, "_blank");
          }, 1000);
        }

        setTimeout(() => {
          setLoadingState("idle");
        }, 2000);
      } catch (error) {
        console.error("❌ [TIMELINE-PAGE] Timeline export failed:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        setErrorMessage(`Failed to generate video: ${message}`);
        setLoadingState("error");
      }
    };

    window.addEventListener("timeline-ready-for-export", handleTimelineExport);
    return () => {
      window.removeEventListener("timeline-ready-for-export", handleTimelineExport);
    };
  }, [isLoggedIn, session]);

  // Commented out for testing - allow access without login
  // if (!isLoggedIn) {
  //   return (
  //     <>
  //       <div className="min-h-screen bg-slate-950 flex items-center justify-center">
  //         <div className="text-center">
  //           <BrandLogo />
  //           <p className="text-slate-400 mt-4">Please log in to use the timeline editor</p>
  //         </div>
  //       </div>
  //       <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
  //     </>
  //   );
  // }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a0d1a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/5 rounded-lg transition"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">Timeline Editor</h1>
              <p className="text-xs text-slate-500">Arrange clips and set transitions</p>
            </div>
          </div>
          <BrandLogo />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <VideoTimelineEditor />
      </div>

      {/* Loading/Status Overlay */}
      <AnimatePresence>
        {loadingState !== "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]"
            onClick={() => loadingState === "error" && setLoadingState("idle")}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 text-center"
            >
              {loadingState === "generating" && (
                <>
                  <div className="flex justify-center mb-4">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Generating Video</h3>
                  <p className="text-sm text-slate-400">{loadingMessage}</p>
                </>
              )}

              {loadingState === "success" && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-2xl">✓</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Success!</h3>
                  <p className="text-sm text-slate-400">Your video has been generated and will download automatically.</p>
                </>
              )}

              {loadingState === "error" && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <span className="text-2xl">✕</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Error</h3>
                  <p className="text-sm text-slate-400">{errorMessage}</p>
                  <button
                    onClick={() => setLoadingState("idle")}
                    className="mt-4 px-4 py-2 bg-purple-500 text-slate-950 rounded-lg font-bold hover:bg-purple-400 transition"
                  >
                    Close
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
