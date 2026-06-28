import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ArrowLeft, PieChart3, RefreshCcw, Save, TrendingUp, ShieldCheck } from "lucide-react";
import {
  fetchProfitDistribution,
  fetchProfitDistributionSettings,
  updateProfitDistributionSettings,
} from "../../../services/developer-portal-api.service";

const distributionColors = ["#6366f1", "#14b8a6", "#f59e0b", "#ef4444"];

export function DeveloperProfitDistribution() {
  const navigate = useNavigate();
  const [distribution, setDistribution] = useState<any>(null);
  const [settings, setSettings] = useState({ reservePercentage: 20, growthPercentage: 30, workerPercentage: 50 });
  const [month, setMonth] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (distribution?.currentPeriod && month === null && year === null) {
      setMonth(distribution.currentPeriod.month);
      setYear(distribution.currentPeriod.year);
    }
  }, [distribution]);

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [settingsResponse, distributionResponse] = await Promise.all([
        fetchProfitDistributionSettings(),
        fetchProfitDistribution(),
      ]);
      setSettings(settingsResponse.settings || settings);
      setDistribution(distributionResponse);
      if (distributionResponse?.currentPeriod) {
        setMonth(distributionResponse.currentPeriod.month);
        setYear(distributionResponse.currentPeriod.year);
      }
    } catch (err: any) {
      console.error("Profit distribution load error:", err);
      setError(err?.message || "Unable to load profit distribution data.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDistribution = async (selectedMonth?: number, selectedYear?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const monthToFetch = selectedMonth ?? month ?? undefined;
      const yearToFetch = selectedYear ?? year ?? undefined;
      const response = await fetchProfitDistribution(monthToFetch ?? undefined, yearToFetch ?? undefined);
      setDistribution(response);
    } catch (err: any) {
      console.error("Profit distribution fetch error:", err);
      setError(err?.message || "Unable to load profit distribution data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setValidationError(null);
    const total = settings.reservePercentage + settings.growthPercentage + settings.workerPercentage;
    if (total !== 100) {
      setValidationError("Reserve, Growth, and Worker percentages must total 100%.");
      return;
    }
    if (settings.reservePercentage < 0 || settings.growthPercentage < 0 || settings.workerPercentage < 0) {
      setValidationError("Percentages must be zero or positive.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await updateProfitDistributionSettings(settings);
      setSettings(response.settings);
      await loadDistribution();
    } catch (err: any) {
      console.error("Profit distribution save error:", err);
      setError(err?.message || "Unable to save distribution settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const monthOptions = useMemo(() => {
    if (!distribution?.monthly) return [];
    return Array.from(new Set(distribution.monthly.map((item: any) => item.label))).map((label: string) => ({
      label,
      value: Number(label.split("-")[1]),
      year: Number(label.split("-")[0]),
    }));
  }, [distribution]);

  const yearOptions = useMemo(() => {
    if (!distribution?.yearly) return [];
    return distribution.yearly.map((item: any) => item.label);
  }, [distribution]);

  const summary = distribution?.summary;

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 pb-24">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-10">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate("/developer/dashboard")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/80 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" /> Back to dashboard
            </button>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Profit Distribution</h1>
            <p className="max-w-2xl text-sm text-slate-400 mt-2">
              Configure profit allocation percentages and review monthly/yearly distributions by reserve, growth, and worker payments.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => loadDistribution(month, year)}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              <RefreshCcw className="w-4 h-4" /> Refresh
            </button>
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="w-4 h-4" /> Save Settings
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100 mb-6">{error}</div>
        )}
        {validationError && (
          <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100 mb-6">{validationError}</div>
        )}

        {isLoading || !distribution ? (
          <div className="text-center py-12 text-slate-400">Loading profit distribution...</div>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] mb-8">
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Distribution Settings</h2>
                    <p className="mt-2 text-sm text-slate-400">Adjust the reserve, growth, and worker allocation percentages.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Month</label>
                      <select
                        value={month ?? ""}
                        onChange={(event) => {
                          const [yearValue, monthValue] = event.target.value.split("-");
                          setMonth(Number(monthValue));
                          setYear(Number(yearValue));
                        }}
                        className="mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                      >
                        <option value="">Select month</option>
                        {monthOptions.map((option: any) => (
                          <option key={option.label} value={`${option.year}-${String(option.value).padStart(2, "0")}`}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Year</label>
                      <select
                        value={year ?? ""}
                        onChange={(event) => setYear(Number(event.target.value))}
                        className="mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                      >
                        <option value="">Select year</option>
                        {yearOptions.map((option: string) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => loadDistribution(month ?? undefined, year ?? undefined)}
                        className="inline-flex h-full items-center justify-center rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Reserve", value: settings.reservePercentage, color: "bg-slate-800/80" },
                    { label: "Growth", value: settings.growthPercentage, color: "bg-slate-800/80" },
                    { label: "Worker", value: settings.workerPercentage, color: "bg-slate-800/80" },
                  ].map((setting) => (
                    <div key={setting.label} className={`${setting.color} rounded-3xl border border-white/10 p-5`}>
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{setting.label}</p>
                      <p className="mt-3 text-3xl font-bold text-white">{setting.value}%</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                    <label className="block text-xs text-slate-400 mb-2">Reserve %</label>
                    <input
                      type="number"
                      value={settings.reservePercentage}
                      onChange={(event) => setSettings((prev) => ({ ...prev, reservePercentage: Number(event.target.value) }))}
                      className="w-full rounded-2xl border border-slate-700/80 bg-slate-900 px-3 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                    <label className="block text-xs text-slate-400 mb-2">Growth %</label>
                    <input
                      type="number"
                      value={settings.growthPercentage}
                      onChange={(event) => setSettings((prev) => ({ ...prev, growthPercentage: Number(event.target.value) }))}
                      className="w-full rounded-2xl border border-slate-700/80 bg-slate-900 px-3 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                    <label className="block text-xs text-slate-400 mb-2">Worker %</label>
                    <input
                      type="number"
                      value={settings.workerPercentage}
                      onChange={(event) => setSettings((prev) => ({ ...prev, workerPercentage: Number(event.target.value) }))}
                      className="w-full rounded-2xl border border-slate-700/80 bg-slate-900 px-3 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Current Allocation</p>
                    <p className="text-2xl font-semibold text-white">{settings.reservePercentage}% / {settings.growthPercentage}% / {settings.workerPercentage}%</p>
                  </div>
                </div>
                <div className="grid gap-4">
                  {summary && [
                    { label: "Total Profit", value: summary.profit, color: "text-white" },
                    { label: "Reserved Fund", value: summary.reservedAmount, color: "text-emerald-400" },
                    { label: "Growth Fund", value: summary.growthAmount, color: "text-sky-400" },
                    { label: "Worker Payments", value: summary.workerAmount, color: "text-amber-400" },
                    { label: "Rounding Remainder", value: summary.remainder, color: "text-slate-400" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-3xl border border-slate-700/70 bg-slate-950/80 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-slate-400">{item.label}</p>
                        <p className={`text-xl font-semibold ${item.color}`}>${item.value.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Monthly Distribution</h2>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={distribution.monthly} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <RechartsTooltip contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }} />
                    <Legend />
                    <Bar dataKey="reservedAmount" stackId="a" fill="#14b8a6" name="Reserve" />
                    <Bar dataKey="growthAmount" stackId="a" fill="#6366f1" name="Growth" />
                    <Bar dataKey="workerAmount" stackId="a" fill="#f59e0b" name="Worker" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Yearly Distribution</h2>
                <ResponsiveContainer width="100%" height={320}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: "Reserve", value: summary.reservedAmount },
                        { name: "Growth", value: summary.growthAmount },
                        { name: "Worker", value: summary.workerAmount },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {distribution.monthly.slice(0, 3).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={distributionColors[index % distributionColors.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Monthly Distribution Table</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-slate-300">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="py-3 pr-6">Month</th>
                        <th className="py-3 pr-6">Profit</th>
                        <th className="py-3 pr-6">Reserved</th>
                        <th className="py-3 pr-6">Growth</th>
                        <th className="py-3 pr-6">Worker</th>
                        <th className="py-3 py-3">Remainder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distribution.monthly.map((row: any, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-slate-950/30" : "bg-slate-950/10"}>
                          <td className="py-4 pr-6 font-medium text-slate-100">{row.label}</td>
                          <td className="py-4 pr-6">${row.profit.toLocaleString()}</td>
                          <td className="py-4 pr-6">${row.reservedAmount.toLocaleString()}</td>
                          <td className="py-4 pr-6">${row.growthAmount.toLocaleString()}</td>
                          <td className="py-4 pr-6">${row.workerAmount.toLocaleString()}</td>
                          <td className="py-4">${row.remainder.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Yearly Distribution Table</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-slate-300">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="py-3 pr-6">Year</th>
                        <th className="py-3 pr-6">Profit</th>
                        <th className="py-3 pr-6">Reserved</th>
                        <th className="py-3 pr-6">Growth</th>
                        <th className="py-3 pr-6">Worker</th>
                        <th className="py-3">Remainder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distribution.yearly.map((row: any, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-slate-950/30" : "bg-slate-950/10"}>
                          <td className="py-4 pr-6 font-medium text-slate-100">{row.label}</td>
                          <td className="py-4 pr-6">${row.profit.toLocaleString()}</td>
                          <td className="py-4 pr-6">${row.reservedAmount.toLocaleString()}</td>
                          <td className="py-4 pr-6">${row.growthAmount.toLocaleString()}</td>
                          <td className="py-4 pr-6">${row.workerAmount.toLocaleString()}</td>
                          <td className="py-4">${row.remainder.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
