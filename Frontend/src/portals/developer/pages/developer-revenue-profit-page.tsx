import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPI,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  fetchRevenueProfit,
  storeMonthlySnapshot,
} from "../../../services/developer-portal-api.service";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
];

interface RevenueData {
  currentMonth: { revenue: number; expenses: number; profit: number };
  currentYear: { revenue: number; expenses: number; profit: number };
  all: { revenue: number; expenses: number; profit: number };
  breakdown: {
    revenue: { total: number; byMonth: Record<string, number> };
    expenses: { total: number; byCategory: Record<string, number>; byMonth: Record<string, number> };
  };
}

export function DeveloperRevenueProfit() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<RevenueData | null>(null);
  const [historical, setHistorical] = useState<Array<any>>([]);
  const [yearly, setYearly] = useState<Array<any>>([]);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetchRevenueProfit();
      setData(response.data);
      setHistorical(response.historical || []);
      setYearly(response.yearly || []);
    } catch (error) {
      console.error("Failed to load revenue/profit data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSnapshot = async () => {
    if (!data) return;
    setIsSavingSnapshot(true);
    try {
      await storeMonthlySnapshot({
        totalRevenue: data.currentMonth.revenue,
        totalExpenses: data.currentMonth.expenses,
        activeUsers: 0,
      });
      alert("Monthly snapshot saved successfully!");
    } catch (error) {
      console.error("Failed to save snapshot:", error);
      alert("Failed to save snapshot.");
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  const expenseCategoryData = useMemo(() => {
    if (!data?.breakdown.expenses.byCategory) return [];
    return Object.entries(data.breakdown.expenses.byCategory).map(([name, value]) => ({
      name,
      value: Number(value),
    }));
  }, [data]);

  const profitTrend = useMemo(() => {
    if (!historical) return [];
    return historical.map((item) => ({
      label: item.label,
      revenue: Number(item.revenue || 0),
      expenses: Number(item.expenses || 0),
      profit: Number(item.profit || 0),
    }));
  }, [historical]);

  const profitMargin = useMemo(() => {
    if (!data?.all.revenue || data.all.revenue === 0) return 0;
    return ((data.all.profit / data.all.revenue) * 100).toFixed(1);
  }, [data]);

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 pb-24">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-10">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              onClick={() => navigate("/developer/dashboard")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/80 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Revenue & Profit</h1>
            <p className="max-w-2xl text-sm text-slate-400 mt-2">
              Track revenue, expenses, and profit with detailed breakdowns and historical trends.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              type="button"
              onClick={handleSaveSnapshot}
              disabled={isSavingSnapshot}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save Snapshot
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Loading revenue data...</div>
        ) : !data ? (
          <div className="text-center py-12 text-slate-400">No revenue data available.</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">This Month Revenue</p>
                    <p className="mt-3 text-3xl font-bold text-white">${data.currentMonth.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-emerald-400/60" />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">This Month Expenses</p>
                    <p className="mt-3 text-3xl font-bold text-white">${data.currentMonth.expenses.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  </div>
                  <TrendingDown className="w-10 h-10 text-red-400/60" />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">This Month Profit</p>
                    <p className={`mt-3 text-3xl font-bold ${data.currentMonth.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      ${data.currentMonth.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <TrendingUp className={`w-10 h-10 ${data.currentMonth.profit >= 0 ? "text-emerald-400/60" : "text-red-400/60"}`} />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Profit Margin</p>
                    <p className="mt-3 text-3xl font-bold text-indigo-400">{profitMargin}%</p>
                  </div>
                  <BarChart3 className="w-10 h-10 text-indigo-400/60" />
                </div>
              </div>
            </div>

            {/* Year Summary */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-6">This Year Summary</h2>
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-700/50 bg-slate-950/80 p-5">
                  <p className="text-sm text-slate-400">Total Revenue</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-400">${data.currentYear.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-2xl border border-slate-700/50 bg-slate-950/80 p-5">
                  <p className="text-sm text-slate-400">Total Expenses</p>
                  <p className="mt-2 text-2xl font-bold text-red-400">${data.currentYear.expenses.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-2xl border border-slate-700/50 bg-slate-950/80 p-5">
                  <p className="text-sm text-slate-400">Net Profit</p>
                  <p className={`mt-2 text-2xl font-bold ${data.currentYear.profit >= 0 ? "text-indigo-400" : "text-red-400"}`}>${data.currentYear.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              {/* Profit Trend */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Revenue vs Expenses Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={profitTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Expense Breakdown */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Expense Breakdown by Category</h2>
                {expenseCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPI>
                      <Pie
                        data={expenseCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseCategoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                        }}
                      />
                    </RechartsPI>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-slate-400">No expense data available.</div>
                )}
              </div>
            </div>

            {/* Yearly Comparison */}
            {yearly.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Yearly Comparison</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={yearly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#22c55e" />
                    <Bar dataKey="expenses" fill="#ef4444" />
                    <Bar dataKey="profit" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* All Time Summary */}
            <div className="mt-8 rounded-3xl border border-white/10 bg-slate-900/60 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">All Time Summary</h2>
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-700/50 bg-slate-950/80 p-5">
                  <p className="text-sm text-slate-400">Total Revenue</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-400">${data.all.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-2xl border border-slate-700/50 bg-slate-950/80 p-5">
                  <p className="text-sm text-slate-400">Total Expenses</p>
                  <p className="mt-2 text-2xl font-bold text-red-400">${data.all.expenses.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-2xl border border-slate-700/50 bg-slate-950/80 p-5">
                  <p className="text-sm text-slate-400">Net Profit</p>
                  <p className={`mt-2 text-2xl font-bold ${data.all.profit >= 0 ? "text-indigo-400" : "text-red-400"}`}>${data.all.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
