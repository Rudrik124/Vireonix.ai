import { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchAuditLogs,
  fetchAuditLogMetrics,
  fetchAuditLogStats,
  fetchAuditLogTrends,
  exportAuditLogsToCSV,
  exportAuditLogsToPDF,
  subscribeToAuditLogs,
  type AuditLogEvent,
  type AuditLogMetrics,
  type AuditLogStats,
  type AuditLogTrendData,
  type AuditLogFilterOptions,
  type AuditEventType,
  type AuditSeverity,
} from "../services/audit-log.service";

export interface AuditLogData {
  logs: AuditLogEvent[];
  metrics: AuditLogMetrics;
  stats: AuditLogStats[];
  trends: AuditLogTrendData[];
}

export interface UseAuditLogResult extends AuditLogData {
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  totalLogs: number;
  goToPage: (page: number) => void;
  refresh: () => Promise<void>;
  exportToCSV: () => Promise<void>;
  exportToPDF: () => Promise<void>;
  updateFilters: (filters: Partial<AuditLogFilterOptions>) => void;
  currentFilters: AuditLogFilterOptions;
}

export function useAuditLog(initialFilters?: AuditLogFilterOptions): UseAuditLogResult {
  const [logs, setLogs] = useState<AuditLogEvent[]>([]);
  const [metrics, setMetrics] = useState<AuditLogMetrics>({
    totalEvents: 0,
    loginCount: 0,
    logoutCount: 0,
    uploadCount: 0,
    promptSubmissionCount: 0,
    videoGenerationCount: 0,
    adminActionCount: 0,
    criticalEventsCount: 0,
    warningEventsCount: 0,
    uniqueUsersCount: 0,
  });
  const [stats, setStats] = useState<AuditLogStats[]>([]);
  const [trends, setTrends] = useState<AuditLogTrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const pageSize = 25;

  const [filters, setFilters] = useState<AuditLogFilterOptions>(initialFilters || {});

  const totalPages = useMemo(() => Math.ceil(totalLogs / pageSize), [totalLogs]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load logs with pagination
      const logsResult = await fetchAuditLogs(filters, page, pageSize);
      setLogs(logsResult.logs);
      setTotalLogs(logsResult.total);

      // Load metrics and stats in parallel
      const [metricsData, statsData, trendsData] = await Promise.all([
        fetchAuditLogMetrics(),
        fetchAuditLogStats(),
        fetchAuditLogTrends(),
      ]);

      setMetrics(metricsData);
      setStats(statsData);
      setTrends(trendsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error loading audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToAuditLogs(() => {
      // Refresh data when new events arrive
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const refresh = useCallback(async () => {
    setPage(1);
    await loadData();
  }, [loadData]);

  const updateFilters = useCallback(
    (newFilters: Partial<AuditLogFilterOptions>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      setPage(1);
    },
    []
  );

  const exportToCSV = useCallback(async () => {
    try {
      setIsLoading(true);
      const csvContent = await exportAuditLogsToCSV(filters);
      const element = document.createElement("a");
      element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
      element.setAttribute("download", `audit-logs-${new Date().toISOString().split("T")[0]}.csv`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const exportToPDF = useCallback(async () => {
    try {
      setIsLoading(true);
      const htmlContent = await exportAuditLogsToPDF(filters);
      const element = document.createElement("a");
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      element.setAttribute("href", url);
      element.setAttribute("download", `audit-logs-${new Date().toISOString().split("T")[0]}.html`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  return {
    logs,
    metrics,
    stats,
    trends,
    isLoading,
    error,
    page,
    totalPages,
    totalLogs,
    goToPage,
    refresh,
    exportToCSV,
    exportToPDF,
    updateFilters,
    currentFilters: filters,
  };
}
