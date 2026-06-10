import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, AlertCircle, CheckCircle, Trash2, RotateCcw } from "lucide-react";
import { useAuth } from "../../../app/context/auth-context";
import { useErrorLogsData } from "../../../hooks/useDashboardData";
import { supabase } from "../../../lib/supabase";

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
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export function DeveloperErrorLogsPage() {
  const navigate = useNavigate();
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

  // Load errors with realtime updates
  const { errorLogs, isLoading } = useErrorLogsData(50, severityFilter);

  // Load bug reports
  useEffect(() => {
    if (activeTab === 'bugs') {
      fetchBugReports();
    }
  }, [activeTab]);

  const fetchBugReports = async () => {
    try {
      setLoadingBugs(true);
      const { data, error } = await supabase
        .from("bug_reports")
        .select("*")
        .order("created_at", { ascending: false });

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
      // Refresh bug list
      await fetchBugReports();
    } catch (error) {
      console.error("Failed to update bug report:", error);
      alert("Failed to update bug report");
    } finally {
      setIsUpdating(false);
    }
  };

  const getSeverityColor = (severity: ErrorSeverity | BugSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-400';
      case 'high':
        return 'bg-orange-500/20 text-orange-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'low':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusColor = (status: ErrorStatus | BugStatus) => {
    if (status === 'open' || status === 'in-review') {
      return 'bg-red-500/20 text-red-400';
    } else if (status === 'resolved' || status === 'fixed' || status === 'verified') {
      return 'bg-green-500/20 text-green-400';
    }
    return 'bg-slate-500/20 text-slate-400';
  };

  // Filter logs by search query and time range
  const filteredErrors = errorLogs.filter((log) => {
    // Time range filter
    if (timeRange === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(log.created_at) < today) return false;
    } else if (timeRange === 'last7days') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (new Date(log.created_at) < sevenDaysAgo) return false;
    }

    // Status filter
    if (!statusFilter.includes(log.status as ErrorStatus)) return false;

    // Search query
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
    // Severity filter
    if (!bugSeverityFilter.includes(bug.severity as BugSeverity)) return false;

    // Status filter
    if (!bugStatusFilter.includes(bug.status as BugStatus)) return false;

    // Search query
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

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <button
            onClick={() => navigate("/developer/dashboard")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Issues & Reports</h1>
              <p className="text-sm text-slate-400 mt-1">Monitor and resolve system failures and bug reports</p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-4 border-t border-slate-700 pt-4">
            <button
              onClick={() => setActiveTab('errors')}
              className={`px-4 py-2 font-bold transition ${
                activeTab === 'errors'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Error Logs
            </button>
            <button
              onClick={() => setActiveTab('bugs')}
              className={`px-4 py-2 font-bold transition ${
                activeTab === 'bugs'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bug Reports
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {activeTab === 'errors' ? (
          selectedError ? (
            <button
              onClick={() => setSelectedError(null)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to List
            </button>

            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-400">Error Message</p>
                  <p className="text-lg font-bold mt-1">{selectedError.error_message}</p>
                </div>
                <span className={`inline-block px-3 py-1 rounded font-bold text-sm ${getStatusColor(selectedError.status)}`}>
                  {selectedError.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-400">Module</p>
                  <p className="font-bold">{selectedError.module}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Route</p>
                  <p className="font-bold">{selectedError.route}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Severity</p>
                  <span className={`inline-block px-3 py-1 rounded font-bold text-sm ${getSeverityColor(selectedError.severity)}`}>
                    {selectedError.severity.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Browser</p>
                  <p className="font-bold">{selectedError.browser || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Device</p>
                  <p className="font-bold">{selectedError.device || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Timestamp</p>
                  <p className="font-bold">{new Date(selectedError.timestamp).toLocaleString()}</p>
                </div>
              </div>

              {selectedError.stack_trace && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Stack Trace</p>
                  <pre className="bg-slate-900 p-4 rounded overflow-auto text-sm text-slate-300 font-mono border border-slate-700 max-h-48">
                    {selectedError.stack_trace}
                  </pre>
                </div>
              )}

              {selectedError.additional_context && Object.keys(selectedError.additional_context).length > 0 && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Additional Context</p>
                  <pre className="bg-slate-900 p-4 rounded overflow-auto text-sm text-slate-300 font-mono border border-slate-700 max-h-48">
                    {JSON.stringify(selectedError.additional_context, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-3">
                {selectedError.status === 'open' ? (
                  <button
                    onClick={() => handleResolveError(selectedError.id)}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold transition disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Mark as Resolved
                  </button>
                ) : (
                  <button
                    onClick={() => handleReopenError(selectedError.id)}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded font-bold transition disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4 inline mr-2" />
                    Reopen
                  </button>
                )}
                <button
                  onClick={() => handleDeleteError(selectedError.id)}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-bold transition disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Error List View
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-slate-800 rounded border border-slate-700 p-6">
              <h2 className="text-lg font-bold mb-4">Filters</h2>
              
              <div className="space-y-4">
                {/* Time Range */}
                <div>
                  <p className="text-sm text-slate-400 mb-2">Time Range</p>
                  <div className="flex gap-2 flex-wrap">
                    {(['today', 'last7days', 'all'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-4 py-2 rounded font-bold transition ${
                          timeRange === range
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {range === 'today' ? 'Today' : range === 'last7days' ? 'Last 7 days' : 'All'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Severity */}
                <div>
                  <p className="text-sm text-slate-400 mb-2">Severity</p>
                  <div className="flex gap-2 flex-wrap">
                    {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (
                      <button
                        key={sev}
                        onClick={() =>
                          setSeverityFilter(
                            severityFilter.includes(sev)
                              ? severityFilter.filter((s) => s !== sev)
                              : [...severityFilter, sev]
                          )
                        }
                        className={`px-4 py-2 rounded font-bold transition ${
                          severityFilter.includes(sev)
                            ? getSeverityColor(sev)
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {sev.charAt(0).toUpperCase() + sev.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p className="text-sm text-slate-400 mb-2">Status</p>
                  <div className="flex gap-2 flex-wrap">
                    {(['open', 'resolved'] as const).map((stat) => (
                      <button
                        key={stat}
                        onClick={() =>
                          setStatusFilter(
                            statusFilter.includes(stat)
                              ? statusFilter.filter((s) => s !== stat)
                              : [...statusFilter, stat]
                          )
                        }
                        className={`px-4 py-2 rounded font-bold transition ${
                          statusFilter.includes(stat)
                            ? getStatusColor(stat)
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {stat.charAt(0).toUpperCase() + stat.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div>
                  <p className="text-sm text-slate-400 mb-2">Search</p>
                  <input
                    type="text"
                    placeholder="Search by message, module, or route..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      // Re-filter when search changes
                    }}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Error List */}
            {isLoading ? (
              <div className="bg-slate-800 rounded border border-slate-700 p-6 text-center">
                <p className="text-slate-400">Loading errors...</p>
              </div>
            ) : filteredErrors.length === 0 ? (
              <div className="bg-slate-800 rounded border border-slate-700 p-6 text-center">
                <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No errors found</p>
              </div>
            ) : (
              <div className="bg-slate-800 rounded border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-700 border-b border-slate-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-bold">Message</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Module</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Severity</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Timestamp</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredErrors.map((error) => (
                      <tr key={error.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition cursor-pointer">
                        <td className="px-6 py-3 text-sm max-w-xs truncate" title={error.error_message}>
                          {error.error_message}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-slate-600 text-slate-200">
                            {error.module}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getSeverityColor(error.severity)}`}>
                            {error.severity}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getStatusColor(error.status)}`}>
                            {error.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-400">
                          {new Date(error.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <button
                            onClick={() => setSelectedError(error)}
                            className="text-blue-400 hover:text-blue-300 font-bold transition"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          // Bug Reports View
          selectedBug ? (
            // Bug Detail View
            <div className="bg-slate-800 rounded border border-slate-700 p-6">
              <button
                onClick={() => setSelectedBug(null)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to List
              </button>

              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">Bug Report</p>
                    <p className="text-lg font-bold mt-1">{selectedBug.title}</p>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded font-bold text-sm ${getStatusColor(selectedBug.status)}`}>
                    {selectedBug.status.toUpperCase()}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2">Description</p>
                  <p className="text-white bg-slate-900 p-3 rounded">{selectedBug.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-slate-400">Component</p>
                    <p className="font-bold">{selectedBug.component}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Severity</p>
                    <span className={`inline-block px-3 py-1 rounded font-bold text-sm ${getSeverityColor(selectedBug.severity)}`}>
                      {selectedBug.severity.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">OS</p>
                    <p className="font-bold">{selectedBug.os}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Browser</p>
                    <p className="font-bold">{selectedBug.browser}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Device</p>
                    <p className="font-bold">{selectedBug.device}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Attachments</p>
                    <p className="font-bold">{selectedBug.attachment_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Submitted</p>
                    <p className="font-bold">{new Date(selectedBug.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Updated</p>
                    <p className="font-bold">{new Date(selectedBug.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedBug.notes && (
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Developer Notes</p>
                    <p className="text-white bg-slate-900 p-3 rounded">{selectedBug.notes}</p>
                  </div>
                )}

                <div className="flex gap-3 flex-wrap">
                  {(['open', 'in-review', 'fixed', 'verified'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleBugStatusUpdate(selectedBug.id, status)}
                      disabled={isUpdating}
                      className={`px-4 py-2 rounded font-bold transition ${
                        selectedBug.status === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      {status === 'in-review' ? 'In Review' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Bug List View
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-slate-800 rounded border border-slate-700 p-6">
                <h2 className="text-lg font-bold mb-4">Filters</h2>
                
                <div className="space-y-4">
                  {/* Severity */}
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Severity</p>
                    <div className="flex gap-2 flex-wrap">
                      {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (
                        <button
                          key={sev}
                          onClick={() =>
                            setBugSeverityFilter(
                              bugSeverityFilter.includes(sev)
                                ? bugSeverityFilter.filter((s) => s !== sev)
                                : [...bugSeverityFilter, sev]
                            )
                          }
                          className={`px-4 py-2 rounded font-bold transition ${
                            bugSeverityFilter.includes(sev)
                              ? getSeverityColor(sev)
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          {sev.charAt(0).toUpperCase() + sev.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Status</p>
                    <div className="flex gap-2 flex-wrap">
                      {(['open', 'in-review', 'fixed', 'verified'] as const).map((stat) => (
                        <button
                          key={stat}
                          onClick={() =>
                            setBugStatusFilter(
                              bugStatusFilter.includes(stat)
                                ? bugStatusFilter.filter((s) => s !== stat)
                                : [...bugStatusFilter, stat]
                            )
                          }
                          className={`px-4 py-2 rounded font-bold transition ${
                            bugStatusFilter.includes(stat)
                              ? getStatusColor(stat)
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          {stat === 'in-review' ? 'In Review' : stat.charAt(0).toUpperCase() + stat.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search */}
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Search</p>
                    <input
                      type="text"
                      placeholder="Search by title, description, or component..."
                      value={bugSearchQuery}
                      onChange={(e) => setBugSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bug List */}
              {loadingBugs ? (
                <div className="bg-slate-800 rounded border border-slate-700 p-6 text-center">
                  <p className="text-slate-400">Loading bug reports...</p>
                </div>
              ) : filteredBugs.length === 0 ? (
                <div className="bg-slate-800 rounded border border-slate-700 p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No bug reports found</p>
                </div>
              ) : (
                <div className="bg-slate-800 rounded border border-slate-700 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-700 border-b border-slate-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-bold">Title</th>
                        <th className="px-6 py-3 text-left text-sm font-bold">Component</th>
                        <th className="px-6 py-3 text-left text-sm font-bold">Severity</th>
                        <th className="px-6 py-3 text-left text-sm font-bold">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-bold">Submitted</th>
                        <th className="px-6 py-3 text-left text-sm font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBugs.map((bug) => (
                        <tr key={bug.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition cursor-pointer">
                          <td className="px-6 py-3 text-sm max-w-xs truncate" title={bug.title}>
                            {bug.title}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-slate-600 text-slate-200">
                              {bug.component}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getSeverityColor(bug.severity)}`}>
                              {bug.severity}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getStatusColor(bug.status)}`}>
                              {bug.status === 'in-review' ? 'In Review' : bug.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-400">
                            {new Date(bug.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <button
                              onClick={() => setSelectedBug(bug)}
                              className="text-blue-400 hover:text-blue-300 font-bold transition"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
