import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  Filter,
  RefreshCw,
  User,
  LogIn,
  Ban,
  Trash2,
  Shield,
  Settings,
  BarChart3,
  Layers,
  Clock,
} from 'lucide-react';
import {
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
} from 'recharts';
import { useAdminActivityMonitoring } from '../../../hooks/useAdminActivityMonitoring';
import type { AdminActivityFilterOptions, AdminActionType } from '../../../services/admin-activity.service';

const ACTION_INFO: Record<string, { icon: any; color: string; description: string }> = {
  ADMIN_LOGIN: {
    icon: LogIn,
    color: 'blue',
    description: 'Admin session initiated',
  },
  USER_BAN: {
    icon: Ban,
    color: 'orange',
    description: 'User account restricted',
  },
  USER_DELETE: {
    icon: Trash2,
    color: 'rose',
    description: 'User account removed',
  },
  ROLE_CHANGE: {
    icon: Shield,
    color: 'cyan',
    description: 'User permissions modified',
  },
  SETTINGS_CHANGE: {
    icon: Settings,
    color: 'amber',
    description: 'System configuration updated',
  },
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
    blue: 'text-blue-400 bg-blue-900/20',
    orange: 'text-orange-400 bg-orange-900/20',
    rose: 'text-rose-400 bg-rose-900/20',
    cyan: 'text-cyan-400 bg-cyan-900/20',
    amber: 'text-amber-400 bg-amber-900/20',
    green: 'text-green-400 bg-green-900/20',
    purple: 'text-purple-400 bg-purple-900/20',
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

export function AdminActivityMonitoringDashboard() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState<AdminActionType | ''>('');
  const [adminIdFilter, setAdminIdFilter] = useState('');
  const [expandedAdmin, setExpandedAdmin] = useState<string | null>(null);

  const filters: AdminActivityFilterOptions = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      actionType: (actionTypeFilter || undefined) as AdminActionType | undefined,
      adminId: adminIdFilter || undefined,
    }),
    [startDate, endDate, actionTypeFilter, adminIdFilter]
  );

  const {
    activities,
    metrics,
    stats,
    auditHistory,
    trends,
    isLoading,
    error,
    refresh,
    page,
    totalPages,
    totalActivities,
    goToPage,
  } = useAdminActivityMonitoring(filters);

  const handleRefresh = async () => {
    await refresh();
  };

  const actionTypeOptions: AdminActionType[] = [
    'ADMIN_LOGIN',
    'USER_BAN',
    'USER_DELETE',
    'ROLE_CHANGE',
    'SETTINGS_CHANGE',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Activity Monitoring</h1>
          <p className="text-sm text-slate-400">Track and audit all administrator actions</p>
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <MetricCard
          label="Total Actions"
          value={metrics.totalAdminActions}
          icon={Layers}
          color="blue"
          description="All admin actions"
          isLoading={isLoading}
        />
        <MetricCard
          label="Admin Logins"
          value={metrics.totalAdminLogins}
          icon={LogIn}
          color="blue"
          description="Session initiations"
          isLoading={isLoading}
        />
        <MetricCard
          label="Users Banned"
          value={metrics.userBans}
          icon={Ban}
          color="orange"
          description="Restricted accounts"
          isLoading={isLoading}
        />
        <MetricCard
          label="Users Deleted"
          value={metrics.userDeletes}
          icon={Trash2}
          color="rose"
          description="Removed accounts"
          isLoading={isLoading}
        />
        <MetricCard
          label="Active Admins"
          value={metrics.activeAdmins}
          icon={Shield}
          color="green"
          description="Unique admin accounts"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-400 mb-2">Role Changes</p>
            <p className="text-4xl font-bold text-cyan-400">{metrics.roleChanges}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Settings Changes</p>
            <p className="text-4xl font-bold text-amber-400">{metrics.settingsChanges}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Last Admin Login</p>
            <p className="text-lg font-bold text-slate-300">
              {metrics.lastAdminLogin
                ? new Date(metrics.lastAdminLogin).toLocaleString()
                : 'No logins'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Action Type Distribution */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Action Distribution</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {stats.map((stat) => {
            const info = ACTION_INFO[stat.type];
            const Icon = info.icon;
            const colorClasses: Record<string, string> = {
              blue: 'text-blue-400 bg-blue-900/20',
              orange: 'text-orange-400 bg-orange-900/20',
              rose: 'text-rose-400 bg-rose-900/20',
              cyan: 'text-cyan-400 bg-cyan-900/20',
              amber: 'text-amber-400 bg-amber-900/20',
            };

            return (
              <div key={stat.type} className="border border-slate-700/30 rounded-lg p-3 bg-slate-800/30">
                <div className="flex items-start gap-2 mb-2">
                  <Icon className={`w-5 h-5 flex-shrink-0 ${colorClasses[info.color]}`} />
                  <div>
                    <p className="text-xs font-semibold text-slate-300">{stat.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-500">{info.description}</p>
                  </div>
                </div>
                <p className={`text-lg font-bold ${colorClasses[info.color]}`}>{stat.count}</p>
              </div>
            );
          })}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <div>
            <label className="block text-sm text-slate-400 mb-2">Action Type</label>
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value as AdminActionType | '')}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Actions</option>
              {actionTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Admin ID</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by admin..."
                value={adminIdFilter}
                onChange={(e) => setAdminIdFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 pl-9 text-white text-sm"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Activity Trends */}
      {trends.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Activity Trends (7 Days)</h3>
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
                dataKey="logins"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                name="Logins"
              />
              <Area
                type="monotone"
                dataKey="bans"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                name="Bans"
              />
              <Area
                type="monotone"
                dataKey="deletes"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
                name="Deletes"
              />
              <Area
                type="monotone"
                dataKey="roleChanges"
                stackId="1"
                stroke="#06b6d4"
                fill="#06b6d4"
                name="Role Changes"
              />
              <Area
                type="monotone"
                dataKey="settingsChanges"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                name="Settings Changes"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Admin Audit History */}
      {auditHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Admin Audit History</h2>
          <div className="space-y-3">
            {auditHistory.map((admin) => (
              <motion.div
                key={admin.admin_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-slate-700/30 rounded-lg bg-slate-800/50 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedAdmin(expandedAdmin === admin.admin_id ? null : admin.admin_id)
                  }
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">
                        {admin.admin_name || admin.admin_id}
                      </p>
                      <p className="text-xs text-slate-400">{admin.actionCount} total actions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Last action</p>
                    <p className="text-sm text-slate-300">
                      {new Date(admin.lastAction).toLocaleDateString()}
                    </p>
                  </div>
                </button>

                {expandedAdmin === admin.admin_id && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="border-t border-slate-700/30 bg-slate-900/50 px-4 py-3"
                  >
                    <div className="space-y-2">
                      {admin.actions.slice(0, 10).map((action, idx) => {
                        const info = ACTION_INFO[action.action_type];
                        const Icon = info.icon;
                        const colorClasses: Record<string, string> = {
                          blue: 'text-blue-400 bg-blue-900/20',
                          orange: 'text-orange-400 bg-orange-900/20',
                          rose: 'text-rose-400 bg-rose-900/20',
                          cyan: 'text-cyan-400 bg-cyan-900/20',
                          amber: 'text-amber-400 bg-amber-900/20',
                        };

                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-2 rounded bg-slate-800/50 border border-slate-700/20"
                          >
                            <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colorClasses[info.color]}`} />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-slate-300">{action.title}</p>
                              <p className="text-xs text-slate-400 mt-1">{action.description}</p>
                              {action.target_user_id && (
                                <p className="text-xs text-cyan-400 mt-1 font-mono">
                                  Target: {action.target_user_email || action.target_user_id}
                                </p>
                              )}
                              <p className="text-xs text-slate-500 mt-1">
                                {new Date(action.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {admin.actions.length > 10 && (
                        <p className="text-xs text-slate-400 text-center py-2">
                          +{admin.actions.length - 10} more actions
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Activities Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md overflow-hidden"
      >
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">
            Admin Activities ({totalActivities})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="animate-pulse">Loading admin activities...</div>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No admin activities found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Target User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Device
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, idx) => {
                    const info = ACTION_INFO[activity.action_type];
                    const Icon = info.icon;
                    const colorClasses: Record<string, string> = {
                      blue: 'text-blue-400 bg-blue-900/20',
                      orange: 'text-orange-400 bg-orange-900/20',
                      rose: 'text-rose-400 bg-rose-900/20',
                      cyan: 'text-cyan-400 bg-cyan-900/20',
                      amber: 'text-amber-400 bg-amber-900/20',
                    };

                    return (
                      <motion.tr
                        key={activity.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${colorClasses[info.color]}`} />
                            <span className="text-slate-300">{activity.action_type.replace(/_/g, ' ')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-cyan-400">
                          {activity.admin_name || activity.admin_id}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {activity.target_user_email || activity.target_user_id || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-amber-400">
                          {activity.ip_address || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {activity.device_info || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {new Date(activity.created_at).toLocaleString()}
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
                Page {page} of {totalPages} ({totalActivities} total activities)
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
