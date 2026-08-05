import { useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowLeft, LogOut, User, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/auth-context";
import { SuccessToast } from "../components/success-toast";
import { BrandLogo } from "../components/brand-logo";
import { buildPortalAwarePath, usePortalTestingContext } from "../../shared/portal/testing-context";
import { LoginModal } from "../components/login-modal";

const features = [
  {
    id: "quick-edit",
    title: "Quick AI Edit",
    description: "Prompt Editing • Smart Timeline",
    icon: Zap,
    colorTheme: "green",
    useCases: "YouTube • Shorts",
    stats: ["Pro Ready", "~5s", "Beat Sync"],
    cta: "Start Edit",
    tag: "🎬",
    route: "/quick-edit/upload",
    previewType: "timeline",
  },
];

const PortalPreview = ({ type, isActive }: { type: string, isActive: boolean }) => {
  if (type === "timeline") {
    return (
      <div className="w-full h-full relative bg-[#0B0A10] p-2 md:p-3 flex flex-col justify-end overflow-hidden rounded-t-[14px]">
        <div className="flex gap-[2px] mb-2 h-1/2 items-end px-1">
          {Array.from({ length: 25 }).map((_, i) => (
            <motion.div
              key={i}
              animate={isActive ? { height: [`${Math.random() * 30 + 10}%`, `${Math.random() * 80 + 20}%`, `${Math.random() * 30 + 10}%`] } : { height: '20%' }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
              className="flex-1 bg-emerald-500/60 rounded-t-sm"
            />
          ))}
        </div>
        <div className="w-full h-4 md:h-6 bg-white/5 rounded flex gap-0.5 p-0.5 relative border border-white/10">
          <div className="w-1/4 bg-fuchsia-500/30 rounded border border-fuchsia-500/20" />
          <div className="w-1/2 bg-emerald-500/30 rounded border border-emerald-500/20" />
          <div className="w-1/4 bg-purple-500/30 rounded border border-purple-500/20" />
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
  const { isLoggedIn, logout, session, profile } = useAuth();
  const { isDeveloperTestMode, search } = usePortalTestingContext();
  const [mounted, setMounted] = useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [hoveredPortal, setHoveredPortal] = useState<string | null>(null);
  const [clickingPortal, setClickingPortal] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  const userName = profile?.fullName || session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";

  useEffect(() => {
    setMounted(true);
    const loginFlag = localStorage.getItem("justLoggedIn");
    if (loginFlag && isLoggedIn) {
      setShowLoginSuccess(true);
      localStorage.removeItem("justLoggedIn");
    }
  }, [isLoggedIn]);

  const handleLogout = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 800)); // allow animation to play
    await logout();
    setIsProcessing(false);
    navigate("/home", { replace: true });
  };

  const handlePortalClick = (route: string, id: string) => {
    if (isLoggedIn) {
      setClickingPortal(id);
      setTimeout(() => {
        navigate(buildPortalAwarePath(route, search));
      }, 500);
    } else {
      localStorage.setItem("authRedirectUrl", buildPortalAwarePath(route, search));
      setIsLoginOpen(true);
    }
  };

  return (
    <div className="tools-section bg-[#0B0A10] text-white font-sans selection:bg-fuchsia-500/30 relative">
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
          className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 25, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"
        />
      </div>

      {/* HEADER NAV ROW */}
      <div className="flex justify-between items-center w-full max-w-6xl mx-auto relative z-20 tools-nav mb-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
            <BrandLogo size={28} className="relative z-10" />
            <span className="text-lg font-black tracking-tight drop-shadow-md">
              VEYTRIX<span className="text-fuchsia-400">.AI</span>
            </span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <button onClick={() => navigate("/home")} className="text-xs font-semibold text-white/60 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <div className="relative">
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold transition-colors">
                <User className="w-3 h-3" />
                {userName}
                <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute right-0 top-full mt-2 w-32 bg-[#130E24] border border-white/10 rounded-xl shadow-xl z-[100] p-1">
                    <button onClick={handleLogout} disabled={isProcessing} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors">
                      {isProcessing ? (
                        <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <LogOut className="w-3 h-3" />
                      )}
                      {isProcessing ? "Logging out..." : "Logout"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={() => setIsLoginOpen(true)} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold transition-colors">
              Login
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col items-center w-full max-w-5xl mx-auto relative z-10 h-full min-h-0">
        <div className="tools-header">
          <h1 className="tools-title font-black tracking-tight drop-shadow-lg">AI Edit</h1>
        </div>

        <div className="portals-grid w-full">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isClicking = clickingPortal === feature.id;
            const isRow1 = index < 2;

            return (
              <div
                key={feature.id}
                onMouseEnter={() => setHoveredPortal(feature.id)}
                onMouseLeave={() => setHoveredPortal(null)}
                onClick={() => handlePortalClick(feature.route, feature.id)}
                className={`portal ${isRow1 ? 'portal-large' : 'portal-small'} ${feature.colorTheme} ${isClicking ? 'clicking' : ''}`}
              >
                {/* Click/Loading Overlay */}
                {isClicking && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-[clamp(14px,2vw,24px)]">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-2" />
                    <div className="text-white font-bold tracking-widest text-[11px] animate-pulse">LOADING...</div>
                  </div>
                )}

                <div className="portal-preview relative">
                  <PortalPreview type={feature.previewType} isActive={hoveredPortal === feature.id} />
                  <div className="portal-tag">{feature.tag}</div>
                </div>

                <div className="flex-1 flex flex-col justify-between pt-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      <h3 className="portal-title font-bold text-white leading-tight">{feature.title}</h3>
                    </div>
                    <div className="portal-divider" />
                    <p className="portal-cap text-white/80 font-medium">{feature.description}</p>
                    <p className="portal-usecase">📋 Use Cases: {feature.useCases}</p>
                  </div>

                  <div>
                    <div className="portal-stats">
                      {feature.stats.map((stat, i) => (
                        <span key={i} className="flex items-center">
                          {stat}
                          {i < feature.stats.length - 1 && <span className="mx-1 md:mx-2 text-white/30">•</span>}
                        </span>
                      ))}
                    </div>
                    <button className={`portal-btn ${feature.colorTheme} w-full`}>
                      {feature.cta}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        /* Main section constraints - 100vh NO SCROLL */
        body, html {
          overflow: hidden;
          height: 100%;
          margin: 0;
        }

        .tools-section {
          min-height: 100vh;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 2vh 4% 2vh;
          box-sizing: border-box;
        }

        .tools-nav {
          flex-shrink: 0;
        }

        .tools-header {
          text-align: center;
          flex-shrink: 0;
          margin-bottom: 2vh;
        }

        .tools-title {
          font-size: clamp(22px, 3.5vw, 36px);
          margin-bottom: 0.5vh;
        }

        .tools-subtitle {
          font-size: clamp(12px, 1.5vw, 16px);
          opacity: 0.7;
          max-width: 600px;
          margin: 0 auto;
        }

        /* Portals grid */
        .portals-grid {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          gap: 1.5vh;
          flex: 1;
          min-height: 0;
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
        }

        /* Base portal sizing */
        .portal {
          display: flex;
          flex-direction: column;
          padding: clamp(12px, 1.5vw, 20px);
          border-radius: clamp(14px, 2vw, 24px);
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.3s ease;
          position: relative;
          cursor: pointer;
          width: 100%;
        }

        /* Specific row heights to emulate 42% and 38% */
        .portal-large {
          height: clamp(260px, 38vh, 400px);
        }
        
        .portal-small {
          height: clamp(230px, 32vh, 340px);
        }

        /* Portal preview */
        .portal-preview {
          height: clamp(80px, 12vh, 140px);
          width: 100%;
          border-radius: 8px 8px 0 0;
          flex-shrink: 0;
          object-fit: cover;
        }

        /* Typography */
        .portal-title {
          font-size: clamp(14px, 1.6vw, 20px);
          margin: clamp(4px, 1vh, 8px) 0 clamp(2px, 0.5vw, 4px);
        }

        .portal-divider {
          height: 1px;
          background: rgba(255,255,255,0.1);
          margin: clamp(4px, 0.8vh, 8px) 0;
        }

        .portal-cap {
          font-size: clamp(10px, 1.1vw, 13px);
          opacity: 0.8;
          margin-bottom: clamp(4px, 0.5vh, 6px);
        }

        .portal-usecase {
          font-size: clamp(9px, 1vw, 12px);
          opacity: 0.5;
          margin-bottom: auto;
        }

        .portal-stats {
          font-size: clamp(9px, 1vw, 11px);
          opacity: 0.6;
          display: flex;
          align-items: center;
          margin: clamp(4px, 0.8vh, 8px) 0;
          font-weight: 600;
        }

        .portal-btn {
          padding: clamp(8px, 1vh, 14px);
          font-size: clamp(11px, 1.2vw, 14px);
          border-radius: 8px;
          font-weight: 700;
          margin-top: clamp(6px, 1vh, 10px);
          color: white;
          text-align: center;
          transition: all 0.2s ease;
        }

        /* Homepage Theme Colors */
        .portal.blue { border-color: rgba(59, 130, 246, 0.2); box-shadow: 0 0 20px rgba(59, 130, 246, 0.05); }
        .portal.purple { border-color: rgba(139, 92, 246, 0.2); box-shadow: 0 0 20px rgba(139, 92, 246, 0.05); }
        .portal.orange { border-color: rgba(249, 115, 22, 0.2); box-shadow: 0 0 20px rgba(249, 115, 22, 0.05); }
        .portal.green { border-color: rgba(16, 185, 129, 0.2); box-shadow: 0 0 20px rgba(16, 185, 129, 0.05); }

        .portal-btn.blue { background: linear-gradient(135deg, #3b82f6 0%, #9333ea 100%); }
        .portal-btn.purple { background: linear-gradient(135deg, #d946ef 0%, #d946ef 100%); }
        .portal-btn.orange { background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); }
        .portal-btn.green { background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); }

        .portal-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }

        /* Tag */
        .portal-tag {
          position: absolute;
          top: clamp(6px, 1vh, 10px);
          right: clamp(6px, 1vh, 10px);
          font-size: clamp(8px, 0.9vw, 11px);
          padding: 3px 8px;
          border-radius: 20px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.15);
          color: white;
          font-weight: bold;
        }

        /* Hover Effects */
        .portal:hover {
          transform: scale(1.02);
          border-color: rgba(255, 255, 255, 0.2);
          z-index: 10;
        }
        .portal.blue:hover { box-shadow: 0 10px 40px rgba(59, 130, 246, 0.3); }
        .portal.purple:hover { box-shadow: 0 10px 40px rgba(139, 92, 246, 0.3); }
        .portal.orange:hover { box-shadow: 0 10px 40px rgba(249, 115, 22, 0.3); }
        .portal.green:hover { box-shadow: 0 10px 40px rgba(16, 185, 129, 0.3); }

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
            display: flex;
            flex-direction: column;
            gap: 1.5vh;
            overflow-y: auto;
            padding-bottom: 20px;
          }
          .tools-section {
            height: 100dvh;
            overflow: auto;
          }
          .portal-large, .portal-small {
            height: clamp(240px, 35vh, 300px);
          }
          .portal-preview {
            height: clamp(80px, 15vh, 120px);
          }
          body, html {
            overflow: auto;
          }
        }
      `}</style>
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
