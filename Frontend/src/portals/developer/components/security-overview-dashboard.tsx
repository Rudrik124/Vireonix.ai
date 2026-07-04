import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Activity,
  Video,
  Upload,
  AlertCircle,
  Ban,
  LogIn,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useSecurityOverviewMetrics } from '../../../hooks/useSecurityOverviewMetrics';

type MetricCardType = 'users' | 'active' | 'videos' | 'files' | 'blocked-prompts' | 'blocked-uploads' | 'failed-logins' | 'security-alerts';

interface MetricCardConfig {
  type: MetricCardType;
  title: string;
  icon: typeof Users;
  color: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'orange' | 'pink' | 'rose';
  description: string;
  getValue: (metrics: any) => number;
}

const METRIC_CARDS: MetricCardConfig[] = [
  {
    type: 'users',
    title: 'Total Users',
    icon: Users,
    color: 'blue',
    description: 'All registered users in the system',
    getValue: (m) => m.totalUsers,
  },
  {
    type: 'active',
    title: 'Active Users Today',
    icon: Activity,
    color: 'green',
    description: 'Users active in the last 24 hours',
    getValue: (m) => m.activeUsersToday,
  },
  {
    type: 'videos',
    title: 'Videos Generated Today',
    icon: Video,
    color: 'purple',
    description: 'Videos created or processed',
    getValue: (m) => m.videosGeneratedToday,
  },
  {
    type: 'files',
    title: 'Files Uploaded Today',
    icon: Upload,
    color: 'amber',
    description: 'Successful file uploads',
    getValue: (m) => m.filesUploadedToday,
  },
  {
    type: 'blocked-prompts',
    title: 'Blocked Prompts Today',
    icon: AlertCircle,
    color: 'orange',
    description: 'Prompts rejected by content filter',
    getValue: (m) => m.blockedPromptsToday,
  },
  {
    type: 'blocked-uploads',
    title: 'Blocked Uploads Today',
    icon: Ban,
    color: 'red',
    description: 'Uploads rejected or failed',
    getValue: (m) => m.blockedUploadsToday,
  },
  {
    type: 'failed-logins',
    title: 'Failed Logins Today',
    icon: LogIn,
    color: 'pink',
    description: 'Authentication failures',
    getValue: (m) => m.failedLoginsToday,
  },
  {
    type: 'security-alerts',
    title: 'Security Alerts Today',
    icon: AlertTriangle,
    color: 'rose',
    description: 'Critical security events',
    getValue: (m) => m.securityAlertsTodayCount,
  },
];

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    iconBg: 'bg-blue-500/20',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-400',
    iconBg: 'bg-green-500/20',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    iconBg: 'bg-purple-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    text: 'text-orange-400',
    iconBg: 'bg-orange-500/20',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-400',
    iconBg: 'bg-red-500/20',
  },
  pink: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    text: 'text-pink-400',
    iconBg: 'bg-pink-500/20',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    iconBg: 'bg-rose-500/20',
  },
};

function MetricCard({
  config,
  value,
  isLoading,
}: {
  config: MetricCardConfig;
  value: number;
  isLoading: boolean;
}) {
  const Icon = config.icon;
  const colors = colorMap[config.color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border ${colors.border} ${colors.bg} backdrop-blur-md p-6 hover:border-white/30 transition-all duration-300 group cursor-default`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-1">{config.title}</h3>
          <p className="text-xs text-slate-500">{config.description}</p>
        </div>
        <div className={`rounded-lg ${colors.iconBg} p-3`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700/30 rounded w-20 mb-2"></div>
          </div>
        ) : (
          <>
            <motion.div
              key={value}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-3xl font-bold text-white"
            >
              {value.toLocaleString()}
            </motion.div>
            <p className={`text-xs ${colors.text} mt-2`}>
              {value === 0 ? 'No activity' : `Updated in real-time`}
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}

export function SecurityOverviewDashboard() {
  const { metrics, isConnected, refresh } = useSecurityOverviewMetrics();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const isLoading = metrics.loadingState.isLoading;
  const error = metrics.loadingState.error;

  const cardAnimationVariants = {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Security Overview</h1>
          <div className="flex items-center gap-2"></div>
        </div>

        <motion.button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/40 hover:border-indigo-500/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </motion.button>
      </div>

      {/* Error message */}
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
        variants={cardAnimationVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {METRIC_CARDS.map((config) => (
          <MetricCard
            key={config.type}
            config={config}
            value={config.getValue(metrics)}
            isLoading={isLoading}
          />
        ))}
      </motion.div>

      {/* Real-time indicator details */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-4"
      >
        <p className="text-xs text-slate-400">
          <strong>Note:</strong> All metrics are calculated from the last 24 hours. The dashboard
          receives live updates as new security events and activities are logged. Refresh manually
          to force an immediate update.
        </p>
      </motion.div>
    </div>
  );
}

