import re

with open('src/app/main/features-selection.tsx', 'r') as f:
    content = f.read()

# We need to completely replace the features-selection.tsx with the new studio portal design.
# I will use a python script to generate the entire new file to avoid regex parsing issues.

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
    description: "Text-to-Video • Cinematic Motion • AI Scenes",
    icon: Sparkles,
    colorTheme: "blue",
    useCases: "Ads • Reels • Cinematics",
    stats: ["⚡ 4K Ready", "~20s Render", "✨ AI Enhanced"],
    cta: "Launch Workspace",
    tag: "🔥 Most Used",
    route: "/create",
    previewType: "cinematic",
  },
  {
    id: "reference-video",
    title: "Generate Using Reference",
    description: "Style Transfer • Motion Match • Scene Recreate",
    icon: FileVideo,
    colorTheme: "purple",
    useCases: "Style Transfer • Edits",
    stats: ["⚡ 4K Ready", "~15s Render", "🎨 Artistic"],
    cta: "Open Studio",
    tag: "⚡ Fastest",
    route: "/reference-video/setup",
    previewType: "split",
  },
  {
    id: "media-to-video",
    title: "Direct Pic to Video",
    description: "Image Animation • Motion AI • Depth Effects",
    icon: ImageIcon,
    colorTheme: "orange",
    useCases: "Slides • Social • Content",
    stats: ["⚡ HD Ready", "~10s Render", "🎬 Motion"],
    cta: "Create Now",
    tag: "✨ Best For Creators",
    route: "/images-to-video/upload",
    previewType: "morphing",
  },
  {
    id: "quick-edit",
    title: "Quick AI Edit",
    description: "Prompt Editing • Smart Timeline • Auto Effects",
    icon: Zap,
    colorTheme: "green",
    useCases: "YouTube • Shorts • TikTok",
    stats: ["⚡ Pro Ready", "~5s Render", "🎵 Beat Sync"],
    cta: "Start Edit",
    tag: "🎬 Cinematic Favorite",
    route: "/quick-edit/upload",
    previewType: "timeline",
  },
];

const PortalPreview = ({ type, isActive }: { type: string, isActive: boolean }) => {
  if (type === "cinematic") {
    return (
       <div className="w-full h-[180px] relative bg-[#060816] flex items-center justify-center overflow-hidden rounded-t-[20px]">
          <motion.img 
            src="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop"
            animate={isActive ? { scale: [1, 1.1, 1], x: [0, -20, 0] } : { scale: 1, x: 0 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-[120%] h-[120%] object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060816] via-transparent to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-cyan-500/50 flex items-center justify-center bg-black/40 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.3)]">
             <Play className="w-5 h-5 text-cyan-400 ml-1" fill="currentColor" />
          </div>
       </div>
    );
  }
  if (type === "split") {
     return (
       <div className="w-full h-[180px] relative bg-black flex items-center justify-center overflow-hidden rounded-t-[20px]">
         <div className="absolute inset-0 flex">
            <div className="w-1/2 h-full relative">
               <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=500&auto=format&fit=crop" className="w-full h-full object-cover opacity-40 grayscale" />
               <div className="absolute top-2 left-2 text-[9px] font-black tracking-widest text-white/50 bg-black/80 px-2 py-1 rounded border border-white/10">INPUT (REF)</div>
            </div>
            <div className="w-1/2 h-full relative">
               <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=500&auto=format&fit=crop" className="w-full h-full object-cover opacity-90" />
               <div className="absolute top-2 right-2 text-[9px] font-black tracking-widest text-purple-200 bg-purple-900/80 px-2 py-1 rounded border border-purple-500/30">OUTPUT</div>
            </div>
         </div>
         <motion.div 
           animate={isActive ? { x: ['-100%', '100%'] } : { x: 0 }}
           transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white shadow-[0_0_15px_#ec4899,0_0_5px_#ffffff]"
         />
       </div>
     );
  }
  if (type === "morphing") {
     return (
       <div className="w-full h-[180px] relative bg-black flex items-center justify-center overflow-hidden rounded-t-[20px]">
          <motion.img 
            src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop"
            animate={isActive ? { filter: ['hue-rotate(0deg) saturate(1)', 'hue-rotate(45deg) saturate(1.5)', 'hue-rotate(0deg) saturate(1)'], scale: [1, 1.15, 1], y: [0, -10, 0] } : { scale: 1, y: 0 }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f0a] via-transparent to-transparent" />
       </div>
     );
  }
  if (type === "timeline") {
     return (
       <div className="w-full h-[180px] relative bg-[#08120e] p-4 flex flex-col justify-end overflow-hidden rounded-t-[20px]">
          <div className="flex gap-[2px] mb-4 h-1/2 items-end px-2">
            {Array.from({ length: 30 }).map((_, i) => (
               <motion.div 
                 key={i}
                 animate={isActive ? { height: [`${Math.random()*30 + 10}%`, `${Math.random()*80 + 20}%`, `${Math.random()*30 + 10}%`] } : { height: '20%' }}
                 transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
                 className="flex-1 bg-emerald-500/60 rounded-t-sm"
               />
            ))}
          </div>
          <div className="w-full h-10 bg-white/5 rounded-lg flex gap-1 p-1 relative border border-white/10">
             <div className="w-1/4 bg-teal-500/30 rounded border border-teal-500/20" />
             <div className="w-1/2 bg-emerald-500/30 rounded border border-emerald-500/20" />
             <div className="w-1/4 bg-cyan-500/30 rounded border border-cyan-500/20" />
             <motion.div 
               animate={isActive ? { x: ['0%', '350%'] } : { x: '0%' }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
               className="absolute top-[-5px] bottom-[-5px] w-0.5 bg-white shadow-[0_0_15px_#10b981] left-2"
             >
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white rounded-sm" />
             </motion.div>
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
    }, 600);
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-white"
      style={{
        background: 'linear-gradient(135deg, #0b0d1f 0%, #1a1b2e 30%, #2d3142 60%, #3f4a67 85%, #1a1b2e 100%)',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* BACKGROUND DEPTH LAYERS (Not Homepage Particles) */}
      
      {/* Layer 1: Blurred Blobs behind portals */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         <motion.div animate={{ x: [0, 50, 0], y: [0, -30, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#06b6d4] opacity-[0.08] blur-[120px] rounded-full" />
         <motion.div animate={{ x: [0, -40, 0], y: [0, 40, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-[#8b5cf6] opacity-[0.08] blur-[120px] rounded-full" />
         <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-[#f59e0b] opacity-[0.08] blur-[120px] rounded-full" />
         <motion.div animate={{ x: [0, -50, 0], y: [0, 50, 0] }} transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-[#10b981] opacity-[0.08] blur-[120px] rounded-full" />
      </div>

      {/* Layer 2: Mesh / Wireframe */}
      <div className="fixed inset-0 pointer-events-none z-0 mesh-bg" />

      {/* Layer 3: Cinematic Fog / Noise */}
      <div className="fixed inset-0 pointer-events-none z-0 noise-bg" />
      <div className="fixed bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t from-[#0b0d1f] to-transparent opacity-80 pointer-events-none z-0" />

      {/* Header */}
      <div className="pt-8 px-6 lg:px-12 flex justify-between items-center max-w-7xl mx-auto relative z-20 w-full mb-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-6">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.reload()}>
            <BrandLogo size={40} className="relative z-10" />
            <span className="text-xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              VEYTRIX<span className="text-cyan-400">.AI</span>
            </span>
          </div>
          <div className="h-6 w-[1px] bg-white/10" />
          <button onClick={() => navigate("/video-type")} className="flex items-center gap-2 text-cyan-100/60 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold">Back</span>
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <button className="md:hidden p-2 text-white/70 hover:text-white" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden md:flex items-center gap-3">
                <motion.button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-cyan-500/20 text-white shadow-xl">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#0b0d1f]" />
                  </div>
                  <span className="text-sm font-bold tracking-tight">{userName}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>
              </div>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-6 top-[calc(100%+0.5rem)] md:right-0 md:top-full md:mt-2 w-48 bg-[#0b0d1f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[100]">
                    <div className="p-2">
                      <button onClick={() => void handleLogout()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-bold uppercase tracking-widest group">
                        <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : <div className="w-8" />}
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex items-start justify-center px-6 relative z-10 pt-6 pb-20">
        <div className="w-full max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-[clamp(2rem,6vw,3.5rem)] font-black text-white mb-4 tracking-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              Studio Portals
            </h1>
            <p className="text-lg md:text-xl text-slate-400/80 font-medium tracking-tight">
              Select an interactive workspace to begin creating.
            </p>
          </motion.div>

          {/* Portals Grid (2x2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 mb-10">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const isClicking = clickingPortal === feature.id;
              
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  onHoverStart={() => setHoveredPortal(feature.id)}
                  onHoverEnd={() => setHoveredPortal(null)}
                  onClick={() => handlePortalClick(feature.route, feature.id)}
                  className={`portal ${feature.colorTheme} ${isClicking ? 'clicking' : ''}`}
                >
                  {/* Click/Loading Overlay */}
                  {isClicking && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                       <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                       <div className="text-white font-bold tracking-widest text-sm animate-pulse">Initializing...</div>
                    </div>
                  )}

                  {/* Top Preview Area */}
                  <div className="relative">
                    <PortalPreview type={feature.previewType} isActive={hoveredPortal === feature.id} />
                    <div className="portal-tag">{feature.tag}</div>
                  </div>

                  {/* Content Area */}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-xl bg-white/5 border border-white/10`}>
                         <Icon className={`w-6 h-6 text-white`} />
                      </div>
                      <h3 className="text-xl font-bold text-white tracking-tight">{feature.title}</h3>
                    </div>
                    
                    <div className="h-[1px] w-full bg-white/10 mb-4" />
                    
                    {/* Capabilities */}
                    <p className="text-sm text-white/80 font-semibold mb-2 flex items-center justify-center text-center">
                       {feature.description.split(' • ').map((word, i, arr) => (
                          <span key={i} className="flex items-center">
                            {word}
                            {i < arr.length - 1 && <span className="mx-2 text-white/30">•</span>}
                          </span>
                       ))}
                    </p>
                    
                    {/* Use Cases */}
                    <p className="text-[11px] text-white/40 font-medium mb-6 text-center">
                      📋 Use Cases: <span className="text-white/60">{feature.useCases}</span>
                    </p>

                    {/* Stats Row */}
                    <div className="portal-stats">
                       {feature.stats.map((stat, i) => <span key={i}>{stat}</span>)}
                    </div>

                    {/* CTA Button */}
                    <button className={`portal-btn ${feature.colorTheme}`}>
                       {isClicking ? "Loading AI Studio..." : feature.cta}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {isDeveloperTestMode && (
             <div className="mb-8 rounded-[1.75rem] border border-emerald-300/20 bg-emerald-300/5 p-5 text-left text-white/80">
                Test Mode Active.
             </div>
          )}
        </div>
      </div>

      {showLoginSuccess && <SuccessToast message="Login successful!" onDismiss={() => setShowLoginSuccess(false)} />}

      <style>{`
        /* Portal base */
        .portal {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s ease;
          position: relative;
          cursor: pointer;
        }

        /* Unique themes for each portal */
        .portal.blue {
          border-color: rgba(6, 182, 212, 0.3);
          box-shadow: 0 0 30px rgba(6, 182, 212, 0.15);
        }

        .portal.purple {
          border-color: rgba(139, 92, 246, 0.3);
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.15);
        }

        .portal.orange {
          border-color: rgba(245, 158, 11, 0.3);
          box-shadow: 0 0 30px rgba(245, 158, 11, 0.15);
        }

        .portal.green {
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.15);
        }

        /* Portal hover */
        .portal:hover {
          transform: scale(1.03) translateY(-6px);
          border-color: rgba(255, 255, 255, 0.3);
          z-index: 50;
        }

        .portal.blue:hover {
          box-shadow: 0 20px 60px rgba(6, 182, 212, 0.35);
        }

        .portal.purple:hover {
          box-shadow: 0 20px 60px rgba(139, 92, 246, 0.35);
        }

        .portal.orange:hover {
          box-shadow: 0 20px 60px rgba(245, 158, 11, 0.35);
        }

        .portal.green:hover {
          box-shadow: 0 20px 60px rgba(16, 185, 129, 0.35);
        }

        /* Premium tag */
        .portal-tag {
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 10px;
          padding: 6px 10px;
          border-radius: 20px;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          z-index: 10;
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        /* Stats row */
        .portal-stats {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          padding: 12px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          margin-top: 12px;
          font-weight: 700;
        }

        /* CTA Button */
        .portal-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          margin-top: 8px;
          transition: all 0.3s ease;
          color: white;
          text-align: center;
        }

        .portal-btn.blue {
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
        }

        .portal-btn.purple {
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
        }

        .portal-btn.orange {
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
        }

        .portal-btn.green {
          background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
        }

        .portal-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        /* Click animation */
        .portal.clicking {
          animation: portal-click 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          z-index: 100;
        }

        @keyframes portal-click {
          0% { transform: scale(1); }
          40% { transform: scale(1.02); filter: brightness(1.2); }
          100% { transform: scale(1.15); opacity: 0; filter: blur(10px); }
        }

        /* Background elements */
        .mesh-bg {
          background-image: 
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.6;
        }

        .noise-bg {
          background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E');
          opacity: 0.04;
          mix-blend-mode: overlay;
        }
      `}</style>
    </div>
  );
}
"""

with open('src/app/main/features-selection.tsx', 'w') as f:
    f.write(new_content)

