import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, ArrowLeft, CheckCircle2, RefreshCcw, Eye } from "lucide-react";
import { useRealtime } from "../../../hooks/useRealtime";
import {
  fetchDeveloperReports,
  updateDeveloperReport,
} from "../../../services/developer-portal-api.service";

type DeveloperReport = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  assigned_developer?: string;
  created_at?: string;
  severity?: string;
  attachment_count?: number;
  attachment_urls?: string[];
};

const fallbackDeveloperColumns = [
  "RUDRIK",
  "MOHAN",
  "MANJITH",
  "HARSHITHA",
  "UDAY",
  "SASWATEE",
];

const tabs = [
  { key: "open", label: "Open Reports" },
  { key: "board", label: "Developer Board" },
];

function formatTimestamp(timestamp?: string) {
  if (!timestamp) return "Unknown";
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DeveloperReportPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const [reports, setReports] = useState<DeveloperReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("—");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [updatingReports, setUpdatingReports] = useState<Record<string, boolean>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [openFilter, setOpenFilter] = useState<"all" | "processing" | "completed">("all");
  const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({});

  const toggleColumnExpanded = (developer: string) => {
    setExpandedColumns((prev) => ({ ...prev, [developer]: !prev[developer] }));
  };

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchDeveloperReports();
      setReports(Array.isArray(data) ? data : []);
      setLastUpdated(formatTimestamp(new Date().toISOString()));
    } catch (fetchError: unknown) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load reports");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleDraftChange = useCallback((id: string, value: string) => {
    setCommentDrafts((prev) => ({ ...prev, [id]: value }));
  }, []);

  const formatMessageCount = useCallback((count: number) => {
    return `${count} message${count === 1 ? "" : "s"}`;
  }, []);

  const handleReportAction = useCallback(
    async (reportId: string, status: string) => {
      setUpdatingReports((prev) => ({ ...prev, [reportId]: true }));
      setActionMessage(null);

      try {
        await updateDeveloperReport(reportId, {
          status,
          comment: commentDrafts[reportId] || null,
        });
        setCommentDrafts((prev) => ({ ...prev, [reportId]: "" }));
        setActionMessage("Report status updated successfully.");
        await loadReports();
      } catch (updateError: unknown) {
        setActionMessage(
          updateError instanceof Error ? updateError.message : "Unable to update report"
        );
      } finally {
        setUpdatingReports((prev) => ({ ...prev, [reportId]: false }));
      }
    },
    [commentDrafts, loadReports]
  );

  const subscriptions = useMemo(
    () => [
      {
        table: "bug_reports",
        event: "*" as const,
        callback: () => {
          loadReports();
        },
      },
    ],
    [loadReports]
  );

  const { isConnected } = useRealtime(subscriptions);

  // Fixed ordered developer columns (exact six names)
  const developerColumns = useMemo(() => {
    return [
      "RUDRIK",
      "MOHAN",
      "UDAY",
      "MANJITH",
      "SASWATEE",
      "HARSHITHA",
    ];
  }, []);

  const boardColumns = useMemo(
    () =>
      developerColumns.map((developer) => {
        const items = reports.filter((report) => report.assigned_developer === developer);
        return { developer, items };
      }),
    [developerColumns, reports]
  );

  const openColumns = useMemo(
    () =>
      developerColumns.map((developer) => {
        const items = reports.filter(
          (report) =>
            report.assigned_developer === developer &&
            ["open", "in-review"].includes(report.status?.toLowerCase() || "")
        );
        return { developer, items };
      }),
    [developerColumns, reports]
  );

  const filteredOpenReports = useMemo(() => {
    const processingStatuses = ["open", "in-review"];
    const completedStatuses = ["fixed", "verified"];

    if (openFilter === "all") return reports;
    if (openFilter === "processing") return reports.filter((r) => processingStatuses.includes(r.status?.toLowerCase() || ""));
    return reports.filter((r) => completedStatuses.includes(r.status?.toLowerCase() || ""));
  }, [reports, openFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <button
              onClick={() => navigate("/developer/dashboard")}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </button>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-400/80">Developer Report</p>
              <h1 className="text-3xl font-black tracking-tight text-white">Testing bug report board</h1>
            </div>
            <p className="max-w-2xl text-sm text-slate-400">
              Review the latest bug reports assigned to your developer team. The board updates in realtime when reports are created or updated.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Realtime</p>
              <p className="mt-3 text-2xl font-bold text-white">{isConnected ? "Active" : "Disconnected"}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Reports</p>
              <p className="mt-3 text-2xl font-bold text-white">{reports.length}</p>
            </div>
            <button
              onClick={loadReports}
              className="rounded-3xl border border-white/10 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-200 transition hover:border-indigo-400/30 hover:bg-indigo-500/15"
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </span>
              <span className="block text-xs text-slate-400">Updated {lastUpdated}</span>
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-indigo-400" />
              <div>
                <p className="text-sm text-slate-300">Active report stream</p>
                <p className="text-xs text-slate-500">A single view with exactly 6 developer columns in each tab.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Listening for bug_reports changes
            </div>
          </div>
        </div>

        {actionMessage ? (
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
            {actionMessage}
          </div>
        ) : null}

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-indigo-500 text-white"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error ? (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">
              <p className="font-semibold">Unable to load reports</p>
              <p>{error}</p>
            </div>
          ) : isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-center text-slate-400">Loading report board…</div>
          ) : (
            <div className="overflow-x-auto">
              {activeTab === "open" ? (
                <div className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setOpenFilter("all")}
                      className={`rounded-full px-3 py-2 text-sm font-semibold ${openFilter === "all" ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setOpenFilter("processing")}
                      className={`rounded-full px-3 py-2 text-sm font-semibold ${openFilter === "processing" ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                    >
                      Processing
                    </button>
                    <button
                      onClick={() => setOpenFilter("completed")}
                      className={`rounded-full px-3 py-2 text-sm font-semibold ${openFilter === "completed" ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                    >
                      Completed
                    </button>
                  </div>

                  <div className="space-y-4">
                    {filteredOpenReports.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/60 p-6 text-sm text-slate-500">No reports found</div>
                    ) : (
                      filteredOpenReports.map((report) => {
                        const isUpdating = updatingReports[report.id] || false;
                        const comment = commentDrafts[report.id] || "";

                        return (
                          <div key={report.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-white">{report.title}</p>
                                <p className="mt-2 text-xs leading-5 text-slate-400">{report.description || "No description provided."}</p>
                                <div className="mt-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                  <span>{report.severity?.toUpperCase() || "MEDIUM"}</span>
                                  <span>{report.status || "Unknown"}</span>
                                  <span>{formatTimestamp(report.created_at)}</span>
                                  <span className="ml-2 text-xs text-slate-400">Assigned: {report.assigned_developer || "—"}</span>
                                </div>
                                {report.notes && <p className="mt-3 text-slate-300">Note: {report.notes}</p>}
                                  {report.attachment_urls && report.attachment_urls.length > 0 && (
                                    <div className="mt-3 flex gap-3 items-center">
                                      {report.attachment_urls.map((url, idx) => (
                                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-white/10">
                                          <img src={url} alt={`attachment-${idx}`} className="w-36 h-24 object-cover" />
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                {report.resolved_at && (
                                  <p className="mt-2 text-sm text-emerald-300">Resolved {formatTimestamp(report.resolved_at)}</p>
                                )}
                              </div>
                              <div className="w-72">
                                <textarea
                                  value={comment}
                                  onChange={(e) => handleDraftChange(report.id, e.target.value)}
                                  placeholder="Add update"
                                  className="min-h-[88px] w-full rounded-2xl border border-white/10 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                                />
                                <div className="mt-3 flex flex-col gap-2">
                                  <button
                                    disabled={isUpdating}
                                    onClick={() => handleReportAction(report.id, "fixed")}
                                    className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950"
                                  >
                                    Work done
                                  </button>
                                  <button
                                    disabled={isUpdating}
                                    onClick={() => handleReportAction(report.id, "in-review")}
                                    className="inline-flex w-full items-center justify-center rounded-full bg-rose-500 px-3 py-2 text-sm font-semibold text-white"
                                  >
                                    Not done
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {boardColumns.map((column) => (
                    <div key={column.developer} className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 w-full">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{column.developer}</p>
                          <p className="mt-1 text-3xl font-black text-white">{column.items.length}</p>
                          <p className="text-xs text-slate-500">{formatMessageCount(column.items.length)}</p>
                        </div>
                        <div>
                          <button
                            onClick={() => toggleColumnExpanded(column.developer)}
                            aria-label={`Toggle ${column.developer} reports`}
                            className="h-10 w-10 rounded-2xl bg-indigo-500/10 text-indigo-300 flex items-center justify-center"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {/* If not expanded, show only header/count; otherwise show the items */}
                      {expandedColumns[column.developer] ? (
                        <div className="space-y-4">
                          {column.items.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/60 p-4 text-sm text-slate-500">No reports assigned</div>
                          ) : (
                            column.items.map((report) => {
                              const isUpdating = updatingReports[report.id] || false;
                              const comment = commentDrafts[report.id] || "";
                              return (
                                <div key={report.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                                  <p className="text-sm font-semibold text-white">{report.title}</p>
                                  <p className="mt-2 text-xs leading-5 text-slate-400 line-clamp-3">{report.description || "No description provided."}</p>

                                  <div className="mt-3 rounded-3xl border border-white/10 bg-slate-950/70 p-3 text-xs text-slate-400">
                                    <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                      <span>{report.severity?.toUpperCase() || "MEDIUM"}</span>
                                      <span>{formatTimestamp(report.created_at)}</span>
                                    </div>
                                    {report.notes ? (
                                      <p className="mt-3 text-slate-300">Note: {report.notes}</p>
                                    ) : (
                                      <p className="mt-3 text-slate-400">No developer notes yet.</p>
                                    )}
                                    {report.attachment_urls && report.attachment_urls.length > 0 && (
                                      <div className="mt-3 flex gap-3 items-center">
                                        {report.attachment_urls.map((url, idx) => (
                                          <a key={idx} href={url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-white/10">
                                            <img src={url} alt={`attachment-${idx}`} className="w-36 h-24 object-cover" />
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                    {report.resolved_at && (
                                      <p className="mt-2 text-sm text-emerald-300">Resolved {formatTimestamp(report.resolved_at)}</p>
                                    )}
                                  </div>

                                  <textarea
                                    value={comment}
                                    onChange={(event) => handleDraftChange(report.id, event.target.value)}
                                    placeholder="Add an update for this developer"
                                    className="mt-4 min-h-[88px] w-full rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                  />

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleReportAction(report.id, "fixed")}
                                      className="inline-flex min-w-[120px] items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Work done
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleReportAction(report.id, "in-review")}
                                      className="inline-flex min-w-[120px] items-center justify-center rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Not done
                                    </button>
                                    {isUpdating && (
                                      <span className="text-sm text-slate-400">Saving update…</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
