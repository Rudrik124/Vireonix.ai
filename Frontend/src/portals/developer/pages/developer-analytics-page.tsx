import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { fetchWithAuth } from "../../../lib/fetch-with-error-logging";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface GrowthData {
  month?: string;
  year?: string;
  revenue?: number;
  profit?: number;
  newUsers?: number;
  totalUsers?: number;
  growth: number;
}

export default function DeveloperAnalyticsPage() {
  const navigate = useNavigate();
  const [monthlyRevenue, setMonthlyRevenue] = useState<GrowthData[]>([]);
  const [yearlyRevenue, setYearlyRevenue] = useState<GrowthData[]>([]);
  const [monthlyProfit, setMonthlyProfit] = useState<GrowthData[]>([]);
  const [yearlyProfit, setYearlyProfit] = useState<GrowthData[]>([]);
  const [monthlyUsers, setMonthlyUsers] = useState<GrowthData[]>([]);
  const [yearlyUsers, setYearlyUsers] = useState<GrowthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mrev, yrev, mprof, yprof, musers, yusers] = await Promise.all([
        fetchWithAuth("/api/developer/analytics/monthly-revenue-growth"),
        fetchWithAuth("/api/developer/analytics/yearly-revenue-growth"),
        fetchWithAuth("/api/developer/analytics/monthly-profit-growth"),
        fetchWithAuth("/api/developer/analytics/yearly-profit-growth"),
        fetchWithAuth("/api/developer/analytics/monthly-users"),
        fetchWithAuth("/api/developer/analytics/yearly-users"),
      ]);

      if (mrev.ok) {
        const json = await mrev.json();
        setMonthlyRevenue(json.data || []);
      }
      if (yrev.ok) {
        const json = await yrev.json();
        setYearlyRevenue(json.data || []);
      }
      if (mprof.ok) {
        const json = await mprof.json();
        setMonthlyProfit(json.data || []);
      }
      if (yprof.ok) {
        const json = await yprof.json();
        setYearlyProfit(json.data || []);
      }
      if (musers.ok) {
        const json = await musers.json();
        setMonthlyUsers(json.data || []);
      }
      if (yusers.ok) {
        const json = await yusers.json();
        setYearlyUsers(json.data || []);
      }
    } catch (err: any) {
      console.error("Analytics error:", err);
      setError(err?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const GrowthIndicator = ({ value }: { value: number }) => {
    const isPositive = value >= 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownLeft;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
        <Icon className="w-4 h-4" />
        <span>{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  const ChartCard = ({
    title,
    children,
    icon: Icon,
  }: {
    title: string;
    children: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl shadow-black/20">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-5 h-5 text-indigo-400" />}
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 pb-24">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate("/developer/dashboard")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/80 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Back to dashboard
            </button>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Analytics & Growth</h1>
            <p className="max-w-2xl text-sm text-slate-400 mt-2">
              Track revenue, profit, and user growth with automated calculations and growth percentages.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-400">Loading analytics...</div>
        ) : (
          <>
            {/* Revenue Charts */}
            <div className="grid gap-6 mb-8 lg:grid-cols-2">
              <ChartCard title="Monthly Revenue Growth" icon={TrendingUp}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.1)" }}
                      formatter={(value) => `$${value?.toLocaleString()}`}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  {monthlyRevenue.slice(-3).map((item, idx) => (
                    <div key={idx} className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-400">{item.month}</div>
                      <div className="text-white font-semibold">${item.revenue?.toLocaleString() || 0}</div>
                      <GrowthIndicator value={item.growth} />
                    </div>
                  ))}
                </div>
              </ChartCard>

              <ChartCard title="Yearly Revenue Growth" icon={TrendingUp}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={yearlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="year" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.1)" }}
                      formatter={(value) => `$${value?.toLocaleString()}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366f1"
                      dot={{ fill: "#6366f1" }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  {yearlyRevenue.slice(-3).map((item, idx) => (
                    <div key={idx} className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-400">{item.year}</div>
                      <div className="text-white font-semibold">${item.revenue?.toLocaleString() || 0}</div>
                      <GrowthIndicator value={item.growth} />
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>

            {/* Profit Charts */}
            <div className="grid gap-6 mb-8 lg:grid-cols-2">
              <ChartCard title="Monthly Profit Growth" icon={TrendingUp}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyProfit}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.1)" }}
                      formatter={(value) => `$${value?.toLocaleString()}`}
                    />
                    <Legend />
                    <Bar dataKey="profit" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  {monthlyProfit.slice(-3).map((item, idx) => (
                    <div key={idx} className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-400">{item.month}</div>
                      <div className="text-white font-semibold">${item.profit?.toLocaleString() || 0}</div>
                      <GrowthIndicator value={item.growth} />
                    </div>
                  ))}
                </div>
              </ChartCard>

              <ChartCard title="Yearly Profit Growth" icon={TrendingUp}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={yearlyProfit}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="year" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.1)" }}
                      formatter={(value) => `$${value?.toLocaleString()}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#10b981"
                      dot={{ fill: "#10b981" }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  {yearlyProfit.slice(-3).map((item, idx) => (
                    <div key={idx} className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-400">{item.year}</div>
                      <div className="text-white font-semibold">${item.profit?.toLocaleString() || 0}</div>
                      <GrowthIndicator value={item.growth} />
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>

            {/* User Growth Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Monthly User Growth" icon={TrendingUp}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyUsers}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                    <Legend />
                    <Bar dataKey="newUsers" fill="#3b82f6" name="New Users" />
                    <Bar dataKey="totalUsers" fill="#8b5cf6" name="Total Users" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  {monthlyUsers.slice(-3).map((item, idx) => (
                    <div key={idx} className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-400">{item.month}</div>
                      <div className="text-white font-semibold">{item.totalUsers} users</div>
                      <GrowthIndicator value={item.growth} />
                    </div>
                  ))}
                </div>
              </ChartCard>

              <ChartCard title="Yearly User Growth" icon={TrendingUp}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={yearlyUsers}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="year" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalUsers"
                      stroke="#8b5cf6"
                      dot={{ fill: "#8b5cf6" }}
                      strokeWidth={2}
                      name="Total Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  {yearlyUsers.slice(-3).map((item, idx) => (
                    <div key={idx} className="bg-slate-800/50 rounded p-2">
                      <div className="text-slate-400">{item.year}</div>
                      <div className="text-white font-semibold">{item.totalUsers} users</div>
                      <GrowthIndicator value={item.growth} />
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
