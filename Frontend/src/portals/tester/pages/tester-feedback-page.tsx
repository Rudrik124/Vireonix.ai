import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate, AnimatePresence } from "framer-motion";
import { 
  ThumbsUp, 
  MessageSquare, 
  AlertCircle, 
  Plus, 
  Lightbulb,
  ArrowLeft,
  Activity,
  Globe2,
  Lock,
  MessageCircle,
  TrendingUp,
  Cloud,
  Zap,
  Calendar,
  ChevronRight,
  Send,
  Loader
} from "lucide-react";

interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  category: "ux-issue" | "performance" | "feature-request" | "security";
  status: "under-review" | "planned" | "in-progress" | "declined";
  upvotes: number;
  userUpvoted: boolean;
  timestamp: string;
  replies?: number;
}

const particles = Array.from({ length: 40 });

// Animated Number Counter Component
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(Math.round(v))
    });
    return controls.stop;
  }, [value]);

  return <span>{displayValue}</span>;
}

export function TesterFeedbackPage() {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "feature-request" as const,
  });

  // Mouse Parallax for Ambient Lighting
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 100 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);
  
  const glowX = useTransform(smoothMouseX, [-1, 1], [-50, 50]);
  const glowY = useTransform(smoothMouseY, [-1, 1], [-50, 50]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) * 2 - 1);
      mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([
    {
      id: "FB-001",
      title: "Add side-by-side video comparison tool",
      description:
        "When comparing outputs from different builds, it would be helpful to see current vs previous generation side-by-side with play controls synced.",
      category: "feature-request",
      status: "planned",
      upvotes: 24,
      userUpvoted: true,
      timestamp: "2026-05-26",
      replies: 5,
    },
    {
      id: "FB-002",
      title: "Video generation times are inconsistent",
      description:
        "Same prompt and parameters sometimes generates in 30 seconds, sometimes 90 seconds. Would be useful to see processing queue status.",
      category: "performance",
      status: "under-review",
      upvotes: 18,
      userUpvoted: false,
      timestamp: "2026-05-25",
      replies: 3,
    },
    {
      id: "FB-003",
      title: "Dark mode for the dashboard",
      description: "The current dashboard is bright and can be tiring during long testing sessions. A dark theme option would be appreciated.",
      category: "ux-issue",
      status: "under-review",
      upvotes: 32,
      userUpvoted: false,
      timestamp: "2026-05-24",
      replies: 8,
    },
    {
      id: "FB-004",
      title: "Batch test execution",
      description: "Ability to run multiple test cases sequentially without manual intervention. Save time on repetitive test suites.",
      category: "feature-request",
      status: "in-progress",
      upvotes: 15,
      userUpvoted: false,
      timestamp: "2026-05-23",
      replies: 2,
    },
    {
      id: "FB-005",
      title: "API rate limiting during load tests",
      description: "When stress testing the API, we should have higher rate limits or be able to request temporary limit increases.",
      category: "security",
      status: "declined",
      upvotes: 7,
      userUpvoted: false,
      timestamp: "2026-05-20",
      replies: 1,
    },
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#050816] text-cyan-400 font-bold">
        <Loader className="w-8 h-8 animate-spin mr-3" /> Initializing Feedback Engine...
      </div>
    );
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  const categories = ["all", "feature-request", "ux-issue", "performance", "security"];
  const statuses = ["all", "under-review", "planned", "in-progress", "declined"];

  const categoryLabels = {
    "feature-request": "💡 Feature Request",
    "ux-issue": "🎨 UX Issue",
    performance: "⚡ Performance",
    security: "🔒 Security",
  };

  const categoryColors = {
    "feature-request": "bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-blue-300 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]",
    "ux-issue": "bg-gradient-to-r from-purple-600/20 to-purple-500/10 text-purple-300 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]",
    performance: "bg-gradient-to-r from-orange-600/20 to-orange-500/10 text-orange-300 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]",
    security: "bg-gradient-to-r from-rose-600/20 to-rose-500/10 text-rose-300 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]",
  };

  const statusLabels = {
    "under-review": "🔍 Under Review",
    planned: "📋 Planned",
    "in-progress": "⚙️ In Progress",
    declined: "❌ Declined",
  };

  const statusColors = {
    "under-review": "bg-gradient-to-r from-yellow-600/20 to-yellow-500/10 text-yellow-300 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.15)]",
    planned: "bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-blue-300 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]",
    "in-progress": "bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    declined: "bg-gradient-to-r from-red-600/20 to-red-500/10 text-red-300 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert("Please fill in all fields");
      return;
    }

    const newFeedback: FeedbackItem = {
      id: `FB-${String(feedbackItems.length + 1).padStart(3, "0")}`,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      status: "under-review",
      upvotes: 0,
      userUpvoted: false,
      timestamp: new Date().toISOString().split("T")[0],
      replies: 0,
    };

    setFeedbackItems([newFeedback, ...feedbackItems]);
    setFormData({
      title: "",
      description: "",
      category: "feature-request",
    });
    setShowForm(false);
  };

  const toggleUpvote = (id: string) => {
    setFeedbackItems(
      feedbackItems.map((item) =>
        item.id === id
          ? {
              ...item,
              upvotes: item.userUpvoted ? item.upvotes - 1 : item.upvotes + 1,
              userUpvoted: !item.userUpvoted,
            }
          : item
      )
    );
  };

  let filtered = feedbackItems.filter((item) => {
    const categoryMatch = filterCategory === "all" || item.category === filterCategory;
    const statusMatch = filterStatus === "all" || item.status === filterStatus;
    return categoryMatch && statusMatch;
  });

  if (sortBy === "popular") {
    filtered = [...filtered].sort((a, b) => b.upvotes - a.upvotes);
  }

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-[#050816] font-sans selection:bg-cyan-500/30 selection:text-white text-slate-200 pb-16">
      
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay bg-[url('/noise.svg')]" />
        
        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vh] bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.22),transparent_35%)]" 
          />
          <motion.div 
            animate={{ rotate: -360, scale: [1, 1.2, 1] }} transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] -right-[10%] w-[80vw] h-[80vh] bg-[radial-gradient(circle_at_80%_70%,rgba(6,182,212,0.18),transparent_40%)]" 
          />
          <motion.div 
            animate={{ rotate: 180, scale: [1, 1.15, 1] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute top-[20%] left-[20%] w-[60vw] h-[60vh] bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.12),transparent_55%)]" 
          />
        </div>

        {/* Ambient Light Blobs */}
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-purple-600/12 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-blue-600/12 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-cyan-600/12 rounded-full blur-[100px] mix-blend-screen" />

        {/* Mouse Follow Ambient Glow */}
        <motion.div 
          style={{ x: glowX, y: glowY, background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, rgba(124,58,237,0.5) 100%)' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[90px] opacity-15 pointer-events-none"
        />

        {/* Floating Particles */}
        {particles.map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full blur-[1px] ${i % 3 === 0 ? 'bg-cyan-400/20' : i % 3 === 1 ? 'bg-purple-400/20' : 'bg-blue-400/20'}`}
            style={{
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              left: `${Math.random() * 100}vw`,
              top: `${Math.random() * 100}vh`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 15 - 7.5, 0],
              opacity: [0.04, 0.12, 0.04],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Floating Decorative Labels */}
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[25%] left-[5%] opacity-30 pointer-events-none">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><MessageCircle className="w-3 h-3 text-cyan-400" /> Community Ideas</div>
        </motion.div>
        <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[45%] right-[5%] opacity-30 pointer-events-none">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><TrendingUp className="w-3 h-3 text-purple-400" /> Live Voting</div>
        </motion.div>
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[20%] left-[8%] opacity-30 pointer-events-none">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><Zap className="w-3 h-3 text-blue-400" /> AI Roadmap</div>
        </motion.div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        
        {/* Navigation & Action Buttons */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <button
              onClick={() => navigate("/tester/dashboard")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] border border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] text-sm font-bold text-slate-300 hover:text-white hover:-translate-y-1 hover:scale-105 transition-all group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-cyan-400" /> Back
            </button>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="group/btn relative overflow-hidden flex items-center gap-2 px-6 py-2.5 rounded-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] border border-white/10 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] text-sm font-bold text-white hover:-translate-y-1 hover:scale-105 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              <Plus className="w-4 h-4 text-purple-400 group-hover/btn:rotate-90 transition-transform" />
              <span className="relative z-10">SUBMIT FEEDBACK</span>
            </button>
          </motion.div>
        </div>

        {/* Hero Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-black tracking-[0.2em] text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-4 py-1.5 rounded-full mb-6 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <Lightbulb className="w-4 h-4" /> 💡 AI FEEDBACK HUB
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] tracking-tight">
            COMMUNITY IDEAS & REQUESTS
          </h1>
          <p className="text-lg text-white/72 max-w-2xl font-medium mb-8">
            Collect ideas, track product improvements and collaborate with the AI development team.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-emerald-500/30 text-xs font-bold text-emerald-300 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Team Online
            </motion.div>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-cyan-500/30 text-xs font-bold text-cyan-300 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <Activity className="w-3 h-3" /> Live Feedback
            </motion.div>
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-purple-500/30 text-xs font-bold text-purple-300 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <TrendingUp className="w-3 h-3" /> Roadmap Active
            </motion.div>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-blue-500/30 text-xs font-bold text-blue-300 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <Globe2 className="w-3 h-3" /> Community Driven
            </motion.div>
          </div>
        </motion.div>

        {/* Top Status Banner */}
        <div className="w-full flex items-center justify-center mb-10">
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 text-xs font-mono font-bold tracking-widest text-slate-400 border border-white/5 bg-[rgba(18,22,40,0.65)] backdrop-blur-md px-6 py-2.5 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.1)]"
          >
            <span className="hidden sm:inline opacity-50">━━━━━━━━━━━━</span>
            <span className="flex items-center gap-2 text-emerald-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Feedback System Online</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="text-cyan-400">{feedbackItems.length} Suggestions</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="text-purple-400 flex items-center gap-1">Live Voting Enabled</span>
            <span className="hidden sm:inline opacity-50">━━━━━━━━━━━━</span>
          </motion.div>
        </div>

        {/* Submission Form Overlay */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-10"
            >
              <div className="relative p-[1px] rounded-[24px] overflow-hidden group/form">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-cyan-500 to-blue-500 opacity-30 group-hover/form:opacity-50 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
                <div className="relative bg-[#0B1020]/95 backdrop-blur-[24px] p-8 rounded-[23px] border border-white/[0.08] shadow-[0_0_50px_rgba(139,92,246,0.15)]">
                  <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2 tracking-tight">
                    <Plus className="w-6 h-6 text-cyan-400" /> NEW FEEDBACK
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-2">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] outline-none transition-all appearance-none"
                      >
                        {categories.slice(1).map((cat) => (
                          <option key={cat} value={cat} className="bg-[#0B1020] text-white">
                            {categoryLabels[cat as keyof typeof categoryLabels]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-2">Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="What's your idea?"
                        className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] outline-none transition-all font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-2">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Provide details. What is the issue? Why is it important? Do you have suggestions?"
                        className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] outline-none transition-all h-32 resize-none custom-scrollbar font-medium"
                        required
                      />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-white/5">
                      <button
                        type="submit"
                        className="group/submit relative overflow-hidden flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] text-sm font-black text-white transition-all hover:scale-105"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/submit:animate-[shimmer_1.5s_infinite]" />
                        <Send className="w-4 h-4 group-hover/submit:translate-x-1 group-hover/submit:-translate-y-1 transition-transform" />
                        <span className="relative z-10">SUBMIT TO SYSTEM</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-sm font-bold transition-all hover:text-white"
                      >
                        CANCEL
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters & Sorting */}
        <div className="mb-10 flex flex-wrap gap-4 items-center">
          <div className="relative group/select">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="appearance-none pl-6 pr-10 py-3 rounded-full bg-[rgba(18,22,40,0.65)] backdrop-blur-md border border-white/10 text-white text-sm font-bold outline-none cursor-pointer hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-[#0B1020] text-white">
                  {cat === "all" ? "ALL CATEGORIES" : categoryLabels[cat as keyof typeof categoryLabels].toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 pointer-events-none rotate-90" />
          </div>

          <div className="relative group/select">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pl-6 pr-10 py-3 rounded-full bg-[rgba(18,22,40,0.65)] backdrop-blur-md border border-white/10 text-white text-sm font-bold outline-none cursor-pointer hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all"
            >
              {statuses.map((status) => (
                <option key={status} value={status} className="bg-[#0B1020] text-white">
                  {status === "all" ? "ALL STATUS" : statusLabels[status as keyof typeof statusLabels].toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none rotate-90" />
          </div>

          <div className="relative group/select ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none pl-6 pr-10 py-3 rounded-full bg-[rgba(18,22,40,0.65)] backdrop-blur-md border border-white/10 text-white text-sm font-bold outline-none cursor-pointer hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all"
            >
              <option value="recent" className="bg-[#0B1020] text-white">MOST RECENT</option>
              <option value="popular" className="bg-[#0B1020] text-white">MOST UPVOTES</option>
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none rotate-90" />
          </div>
        </div>

        {/* Feedback Grid */}
        <div className="grid grid-cols-1 gap-6 mb-12">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[rgba(18,22,40,0.65)] backdrop-blur-md border border-white/10 p-12 rounded-[24px] text-center shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <AlertCircle className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
                <p className="text-white/70 font-medium text-lg">No feedback items match your current filters.</p>
              </motion.div>
            ) : (
              filtered.map((item, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  key={item.id}
                  className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.01]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/40 via-cyan-500/40 to-blue-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] border border-white/[0.08] group-hover:border-cyan-500/30 group-hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] p-6 md:p-8 flex flex-col md:flex-row gap-6 transition-all group-hover:bg-[rgba(22,26,45,0.8)]">
                    
                    {/* Upvote Column (Left) */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-start gap-2">
                      <button
                        onClick={() => toggleUpvote(item.id)}
                        className={`group/upvote relative w-16 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:scale-110 hover:-translate-y-1 overflow-hidden border ${
                          item.userUpvoted
                            ? "bg-gradient-to-b from-cyan-500/20 to-blue-600/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                            : "bg-white/5 border-white/10 hover:border-purple-500/40"
                        }`}
                      >
                        <ThumbsUp className={`w-6 h-6 transition-transform group-hover/upvote:scale-110 group-hover/upvote:-translate-y-0.5 ${item.userUpvoted ? "text-cyan-400 fill-cyan-400/20" : "text-slate-400"}`} />
                        <span className={`font-black text-lg ${item.userUpvoted ? "text-white" : "text-slate-300"}`}>
                          {item.upvotes}
                        </span>
                      </button>
                    </div>

                    {/* Content Column (Right) */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm transition-colors ${categoryColors[item.category]}`}>
                          {categoryLabels[item.category]}
                        </span>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm transition-colors ${statusColors[item.status]}`}>
                          {statusLabels[item.status]}
                        </span>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-3 tracking-tight group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-cyan-200 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                        {item.title}
                      </h3>
                      <p className="text-[rgba(255,255,255,0.78)] leading-relaxed mb-6 font-medium text-[15px]">
                        {item.description}
                      </p>

                      <div className="mt-auto flex flex-wrap justify-between items-center pt-4 border-t border-white/5">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
                            <Calendar className="w-3 h-3" /> {item.timestamp}
                          </span>
                          {item.replies !== undefined && item.replies > 0 && (
                            <span className="flex items-center gap-2 text-xs font-bold text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20">
                              <MessageSquare className="w-3 h-3" /> {item.replies} Replies
                            </span>
                          )}
                        </div>
                        
                        <button className="group/view flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 text-sm font-bold text-cyan-300 transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:from-blue-600/40 hover:to-cyan-600/40">
                          VIEW <ArrowLeft className="w-4 h-4 rotate-180 group-hover/view:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>

                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Stats & Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Summary KPI Cards */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <div className="relative p-[1px] rounded-[24px] overflow-hidden group/kpi">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-transparent opacity-0 group-hover/kpi:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] p-6 rounded-[23px] border border-white/[0.08] flex flex-col justify-between group-hover/kpi:-translate-y-1 transition-all group-hover/kpi:shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-blue-400" /> Requests</p>
                <p className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                  <AnimatedNumber value={feedbackItems.filter((f) => f.category === "feature-request").length} />
                </p>
              </div>
            </div>
            
            <div className="relative p-[1px] rounded-[24px] overflow-hidden group/kpi">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-transparent opacity-0 group-hover/kpi:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] p-6 rounded-[23px] border border-white/[0.08] flex flex-col justify-between group-hover/kpi:-translate-y-1 transition-all group-hover/kpi:shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-purple-400" /> UX Issues</p>
                <p className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                  <AnimatedNumber value={feedbackItems.filter((f) => f.category === "ux-issue").length} />
                </p>
              </div>
            </div>

            <div className="relative p-[1px] rounded-[24px] overflow-hidden group/kpi">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-transparent opacity-0 group-hover/kpi:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] p-6 rounded-[23px] border border-white/[0.08] flex flex-col justify-between group-hover/kpi:-translate-y-1 transition-all group-hover/kpi:shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> In Progress</p>
                <p className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                  <AnimatedNumber value={feedbackItems.filter((f) => f.status === "in-progress").length} />
                </p>
              </div>
            </div>

            <div className="relative p-[1px] rounded-[24px] overflow-hidden group/kpi">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-transparent opacity-0 group-hover/kpi:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] p-6 rounded-[23px] border border-white/[0.08] flex flex-col justify-between group-hover/kpi:-translate-y-1 transition-all group-hover/kpi:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><ThumbsUp className="w-4 h-4 text-cyan-400" /> Total Upvotes</p>
                <p className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  <AnimatedNumber value={feedbackItems.reduce((sum, f) => sum + f.upvotes, 0)} />
                </p>
              </div>
            </div>
          </div>

          {/* Feedback Matters Info Panel */}
          <div className="lg:col-span-1 relative p-[1px] rounded-[24px] overflow-hidden group/info">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 opacity-20 group-hover/info:opacity-40 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
            <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] p-8 rounded-[23px] border border-white/[0.08] shadow-[inset_0_0_50px_rgba(16,185,129,0.1)] overflow-hidden">
              <Globe2 className="absolute -right-10 -bottom-10 w-64 h-64 text-emerald-500/10 rotate-12 blur-[2px] pointer-events-none" />
              
              <div className="relative z-10 flex flex-col h-full justify-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <Lightbulb className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3 drop-shadow-md">YOUR FEEDBACK MATTERS</h3>
                <p className="text-emerald-100/80 font-medium leading-relaxed text-sm">
                  The AI development team reviews all submissions carefully. High-upvote feedback is instantly prioritized for the next sprint roadmap. You'll receive real-time notifications when your suggestions transition to Planned or In Progress.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Minimal Footer */}
        <footer className="mt-16 text-center pb-8">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 space-y-2">
            <p className="text-slate-500">VEYTRIX.AI TESTER PORTAL</p>
          </div>
        </footer>

      </div>
    </div>
  );
}
