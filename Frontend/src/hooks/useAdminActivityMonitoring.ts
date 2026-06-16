import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchAdminActivities,
  fetchAdminActivityMetrics,
  fetchAdminActionStats,
  fetchAdminAuditHistory,
  fetchAdminActivityTrends,
  type AdminActivity,
  type AdminActivityMetrics,
  type AdminActionStats,
  type AdminAuditHistory,
  type AdminActivityFilterOptions,
} from '../services/admin-activity.service';

const ITEMS_PER_PAGE = 25;

export interface UseAdminActivityMonitoringReturn {
  // Data
  activities: AdminActivity[];
  metrics: AdminActivityMetrics;
  stats: AdminActionStats[];
  auditHistory: AdminAuditHistory[];
  trends: Array<{
    date: string;
    logins: number;
    bans: number;
    deletes: number;
    roleChanges: number;
    settingsChanges: number;
  }>;

  // Pagination
  page: number;
  totalPages: number;
  totalActivities: number;
  goToPage: (page: number) => void;

  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
}

export function useAdminActivityMonitoring(
  filters: AdminActivityFilterOptions
): UseAdminActivityMonitoringReturn {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [metrics, setMetrics] = useState<AdminActivityMetrics>({
    totalAdminLogins: 0,
    totalAdminActions: 0,
    userBans: 0,
    userDeletes: 0,
    roleChanges: 0,
    settingsChanges: 0,
    activeAdmins: 0,
  });
  const [stats, setStats] = useState<AdminActionStats[]>([]);
  const [auditHistory, setAuditHistory] = useState<AdminAuditHistory[]>([]);
  const [trends, setTrends] = useState<
    Array<{
      date: string;
      logins: number;
      bans: number;
      deletes: number;
      roleChanges: number;
      settingsChanges: number;
    }>
  >([]);

  const [page, setPage] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => {
    return Math.ceil(totalActivities / ITEMS_PER_PAGE) || 1;
  }, [totalActivities]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const offset = (page - 1) * ITEMS_PER_PAGE;

      // Load all data in parallel
      const [activitiesResult, metricsResult, statsResult, auditResult, trendsResult] = await Promise.all([
        fetchAdminActivities(filters, ITEMS_PER_PAGE, offset),
        fetchAdminActivityMetrics(filters.startDate, filters.endDate),
        fetchAdminActionStats(filters.startDate, filters.endDate),
        fetchAdminAuditHistory(filters.adminId, filters.startDate, filters.endDate),
        fetchAdminActivityTrends(7, filters.startDate, filters.endDate),
      ]);

      if (activitiesResult.error) {
        throw new Error(activitiesResult.error);
      }

      setActivities(activitiesResult.activities);
      setTotalActivities(activitiesResult.total);
      setMetrics(metricsResult.metrics);
      setStats(statsResult.stats);
      setAuditHistory(auditResult.history);
      setTrends(trendsResult.trends);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load admin activity data';
      setError(errorMessage);
      console.error('Error loading admin activity data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    activities,
    metrics,
    stats,
    auditHistory,
    trends,
    page,
    totalPages,
    totalActivities,
    goToPage,
    isLoading,
    error,
    refresh,
  };
}
