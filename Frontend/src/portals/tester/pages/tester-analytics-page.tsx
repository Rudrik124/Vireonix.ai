import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  Download, 
  Calendar, 
  Loader,
  ArrowLeft,
  Activity,
  Zap,
  Cloud,
  Globe2,
  Lock,
  BarChart2,
  Bug,
  CheckCircle2,
  Clock,
  Coins,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Info,
  Video,
  Key,
  CreditCard,
  Layout,
  Gauge,
  FileText
} from "lucide-react";
import { fetchAnalytics } from "../../../services/developer-portal-api.service";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface AnalyticsData {
  bugsFound: number;
  criticalBugs: number;
  testsPassed: number;
  testsRun: number;
  avgResolutionTime: number;
  creditUsed: number;
  bugSeverity?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  featureCoverage?: {
    videoGenerator: number;
    authentication: number;
    billing: number;
    uiux: number;
    performance: number;
  };
  detailedMetrics?: {
    bugsReported: { week: number; month: number; allTime: number; trend: number };
    testCasesCompleted: { week: number; month: number; allTime: number; trend: number };
    videosGenerated: { week: number; month: number; allTime: number; trend: number };
    bugsVerifiedFixed: { week: number; month: number; allTime: number; trend: number };
    avgQualityRating: { week: number; month: number; allTime: number; trend: number };
  };
}

const particles = Array.from({ length: 40 });

// Animated Number Counter Component
function AnimatedNumber({ value, decimals = 0, suffix = "" }: { value: number, decimals?: number, suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(v)
    });
    return controls.stop;
  }, [value]);

  return <span>{displayValue.toFixed(decimals)}{suffix}</span>;
}

export function TesterAnalyticsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("30d");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    bugsFound: 0,
    criticalBugs: 0,
    testsPassed: 0,
    testsRun: 0,
    avgResolutionTime: 0,
    creditUsed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!authLoading && profile?.id) {
      loadAnalytics();
    }
  }, [dateRange, profile, authLoading]);

  const mockAnalyticsData: AnalyticsData = {
    bugsFound: 0,
    criticalBugs: 0,
    testsPassed: 0,
    testsRun: 0,
    avgResolutionTime: 0,
    creditUsed: 0,
    bugSeverity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
    featureCoverage: {
      videoGenerator: 0,
      authentication: 0,
      billing: 0,
      uiux: 0,
      performance: 0,
    },
  };

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const timeRangeMap = { "7d": "7d", "30d": "30d", all: "all" };
      const data = await fetchAnalytics(timeRangeMap[dateRange]);
      setAnalyticsData(data && Object.keys(data).length > 0 ? data : mockAnalyticsData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      console.log("Using mock data for analytics");
      setAnalyticsData(mockAnalyticsData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: "#050816", // Matched to new theme
        scale: 2,
        logging: false,
        allowTaint: true,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 5;

      pdf.addImage(imgData, "PNG", 5, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 5;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 5, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const timestamp = new Date().toISOString().split("T")[0];
      pdf.save(`ai-analytics-report-${timestamp}.pdf`);
      // Use standard alert since custom toast isn't available
      setTimeout(() => alert("✓ Analytics Report exported successfully!"), 100);
    } catch (error) {
      console.error("PDF export failed:", error);
      // Fallback: Create simple text-based PDF
      try {
        const passRate = analyticsData.testsRun > 0 
          ? ((analyticsData.testsPassed / analyticsData.testsRun) * 100).toFixed(1)
          : "0.0";
        const pdf = new jsPDF();
        pdf.setFontSize(16);
        pdf.text("AI Analytics Report", 10, 10);
        pdf.setFontSize(11);
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 10, 20);
        pdf.text(`Period: ${dateRange === "7d" ? "Last 7 Days" : dateRange === "30d" ? "Last 30 Days" : "All Time"}`, 10, 30);
        pdf.text("", 10, 40);
        pdf.text("Key Metrics:", 10, 45);
        pdf.text(`• Bugs Found: ${analyticsData.bugsFound}`, 15, 55);
        pdf.text(`• Test Pass Rate: ${passRate}%`, 15, 65);
        pdf.text(`• Avg Resolution Time: ${analyticsData.avgResolutionTime.toFixed(1)} days`, 15, 75);
        pdf.text(`• Credits Used: ${analyticsData.creditUsed}`, 15, 85);
        const timestamp = new Date().toISOString().split("T")[0];
        pdf.save(`ai-analytics-report-${timestamp}.pdf`);
        setTimeout(() => alert("✓ Analytics Report exported as PDF!"), 100);
      } catch (altError) {
        setTimeout(() => alert("Could not export PDF. Try CSV export instead."), 100);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    const passRate = analyticsData.testsRun > 0 
      ? ((analyticsData.testsPassed / analyticsData.testsRun) * 100).toFixed(1)
      : "0.0";
      
    const csvContent = [
      ["VEYTRIX.AI Analytics Report", new Date().toLocaleDateString()],
      [],
      ["Metric", "Value"],
      ["Bugs Found", analyticsData.bugsFound],
      ["Critical Bugs", analyticsData.criticalBugs],
      ["Tests Passed", analyticsData.testsPassed],
      ["Tests Run", analyticsData.testsRun],
      ["Pass Rate (%)", passRate],
      ["Avg Resolution Time (Days)", analyticsData.avgResolutionTime],
      ["Credits Used", analyticsData.creditUsed],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const timestamp = new Date().toISOString().split("T")[0];
    a.download = `ai-analytics-report-${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setTimeout(() => alert("✓ CSV exported successfully!"), 100);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#050816] text-cyan-400 font-bold">
        <Loader className="w-8 h-8 animate-spin mr-3" /> Loading Analytics Core...
      </div>
    );
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  const passRate = analyticsData.testsRun > 0 
    ? ((analyticsData.testsPassed / analyticsData.testsRun) * 100)
    : 0;

  const bugSeverity = analyticsData.bugSeverity || {
    critical: analyticsData.criticalBugs,
    high: 0,
    medium: 0,
    low: 0,
  };

  const featureCoverage = analyticsData.featureCoverage || {
    videoGenerator: 0,
    authentication: 0,
    billing: 0,
    uiux: 0,
    performance: 0,
  };

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
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><BarChart2 className="w-3 h-3 text-cyan-400" /> Analytics Live</div>
        </motion.div>
        <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[45%] right-[5%] opacity-30 pointer-events-none">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><Cloud className="w-3 h-3 text-purple-400" /> Cloud Connected</div>
        </motion.div>
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[20%] left-[8%] opacity-30 pointer-events-none">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><Zap className="w-3 h-3 text-blue-400" /> AI Metrics</div>
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
              onClick={handleExportPDF}
              disabled={isExporting || isLoading}
              className="group/btn relative overflow-hidden flex items-center gap-2 px-6 py-2.5 rounded-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] border border-white/10 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] text-sm font-bold text-white hover:-translate-y-1 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              <Download className="w-4 h-4 text-purple-400 group-hover/btn:animate-bounce" />
              <span className="relative z-10">{isExporting ? "EXPORTING..." : "QUICK PDF"}</span>
            </button>
          </motion.div>
        </div>

        {/* Hero Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-black tracking-[0.2em] text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-4 py-1.5 rounded-full mb-6 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <BarChart2 className="w-4 h-4" /> 📊 AI ANALYTICS CENTER
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] tracking-tight">
            TEST PERFORMANCE & REPORTING
          </h1>
          <p className="text-lg text-white/72 max-w-2xl font-medium mb-8">
            Real-time testing insights, bug analytics and quality metrics.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-emerald-500/30 text-xs font-bold text-emerald-300 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Analytics
            </motion.div>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-cyan-500/30 text-xs font-bold text-cyan-300 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <Activity className="w-3 h-3" /> Metrics Synced
            </motion.div>
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-purple-500/30 text-xs font-bold text-purple-300 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <TrendingUp className="w-3 h-3" /> AI Insights
            </motion.div>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-blue-500/30 text-xs font-bold text-blue-300 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <Globe2 className="w-3 h-3" /> Beta Environment
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
            <span className="flex items-center gap-2 text-emerald-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> AI Analytics Running</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="text-cyan-400">Metrics Updated 8 sec ago</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="text-purple-400">System Healthy</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="text-blue-400">Export Ready</span>
            <span className="hidden sm:inline opacity-50">━━━━━━━━━━━━</span>
          </motion.div>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex justify-center mb-10">
          <div className="bg-[rgba(18,22,40,0.65)] backdrop-blur-md border border-white/10 p-1.5 rounded-full flex gap-1 relative shadow-[0_0_20px_rgba(0,0,0,0.3)]">
            {(["7d", "30d", "all"] as const).map((range) => {
              const isActive = dateRange === range;
              return (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`relative px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 z-10 ${
                    isActive ? "text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFilter"
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] -z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {range === "7d" ? "This Week" : range === "30d" ? "This Month" : "All Time"}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white gap-4">
            <Loader className="w-10 h-10 animate-spin text-cyan-400" />
            <p className="font-mono text-cyan-400/80 tracking-widest text-sm uppercase">Processing Analytics...</p>
          </div>
        ) : (
          <div ref={reportRef} className="pb-10">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] border border-white/[0.08] group-hover:border-rose-500/30 group-hover:shadow-[0_0_40px_rgba(244,63,94,0.15)] p-6 flex flex-col justify-between transition-all">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Bug className="w-5 h-5 text-rose-400" />
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">BUGS FOUND</p>
                  </div>
                  <div>
                    <p className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(244,63,94,0.3)] mt-2">
                      <AnimatedNumber value={analyticsData.bugsFound} />
                    </p>
                    <p className="text-rose-400 text-xs font-bold mt-2 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> {analyticsData.criticalBugs} critical issues
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] border border-white/[0.08] group-hover:border-emerald-500/30 group-hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] p-6 flex flex-col justify-between transition-all">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">TEST PASS RATE</p>
                  </div>
                  <div>
                    <p className="text-5xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] mt-2">
                      <AnimatedNumber value={passRate} decimals={1} suffix="%" />
                    </p>
                    <p className="text-emerald-400/70 text-xs font-bold mt-2 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> {analyticsData.testsPassed} passed / {analyticsData.testsRun} total
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] border border-white/[0.08] group-hover:border-blue-500/30 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] p-6 flex flex-col justify-between transition-all">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">RESOLUTION TIME</p>
                  </div>
                  <div>
                    <p className="text-5xl font-black text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] mt-2">
                      <AnimatedNumber value={analyticsData.avgResolutionTime} decimals={1} />
                    </p>
                    <p className="text-blue-400/70 text-xs font-bold mt-2 flex items-center gap-1">
                      <Info className="w-3 h-3" /> average days from report to fix
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] border border-white/[0.08] group-hover:border-yellow-500/30 group-hover:shadow-[0_0_40px_rgba(234,179,8,0.15)] p-6 flex flex-col justify-between transition-all">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Coins className="w-5 h-5 text-yellow-400" />
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">CREDITS USED</p>
                  </div>
                  <div>
                    <p className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)] mt-2">
                      <AnimatedNumber value={analyticsData.creditUsed} />
                    </p>
                    <p className="text-yellow-400/70 text-xs font-bold mt-2 flex items-center gap-1">
                      <CreditCard className="w-3 h-3" /> {(analyticsData.creditUsed / 500).toFixed(1)} weeks allocated
                    </p>
                  </div>
                </div>
              </motion.div>

            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              
              {/* Bug Severity Panel */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="relative p-[1px] rounded-[24px] overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-0 group-hover:opacity-30 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
                <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] p-8 rounded-[23px] border border-white/[0.08] shadow-[0_0_40px_rgba(139,92,246,0.1)]">
                  
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                      <AlertTriangle className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">BUG SEVERITY</h2>
                      <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Distribution by impact level</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Critical */}
                    <div className="group/bar">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-slate-300 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-500" /> Critical
                        </span>
                        <span className="text-rose-400 font-black text-xl drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                          <AnimatedNumber value={bugSeverity.critical} />
                        </span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: bugSeverity.critical > 0 ? "100%" : "0%" }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)] group-hover/bar:brightness-125 transition-all"
                        />
                      </div>
                    </div>

                    {/* High */}
                    <div className="group/bar">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-slate-300 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-500" /> High
                        </span>
                        <span className="text-orange-400 font-black text-xl drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                          <AnimatedNumber value={bugSeverity.high} />
                        </span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${bugSeverity.critical + bugSeverity.high > 0 ? (bugSeverity.high / (bugSeverity.critical + bugSeverity.high)) * 100 : 0}%` }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
                          className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-400 shadow-[0_0_15px_rgba(249,115,22,0.5)] group-hover/bar:brightness-125 transition-all"
                        />
                      </div>
                    </div>

                    {/* Medium */}
                    <div className="group/bar">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-slate-300 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" /> Medium
                        </span>
                        <span className="text-yellow-400 font-black text-xl drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                          <AnimatedNumber value={bugSeverity.medium} />
                        </span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${bugSeverity.medium > 0 ? "60%" : "0%"}` }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                          className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)] group-hover/bar:brightness-125 transition-all"
                        />
                      </div>
                    </div>

                    {/* Low */}
                    <div className="group/bar">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-slate-300 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <Info className="w-4 h-4 text-green-500" /> Low
                        </span>
                        <span className="text-green-400 font-black text-xl drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                          <AnimatedNumber value={bugSeverity.low} />
                        </span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${bugSeverity.low > 0 ? "75%" : "0%"}` }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)] group-hover/bar:brightness-125 transition-all"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>

              {/* Feature Coverage Panel */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="relative p-[1px] rounded-[24px] overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-30 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
                <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] p-8 rounded-[23px] border border-white/[0.08] shadow-[0_0_40px_rgba(6,182,212,0.1)]">
                  
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                      <Gauge className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">TESTING COVERAGE</h2>
                      <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Progress across major modules</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Video Generator */}
                    <div className="group/bar">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-slate-300 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <Video className="w-4 h-4 text-blue-400" /> Video Generator
                        </span>
                        <span className="text-white font-black text-xl drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                          <AnimatedNumber value={featureCoverage.videoGenerator} suffix="%" />
                        </span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${featureCoverage.videoGenerator}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover/bar:brightness-125 transition-all"
                        />
                      </div>
                    </div>

                    {/* Authentication */}
                    <div className="group/bar">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-slate-300 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <Key className="w-4 h-4 text-emerald-400" /> Authentication
                        </span>
                        <span className="text-white font-black text-xl drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                          <AnimatedNumber value={featureCoverage.authentication} suffix="%" />
                        </span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${featureCoverage.authentication}%` }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-green-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] group-hover/bar:brightness-125 transition-all"
                        />
                      </div>
                    </div>

                    {/* Billing */}
                    <div className="group/bar">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-slate-300 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-yellow-400" /> Billing
                        </span>
                        <span className="text-white font-black text-xl drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                          <AnimatedNumber value={featureCoverage.billing} suffix="%" />
                        </span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${featureCoverage.billing}%` }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                          className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-amber-400 shadow-[0_0_15px_rgba(234,179,8,0.5)] group-hover/bar:brightness-125 transition-all"
                        />
                      </div>
                    </div>

                    {/* UI/UX */}
                    <div className="group/bar">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-slate-300 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <Layout className="w-4 h-4 text-orange-400" /> UI/UX
                        </span>
                        <span className="text-white font-black text-xl drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                          <AnimatedNumber value={featureCoverage.uiux} suffix="%" />
                        </span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${featureCoverage.uiux}%` }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                          className="h-full rounded-full bg-gradient-to-r from-orange-600 to-rose-400 shadow-[0_0_15px_rgba(249,115,22,0.5)] group-hover/bar:brightness-125 transition-all"
                        />
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="group/bar">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-slate-300 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <Zap className="w-4 h-4 text-red-400" /> Performance
                        </span>
                        <span className="text-white font-black text-xl drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                          <AnimatedNumber value={featureCoverage.performance} suffix="%" />
                        </span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${featureCoverage.performance}%` }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                          className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] group-hover/bar:brightness-125 transition-all"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>

            </div>

            {/* Export Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="relative p-[1px] rounded-[24px] overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="relative bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] border border-white/[0.08] shadow-[inset_0_0_50px_rgba(59,130,246,0.1)] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden">
                
                {/* Background Illustration */}
                <FileText className="absolute -right-10 -bottom-10 w-64 h-64 text-blue-500/10 rotate-12 blur-[2px] pointer-events-none" />

                <div className="relative z-10 max-w-xl text-center md:text-left">
                  <h3 className="text-3xl font-black text-white mb-3">EXPORT ANALYTICS REPORT</h3>
                  <p className="text-blue-200/80 font-medium text-lg leading-relaxed">
                    Generate and download detailed reports for sharing with your team, archiving sprint retrospectives, or external compliance.
                  </p>
                </div>

                <div className="relative z-10 flex flex-wrap justify-center md:justify-end gap-4 w-full md:w-auto">
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting || isLoading}
                    className="group/btn relative overflow-hidden flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all hover:scale-105 disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                    <Download className="w-5 h-5 text-white" />
                    <span className="text-white font-black tracking-widest">{isExporting ? "EXPORTING PDF..." : "EXPORT PDF"}</span>
                  </button>
                  
                  <button
                    onClick={handleExportCSV}
                    className="group/btn relative overflow-hidden flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-600 to-cyan-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                    <Download className="w-5 h-5 text-white" />
                    <span className="text-white font-black tracking-widest">EXPORT CSV</span>
                  </button>
                </div>
              </div>
            </motion.div>

          </div>
        )}

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
