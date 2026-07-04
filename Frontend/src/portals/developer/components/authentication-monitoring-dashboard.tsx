import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Lock,
  LogIn,
  AlertTriangle,
  Smartphone,
  Globe,
  Calendar,
  User,
  Search,
  RefreshCw,
  Wifi,
  WifiOff,
  Shield,
  Zap,
  BarChart3,
  Eye,
} from 'lucide-react';
import { useAuthenticationMonitoring, type AuthMonitoringData } from '../../../hooks/useAuthenticationMonitoring';
import type { AuthFilterOptions, AuthEventType } from '../../../services/auth-monitoring.service';

const statCards = [
  {
    key: 'successfulLogins',
    label: 'Successful Logins',
    icon: CheckCircle,
    color: 'green',
    description: 'Total successful login attempts',
  },
  {
    key: 'failedLogins',
    label: 'Failed Logins',
    icon: XCircle,
    color: 'red',
    description: 'Failed authentication attempts',
  },
  {
    key: 'passwordResets',
    label: 'Password Resets',
    icon: Lock,
    color: 'amber',
    description: 'Password reset requests',
  },
  {
    key: 'oauthLogins',
    label: 'OAuth Logins',
    icon: LogIn,
    color: 'blue',
    description: 'Third-party authentication',
  },
  {
    key: 'suspiciousLogins',
    label: 'Suspicious Logins',
    icon: AlertTriangle,
    color: 'rose',
    description: 'Flagged as suspicious activity',
  },
  {
    key: 'uniqueIPs',
    label: 'Unique IPs',
    icon: Globe,
    color: 'purple',
    description: 'Unique IP addresses',
  },
  {
    key: 'uniqueDevices',
    label: 'Unique Devices',
    icon: Smartphone,
    color: 'cyan',
    description: 'Unique device types',
  },
  {
    key: 'uniqueBrowsers',
    label: 'Unique Browsers',
    icon: BarChart3,
    color: 'indigo',
    description: 'Unique browsers used',
  },
];

const colorClasses = {
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-400',
    icon: 'text-green-400',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-400',
    icon: 'text-red-400',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    icon: 'text-amber-400',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    icon: 'text-blue-400',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    icon: 'text-rose-400',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    icon: 'text-purple-400',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    icon: 'text-cyan-400',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    text: 'text-indigo-400',
    icon: 'text-indigo-400',
  },
};

function StatCard({
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
  const colors = colorClasses[color as keyof typeof colorClasses];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${colors.border} ${colors.bg} backdrop-blur-md p-4`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-300">{label}</h3>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        <Icon className={`w-5 h-5 ${colors.icon}`} />
      </div>
      <div>
        {isLoading ? (
          <div className="h-8 bg-slate-700/30 rounded w-16 animate-pulse"></div>
        ) : (
          <motion.div
            key={value}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`text-2xl font-bold ${colors.text}`}
          >
            {value.toLocaleString()}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export function AuthenticationMonitoringDashboard() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userId, setUserId] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [actionFilter, setActionFilter] = useState<AuthEventType | ''>('');

  const filters: AuthFilterOptions = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      userId: userId || undefined,
      ipAddress: ipAddress || undefined,
      action: (actionFilter || undefined) as AuthEventType | undefined,
    }),
    [startDate, endDate, userId, ipAddress, actionFilter]
  );

  const {
    stats,
    events,
    ipTracking,
    deviceInfo,
    browserInfo,
    totalEvents,
    isLoading,
    error,
    isConnected,
    refresh,
    page,
    totalPages,
    goToPage,
  } = useAuthenticationMonitoring(filters);

  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const handleRefresh = async () => {
    await refresh();
  };

  const authActions: AuthEventType[] = [
    'LOGIN_SUCCESS',
    'LOGIN_FAILURE',
    'PASSWORD_RESET',
    'OAUTH_LOGIN',
    'SUSPICIOUS_LOGIN',
    'LOGOUT',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Authentication Monitoring</h1>
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

      {/* Statistics Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={stats[card.key as keyof typeof stats] as number}
            icon={card.icon}
            color={card.color}
            description={card.description}
            isLoading={isLoading}
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
        <h2 className="text-lg font-semibold text-white mb-4">Filters</h2>
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
              onChange={(e) => setActionFilter(e.target.value as AuthEventType | '')}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Actions</option>
              {authActions.map((action) => (
                <option key={action} value={action}>
                  {action.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Events Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md overflow-hidden"
      >
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">
            Authentication Events ({totalEvents})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="animate-pulse">Loading authentication events...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No authentication events found</div>
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
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Browser
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Device
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Status
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
                            event.action === 'LOGIN_SUCCESS'
                              ? 'text-green-400 bg-green-900/20'
                              : event.action === 'LOGIN_FAILURE'
                              ? 'text-red-400 bg-red-900/20'
                              : event.action === 'SUSPICIOUS_LOGIN'
                              ? 'text-rose-400 bg-rose-900/20'
                              : event.action === 'OAUTH_LOGIN'
                              ? 'text-blue-400 bg-blue-900/20'
                              : event.action === 'PASSWORD_RESET'
                              ? 'text-amber-400 bg-amber-900/20'
                              : 'text-slate-400 bg-slate-900/20'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {event.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 truncate max-w-xs">
                        {event.user_id ? event.user_id.substring(0, 8) + '...' : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{event.ip_address || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {event.metadata?.browser || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {event.metadata?.device_type || 'Unknown'}
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
                          {event.severity === 'CRITICAL' && <AlertTriangle className="w-3 h-3" />}
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

      {/* IP Tracking Section */}
      {ipTracking.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">IP Address Tracking</h2>
          <div className="space-y-3">
            {ipTracking.slice(0, 10).map((ip) => (
              <div key={ip.ip_address} className="p-4 rounded bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-mono text-sm text-slate-300">{ip.ip_address}</p>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-xs text-slate-500">
                      <div>Total: {ip.count}</div>
                      <div className="text-green-400">Success: {ip.successCount}</div>
                      <div className="text-red-400">Failed: {ip.failureCount}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Last seen</p>
                    <p className="text-sm text-slate-300">
                      {new Date(ip.lastSeen).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Device & Browser Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Devices */}
        {deviceInfo.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Device Information</h3>
            <div className="space-y-3">
              {deviceInfo.map((device) => (
                <div key={device.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-slate-300">{device.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500"
                        style={{ width: `${device.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-400">{device.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Browsers */}
        {browserInfo.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Browser Information</h3>
            <div className="space-y-3">
              {browserInfo.map((browser) => (
                <div key={browser.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm text-slate-300">{browser.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: `${browser.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-400">{browser.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

