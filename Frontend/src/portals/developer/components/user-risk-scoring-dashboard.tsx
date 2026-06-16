import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  Filter,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  CheckCircle,
  AlertTriangle,
  Activity,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
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
import { useUserRiskScoring } from '../../../hooks/useUserRiskScoring';
import type { UserRiskScore } from '../../../services/user-risk-scoring.service';

const RISK_COLORS = {
  SAFE: '#10b981',
  SUSPICIOUS: '#f59e0b',
  DANGEROUS: '#ef4444',
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
  const colorClasses: Record<string, string> = {
    green: 'text-green-400 bg-green-900/20',
    orange: 'text-orange-400 bg-orange-900/20',
    red: 'text-red-400 bg-red-900/20',
    blue: 'text-blue-400 bg-blue-900/20',
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

function UserRiskCard({ user, rank }: { user: UserRiskScore; rank: number }) {
  const riskCategory = user.category;
  const riskColor = RISK_COLORS[riskCategory];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="border border-slate-700/50 rounded-lg bg-slate-900/50 hover:bg-slate-800/50 transition-colors p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300">
            #{rank + 1}
          </div>
          <div>
            <p className="text-sm font-mono text-cyan-400">{user.user_id}</p>
            <p className="text-xs text-slate-400 mt-1">{user.event_count} security events</p>
          </div>
        </div>
        <div className="text-right">
          <div
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold"
            style={{ color: riskColor, backgroundColor: `${riskColor}20` }}
          >
            {riskCategory}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-slate-800/50 rounded px-2 py-2">
          <p className="text-xs text-slate-400">Risk Score</p>
          <p className="text-lg font-bold" style={{ color: riskColor }}>
            {user.total_score}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded px-2 py-2">
          <p className="text-xs text-slate-400">Critical</p>
          <p className="text-lg font-bold text-red-400">{user.critical_events}</p>
        </div>
        <div className="bg-slate-800/50 rounded px-2 py-2">
          <p className="text-xs text-slate-400">Warnings</p>
          <p className="text-lg font-bold text-orange-400">{user.warning_events}</p>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        <p>Last Incident: {new Date(user.last_incident).toLocaleDateString()}</p>
      </div>
    </motion.div>
  );
}

export function UserRiskScoringDashboard() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const {
    metrics,
    allScores,
    breakdown,
    trends,
    isLoading,
    error,
    refresh,
    page,
    totalPages,
    goToPage,
  } = useUserRiskScoring(startDate, endDate);

  const handleRefresh = async () => {
    await refresh();
  };

  // Get paginated scores
  const paginatedScores = useMemo(() => {
    const start = (page - 1) * 25;
    return allScores.slice(start, start + 25);
  }, [allScores, page]);

  // Get categorized users
  const safeUsers = useMemo(() => allScores.filter((s) => s.category === 'SAFE'), [allScores]);
  const suspiciousUsers = useMemo(() => allScores.filter((s) => s.category === 'SUSPICIOUS'), [allScores]);
  const dangerousUsers = useMemo(() => allScores.filter((s) => s.category === 'DANGEROUS'), [allScores]);

  // Distribution data for pie chart
  const distributionData = [
    { name: 'Safe', value: metrics.safeUsers, color: RISK_COLORS.SAFE },
    { name: 'Suspicious', value: metrics.suspiciousUsers, color: RISK_COLORS.SUSPICIOUS },
    { name: 'Dangerous', value: metrics.dangerousUsers, color: RISK_COLORS.DANGEROUS },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Risk Scoring System</h1>
          <p className="text-sm text-slate-400">Analyze security events to identify high-risk users</p>
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
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-4"
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
        <MetricCard
          label="Safe Users"
          value={metrics.safeUsers}
          icon={CheckCircle}
          color="green"
          description="0-20 risk score"
          isLoading={isLoading}
        />
        <MetricCard
          label="Suspicious Users"
          value={metrics.suspiciousUsers}
          icon={AlertTriangle}
          color="orange"
          description="21-50 risk score"
          isLoading={isLoading}
        />
        <MetricCard
          label="Dangerous Users"
          value={metrics.dangerousUsers}
          icon={AlertCircle}
          color="red"
          description="51+ risk score"
          isLoading={isLoading}
        />
        <MetricCard
          label="Avg Risk Score"
          value={Math.round(metrics.averageRiskScore)}
          icon={Activity}
          color="blue"
          description="Across all users"
          isLoading={isLoading}
        />
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-400 mb-2">Total Users Analyzed</p>
            <p className="text-4xl font-bold text-white">{metrics.totalUsersAnalyzed}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Safety Percentage</p>
            <p className="text-4xl font-bold text-green-400">
              {metrics.totalUsersAnalyzed > 0
                ? ((metrics.safeUsers / metrics.totalUsersAnalyzed) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" /> Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Pie Chart */}
        {allScores.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">User Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) =>
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Risk Trends */}
        {trends.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Risk Category Trends (7 Days)</h3>
            <ResponsiveContainer width="100%" height={280}>
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
                  dataKey="safeCount"
                  stackId="1"
                  stroke={RISK_COLORS.SAFE}
                  fill={RISK_COLORS.SAFE}
                  name="Safe"
                />
                <Area
                  type="monotone"
                  dataKey="suspiciousCount"
                  stackId="1"
                  stroke={RISK_COLORS.SUSPICIOUS}
                  fill={RISK_COLORS.SUSPICIOUS}
                  name="Suspicious"
                />
                <Area
                  type="monotone"
                  dataKey="dangerousCount"
                  stackId="1"
                  stroke={RISK_COLORS.DANGEROUS}
                  fill={RISK_COLORS.DANGEROUS}
                  name="Dangerous"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Safe Users Section */}
      {safeUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Safe Users ({safeUsers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {safeUsers.slice(0, 9).map((user, idx) => (
              <UserRiskCard key={user.user_id} user={user} rank={idx} />
            ))}
          </div>
          {safeUsers.length > 9 && (
            <p className="text-sm text-slate-400 mt-4">
              +{safeUsers.length - 9} more safe users
            </p>
          )}
        </motion.div>
      )}

      {/* Suspicious Users Section */}
      {suspiciousUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Suspicious Users ({suspiciousUsers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {suspiciousUsers.slice(0, 9).map((user, idx) => (
              <UserRiskCard key={user.user_id} user={user} rank={idx} />
            ))}
          </div>
          {suspiciousUsers.length > 9 && (
            <p className="text-sm text-slate-400 mt-4">
              +{suspiciousUsers.length - 9} more suspicious users
            </p>
          )}
        </motion.div>
      )}

      {/* Dangerous Users Section */}
      {dangerousUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            Dangerous Users ({dangerousUsers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dangerousUsers.slice(0, 9).map((user, idx) => (
              <UserRiskCard key={user.user_id} user={user} rank={idx} />
            ))}
          </div>
          {dangerousUsers.length > 9 && (
            <p className="text-sm text-slate-400 mt-4">
              +{dangerousUsers.length - 9} more dangerous users
            </p>
          )}
        </motion.div>
      )}

      {/* All Users Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md overflow-hidden"
      >
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">All Users ({allScores.length})</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="animate-pulse">Loading user risk data...</div>
          </div>
        ) : paginatedScores.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No users found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">User ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Risk Score</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Events</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Critical</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Warnings</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Last Incident</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedScores.map((user, idx) => (
                    <motion.tr
                      key={user.user_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-mono text-cyan-400">{user.user_id}</td>
                      <td className="px-6 py-4 text-sm font-bold" style={{ color: RISK_COLORS[user.category] }}>
                        {user.total_score}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            color: RISK_COLORS[user.category],
                            backgroundColor: `${RISK_COLORS[user.category]}20`,
                          }}
                        >
                          {user.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">{user.event_count}</td>
                      <td className="px-6 py-4 text-sm text-red-400 font-semibold">{user.critical_events}</td>
                      <td className="px-6 py-4 text-sm text-orange-400 font-semibold">{user.warning_events}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(user.last_incident).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Page {page} of {totalPages} ({allScores.length} total users)
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
