import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useEffect, useState, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import {
  AlertCircle,
  Plus,
  Filter,
  ChevronDown,
  ArrowLeft,
  Bug,
  Activity,
  Globe2,
  Lock,
  Cloud,
  Zap,
  BarChart3,
  TestTube2,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchTesterBugReports, submitTesterBugReport, submitTesterUpdateAction } from "../../../services/developer-portal-api.service";
import { SuccessToast } from "../../../app/components/success-toast";
import { useRealtime } from "../../../hooks/useRealtime";

interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  component: string;
  status: "open" | "in-review" | "fixed" | "verified";
  os: string;
  browser: string;
  device: string;
  attachment_count: number;
  attachment_urls?: string[];
  tester_name?: string;
  assigned_developer?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
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

export function TesterBugReportsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const DEVELOPER_NAMES = useMemo(
    () => ["RUDRIK", "MOHAN", "MANJITH", "HARSHITHA", "UDAY", "SASWATEE"] as const,
    []
  );

  type DeveloperName = (typeof DEVELOPER_NAMES)[number];

  const [activeTab, setActiveTab] = useState<'report' | 'updates'>('report');
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "in-review" | "fixed" | "verified">("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [bugReportsSchemaMissing, setBugReportsSchemaMissing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    assignedDeveloper: "RUDRIK" as DeveloperName,
    description: "",
  });
  const [expandedDevelopers, setExpandedDevelopers] = useState<Record<string, boolean>>({});
  const [updateActions, setUpdateActions] = useState<Record<string, "pending" | "completed" | null>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

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

  const severityColors = {
    critical: "bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]",
    low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
  };

  const statusColors = {
    open: "bg-red-500/10 text-red-400 border-red-500/30",
    "in-review": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    fixed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    verified: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  };

  const filteredBugs = bugReports.filter((bug) => {
    const statusMatch = filter === "all" || bug.status === filter;
    const severityMatch = severityFilter === "all" || bug.severity === severityFilter;
    return statusMatch && severityMatch;
  });

  const developerUpdates = DEVELOPER_NAMES.map((developer) => ({
    name: developer,
    items: bugReports
      .filter((bug) => {
        // Show updates that belong to this developer.
        // Include if developer added notes OR the report status indicates a developer action (in-review/fixed/verified).
        const isAssigned = bug.assigned_developer === developer;
        const hasNotes = !!bug.notes && bug.notes.trim().length > 0;
        const statusFlag = (bug.status || "").toLowerCase();
        const developerActionStatuses = ["in-review", "fixed", "verified"];
        const isDeveloperAction = developerActionStatuses.includes(statusFlag);
        return isAssigned && (hasNotes || isDeveloperAction);
      })
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
  }));

  useEffect(() => {
    if (!authLoading) {
      if (!profile) {
        navigate("/");
        return;
      }
      fetchBugReports();
    }
  }, [authLoading, profile, navigate]);

  useRealtime(
    bugReportsSchemaMissing
      ? []
      : [
        {
          table: "bug_reports",
          event: "*",
          callback: () => {
            fetchBugReports();
          },
        },
      ]
  );

  const fetchBugReports = async () => {
    try {
      setLoading(true);
      setBugReportsSchemaMissing(false);
      const response = await fetchTesterBugReports();

      setBugReports(response || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes("Could not find the table 'public.bug_reports'") ||
        message.includes("Bug reports table not found") ||
        message.includes("schema cache")
      ) {
        setBugReportsSchemaMissing(true);
        setBugReports([]);
        return;
      }
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDeveloperExpanded = (name: string) => {
    setExpandedDevelopers((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleTesterClose = async (reportId: string) => {
    try {
      await submitTesterUpdateAction(reportId, 'closed');
      // After closing, show the tester Reports tab and switch to Completed
      setActiveTab('report');
      // ensure Completed view is selected in the open reports filter
      setFilter('fixed');
      await fetchBugReports();
      // scroll to the closed summary card so the user sees the closed section
      setTimeout(() => {
        const el = document.getElementById('closed-card');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
      setShowSuccess(true);
    } catch (err) {
      console.error('Failed to close update', err);
    }
  };

  const handleTesterBugReport = async (bug: BugReport) => {
    // Instead of automatically creating a follow-up, navigate tester to the
    // REPORT tab and prefill the form so they can review and submit.
    try {
      setFormData({
        assignedDeveloper: (bug.assigned_developer as DeveloperName) || "RUDRIK",
        description: `Follow-up for: ${bug.title}\n\n${bug.notes || ''}`,
      });
      setActiveTab('report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to prepare follow-up report', err);
    }
  };

  const handleUpdateCompleted = (bugId: string) => {
    setUpdateActions((prev) => ({ ...prev, [bugId]: "completed" }));
  };

  const handleUpdatePending = (bugId: string) => {
    setUpdateActions((prev) => ({ ...prev, [bugId]: "pending" }));
  };

  const handleResendToDeveloper = async (bugId: string) => {
    setActionLoading((prev) => ({ ...prev, [bugId]: true }));
    try {
      // Send the report back to developer (set status back to open)
      await submitTesterUpdateAction(bugId, 'resend');
      setUpdateActions((prev) => ({ ...prev, [bugId]: null }));
      await fetchBugReports();
      setShowSuccess(true);
    } catch (err) {
      console.error('Failed to resend to developer', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [bugId]: false }));
    }
  };

  const uploadScreenshot = async (file: File) => {
    if (!supabase) return null;
    const sanitizedFileName = `bug-reports/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    try {
      const { error: uploadError } = await supabase.storage.from("bug-report-screenshots").upload(sanitizedFileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) {
        console.warn("Screenshot upload failed:", uploadError);
        return null;
      }

      const { data: publicUrlData, error: urlError } = await supabase.storage
        .from("bug-report-screenshots")
        .getPublicUrl(sanitizedFileName);

      if (urlError) {
        console.warn("Unable to get screenshot public URL:", urlError);
        return null;
      }

      return publicUrlData.publicUrl;
    } catch (uploadError) {
      console.warn("Screenshot upload error:", uploadError);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      setUploading(Boolean(screenshot));

      const screenshotUrl = screenshot ? await uploadScreenshot(screenshot) : null;
      const title = formData.description.trim().slice(0, 120) || "New Tester Bug Report";

      await submitTesterBugReport({
        assignedDeveloper: formData.assignedDeveloper,
        description: formData.description,
        screenshotUrl,
        testerName: profile?.fullName || profile?.name || profile?.email || "Tester",
        submittedBy: profile?.id || "",
      });

      setFormData({
        assignedDeveloper: "RUDRIK",
        description: "",
      });
      setScreenshot(null);
      await fetchBugReports();
      setShowSuccess(true);
      setActiveTab('report');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes("Could not find the table 'public.bug_reports'") ||
        message.includes("Bug reports table not found") ||
        message.includes("schema cache")
      ) {
        setBugReportsSchemaMissing(true);
        return;
      }
      console.error("Error:", error);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-[#050816] font-sans selection:bg-cyan-500/30 selection:text-white text-slate-200 pb-16">
      {showSuccess && (
        <SuccessToast message="Bug report submitted" onDismiss={() => setShowSuccess(false)} />
      )}

      {/* Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('/noise.svg')]" />

        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vh] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.12),transparent_50%)]"
          />
          <motion.div
            animate={{ rotate: -360, scale: [1, 1.2, 1] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] -right-[10%] w-[80vw] h-[80vh] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent_50%)]"
          />
        </div>

        {/* Ambient Light Blobs */}
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-cyan-600/10 rounded-full blur-[100px] mix-blend-screen" />

        {/* Mouse Follow Ambient Glow */}
        <motion.div
          style={{ x: glowX, y: glowY, background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, rgba(124,58,237,0.5) 100%)' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[80px] opacity-15 pointer-events-none"
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
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[15%] left-[5%] opacity-30">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><Bug className="w-3 h-3 text-cyan-400" /> Bug Tracker</div>
        </motion.div>
        <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[35%] right-[5%] opacity-30">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><Activity className="w-3 h-3 text-purple-400" /> AI Monitor</div>
        </motion.div>
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[20%] left-[8%] opacity-30">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><Lock className="w-3 h-3 text-emerald-400" /> Secure</div>
        </motion.div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">

        {/* Top Action Buttons */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex justify-between items-center">
          <button
            onClick={() => navigate("/tester/dashboard")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] border border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] text-sm font-bold text-slate-300 hover:text-white hover:-translate-y-1 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-cyan-400" /> Back
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('report')}
            className="flex items-center gap-2 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:opacity-90 text-white font-bold py-2.5 px-6 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.3)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <Plus className="w-4 h-4" /> Report Bug
          </motion.button>
        </motion.div>

        {/* Hero Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-black tracking-[0.2em] text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/30 px-4 py-1.5 rounded-full mb-6 shadow-[0_0_15px_rgba(217,70,239,0.1)]">
            <Bug className="w-4 h-4" /> 🐞 AI BUG TRACKING CENTER
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] tracking-tight">
            Bug Reports
          </h1>
          <p className="text-lg text-white/70 max-w-2xl font-medium mb-8">
            Monitor, report and resolve AI platform issues in real time.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-emerald-500/30 text-xs font-bold text-emerald-300 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Tracking Active
            </motion.div>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-purple-500/30 text-xs font-bold text-purple-300 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <Activity className="w-3 h-3" /> AI Monitoring
            </motion.div>
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-blue-500/30 text-xs font-bold text-blue-300 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <Globe2 className="w-3 h-3" /> Beta Build
            </motion.div>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-rose-500/30 text-xs font-bold text-rose-300 backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.1)]">
              <Lock className="w-3 h-3" /> Secure Reports
            </motion.div>
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-cyan-500/30 text-xs font-bold text-cyan-300 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <TestTube2 className="w-3 h-3" /> Sandbox Mode
            </motion.div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-3 items-center justify-center">
          {[
            { key: 'report', label: 'REPORT TO DEVELOPER' },
            { key: 'updates', label: 'DEVELOPER UPDATES' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as 'report' | 'updates')}
              className={`px-5 py-3 rounded-full font-bold text-sm transition-all ${activeTab === tab.key ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.25)]' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bug Status Banner */}
        <div className="w-full flex items-center justify-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 text-xs font-mono font-bold tracking-widest text-slate-400 border border-white/5 bg-[rgba(18,22,40,0.65)] backdrop-blur-md px-6 py-2.5 rounded-full shadow-[0_0_30px_rgba(139,92,246,0.1)]"
          >
            <span className="hidden sm:inline opacity-50">━━━━━━━━━━━━</span>
            <span className="flex items-center gap-2 text-emerald-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> AI Bug Tracking Online</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="text-purple-400">Live Monitoring Enabled</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="text-blue-400">Auto Detection Running</span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="text-cyan-400 flex items-center gap-1"><Cloud className="w-3 h-3" /> Cloud Sync Active</span>
            <span className="hidden sm:inline opacity-50">━━━━━━━━━━━━</span>
          </motion.div>
        </div>

        {bugReportsSchemaMissing && (
          <div className="mb-8 rounded-3xl border border-rose-500/25 bg-rose-500/10 p-6 text-sm text-rose-100 shadow-[0_0_30px_rgba(244,63,94,0.12)]">
            <p className="font-semibold text-white mb-2">Bug report storage is not configured yet.</p>
            <p>If you are deploying this app, apply the database migration file <code className="bg-slate-900 px-1.5 py-0.5 rounded text-xs text-slate-100">supabase/sql/2026-06-10_bug_reports_table.sql</code> to create the <code className="bg-slate-900 px-1.5 py-0.5 rounded text-xs text-slate-100">bug_reports</code> table.</p>
          </div>
        )}

        {/* Premium Analytics Cards */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {/* Critical */}
          <div className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 z-10 hover:-translate-y-2 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 opacity-20 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
            <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] p-6 border border-white/[0.08] group-hover:border-transparent transition-colors shadow-[0_0_40px_rgba(239,68,68,0.1)] group-hover:shadow-[0_0_40px_rgba(239,68,68,0.3)] flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Critical</p>
                <AlertTriangle className="w-6 h-6 text-red-500 group-hover:rotate-12 transition-transform" />
              </div>
              <p className="text-white text-5xl font-black drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                <AnimatedNumber value={bugReports.filter((b) => b.severity === "critical").length} />
              </p>
            </div>
          </div>
          {/* Closed */}
          <div id="closed-card" className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 z-10 hover:-translate-y-2 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-20 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
            <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] p-6 border border-white/[0.08] group-hover:border-transparent transition-colors shadow-[0_0_40px_rgba(16,185,129,0.1)] group-hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Closed</p>
                <AlertCircle className="w-6 h-6 text-emerald-400 group-hover:rotate-12 transition-transform" />
              </div>
              <p className="text-white text-5xl font-black drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                <AnimatedNumber value={bugReports.filter((b) => b.status === 'fixed' || b.status === 'verified').length} />
              </p>
            </div>
          </div>
          {/* Open Bugs */}
          <div className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 z-10 hover:-translate-y-2 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-emerald-500 to-cyan-500 opacity-20 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
            <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] p-6 border border-white/[0.08] group-hover:border-transparent transition-colors shadow-[0_0_40px_rgba(234,179,8,0.1)] group-hover:shadow-[0_0_40px_rgba(234,179,8,0.3)] flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Open Bugs</p>
                <Bug className="w-6 h-6 text-yellow-400 group-hover:-rotate-12 transition-transform" />
              </div>
              <p className="text-white text-5xl font-black drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                <AnimatedNumber value={bugReports.filter((b) => b.status === "open").length} />
              </p>
            </div>
          </div>
          {/* Total Reported */}
          <div className="group relative p-[1px] rounded-[24px] overflow-hidden bg-white/5 transition-all duration-300 z-10 hover:-translate-y-2 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-20 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" style={{ padding: '1px' }} />
            <div className="relative h-full bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] rounded-[23px] p-6 border border-white/[0.08] group-hover:border-transparent transition-colors shadow-[0_0_40px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Total Reported</p>
                <BarChart3 className="w-6 h-6 text-blue-400 group-hover:rotate-12 transition-transform" />
              </div>
              <p className="text-white text-5xl font-black drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                <AnimatedNumber value={bugReports.length} />
              </p>
            </div>
          </div>
        </motion.div>

        {activeTab === 'report' && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 relative rounded-[24px] p-[1px] overflow-hidden z-20">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-cyan-500/50 opacity-30" />
            <div className="relative bg-[rgba(18,22,40,0.8)] backdrop-blur-[30px] rounded-[23px] p-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3"><AlertCircle className="w-6 h-6 text-cyan-400" /> Report Bug</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Assign to developer</label>
                    <div className="relative">
                      <select
                        value={formData.assignedDeveloper}
                        onChange={(e) => setFormData({ ...formData, assignedDeveloper: e.target.value as DeveloperName })}
                        className="w-full px-4 py-3 rounded-xl text-white bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all outline-none appearance-none"
                      >
                        {DEVELOPER_NAMES.map((developer) => (
                          <option key={developer} value={developer} className="bg-[#0B1020]">{developer}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Screenshot (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
                      className="w-full text-sm text-white bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none"
                    />
                    {screenshot && <p className="mt-2 text-xs text-slate-400">Selected: {screenshot.name}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bug Description</label>
                  <textarea
                    placeholder="Describe the bug in detail..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all outline-none placeholder-white/30 h-36 resize-none"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submitting || uploading}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-white font-bold px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex justify-center items-center gap-2"
                  >
                    {(submitting || uploading) ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Submit Report"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setFormData({ assignedDeveloper: "RUDRIK", description: "" });
                      setScreenshot(null);
                    }}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-6 py-3 rounded-xl transition-all"
                  >
                    Reset
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === 'report' && (<>
          <div className="mb-8 flex flex-wrap gap-4 items-center bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] p-4 rounded-[20px] border border-white/10 shadow-[0_0_30px_rgba(139,92,246,0.1)] glow-button">
            <div className="flex items-center gap-2 px-2">
              <Filter className="w-5 h-5 text-cyan-400" />
              <span className="text-white font-bold tracking-widest text-sm uppercase">Filters</span>
            </div>

            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="pl-4 pr-10 py-2.5 rounded-xl text-white font-semibold bg-white/5 border border-white/10 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="all" className="bg-[#0B1020]">All Status</option>
                <option value="open" className="bg-[#0B1020]">Open</option>
                <option value="in-review" className="bg-[#0B1020]">In Review</option>
                <option value="fixed" className="bg-[#0B1020]">Fixed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="pl-4 pr-10 py-2.5 rounded-xl text-white font-semibold bg-white/5 border border-white/10 hover:border-purple-500/50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="all" className="bg-[#0B1020]">All Severity</option>
                <option value="critical" className="bg-[#0B1020]">Critical</option>
                <option value="high" className="bg-[#0B1020]">High</option>
                <option value="medium" className="bg-[#0B1020]">Medium</option>
                <option value="low" className="bg-[#0B1020]">Low</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
            </div>
          </div>

          {/* Bug Reports List */}
          <div className="space-y-4">
            {filteredBugs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="relative p-[1px] rounded-[24px] overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/5 backdrop-blur-[24px] rounded-[23px] border border-white/10 flex flex-col items-center justify-center py-20" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                  <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                    <Bug className="w-16 h-16 text-slate-500/50 mb-4" />
                  </motion.div>
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight">No bug reports found.</h3>
                  <p className="text-slate-400 font-medium text-center">Your selected filters returned no results.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-4">
                {filteredBugs.map((bug) => (
                  <motion.div
                    key={bug.id}
                    variants={itemVariants}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="bg-[rgba(18,22,40,0.65)] backdrop-blur-[24px] p-6 rounded-[20px] border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] group"
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className="text-slate-500 font-mono text-xs bg-black/30 px-2 py-1 rounded">ID: {bug.id.split('-')[0]}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${severityColors[bug.severity]}`}>
                            {bug.severity.charAt(0).toUpperCase() + bug.severity.slice(1)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${statusColors[bug.status]}`}>
                            {bug.status === "in-review" ? "In Review" : bug.status.charAt(0).toUpperCase() + bug.status.slice(1)}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">{bug.title}</h3>
                      </div>
                      <ChevronDown className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
                    </div>

                    <p className="text-slate-400 mb-6 line-clamp-2 leading-relaxed text-sm">{bug.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-black/20 border border-white/5 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">Component</span>
                        {bug.component}
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">OS</span>
                        {bug.os}
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">Browser</span>
                        {bug.browser}
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">Device</span>
                        {bug.device}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span>Attachments: {bug.attachment_count}</span>
                      <span>Updated: {new Date(bug.updated_at).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </>)}

        {activeTab === 'updates' && (
          <div className="space-y-4">
            {developerUpdates.map((developer) => {
              const expanded = !!expandedDevelopers[developer.name];
              return (
                <div key={developer.name} className="bg-[rgba(18,22,40,0.85)] border border-white/10 rounded-[24px] p-5 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-[0.35em] text-white">{developer.name}</h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">Developer Updates</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-slate-400">{developer.items.length} update{developer.items.length !== 1 ? 's' : ''}</div>
                      <button
                        onClick={() => toggleDeveloperExpanded(developer.name)}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-slate-200"
                      >
                        {expanded ? 'Collapse' : 'Expand'}
                      </button>
                    </div>
                  </div>

                  {!expanded && (
                    <div className="text-sm text-slate-400">{developer.items.length === 0 ? 'No updates from this developer yet.' : `${developer.items[0].notes?.slice(0, 120)}${developer.items[0].notes && developer.items[0].notes.length > 120 ? '…' : ''}`}</div>
                  )}

                  {expanded && (
                    <div className="space-y-3">
                      {developer.items.length === 0 ? (
                        <p className="text-sm text-slate-400">No updates from this developer yet.</p>
                      ) : (
                        developer.items.map((bug) => (
                          <div key={bug.id} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                            <p className="text-white font-semibold mb-3 leading-relaxed">{bug.notes}</p>
                            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 mb-1">Related Bug</p>
                            <p className="text-sm font-medium text-slate-100 mb-3">{bug.title}</p>

                            {updateActions[bug.id] === null || updateActions[bug.id] === undefined ? (
                              <div className="flex items-center gap-3 mb-3">
                                <button
                                  onClick={() => handleUpdateCompleted(bug.id)}
                                  className="px-3 py-2 bg-emerald-600/80 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white transition"
                                >
                                  COMPLETED
                                </button>
                                <button
                                  onClick={() => handleUpdatePending(bug.id)}
                                  className="px-3 py-2 bg-yellow-600/80 hover:bg-yellow-500 rounded-lg text-xs font-bold text-white transition"
                                >
                                  PENDING
                                </button>
                                <button
                                  onClick={() => handleTesterBugReport(bug)}
                                  className="px-3 py-2 bg-rose-600/80 hover:bg-rose-500 rounded-lg text-xs font-bold text-white transition"
                                >
                                  NEW BUG REPORT
                                </button>
                              </div>
                            ) : updateActions[bug.id] === "completed" ? (
                              <div className="mb-3 px-3 py-2 bg-emerald-600/30 rounded-lg border border-emerald-500/50">
                                <p className="text-xs font-bold text-emerald-300">✓ Marked as Completed</p>
                              </div>
                            ) : updateActions[bug.id] === "pending" ? (
                              <div className="flex items-center gap-3 mb-3">
                                <div className="px-3 py-2 bg-yellow-600/30 rounded-lg border border-yellow-500/50 flex-1">
                                  <p className="text-xs font-bold text-yellow-300">⚠ Marked as Pending</p>
                                </div>
                                <button
                                  onClick={() => handleResendToDeveloper(bug.id)}
                                  disabled={actionLoading[bug.id]}
                                  className="px-3 py-2 bg-indigo-600/80 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-xs font-bold text-white transition"
                                >
                                  {actionLoading[bug.id] ? "Sending..." : "RESEND"}
                                </button>
                              </div>
                            ) : null}

                            <div className="grid gap-2 text-[11px] text-slate-400">
                              <span>Status: <span className="text-white">{bug.status === 'in-review' ? 'In Review' : bug.status}</span></span>
                              <span>{new Date(bug.updated_at).toLocaleString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Minimal Footer */}
        <footer className="mt-16 text-center pb-8">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 space-y-2">
            <p className="text-slate-500">VEYTRIX.AI AI BUG TRACKING CENTER</p>
          </div>
        </footer>

      </div>
    </div>
  );
}
