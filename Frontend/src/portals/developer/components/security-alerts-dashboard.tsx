import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Filter,
  RefreshCw,
  Wifi,
  WifiOff,
  Zap,
  Lock,
  Bug,
  Smartphone,
  TrendingUp,
  FileWarning,
  MessageCircle,
  Clock,
  Check,
  X,
  Lightbulb,
} from 'lucide-react';
import { useSecurityAlerts } from '../../../hooks/useSecurityAlerts';
import type { AlertFilterOptions, AlertSeverity, AlertType } from '../../../services/security-alerts.service';

const ALERT_TYPE_INFO: Record<string, { icon: any; color: string; description: string }> = {
  MALWARE_UPLOAD: {
    icon: Bug,
    color: 'rose',
    description: 'Malicious file uploaded to system',
  },
  PROMPT_INJECTION: {
    icon: MessageCircle,
    color: 'orange',
    description: 'Prompt injection attack detected',
  },
  EXCESSIVE_VIDEO_GENERATION: {
    icon: TrendingUp,
    color: 'amber',
    description: 'Excessive video generation activity',
  },
  ADMIN_LOGIN_NEW_DEVICE: {
    icon: Smartphone,
    color: 'cyan',
    description: 'Admin login from new device',
  },
  API_ABUSE: {
    icon: Zap,
    color: 'red',
    description: 'API abuse or rate limit violation',
  },
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'rose',
  WARNING: 'orange',
  INFO: 'blue',
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
  const colorClasses: Record<string, string> = {
    rose: 'text-rose-400 bg-rose-900/20',
    orange: 'text-orange-400 bg-orange-900/20',
    amber: 'text-amber-400 bg-amber-900/20',
    cyan: 'text-cyan-400 bg-cyan-900/20',
    red: 'text-red-400 bg-red-900/20',
    blue: 'text-blue-400 bg-blue-900/20',
    green: 'text-green-400 bg-green-900/20',
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

function AlertActionModal({
  alert,
  action,
  onClose,
  onConfirm,
  isLoading,
}: {
  alert: any;
  action: 'acknowledge' | 'resolve';
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  isLoading: boolean;
}) {
  const [notes, setNotes] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-md w-full"
      >
        <h2 className="text-lg font-bold text-white mb-2">
          {action === 'acknowledge' ? 'Acknowledge Alert' : 'Resolve Alert'}
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          {action === 'acknowledge'
            ? 'Mark this alert as acknowledged. This indicates you have reviewed it.'
            : 'Mark this alert as resolved. Provide notes on the resolution.'}
        </p>

        <div className="bg-slate-800/50 rounded p-3 mb-4 text-sm">
          <p className="text-slate-300 font-mono">{alert.title}</p>
          <p className="text-slate-400 text-xs mt-1">{alert.description}</p>
        </div>

        {action === 'resolve' && (
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">Resolution Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the resolution taken..."
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              rows={3}
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded bg-slate-800 border border-slate-700 text-slate-300 text-sm hover:bg-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(action === 'resolve' ? notes : undefined)}
            disabled={isLoading}
            className="px-4 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : action === 'acknowledge' ? 'Acknowledge' : 'Resolve'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function SecurityAlertsDashboard() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [alertTypeFilter, setAlertTypeFilter] = useState<AlertType | ''>('');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | ''>('');
  const [acknowledgedFilter, setAcknowledgedFilter] = useState<boolean | null>(null);
  const [resolvedFilter, setResolvedFilter] = useState<boolean | null>(null);
  const [actionModal, setActionModal] = useState<{
    alert: any;
    action: 'acknowledge' | 'resolve';
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const filters = useMemo(
    () => ({
      startDate,
      endDate,
      alertType: alertTypeFilter,
      severity: severityFilter,
      acknowledged: acknowledgedFilter,
      resolved: resolvedFilter,
    }),
    [startDate, endDate, alertTypeFilter, severityFilter, acknowledgedFilter, resolvedFilter]
  );

  const {
    alerts,
    metrics,
    stats,
    isLoading,
    error,
    isConnected,
    refresh,
    page,
    totalPages,
    totalAlerts,
    goToPage,
    acknowledgeAlert,
    resolveAlert,
  } = useSecurityAlerts(filters);

  const handleRefresh = async () => {
    await refresh();
  };

  const handleAcknowledgeClick = (alert: any) => {
    setActionModal({ alert, action: 'acknowledge' });
  };

  const handleResolveClick = (alert: any) => {
    setActionModal({ alert, action: 'resolve' });
  };

  const handleActionConfirm = async (notes?: string) => {
    if (!actionModal) return;

    setIsActionLoading(true);
    try {
      if (actionModal.action === 'acknowledge') {
        await acknowledgeAlert(actionModal.alert.id);
      } else {
        await resolveAlert(actionModal.alert.id, notes);
      }
      setActionModal(null);
    } finally {
      setIsActionLoading(false);
    }
  };

  const alertTypeOptions: AlertType[] = [
    'MALWARE_UPLOAD',
    'PROMPT_INJECTION',
    'EXCESSIVE_VIDEO_GENERATION',
    'ADMIN_LOGIN_NEW_DEVICE',
    'API_ABUSE',
  ];

  const severityOptions: AlertSeverity[] = ['CRITICAL', 'WARNING', 'INFO'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Security Alerts Center</h1>
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
        <StatCard
          label="Total Alerts"
          value={metrics.totalAlerts}
          icon={AlertCircle}
          color="blue"
          description="All security alerts"
          isLoading={isLoading}
        />
        <StatCard
          label="Critical"
          value={metrics.criticalAlerts}
          icon={AlertTriangle}
          color="rose"
          description="Severity: Critical"
          isLoading={isLoading}
        />
        <StatCard
          label="Unacknowledged"
          value={metrics.unacknowledgedAlerts}
          icon={Clock}
          color="orange"
          description="Pending review"
          isLoading={isLoading}
        />
        <StatCard
          label="Unresolved"
          value={metrics.unresolvedAlerts}
          icon={Lightbulb}
          color="amber"
          description="Pending resolution"
          isLoading={isLoading}
        />
        <StatCard
          label="Acknowledged"
          value={metrics.totalAlerts - metrics.unacknowledgedAlerts}
          icon={CheckCircle}
          color="green"
          description="Already reviewed"
          isLoading={isLoading}
        />
      </motion.div>

      {/* Alert Type Distribution */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Alert Type Distribution</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {stats.map((stat) => {
            const info = ALERT_TYPE_INFO[stat.type];
            const Icon = info.icon;
            const colorClasses: Record<string, string> = {
              rose: 'text-rose-400 bg-rose-900/20',
              orange: 'text-orange-400 bg-orange-900/20',
              amber: 'text-amber-400 bg-amber-900/20',
              cyan: 'text-cyan-400 bg-cyan-900/20',
              red: 'text-red-400 bg-red-900/20',
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
                <div className="flex justify-between items-end mt-2">
                  <span className={`text-lg font-bold ${colorClasses[info.color]}`}>{stat.count}</span>
                  {stat.criticalCount > 0 && (
                    <span className="text-xs text-rose-400">{stat.criticalCount} critical</span>
                  )}
                </div>
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
            <label className="block text-sm text-slate-400 mb-2">Alert Type</label>
            <select
              value={alertTypeFilter}
              onChange={(e) => setAlertTypeFilter(e.target.value as AlertType | '')}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Types</option>
              {alertTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | '')}
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
            <label className="block text-sm text-slate-400 mb-2">Acknowledged</label>
            <select
              value={acknowledgedFilter === null ? '' : acknowledgedFilter ? 'true' : 'false'}
              onChange={(e) =>
                setAcknowledgedFilter(
                  e.target.value === '' ? null : e.target.value === 'true'
                )
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All</option>
              <option value="true">Acknowledged</option>
              <option value="false">Unacknowledged</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Resolved</label>
            <select
              value={resolvedFilter === null ? '' : resolvedFilter ? 'true' : 'false'}
              onChange={(e) =>
                setResolvedFilter(
                  e.target.value === '' ? null : e.target.value === 'true'
                )
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All</option>
              <option value="true">Resolved</option>
              <option value="false">Unresolved</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Alerts Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md overflow-hidden"
      >
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">
            Security Alerts ({totalAlerts})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="animate-pulse">Loading security alerts...</div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No alerts found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      User / IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert, idx) => {
                    const typeInfo = ALERT_TYPE_INFO[alert.alert_type];
                    const Icon = typeInfo.icon;
                    const colorClasses: Record<string, string> = {
                      rose: 'text-rose-400 bg-rose-900/20',
                      orange: 'text-orange-400 bg-orange-900/20',
                      amber: 'text-amber-400 bg-amber-900/20',
                      cyan: 'text-cyan-400 bg-cyan-900/20',
                      red: 'text-red-400 bg-red-900/20',
                      blue: 'text-blue-400 bg-blue-900/20',
                    };
                    const severityColor = SEVERITY_COLORS[alert.severity] || 'blue';

                    return (
                      <motion.tr
                        key={alert.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${colorClasses[typeInfo.color]}`} />
                            <span className="text-slate-300">
                              {alert.alert_type.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">{alert.title}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                              colorClasses[severityColor]
                            }`}
                          >
                            {alert.severity === 'CRITICAL' && (
                              <AlertTriangle className="w-3 h-3" />
                            )}
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          <div>
                            {alert.user_id && (
                              <p className="text-cyan-400 font-mono text-xs">{alert.user_id}</p>
                            )}
                            {alert.ip_address && (
                              <p className="text-amber-400 font-mono text-xs">{alert.ip_address}</p>
                            )}
                            {!alert.user_id && !alert.ip_address && <span>-</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {new Date(alert.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-1">
                            {alert.acknowledged_at ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-900/20 text-green-400">
                                <Check className="w-3 h-3" />
                                Ack
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-orange-900/20 text-orange-400">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                            {alert.resolved_at && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-emerald-900/20 text-emerald-400">
                                <CheckCircle className="w-3 h-3" />
                                Resolved
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            {!alert.acknowledged_at && (
                              <button
                                onClick={() => handleAcknowledgeClick(alert)}
                                className="px-2 py-1 rounded text-xs bg-blue-900/30 border border-blue-500/40 text-blue-300 hover:bg-blue-900/50"
                              >
                                Acknowledge
                              </button>
                            )}
                            {!alert.resolved_at && (
                              <button
                                onClick={() => handleResolveClick(alert)}
                                className="px-2 py-1 rounded text-xs bg-emerald-900/30 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
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
                Page {page} of {totalPages} ({totalAlerts} total alerts)
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

      {/* Action Modal */}
      {actionModal && (
        <AlertActionModal
          alert={actionModal.alert}
          action={actionModal.action}
          onClose={() => setActionModal(null)}
          onConfirm={handleActionConfirm}
          isLoading={isActionLoading}
        />
      )}
    </div>
  );
}

