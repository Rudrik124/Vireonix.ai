new_content = """import { useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileVideo, Zap, Image as ImageIcon, ArrowLeft, LogOut, User, ChevronDown, Menu, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/auth-context";
import { SuccessToast } from "../components/success-toast";
import { BrandLogo } from "../components/brand-logo";
import { buildPortalAwarePath, usePortalTestingContext } from "../../shared/portal/testing-context";

const features = [
  {
    id: "ai-generated",
    title: "AI Generated Video",
    description: "Text-to-Video • Cinematic",
    icon: Sparkles,
    colorTheme: "blue",
    cta: "Launch Workspace",
    tag: "🔥 Most Used",
    route: "/create",
    previewType: "cinematic",
  },
  {
    id: "reference-video",
    title: "Generate Using Reference",
    description: "Style Transfer • Motion Match",
    icon: FileVideo,
    colorTheme: "purple",
    cta: "Open Studio",
    tag: "⚡ Fastest",
    route: "/reference-video/setup",
    previewType: "split",
  },
  {
    id: "media-to-video",
    title: "Direct Pic to Video",
    description: "Image Animation • Depth",
    icon: ImageIcon,
    colorTheme: "orange",
    cta: "Create Now",
    tag: "✨ Creators",
    route: "/images-to-video/upload",
    previewType: "morphing",
  },
  {
    id: "quick-edit",
    title: "Quick AI Edit",
    description: "Smart Timeline • Auto Edit",
    icon: Zap,
    colorTheme: "green",
    cta: "Start Edit",
    tag: "🎬 Pro Edit",
    route: "/quick-edit/upload",
    previewType: "timeline",
  },
];

const PortalPreview = ({ type, isActive }: { type: string, isActive: boolean }) => {
  if (type === "cinematic") {
    return (
       <div className="w-full h-[80px] relative bg-[#0B0A10] flex items-center justify-center overflow-hidden rounded-t-[12px]">
          <motion.img 
            src="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop"
            animate={isActive ? { scale: [1, 1.1, 1], x: [0, -10, 0] } : { scale: 1, x: 0 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-[120%] h-[120%] object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0A10] via-transparent to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-blue-500/50 flex items-center justify-center bg-black/40 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.3)]">
             <Play className="w-3 h-3 text-blue-400 ml-0.5" fill="currentColor" />
          </div>
       </div>
    );
  }
  if (type === "split") {
     return (
       <div className="w-full h-[80px] relative bg-black flex items-center justify-center overflow-hidden rounded-t-[12px]">
         <div className="absolute inset-0 flex">
            <div className="w-1/2 h-full relative">
               <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=500&auto=format&fit=crop" className="w-full h-full object-cover opacity-40 grayscale" />
               <div className="absolute top-1 left-1 text-[7px] font-black tracking-widest text-white/50 bg-black/80 px-1 rounded border border-white/10">IN</div>
            </div>
            <div className="w-1/2 h-full relative">
               <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=500&auto=format&fit=crop" className="w-full h-full object-cover opacity-90" />
               <div className="absolute top-1 right-1 text-[7px] font-black tracking-widest text-purple-200 bg-purple-900/80 px-1 rounded border border-purple-500/30">OUT</div>
            </div>
         </div>
         <motion.div 
           animate={isActive ? { x: ['-100%', '100%'] } : { x: 0 }}
           transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white shadow-[0_0_10px_#ec4899]"
         />
       </div>
     );
  }
  if (type === "morphing") {
     return (
       <div className="w-full h-[80px] relative bg-black flex items-center justify-center overflow-hidden rounded-t-[12px]">
          <motion.img 
            src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop"
            animate={isActive ? { filter: ['hue-rotate(0deg) saturate(1)', 'hue-rotate(45deg) saturate(1.5)', 'hue-rotate(0deg) saturate(1)'], scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0A10] via-transparent to-transparent" />
       </div>
     );
  }
  if (type === "timeline") {
     return (
       <div className="w-full h-[80px] relative bg-[#0B0A10] p-2 flex flex-col justify-end overflow-hidden rounded-t-[12px]">
          <div className="flex gap-[1px] mb-2 h-1/2 items-end px-1">
            {Array.from({ length: 25 }).map((_, i) => (
               <motion.div 
                 key={i}
                 animate={isActive ? { height: [`${Math.random()*30 + 10}%`, `${Math.random()*80 + 20}%`, `${Math.random()*30 + 10}%`] } : { height: '20%' }}
                 transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
                 className="flex-1 bg-emerald-500/60 rounded-t-sm"
               />
            ))}
          </div>
          <div className="w-full h-4 bg-white/5 rounded flex gap-0.5 p-0.5 relative border border-white/10">
             <div className="w-1/4 bg-teal-500/30 rounded border border-teal-500/20" />
             <div className="w-1/2 bg-emerald-500/30 rounded border border-emerald-500/20" />
             <div className="w-1/4 bg-cyan-500/30 rounded border border-cyan-500/20" />
             <motion.div 
               animate={isActive ? { x: ['0%', '350%'] } : { x: '0%' }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
               className="absolute top-[-2px] bottom-[-2px] w-px bg-white shadow-[0_0_8px_#10b981] left-1"
             />
          </div>
       </div>
     );
  }
  return null;
}

export function FeaturesSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, logout, session } = useAuth();
  const { isDeveloperTestMode, search } = usePortalTestingContext();
  const [mounted, setMounted] = useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [hoveredPortal, setHoveredPortal] = useState<string | null>(null);
  const [clickingPortal, setClickingPortal] = useState<string | null>(null);

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";

  useEffect(() => {
    setMounted(true);
    const loginFlag = localStorage.getItem("justLoggedIn");
    if (loginFlag && isLoggedIn) {
      setShowLoginSuccess(true);
      localStorage.removeItem("justLoggedIn");
    }
  }, [isLoggedIn]);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    navigate("/video-type", { replace: true });
  };

  const handlePortalClick = (route: string, id: string) => {
    setClickingPortal(id);
    setTimeout(() => {
      navigate(buildPortalAwarePath(route, search));
    }, 500);
  };

  return (
    <div className="tools-section bg-[#0B0A10] text-white font-sans selection:bg-purple-500/30 relative">
      {/* HOMEPAGE BACKGROUND MATCH */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#0B0A10]">
        {/* Grid Glow */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [perspective:1000px] [transform-style:preserve-3d]">
           <div className="absolute inset-0 bg-gradient-to-t from-[#0B0A10] via-transparent to-[#0B0A10]" />
        </div>
        
        {/* Gradient Blobs (matching landing page purple/indigo) */}
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, 25, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]"
        />
      </div>

      {/* HEADER ROW - Very Compact */}
      <div className="flex justify-between items-center w-full max-w-5xl mx-auto relative z-20 tools-nav">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
            <BrandLogo size={28} className="relative z-10" />
            <span className="text-lg font-black tracking-tight drop-shadow-md">
              VEYTRIX<span className="text-purple-400">.AI</span>
            </span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <button onClick={() => navigate("/video-type")} className="text-xs font-semibold text-white/60 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <div className="relative">
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold transition-colors">
                <User className="w-3 h-3" />
                {userName}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute right-0 top-full mt-2 w-32 bg-[#130E24] border border-white/10 rounded-xl shadow-xl z-[100] p-1">
                    <button onClick={() => void handleLogout()} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors">
                      <LogOut className="w-3 h-3" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : <div className="w-8" />}
        </div>
      </div>

      {/* MAIN CONTENT - Grid */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto relative z-10 mt-2 mb-2 h-full min-h-0">
        <div className="tools-header mb-4">
          <h1 className="tools-title font-black tracking-tight drop-shadow-lg">See How VEYTRIX Works</h1>
          <p className="tools-subtitle font-medium">Four powerful AI workflows for creators</p>
        </div>

        <div className="portals-grid w-full h-full min-h-0">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isClicking = clickingPortal === feature.id;
            
            return (
              <div
                key={feature.id}
                onMouseEnter={() => setHoveredPortal(feature.id)}
                onMouseLeave={() => setHoveredPortal(null)}
                onClick={() => handlePortalClick(feature.route, feature.id)}
                className={`portal portal-compact ${feature.colorTheme} ${isClicking ? 'clicking' : ''}`}
              >
                {/* Click/Loading Overlay */}
                {isClicking && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-[16px]">
                     <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mb-2" />
                     <div className="text-white font-bold tracking-widest text-[10px] animate-pulse">LOADING...</div>
                  </div>
                )}

                <div className="relative portal-preview">
                  <PortalPreview type={feature.previewType} isActive={hoveredPortal === feature.id} />
                  <div className="portal-tag">{feature.tag}</div>
                </div>

                <div className="flex-1 flex flex-col p-1 mt-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-white" />
                    <h3 className="portal-title font-bold text-white leading-tight">{feature.title}</h3>
                  </div>
                  <p className="portal-cap text-white/70 font-medium">{feature.description}</p>
                  
                  <button className={`portal-btn ${feature.colorTheme} w-full`}>
                     {feature.cta}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {isDeveloperTestMode && (
           <div className="mt-2 text-[10px] text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Test Mode Active
           </div>
        )}
      </div>

      <style>{`
        /* Main section constraints - 100vh NO SCROLL */
        body, html {
          overflow: hidden;
          height: 100%;
          margin: 0;
        }

        .tools-section {
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 16px 4% 16px;
          box-sizing: border-box;
        }

        .tools-nav {
          flex-shrink: 0;
          height: 40px;
        }

        .tools-header {
          text-align: center;
          flex-shrink: 0;
        }

        .tools-title {
          font-size: 26px;
          margin-bottom: 2px;
        }

        .tools-subtitle {
          font-size: 13px;
          opacity: 0.8;
          margin-bottom: 0;
        }

        /* Portals grid */
        .portals-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          width: 100%;
          align-content: center;
          justify-content: center;
        }

        /* Compact portal */
        .portal-compact {
          height: 180px;
          display: flex;
          flex-direction: column;
          padding: 10px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s ease;
          position: relative;
          cursor: pointer;
        }

        /* Homepage Theme Colors */
        .portal.blue {
          border-color: rgba(59, 130, 246, 0.2);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.05);
        }
        .portal.purple {
          border-color: rgba(139, 92, 246, 0.2);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.05);
        }
        .portal.orange {
          border-color: rgba(249, 115, 22, 0.2);
          box-shadow: 0 0 20px rgba(249, 115, 22, 0.05);
        }
        .portal.green {
          border-color: rgba(16, 185, 129, 0.2);
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.05);
        }

        /* Hover Effects */
        .portal:hover {
          transform: scale(1.02) translateY(-2px);
          border-color: rgba(255, 255, 255, 0.2);
          z-index: 10;
        }
        .portal.blue:hover { box-shadow: 0 10px 30px rgba(59, 130, 246, 0.2); }
        .portal.purple:hover { box-shadow: 0 10px 30px rgba(139, 92, 246, 0.2); }
        .portal.orange:hover { box-shadow: 0 10px 30px rgba(249, 115, 22, 0.2); }
        .portal.green:hover { box-shadow: 0 10px 30px rgba(16, 185, 129, 0.2); }

        /* Typography */
        .portal-title {
          font-size: 14px;
          margin: 6px 0 2px;
        }
        .portal-cap {
          font-size: 11px;
        }

        /* Portal preview */
        .portal-preview {
          height: 80px;
          border-radius: 12px;
          flex-shrink: 0;
        }

        /* Portal button */
        .portal-btn {
          padding: 8px;
          font-size: 12px;
          border-radius: 8px;
          margin-top: auto;
          font-weight: 700;
          color: white;
          text-align: center;
          transition: all 0.2s ease;
        }

        .portal-btn.blue { background: linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%); }
        .portal-btn.purple { background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); }
        .portal-btn.orange { background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); }
        .portal-btn.green { background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); }

        .portal-btn:hover {
          filter: brightness(1.1);
        }

        /* Tag */
        .portal-tag {
          position: absolute;
          top: 8px;
          right: 8px;
          font-size: 9px;
          padding: 3px 6px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.15);
          color: white;
          font-weight: bold;
        }

        /* Click animation */
        .portal.clicking {
          animation: portal-click 0.5s forwards;
          z-index: 50;
        }
        @keyframes portal-click {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); filter: brightness(1.2); }
          100% { transform: scale(1.2); opacity: 0; }
        }

        /* Responsive - Keep it in viewport if possible */
        @media (max-width: 768px) {
          .portals-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            overflow-y: auto; /* Allow scroll on mobile if strictly needed */
            padding-bottom: 20px;
          }
          .tools-section {
            height: 100dvh;
          }
          .portal-compact {
            height: 160px;
          }
          .portal-preview {
            height: 70px;
          }
        }
      `}</style>
    </div>
  );
}
"""

with open('src/app/main/features-selection.tsx', 'w') as f:
    f.write(new_content)
