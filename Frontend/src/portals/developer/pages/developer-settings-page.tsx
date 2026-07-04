import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  Settings,
  Activity,
  Cloud,
  Bot,
  Zap,
  Shield,
  Cpu,
  BrainCircuit,
  CreditCard,
  Flag,
  Bell,
  AlertTriangle,
  FileText,
  Megaphone,
  CheckCircle,
  Save,
  Info
} from "lucide-react";

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

// Custom Switch Component
function CustomSwitch({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${checked ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-700'}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function DeveloperSettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"models" | "credits" | "features" | "notifications">("models");
  
  // Keep exact state structure
  const [settings, setSettings] = useState({
    aiModel: "gpt-4",
    temperature: 0.7,
    maxTokens: 2000,
    creditMultiplier: 1.0,
    dailyBudget: 100000,
    enableBeta: true,
    notifyOnErrors: true,
  });

  // Additional mock state for the checkboxes not in the main settings object in the original code
  const [extraSettings, setExtraSettings] = useState({
    batchProcessing: true,
    webhooks: true,
    customModels: false,
    dailyDigest: true,
    featureAnnouncements: true,
    criticalAlerts: true
  });

  const handleSave = () => {
    console.log("Settings saved:", settings);
    // Button animation state would go here in a real app
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          {['Config', 'AI', 'Sync', 'Secure', 'Beta'].map((status, i) => {
            const icons = [Settings, Bot, Cloud, Shield, Zap];
            const colors = ['slate', 'indigo', 'blue', 'emerald', 'amber'];
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
                <Settings className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-[spin_10s_linear_infinite]" /> System Settings
              </h1>
              <p className="text-slate-400 font-medium text-lg max-w-2xl">
                Manage AI models, credits, feature flags, notification preferences, and platform configuration from one centralized control center.
              </p>
            </div>

            {/* Live Status Bar */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.35)] text-[10px] sm:text-xs font-bold tracking-widest text-slate-400 uppercase">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> Configuration Service Online</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5"><Bot className="w-3 h-3" /> AI Engine Connected</p>
            </div>
          </motion.div>
        </div>

        {/* Top Summaries */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Settings Summary Cards */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Active AI Models", value: 12, icon: BrainCircuit, color: "indigo" },
              { label: "Feature Flags", value: 48, icon: Flag, color: "cyan" },
              { label: "Notifications", value: "Enabled", icon: Bell, color: "blue", isText: true },
              { label: "Sync Status", value: "Healthy", icon: Cloud, color: "emerald", isText: true },
            ].map((stat, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="group relative overflow-hidden flex flex-col p-6 rounded-[24px] bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`w-6 h-6 text-${stat.color}-400 group-hover:scale-110 transition-transform`} />
                </div>
                <span className={`text-3xl font-black ${stat.isText ? `text-${stat.color}-400 text-xl` : 'text-white'} mb-1 tracking-tight drop-shadow-[0_0_15px_rgba(var(--${stat.color}-500),0.3)]`}>
                  {stat.isText ? stat.value : <AnimatedNumber value={stat.value as number} />}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
              </motion.div>
            ))}
          </div>

          {/* System Overview */}
          <div className="lg:col-span-4 bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] p-6 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] pointer-events-none" />
             <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
               <Activity className="w-4 h-4 text-indigo-400" /> System Overview
             </h3>
             <div className="grid grid-cols-2 gap-4">
               {[
                 { label: "Avg Response", value: 1.2, suffix: "s", decimals: 1 },
                 { label: "Config Sync", value: 100, suffix: "%" },
                 { label: "AI Stability", value: 99.98, suffix: "%", decimals: 2 },
                 { label: "Security", text: "Protected" }
               ].map((snap, i) => (
                 <div key={i} className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-[16px]">
                   <p className="text-xl font-black text-white mb-1">
                     {snap.text ? <span className="text-emerald-400 text-lg">{snap.text}</span> : <AnimatedNumber value={snap.value!} suffix={snap.suffix} decimals={snap.decimals} />}
                   </p>
                   <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{snap.label}</p>
                 </div>
               ))}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Navigation */}
          <div className="lg:col-span-3">
            <div className="sticky top-6 flex flex-col gap-2 p-2 bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] relative z-20">
              {[
                { id: "models", label: "AI Models", icon: BrainCircuit },
                { id: "credits", label: "Credit Settings", icon: CreditCard },
                { id: "features", label: "Feature Flags", icon: Flag },
                { id: "notifications", label: "Notifications", icon: Bell },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative w-full px-6 py-4 rounded-[16px] text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-3 z-10 text-left ${
                      isActive ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="settingsNav"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-indigo-600/80 rounded-[16px] shadow-[0_0_20px_rgba(99,102,241,0.5)] -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <tab.icon className={`w-4 h-4 ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-slate-500'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* AI Config Health Panel */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-indigo-500/20 rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-6 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-50" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)] mb-4 animate-[pulse_3s_ease-in-out_infinite]">
                  <Bot className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-[10px] font-bold text-white uppercase tracking-widest mb-2">🧠 AI Config Health</h3>
                <p className="text-slate-400 font-medium text-xs leading-relaxed">
                  Current configuration is optimized. No conflicting settings detected. AI recommends keeping current temperature and token values for best production stability.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-[rgba(8,12,24,0.72)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-8 lg:p-12 relative overflow-hidden group/panel"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/panel:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 max-w-3xl">
                  {/* Models Tab */}
                  {activeTab === "models" && (
                    <div className="space-y-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                          <Bot className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-white">AI Models</h2>
                          <p className="text-sm text-slate-400">Configure language models and generation parameters.</p>
                        </div>
                      </div>

                      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[16px] p-4 flex items-start gap-3">
                        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-indigo-200">AI model changes instantly apply to new requests. No restart required.</p>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Default AI Model</label>
                          <div className="relative group">
                            <select
                              value={settings.aiModel}
                              onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                              className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-[16px] text-white font-bold appearance-none focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all cursor-pointer group-hover:border-white/20"
                            >
                              <option value="gpt-4">GPT-4 (Recommended)</option>
                              <option value="gpt-3.5">GPT-3.5 Turbo</option>
                              <option value="claude-3">Claude 3 Opus</option>
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                              <ChevronLeft className="w-4 h-4 -rotate-90" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Temperature</label>
                            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-bold text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                              {settings.temperature.toFixed(1)}
                            </span>
                          </div>
                          <div className="relative py-4 group">
                            {/* Custom Slider Track */}
                            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                                style={{ width: `${settings.temperature * 100}%` }}
                              />
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={settings.temperature}
                              onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                              className="w-full absolute top-1/2 -translate-y-1/2 opacity-0 cursor-pointer h-8"
                            />
                            {/* Custom Thumb */}
                            <div 
                              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-4 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] pointer-events-none group-hover:scale-125 transition-transform"
                              style={{ left: `calc(${settings.temperature * 100}% - 12px)` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-2">
                            <span>Deterministic (0.0)</span>
                            <span>Creative (1.0)</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Max Tokens</label>
                          <input
                            type="number"
                            value={settings.maxTokens}
                            onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                            className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-[16px] text-white font-bold focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all hover:border-white/20"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Credits Tab */}
                  {activeTab === "credits" && (
                    <div className="space-y-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                          <CreditCard className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-white">Credit Settings</h2>
                          <p className="text-sm text-slate-400">Manage billing rules and daily limits.</p>
                        </div>
                      </div>

                      {/* Premium Analytics Card */}
                      <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/20 border border-cyan-500/30 rounded-[24px] p-6 lg:p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[60px] pointer-events-none" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-6 flex items-center gap-2">
                          <Activity className="w-4 h-4" /> 💳 Credit Engine
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Daily Budget</p>
                            <p className="text-2xl font-black text-white"><AnimatedNumber value={100} suffix="K" /></p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Multiplier</p>
                            <p className="text-2xl font-black text-white"><AnimatedNumber value={1.0} suffix="x" decimals={1} /></p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Dev Pool</p>
                            <p className="text-lg font-black text-emerald-400 mt-1">Available</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Credit Multiplier</label>
                          <input
                            type="number"
                            step="0.1"
                            value={settings.creditMultiplier}
                            onChange={(e) => setSettings({ ...settings, creditMultiplier: parseFloat(e.target.value) })}
                            className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-[16px] text-white font-bold focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all hover:border-white/20"
                          />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-2">1.0 = standard, 1.5 = 50% more expensive</p>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Daily Budget (in credits)</label>
                          <input
                            type="number"
                            value={settings.dailyBudget}
                            onChange={(e) => setSettings({ ...settings, dailyBudget: parseInt(e.target.value) })}
                            className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-[16px] text-white font-bold focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all hover:border-white/20"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Features Tab */}
                  {activeTab === "features" && (
                    <div className="space-y-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.3)]">
                          <Flag className="w-6 h-6 text-fuchsia-400" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-white">Feature Flags</h2>
                          <p className="text-sm text-slate-400">Toggle experimental and core platform features.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {[
                          { id: 'enableBeta', title: "Enable Beta Features", desc: "Allow testing of unreleased features", icon: Zap, color: 'amber', checked: settings.enableBeta, onChange: (c: boolean) => setSettings({ ...settings, enableBeta: c }) },
                          { id: 'batchProcessing', title: "Batch Processing", desc: "Allow processing multiple videos", icon: Cpu, color: 'blue', checked: extraSettings.batchProcessing, onChange: (c: boolean) => setExtraSettings({ ...extraSettings, batchProcessing: c }) },
                          { id: 'webhooks', title: "Webhooks", desc: "Enable webhook notifications", icon: Cloud, color: 'indigo', checked: extraSettings.webhooks, onChange: (c: boolean) => setExtraSettings({ ...extraSettings, webhooks: c }) },
                          { id: 'customModels', title: "Custom Models", desc: "Allow users to upload custom models", icon: BrainCircuit, color: 'fuchsia', checked: extraSettings.customModels, onChange: (c: boolean) => setExtraSettings({ ...extraSettings, customModels: c }) },
                        ].map((feature, i) => (
                          <div key={i} className="group/row flex justify-between items-center p-5 bg-white/[0.02] border border-white/[0.05] rounded-[20px] hover:bg-white/[0.04] hover:border-white/10 hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl bg-${feature.color}-500/10 border border-${feature.color}-500/20 flex items-center justify-center group-hover/row:shadow-[0_0_15px_rgba(var(--${feature.color}-500),0.3)] transition-shadow`}>
                                <feature.icon className={`w-5 h-5 text-${feature.color}-400`} />
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">{feature.title}</p>
                                <p className="text-xs text-slate-400">{feature.desc}</p>
                              </div>
                            </div>
                            <CustomSwitch checked={feature.checked} onChange={feature.onChange} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === "notifications" && (
                    <div className="space-y-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                          <Bell className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-white">Notifications</h2>
                          <p className="text-sm text-slate-400">Configure system alerts and communication preferences.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { id: 'notifyOnErrors', title: "Error Alerts", desc: "Notify on system errors", icon: AlertTriangle, color: 'rose', checked: settings.notifyOnErrors, onChange: (c: boolean) => setSettings({ ...settings, notifyOnErrors: c }) },
                          { id: 'dailyDigest', title: "Daily Digest", desc: "Send analytics summary", icon: FileText, color: 'blue', checked: extraSettings.dailyDigest, onChange: (c: boolean) => setExtraSettings({ ...extraSettings, dailyDigest: c }) },
                          { id: 'featureAnnouncements', title: "Announcements", desc: "Notify about new features", icon: Megaphone, color: 'emerald', checked: extraSettings.featureAnnouncements, onChange: (c: boolean) => setExtraSettings({ ...extraSettings, featureAnnouncements: c }) },
                          { id: 'criticalAlerts', title: "Critical Alerts", desc: "High priority system alerts", icon: Shield, color: 'orange', checked: extraSettings.criticalAlerts, onChange: (c: boolean) => setExtraSettings({ ...extraSettings, criticalAlerts: c }), disabled: true },
                        ].map((notif, i) => (
                          <div key={i} className="group/card flex flex-col p-6 bg-white/[0.02] border border-white/[0.05] rounded-[24px] hover:bg-white/[0.04] hover:border-blue-500/30 hover:shadow-[0_10px_30px_rgba(59,130,246,0.15)] hover:-translate-y-1 transition-all">
                            <div className="flex justify-between items-start mb-4">
                              <div className={`w-12 h-12 rounded-2xl bg-${notif.color}-500/10 border border-${notif.color}-500/20 flex items-center justify-center group-hover/card:shadow-[0_0_20px_rgba(var(--${notif.color}-500),0.3)] transition-shadow`}>
                                <notif.icon className={`w-6 h-6 text-${notif.color}-400`} />
                              </div>
                              <CustomSwitch checked={notif.checked} onChange={notif.onChange} disabled={notif.disabled} />
                            </div>
                            <div>
                              <p className="font-bold text-white text-base mb-1">{notif.title}</p>
                              <p className="text-sm text-slate-400">{notif.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="mt-12 pt-8 border-t border-white/[0.06] flex justify-end">
                    <button
                      onClick={handleSave}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-[16px] font-bold uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:-translate-y-1 flex items-center gap-2 group"
                    >
                      <Save className="w-4 h-4 group-hover:scale-110 transition-transform" /> Save Configuration
                    </button>
                  </div>

                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

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
