import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function DeveloperLogsPage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    supabase
      .from("usage_logs")
      .select("created_at,portal,usage_type,feature_key,status,actor_role")
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (mounted) {
          setRows(data || []);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,#264d39_0%,#0f172a_45%,#020617_100%)] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-[2rem] border border-emerald-400/20 bg-white/5 p-8 backdrop-blur-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-200">Logs</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">Real-time monitoring surface for internal activity.</h1>
          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/10 text-slate-300">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Portal</th>
                  <th className="px-4 py-3">Usage type</th>
                  <th className="px-4 py-3">Feature</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Role</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-slate-400">No logs yet. Once usage events start writing to Supabase they will appear here.</td>
                  </tr>
                )}
                {rows.map((row, index) => (
                  <tr key={`${row.created_at}-${index}`} className="border-t border-white/10">
                    <td className="px-4 py-3 text-slate-300">{row.created_at ? new Date(row.created_at).toLocaleString() : "-"}</td>
                    <td className="px-4 py-3">{row.portal}</td>
                    <td className="px-4 py-3">{row.usage_type}</td>
                    <td className="px-4 py-3">{row.feature_key}</td>
                    <td className="px-4 py-3">{row.status}</td>
                    <td className="px-4 py-3">{row.actor_role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
