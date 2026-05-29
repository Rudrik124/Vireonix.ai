import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, AlertCircle, CheckCircle, Trash2, RotateCcw } from "lucide-react";
import { useAuth } from "../../../app/context/auth-context";
import {
  fetchErrorLogs,
  resolveError,
  reopenError,
  deleteErrorLog,
  type ErrorLog,
  type ErrorSeverity,
  type ErrorStatus,
} from "../../../services/error-logs.service";

export function DeveloperErrorLogsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filters
  const [timeRange, setTimeRange] = useState<'today' | 'last7days' | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<ErrorSeverity[]>(['critical', 'high', 'medium', 'low']);
  const [statusFilter, setStatusFilter] = useState<ErrorStatus[]>(['open', 'resolved']);
  const [searchQuery, setSearchQuery] = useState('');

  // Load errors
  useEffect(() => {
    loadErrors();
  }, [timeRange, severityFilter, statusFilter]);

  const loadErrors = async () => {
    setIsLoading(true);
    const logs = await fetchErrorLogs({
      timeRange,
      severity: severityFilter,
      status: statusFilter,
    });
    
    // Filter by search query
    let filtered = logs;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = logs.filter(
        (log) =>
          log.error_message.toLowerCase().includes(query) ||
          log.module.toLowerCase().includes(query) ||
          log.route.toLowerCase().includes(query)
      );
    }

    setErrors(filtered);
    setIsLoading(false);
  };

  const handleResolveError = async (errorId: string) => {
    if (!profile?.id) return;
    setIsUpdating(true);
    const success = await resolveError(errorId, profile.id);
    if (success) {
      setErrors((prev) =>
        prev.map((e) =>
          e.id === errorId
            ? { ...e, status: 'resolved' as const, resolved_at: new Date().toISOString() }
            : e
        )
      );
      if (selectedError?.id === errorId) {
        setSelectedError({ ...selectedError, status: 'resolved' as const });
      }
    }
    setIsUpdating(false);
  };

  const handleReopenError = async (errorId: string) => {
    setIsUpdating(true);
    const success = await reopenError(errorId);
    if (success) {
      setErrors((prev) =>
        prev.map((e) =>
          e.id === errorId
            ? { ...e, status: 'open' as const, resolved_at: undefined }
            : e
        )
      );
      if (selectedError?.id === errorId) {
        setSelectedError({ ...selectedError, status: 'open' as const });
      }
    }
    setIsUpdating(false);
  };

  const handleDeleteError = async (errorId: string) => {
    if (confirm('Are you sure you want to delete this error log?')) {
      setIsUpdating(true);
      const success = await deleteErrorLog(errorId);
      if (success) {
        setErrors((prev) => prev.filter((e) => e.id !== errorId));
        if (selectedError?.id === errorId) {
          setSelectedError(null);
        }
      }
      setIsUpdating(false);
    }
  };

  const getSeverityColor = (severity: ErrorSeverity) => {
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

  const getStatusColor = (status: ErrorStatus) => {
    return status === 'open' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400';
  };


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
          <h1 className="text-3xl font-bold">Error Logs</h1>
          <p className="text-sm text-slate-400 mt-1">Monitor and resolve system failures in real-time</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {selectedError ? (
          // Error Detail View
          <div className="bg-slate-800 rounded border border-slate-700 p-6">
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
            ) : errors.length === 0 ? (
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
                    {errors.map((error) => (
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
                          {new Date(error.timestamp).toLocaleString()}
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
        )}
      </div>
    </div>
  );
}
