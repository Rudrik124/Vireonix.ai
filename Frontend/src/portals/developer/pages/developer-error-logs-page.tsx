import { useNavigate } from "react-router";
import { useEffect, useState, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Activity,
  Cloud,
  Bot,
  Search,
  Filter,
  Eye,
  Terminal,
  Bug,
  Server,
  Cpu,
  Clock,
  Laptop,
  Globe,
  Database
} from "lucide-react";
import { useAuth } from "../../../app/context/auth-context";
import { useErrorLogsData } from "../../../hooks/useDashboardData";
import { supabase } from "@/lib/supabase";

type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';
type ErrorStatus = 'open' | 'resolved';
type BugSeverity = 'critical' | 'high' | 'medium' | 'low';
type BugStatus = 'open' | 'in-review' | 'fixed' | 'verified';

interface ErrorLog {
  id: string;
  error_message: string;
  module: string;
  route: string;
  severity: ErrorSeverity;
  status: ErrorStatus;
  browser?: string;
  device?: string;
  timestamp: string;
  stack_trace?: string;
  additional_context?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
}

interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: BugSeverity;
  component: string;
  status: BugStatus;
  os: string;
  browser: string;
  device: string;
  attachment_count: number;
  notes?: string;
  submitted_by?: string;
  tester_name?: string;
  assigned_developer?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

const particles = Array.from({ length: 40 });

// Animated Number Counter Component
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(Math.round(v))
    });
    return controls.stop;
  }, [value]);

  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}

export function DeveloperErrorLogsPage() {
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'errors' | 'bugs'>('errors');
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loadingBugs, setLoadingBugs] = useState(false);

  // Filters
  const [timeRange, setTimeRange] = useState<'today' | 'last7days' | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<ErrorSeverity[]>(['critical', 'high', 'medium', 'low']);
  const [statusFilter, setStatusFilter] = useState<ErrorStatus[]>(['open', 'resolved']);
  const [bugSeverityFilter, setBugSeverityFilter] = useState<BugSeverity[]>(['critical', 'high', 'medium', 'low']);
  const [bugStatusFilter, setBugStatusFilter] = useState<BugStatus[]>(['open', 'in-review', 'fixed', 'verified']);
  const [searchQuery, setSearchQuery] = useState('');
  const [bugSearchQuery, setBugSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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

  // Load errors with realtime updates
  const { errorLogs, isLoading } = useErrorLogsData(50, severityFilter);

  // Load bug reports
  useEffect(() => {
    if (activeTab === 'bugs') {
      fetchBugReports();
    }
  }, [activeTab, profile]);

  const fetchBugReports = async () => {
    try {
      setLoadingBugs(true);
      let query = supabase
        .from("bug_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (profile?.role === "developer" && profile.name) {
        query = query.eq("assigned_developer", profile.name.toUpperCase());
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching bug reports:", error);
        return;
      }

      setBugReports(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoadingBugs(false);
    }
  };

  const handleResolveError = async (errorId: string) => {
    if (!profile?.id) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('error_logs')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: profile.id,
        })
        .eq('id', errorId);

      if (error) throw error;

      if (selectedError?.id === errorId) {
        setSelectedError({
          ...selectedError,
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to resolve error:', error);
      alert('Failed to resolve error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReopenError = async (errorId: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('error_logs')
        .update({
          status: 'open',
          resolved_at: null,
          resolved_by: null,
        })
        .eq('id', errorId);

      if (error) throw error;

      if (selectedError?.id === errorId) {
        setSelectedError({
          ...selectedError,
          status: 'open',
          resolved_at: undefined,
        });
      }
    } catch (error) {
      console.error('Failed to reopen error:', error);
      alert('Failed to reopen error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteError = async (errorId: string) => {
    if (confirm('Are you sure you want to delete this error log?')) {
      setIsUpdating(true);
      try {
        const { error } = await supabase
          .from('error_logs')
          .delete()
          .eq('id', errorId);

        if (error) throw error;

        if (selectedError?.id === errorId) {
          setSelectedError(null);
        }
      } catch (error) {
        console.error('Failed to delete error:', error);
        alert('Failed to delete error');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleBugStatusUpdate = async (bugId: string, newStatus: BugStatus) => {
    if (!profile?.id) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("bug_reports")
        .update({
          status: newStatus,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", bugId);

      if (error) throw error;

      if (selectedBug?.id === bugId) {
        setSelectedBug({
          ...selectedBug,
          status: newStatus,
          reviewed_at: new Date().toISOString(),
        });
      }
      await fetchBugReports();
    } catch (error) {
      console.error("Failed to update bug report:", error);
      alert("Failed to update bug report");
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter logs by search query and time range
  const filteredErrors = errorLogs.filter((log) => {
    if (timeRange === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(log.created_at) < today) return false;
    } else if (timeRange === 'last7days') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (new Date(log.created_at) < sevenDaysAgo) return false;
    }
    if (!statusFilter.includes(log.status as ErrorStatus)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.error_message.toLowerCase().includes(query) ||
        log.module.toLowerCase().includes(query) ||
        log.route.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const filteredBugs = bugReports.filter((bug) => {
    if (!bugSeverityFilter.includes(bug.severity as BugSeverity)) return false;
    if (!bugStatusFilter.includes(bug.status as BugStatus)) return false;
    if (bugSearchQuery) {
      const query = bugSearchQuery.toLowerCase();
      return (
        bug.title.toLowerCase().includes(query) ||
        bug.description.toLowerCase().includes(query) ||
        bug.component.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const openIssuesCount = errorLogs.filter(e => e.status === 'open').length;
  const criticalCount = errorLogs.filter(e => e.severity === 'critical' && e.status === 'open').length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const resolvedTodayCount = errorLogs.filter(e => e.status === 'resolved' && e.resolved_at && new Date(e.resolved_at) >= today).length;

  const renderErrorDetail = () => {
    if (!selectedError) return null;

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-8 relative overflow-hidden group/detail">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[80px] pointer-events-none transition-colors group-hover/detail:bg-blue-500/10" />
        <div className="relative z-10">
          <button
            onClick={() => setSelectedError(null)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-8 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-indigo-400" />
            Back to List
          </button>

          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-white/[0.06]">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2"><Terminal className="w-3 h-3" /> Error Message</p>
                <p className="text-2xl font-black text-white">{selectedError.error_message}</p>
              </div>
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest border shadow-[0_0_15px_rgba(0,0,0,0.2)] ${selectedError.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]'}`}>
                {selectedError.status === 'resolved' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {selectedError.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: "Module", value: selectedError.module, icon: Server, color: "blue" },
                { label: "Route", value: selectedError.route, icon: Globe, color: "indigo" },
                { label: "Severity", value: selectedError.severity, icon: ShieldAlert, color: selectedError.severity === 'critical' ? 'rose' : selectedError.severity === 'high' ? 'orange' : selectedError.severity === 'medium' ? 'amber' : 'cyan', badge: true },
                { label: "Browser", value: selectedError.browser || 'N/A', icon: Globe, color: "purple" },
                { label: "Device", value: selectedError.device || 'N/A', icon: Laptop, color: "emerald" },
                { label: "Timestamp", value: new Date(selectedError.timestamp).toLocaleString(), icon: Clock, color: "slate" },
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-[16px]">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><item.icon className={`w-3 h-3 text-${item.color}-400`} /> {item.label}</p>
                  {item.badge ? (
                    <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-widest bg-${item.color}-500/10 text-${item.color}-400 border border-${item.color}-500/20 shadow-[0_0_10px_rgba(0,0,0,0.2)]`}>
                      {item.value}
                    </span>
                  ) : (
                    <p className="font-bold text-white text-sm truncate" title={item.value}>{item.value}</p>
                  )}
                </div>
              ))}
            </div>

            {selectedError.stack_trace && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Cpu className="w-3 h-3" /> Stack Trace</p>
                <div className="bg-black/60 border border-white/[0.06] rounded-[16px] p-5 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]">
                  <pre className="text-[13px] text-cyan-300 font-mono overflow-auto max-h-64 custom-scrollbar">
                    {selectedError.stack_trace}
                  </pre>
                </div>
              </div>
            )}

            {selectedError.additional_context && Object.keys(selectedError.additional_context).length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Database className="w-3 h-3" /> Additional Context</p>
                <div className="bg-black/60 border border-white/[0.06] rounded-[16px] p-5 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]">
                  <pre className="text-[13px] text-blue-300 font-mono overflow-auto max-h-64 custom-scrollbar">
                    {JSON.stringify(selectedError.additional_context, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-white/[0.06]">
              {selectedError.status === 'open' ? (
                <button
                  onClick={() => handleResolveError(selectedError.id)}
                  disabled={isUpdating}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-full font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Mark as Resolved
                </button>
              ) : (
                <button
                  onClick={() => handleReopenError(selectedError.id)}
                  disabled={isUpdating}
                  className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 rounded-full font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Reopen Issue
                </button>
              )}
              <button
                onClick={() => handleDeleteError(selectedError.id)}
                disabled={isUpdating}
                className="px-6 py-3 bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/50 text-slate-300 hover:text-rose-400 rounded-full font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-50 hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Log
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderBugDetail = () => {
    if (!selectedBug) return null;

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-8 relative overflow-hidden group/detail">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[80px] pointer-events-none transition-colors group-hover/detail:bg-indigo-500/10" />
        <div className="relative z-10">
          <button
            onClick={() => setSelectedBug(null)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-8 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-indigo-400" />
            Back to List
          </button>

          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-white/[0.06]">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2"><Bug className="w-3 h-3" /> Bug Report</p>
                <p className="text-2xl font-black text-white">{selectedBug.title}</p>
              </div>
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest border shadow-[0_0_15px_rgba(0,0,0,0.2)] ${selectedBug.status === 'open' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                  selectedBug.status === 'in-review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    selectedBug.status === 'fixed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                {selectedBug.status === 'in-review' ? 'In Review' : selectedBug.status}
              </span>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Terminal className="w-3 h-3" /> Description</p>
              <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-[16px]">
                <p className="text-white text-sm leading-relaxed">{selectedBug.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Component", value: selectedBug.component, icon: Server, color: "blue" },
                { label: "Severity", value: selectedBug.severity, icon: ShieldAlert, color: selectedBug.severity === 'critical' ? 'rose' : selectedBug.severity === 'high' ? 'orange' : selectedBug.severity === 'medium' ? 'amber' : 'cyan', badge: true },
                { label: "OS", value: selectedBug.os, icon: Laptop, color: "indigo" },
                { label: "Browser", value: selectedBug.browser, icon: Globe, color: "purple" },
                { label: "Device", value: selectedBug.device, icon: Cpu, color: "emerald" },
                { label: "Attachments", value: selectedBug.attachment_count, icon: Database, color: "slate" },
                { label: "Submitted", value: new Date(selectedBug.created_at).toLocaleDateString(), icon: Clock, color: "slate" },
                { label: "Updated", value: new Date(selectedBug.updated_at).toLocaleDateString(), icon: Clock, color: "slate" },
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-[16px]">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><item.icon className={`w-3 h-3 text-${item.color}-400`} /> {item.label}</p>
                  {item.badge ? (
                    <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-widest bg-${item.color}-500/10 text-${item.color}-400 border border-${item.color}-500/20 shadow-[0_0_10px_rgba(0,0,0,0.2)]`}>
                      {item.value}
                    </span>
                  ) : (
                    <p className="font-bold text-white text-sm truncate" title={String(item.value)}>{item.value}</p>
                  )}
                </div>
              ))}
            </div>

            {selectedBug.notes && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Activity className="w-3 h-3" /> Developer Notes</p>
                <div className="bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-[16px]">
                  <p className="text-indigo-200 text-sm leading-relaxed">{selectedBug.notes}</p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/[0.06]">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Update Status</p>
              <div className="flex gap-3 flex-wrap">
                {(['open', 'in-review', 'fixed', 'verified'] as const).map((status) => {
                  const isActive = selectedBug.status === status;
                  const colors = {
                    'open': 'rose',
                    'in-review': 'amber',
                    'fixed': 'blue',
                    'verified': 'emerald'
                  };
                  const color = colors[status];
                  return (
                    <button
                      key={status}
                      onClick={() => handleBugStatusUpdate(selectedBug.id, status)}
                      disabled={isUpdating}
                      className={`px-5 py-2.5 rounded-full font-bold uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 hover:-translate-y-0.5 ${isActive
                          ? `bg-${color}-500/20 text-${color}-400 border border-${color}-500/50 shadow-[0_0_15px_rgba(0,0,0,0.2)]`
                          : `bg-white/5 border border-white/10 text-slate-400 hover:border-${color}-500/30 hover:text-${color}-300`
                        }`}
                    >
                      {status === 'in-review' ? 'In Review' : status}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderFiltersAndTable = (type: 'errors' | 'bugs') => {
    const isError = type === 'errors';
    const items = isError ? filteredErrors : filteredBugs;
    const loading = isError ? isLoading : loadingBugs;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Filters */}
        <div className="lg:col-span-3 space-y-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-6 relative overflow-hidden group/filter">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/filter:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <Filter className="w-5 h-5 text-indigo-400" /> Smart Filters
              </h2>

              <div className="space-y-6">
                {/* Search */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Search AI</p>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder={isError ? "Search logs..." : "Search bugs..."}
                      value={isError ? searchQuery : bugSearchQuery}
                      onChange={(e) => isError ? setSearchQuery(e.target.value) : setBugSearchQuery(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-full pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all"
                    />
                  </div>
                </div>

                {isError && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Time Range</p>
                    <div className="flex flex-col gap-2">
                      {(['today', 'last7days', 'all'] as const).map((range) => {
                        const active = timeRange === range;
                        return (
                          <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all text-left ${active ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10'
                              }`}
                          >
                            {range === 'today' ? 'Today' : range === 'last7days' ? 'Last 7 days' : 'All Time'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Severity</p>
                  <div className="flex flex-wrap gap-2">
                    {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
                      const filterArr = isError ? severityFilter : bugSeverityFilter;
                      const active = filterArr.includes(sev);
                      const colors = { critical: 'rose', high: 'orange', medium: 'amber', low: 'cyan' };
                      const color = colors[sev];
                      return (
                        <button
                          key={sev}
                          onClick={() => {
                            if (isError) {
                              setSeverityFilter(active ? severityFilter.filter(s => s !== sev) : [...severityFilter, sev]);
                            } else {
                              setBugSeverityFilter(active ? bugSeverityFilter.filter(s => s !== sev) : [...bugSeverityFilter, sev]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all border ${active ? `bg-${color}-500/20 text-${color}-400 border-${color}-500/40 shadow-[0_0_10px_rgba(0,0,0,0.2)]` : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'
                            }`}
                        >
                          {sev}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Status</p>
                  <div className="flex flex-col gap-2">
                    {(isError ? ['open', 'resolved'] : ['open', 'in-review', 'fixed', 'verified'] as const).map((stat) => {
                      const filterArr = isError ? statusFilter : bugStatusFilter;
                      // @ts-ignore
                      const active = filterArr.includes(stat);
                      const colors = { open: 'rose', resolved: 'emerald', 'in-review': 'amber', fixed: 'blue', verified: 'emerald' };
                      // @ts-ignore
                      const color = colors[stat];
                      return (
                        <button
                          key={stat}
                          onClick={() => {
                            if (isError) {
                              // @ts-ignore
                              setStatusFilter(active ? statusFilter.filter(s => s !== stat) : [...statusFilter, stat]);
                            } else {
                              // @ts-ignore
                              setBugStatusFilter(active ? bugStatusFilter.filter(s => s !== stat) : [...bugStatusFilter, stat]);
                            }
                          }}
                          className={`px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all text-left flex items-center justify-between border ${active ? `bg-${color}-500/10 text-${color}-400 border-${color}-500/30` : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                        >
                          {stat === 'in-review' ? 'In Review' : stat}
                          {active && <div className={`w-1.5 h-1.5 rounded-full bg-${color}-400 shadow-[0_0_5px_currentColor]`} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

          {/* AI Insight Panel */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-6 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">AI Monitoring Insight</h3>
              </div>
              <p className="text-slate-400 font-medium text-xs leading-relaxed">
                Most errors currently originate from the <span className="text-cyan-400 font-mono text-[10px] bg-cyan-500/10 px-1 rounded">global_handler</span>. ReferenceError frequency has increased by 12% in the last 24h. Recommend reviewing latest deployment logs for root cause.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Table */}
        <div className="lg:col-span-9">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-blue-500/20 rounded-[24px] shadow-[0_12px_40px_rgba(59,130,246,0.15)] overflow-hidden relative group/table h-[800px] flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-50" />

            <div className="relative z-10 flex-1 overflow-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Loading Records...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                    <ShieldAlert className="w-16 h-16 text-emerald-400/50 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                  </motion.div>
                  <p className="text-xl font-black text-white mb-2">System Clear</p>
                  <p className="text-sm font-medium text-slate-400">No {isError ? 'errors' : 'bug reports'} matching current filters.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#080C18] border-b border-white/[0.06] z-20 shadow-sm">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{isError ? 'Message' : 'Title'}</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{isError ? 'Module' : 'Component'}</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Severity</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Time</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {items.map((item: any) => {
                      const isItemError = isError;
                      const title = isItemError ? item.error_message : item.title;
                      const component = isItemError ? item.module : item.component;
                      const time = isItemError ? item.created_at : item.created_at;

                      const sevColors: any = { critical: 'rose', high: 'orange', medium: 'amber', low: 'cyan' };
                      const statColors: any = { open: 'rose', resolved: 'emerald', 'in-review': 'amber', fixed: 'blue', verified: 'emerald' };

                      const sevColor = sevColors[item.severity] || 'slate';
                      const statColor = statColors[item.status] || 'slate';

                      return (
                        <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors relative">
                          {/* Hover left border highlight */}
                          <td className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                          <td className="px-6 py-4 w-1/3">
                            <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 w-fit max-w-full overflow-hidden group-hover:border-indigo-500/20 transition-colors">
                              <p className={`text-xs font-mono truncate text-slate-300 group-hover:text-white transition-colors`} title={title}>
                                {title}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2 py-1 rounded md border border-white/10 bg-white/5 text-[10px] font-bold text-slate-300 font-mono tracking-wider group-hover:border-white/20 transition-colors">
                              {component}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-${sevColor}-500/10 text-${sevColor}-400 border border-${sevColor}-500/20 shadow-[0_0_10px_rgba(0,0,0,0)] group-hover:shadow-[0_0_10px_rgba(var(--${sevColor}-500),0.2)] transition-shadow`}>
                              {item.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-${statColor}-500/10 text-${statColor}-400 border border-${statColor}-500/20`}>
                              <div className={`w-1.5 h-1.5 rounded-full bg-${statColor}-400 ${item.status === 'open' ? 'animate-pulse' : ''}`} />
                              {item.status === 'in-review' ? 'In Review' : item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                              <Clock className="w-3 h-3" />
                              {new Date(time).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => isItemError ? setSelectedError(item) : setSelectedBug(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)] hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:-translate-y-0.5"
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-[#030712] font-sans selection:bg-indigo-500/30 selection:text-white text-slate-200 pb-24">

      {/* Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-[url('/noise.svg')]" />

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

        {/* Top Right System Status */}
        <div className="absolute top-10 right-12 hidden lg:flex items-center gap-3">
          {['Live', 'Monitoring', 'Synced', 'Protected'].map((status, i) => {
            const icons = [Activity, ShieldAlert, Cloud, CheckCircle];
            const colors = ['emerald', 'blue', 'cyan', 'indigo'];
            const Icon = icons[i];
            const color = colors[i];
            return (
              <motion.div key={status} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`flex items-center gap-1.5 bg-${color}-500/10 border border-${color}-500/20 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-${color}-400 shadow-[0_0_10px_rgba(0,0,0,0.1)]`}>
                <Icon className="w-2.5 h-2.5" /> {status}
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
                <ShieldAlert className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" /> Issues & Reports
              </h1>
              <p className="text-slate-400 font-medium text-lg max-w-2xl">
                Monitor application errors, production logs, and bug reports from a unified AI-powered dashboard.
              </p>
            </div>

            {/* Live Status Bar */}
            <div className="flex flex-wrap items-center gap-4 px-6 py-3 rounded-full bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.35)] text-[10px] sm:text-xs font-bold tracking-widest text-slate-400 uppercase">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> Error Monitor Active</span>
            </div>
          </motion.div>
        </div>

        {/* Summary Cards */}
        {!selectedError && !selectedBug && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Open Issues", value: openIssuesCount, icon: Activity, color: "rose" },
              { label: "Critical", value: criticalCount, icon: ShieldAlert, color: "orange" },
              { label: "Resolved Today", value: resolvedTodayCount, icon: CheckCircle, color: "emerald" },
              { label: "AI Detection", value: "Enabled", icon: Bot, color: "indigo", isText: true },
            ].map((stat, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="group relative overflow-hidden flex flex-col items-center justify-center p-5 rounded-[20px] bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-250 hover:-translate-y-1 hover:scale-[1.04] hover:border-white/20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <stat.icon className={`w-6 h-6 text-${stat.color}-400 mb-2 group-hover:scale-110 transition-transform`} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</span>
                <span className={`text-xl font-black ${stat.isText ? `text-${stat.color}-400` : 'text-white'}`}>
                  {stat.isText ? stat.value : <AnimatedNumber value={stat.value as number} />}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tab Switcher */}
        {!selectedError && !selectedBug && (
          <div className="mb-8 flex gap-2 p-1.5 bg-[rgba(8,12,24,0.68)] backdrop-blur-[24px] border border-white/[0.06] rounded-full w-fit shadow-[0_12px_40px_rgba(0,0,0,0.35)] relative z-20">
            {[{ id: 'errors', label: 'Error Logs', icon: Terminal }, { id: 'bugs', label: 'Bug Reports', icon: Bug }].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'errors' | 'bugs')}
                className={`relative px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 z-10 ${activeTab === tab.id ? "text-white" : "text-slate-400 hover:text-white"
                  }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab + (selectedError ? 'e' : '') + (selectedBug ? 'b' : '')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {activeTab === 'errors' ? (selectedError ? renderErrorDetail() : renderFiltersAndTable('errors')) : (selectedBug ? renderBugDetail() : renderFiltersAndTable('bugs'))}
          </motion.div>
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
