import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchSecurityAlerts,
  fetchSecurityAlertMetrics,
  fetchAlertStats,
  acknowledgeAlert as acknowledgeAlertService,
  resolveAlert as resolveAlertService,
  subscribeToSecurityAlerts,
  type SecurityAlert,
  type SecurityAlertMetrics,
  type AlertStats,
  type AlertFilterOptions,
} from '../services/security-alerts.service';
import { useAuth } from '../app/context/auth-context';

const ITEMS_PER_PAGE = 25;

export interface UseSecurityAlertsReturn {
  // Data
  alerts: SecurityAlert[];
  metrics: SecurityAlertMetrics;
  stats: AlertStats[];

  // Pagination
  page: number;
  totalPages: number;
  totalAlerts: number;
  goToPage: (page: number) => void;

  // State
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;

  // Actions
  refresh: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string, notes?: string) => Promise<void>;
}

export function useSecurityAlerts(filters: AlertFilterOptions): UseSecurityAlertsReturn {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [metrics, setMetrics] = useState<SecurityAlertMetrics>({
    totalAlerts: 0,
    unacknowledgedAlerts: 0,
    unresolvedAlerts: 0,
    criticalAlerts: 0,
    malwareUploads: 0,
    promptInjections: 0,
    excessiveVideoGeneration: 0,
    adminLoginNewDevice: 0,
    apiAbuse: 0,
  });
  const [stats, setStats] = useState<AlertStats[]>([]);

  const [page, setPage] = useState(1);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const totalPages = useMemo(() => {
    return Math.ceil(totalAlerts / ITEMS_PER_PAGE) || 1;
  }, [totalAlerts]);

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
      const [alertsResult, metricsResult, statsResult] = await Promise.all([
        fetchSecurityAlerts(filters, ITEMS_PER_PAGE, offset),
        fetchSecurityAlertMetrics(filters.startDate, filters.endDate),
        fetchAlertStats(filters.startDate, filters.endDate),
      ]);

      if (alertsResult.error) {
        throw new Error(alertsResult.error);
      }

      setAlerts(alertsResult.alerts);
      setTotalAlerts(alertsResult.total);
      setMetrics(metricsResult.metrics);
      setStats(statsResult.stats);
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load security alerts';
      setError(errorMessage);
      console.error('Error loading security alerts:', err);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = subscribeToSecurityAlerts((newAlert) => {
        setAlerts((prev) => [newAlert, ...prev.slice(0, ITEMS_PER_PAGE - 1)]);
        setTotalAlerts((prev) => prev + 1);
      });
    } catch (error) {
      console.error('Error setting up alert subscription:', error);
    }

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const acknowledgeAlert = useCallback(
    async (alertId: string) => {
      if (!profile?.id) return;

      try {
        const result = await acknowledgeAlertService(alertId, profile.id);
        if (result.error) throw new Error(result.error);

        // Update local state
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === alertId
              ? {
                  ...alert,
                  acknowledged_at: new Date().toISOString(),
                  acknowledged_by: profile.id,
                }
              : alert
          )
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to acknowledge alert';
        setError(errorMessage);
      }
    },
    [profile?.id]
  );

  const resolveAlert = useCallback(
    async (alertId: string, notes?: string) => {
      if (!profile?.id) return;

      try {
        const result = await resolveAlertService(alertId, profile.id, notes);
        if (result.error) throw new Error(result.error);

        // Update local state
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === alertId
              ? {
                  ...alert,
                  resolved_at: new Date().toISOString(),
                  resolved_by: profile.id,
                  resolution_notes: notes,
                }
              : alert
          )
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to resolve alert';
        setError(errorMessage);
      }
    },
    [profile?.id]
  );

  return {
    alerts,
    metrics,
    stats,
    page,
    totalPages,
    totalAlerts,
    goToPage,
    isLoading,
    error,
    isConnected,
    refresh,
    acknowledgeAlert,
    resolveAlert,
  };
}
