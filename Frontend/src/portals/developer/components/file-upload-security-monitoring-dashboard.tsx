import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  FileText,
  Filter,
  HardDrive,
  Image,
  Lock,
  Music,
  RefreshCw,
  Bug,
  Wifi,
  WifiOff,
  Video,
  CheckCircle,
  Calendar,
  User,
  AlertTriangle,
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
import { useFileUploadSecurityMonitoring } from '../../../hooks/useFileUploadSecurityMonitoring';
import type { FileUploadFilterOptions, FileUploadAction } from '../../../services/file-upload-security.service';

const metricCards = [
  {
    key: 'imagesUploaded',
    label: 'Images Uploaded',
    icon: Image,
    color: 'blue',
    description: 'Successful image uploads',
  },
  {
    key: 'videosUploaded',
    label: 'Videos Uploaded',
    icon: Video,
    color: 'purple',
    description: 'Successful video uploads',
  },
  {
    key: 'audioUploaded',
    label: 'Audio Uploaded',
    icon: Music,
    color: 'cyan',
    description: 'Successful audio uploads',
  },
  {
    key: 'rejectedFiles',
    label: 'Rejected Files',
    icon: AlertCircle,
    color: 'red',
    description: 'Total rejected uploads',
  },
  {
    key: 'malwareDetected',
    label: 'Malware Detected',
    icon: Bug,
    color: 'rose',
    description: 'Malware threats detected',
  },
  {
    key: 'wrongMimeType',
    label: 'Wrong MIME Type',
    icon: FileText,
    color: 'orange',
    description: 'Incorrect file types',
  },
  {
    key: 'fileTooLarge',
    label: 'File Too Large',
    icon: HardDrive,
    color: 'amber',
    description: 'Oversized files rejected',
  },
  {
    key: 'corruptedFiles',
    label: 'Corrupted Files',
    icon: AlertTriangle,
    color: 'pink',
    description: 'Damaged files detected',
  },
];

const colorClasses = {
  blue: 'text-blue-400 bg-blue-900/20',
  purple: 'text-purple-400 bg-purple-900/20',
  cyan: 'text-cyan-400 bg-cyan-900/20',
  red: 'text-red-400 bg-red-900/20',
  rose: 'text-rose-400 bg-rose-900/20',
  orange: 'text-orange-400 bg-orange-900/20',
  amber: 'text-amber-400 bg-amber-900/20',
  pink: 'text-pink-400 bg-pink-900/20',
  green: 'text-green-400 bg-green-900/20',
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

export function FileUploadSecurityMonitoringDashboard() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userId, setUserId] = useState('');
  const [actionFilter, setActionFilter] = useState<FileUploadAction | ''>('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [trendDays, setTrendDays] = useState(7);

  const filters: FileUploadFilterOptions = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      userId: userId || undefined,
      action: (actionFilter || undefined) as FileUploadAction | undefined,
      fileType: fileTypeFilter !== 'all' ? fileTypeFilter : undefined,
    }),
    [startDate, endDate, userId, actionFilter, fileTypeFilter]
  );

  const {
    metrics,
    events,
    rejectionBreakdown,
    fileTypeDistribution,
    uploadTrends,
    malwareDetections,
    averageFileSizes,
    totalEvents,
    isLoading,
    error,
    isConnected,
    refresh,
    page,
    totalPages,
    goToPage,
  } = useFileUploadSecurityMonitoring(filters, trendDays);

  const handleRefresh = async () => {
    await refresh();
  };

  const actions: FileUploadAction[] = [
    'UPLOAD_SUCCESS',
    'UPLOAD_REJECTED',
    'WRONG_MIME_TYPE',
    'FILE_TOO_LARGE',
    'MALWARE_DETECTED',
    'CORRUPTED_FILE',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">File Upload Security Monitoring</h1>
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
            <p className="text-sm text-slate-400 mb-2">Total Uploads</p>
            <p className="text-3xl font-bold text-white">{metrics.totalUploads.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Success Rate</p>
            <p className="text-3xl font-bold text-green-400">{metrics.successRate.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Security Issues</p>
            <p className="text-3xl font-bold text-red-400">
              {(metrics.rejectedFiles + metrics.malwareDetected + metrics.corruptedFiles).toLocaleString()}
            </p>
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
              onChange={(e) => setActionFilter(e.target.value as FileUploadAction | '')}
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

          {/* File Type Filter */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">File Type</label>
            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="other">Other</option>
            </select>
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
        {/* Upload Trends */}
        {uploadTrends.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Upload Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={uploadTrends}>
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
                  dataKey="successful"
                  stroke="#10b981"
                  name="Successful"
                  dot={{ fill: '#10b981' }}
                />
                <Line
                  type="monotone"
                  dataKey="rejected"
                  stroke="#ef4444"
                  name="Rejected"
                  dot={{ fill: '#ef4444' }}
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="#f97316"
                  name="Failed"
                  dot={{ fill: '#f97316' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* File Type Distribution */}
        {fileTypeDistribution.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">File Type Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fileTypeDistribution}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {fileTypeDistribution.map((entry, index) => {
                    const colors = ['#3b82f6', '#a855f7', '#06b6d4', '#8b5cf6'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Rejection Breakdown & Average Sizes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rejection Breakdown */}
        {rejectionBreakdown.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Rejection Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rejectionBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="reason" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Average File Sizes */}
        {averageFileSizes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Average File Sizes</h3>
            <div className="space-y-3">
              {averageFileSizes.map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-300 font-semibold">{item.type}</p>
                    <p className="text-xs text-slate-500">{item.count} files</p>
                  </div>
                  <p className="text-sm font-mono text-blue-400">{item.avgSize}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Malware Detections */}
      {malwareDetections.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bug className="w-5 h-5 text-rose-400" />
            Recent Malware Detections
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {malwareDetections.map((detection) => (
              <motion.div
                key={detection.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-lg border border-rose-700/30 bg-rose-900/20"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bug className="w-4 h-4 text-rose-400" />
                    <span className="text-sm font-semibold text-rose-400">
                      {detection.metadata?.file_name || 'Unknown file'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(detection.created_at).toLocaleString()}
                  </span>
                </div>
                {detection.metadata?.malware_signature && (
                  <p className="text-xs text-rose-300 ml-6">
                    Signature: {detection.metadata.malware_signature}
                  </p>
                )}
                <p className="text-xs text-slate-400 ml-6 mt-1">{detection.event_message}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
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
            File Upload Events ({totalEvents})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="animate-pulse">Loading file upload events...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No file upload events found</div>
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
                      File Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      File Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      MIME Type
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
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                            event.action === 'UPLOAD_SUCCESS'
                              ? 'text-green-400 bg-green-900/20'
                              : event.action === 'MALWARE_DETECTED'
                              ? 'text-rose-400 bg-rose-900/20'
                              : event.action === 'FILE_TOO_LARGE'
                              ? 'text-amber-400 bg-amber-900/20'
                              : event.action === 'WRONG_MIME_TYPE'
                              ? 'text-orange-400 bg-orange-900/20'
                              : event.action === 'CORRUPTED_FILE'
                              ? 'text-pink-400 bg-pink-900/20'
                              : 'text-red-400 bg-red-900/20'
                          }`}
                        >
                          <AlertCircle className="w-3 h-3" />
                          {event.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 truncate max-w-xs">
                        {event.metadata?.file_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {event.metadata?.file_size
                          ? `${(event.metadata.file_size / 1024 / 1024).toFixed(2)} MB`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 font-mono text-xs">
                        {event.metadata?.mime_type || 'Unknown'}
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

