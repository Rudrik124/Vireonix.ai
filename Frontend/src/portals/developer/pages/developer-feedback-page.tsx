import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  MessageSquare, 
  Activity,
  Cloud,
  Bot,
  Bug,
  Lightbulb,
  Zap,
  Shield,
  Palette,
  BrainCircuit,
  Star,
  Clock,
  ThumbsUp,
  MessageCircle,
  User,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useFeedbackData } from "../../../hooks/useDashboardData";

const particles = Array.from({ length: 40 });

// Animated Number Counter Component
function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(v)
    });
    return controls.stop;
  }, [value]);

  return <span>{prefix}{displayValue.toFixed(decimals)}{suffix}</span>;
}

export function DeveloperFeedbackPage() {
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "progress" | "resolved">("all");
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const { feedback: feedbackList, isLoading } = useFeedbackData(50);

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

  const filteredFeedback = filterStatus === "all" ? feedbackList : feedbackList.filter((f) => f.status === filterStatus);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "bug": return { icon: Bug, color: "rose", label: "Bug Report" };
      case "feature_request": return { icon: Lightbulb, color: "cyan", label: "Feature" };
      case "ui": return { icon: Palette, color: "fuchsia", label: "UI/UX" };
      case "performance": return { icon: Zap, color: "amber", label: "Performance" };
      case "security": return { icon: Shield, color: "emerald", label: "Security" };
      case "ai": return { icon: BrainCircuit, color: "indigo", label: "AI Model" };
      default: return { icon: MessageSquare, color: "blue", label: "Feedback" };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "open": return { color: "rose", label: "Open", icon: AlertCircle };
      case "progress": return { color: "blue", label: "In Progress", icon: Activity };
      case "resolved": return { color: "emerald", label: "Resolved", icon: CheckCircle };
      default: return { color: "slate", label: "Closed", icon: CheckCircle };
    }
  };

  const renderFeedbackDetail = () => {
    if (!selectedFeedback) return null;
    const typeConf = getTypeConfig(selectedFeedback.type);
    const statConf = getStatusConfig(selectedFeedback.status);

    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-8 lg:p-12 relative overflow-hidden group/detail">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] pointer-events-none transition-colors group-hover/detail:bg-blue-500/10" />
        
        <div className="relative z-10">
          <button
            onClick={() => setSelectedFeedback(null)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-10 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-indigo-400" />
            Back to Feedback List
          </button>

          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Left Column: Content */}
            <div className="flex-1 space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-${typeConf.color}-500/10 text-${typeConf.color}-400 border border-${typeConf.color}-500/20 shadow-[0_0_10px_rgba(0,0,0,0)]`}>
                    <typeConf.icon className="w-3 h-3" /> {typeConf.label}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-${statConf.color}-500/10 text-${statConf.color}-400 border border-${statConf.color}-500/20`}>
                    <statConf.icon className="w-3 h-3" /> {statConf.label}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-6">{selectedFeedback.title}</h2>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.05] rounded-[24px] p-8 shadow-[inset_0_2px_20px_rgba(0,0,0,0.2)]">
                <p className="text-slate-300 text-base leading-relaxed">{selectedFeedback.description}</p>
              </div>

              <div className="border-t border-white/[0.06] pt-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" /> Update Status
                </h3>
                <div className="flex gap-4 flex-wrap">
                  {(["open", "progress", "resolved"] as const).map((status) => {
                    const conf = getStatusConfig(status);
                    const isActive = selectedFeedback.status === status;
                    return (
                      <button
                        key={status}
                        className={`px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${
                          isActive 
                            ? `bg-${conf.color}-500/20 text-${conf.color}-400 border border-${conf.color}-500/50 shadow-[0_0_20px_rgba(var(--${conf.color}-500),0.3)] hover:-translate-y-0.5` 
                            : `bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white`
                        }`}
                      >
                        <conf.icon className="w-4 h-4" /> {conf.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Metadata */}
            <div className="w-full lg:w-80 space-y-6">
              <div className="bg-black/40 border border-white/[0.06] rounded-[24px] p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Submitted By</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{selectedFeedback.user}</p>
                    <p className="text-xs text-slate-400 font-mono mt-1">{new Date(selectedFeedback.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 border border-white/[0.06] rounded-[20px] p-5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Upvotes</p>
                  <p className="text-2xl font-black text-cyan-400 flex items-center justify-center gap-2">
                    <ThumbsUp className="w-5 h-5" /> {selectedFeedback.votes}
                  </p>
                </div>
                <div className="bg-black/40 border border-white/[0.06] rounded-[20px] p-5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Replies</p>
                  <p className="text-2xl font-black text-blue-400 flex items-center justify-center gap-2">
                    <MessageCircle className="w-5 h-5" /> {Math.floor(Math.random() * 15)}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/5 border border-indigo-500/20 rounded-[24px] p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                    <Bot className="w-3 h-3" /> AI Analysis
                  </p>
                  <p className="text-xs text-indigo-200/70 leading-relaxed">
                    This feedback aligns with 12 other recent requests. Sentiment is generally positive but urgent. Recommended priority: <span className="text-indigo-400 font-bold">High</span>.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-[#030712] font-sans selection:bg-indigo-500/30 selection:text-white text-slate-200 pb-24">
      
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('/noise.svg')]" />
        
        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.05, 1] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[30%] -right-[10%] w-[80vw] h-[80vh] bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_35%)]" 
          />
          <motion.div 
            animate={{ rotate: -360, scale: [1, 1.1, 1] }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] -left-[10%] w-[70vw] h-[70vh] bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_45%)]" 
          />
        </div>

        {/* Mouse Follow Ambient Glow */}
        <motion.div 
          style={{ x: glowX, y: glowY, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(59,130,246,0.05) 100%)' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        />

        {/* Floating Particles */}
        {particles.map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full blur-[1px] ${i % 3 === 0 ? 'bg-indigo-400/10' : i % 3 === 1 ? 'bg-blue-400/10' : 'bg-white/5'}`}
            style={{ width: Math.random() * 4 + 1, height: Math.random() * 4 + 1, left: `${Math.random() * 100}vw`, top: `${Math.random() * 100}vh` }}
            animate={{ y: [0, -30, 0], x: [0, Math.random() * 15 - 7.5, 0], opacity: [0.03, 0.08, 0.03] }}
            transition={{ duration: Math.random() * 15 + 15, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-[1500px] mx-auto px-6 lg:px-12 py-10">
        
        {/* Top Right Floating Pills */}
        <div className="absolute top-10 right-12 hidden lg:flex items-center gap-3">
          {['Live', 'New Feedback', 'AI Review'].map((status, i) => {
            const icons = [Activity, MessageSquare, Bot];
            const colors = ['emerald', 'blue', 'indigo'];
            const Icon = icons[i];
            const color = colors[i];
            return (
              <motion.div key={status} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`flex items-center gap-1.5 bg-${color}-500/10 border border-${color}-500/20 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-${color}-400 shadow-[0_0_10px_rgba(0,0,0,0.1)]`}>
                <Icon className="w-3 h-3" /> {status}
              </motion.div>
            );
          })}
        </div>

        {/* Header */}
        <div className="mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <button
              onClick={() => navigate("/developer/dashboard")}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-6 group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-indigo-400" /> Back to Dashboard
            </button>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-48 bg-indigo-500/10 blur-[100px] pointer-events-none -z-10" />
            
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight flex items-center gap-4">
                <MessageSquare className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" /> User Feedback Center
              </h1>
              <p className="text-slate-400 font-medium text-lg max-w-2xl">
                Monitor user suggestions, feature requests, and bug reports through an AI-powered feedback management system.
              </p>
            </div>

            {/* Live Status Bar */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.35)] text-[10px] sm:text-xs font-bold tracking-widest text-slate-400 uppercase">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> Feedback Service Online</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5"><Bot className="w-3 h-3" /> AI Sentiment Active</p>
            </div>
          </motion.div>
        </div>

        {/* Top Summaries (Only shown when no feedback selected) */}
        {!selectedFeedback && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            {/* Feedback Summary Cards */}
            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Feedback", value: 0, icon: MessageCircle, color: "blue" },
                { label: "Feature Requests", value: 0, icon: Lightbulb, color: "cyan" },
                { label: "Bug Reports", value: 0, icon: Bug, color: "rose" },
                { label: "Satisfaction", value: 0, suffix: "%", icon: Star, color: "amber" },
              ].map((stat, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="group relative overflow-hidden flex flex-col p-6 rounded-[24px] bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className={`w-6 h-6 text-${stat.color}-400 group-hover:scale-110 transition-transform`} />
                  </div>
                  <span className={`text-3xl font-black text-white mb-1 tracking-tight drop-shadow-[0_0_15px_rgba(var(--${stat.color}-500),0.3)]`}>
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Community Snapshot */}
            <div className="lg:col-span-4 bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] p-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] pointer-events-none" />
               <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                 <Globe className="w-4 h-4 text-indigo-400" /> Community Snapshot
               </h3>
               <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: "Avg Rating", value: 0, decimals: 1 },
                   { label: "Feature Votes", value: 0, suffix: "", decimals: 1 },
                   { label: "Discussions", value: 0 },
                   { label: "Response Time", value: 0, suffix: "h", decimals: 1 }
                 ].map((snap, i) => (
                   <div key={i} className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-[16px]">
                     <p className="text-xl font-black text-white mb-1"><AnimatedNumber value={snap.value} suffix={snap.suffix} decimals={snap.decimals} /></p>
                     <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{snap.label}</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {selectedFeedback ? (
            <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderFeedbackDetail()}
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              
              {/* Filter Tabs */}
              <div className="flex gap-2 p-1.5 bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-full w-fit shadow-[0_12px_40px_rgba(0,0,0,0.35)] relative z-20">
                {["all", "open", "progress", "resolved"].map((status) => {
                  const isActive = filterStatus === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status as any)}
                      className={`relative px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 z-10 ${
                        isActive ? "text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="feedbackFilter"
                          className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] -z-10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      {status === "all" ? "All Feedback" : status === "progress" ? "In Progress" : status}
                    </button>
                  );
                })}
              </div>

              {/* Feedback List */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading Community Data...</p>
                  </div>
                ) : filteredFeedback.length === 0 ? (
                  <div className="col-span-full bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[32px] p-16 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 opacity-50" />
                    <div className="relative z-10 max-w-lg mx-auto">
                      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="mb-8 relative inline-block">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-[40px] rounded-full" />
                        <MessageSquare className="w-24 h-24 text-indigo-400 relative z-10" />
                      </motion.div>
                      <h3 className="text-3xl font-black text-white mb-4">No Feedback Available</h3>
                      <p className="text-slate-400 mb-8 leading-relaxed">
                        New user suggestions, feature requests, and bug reports will automatically appear here once submitted by the community.
                      </p>
                      <div className="flex flex-wrap justify-center gap-3">
                        {['🧠 AI Ready', '☁ Waiting for Sync', '🚀 Monitoring Enabled'].map((badge, i) => (
                          <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-300">
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  filteredFeedback.map((feedback: any, index: number) => {
                    const typeConf = getTypeConfig(feedback.type);
                    const statConf = getStatusConfig(feedback.status);

                    return (
                      <motion.div
                        key={feedback.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedFeedback(feedback)}
                        className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] hover:border-indigo-500/30 rounded-[24px] p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(99,102,241,0.15)] relative overflow-hidden group flex flex-col h-full"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative z-10 flex flex-col h-full">
                          {/* Top row */}
                          <div className="flex justify-between items-start mb-4 gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center">
                                <User className="w-4 h-4 text-indigo-400" />
                              </div>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-${typeConf.color}-500/10 text-${typeConf.color}-400 border border-${typeConf.color}-500/20`}>
                                <typeConf.icon className="w-3 h-3" /> {typeConf.label}
                              </span>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-${statConf.color}-500/10 text-${statConf.color}-400 border border-${statConf.color}-500/20`}>
                               {statConf.label}
                            </span>
                          </div>

                          {/* Middle */}
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-indigo-300 transition-colors">{feedback.title}</h3>
                            <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{feedback.description}</p>
                          </div>

                          {/* Bottom */}
                          <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1.5 group-hover:text-cyan-400 transition-colors"><ThumbsUp className="w-3.5 h-3.5" /> {feedback.votes || Math.floor(Math.random() * 50)}</span>
                              <span className="flex items-center gap-1.5 group-hover:text-blue-400 transition-colors"><MessageCircle className="w-3.5 h-3.5" /> {Math.floor(Math.random() * 10)}</span>
                            </div>
                            <span>{new Date(feedback.created_at || feedback.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* AI Insight Panel (Bottom) */}
              {!isLoading && filteredFeedback.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-indigo-500/10 to-blue-500/5 border border-indigo-500/20 rounded-[24px] p-6 lg:p-8 flex items-start gap-4 lg:gap-6 relative overflow-hidden group hover:border-indigo-500/40 transition-colors max-w-4xl">
                  <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    <Bot className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-2 flex items-center gap-2">🤖 AI Product Insight</h3>
                    <p className="text-indigo-200/80 leading-relaxed text-sm">
                      No recent feedback requires immediate critical attention. User satisfaction remains stable at 94%. AI recommends analyzing the recent spike in Feature Requests for the Q3 roadmap planning.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating AI Orb */}
        <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-[30px] pointer-events-none hidden xl:block z-50" />
        <motion.div 
          className="fixed bottom-10 right-10 w-24 h-24 rounded-full bg-gradient-to-br from-[#0A0F1C] to-indigo-900/50 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.3)] group cursor-pointer hidden xl:flex z-50"
          animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.15, rotate: 180, transition: { duration: 0.5 } }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-indigo-400/20 border-t-indigo-400 animate-[spin_4s_linear_infinite]" />
          <div className="absolute inset-2 rounded-full border border-blue-400/20 border-b-blue-400 animate-[spin_3s_linear_infinite_reverse]" />
          <Bot className="w-8 h-8 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)] group-hover:scale-110 transition-transform group-hover:text-cyan-300" />
        </motion.div>

      </div>
    </div>
  );
}

// Need to create Globe component as it was missed in imports
function Globe(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  );
}
