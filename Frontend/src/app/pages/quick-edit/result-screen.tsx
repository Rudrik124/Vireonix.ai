import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { buildApiUrl } from "../../../lib/api";
import { 
  ArrowLeft, 
  Download, 
  RefreshCcw, 
  Video, 
  Share2, 
  Sparkles, 
  CheckCircle2, 
  Files, 
  ShieldCheck,
  Zap,
  Youtube,
  Instagram,
  Smartphone
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { BrandLogo } from "../../components/brand-logo";

export function QuickEditResultScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state as any) || {};
  const persistedVideoUrl = localStorage.getItem("quickEditGeneratedVideo") || "";
  const persistedConfigRaw = localStorage.getItem("quickEditConfig");
  const persistedMetricsRaw = localStorage.getItem("quickEditMetrics");

  const persistedConfig = persistedConfigRaw ? JSON.parse(persistedConfigRaw) : {};
  const persistedMetrics = persistedMetricsRaw ? JSON.parse(persistedMetricsRaw) : {};

  const videoUrl = routeState.videoUrl || persistedVideoUrl;
  const config = routeState.config || persistedConfig;
  const metrics = routeState.metrics || persistedMetrics;

  // If no video was passed, we shouldn't be here
  if (!videoUrl) {
    useEffect(() => {
      navigate("/quick-edit/upload");
    }, [navigate]);
    return null;
  }

  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!videoUrl) return;

    setDownloadStatus("Saving locally to D:\\drive…");
    try {
      // 1. Try to download to local D:/drive folder via backend
      const localResponse = await fetch(buildApiUrl("/api/download-to-local"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl }),
      });

      const localData = await localResponse.json();
      if (localResponse.ok && localData.success) {
        setDownloadStatus(`✅ Video saved successfully to D:\\drive!`);
      } else {
        console.warn("Local copy to D:/drive failed:", localData.error);
        setDownloadStatus(`⚠️ Local save failed: ${localData.error || 'Check server logs'}`);
      }
    } catch (e: any) {
      console.warn("Local copy to D:/drive failed:", e.message);
      setDownloadStatus("⚠️ Local save failed. Triggering browser download…");
    }

    // 2. Trigger standard browser download
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Unable to download video (${response.status})`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quick_ai_edit_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Browser download failed", error);
      window.open(videoUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleReEdit = () => {
    // Go back to the style screen with the original config so the user doesn't lose their settings
    navigate("/quick-edit/style", { state: config });
  };

  return (
    <div 
      className="h-[100dvh] w-full flex flex-col overflow-hidden font-sans text-slate-200"
      style={{
        background: 'linear-gradient(135deg, #0B1020 0%, #1a1b2e 30%, #2d3142 60%, #3f4a67 85%, #1a1b2e 100%)',
      }}
    >
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 500px rgba(11,13,31,0.95)' }} />
      </div>

      <header className="h-16 flex-none border-b border-white/10 flex items-center justify-between px-6 bg-black/20 backdrop-blur-3xl z-20">
        <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => window.location.reload()}
            >
              <div className="relative">
                {/* Theme Background Glow */}
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <BrandLogo size={32} className="relative z-10" />
              </div>
            </div>
          <div className="h-8 w-[1px] bg-white/10 mx-2" />
          <button 
            onClick={() => navigate("/features")}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-4 w-[1px] bg-white/10 mx-2" />
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-white uppercase tracking-[0.1em]">Quick Edit <span className="text-purple-400">Studio</span></h1>
            <div className="flex items-center gap-2">
               <ShieldCheck className="w-3 h-3 text-emerald-500" />
               <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Optimized & Rendered</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300 hover:bg-white/10 flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5" />
              Share Link
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative z-10">
        
        {/* Left Export Specs */}
        <aside className="w-full md:w-80 flex-none border-b md:border-b-0 md:border-r border-white/10 bg-[#0B1020]/40 backdrop-blur-3xl p-6 md:p-8 flex flex-col gap-8 overflow-y-auto">
           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Quick Metrics</label>
              <div className="space-y-3">
                 {[
                   { label: 'Edit Time', val: metrics?.editTime || '4.2 seconds', icon: Zap },
                   { label: 'Scene Cuts', val: metrics?.sceneCuts || '12 Smart Cuts', icon: Video },
                   { label: 'Resolution', val: metrics?.res || 'Full HD 1080p', icon: Files },
                 ].map((detail) => (
                   <div key={detail.label} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                      <detail.icon className="w-4 h-4 text-purple-400" />
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black text-slate-500 uppercase leading-none mb-1">{detail.label}</span>
                         <span className="text-xs font-bold text-white">{detail.val}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="p-5 rounded-xl border border-dashed border-white/10 bg-white/5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose">
                AI has automatically removed silences and applied color grading based on the {config?.selectedStyle || 'chosen'} style.
              </p>
           </div>
        </aside>

        {/* Center Dashboard */}
        <section className="flex-1 p-6 md:p-12 flex flex-col gap-8 bg-black/10 overflow-y-auto">
           
           <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Edit Ready</h2>
                 </div>
              </div>
              <div className="flex gap-3">
                 <button 
                  onClick={handleReEdit}
                  className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 transition-all flex items-center gap-2"
                 >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Re-Edit
                 </button>
              </div>
           </div>

           <div className="relative flex-1 min-h-[400px]">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 blur-lg opacity-20" />
              <div className="absolute inset-0 border border-white/10 rounded-2xl bg-[#0B1020] flex flex-col overflow-hidden relative shadow-2xl">
                 <div className="flex-1 relative flex items-center justify-center bg-black/20">
                    <video 
                      src={videoUrl} 
                      className="max-h-full max-w-full z-10" 
                      controls 
                      autoPlay 
                      loop
                    />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-purple-500/5 animate-pulse" />
                 </div>

                 {/* Download Bar */}
                 <div className="h-20 bg-[#1a1b2e]/60 backdrop-blur-xl border-t border-white/10 px-8 flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-white">quick_edit_export.mp4</span>
                       <span className="text-[10px] font-bold text-slate-500 uppercase">{downloadStatus || `Generating ID: ${Math.random().toString(36).substr(2, 9)}`}</span>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(168, 85, 247,0.3)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDownload}
                      className="px-8 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 text-[#0B1020] text-sm font-black uppercase tracking-widest flex items-center gap-3"
                    >
                       <Download className="w-4 h-4" />
                       Save to Device
                    </motion.button>
                 </div>
              </div>
           </div>

           {/* Platforms Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: 'YouTube Shorts', icon: Youtube },
                { label: 'Instagram Reels', icon: Instagram },
                { label: 'TikTok', icon: Smartphone },
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer group text-center flex flex-col items-center">
                   <item.icon className="w-6 h-6 mb-3 text-slate-400 group-hover:text-purple-400" />
                   <h3 className="text-[10px] font-black text-white uppercase tracking-widest">{item.label}</h3>
                </div>
              ))}
           </div>

        </section>

      </main>

    </div>
  );
}
