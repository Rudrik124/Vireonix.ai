import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Filter,
  RefreshCw,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap,
  ShieldAlert,
  Eye,
  Flame,
  Lock,
  Copyright,
  Calendar,
  User,
  Search,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { usePromptSecurityMonitoring } from '../../../hooks/usePromptSecurityMonitoring';
import type { PromptFilterOptions, PromptSecurityAction } from '../../../services/prompt-security.service';

const metricCards = [
  {
    key: 'totalPrompts',
    label: 'Total Prompts',
    icon: CheckCircle,
    color: 'blue',
    description: 'Total prompts submitted',
  },
  {
    key: 'blockedPrompts',
    label: 'Blocked Prompts',
    icon: AlertCircle,
    color: 'red',
    description: 'Prompts blocked entirely',
  },
  {
    key: 'flaggedPrompts',
    label: 'Flagged Prompts',
    icon: ShieldAlert,
    color: 'orange',
    description: 'Flagged for moderation',
  },
  {
    key: 'nsfwDetections',
    label: 'NSFW Detection',
    icon: Eye,
    color: 'pink',
    description: 'NSFW content detected',
  },
  {
    key: 'violenceDetections',
    label: 'Violence Detection',
    icon: Flame,
    color: 'rose',
    description: 'Violent content detected',
  },
  {
    key: 'promptInjectionAttempts',
    label: 'Injection Attempts',
    icon: Lock,
    color: 'amber',
    description: 'Prompt injection attempts',
  },
  {
    key: 'copyrightAbuseDetections',
    label: 'Copyright Abuse',
    icon: Copyright,
    color: 'purple',
    description: 'Copyright violation detected',
  },
  {
    key: 'blockRate',
    label: 'Block Rate',
    icon: BarChart3,
    color: 'cyan',
    description: 'Percentage of blocked prompts',
  },
];

const colorClasses = {
  blue: 'text-blue-400 bg-blue-900/20',
  red: 'text-red-400 bg-red-900/20',
  orange: 'text-orange-400 bg-orange-900/20',
  pink: 'text-pink-400 bg-pink-900/20',
  rose: 'text-rose-400 bg-rose-900/20',
  amber: 'text-amber-400 bg-amber-900/20',
  purple: 'text-purple-400 bg-purple-900/20',
  cyan: 'text-cyan-400 bg-cyan-900/20',
};

const chartColors = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#f97316', // orange
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f59e0b', // amber
  '#a855f7', // purple
  '#06b6d4', // cyan
];

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  description,
  isLoading,
  suffix = '',
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  description: string;
  isLoading: boolean;
  suffix?: string;
}) {
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
        <Icon className={`w-5 h-5 ${colorClasses[color as keyof typeof colorClasses]}`} />
      </div>
      <div>
        {isLoading ? (
          <div className="h-8 bg-slate-700/30 rounded w-16 animate-pulse"></div>
        ) : (
          <motion.div
            key={value}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`text-2xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}
          >
            {value.toLocaleString()}
            {suffix}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export function PromptSecurityMonitoringDashboard() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userId, setUserId] = useState('');
  const [actionFilter, setActionFilter] = useState<PromptSecurityAction | ''>('');
  const [minConfidence, setMinConfidence] = useState(0);
  const [trendDays, setTrendDays] = useState(7);

  const filters: PromptFilterOptions = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      userId: userId || undefined,
      action: (actionFilter || undefined) as PromptSecurityAction | undefined,
      minConfidence: minConfidence > 0 ? minConfidence : undefined,
    }),
    [startDate, endDate, userId, actionFilter, minConfidence]
  );

  const {
    metrics,
    events,
    moderationBreakdown,
    trends,
    severityDistribution,
    highConfidenceDetections,
    totalEvents,
    isLoading,
    error,
    isConnected,
    refresh,
    page,
    totalPages,
    goToPage,
  } = usePromptSecurityMonitoring(filters, trendDays);

  const handleRefresh = async () => {
    await refresh();
  };

  const actions: PromptSecurityAction[] = [
    'PROMPT_SUBMITTED',
    'PROMPT_BLOCKED',
    'NSFW_DETECTION',
    'VIOLENCE_DETECTION',
    'PROMPT_INJECTION',
    'COPYRIGHT_ABUSE',
  ];

  const formatValue = (key: string, value: number) => {
    if (key === 'blockRate') return value.toFixed(2) + '%';
    return value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Prompt Security Monitoring</h1>
          <div className="flex items-center gap-2"></div>
        </div>

        <motion.button
          onClick={handleRefresh}
          disabled={isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/40 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 backdrop-blur-md"
        >
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Metrics Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {metricCards.map((card) => (
          <MetricCard
            key={card.key}
            label={card.label}
            value={metrics[card.key as keyof typeof metrics] as number}
            icon={card.icon}
            color={card.color}
            description={card.description}
            isLoading={isLoading}
            suffix={card.key === 'blockRate' ? '%' : ''}
          />
        ))}
      </motion.div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" /> Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Start Date */}
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

          {/* End Date */}
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

          {/* User ID */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">User ID</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by user..."
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 pl-9 text-white text-sm"
              />
            </div>
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as PromptSecurityAction | '')}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Min Confidence */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Min Confidence %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="0-100"
            />
          </div>

          {/* Trend Days */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Trend Days</label>
            <select
              value={trendDays}
              onChange={(e) => setTrendDays(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Chart */}
        {trends.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Prompt Security Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="submitted"
                  stroke="#3b82f6"
                  name="Submitted"
                  dot={{ fill: '#3b82f6' }}
                />
                <Line
                  type="monotone"
                  dataKey="blocked"
                  stroke="#ef4444"
                  name="Blocked"
                  dot={{ fill: '#ef4444' }}
                />
                <Line
                  type="monotone"
                  dataKey="flagged"
                  stroke="#f97316"
                  name="Flagged"
                  dot={{ fill: '#f97316' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Moderation Breakdown */}
        {moderationBreakdown.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Moderation Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={moderationBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="type" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Severity Distribution & Moderation List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution */}
        {severityDistribution.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Severity Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={severityDistribution}
                  dataKey="count"
                  nameKey="severity"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                >
                  {severityDistribution.map((entry, index) => {
                    const colorMap: Record<string, string> = {
                      CRITICAL: '#ef4444',
                      WARNING: '#f97316',
                      INFO: '#3b82f6',
                    };
                    return <Cell key={`cell-${index}`} fill={colorMap[entry.severity]} />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {severityDistribution.map((item) => (
                <div key={item.severity} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{item.severity}</span>
                  <span className="font-semibold text-white">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* High Confidence Detections */}
        {highConfidenceDetections.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2 rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              High Confidence Detections (≥80%)
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {highConfidenceDetections.map((detection) => (
                <motion.div
                  key={detection.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-lg border border-slate-700/30 bg-slate-800/30"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          detection.action === 'NSFW_DETECTION'
                            ? 'text-pink-400 bg-pink-900/20'
                            : detection.action === 'VIOLENCE_DETECTION'
                            ? 'text-rose-400 bg-rose-900/20'
                            : detection.action === 'PROMPT_INJECTION'
                            ? 'text-amber-400 bg-amber-900/20'
                            : 'text-purple-400 bg-purple-900/20'
                        }`}
                      >
                        {detection.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(detection.created_at).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-300">
                      {((detection.metadata?.confidence_score || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {detection.event_message}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Events Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md overflow-hidden"
      >
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">
            Prompt Security Events ({totalEvents})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="animate-pulse">Loading prompt security events...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No prompt security events found</div>
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
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Confidence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, idx) => (
                    <motion.tr
                      key={event.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {new Date(event.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                            event.action === 'PROMPT_BLOCKED'
                              ? 'text-red-400 bg-red-900/20'
                              : event.action === 'NSFW_DETECTION'
                              ? 'text-pink-400 bg-pink-900/20'
                              : event.action === 'VIOLENCE_DETECTION'
                              ? 'text-rose-400 bg-rose-900/20'
                              : event.action === 'PROMPT_INJECTION'
                              ? 'text-amber-400 bg-amber-900/20'
                              : event.action === 'COPYRIGHT_ABUSE'
                              ? 'text-purple-400 bg-purple-900/20'
                              : 'text-blue-400 bg-blue-900/20'
                          }`}
                        >
                          <AlertCircle className="w-3 h-3" />
                          {event.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {event.user_id ? event.user_id.substring(0, 8) + '...' : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="text-slate-300 font-semibold">
                          {((event.metadata?.confidence_score || 0) * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                            event.severity === 'CRITICAL'
                              ? 'text-rose-400 bg-rose-900/20'
                              : event.severity === 'WARNING'
                              ? 'text-amber-400 bg-amber-900/20'
                              : 'text-blue-400 bg-blue-900/20'
                          }`}
                        >
                          {event.severity === 'CRITICAL' && <AlertCircle className="w-3 h-3" />}
                          {event.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 truncate max-w-xs">
                        {event.event_message}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Page {page} of {totalPages} ({totalEvents} total events)
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

