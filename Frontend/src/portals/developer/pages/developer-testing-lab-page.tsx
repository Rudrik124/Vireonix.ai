import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  FlaskConical, 
  Bot, 
  Zap, 
  Lock, 
  Cloud, 
  Info, 
  Terminal, 
  MessageSquare, 
  UploadCloud,
  Cpu,
  Thermometer,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Play
} from "lucide-react";

const particles = Array.from({ length: 40 });

// Animated Number Counter Component
function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }: { value: number; prefix?: string; suffix?: string, decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(v)
    });
    return controls.stop;
  }, [value]);

  const formatted = displayValue >= 1000000 
    ? `${(displayValue / 1000000).toFixed(1)}M` 
    : displayValue >= 1000 
      ? `${(displayValue / 1000).toFixed(decimals)}K` 
      : displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return <span>{prefix}{formatted}{suffix}</span>;
}

export function DeveloperTestingLabPage() {
  const navigate = useNavigate();
  const [testType, setTestType] = useState<"prompt" | "api" | "upload">("prompt");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

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

  const handleTest = () => {
    setIsTesting(true);
    // Mock test execution delay
    setTimeout(() => {
      setResult({
        status: "success",
        responseTime: 2.34,
        tokenUsage: 1240,
        costEstimate: 0.062,
        confidence: 98,
        timestamp: new Date().toISOString(),
      });
      setIsTesting(false);
    }, 1500);
  };

  const tabs = [
    { id: "prompt", label: "Prompt", icon: MessageSquare },
    { id: "api", label: "API", icon: Terminal },
    { id: "upload", label: "Upload", icon: UploadCloud },
  ] as const;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#030712] font-sans selection:bg-indigo-500/30 selection:text-white text-slate-200 pb-24">
      
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.05, 1] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[30%] -right-[10%] w-[80vw] h-[80vh] bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_35%)]" 
          />
          <motion.div 
            animate={{ rotate: -360, scale: [1, 1.1, 1] }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] -left-[10%] w-[70vw] h-[70vh] bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.10),transparent_45%)]" 
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
            style={{
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              left: `${Math.random() * 100}vw`,
              top: `${Math.random() * 100}vh`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 15 - 7.5, 0],
              opacity: [0.03, 0.08, 0.03],
            }}
            transition={{
              duration: Math.random() * 15 + 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-[1500px] mx-auto px-6 lg:px-12 py-10">
        
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
                <FlaskConical className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" /> AI Testing Lab
              </h1>
              <p className="text-slate-400 font-medium text-lg max-w-xl">
                Safely test AI workflows without affecting production systems.
              </p>
            </div>

            {/* Live Status Bar */}
            <div className="flex flex-wrap items-center gap-4 px-6 py-3 rounded-full bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.35)] text-[10px] sm:text-xs font-bold tracking-widest text-slate-400 uppercase">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> Sandbox Environment Active</span>
              <span className="hidden sm:flex items-center gap-2"><Zap className="w-3 h-3 text-yellow-400" /> AI Models Online</span>
              <span className="hidden lg:flex items-center gap-2"><Cloud className="w-3 h-3 text-cyan-400" /> Secure Test Mode</span>
              <span className="hidden xl:flex items-center gap-2"><Lock className="w-3 h-3 text-indigo-400" /> Production Isolation Enabled</span>
            </div>
          </motion.div>
        </div>

        {/* Information Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10">
          <div className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] border-l-4 border-l-cyan-500 rounded-r-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.2)] p-5 flex items-start gap-4 relative overflow-hidden group hover:bg-[rgba(8,12,24,0.8)] transition-colors">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 relative z-10 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Info className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="relative z-10">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1">Sandbox Mode Enabled</h3>
              <p className="text-slate-400 font-medium text-sm leading-relaxed">
                All AI requests executed in this environment are isolated and marked with <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs ml-1">usageType=test</code>. They do not impact production analytics, billing, or user statistics.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main 70/30 Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Test Configuration */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] relative overflow-hidden group/panel">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[80px] pointer-events-none group-hover/panel:bg-indigo-500/10 transition-colors" />
              
              <div className="p-8 border-b border-white/[0.06] relative z-10">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    <Zap className="w-5 h-5 text-indigo-400" />
                  </div>
                  Test Configuration
                </h2>
                <p className="text-sm font-medium text-slate-400 mt-2 ml-[52px]">Configure AI parameters before execution.</p>
              </div>

              <div className="p-8 relative z-10">
                {/* Segmented Control */}
                <div className="mb-8">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-3">Test Type</label>
                  <div className="flex gap-2 p-1.5 bg-black/40 border border-white/[0.06] rounded-full w-fit shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setTestType(tab.id)}
                        className={`relative px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 z-10 ${
                          testType === tab.id ? "text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {testType === tab.id && (
                          <motion.div
                            layoutId="activeTestType"
                            className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] -z-10"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <tab.icon className={`w-4 h-4 ${testType === tab.id ? 'text-white' : 'text-slate-500'}`} />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {/* PROMPT TEST */}
                  {testType === "prompt" && (
                    <motion.div key="prompt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                      <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-2">Test Prompt</label>
                        <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Describe the AI task you want to test..."
                          rows={5}
                          className="w-full px-5 py-4 rounded-[16px] text-white bg-black/40 border border-white/10 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all font-medium resize-none custom-scrollbar"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-2 flex items-center gap-2"><Cpu className="w-3 h-3" /> Model</label>
                          <select className="w-full px-5 py-4 rounded-[16px] text-white bg-black/40 border border-white/10 focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all font-bold appearance-none cursor-pointer">
                            <option>GPT-4 Turbo</option>
                            <option>GPT-3.5</option>
                            <option>Claude 3 Opus</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-2 flex items-center gap-2"><Thermometer className="w-3 h-3" /> Temperature</label>
                          <input
                            type="number"
                            defaultValue="0.7"
                            min="0"
                            max="1"
                            step="0.1"
                            className="w-full px-5 py-4 rounded-[16px] text-white bg-black/40 border border-white/10 focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all font-bold"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* API TEST */}
                  {testType === "api" && (
                    <motion.div key="api" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                      <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-2 flex items-center gap-2"><Cloud className="w-3 h-3" /> Endpoint</label>
                        <select className="w-full px-5 py-4 rounded-[16px] text-white bg-black/40 border border-white/10 focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all font-bold appearance-none cursor-pointer">
                          <option>/api/videos/generate</option>
                          <option>/api/videos/status</option>
                          <option>/api/credits/balance</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-2">Request Payload</label>
                        <textarea
                          defaultValue='{\n  "prompt": "test",\n  "maxTokens": 1000\n}'
                          rows={6}
                          className="w-full px-5 py-4 rounded-[16px] text-cyan-300 bg-black/60 border border-white/10 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all font-mono text-sm custom-scrollbar"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* UPLOAD TEST */}
                  {testType === "upload" && (
                    <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                      <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-2">Upload Type</label>
                        <select className="w-full px-5 py-4 rounded-[16px] text-white bg-black/40 border border-white/10 focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all font-bold appearance-none cursor-pointer">
                          <option>Image Sequence</option>
                          <option>Video File</option>
                          <option>Audio File</option>
                        </select>
                      </div>
                      <div className="border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 rounded-[16px] p-10 text-center hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-colors cursor-pointer group">
                        <UploadCloud className="w-12 h-12 text-indigo-400 mx-auto mb-4 group-hover:scale-110 transition-transform group-hover:text-white" />
                        <p className="text-sm font-bold text-white mb-2">Drag and drop file here</p>
                        <p className="text-xs text-slate-400 font-medium">Or click to browse from your computer.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <button
                  onClick={handleTest}
                  disabled={isTesting || (!prompt && testType === "prompt")}
                  className="w-full group/submit relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white px-6 py-4 rounded-[16px] transition-all font-black shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:-translate-y-[2px] flex items-center justify-center gap-2 disabled:hover:translate-y-0 mt-8"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/submit:animate-[shimmer_1.5s_infinite]" />
                  {isTesting ? (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span className="relative z-10 uppercase tracking-widest">Executing AI Test...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 relative z-10 fill-current" />
                      <span className="relative z-10 uppercase tracking-widest">Run Test</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* AI Parameters Mini Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Bot, label: "Model", value: "GPT-4", color: "blue" },
                { icon: Thermometer, label: "Temp", value: "0.7", color: "amber" },
                { icon: Clock, label: "Est. Time", value: "4 sec", color: "emerald" },
                { icon: ShieldCheck, label: "Sandbox", value: "Enabled", color: "indigo" },
              ].map((param, i) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + (i * 0.1) }} key={i} className="group relative overflow-hidden flex flex-col items-center justify-center p-4 rounded-[20px] bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-250 hover:-translate-y-1 hover:scale-[1.04] hover:border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <param.icon className={`w-6 h-6 text-${param.color}-400 mb-2 group-hover:scale-110 transition-transform`} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{param.label}</span>
                  <span className="text-sm font-black text-white">{param.value}</span>
                </motion.div>
              ))}
            </div>

            {/* Recent Tests Timeline */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Recent Tests</h3>
              <div className="space-y-6 relative">
                <div className="absolute top-2 bottom-2 left-[15px] w-px bg-white/10" />
                {[
                  { title: "Prompt Test", status: "Completed", time: "2 min ago", type: "prompt" },
                  { title: "Upload Test", status: "Success", time: "15 min ago", type: "upload" },
                  { title: "API Test", status: "Completed", time: "1 hr ago", type: "api" },
                  { title: "GPT-4 Test", status: "Finished", time: "3 hrs ago", type: "prompt" }
                ].map((test, i) => (
                  <div key={i} className="flex gap-4 items-start relative z-10 group cursor-default">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-blue-500/20 border-blue-500/30 group-hover:scale-110 transition-transform">
                      {test.type === 'prompt' ? <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> : test.type === 'api' ? <Terminal className="w-3.5 h-3.5 text-blue-400" /> : <UploadCloud className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{test.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black tracking-widest text-emerald-400">{test.status}</span>
                        <span className="text-slate-600 text-xs">•</span>
                        <span className="text-[10px] uppercase font-bold text-slate-500">{test.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Live Results */}
          <div className="lg:col-span-4 flex flex-col gap-8 relative">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-blue-500/20 rounded-[24px] shadow-[0_12px_40px_rgba(59,130,246,0.15)] flex flex-col h-[700px] overflow-hidden relative group/results">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-50" />
              
              <div className="p-6 border-b border-white/[0.06] relative z-10">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-blue-400" /> Live Results
                </h2>
                <p className="text-xs font-medium text-slate-400 mt-1">AI response stream.</p>
              </div>

              <div className="flex-1 p-6 relative z-10 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                  {result ? (
                    <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                      
                      {/* JSON Output Mock */}
                      <div className="bg-black/60 border border-white/[0.06] rounded-[16px] p-5 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">JSON Response</span>
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 uppercase tracking-widest">
                            <CheckCircle2 className="w-3 h-3" /> 200 OK
                          </span>
                        </div>
                        <pre className="text-sm font-mono text-cyan-300 overflow-x-auto">
{`{
  "id": "chatcmpl-7XYZ",
  "object": "chat.completion",
  "created": 1699999999,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Simulated successful test response."
      },
      "finish_reason": "stop"
    }
  ]
}`}
                        </pre>
                      </div>

                      {/* Execution Metrics Cards */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-[16px] transition-all hover:bg-white/[0.05]">
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"><Zap className="w-3 h-3 text-blue-400" /> Exec Time</p>
                          <p className="text-white text-xl font-black"><AnimatedNumber value={result.responseTime} decimals={2} suffix="s" /></p>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-[16px] transition-all hover:bg-white/[0.05]">
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"><Cpu className="w-3 h-3 text-indigo-400" /> Tokens</p>
                          <p className="text-white text-xl font-black"><AnimatedNumber value={result.tokenUsage} /></p>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-[16px] transition-all hover:bg-white/[0.05]">
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"><Cloud className="w-3 h-3 text-cyan-400" /> Status</p>
                          <p className="text-emerald-400 text-sm mt-1 font-black uppercase tracking-widest">{result.status}</p>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-[16px] transition-all hover:bg-white/[0.05]">
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"><Activity className="w-3 h-3 text-purple-400" /> Confidence</p>
                          <p className="text-white text-xl font-black"><AnimatedNumber value={result.confidence} suffix="%" /></p>
                        </div>
                      </div>
                      
                      <div className="text-center pt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Test Executed at {new Date(result.timestamp).toLocaleTimeString()}</span>
                      </div>

                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-center">
                      <motion.div 
                        animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="w-32 h-32 bg-gradient-to-br from-[#0A0F1C] to-blue-900/50 border border-blue-500/30 rounded-[32px] flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(59,130,246,0.2)] relative"
                      >
                        <div className="absolute inset-0 bg-blue-500/20 rounded-[32px] blur-xl -z-10" />
                        <Bot className="w-16 h-16 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                      </motion.div>
                      <h3 className="text-2xl font-black text-white mb-3">No Test Executed</h3>
                      <p className="text-slate-400 text-sm font-medium max-w-[250px]">
                        Run an AI test to view live output, logs, execution time, and model response.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* AI Insight Panel */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  <Bot className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-1">AI Insight</h3>
                  <p className="text-slate-400 font-medium text-xs leading-relaxed">
                    Recent tests show consistent response quality. Average execution latency is below target threshold. Sandbox environment operating optimally.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Floating AI Orb */}
            <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-[30px] pointer-events-none hidden xl:block" />
            <motion.div 
              className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-gradient-to-br from-[#0A0F1C] to-indigo-900/50 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.3)] group cursor-pointer hidden xl:flex"
              animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.15, rotate: 180, transition: { duration: 0.5 } }}
            >
              <div className="absolute inset-0 rounded-full border-2 border-indigo-400/20 border-t-indigo-400 animate-[spin_4s_linear_infinite]" />
              <div className="absolute inset-2 rounded-full border border-purple-400/20 border-b-purple-400 animate-[spin_3s_linear_infinite_reverse]" />
              <Bot className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)] group-hover:scale-110 transition-transform group-hover:text-cyan-300" />
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
