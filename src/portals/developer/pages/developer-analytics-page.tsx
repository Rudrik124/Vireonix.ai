import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { fetchAnalytics } from "../../../services/developer-portal-api.service";

export function DeveloperAnalyticsPage() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<"today" | "7d" | "30d">("7d");
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    dau: 0,
    wau: 0,
    mau: 0,
    retentionRate: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAnalytics(timeRange);
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <button
            onClick={() => navigate("/developer/dashboard")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">User activity and feature usage insights</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Time Range Filter */}
        <div className="mb-8 flex gap-3">
          {(["today", "7d", "30d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded font-bold transition ${
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              }`}
            >
              {range === "today" ? "Today" : range === "7d" ? "Last 7 Days" : "Last 30 Days"}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-800 rounded border border-slate-700 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard label="Daily Active Users" value={analytics.dau.toString()} trend="+0%" />
            <MetricCard label="Weekly Active Users" value={analytics.wau.toString()} trend="+0%" />
            <MetricCard label="Monthly Active Users" value={analytics.mau.toString()} trend="+0%" />
            <MetricCard label="Retention Rate" value={`${analytics.retentionRate}%`} trend="+0%" />
          </div>
        )}

        {/* Feature Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-800 rounded border border-slate-700 p-6">
            <h2 className="text-lg font-bold mb-4">Most Used Features</h2>
            <div className="space-y-4">
              {[
                { name: "AI Generated Video", usage: 0, users: 0 },
                { name: "Reference Video", usage: 0, users: 0 },
                { name: "Images to Video", usage: 0, users: 0 },
                { name: "Quick Edit", usage: 0, users: 0 },
              ].map((feature) => (
                <div key={feature.name}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold">{feature.name}</span>
                    <span className="text-sm text-slate-400">{feature.users} users</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${feature.usage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded border border-slate-700 p-6">
            <h2 className="text-lg font-bold mb-4">Least Used Features</h2>
            <div className="space-y-4">
              {[
                { name: "Batch Processing", usage: 0, users: 0 },
                { name: "API Direct Access", usage: 0, users: 0 },
                { name: "Custom Models", usage: 0, users: 0 },
                { name: "Webhooks", usage: 0, users: 0 },
              ].map((feature) => (
                <div key={feature.name}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold">{feature.name}</span>
                    <span className="text-sm text-slate-400">{feature.users} users</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${feature.usage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Credit Usage */}
        <div className="bg-slate-800 rounded border border-slate-700 p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Credit Consumption Trend</h2>
          <div className="space-y-3">
            {[
              { day: "Day 1", consumed: 0, remaining: 0 },
              { day: "Day 2", consumed: 0, remaining: 0 },
              { day: "Day 3", consumed: 0, remaining: 0 },
              { day: "Day 4", consumed: 0, remaining: 0 },
              { day: "Day 5", consumed: 0, remaining: 0 },
            ].map((item) => (
              <div key={item.day}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold">{item.day}</span>
                  <span className="text-sm text-slate-400">{item.consumed} consumed | {item.remaining} remaining</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `0%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800 rounded border border-slate-700 p-6">
            <h2 className="text-lg font-bold mb-4">Traffic by Source</h2>
            <div className="space-y-3">
              {[
                { source: "Direct", percentage: 0 },
                { source: "Search", percentage: 0 },
                { source: "Social", percentage: 0 },
                { source: "Referral", percentage: 0 },
              ].map((item) => (
                <div key={item.source}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold">{item.source}</span>
                    <span className="text-sm text-slate-400">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded border border-slate-700 p-6">
            <h2 className="text-lg font-bold mb-4">Errors by Category</h2>
            <div className="space-y-3">
              {[
                { category: "API Errors", count: 0 },
                { category: "Upload Errors", count: 0 },
                { category: "Auth Errors", count: 0 },
                { category: "DB Errors", count: 0 },
              ].map((item) => (
                <div key={item.category}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold">{item.category}</span>
                    <span className="text-sm text-slate-400">{item.count} errors</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `0%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="p-4 bg-slate-800 rounded border border-slate-700">
      <p className="text-sm text-slate-400">{label}</p>
      <div className="flex justify-between items-end mt-2">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-green-400 font-bold">{trend}</p>
      </div>
    </div>
  );
}
