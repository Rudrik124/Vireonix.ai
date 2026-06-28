import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { ArrowLeft, Download, RefreshCcw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { BrandLogo } from "../../components/brand-logo";

export function ReferenceVideoResultScreen() {
  const navigate = useNavigate();

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
    link.download = "reference-video.mp4";
    link.click();
  };

  return (
    <div
      className="min-h-[100dvh] relative overflow-hidden font-sans selection:bg-purple-500/30 selection:text-white pb-20"
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

      <div className="container mx-auto px-4 py-12 max-w-4xl relative z-10">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1b2e]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgba(11,13,31,0.5)] border border-[#3f4a67]/50 p-6 md:p-8"
        >
          <h1 className="text-3xl md:text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-fuchsia-300 drop-shadow-[0_2px_10px_rgba(168, 85, 247,0.2)]">
            Reference Video Generated
          </h1>
          <p className="text-[#94a3b8] mb-4 font-medium">Your generated video is ready for preview and export.</p>

          {storagePath && (
            <p className="text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 inline-block shadow-md mb-6">
              Saved to Supabase: {storagePath}
            </p>
          )}

          {/* Video Container */}
          <div className="relative bg-[#1a1b2e]/40 rounded-2xl border border-[#3f4a67]/50 shadow-inner overflow-hidden mb-8 p-2">
            {videoUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-[#3f4a67]/50 bg-[#0B1020]">
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  className="w-full relative z-10"
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
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleDownload}
              className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-400 hover:opacity-90 text-[#0B1020] shadow-[0_0_20px_rgba(168, 85, 247,0.3)] hover:shadow-[0_0_30px_rgba(168, 85, 247,0.5)] transition-all rounded-xl border border-purple-300/40"
            >
              <Download className="w-5 h-5 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/reference-video/setup")}
              className="h-14 px-8 border border-[#3f4a67] hover:border-purple-400/50 hover:bg-purple-500/10 hover:text-purple-300 text-[#cbd5e1] rounded-xl font-semibold transition-all bg-[#0B1020]/40"
            >
              <RefreshCcw className="w-5 h-5 mr-2" />
              Generate Again
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
