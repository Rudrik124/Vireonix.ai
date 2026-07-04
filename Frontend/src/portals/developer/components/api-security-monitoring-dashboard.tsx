import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  Filter,
  Globe,
  RefreshCw,
  Wifi,
  WifiOff,
  User,
  Server,
  TrendingDown,
  Bot,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { useAPISecurityMonitoring } from '../../../hooks/useAPISecurityMonitoring';
import type { APISecurityFilterOptions, APISecurityAction } from '../../../services/api-security.service';

const metricCards = [
  {
    key: 'totalRequests',
    label: 'Total Requests',
    icon: Server,
    color: 'blue',
    description: 'Total API requests processed',
  },
  {
    key: 'blockedRequests',
    label: 'Blocked Requests',
    icon: Shield,
    color: 'red',
    description: 'Requests rejected by security rules',
  },
  {
    key: 'invalidRequests',
    label: 'Invalid Requests',
    icon: AlertCircle,
    color: 'orange',
    description: 'Malformed or invalid requests',
  },
  {
    key: 'serverErrors',
    label: 'Server Errors',
    icon: TrendingDown,
    color: 'rose',
    description: '5xx status code errors',
  },
  {
    key: 'botActivity',
    label: 'Bot Activity',
    icon: Bot,
    color: 'purple',
    description: 'Detected bot requests',
  },
];

const colorClasses = {
  blue: 'text-blue-400 bg-blue-900/20',
  red: 'text-red-400 bg-red-900/20',
  orange: 'text-orange-400 bg-orange-900/20',
  rose: 'text-rose-400 bg-rose-900/20',
  purple: 'text-purple-400 bg-purple-900/20',
  green: 'text-green-400 bg-green-900/20',
  cyan: 'text-cyan-400 bg-cyan-900/20',
  amber: 'text-amber-400 bg-amber-900/20',
};

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

export function APISecurityMonitoringDashboard() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userId, setUserId] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [actionFilter, setActionFilter] = useState<APISecurityAction | ''>('');
  const [endpoint, setEndpoint] = useState('');
  const [trendDays, setTrendDays] = useState(7);

  const filters: APISecurityFilterOptions = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      userId: userId || undefined,
      ipAddress: ipAddress || undefined,
      action: (actionFilter || undefined) as APISecurityAction | undefined,
      endpoint: endpoint || undefined,
    }),
    [startDate, endDate, userId, ipAddress, actionFilter, endpoint]
  );

  const {
    metrics,
    events,
    endpoints,
    attackPatterns,
    trends,
    totalEvents,
    isLoading,
    error,
    isConnected,
    refresh,
    page,
    totalPages,
    goToPage,
  } = useAPISecurityMonitoring(filters, trendDays);

  const handleRefresh = async () => {
    await refresh();
  };

  const actions: APISecurityAction[] = [
    'REQUEST_RECEIVED',
    'REQUEST_BLOCKED',
    'INVALID_REQUEST',
    'SERVER_ERROR',
    'BOT_DETECTED',
    'SUSPICIOUS_PATTERN',
    'ENDPOINT_ATTACK',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">API Security Monitoring</h1>
          <div className="flex items-center gap-2">
          </div>
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
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
          />
        ))}
      </motion.div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-slate-400 mb-2">Block Rate</p>
            <p className="text-3xl font-bold text-red-400">{metrics.blockRate.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Error Rate</p>
            <p className="text-3xl font-bold text-rose-400">
              {metrics.totalRequests ? ((metrics.serverErrors / metrics.totalRequests) * 100).toFixed(2) : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Bot Percentage</p>
            <p className="text-3xl font-bold text-purple-400">
              {metrics.totalRequests ? ((metrics.botActivity / metrics.totalRequests) * 100).toFixed(2) : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Attack Patterns Detected</p>
            <p className="text-3xl font-bold text-orange-400">{attackPatterns.length}</p>
          </div>
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* IP Address */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">IP Address</label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by IP..."
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 pl-9 text-white text-sm"
              />
            </div>
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as APISecurityAction | '')}
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

          {/* Endpoint Filter */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Endpoint</label>
            <input
              type="text"
              placeholder="Filter by endpoint..."
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
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
        {/* API Activity Trends */}
        {trends.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">API Activity Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  name="Requests"
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  name="Blocked"
                />
                <Area
                  type="monotone"
                  dataKey="errors"
                  stackId="1"
                  stroke="#f97316"
                  fill="#f97316"
                  name="Errors"
                />
                <Area
                  type="monotone"
                  dataKey="bots"
                  stackId="1"
                  stroke="#a855f7"
                  fill="#a855f7"
                  name="Bots"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Response Times by Endpoint */}
        {endpoints.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Avg Response Time by Endpoint</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={endpoints.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="endpoint" 
                  stroke="#94a3b8" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value: any) => [`${value.toFixed(0)}ms`, 'Response Time']}
                />
                <Bar dataKey="avgResponseTime" fill="#10b981" name="Avg Response Time (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Most Attacked Endpoints */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          Most Attacked Endpoints
        </h2>
        {isLoading ? (
          <div className="text-center text-slate-400 py-8">Loading attack patterns...</div>
        ) : attackPatterns.length === 0 ? (
          <div className="text-center text-slate-400 py-8">No attack patterns detected</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                    IP Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                    Endpoint
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                    Attack Count
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                    Last Attack
                  </th>
                </tr>
              </thead>
              <tbody>
                {attackPatterns.map((pattern, idx) => (
                  <motion.tr
                    key={`${pattern.ip_address}_${pattern.endpoint}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-cyan-400">
                      {pattern.ip_address || 'Anonymous'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 truncate max-w-xs">
                      {pattern.endpoint || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-semibold text-white">{pattern.attack_count}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                          pattern.severity === 'CRITICAL'
                            ? 'text-rose-400 bg-rose-900/20'
                            : pattern.severity === 'WARNING'
                            ? 'text-orange-400 bg-orange-900/20'
                            : 'text-blue-400 bg-blue-900/20'
                        }`}
                      >
                        {pattern.severity === 'CRITICAL' && <AlertCircle className="w-3 h-3" />}
                        {pattern.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {new Date(pattern.last_attack).toLocaleString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Top Endpoints Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Endpoint Health</h2>
        {isLoading ? (
          <div className="text-center text-slate-400 py-8">Loading endpoint metrics...</div>
        ) : endpoints.length === 0 ? (
          <div className="text-center text-slate-400 py-8">No endpoint metrics found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                    Endpoint
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                    Total Requests
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                    Blocked
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                    Errors
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                    Avg Response Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                    Threat Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((endpoint, idx) => (
                  <motion.tr
                    key={endpoint.endpoint}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-slate-400 truncate max-w-xs font-mono">
                      {endpoint.endpoint}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs font-semibold">
                        {endpoint.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-white">
                      {endpoint.totalRequests.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-400">
                      {endpoint.blockedRequests.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-orange-400">
                      {endpoint.errors.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-400">
                      {endpoint.avgResponseTime.toFixed(0)}ms
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-700 rounded-full h-2 max-w-[60px]">
                          <div
                            className={`h-2 rounded-full ${
                              endpoint.threatScore > 70
                                ? 'bg-rose-500'
                                : endpoint.threatScore > 40
                                ? 'bg-orange-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(endpoint.threatScore, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-slate-400 w-12 text-right">
                          {endpoint.threatScore.toFixed(0)}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Events Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md overflow-hidden"
      >
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">
            API Security Events ({totalEvents})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="animate-pulse">Loading API security events...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No API security events found</div>
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
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Endpoint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Status Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Severity
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
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {event.user_id || 'Anonymous'}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-cyan-400">
                        {event.ip_address || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                            event.action === 'REQUEST_RECEIVED'
                              ? 'text-blue-400 bg-blue-900/20'
                              : event.action === 'REQUEST_BLOCKED'
                              ? 'text-red-400 bg-red-900/20'
                              : event.action === 'INVALID_REQUEST'
                              ? 'text-orange-400 bg-orange-900/20'
                              : event.action === 'SERVER_ERROR'
                              ? 'text-rose-400 bg-rose-900/20'
                              : event.action === 'BOT_DETECTED'
                              ? 'text-purple-400 bg-purple-900/20'
                              : 'text-amber-400 bg-amber-900/20'
                          }`}
                        >
                          <AlertCircle className="w-3 h-3" />
                          {event.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 truncate max-w-xs font-mono">
                        {event.metadata?.endpoint || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">
                        <span
                          className={`font-semibold ${
                            (event.metadata?.status_code || 0) >= 500
                              ? 'text-red-400'
                              : (event.metadata?.status_code || 0) >= 400
                              ? 'text-orange-400'
                              : 'text-green-400'
                          }`}
                        >
                          {event.metadata?.status_code || 'N/A'}
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
