import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  AlertTriangle,
  Shield,
  TrendingUp,
  Filter,
  RefreshCw,
  Calendar,
  AlertCircle,
  Lock,
  Zap,
  MapPin,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { useThreatVisualization } from "../../../hooks/useThreatVisualization";
import type { ThreatSeverity } from "../../../services/threat-visualization.service";

const SEVERITY_COLORS: Record<ThreatSeverity, { bg: string; text: string; border: string }> = {
  LOW: { bg: "bg-blue-900/20", text: "text-blue-400", border: "border-blue-700/30" },
  MEDIUM: { bg: "bg-orange-900/20", text: "text-orange-400", border: "border-orange-700/30" },
  HIGH: { bg: "bg-red-900/20", text: "text-red-400", border: "border-red-700/30" },
  CRITICAL: { bg: "bg-rose-900/20", text: "text-rose-400", border: "border-rose-700/30" },
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
    red: "text-red-400 bg-red-900/20",
    orange: "text-orange-400 bg-orange-900/20",
    cyan: "text-cyan-400 bg-cyan-900/20",
    green: "text-green-400 bg-green-900/20",
    purple: "text-purple-400 bg-purple-900/20",
    pink: "text-pink-400 bg-pink-900/20",
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

export function ThreatVisualizationDashboard() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minSeverityFilter, setMinSeverityFilter] = useState<ThreatSeverity | "">("");

  const filters = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      minSeverity: (minSeverityFilter || undefined) as ThreatSeverity | undefined,
    }),
    [startDate, endDate, minSeverityFilter]
  );

  const { countryThreats, metrics, topThreats, incidents, timeline, isLoading, error, refresh } =
    useThreatVisualization(filters);

  const handleRefresh = async () => {
    await refresh();
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setMinSeverityFilter("");
  };

  // Prepare data for threat timeline chart
  const chartTimeline = useMemo(() => {
    const last7Days = timeline.slice(-7);
    return last7Days.length > 0 ? last7Days : timeline;
  }, [timeline]);

  // Country data for heatmap
  const countriesBySeverity = useMemo(() => {
    return {
      CRITICAL: countryThreats.filter((c) => c.severity === "CRITICAL"),
      HIGH: countryThreats.filter((c) => c.severity === "HIGH"),
      MEDIUM: countryThreats.filter((c) => c.severity === "MEDIUM"),
      LOW: countryThreats.filter((c) => c.severity === "LOW"),
    };
  }, [countryThreats]);

  const severityOptions: ThreatSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Threat Visualization</h1>
          <p className="text-sm text-slate-400">
            Monitor global threats, attacks by country, and security incidents in real-time
          </p>
        </div>

        <motion.button
          onClick={handleRefresh}
          disabled={isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/40 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
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
          label="Total Threats"
          value={metrics.totalThreats}
          icon={AlertTriangle}
          color="red"
          description="All detected threats"
          isLoading={isLoading}
        />
        <MetricCard
          label="Failed Logins"
          value={metrics.failedLoginCount}
          icon={Lock}
          color="orange"
          description="Authentication failures"
          isLoading={isLoading}
        />
        <MetricCard
          label="Blocked Requests"
          value={metrics.blockedRequestCount}
          icon={Shield}
          color="blue"
          description="Requests blocked"
          isLoading={isLoading}
        />
        <MetricCard
          label="Security Events"
          value={metrics.securityEventCount}
          icon={Zap}
          color="purple"
          description="Total security events"
          isLoading={isLoading}
        />
        <MetricCard
          label="Threatened Countries"
          value={metrics.uniqueCountries}
          icon={Globe}
          color="pink"
          description="Countries with threats"
          isLoading={isLoading}
        />
      </motion.div>

      {/* Threat Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Critical Countries</p>
              <p className="text-3xl font-bold text-rose-400 mt-1">{metrics.criticalCountries}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
        </div>

        <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">High Severity</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{metrics.highSeverityCountries}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Unique IP Addresses</p>
              <p className="text-3xl font-bold text-orange-400 mt-1">{metrics.uniqueIPs}</p>
            </div>
            <Users className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Threat Intensity</p>
              <p className="text-3xl font-bold text-cyan-400 mt-1">
                {metrics.totalThreats > 0 ? Math.round(metrics.totalThreats / Math.max(1, metrics.uniqueCountries)) : 0}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-cyan-400" />
          </div>
        </div>
      </motion.div>

      {/* Threat Timeline */}
      {chartTimeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Threat Timeline</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                labelStyle={{ color: "#f1f5f9" }}
              />
              <Area type="monotone" dataKey="threats" stroke="#ef4444" fill="#ef4444" name="Threats" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Threat Heatmap by Severity */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          World Threat Map by Severity
        </h2>

        <div className="space-y-4">
          {Object.entries(countriesBySeverity).map(([severity, countries]) => (
            <div key={severity}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded ${SEVERITY_COLORS[severity as ThreatSeverity].bg}`}></div>
                <h3 className={`text-sm font-semibold ${SEVERITY_COLORS[severity as ThreatSeverity].text}`}>
                  {severity} Severity ({countries.length} countries)
                </h3>
              </div>

              {countries.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
                  {countries.slice(0, 15).map((country, idx) => (
                    <motion.div
                      key={country.country}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`rounded-lg border ${SEVERITY_COLORS[severity as ThreatSeverity].border} ${
                        SEVERITY_COLORS[severity as ThreatSeverity].bg
                      } p-3`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-300">{country.country}</p>
                          <p className="text-xs text-slate-500">{country.countryCode}</p>
                        </div>
                        <MapPin className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <p className={`text-lg font-bold ${SEVERITY_COLORS[severity as ThreatSeverity].text}`}>
                          {country.totalThreats}
                        </p>
                        <p className="text-xs text-slate-400">
                          🔓 {country.failedLogins} | 🛡️ {country.blockedRequests} | ⚠️ {country.securityEvents}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400 text-center py-2">No countries in this category</div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Top 15 Threatening Countries */}
      {topThreats.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Top 15 Threatening Countries</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topThreats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="country" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                labelStyle={{ color: "#f1f5f9" }}
              />
              <Legend />
              <Bar dataKey="failedLogins" stackId="a" fill="#f59e0b" name="Failed Logins" />
              <Bar dataKey="blockedRequests" stackId="a" fill="#3b82f6" name="Blocked Requests" />
              <Bar dataKey="securityEvents" stackId="a" fill="#ef4444" name="Security Events" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Min Severity</label>
            <select
              value={minSeverityFilter}
              onChange={(e) => setMinSeverityFilter(e.target.value as ThreatSeverity | "")}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Severities</option>
              {severityOptions.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}+
                </option>
              ))}
            </select>
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

      {/* Country Rankings Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md overflow-hidden"
      >
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">Country Threat Rankings</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="animate-pulse">Loading threat data...</div>
          </div>
        ) : topThreats.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No threats detected</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Threat Score</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Failed Logins</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Blocked Requests</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Security Events</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {topThreats.map((threat, idx) => {
                  const severityInfo = SEVERITY_COLORS[threat.riskLevel];
                  return (
                    <motion.tr
                      key={threat.country}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-cyan-400">{threat.rank}</td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="text-slate-300 font-medium">{threat.country}</p>
                          <p className="text-xs text-slate-500">{threat.countryCode}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-slate-700/50">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-red-500"
                              style={{
                                width: `${Math.min((threat.threatScore / 100) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-slate-300 font-mono">{threat.threatScore}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-orange-400">{threat.failedLogins}</td>
                      <td className="px-6 py-4 text-sm text-blue-400">{threat.blockedRequests}</td>
                      <td className="px-6 py-4 text-sm text-red-400">{threat.securityEvents}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${severityInfo.bg} ${severityInfo.text}`}
                        >
                          {threat.riskLevel}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Recent Threat Incidents */}
      {incidents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg border border-slate-700/50 bg-slate-900/30 backdrop-blur-md p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Recent Threat Incidents</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {incidents.slice(0, 20).map((incident, idx) => {
              const severityInfo = SEVERITY_COLORS[incident.severity];
              return (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="border border-slate-700/30 rounded-lg p-3 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${severityInfo.bg} ${severityInfo.text}`}>
                          {incident.severity}
                        </span>
                        <span className="text-xs text-slate-400">{incident.threatType.replace(/_/g, " ")}</span>
                      </div>
                      <p className="text-sm text-slate-300 mb-1">{incident.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="font-mono">{incident.country}</span>
                        <span className="font-mono">{incident.ipAddress}</span>
                        <span>{new Date(incident.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    <MapPin className={`w-4 h-4 flex-shrink-0 ${severityInfo.text}`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
