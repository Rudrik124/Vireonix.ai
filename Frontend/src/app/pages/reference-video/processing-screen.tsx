import { useEffect } from "react";
import { motion } from "motion/react";
import { useLocation, useNavigate } from "react-router";
import { Film, Wand2 } from "lucide-react";
import { buildApiUrl } from "../../../lib/api";
import { buildVideoApiError, parseVideoApiResponse } from "../../../lib/video-response";
import { usePortalTestingContext } from "../../../shared/portal/testing-context";
import { buildPortalRequestHeaders } from "../../../lib/request-context";

type ReferenceVideoConfig = {
  prompt: string;
  duration: number;
  aspectRatio: string;
  referenceVideo: File | null;
  mediaFiles?: File[];
  audioFile?: File | null;
};

export function ReferenceVideoProcessingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usageContext } = usePortalTestingContext();
  const state = location.state as ReferenceVideoConfig | undefined;

  useEffect(() => {
    // If user refreshed or came directly here, send them back to setup
    if (!state || !state.prompt || !state.referenceVideo) {
      navigate("/reference-video/setup", { replace: true });
      return;
    }

    let cancelled = false;

    const generate = async () => {
      try {
        const formData = new FormData();
        formData.append("prompt", state.prompt.trim());
        formData.append("duration", String(state.duration || 0));
        formData.append("frame", state.aspectRatio || "16:9");

        // Primary reference video
        if (state.referenceVideo) {
          formData.append("media", state.referenceVideo);
        }

        // Optional extra media assets
        if (state.mediaFiles && state.mediaFiles.length) {
          state.mediaFiles.forEach((file) => {
            formData.append("media", file);
          });
        }

        // Optional audio
        if (state.audioFile) {
          formData.append("audio", state.audioFile);
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

        localStorage.setItem("generatedVideo", video);
        localStorage.removeItem("generatedVideoError");
        if (data.storage) {
          localStorage.setItem("generatedVideoStorage", data.storage);
        } else {
          localStorage.removeItem("generatedVideoStorage");
        }

        if (!cancelled) {
          navigate("/reference-video/result", { replace: true });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected generation error.";
        localStorage.removeItem("generatedVideo");
        localStorage.setItem("generatedVideoError", message);

        if (!cancelled) {
          navigate("/reference-video/result", { replace: true });
        }
      }
    };

    generate();

    return () => {
      cancelled = true;
    };
  }, [navigate, state]);

  return (
    <div
      className="min-h-[100dvh] relative overflow-hidden font-sans selection:bg-purple-500/30 selection:text-white flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0B1020 0%, #1a1b2e 30%, #2d3142 60%, #3f4a67 85%, #1a1b2e 100%)',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Corner Vignettes */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ boxShadow: 'inset 0 0 500px rgba(11,13,31,0.95)' }}
      />
      <div className="container mx-auto px-4 max-w-2xl relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#1a1b2e]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgba(11,13,31,0.5)] border border-[#3f4a67]/50 p-12 text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(168, 85, 247,0.5)] border border-purple-300/30"
          >
            <Film className="w-12 h-12 text-[#0B1020]" fill="currentColor" />
          </motion.div>

          <h2 className="text-3xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-fuchsia-300 drop-shadow-[0_2px_10px_rgba(168, 85, 247,0.2)]">
            Generating with Reference
          </h2>
          <p className="text-[#94a3b8] mb-8 font-medium">
            Building scenes from your reference video, prompt, assets, and audio.
          </p>

          <div className="mt-8 space-y-3 text-left max-w-md mx-auto">
            {["Reading reference video", "Composing prompt-driven shots", "Applying frame ratio", "Rendering final output"].map(
              (step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.25 }}
                  className="flex items-center gap-3 text-sm font-semibold text-purple-100"
                >
                  <Wand2 className="w-4 h-4 text-purple-400 drop-shadow-[0_0_5px_rgba(168, 85, 247,0.5)]" />
                  <span>{step}</span>
                </motion.div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
