import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { fetchWithAuth } from "../../lib/fetch-with-error-logging";

const formatDuration = (s: number | null | undefined) => {
  if (s === null || s === undefined) return "-";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
};

export default function LoginActivityPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActive = async () => {
    try {
      const res = await fetchWithAuth(`/api/developer/login-activity/active`);
      if (!res.ok) {
        throw new Error(`Failed to load active sessions: ${res.status}`);
      }
      const json = await res.json();
      setActive(json.sessions || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to load active sessions.");
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetchWithAuth(`/api/developer/login-activity/history?limit=50`);
      if (!res.ok) {
        throw new Error(`Failed to load login history: ${res.status}`);
      }
      const json = await res.json();
      setHistory(json.history || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to load login history.");
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetchWithAuth(`/api/developer/login-activity/analytics`);
      if (!res.ok) {
        throw new Error(`Failed to load analytics: ${res.status}`);
      }
      const json = await res.json();
      setAnalytics(json);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to load analytics.");
    }
  };

  const refreshAll = async () => {
    setError(null);
    setLoading(true);
    try {
      await Promise.all([loadActive(), loadHistory(), loadAnalytics()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    // Poll every 15 seconds for updates (realtime has RLS permission issues)
    const interval = setInterval(loadActive, 15_000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleLogoutDevice = async (sessionId: string) => {
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/developer/login-activity/logout-device`, {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!res.ok) {
        throw new Error(`Failed to logout device: ${res.status}`);
      }
      await refreshAll();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to logout selected device.");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 pb-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate('/developer/dashboard')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/80 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Back to dashboard
            </button>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Login Activity</h1>
            <p className="max-w-2xl text-sm text-slate-400 mt-2">
              Monitor authentication events, active sessions, and device/browser metadata for the developer portal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={refreshAll}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              Refresh data
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100 mb-6">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Analytics</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Login activity snapshot</h2>
              </div>
              <div className="rounded-full bg-slate-950/80 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">Live</div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/5 bg-slate-950/80 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Logins Today</p>
                <p className="mt-3 text-3xl font-semibold text-white">{analytics?.totalLoginsToday ?? '-'}</p>
              </div>
              <div className="rounded-3xl border border-white/5 bg-slate-950/80 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Active Sessions</p>
                <p className="mt-3 text-3xl font-semibold text-white">{active.length}</p>
              </div>
              <div className="rounded-3xl border border-white/5 bg-slate-950/80 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Top User</p>
                <p className="mt-3 text-3xl font-semibold text-white">{analytics?.mostActiveUser || '-'}</p>
              </div>
              <div className="rounded-3xl border border-white/5 bg-slate-950/80 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Top Device</p>
                <p className="mt-3 text-3xl font-semibold text-white">{analytics?.mostUsedDevice || '-'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Session overview</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Recent login metrics</h2>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-950/80 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                Updated every 15s
              </span>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="rounded-3xl border border-white/5 bg-slate-950/80 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Average Session Duration</p>
                <p className="mt-3 text-3xl font-semibold text-white">{analytics?.averageSessionDuration ? formatDuration(analytics.averageSessionDuration) : '-'}</p>
              </div>
              <div className="rounded-3xl border border-white/5 bg-slate-950/80 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Unique Devices</p>
                <p className="mt-3 text-3xl font-semibold text-white">{analytics?.uniqueDevices ?? '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-8">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/20">
            <div className="flex flex-col gap-2 border-b border-white/10 bg-slate-950/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Active Sessions</h3>
                <p className="text-sm text-slate-400">See all currently authenticated developer sessions.</p>
              </div>
              <span className="text-sm text-slate-400">{active.length} sessions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead className="bg-slate-950/90 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Device</th>
                    <th className="px-4 py-3">Browser</th>
                    <th className="px-4 py-3">IP</th>
                    <th className="px-4 py-3">Login Time</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                        Loading active sessions...
                      </td>
                    </tr>
                  ) : active.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                        No active sessions found.
                      </td>
                    </tr>
                  ) : (
                    active.map((s) => (
                      <tr key={s.id} className="border-t border-white/10 last:border-b-0">
                        <td className="px-4 py-3 text-slate-100">{s.user_name || s.user_id}</td>
                        <td className="px-4 py-3 text-slate-300">{s.user_email || '-'}</td>
                        <td className="px-4 py-3 text-slate-300">{s.user_role}</td>
                        <td className="px-4 py-3 text-slate-300">{s.device_name}</td>
                        <td className="px-4 py-3 text-slate-300">{s.browser}</td>
                        <td className="px-4 py-3 text-slate-300">{s.ip_address || '-'}</td>
                        <td className="px-4 py-3 text-slate-300">{new Date(s.login_time).toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-300">{formatDuration(s.current_duration)}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleLogoutDevice(s.session_id)}
                            className="rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-400"
                          >
                            Logout Device
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/20">
            <div className="flex flex-col gap-2 border-b border-white/10 bg-slate-950/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Recent Login History</h3>
                <p className="text-sm text-slate-400">Review the last 50 recorded login events.</p>
              </div>
              <span className="text-sm text-slate-400">{history.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead className="bg-slate-950/90 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Device</th>
                    <th className="px-4 py-3">Browser</th>
                    <th className="px-4 py-3">Login</th>
                    <th className="px-4 py-3">Logout</th>
                    <th className="px-4 py-3">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                        No recent login history available.
                      </td>
                    </tr>
                  ) : (
                    history.map((h) => (
                      <tr key={h.id} className="border-t border-white/10 last:border-b-0">
                        <td className="px-4 py-3 text-slate-100">{h.user_name || h.user_id}</td>
                        <td className="px-4 py-3 text-slate-300">{h.user_role}</td>
                        <td className="px-4 py-3 text-slate-300">{h.device_name}</td>
                        <td className="px-4 py-3 text-slate-300">{h.browser}</td>
                        <td className="px-4 py-3 text-slate-300">{new Date(h.login_time).toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-300">{h.logout_time ? new Date(h.logout_time).toLocaleString() : '-'}</td>
                        <td className="px-4 py-3 text-slate-300">{h.session_duration ? formatDuration(h.session_duration) : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
