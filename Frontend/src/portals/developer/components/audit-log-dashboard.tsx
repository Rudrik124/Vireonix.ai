import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  FileText,
  LogIn,
  LogOut,
  Upload,
  MessageSquare,
  Video,
  Shield,
  Calendar,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuditLog } from "../../../hooks/useAuditLog";
import type { AuditEventType, AuditSeverity } from "../../../services/audit-log.service";

const EVENT_TYPE_INFO: Record<AuditEventType, { icon: any; color: string; description: string }> = {
  LOGIN: {
    icon: LogIn,
    color: "blue",
    description: "User session initiated",
  },
  LOGOUT: {
    icon: LogOut,
    color: "slate",
    description: "User session ended",
  },
  UPLOAD: {
    icon: Upload,
    color: "cyan",
    description: "File uploaded to system",
  },
  PROMPT_SUBMISSION: {
    icon: MessageSquare,
    color: "purple",
    description: "Prompt submitted for processing",
  },
  VIDEO_GENERATION: {
    icon: Video,
    color: "pink",
    description: "Video generated from prompt",
  },
  ADMIN_ACTION: {
    icon: Shield,
    color: "orange",
    description: "Administrative action performed",
  },
};

const SEVERITY_COLORS: Record<AuditSeverity, string> = {
  INFO: "bg-blue-900/20 text-blue-400 border-blue-700/30",
  WARNING: "bg-orange-900/20 text-orange-400 border-orange-700/30",
  CRITICAL: "bg-rose-900/20 text-rose-400 border-rose-700/30",
};

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  description,
  isLoading,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  description: string;
  isLoading: boolean;
}) {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-400 bg-blue-900/20",
    slate: "text-slate-400 bg-slate-800/20",
    cyan: "text-cyan-400 bg-cyan-900/20",
    purple: "text-purple-400 bg-purple-900/20",
    pink: "text-pink-400 bg-pink-900/20",
    orange: "text-orange-400 bg-orange-900/20",
    green: "text-green-400 bg-green-900/20",
    red: "text-red-400 bg-red-900/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-300">{label}</h3>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        <Icon className={`w-5 h-5 ${colorClasses[color]}`} />
      </div>
      <div>
        {isLoading ? (
          <div className="h-8 bg-slate-700/30 rounded w-16 animate-pulse"></div>
        ) : (
          <motion.div
            key={value}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`text-2xl font-bold ${colorClasses[color]}`}
          >
            {value.toLocaleString()}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export function AuditLogDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<AuditEventType | "">("");
  const [severityFilter, setSeverityFilter] = useState<AuditSeverity | "">("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("");

  const filters = useMemo(
    () => ({
      searchQuery: searchQuery || undefined,
      eventType: (eventTypeFilter || undefined) as AuditEventType | undefined,
      severity: (severityFilter || undefined) as AuditSeverity | undefined,
      userId: userIdFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      resourceType: resourceTypeFilter || undefined,
    }),
    [searchQuery, eventTypeFilter, severityFilter, userIdFilter, startDate, endDate, resourceTypeFilter]
  );

  const {
    logs,
    metrics,
    stats,
    trends,
    isLoading,
    error,
    page,
    totalPages,
    totalLogs,
    goToPage,
    refresh,
    exportToCSV,
    exportToPDF,
    updateFilters: applyFilters,
  } = useAuditLog(filters);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setEventTypeFilter("");
    setSeverityFilter("");
    setUserIdFilter("");
    setStartDate("");
    setEndDate("");
    setResourceTypeFilter("");
  };

  const eventTypeOptions: AuditEventType[] = [
    "LOGIN",
    "LOGOUT",
    "UPLOAD",
    "PROMPT_SUBMISSION",
    "VIDEO_GENERATION",
    "ADMIN_ACTION",
  ];

  const severityOptions: AuditSeverity[] = ["INFO", "WARNING", "CRITICAL"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Audit Log System</h1>
          <p className="text-sm text-slate-400">Track and audit all system events and user activities</p>
        </div>

        <div className="flex gap-2">
          <motion.button
            onClick={exportToCSV}
            disabled={isLoading || logs.length === 0}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600/30 border border-green-500/40 text-green-300 hover:bg-green-600/40 disabled:opacity-50"
            title="Export to CSV"
          >
            <Download className="w-4 h-4" />
            CSV
          </motion.button>

          <motion.button
            onClick={exportToPDF}
            disabled={isLoading || logs.length === 0}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/30 border border-red-500/40 text-red-300 hover:bg-red-600/40 disabled:opacity-50"
            title="Export to PDF"
          >
            <FileText className="w-4 h-4" />
            PDF
          </motion.button>

          <motion.button
            onClick={refresh}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/40 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </motion.button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-4"
        >
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Metrics Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4"
      >
        <MetricCard
          label="Total Events"
          value={metrics.totalEvents}
          icon={BarChart3}
          color="blue"
          description="All recorded events"
          isLoading={isLoading}
        />
        <MetricCard
          label="Logins"
          value={metrics.loginCount}
          icon={LogIn}
          color="blue"
          description="User sessions started"
          isLoading={isLoading}
        />
        <MetricCard
          label="Uploads"
          value={metrics.uploadCount}
          icon={Upload}
          color="cyan"
          description="Files uploaded"
          isLoading={isLoading}
        />
        <MetricCard
          label="Prompts"
          value={metrics.promptSubmissionCount}
          icon={MessageSquare}
          color="purple"
          description="Prompts submitted"
          isLoading={isLoading}
        />
        <MetricCard
          label="Videos"
          value={metrics.videoGenerationCount}
          icon={Video}
          color="pink"
          description="Videos generated"
          isLoading={isLoading}
        />
        <MetricCard
          label="Admin Actions"
          value={metrics.adminActionCount}
          icon={Shield}
          color="orange"
          description="Administrative actions"
          isLoading={isLoading}
        />
      </motion.div>

      {/* Summary Statistics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Unique Users</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{metrics.uniqueUsersCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-900/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Critical Events</p>
              <p className="text-3xl font-bold text-rose-400 mt-1">{metrics.criticalEventsCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-rose-900/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-rose-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Warning Events</p>
              <p className="text-3xl font-bold text-amber-400 mt-1">{metrics.warningEventsCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-900/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Event Type Distribution */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Event Type Distribution</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {stats.map((stat) => {
            const info = EVENT_TYPE_INFO[stat.type];
            const Icon = info.icon;
            const colorClasses: Record<string, string> = {
              blue: "text-blue-400 bg-blue-900/20",
              slate: "text-slate-400 bg-slate-800/20",
              cyan: "text-cyan-400 bg-cyan-900/20",
              purple: "text-purple-400 bg-purple-900/20",
              pink: "text-pink-400 bg-pink-900/20",
              orange: "text-orange-400 bg-orange-900/20",
            };

            return (
              <div key={stat.type} className="border border-slate-700/30 rounded-lg p-3 bg-slate-800/30">
                <div className="flex items-start gap-2 mb-2">
                  <Icon className={`w-5 h-5 flex-shrink-0 ${colorClasses[info.color]}`} />
                  <div>
                    <p className="text-xs font-semibold text-slate-300">{stat.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-slate-500">{stat.percentage}%</p>
                  </div>
                </div>
                <p className={`text-lg font-bold ${colorClasses[info.color]}`}>{stat.count}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Trends Chart */}
      {trends.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Event Trends (7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                labelStyle={{ color: "#f1f5f9" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="login"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                name="Logins"
              />
              <Area
                type="monotone"
                dataKey="logout"
                stackId="1"
                stroke="#64748b"
                fill="#64748b"
                name="Logouts"
              />
              <Area
                type="monotone"
                dataKey="upload"
                stackId="1"
                stroke="#06b6d4"
                fill="#06b6d4"
                name="Uploads"
              />
              <Area
                type="monotone"
                dataKey="promptSubmission"
                stackId="1"
                stroke="#a855f7"
                fill="#a855f7"
                name="Prompts"
              />
              <Area
                type="monotone"
                dataKey="videoGeneration"
                stackId="1"
                stroke="#ec4899"
                fill="#ec4899"
                name="Videos"
              />
              <Area
                type="monotone"
                dataKey="adminAction"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                name="Admin"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
      >
        <div className="relative">
          <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user email, description, action, IP address..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pl-12 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Filter className="w-5 h-5" /> Filters
          </h2>
          <button
            onClick={handleClearFilters}
            className="text-xs px-3 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Event Type</label>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value as AuditEventType | "")}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Event Types</option>
              {eventTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as AuditSeverity | "")}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Severities</option>
              {severityOptions.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">User ID</label>
            <input
              type="text"
              placeholder="Filter by user..."
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Resource Type</label>
            <input
              type="text"
              placeholder="e.g., video, prompt, image..."
              value={resourceTypeFilter}
              onChange={(e) => setResourceTypeFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 pl-9 text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 pl-9 text-white text-sm"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Audit Log Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md overflow-hidden"
      >
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">
            Audit Events ({totalLogs})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="animate-pulse">Loading audit logs...</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No audit events found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Event Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => {
                    const info = EVENT_TYPE_INFO[log.event_type];
                    const Icon = info.icon;
                    const colorClasses: Record<string, string> = {
                      blue: "text-blue-400 bg-blue-900/20",
                      slate: "text-slate-400 bg-slate-800/20",
                      cyan: "text-cyan-400 bg-cyan-900/20",
                      purple: "text-purple-400 bg-purple-900/20",
                      pink: "text-pink-400 bg-pink-900/20",
                      orange: "text-orange-400 bg-orange-900/20",
                    };

                    return (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${colorClasses[info.color]}`} />
                            <span className="text-slate-300">{log.event_type.replace(/_/g, " ")}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div>
                            <p className="text-slate-300 font-mono text-xs">{log.user_email || log.user_id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400 max-w-xs truncate">
                          {log.description}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {log.resource_type ? (
                            <div>
                              <p className="text-slate-300">{log.resource_type}</p>
                              {log.resource_id && <p className="text-xs text-slate-500 font-mono">{log.resource_id}</p>}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${SEVERITY_COLORS[log.severity]}`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-amber-400">
                          {log.ip_address || "-"}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Page {page} of {totalPages} ({totalLogs} total events)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
