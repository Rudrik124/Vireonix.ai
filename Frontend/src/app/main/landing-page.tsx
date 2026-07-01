import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ConfigProvider, theme, Button, Modal, Row, Col, Card, Switch, Typography, Progress } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleOutlined, GithubOutlined, TwitterOutlined, RocketOutlined, SearchOutlined, CloudUploadOutlined, CloudDownloadOutlined, ThunderboltOutlined, PictureOutlined, CodeOutlined, PlayCircleOutlined, ScissorOutlined, MessageOutlined, AudioOutlined, BgColorsOutlined, MobileOutlined, SoundOutlined, BulbOutlined, FieldTimeOutlined, SafetyCertificateOutlined, CloudServerOutlined, VideoCameraOutlined, CopyOutlined, FileImageOutlined, EditOutlined, CloseOutlined, SlidersOutlined, DiscordOutlined, ArrowRightOutlined } from '@ant-design/icons';
const LoginModal = lazy(() => import('../components/login-modal').then(m => ({ default: m.LoginModal })));
import { BrandLogo } from '../components/brand-logo';
import { Sparkles, Play, Video, Image as ImageIcon, Wand2, Music, CheckCircle2, Menu, Loader2, Star, Zap, Clapperboard, Globe, ShieldCheck, User, ChevronRight, ChevronDown, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { getRoleRedirectUrl } from '../../lib/role-redirect';
const PrivacyPolicyContent = lazy(() => import('../components/legal-policies-content').then(m => ({ default: m.PrivacyPolicyContent })));
const TermsOfServiceContent = lazy(() => import('../components/legal-policies-content').then(m => ({ default: m.TermsOfServiceContent })));
const RefundPolicyContent = lazy(() => import('../components/legal-policies-content').then(m => ({ default: m.RefundPolicyContent })));
const AcceptableUsePolicyContent = lazy(() => import('../components/legal-policies-content').then(m => ({ default: m.AcceptableUsePolicyContent })));

const { Title, Text } = Typography;

import { FAQAccordion } from '../../components/faq-accordion';
import { useSEO } from '../../hooks/use-seo';

import { PricingSection } from '../../components/landing/pricing-section';

export function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  useSEO('Lightning Fast Web Optimization | TurboSite', 'Make your site lightning fast with our 3-step optimization process. Audit, Optimize, and Deploy in seconds.');

  useEffect(() => {
    const savedScroll = sessionStorage.getItem('landingScrollY');
    if (savedScroll) {
      // Small timeout to ensure DOM is ready before scrolling
      setTimeout(() => window.scrollTo(0, parseInt(savedScroll)), 10);
    }

    const handleScroll = () => {
      sessionStorage.setItem('landingScrollY', window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | 'refund' | 'acceptable' | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeWorkflowModal, setActiveWorkflowModal] = useState<number | null>(null);
  const [isAIToolsModalOpen, setIsAIToolsModalOpen] = useState(false);

  const { session, isLoggedIn, isLoading, logout, profile } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect authenticated privileged users strictly to their respective portals.
  // Normal users are allowed to stay on the Landing page or navigate back and forth.
  useEffect(() => {
    if (isLoggedIn && !isLoading && profile) {
      const role = (profile.role || '').toLowerCase();
      const access = Array.isArray(profile.portalAccess) ? profile.portalAccess.map((a: string) => a.toLowerCase()) : [];

      const isPrivileged =
        role === 'security' || access.includes('security') ||
        role === 'developer' || access.includes('developer') ||
        role === 'tester' || access.includes('tester') ||
        role === 'admin' || role === 'super_admin';

      if (isPrivileged) {
        const redirectUrl = getRoleRedirectUrl(session?.user?.email, profile, undefined);
        if (redirectUrl) {
          navigate(redirectUrl, { replace: true });
        }
      }
    }
  }, [isLoggedIn, isLoading, profile, session, navigate]);

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";

  const handleLogout = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 800)); // allow animation to play
    await logout();
    setIsProcessing(false);
    setIsUserMenuOpen(false);
  };

  const [promptText, setPromptText] = useState("");
  const [promptPhase, setPromptPhase] = useState("typing"); // typing, loading, progress, success
  const [progressValue, setProgressValue] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const fullPrompt = "Generate a cinematic cyberpunk reel with neon lights, rain effects, and dynamic camera movements...";

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    // If navigated here with { state: { openLogin: true } }, open the modal
    if (location.state && (location.state as any).openLogin) {
      setIsLoginOpen(true);
      // Clear the state so it doesn't re-open on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleStartCreating = () => {
    if (isLoggedIn) {
      navigate('/video-type');
    } else {
      localStorage.setItem("authRedirectUrl", "/video-type");
      setIsLoginOpen(true);
    }
  };

  const handleStartFree = () => {
    if (isLoggedIn) {
      navigate('/video-type');
    } else {
      localStorage.setItem("authRedirectUrl", "/video-type");
      setIsLoginOpen(true);
    }
  };

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const runSequence = () => {
      setPromptText("");
      setPromptPhase("typing");
      setProgressValue(0);

      let charIndex = 0;
      const typeInterval = setInterval(() => {
        if (charIndex <= fullPrompt.length) {
          setPromptText(fullPrompt.slice(0, charIndex));
          charIndex++;
        } else {
          clearInterval(typeInterval);
          timeout = setTimeout(() => {
            setPromptPhase("loading");
            timeout = setTimeout(() => {
              setPromptPhase("progress");
              let currentProgress = 0;
              const progressInterval = setInterval(() => {
                currentProgress += Math.floor(Math.random() * 15) + 5;
                if (currentProgress >= 100) {
                  currentProgress = 100;
                  clearInterval(progressInterval);
                  setProgressValue(100);
                  setPromptPhase("success");
                  timeout = setTimeout(runSequence, 4000);
                } else {
                  setProgressValue(currentProgress);
                }
              }, 300);
            }, 2000);
          }, 1000);
        }
      }, 50);

      return () => clearInterval(typeInterval);
    };

    runSequence();
    return () => clearTimeout(timeout);
  }, [fullPrompt]);

  const workflows = [
    {
      id: 1,
      title: "AI Video Generation",
      description: "Transform simple text prompts into fully generated cinematic videos using advanced AI models. Describe your idea, scene, style, motion, lighting, camera angles, or aesthetic — and the AI automatically creates a professional-quality video in seconds. Perfect for creators, marketers, reels, ads, storytelling, and social media content.",
      features: ["Text-to-Video Generation", "Cinematic Scene Creation", "AI Camera Motion", "Smart Visual Styling", "Fast Rendering Engine", "Reel & Shorts Optimization"],
      indicators: ["⚡ Fast Processing", "🎬 4K Export", "🤖 AI Powered", "☁️ Cloud Rendering"],
      icon: <VideoCameraOutlined />,
      color: "from-blue-500 to-purple-500",
      glowColor: "shadow-blue-500/20",
      borderColor: "border-blue-500/20"
    },
    {
      id: 2,
      title: "Reference Video Editing",
      description: "Upload a reference video and let AI recreate, enhance, or transform it using your own prompts, images, clips, or editing instructions. Change styles, transitions, effects, pacing, colors, or visual aesthetics while preserving the original flow and structure.",
      features: ["AI Reference Analysis", "Style Transfer Editing", "Scene Recreation", "Smart Clip Replacement", "AI Motion Matching", "Cinematic Enhancement"],
      indicators: ["⚡ Fast Processing", "🎬 4K Export", "🤖 AI Powered", "☁️ Cloud Rendering"],
      icon: <CopyOutlined />,
      color: "from-fuchsia-500 to-pink-500",
      glowColor: "shadow-fuchsia-500/20",
      borderColor: "border-fuchsia-500/20"
    },
    {
      id: 3,
      title: "Image to Video",
      description: "Convert static images into dynamic cinematic videos with realistic AI-generated motion, camera movement, depth animation, zoom effects, transitions, and visual storytelling. Simply upload images and describe how the motion and scene should behave.",
      features: ["AI Motion Generation", "Depth & Camera Animation", "Image Cinematics", "Smooth Transitions", "Dynamic Scene Effects", "Visual Storytelling AI"],
      indicators: ["⚡ Fast Processing", "🎬 4K Export", "🤖 AI Powered", "☁️ Cloud Rendering"],
      icon: <FileImageOutlined />,
      color: "from-orange-500 to-red-500",
      glowColor: "shadow-orange-500/20",
      borderColor: "border-orange-500/20"
    },
    {
      id: 4,
      title: "AI Manual Edit",
      description: "Edit videos manually with the power of AI-assisted prompting. Control speed, cuts, effects, transitions, captions, color grading, timing, and animations using intelligent prompts while still having full creative freedom through professional editing tools.",
      features: ["Prompt-Based Editing", "AI Smart Timeline", "Advanced Transitions", "Auto Captions & Effects", "Speed & Motion Controls", "Professional Editing Suite"],
      indicators: ["⚡ Fast Processing", "🎬 4K Export", "🤖 AI Powered", "☁️ Cloud Rendering"],
      icon: <EditOutlined />,
      color: "from-emerald-500 to-fuchsia-500",
      glowColor: "shadow-emerald-500/20",
      borderColor: "border-emerald-500/20"
    }
  ];

  // Theme configuration for Ant Design ConfigProvider
  const currentTheme = {
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#d946ef', // Tailwind fuchsia-500
      colorBgBase: isDarkMode ? '#0a0a0a' : '#ffffff', // Black / White
      colorTextBase: isDarkMode ? '#ffffff' : '#0a0a0a',
      borderRadius: 8,
    },
    components: {
      Card: {
        colorBgContainer: isDarkMode ? '#171717' : '#ffffff', // Slightly lighter than background for depth
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <ConfigProvider theme={currentTheme}>
      <div className={`min-h-[100dvh] transition-colors duration-500 font-sans ${isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}>

        {/* MOUSE FOLLOW LIGHT EFFECT */}
        <div
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.08), transparent 40%)`
          }}
        />

        {/* ENHANCED BACKGROUND */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#0B0A10]">
          {/* Grid Glow */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [perspective:1000px] [transform-style:preserve-3d]">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0A10] via-transparent to-[#0B0A10]" />
          </div>

          {/* Gradient Blobs */}
          <motion.div
            animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-fuchsia-600/10 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ x: [0, -100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px]"
          />
        </div>

        {/* HEADER */}
        <header className="absolute top-0 left-0 right-0 z-50 w-full py-4 bg-transparent">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            {/* Logo */}
            <div className="text-2xl font-black tracking-tighter cursor-pointer flex items-center gap-2 group">
              <BrandLogo size={32} className="group-hover:scale-105 transition-transform" />
              <span className="text-white drop-shadow-md">VEYTRIX<span className="text-fuchsia-400">.AI</span></span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center justify-center gap-8 text-sm font-semibold opacity-80 text-white">
              <a href="#features" className="hover:text-fuchsia-400 hover:opacity-100 transition-colors relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-fuchsia-500 transition-all duration-300 group-hover:w-full" />
              </a>
              <a href="#how-it-works" className="hover:text-fuchsia-400 hover:opacity-100 transition-colors relative group">
                Workflow
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-fuchsia-500 transition-all duration-300 group-hover:w-full" />
              </a>
              <a href="#pricing" className="hover:text-fuchsia-400 hover:opacity-100 transition-colors relative group">
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-fuchsia-500 transition-all duration-300 group-hover:w-full" />
              </a>
            </nav>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-4 text-white">
              <button onClick={() => navigate("/wallet")} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold transition-all text-fuchsia-400 hover:text-fuchsia-300">
                <Wallet className="w-4 h-4" /> Wallet
              </button>
              {isLoggedIn ? (
                <div className="relative">
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-sm font-bold transition-colors">
                    <User className="w-4 h-4" />
                    {userName}
                    <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute right-0 top-full mt-2 w-36 bg-[#130E24] border border-white/10 rounded-xl shadow-xl z-[100] p-1">
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
                <button onClick={() => setIsLoginOpen(true)} className="text-sm font-bold opacity-80 hover:opacity-100 transition-opacity">
                  Login
                </button>
              )}
              <button onClick={handleStartCreating} className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                Dashboard
              </button>
            </div>

            {/* Mobile Menu */}
            <button className="md:hidden text-white opacity-80">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="relative min-h-[100dvh] pt-[clamp(4rem,8dvh,6rem)] pb-[clamp(1rem,3dvh,3rem)] px-6 flex flex-col justify-start overflow-hidden z-10">
          <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-[60%_40%] gap-8 items-center my-auto">

            {/* LEFT COLUMN: MAIN CONTENT */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left z-20"
            >
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400 text-xs font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                <Sparkles className="w-3 h-3 animate-pulse" /> AI-Powered Video Creation
              </div>

              {/* Heading */}
              <h1 className="text-[clamp(2.5rem,4vw,4rem)] font-black leading-[1.1] mb-6 tracking-tight text-white drop-shadow-xl">
                Turn prompts, images, and ideas into <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400 drop-shadow-[0_0_30px_rgba(139,92,246,0.4)]">studio-quality videos</span> instantly.
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-xl mb-10 text-gray-400 max-w-xl font-medium leading-relaxed">
                Create stunning cinematic content with intelligent AI workflows. Generate, edit, and export professional videos in minutes.
              </p>

              {/* Interactive Prompt Box */}
              <div className="mb-10 w-full max-w-xl relative">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 blur-xl rounded-2xl" />
                <div className="relative bg-[#130E24]/80 backdrop-blur-xl border border-fuchsia-500/30 rounded-2xl p-5 shadow-2xl">

                  {/* Status Indicator */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${promptPhase === 'success' ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]' : 'bg-fuchsia-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]'} animate-pulse`} />
                      <span className="text-xs font-bold uppercase tracking-widest text-fuchsia-300/70">
                        {promptPhase === 'typing' && "AI Vision Input"}
                        {promptPhase === 'loading' && "Initializing Engine"}
                        {promptPhase === 'progress' && "Rendering Scene"}
                        {promptPhase === 'success' && "Generation Complete"}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Content Area */}
                  <div className="h-16 flex flex-col justify-center">
                    {promptPhase === 'typing' && (
                      <p className="text-sm md:text-base font-mono text-fuchsia-100 leading-relaxed">
                        {promptText}
                        <span className="inline-block w-2 h-4 ml-1 bg-fuchsia-400 animate-pulse align-middle" />
                      </p>
                    )}

                    {promptPhase === 'loading' && (
                      <div className="flex items-center gap-4 text-fuchsia-200">
                        <Loader2 className="w-6 h-6 animate-spin text-fuchsia-500" />
                        <span className="font-semibold text-lg animate-pulse">Analyzing Prompt & Style...</span>
                      </div>
                    )}

                    {promptPhase === 'progress' && (
                      <div className="w-full">
                        <div className="flex justify-between text-sm font-bold mb-2">
                          <span className="text-fuchsia-300">Generating Assets...</span>
                          <span className="text-white">{progressValue}%</span>
                        </div>
                        <div className="w-full h-2 bg-purple-900/50 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressValue}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    )}

                    {promptPhase === 'success' && (
                      <div className="flex items-center gap-3 text-green-400">
                        <CheckCircle2 className="w-6 h-6" />
                        <span className="font-bold text-lg">Cinematic Reel Ready!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Button
                  onClick={handleStartCreating}
                  type="primary"
                  size="large"
                  shape="round"
                  className="h-14 px-10 text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 border-0 shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] group relative overflow-hidden text-white hover:text-white"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative z-10 flex items-center gap-2">Start Creating <ChevronRight className="w-5 h-5" /></span>
                </Button>
                <Button
                  size="large"
                  shape="round"
                  className="h-14 px-10 text-lg font-bold bg-transparent border-2 border-white/20 text-white hover:border-fuchsia-500 hover:text-fuchsia-400 transition-all hover:bg-white/5"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Watch Demo
                </Button>
              </div>

              {/* Social Proof */}
              <div className="mt-8 flex items-center gap-4 opacity-70 text-white">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0B0A10] bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center text-[10px] font-bold">
                      <User className="w-4 h-4" />
                    </div>
                  ))}
                </div>
                <div className="text-xs font-semibold">
                  <div className="flex text-yellow-500 mb-0.5">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                  </div>
                  Trusted by creators & agencies worldwide.
                </div>
              </div>
            </motion.div>

            {/* RIGHT COLUMN: VISUAL AREA */}
            <div className="relative w-full h-[clamp(400px,60dvh,600px)] hidden lg:block z-10 perspective-[1000px]">

              {/* Main Video Preview Window */}
              <motion.div
                initial={{ opacity: 0, rotateY: -10, z: -100 }}
                animate={{ opacity: 1, rotateY: -5, z: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] max-w-[500px] bg-[#1A1A24]/80 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden gpu"
              >
                {/* Mac-style Window Header */}
                <div className="h-8 bg-black/40 border-b border-white/10 flex items-center px-4 gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  <div className="mx-auto text-[10px] font-mono text-white/40 tracking-widest">VEYTRIX.AI / OUTPUT</div>
                </div>

                {/* Video Area */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  <img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop" alt="Cinematic Output" className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] font-bold border border-white/10 text-white">
                    4K PRORES
                  </div>
                  <div className="absolute bottom-4 right-4 bg-fuchsia-500/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white">
                    0:30
                  </div>
                </div>

                {/* Floating Timeline UI */}
                <div className="p-4 bg-black/20">
                  <div className="flex items-center gap-2 mb-2">
                    <ScissorOutlined className="text-gray-500" />
                    <div className="flex-1 h-6 bg-white/5 rounded-md relative flex">
                      <div className="absolute left-1/3 top-0 bottom-0 w-0.5 bg-fuchsia-500 shadow-[0_0_10px_rgba(139,92,246,1)] z-10" />
                      <div className="w-1/3 bg-purple-500/40 border border-purple-500/50 rounded-l-md" />
                      <div className="w-1/3 bg-fuchsia-500/40 border border-fuchsia-500/50 mx-0.5" />
                      <div className="w-1/3 bg-blue-500/40 border border-blue-500/50 rounded-r-md" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AudioOutlined className="text-gray-500" />
                    <div className="flex-1 h-4 bg-white/5 rounded-md flex gap-[2px] items-end px-1 pb-0.5 overflow-hidden">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="w-full bg-green-500/60 rounded-t-sm" style={{ height: `${Math.random() * 80 + 20}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Cards */}
              <motion.div
                animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 -left-10 bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-2xl shadow-xl shadow-purple-900/20 flex items-center gap-3 z-20"
              >
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
                  <Video className="w-5 h-5 text-fuchsia-400" />
                </div>
                <div className="font-bold text-sm whitespace-nowrap text-white">AI Video Gen</div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 20, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-32 -right-8 bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-2xl shadow-xl shadow-purple-900/20 flex items-center gap-3 z-20"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                </div>
                <div className="font-bold text-sm whitespace-nowrap text-white">Smart Editing</div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -10, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute -top-4 right-10 bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-2xl shadow-xl shadow-pink-900/20 flex items-center gap-3 z-20"
              >
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-pink-400" />
                </div>
                <div className="font-bold text-sm whitespace-nowrap text-white">Image Animation</div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 15, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-10 left-0 bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-2xl shadow-xl shadow-blue-900/20 flex items-center gap-3 z-20"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Music className="w-5 h-5 text-blue-400" />
                </div>
                <div className="font-bold text-sm whitespace-nowrap text-white">Auto Beat Sync</div>
              </motion.div>

            </div>
          </div>

          {/* Trust Stats Strip */}
          <div className="max-w-7xl mx-auto w-full mt-4 z-20">
            <div className="flex flex-wrap justify-center md:justify-between items-center gap-6 py-6 px-10 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-fuchsia-500/10 to-transparent translate-x-[-100%] animate-[shimmer_3s_infinite]" />

              <div className="flex items-center gap-2 text-sm font-bold text-gray-300 relative z-10"><Zap className="w-4 h-4 text-yellow-400" /> AI Powered</div>
              <div className="hidden md:block w-px h-6 bg-white/10 relative z-10" />
              <div className="flex items-center gap-2 text-sm font-bold text-gray-300 relative z-10"><Clapperboard className="w-4 h-4 text-fuchsia-400" /> 4K Export</div>
              <div className="hidden md:block w-px h-6 bg-white/10 relative z-10" />
              <div className="flex items-center gap-2 text-sm font-bold text-gray-300 relative z-10"><RocketOutlined className="text-blue-400" /> Fast Rendering</div>
              <div className="hidden md:block w-px h-6 bg-white/10 relative z-10" />
              <div className="flex items-center gap-2 text-sm font-bold text-gray-300 relative z-10"><Sparkles className="w-4 h-4 text-pink-400" /> 60+ Effects</div>
              <div className="hidden md:block w-px h-6 bg-white/10 relative z-10" />
              <div className="flex items-center gap-2 text-sm font-bold text-gray-300 relative z-10"><Globe className="w-4 h-4 text-fuchsia-400" /> Cloud Processing</div>
              <div className="hidden lg:block w-px h-6 bg-white/10 relative z-10" />
              <div className="hidden lg:flex items-center gap-2 text-sm font-bold text-gray-300 relative z-10"><ShieldCheck className="w-4 h-4 text-green-400" /> No Watermark</div>
            </div>
          </div>
        </section>

        {/* 2. SEE HOW IT WORKS (WORKFLOWS) */}
        <section id="how-it-works" className={`py-24 px-6 md:py-32 relative z-10 ${isDarkMode ? 'bg-gradient-to-b from-[#0B0A10] to-[#0B0815]' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 md:mb-24">
              <h2 className="text-4xl md:text-[clamp(2.5rem,5vw,3.5rem)] font-black mb-6 tracking-tight">See How VEYTRIX Works</h2>
              <p className="text-xl opacity-70 max-w-2xl mx-auto font-medium">Four powerful AI workflows designed for creators, editors, brands, and cinematic content production.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              {workflows.map((workflow) => (
                <motion.div
                  key={workflow.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setActiveWorkflowModal(workflow.id)}
                  className={`cursor-pointer p-8 md:p-10 rounded-[24px] border transition-all duration-300 ${isDarkMode
                    ? `bg-[#130E24] border-fuchsia-500/20 hover:bg-[#1A1333] hover:${workflow.borderColor} hover:${workflow.glowColor}`
                    : 'bg-white border-black/5 hover:bg-gray-50 hover:shadow-xl'
                    }`}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex flex-col items-center text-center mb-6">
                      <div className={`w-20 h-20 rounded-[20px] mb-6 flex items-center justify-center text-4xl text-white bg-gradient-to-br ${workflow.color} shadow-lg ${workflow.glowColor}`}>
                        {workflow.icon}
                      </div>
                      <h3 className="text-2xl font-black mb-3">{workflow.title}</h3>
                      <p className="opacity-70 font-medium text-[13px] md:text-sm leading-relaxed max-w-md">{workflow.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-3 mb-8">
                      {workflow.features.map(feature => (
                        <div key={feature} className="flex items-start gap-2 text-xs font-medium opacity-80">
                          <CheckCircleOutlined className={`mt-0.5 ${isDarkMode ? 'text-fuchsia-400' : 'text-fuchsia-600'}`} />
                          <span className="leading-tight text-left">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8 mt-auto justify-center">
                      {workflow.indicators.map(indicator => (
                        <span key={indicator} className={`text-[10px] md:text-[11px] font-bold px-3 py-1.5 rounded-full ${isDarkMode ? 'bg-white/10 text-white/90' : 'bg-black/5 text-black/80'}`}>
                          {indicator}
                        </span>
                      ))}
                    </div>

                    <div className={`pt-6 border-t flex items-center justify-between group ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}>
                      <div className="font-bold text-sm flex items-center gap-2 group-hover:text-fuchsia-500 transition-colors">
                        Try Now <ArrowRightOutlined className="transform group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className={`w-16 h-10 rounded-lg flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform ${isDarkMode ? 'bg-black/40' : 'bg-gray-200'}`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${workflow.color} opacity-20`} />
                        <PlayCircleOutlined className="text-lg relative z-10" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 2b. PROCESS SECTION */}
        <section id="process" className={`py-32 px-6 relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-b from-[#130E24] to-[#0B0815]' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-24">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">From Prompt To Viral Content</h2>
                <p className="text-xl opacity-70 max-w-2xl mx-auto">
                  Create professional videos with AI-powered generation, editing, motion control, and cinematic optimization.
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-8 relative">
              {/* Connecting Line for Desktop */}
              <div className="hidden lg:block absolute top-24 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-fuchsia-500/0 via-fuchsia-500/30 to-fuchsia-500/0 z-0">
                <motion.div
                  className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent opacity-50"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>

              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                whileHover={{ y: -5 }}
                className={`relative z-10 p-10 rounded-3xl border transition-all ${isDarkMode ? 'bg-[#130E24] border-fuchsia-500/20 shadow-[0_8px_30px_rgb(168,85,247,0.1)] hover:bg-[#1A1333]' : 'bg-white border-black/5 hover:bg-gray-50'}`}
              >
                <div className="absolute -top-5 left-10 px-5 py-2 bg-gradient-to-r from-blue-600 to-fuchsia-600 rounded-full text-white text-sm font-black tracking-widest shadow-lg uppercase">
                  Step 01
                </div>
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl text-white bg-gradient-to-br from-blue-500 to-fuchsia-600 mb-8 mt-2 shadow-xl shadow-blue-500/20">
                  <BulbOutlined />
                </div>
                <h3 className="text-2xl font-bold mb-4">Describe Your Vision</h3>
                <p className="opacity-70 text-lg leading-relaxed">
                  Use prompts, images, or reference videos to guide the AI.
                </p>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                whileHover={{ y: -5 }}
                className={`relative z-10 p-10 rounded-3xl border transition-all ${isDarkMode ? 'bg-[#130E24] border-fuchsia-500/20 shadow-[0_8px_30px_rgb(249,115,22,0.1)] hover:bg-[#1A1333]' : 'bg-white border-black/5 hover:bg-gray-50'}`}
              >
                <div className="absolute -top-5 left-10 px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full text-white text-sm font-black tracking-widest shadow-lg uppercase">
                  Step 02
                </div>
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl text-white bg-gradient-to-br from-orange-500 to-amber-500 mb-8 mt-2 shadow-xl shadow-orange-500/20">
                  <SlidersOutlined />
                </div>
                <h3 className="text-2xl font-bold mb-4">Generate & Fine-Tune</h3>
                <p className="opacity-70 text-lg leading-relaxed">
                  AI creates cinematic edits while you customize every detail with smart controls.
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}
                whileHover={{ y: -5 }}
                className={`relative z-10 p-10 rounded-3xl border transition-all ${isDarkMode ? 'bg-[#130E24] border-fuchsia-500/20 shadow-[0_8px_30px_rgb(20,184,166,0.1)] hover:bg-[#1A1333]' : 'bg-white border-black/5 hover:bg-gray-50'}`}
              >
                <div className="absolute -top-5 left-10 px-5 py-2 bg-gradient-to-r from-emerald-500 to-fuchsia-500 rounded-full text-white text-sm font-black tracking-widest shadow-lg uppercase">
                  Step 03
                </div>
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl text-white bg-gradient-to-br from-emerald-500 to-fuchsia-500 mb-8 mt-2 shadow-xl shadow-fuchsia-500/20">
                  <CloudDownloadOutlined />
                </div>
                <h3 className="text-2xl font-bold mb-4">Export In Studio Quality</h3>
                <p className="opacity-70 text-lg leading-relaxed">
                  Download optimized videos ready for every platform instantly.
                </p>
              </motion.div>
            </div>
          </div>
        </section>


        {/* 3. FEATURE GRID */}
        <section id="features" className={`py-24 px-6 ${isDarkMode ? 'bg-gradient-to-b from-[#130E24] to-[#0B0815]' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Everything Creators Need</h2>
              <p className="text-xl opacity-70 max-w-2xl mx-auto">
                The ultimate AI-powered toolset designed to accelerate your video creation workflow while maintaining cinema-grade quality.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <PlayCircleOutlined />, title: "AI Auto Editing", desc: "Smart cuts, automatically", color: "from-blue-500 to-purple-500" },
                { icon: <ScissorOutlined />, title: "Smart Scene Cuts", desc: "AI detects the best moments", color: "from-fuchsia-500 to-pink-500" },
                { icon: <MessageOutlined />, title: "Auto Captions", desc: "Generate captions in seconds", color: "from-orange-500 to-red-500" },
                { icon: <AudioOutlined />, title: "Beat Sync Editing", desc: "Perfect cuts, perfectly timed", color: "from-green-500 to-emerald-500" },
                { icon: <BgColorsOutlined />, title: "AI Color Grading", desc: "Cinema-grade colors instantly", color: "from-pink-500 to-rose-500" },
                { icon: <ThunderboltOutlined />, title: "Fast Rendering", desc: "10x faster exports", color: "from-yellow-500 to-orange-500" },
                { icon: <MobileOutlined />, title: "Reels & Shorts Format", desc: "Ready for every platform", color: "from-purple-500 to-fuchsia-500" },
                { icon: <SoundOutlined />, title: "Noise Removal", desc: "Crystal clear audio", color: "from-purple-500 to-blue-500" },
                { icon: <BulbOutlined />, title: "AI Highlight Detection", desc: "Find your best moments", color: "from-fuchsia-500 to-pink-500" }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className={`p-8 rounded-3xl border transition-all cursor-default ${isDarkMode
                    ? 'bg-[#130E24] border-fuchsia-500/20 hover:bg-[#1A1333] hover:shadow-[0_8px_30px_rgb(168,85,247,0.15)]'
                    : 'bg-white border-black/5 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)]'
                    }`}
                >
                  <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center text-3xl text-white bg-gradient-to-br ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="opacity-70 font-medium text-lg leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. PERFORMANCE SECTION */}
        <section id="performance" className={`py-40 px-6 relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-b from-[#130E24] to-[#0B0815]' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-tight mb-4 tracking-tight">Built For <span className="text-fuchsia-500">Speed & Scale</span></h2>
                <p className="text-xl opacity-70">
                  Performance that keeps up with your creativity
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 10x Faster Rendering */}
              <motion.div whileHover={{ scale: 1.02 }} className={`p-8 rounded-3xl border transition-all ${isDarkMode ? 'bg-[#130E24] border-fuchsia-500/20 hover:bg-[#1A1333]' : 'bg-white border-black/5'} col-span-1 md:col-span-2 lg:col-span-2 shadow-2xl shadow-purple-900/20`}>
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl text-white bg-gradient-to-br from-fuchsia-500 to-purple-500 shrink-0">
                    <ThunderboltOutlined />
                  </div>
                  <div className="w-full">
                    <h3 className="text-2xl font-bold mb-2">10x Faster Rendering</h3>
                    <p className="opacity-70 font-medium text-lg mb-6">Render minutes in seconds</p>
                    <div className="space-y-4 w-full">
                      <div>
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 opacity-60"><span>Traditional Editor</span><span>10 mins</span></div>
                        <Progress percent={10} showInfo={false} strokeColor="#4b5563" railColor={isDarkMode ? '#374151' : '#e5e7eb'} size={["100%", 12]} />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 text-fuchsia-400"><span>Veytrix.AI</span><span>1 min</span></div>
                        <Progress percent={100} showInfo={false} strokeColor={{ '0%': '#a855f7', '100%': '#A855F7' }} railColor={isDarkMode ? '#374151' : '#e5e7eb'} status="active" size={["100%", 12]} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 95% Editing Automation */}
              <motion.div whileHover={{ scale: 1.02 }} className={`p-8 rounded-3xl border transition-all flex flex-col items-center text-center justify-center ${isDarkMode ? 'bg-[#130E24] border-fuchsia-500/20 hover:bg-[#1A1333]' : 'bg-white border-black/5'} shadow-2xl shadow-blue-900/20`}>
                <Progress type="circle" percent={95} size={150} strokeColor={{ '0%': '#3b82f6', '100%': '#06b6d4' }} format={(p) => <span className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>{p}%</span>} />
                <h3 className="text-2xl font-bold mt-6 mb-2">Editing Automation</h3>
                <p className="opacity-70 font-medium text-lg">Automated editing tasks</p>
              </motion.div>

              {/* Export in 4K */}
              <motion.div whileHover={{ scale: 1.02 }} className={`p-8 rounded-3xl border transition-all ${isDarkMode ? 'bg-[#130E24] border-fuchsia-500/20 hover:bg-[#1A1333]' : 'bg-white border-black/5'} shadow-xl`}>
                <div className="w-14 h-14 rounded-2xl mb-6 flex items-center justify-center text-3xl text-white bg-gradient-to-br from-pink-500 to-rose-500">
                  <SafetyCertificateOutlined />
                </div>
                <h3 className="text-xl font-bold mb-2">Export in 4K</h3>
                <p className="opacity-70 font-medium">Lossless quality export</p>
              </motion.div>

              {/* Under 30s AI Processing */}
              <motion.div whileHover={{ scale: 1.02 }} className={`p-8 rounded-3xl border transition-all ${isDarkMode ? 'bg-[#130E24] border-fuchsia-500/20 hover:bg-[#1A1333]' : 'bg-white border-black/5'} shadow-xl`}>
                <div className="w-14 h-14 rounded-2xl mb-6 flex items-center justify-center text-3xl text-white bg-gradient-to-br from-amber-500 to-orange-500">
                  <FieldTimeOutlined />
                </div>
                <h3 className="text-xl font-bold mb-2">&lt; 30s AI Processing</h3>
                <p className="opacity-70 font-medium">AI processes in seconds</p>
              </motion.div>

              {/* 99.9% Uptime */}
              <motion.div whileHover={{ scale: 1.02 }} className={`p-8 rounded-3xl border transition-all ${isDarkMode ? 'bg-[#130E24] border-fuchsia-500/20 hover:bg-[#1A1333]' : 'bg-white border-black/5'} shadow-xl`}>
                <div className="w-14 h-14 rounded-2xl mb-6 flex items-center justify-center text-3xl text-white bg-gradient-to-br from-emerald-500 to-fuchsia-500">
                  <CloudServerOutlined />
                </div>
                <h3 className="text-xl font-bold mb-2">99.9% Uptime</h3>
                <p className="opacity-70 font-medium">Reliable cloud infrastructure</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 4.5 AI TOOLS MODAL */}
        <Modal
          open={isAIToolsModalOpen}
          onCancel={() => setIsAIToolsModalOpen(false)}
          footer={null}
          width={1000}
          centered
          styles={{
            body: {
              backgroundColor: isDarkMode ? '#0B0815' : 'white',
              padding: '24px 20px',
              overflow: 'hidden',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.05)'
            }
          }}
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent"></div>

          <div className="max-w-5xl mx-auto relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-6">
              <h2 className="text-3xl font-black mb-2 leading-tight text-white drop-shadow-lg">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">AI Tools</span>
              </h2>
              <p className="text-[15px] opacity-70 max-w-2xl mx-auto leading-relaxed">
                Powerful AI-powered creative tools built to generate, edit, and enhance cinematic videos in seconds.
              </p>
            </motion.div>

            <Row gutter={[16, 16]} justify="center" className="mb-6">
              {[
                {
                  title: 'AI Video Generation',
                  desc: 'Generate stunning cinematic videos from simple text prompts using advanced AI models.',
                  features: ['Text to Video', 'Cinematic Camera Motion', 'AI Scene Creation', 'HD & 4K Ready', 'Fast Cloud Rendering'],
                  icon: <VideoCameraOutlined className="text-2xl text-fuchsia-400" />
                },
                {
                  title: 'Reference Video Editing',
                  desc: 'Upload a reference video and recreate its visual style, motion, composition, and atmosphere using AI.',
                  features: ['Style Transfer', 'Motion Reference', 'Cinematic Recreation', 'AI Guided Editing', 'Visual Consistency'],
                  icon: <CopyOutlined className="text-2xl text-purple-400" />
                },
                {
                  title: 'Image to Video',
                  desc: 'Transform static images into dynamic videos with realistic movement and cinematic animation.',
                  features: ['Camera Zoom', 'Object Motion', 'AI Animation', 'Smooth Transitions', 'Social Media Ready'],
                  icon: <FileImageOutlined className="text-2xl text-fuchsia-400" />
                },
                {
                  title: 'AI Manual Edit',
                  desc: 'Professional editing studio with AI-assisted controls for creators.',
                  features: ['Premium Effects', 'Cinematic Filters', 'Advanced Transitions', 'Motion Tracking', 'Speed Control', 'AI Enhancement', 'Professional Timeline Editing'],
                  icon: <SlidersOutlined className="text-2xl text-purple-400" />
                }
              ].map((tool, i) => (
                <Col xs={24} md={12} key={i}>
                  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="h-full">
                    <div className="h-full rounded-[1.5rem] p-5 border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-lg hover:border-fuchsia-500/30 hover:bg-white/[0.05] transition-all duration-300 transform hover:-translate-y-[3px] hover:shadow-[0_15px_40px_rgba(168,85,247,0.15)] group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-fuchsia-500/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      <div className="bg-[#1A1528] w-10 h-10 rounded-lg flex items-center justify-center mb-3 shadow-lg border border-white/10 group-hover:border-fuchsia-500/50 transition-colors">
                        {tool.icon}
                      </div>
                      <h3 className="text-lg font-bold mb-1 text-white group-hover:text-fuchsia-300 transition-colors">{tool.title}</h3>
                      <p className="text-[13px] opacity-70 mb-3 leading-snug min-h-[36px]">{tool.desc}</p>

                      <div className="space-y-1.5">
                        {tool.features.map((feature, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500/80 shrink-0"></div>
                            <span className="text-xs font-medium opacity-90">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </Col>
              ))}
            </Row>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="max-w-4xl mx-auto rounded-[1.5rem] border border-white/10 bg-[#1A1528]/80 backdrop-blur-xl p-5 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/10 to-purple-600/10 pointer-events-none" />
              <h3 className="text-lg font-black text-center mb-4 relative z-10 text-white drop-shadow-md">Why choose VEYTRIX.AI?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 relative z-10">
                {['AI-powered rendering', 'Cinematic quality output', 'Lightning fast generation', 'Cloud processing', 'Commercial usage', 'Premium editing suite', '4K export support', 'Secure encrypted storage', 'Modern creator workflow'].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircleOutlined className="text-fuchsia-400 text-sm" />
                    <span className="font-medium text-xs opacity-90">{benefit}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </Modal>

        <PricingSection isDarkMode={isDarkMode} fadeInUp={fadeInUp} />

        {/* 5.5 FAQ */}
        <section id="faq" className={`py-32 px-6 relative overflow-hidden ${isDarkMode ? 'bg-[#0B0815]' : 'bg-white'}`}>
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
          <div className="absolute right-0 top-1/4 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-black mb-4 leading-tight text-white drop-shadow-lg">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">Frequently Asked Questions</span>
              </h2>
              <p className="text-xl opacity-70 max-w-3xl mx-auto leading-relaxed">
                Everything you need to know before creating with VEYTRIX.AI.
              </p>
            </motion.div>

            <FAQAccordion />
          </div>
        </section>

        {/* 6. CTA ABOVE FOOTER */}
        <section className={`py-24 px-6 border-t ${isDarkMode ? 'bg-gradient-to-b from-[#130E24] to-[#0B0815] border-white/5' : 'bg-gradient-to-b from-gray-50 to-white border-black/5'}`}>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Ready To Create Viral Videos With AI?</h2>
            <p className="text-xl opacity-70 mb-10 max-w-2xl mx-auto">
              Generate, edit, and export cinematic content in minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button onClick={handleStartFree} type="primary" size="large" shape="round" className="h-14 px-10 text-lg font-bold bg-fuchsia-600 hover:bg-fuchsia-500 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all border-none">
                Start Free
              </Button>
              <Button size="large" shape="round" className={`h-14 px-10 text-lg font-bold transition-all ${isDarkMode ? 'bg-transparent border-white/20 text-white hover:border-white/50 hover:bg-white/5' : ''}`}>
                Watch Demo
              </Button>
            </div>
          </div>
        </section>

        {/* 7. NEW FOOTER */}
        <footer className={`pt-20 pb-8 px-6 border-t ${isDarkMode ? 'border-white/10 bg-[#0B0815]' : 'border-black/10 bg-white'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

              {/* Left Column (25%) */}
              <div className="md:col-span-3 flex flex-col gap-4">
                <div className="flex items-center gap-3 font-black text-2xl tracking-tighter">
                  <ThunderboltOutlined className="text-fuchsia-500" /> VEYTRIX.AI
                </div>
                <p className="opacity-70 text-sm leading-relaxed">
                  The all-in-one AI platform for video generation, image animation, reference editing, and manual video enhancement.
                </p>
                <div className="mt-auto pt-4 opacity-50 text-xs">
                  <p>© 2024 VEYTRIX. All rights reserved.</p>
                  <p className="mt-1 opacity-60">Built for creators, agencies, and brands.</p>
                </div>
              </div>

              {/* Center Column (40%) */}
              <div className="md:col-span-5 grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold mb-6 text-lg">Quick Links</h4>
                  <ul className="space-y-4 text-sm opacity-70">
                    <li><a href="#features" className="hover:text-fuchsia-500 transition-colors block">Features</a></li>
                    <li><a href="#pricing" className="hover:text-fuchsia-500 transition-colors block">Pricing</a></li>
                    <li><a href="#how-it-works" className="hover:text-fuchsia-500 transition-colors block">Workflow</a></li>
                    <li><button onClick={(e) => { e.preventDefault(); setIsAIToolsModalOpen(true); }} className="hover:text-fuchsia-500 transition-colors block text-left w-full cursor-pointer bg-transparent border-none p-0 m-0 font-inherit text-inherit">AI Tools</button></li>
                    <li><a href="#faq" className="hover:text-fuchsia-500 transition-colors block">FAQ</a></li>
                    <li><a href="#" className="hover:text-fuchsia-500 transition-colors block">Contact</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-6 text-lg">AI Tools</h4>
                  <ul className="space-y-4 text-sm opacity-70">
                    <li><button onClick={(e) => { e.preventDefault(); setActiveWorkflowModal(1); }} className="hover:text-fuchsia-500 transition-colors block text-left cursor-pointer bg-transparent border-none p-0 m-0 font-inherit text-inherit">AI Video Generation</button></li>
                    <li><button onClick={(e) => { e.preventDefault(); setActiveWorkflowModal(2); }} className="hover:text-fuchsia-500 transition-colors block text-left cursor-pointer bg-transparent border-none p-0 m-0 font-inherit text-inherit">Reference Video Editing</button></li>
                    <li><button onClick={(e) => { e.preventDefault(); setActiveWorkflowModal(3); }} className="hover:text-fuchsia-500 transition-colors block text-left cursor-pointer bg-transparent border-none p-0 m-0 font-inherit text-inherit">Image to Video</button></li>
                    <li><button onClick={(e) => { e.preventDefault(); setActiveWorkflowModal(4); }} className="hover:text-fuchsia-500 transition-colors block text-left cursor-pointer bg-transparent border-none p-0 m-0 font-inherit text-inherit">AI Manual Edit</button></li>
                  </ul>
                </div>
              </div>

              {/* Right Column (35%) */}
              <div className="md:col-span-4 flex flex-col md:items-end gap-6 text-left md:text-right">


                <Button onClick={handleStartFree} type="primary" shape="round" className="h-12 px-8 font-bold bg-fuchsia-600 hover:bg-fuchsia-500 shadow-[0_0_15px_rgba(147,51,234,0.2)] hover:shadow-[0_0_25px_rgba(147,51,234,0.4)] transition-all w-fit border-none">
                  Start Free Trial
                </Button>

                <div className="flex items-center justify-start md:justify-end gap-5 text-2xl opacity-60 mt-2">
                  <a href="#" className="hover:text-fuchsia-500 hover:opacity-100 hover:scale-110 hover:shadow-[0_0_10px_rgba(147,51,234,0.5)] rounded-full transition-all"><GithubOutlined /></a>
                  <a href="#" className="hover:text-fuchsia-500 hover:opacity-100 hover:scale-110 hover:shadow-[0_0_10px_rgba(147,51,234,0.5)] rounded-full transition-all"><TwitterOutlined /></a>
                  <a href="#" className="hover:text-fuchsia-500 hover:opacity-100 hover:scale-110 hover:shadow-[0_0_10px_rgba(147,51,234,0.5)] rounded-full transition-all"><DiscordOutlined /></a>
                </div>

                <div className="flex flex-wrap justify-start md:justify-end items-center gap-x-4 gap-y-2 text-[10px] opacity-40 mt-4 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1"><CheckCircleOutlined /> 4K Export</span>
                  <span className="flex items-center gap-1"><CheckCircleOutlined /> AI Powered</span>
                  <span className="flex items-center gap-1"><CheckCircleOutlined /> Fast Rendering</span>
                  <span className="flex items-center gap-1"><CheckCircleOutlined /> Creator Friendly</span>
                </div>
              </div>
            </div>

            {/* Bottom Row - Legal */}
            <div className={`pt-8 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 text-xs opacity-50 border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveLegalModal('privacy'); }} className="hover:text-fuchsia-500 transition-colors cursor-pointer">Privacy Policy</a>
              <span className="hidden sm:inline">•</span>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveLegalModal('terms'); }} className="hover:text-fuchsia-500 transition-colors cursor-pointer">Terms of Service</a>
              <span className="hidden sm:inline">•</span>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveLegalModal('refund'); }} className="hover:text-fuchsia-500 transition-colors cursor-pointer">Refund Policy</a>
              <span className="hidden sm:inline">•</span>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveLegalModal('acceptable'); }} className="hover:text-fuchsia-500 transition-colors cursor-pointer">Acceptable Use Policy</a>
              <span className="hidden sm:inline">•</span>
              <a href="#" className="hover:text-fuchsia-500 transition-colors">Contact Us</a>
            </div>
          </div>
        </footer>

        {/* LEGAL MODALS */}
        <Modal
          title={null}
          open={!!activeLegalModal}
          onCancel={() => setActiveLegalModal(null)}
          footer={null}
          width={800}
          centered
          closeIcon={false}
          styles={{
            body: { padding: '40px', position: 'relative' },
            mask: { backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.6)' }
          }}
          className={isDarkMode ? 'dark-modal' : ''}
        >
          <button
            onClick={() => setActiveLegalModal(null)}
            className="absolute top-6 right-6 z-50 w-10 h-10 bg-black/10 dark:bg-white/10 rounded-full hover:bg-black/20 dark:hover:bg-white/20 transition-all text-gray-400 hover:text-white border-none cursor-pointer flex items-center justify-center"
          >
            <CloseOutlined className="text-xl" />
          </button>
          <div className="text-white max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
            <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" /></div>}>
              {activeLegalModal === 'privacy' && <PrivacyPolicyContent />}
              {activeLegalModal === 'terms' && <TermsOfServiceContent />}
              {activeLegalModal === 'refund' && <RefundPolicyContent />}
              {activeLegalModal === 'acceptable' && <AcceptableUsePolicyContent />}
            </Suspense>
          </div>
        </Modal>

        {/* WORKFLOW PREMIUM MODALS */}
        <AnimatePresence>
          {activeWorkflowModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={() => setActiveWorkflowModal(null)}
              />
              <div className="relative z-10 w-full max-w-[850px] mx-auto">
                <button
                  onClick={() => setActiveWorkflowModal(null)}
                  className="absolute top-6 right-6 z-[60] w-10 h-10 bg-black/10 dark:bg-white/10 rounded-full hover:bg-black/20 dark:hover:bg-white/20 transition-all text-gray-400 hover:text-white border-none cursor-pointer flex items-center justify-center"
                >
                  <CloseOutlined className="text-xl" />
                </button>
                {(() => {
                  const workflow = workflows.find(w => w.id === activeWorkflowModal);
                  if (!workflow) return null;

                  return (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="overflow-hidden rounded-[24px]">
                      {/* Header Banner */}
                      <div className={`p-10 relative overflow-hidden flex flex-col items-center text-center ${isDarkMode ? 'bg-[#1A1333]' : 'bg-gray-50'}`}>
                        <div className={`absolute inset-0 bg-gradient-to-b ${workflow.color} opacity-10`} />
                        <div className={`w-28 h-28 rounded-3xl flex items-center justify-center text-6xl text-white bg-gradient-to-br ${workflow.color} shadow-2xl mb-6 relative z-10`}>
                          {workflow.icon}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black mb-4 relative z-10">{workflow.title}</h2>
                        <p className="opacity-80 text-lg max-w-2xl mx-auto relative z-10 leading-relaxed">{workflow.description}</p>
                      </div>

                      {/* Content Area */}
                      <div className={`p-10 ${isDarkMode ? 'bg-[#130E24]' : 'bg-white'}`}>
                        <div className="grid md:grid-cols-2 gap-10 mb-10">
                          <div>
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">Core Features</h3>
                            <div className="space-y-4">
                              {workflow.features.map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                  <CheckCircleOutlined className={`mt-1 ${isDarkMode ? 'text-fuchsia-400' : 'text-fuchsia-600'}`} />
                                  <span className="font-medium opacity-80">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">Live Preview</h3>
                            {/* Mock Demo Player */}
                            <div className={`w-full aspect-video rounded-2xl flex items-center justify-center relative overflow-hidden group cursor-pointer border ${isDarkMode ? 'bg-black border-white/10' : 'bg-gray-900 border-black/10'}`}>
                              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity" />
                              <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 group-hover:scale-110 transition-transform relative z-10`}>
                                <PlayCircleOutlined className="text-3xl text-white" />
                              </div>
                              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-10 text-white/80 text-xs font-medium">
                                <span>0:00 / 0:15</span>
                                <div className="flex gap-2">
                                  <span className="px-2 py-1 bg-black/50 rounded backdrop-blur">4K</span>
                                  <span className="px-2 py-1 bg-black/50 rounded backdrop-blur">60fps</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <Button type="primary" size="large" shape="round" className="h-14 px-12 text-lg font-bold bg-fuchsia-500 hover:bg-fuchsia-600 shadow-[0_10px_30px_rgba(168,85,247,0.4)] border-0" onClick={() => { setActiveWorkflowModal(null); navigate('/video-type'); }}>
                            Try {workflow.title} Free
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* LOGIN MODAL */}
        <Suspense fallback={null}>
          <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </Suspense>
      </div>
    </ConfigProvider>
  );
}
