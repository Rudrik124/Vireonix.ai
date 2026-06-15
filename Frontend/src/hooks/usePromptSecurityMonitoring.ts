import { useState, useEffect, useCallback } from 'react';
import {
  fetchPromptSecurityMetrics,
  fetchPromptSecurityEvents,
  fetchModerationBreakdown,
  fetchPromptSecurityTrends,
  fetchSeverityDistribution,
  subscribeToPromptSecurityEvents,
  fetchHighConfidenceDetections,
  type PromptSecurityMetrics,
  type PromptSecurityEvent,
  type PromptFilterOptions,
} from '../services/prompt-security.service';

export interface PromptSecurityData {
  metrics: PromptSecurityMetrics;
  events: PromptSecurityEvent[];
  moderationBreakdown: Array<{ type: string; count: number; percentage: number }>;
  trends: Array<{ date: string; submitted: number; blocked: number; flagged: number }>;
  severityDistribution: Array<{ severity: string; count: number; percentage: number }>;
  highConfidenceDetections: PromptSecurityEvent[];
  totalEvents: number;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

const initialData: PromptSecurityData = {
  metrics: {
    totalPrompts: 0,
    blockedPrompts: 0,
    flaggedPrompts: 0,
    nsfwDetections: 0,
    violenceDetections: 0,
    promptInjectionAttempts: 0,
    copyrightAbuseDetections: 0,
    blockRate: 0,
  },
  events: [],
  moderationBreakdown: [],
  trends: [],
  severityDistribution: [],
  highConfidenceDetections: [],
  totalEvents: 0,
  isLoading: true,
  error: null,
  isConnected: false,
};

export function usePromptSecurityMonitoring(filters: PromptFilterOptions = {}, trendDays: number = 7) {
  const [data, setData] = useState<PromptSecurityData>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Load all data
  const loadData = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch metrics
      const { metrics, error: metricsError } = await fetchPromptSecurityMetrics(
        filters.startDate,
        filters.endDate
      );
      if (metricsError) throw new Error(metricsError);

      // Fetch events
      const offset = (page - 1) * pageSize;
      const { events, total, error: eventsError } = await fetchPromptSecurityEvents({
        ...filters,
        limit: pageSize,
        offset,
      });
      if (eventsError) throw new Error(eventsError);

      // Fetch moderation breakdown
      const { breakdown, error: breakdownError } = await fetchModerationBreakdown(
        filters.startDate,
        filters.endDate
      );
      if (breakdownError) throw new Error(breakdownError);

      // Fetch trends
      const { trends, error: trendsError } = await fetchPromptSecurityTrends(trendDays);
      if (trendsError) throw new Error(trendsError);

      // Fetch severity distribution
      const { distribution, error: distError } = await fetchSeverityDistribution(
        filters.startDate,
        filters.endDate
      );
      if (distError) throw new Error(distError);

      // Fetch high-confidence detections
      const { detections, error: detectionsError } = await fetchHighConfidenceDetections(80, 10);
      if (detectionsError) throw new Error(detectionsError);

      setData({
        metrics,
        events,
        moderationBreakdown: breakdown,
        trends,
        severityDistribution: distribution,
        highConfidenceDetections: detections,
        totalEvents: total,
        isLoading: false,
        error: null,
        isConnected,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load prompt security data';
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
    const unsubscribe = subscribeToPromptSecurityEvents((event) => {
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
