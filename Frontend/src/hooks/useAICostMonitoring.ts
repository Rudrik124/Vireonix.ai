import { useState, useEffect, useCallback } from 'react';
import {
  fetchAICostMetrics,
  fetchAICostEvents,
  fetchFeatureCostBreakdown,
  fetchCostTrends,
  subscribeToAICostEvents,
  type AICostMetrics,
  type AICostEvent,
  type AICostFilterOptions,
  type FeatureCost,
  type CostTrend,
} from '../services/ai-cost-monitoring.service';

export interface AICostMonitoringData {
  metrics: AICostMetrics;
  events: AICostEvent[];
  featureBreakdown: FeatureCost[];
  trends: CostTrend[];
  totalEvents: number;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

const initialData: AICostMonitoringData = {
  metrics: {
    runwayRequestsToday: 0,
    estimatedCostToday: 0,
    costPerUser: 0,
    costPerFeature: 0,
    totalCost: 0,
    averageRequestCost: 0,
  },
  events: [],
  featureBreakdown: [],
  trends: [],
  totalEvents: 0,
  isLoading: true,
  error: null,
  isConnected: false,
};

export function useAICostMonitoring(
  filters: AICostFilterOptions = {},
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  periodDays: number = 7
) {
  const [data, setData] = useState<AICostMonitoringData>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Load all data
  const loadData = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch metrics
      const { metrics, error: metricsError } = await fetchAICostMetrics(
        filters.startDate,
        filters.endDate
      );
      if (metricsError) throw new Error(metricsError);

      // Fetch events
      const offset = (page - 1) * pageSize;
      const { events, total, error: eventsError } = await fetchAICostEvents({
        ...filters,
        limit: pageSize,
        offset,
      });
      if (eventsError) throw new Error(eventsError);

      // Fetch feature breakdown
      const { breakdown, error: breakdownError } = await fetchFeatureCostBreakdown(
        filters.startDate,
        filters.endDate
      );
      if (breakdownError) throw new Error(breakdownError);

      // Fetch trends
      const { trends, error: trendsError } = await fetchCostTrends(period, periodDays);
      if (trendsError) throw new Error(trendsError);

      setData({
        metrics,
        events,
        featureBreakdown: breakdown,
        trends,
        totalEvents: total,
        isLoading: false,
        error: null,
        isConnected,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load AI cost monitoring data';
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [filters, page, period, periodDays, isConnected]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [filters, page, period, periodDays]);

  // Set up real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToAICostEvents((event) => {
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
