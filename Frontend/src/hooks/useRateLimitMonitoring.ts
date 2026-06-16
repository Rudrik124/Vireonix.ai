import { useState, useEffect, useCallback } from 'react';
import {
  fetchRateLimitMetrics,
  fetchRateLimitEvents,
  fetchTopOffenders,
  fetchRateLimitTrends,
  fetchEndpointMetrics,
  subscribeToRateLimitEvents,
  type RateLimitMetrics,
  type RateLimitEvent,
  type RateLimitFilterOptions,
  type TopOffender,
} from '../services/rate-limit-monitoring.service';

export interface RateLimitMonitoringData {
  metrics: RateLimitMetrics;
  events: RateLimitEvent[];
  topOffenders: TopOffender[];
  trends: Array<{ date: string; limited: number; blocked: number; abused: number }>;
  endpoints: Array<{ endpoint: string; count: number; avgAbuseScore: number }>;
  totalEvents: number;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

const initialData: RateLimitMonitoringData = {
  metrics: {
    usersHittingLimits: 0,
    blockedRequests: 0,
    highUsageAccounts: 0,
    apiAbuseAttempts: 0,
    totalViolations: 0,
    blockRate: 0,
  },
  events: [],
  topOffenders: [],
  trends: [],
  endpoints: [],
  totalEvents: 0,
  isLoading: true,
  error: null,
  isConnected: false,
};

export function useRateLimitMonitoring(filters: RateLimitFilterOptions = {}, trendDays: number = 7) {
  const [data, setData] = useState<RateLimitMonitoringData>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Load all data
  const loadData = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch metrics
      const { metrics, error: metricsError } = await fetchRateLimitMetrics(
        filters.startDate,
        filters.endDate
      );
      if (metricsError) throw new Error(metricsError);

      // Fetch events
      const offset = (page - 1) * pageSize;
      const { events, total, error: eventsError } = await fetchRateLimitEvents({
        ...filters,
        limit: pageSize,
        offset,
      });
      if (eventsError) throw new Error(eventsError);

      // Fetch top offenders
      const { offenders, error: offendersError } = await fetchTopOffenders(15);
      if (offendersError) throw new Error(offendersError);

      // Fetch trends
      const { trends, error: trendsError } = await fetchRateLimitTrends(trendDays);
      if (trendsError) throw new Error(trendsError);

      // Fetch endpoint metrics
      const { endpoints, error: endpointsError } = await fetchEndpointMetrics();
      if (endpointsError) throw new Error(endpointsError);

      setData({
        metrics,
        events,
        topOffenders: offenders,
        trends,
        endpoints,
        totalEvents: total,
        isLoading: false,
        error: null,
        isConnected,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load rate limit monitoring data';
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
    const unsubscribe = subscribeToRateLimitEvents((event) => {
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
