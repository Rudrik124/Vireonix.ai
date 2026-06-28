import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Loader2, Video } from "lucide-react";
import { Progress } from "../../components/ui/progress";

const statusMessages = [
  "Analyzing clips",
  "Detecting scenes",
  "Applying AI enhancements",
  "Generating transitions",
  "Syncing audio",
  "Color grading",
  "Applying effects",
  "Rendering final video",
];

export function ProcessingPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState(statusMessages[0]);
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => navigate("/result"), 500);
          return 100;
        }
        return prev + 1;
      });
    }, 80);

    return () => clearInterval(progressInterval);
  }, [navigate]);

  useEffect(() => {
    // Update status message based on progress
    const newIndex = Math.min(
      Math.floor((progress / 100) * statusMessages.length),
      statusMessages.length - 1
    );
    if (newIndex !== statusIndex) {
      setStatusIndex(newIndex);
      setCurrentStatus(statusMessages[newIndex]);
    }
  }, [progress, statusIndex]);

  return (
    <div 
      className="min-h-[100dvh] relative overflow-hidden font-sans selection:bg-purple-500/30 selection:text-white flex items-center justify-center pb-20"
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
           transition={{ duration: 0.5 }}
           className="bg-[#1a1b2e]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgba(11,13,31,0.5)] border border-[#3f4a67]/50 p-8 md:p-12"
        >
          {/* Animated Icon */}
          <div className="flex justify-center mb-8">
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(168, 85, 247,0.5)] border border-purple-300/30"
            >
              <Video className="w-10 h-10 text-[#0B1020]" fill="currentColor" />
            </motion.div>
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-fuchsia-300 drop-shadow-[0_2px_10px_rgba(168, 85, 247,0.2)]">
            Creating Your Video
          </h2>

          {/* Status Message */}
          <motion.div
             key={currentStatus}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.3 }}
             className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-900/30 rounded-full border border-purple-500/20 shadow-inner">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              <span className="text-sm font-semibold text-purple-50">{currentStatus}</span>
            </div>
          </motion.div>

          {/* Progress Bar */}
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-purple-500/20 blur-md rounded-full" />
            <Progress value={progress} className="h-3 bg-[#0B1020]/50 border border-[#3f4a67]/50 relative z-10 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-fuchsia-400" />
          </div>

          {/* Progress Percentage */}
          <div className="text-center">
            <motion.span
              key={progress}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-500 drop-shadow-[0_0_15px_rgba(168, 85, 247,0.4)]"
            >
              {progress}%
            </motion.span>
          </div>

          {/* Info Text */}
          <p className="text-center text-[#94a3b8] font-medium mt-6 text-sm">
            This usually takes 30-60 seconds. Please don't close this window.
          </p>

          {/* Animated Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168, 85, 247,0.8)]"
              />
            ))}
          </div>
        </motion.div>

        {/* Status Timeline */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, delay: 0.3 }}
           className="mt-8 bg-[#1a1b2e]/40 backdrop-blur-md rounded-xl p-6 border border-[#3f4a67]/50 shadow-lg"
        >
          <div className="space-y-3">
            {statusMessages.map((status, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 text-sm font-semibold transition-all duration-300 ${index <= statusIndex ? "text-purple-50" : "text-[#64748b]"
                  }`}
              >
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${index < statusIndex
                      ? "bg-fuchsia-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]"
                      : index === statusIndex
                        ? "bg-purple-400 shadow-[0_0_10px_rgba(168, 85, 247,0.9)] animate-pulse"
                        : "bg-[#3f4a67]"
                    }`}
                />
                <span>{status}</span>
                {index < statusIndex && (
                  <span className="ml-auto text-fuchsia-400 text-xs drop-shadow-[0_0_5px_rgba(45,212,191,0.5)]">✓</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
