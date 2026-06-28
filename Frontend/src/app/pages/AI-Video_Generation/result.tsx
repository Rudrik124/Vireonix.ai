import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Download, Sparkles, Share2, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { BrandLogo } from "../../components/brand-logo";

export function ResultPage() {
  const navigate = useNavigate();

  // ✅ GET VIDEO FROM BACKEND
  const videoUrl = localStorage.getItem("generatedVideo");
  const storagePath = localStorage.getItem("generatedVideoStorage");
  const generationError = localStorage.getItem("generatedVideoError");

  const handleDownload = () => {
    if (!videoUrl) {
      alert("No video available");
      return;
    }

    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = "generated-video.mp4";
    link.click();
  };

  const handleShare = () => {
    if (!videoUrl) {
      alert("No video available");
      return;
    }

    navigator.clipboard.writeText(videoUrl);
    alert("Video link copied!");
  };

  return (
    <div 
      className="min-h-[100dvh] relative overflow-hidden font-sans selection:bg-purple-500/30 selection:text-white pb-20 text-slate-200"
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

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl relative z-10">
        
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
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <BrandLogo size={48} className="relative z-10" />
              </div>
              <span className="text-xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(168, 85, 247,0.3)]">
                VEYTRIX<span className="text-purple-400">.AI</span>
              </span>
            </div>

            <div className="h-6 w-[1px] bg-white/10" />

            <button
              onClick={() => navigate("/features")}
              className="flex items-center gap-2 text-[#94a3b8] hover:text-purple-400 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-bold uppercase tracking-widest">Back</span>
            </button>
          </motion.div>
        </div>
        {/* Success Message */}
        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 px-6 py-2.5 rounded-full border border-emerald-500/20 mb-6 shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <span className="text-sm font-semibold text-emerald-300 tracking-wide uppercase font-sans tracking-[0.1em]">Video ready!</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-fuchsia-300 drop-shadow-[0_2px_10px_rgba(168, 85, 247,0.2)]">
            Your Video is Ready
          </h1>

          {storagePath && (
            <p className="text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 inline-block shadow-md">
              Saved to Supabase: {storagePath}
            </p>
          )}
        </motion.div>

        {/* 🎥 VIDEO PLAYER */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.1 }}
           className="w-full bg-[#1a1b2e]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgba(11,13,31,0.5)] border border-[#3f4a67]/50 p-6 md:p-8 overflow-hidden relative"
        >
          {videoUrl ? (
            <div className="w-full aspect-video overflow-hidden rounded-xl border border-[#3f4a67]/50 shadow-inner bg-black relative">
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-full object-cover relative z-10"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-500/5 mix-blend-overlay pointer-events-none z-20" />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#94a3b8] font-medium text-lg">No video found</p>
              {generationError && (
                <p className="text-sm font-semibold text-red-400 mt-4 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl inline-block shadow-md">{generationError}</p>
              )}
            </div>
          )}
        </motion.div>

        {/* ACTION BUTTONS */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="flex flex-col sm:flex-row gap-4 mb-10 justify-center max-w-2xl mx-auto"
        >
          <Button
            onClick={handleDownload}
             className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-400 hover:opacity-90 text-[#0B1020] shadow-[0_0_20px_rgba(168, 85, 247,0.3)] hover:shadow-[0_0_30px_rgba(168, 85, 247,0.5)] transition-all rounded-xl border border-purple-300/40"
          >
            <Download className="w-5 h-5 mr-2" />
            Download
          </Button>

          <Button
            onClick={handleShare}
            variant="outline"
             className="flex-1 h-14 border border-[#3f4a67] hover:border-purple-400/50 hover:bg-purple-500/10 hover:text-purple-300 text-[#cbd5e1] rounded-xl font-semibold transition-all bg-[#0B1020]/40 shadow-md"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share
          </Button>
        </motion.div>

        {/* BACK BUTTON */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.3 }}
           className="text-center"
        >
          <Button 
            onClick={() => navigate("/features")}
            variant="outline"
            className="h-14 px-8 border border-[#3f4a67] hover:border-purple-400/50 hover:bg-purple-500/10 hover:text-purple-300 text-[#cbd5e1] rounded-xl font-semibold transition-all bg-[#1a1b2e]/60 backdrop-blur-xl shadow-lg"
          >
            <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
            Create Another Video
          </Button>
        </motion.div>
      </div>
    </div>
  );
}