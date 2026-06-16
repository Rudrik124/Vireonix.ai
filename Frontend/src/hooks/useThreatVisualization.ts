import { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchCountryThreats,
  fetchThreatMetrics,
  fetchTopThreats,
  fetchThreatIncidents,
  fetchThreatTimeline,
  subscribeToThreatUpdates,
  type CountryThreatData,
  type ThreatMetrics,
  type CountryRanking,
  type ThreatIncident,
  type ThreatFilterOptions,
} from "../services/threat-visualization.service";

export interface UseThreatVisualizationResult {
  countryThreats: CountryThreatData[];
  metrics: ThreatMetrics;
  topThreats: CountryRanking[];
  incidents: ThreatIncident[];
  timeline: Array<{ date: string; threats: number }>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateFilters: (filters: Partial<ThreatFilterOptions>) => void;
  currentFilters: ThreatFilterOptions;
}

export function useThreatVisualization(
  initialFilters?: ThreatFilterOptions
): UseThreatVisualizationResult {
  const [countryThreats, setCountryThreats] = useState<CountryThreatData[]>([]);
  const [metrics, setMetrics] = useState<ThreatMetrics>({
    totalThreats: 0,
    failedLoginCount: 0,
    blockedRequestCount: 0,
    securityEventCount: 0,
    criticalCountries: 0,
    highSeverityCountries: 0,
    uniqueCountries: 0,
    uniqueIPs: 0,
  });
  const [topThreats, setTopThreats] = useState<CountryRanking[]>([]);
  const [incidents, setIncidents] = useState<ThreatIncident[]>([]);
  const [timeline, setTimeline] = useState<Array<{ date: string; threats: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ThreatFilterOptions>(initialFilters || {});

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load all data in parallel
      const [threatsData, metricsData, topThreatsData, incidentsData, timelineData] =
        await Promise.all([
          fetchCountryThreats(filters),
          fetchThreatMetrics(filters),
          fetchTopThreats(filters, 15),
          fetchThreatIncidents(filters, 50),
          fetchThreatTimeline(filters),
        ]);

      setCountryThreats(threatsData);
      setMetrics(metricsData);
      setTopThreats(topThreatsData);
      setIncidents(incidentsData);
      setTimeline(timelineData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error loading threat visualization:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToThreatUpdates(() => {
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const updateFilters = useCallback(
    (newFilters: Partial<ThreatFilterOptions>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  return {
    countryThreats,
    metrics,
    topThreats,
    incidents,
    timeline,
    isLoading,
    error,
    refresh,
    updateFilters,
    currentFilters: filters,
  };
}
