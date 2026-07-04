import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  DollarSign,
  Filter,
  RefreshCw,
  Wifi,
  WifiOff,
  User,
  Zap,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { useAICostMonitoring } from '../../../hooks/useAICostMonitoring';
import type { AICostFilterOptions, AIFeatureType } from '../../../services/ai-cost-monitoring.service';

const metricCards = [
  {
    key: 'runwayRequestsToday',
    label: 'Runway Requests Today',
    icon: Zap,
    color: 'blue',
    description: 'AI feature requests processed today',
  },
  {
    key: 'estimatedCostToday',
    label: 'Estimated Cost Today',
    icon: DollarSign,
    color: 'green',
    description: 'Total cost incurred today',
    suffix: '$',
  },
  {
    key: 'costPerUser',
    label: 'Cost Per User',
    icon: User,
    color: 'purple',
    description: 'Average cost per unique user',
    suffix: '$',
  },
  {
    key: 'costPerFeature',
    label: 'Cost Per Feature',
    icon: BarChart3,
    color: 'orange',
    description: 'Average cost per feature type',
    suffix: '$',
  },
];

const colorClasses = {
  blue: 'text-blue-400 bg-blue-900/20',
  green: 'text-green-400 bg-green-900/20',
  purple: 'text-purple-400 bg-purple-900/20',
  orange: 'text-orange-400 bg-orange-900/20',
  red: 'text-red-400 bg-red-900/20',
  cyan: 'text-cyan-400 bg-cyan-900/20',
  pink: 'text-pink-400 bg-pink-900/20',
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
            {suffix}
            {value.toFixed(2)}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export function AICostMonitoringDashboard() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userId, setUserId] = useState('');
  const [featureFilter, setFeatureFilter] = useState<AIFeatureType | ''>('');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [periodDays, setPeriodDays] = useState(7);

  const filters: AICostFilterOptions = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      userId: userId || undefined,
      feature: (featureFilter || undefined) as AIFeatureType | undefined,
    }),
    [startDate, endDate, userId, featureFilter]
  );

  const {
    metrics,
    events,
    featureBreakdown,
    trends,
    totalEvents,
    isLoading,
    error,
    isConnected,
    refresh,
    page,
    totalPages,
    goToPage,
  } = useAICostMonitoring(filters, period, periodDays);

  const handleRefresh = async () => {
    await refresh();
  };

  const features: AIFeatureType[] = [
    'VIDEO_GENERATION',
    'IMAGE_GENERATION',
    'TEXT_ANALYSIS',
    'VOICEOVER_GENERATION',
    'SUBTITLE_GENERATION',
    'SCENE_ANALYSIS',
    'EFFECT_RENDERING',
    'AI_EDIT',
  ];

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Cost Monitoring</h1>
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
            suffix={card.suffix || ''}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-400 mb-2">Total Cost (Period)</p>
            <p className="text-3xl font-bold text-green-400">${metrics.totalCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Average Cost Per Request</p>
            <p className="text-3xl font-bold text-blue-400">${metrics.averageRequestCost.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Total Features</p>
            <p className="text-3xl font-bold text-purple-400">{featureBreakdown.length}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

          {/* Feature Filter */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Feature</label>
            <select
              value={featureFilter}
              onChange={(e) => setFeatureFilter(e.target.value as AIFeatureType | '')}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Features</option>
              {features.map((feature) => (
                <option key={feature} value={feature}>
                  {feature.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selector */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">View Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Trends */}
        {trends.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Cost Trends ({period})</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value: any) => [`$${value.toFixed(2)}`, 'Cost']}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#10b981"
                  fill="#10b981"
                  name="Total Cost"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Request Volume */}
        {trends.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Request Volume ({period})</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="requests" fill="#3b82f6" name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Feature Cost Breakdown */}
      {featureBreakdown.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feature Cost Distribution Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Cost by Feature</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={featureBreakdown}
                  dataKey="totalCost"
                  nameKey="feature"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {featureBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value: any) => `$${value.toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Feature Cost Details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Feature Cost Details</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {featureBreakdown.map((feature, idx) => (
                <motion.div
                  key={feature.feature}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 rounded-lg border border-slate-700/30 bg-slate-800/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">
                      {feature.feature.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400">{feature.count} requests</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Total: ${feature.totalCost.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">Avg: ${feature.averageCost.toFixed(4)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-400">
                        {((feature.totalCost / featureBreakdown.reduce((sum, f) => sum + f.totalCost, 0)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Events Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md overflow-hidden"
      >
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">
            AI Cost Events ({totalEvents})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="animate-pulse">Loading AI cost events...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No AI cost events found</div>
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
                      Feature
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Duration
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
                        {event.user_id || 'System'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="text-blue-400 font-semibold">
                          {event.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 font-mono text-xs">
                        {event.metadata?.model || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="font-semibold text-green-400">
                          ${(event.metadata?.cost || 0).toFixed(4)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {event.metadata?.tokens_used?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {event.metadata?.duration_ms ? `${event.metadata.duration_ms}ms` : 'N/A'}
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

