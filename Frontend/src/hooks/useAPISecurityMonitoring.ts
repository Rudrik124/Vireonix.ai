import { useState, useEffect, useCallback } from 'react';
import {
  fetchAPISecurityMetrics,
  fetchAPISecurityEvents,
  fetchEndpointMetrics,
  fetchMostAttackedEndpoints,
  fetchAPIActivityTrends,
  subscribeToAPISecurityEvents,
  type APISecurityMetrics,
  type APISecurityEvent,
  type APISecurityFilterOptions,
  type EndpointMetric,
  type AttackPattern,
} from '../services/api-security.service';

export interface APISecurityMonitoringData {
  metrics: APISecurityMetrics;
  events: APISecurityEvent[];
  endpoints: EndpointMetric[];
  attackPatterns: AttackPattern[];
  trends: Array<{ date: string; requests: number; blocked: number; errors: number; bots: number }>;
  totalEvents: number;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

const initialData: APISecurityMonitoringData = {
  metrics: {
    totalRequests: 0,
    blockedRequests: 0,
    invalidRequests: 0,
    serverErrors: 0,
    botActivity: 0,
    blockRate: 0,
  },
  events: [],
  endpoints: [],
  attackPatterns: [],
  trends: [],
  totalEvents: 0,
  isLoading: true,
  error: null,
  isConnected: false,
};

export function useAPISecurityMonitoring(filters: APISecurityFilterOptions = {}, trendDays: number = 7) {
  const [data, setData] = useState<APISecurityMonitoringData>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Load all data
  const loadData = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch metrics
      const { metrics, error: metricsError } = await fetchAPISecurityMetrics(
        filters.startDate,
        filters.endDate
      );
      if (metricsError) throw new Error(metricsError);

      // Fetch events
      const offset = (page - 1) * pageSize;
      const { events, total, error: eventsError } = await fetchAPISecurityEvents({
        ...filters,
        limit: pageSize,
        offset,
      });
      if (eventsError) throw new Error(eventsError);

      // Fetch endpoint metrics
      const { endpoints, error: endpointsError } = await fetchEndpointMetrics(
        filters.startDate,
        filters.endDate
      );
      if (endpointsError) throw new Error(endpointsError);

      // Fetch attack patterns
      const { patterns, error: patternsError } = await fetchMostAttackedEndpoints(15);
      if (patternsError) throw new Error(patternsError);

      // Fetch trends
      const { trends, error: trendsError } = await fetchAPIActivityTrends(trendDays);
      if (trendsError) throw new Error(trendsError);

      setData({
        metrics,
        events,
        endpoints,
        attackPatterns: patterns,
        trends,
        totalEvents: total,
        isLoading: false,
        error: null,
        isConnected,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load API security monitoring data';
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [filters, page, trendDays, isConnected]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [filters, page, trendDays]);

  // Set up real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToAPISecurityEvents((event) => {
      setIsConnected(true);
      // Refresh data when new event arrives
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const goToPage = useCallback((pageNum: number) => {
    setPage(Math.max(1, pageNum));
  }, []);

  const totalPages = Math.ceil(data.totalEvents / pageSize);

  return {
    ...data,
    isConnected,
    refresh,
    page,
    pageSize,
    totalPages,
    goToPage,
  };
}
