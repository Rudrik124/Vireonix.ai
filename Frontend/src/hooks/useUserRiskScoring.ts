import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  calculateUserRiskScores,
  fetchRiskScoringMetrics,
  fetchRiskBreakdown,
  fetchHighRiskUsers,
  fetchUserRiskTrends,
  type UserRiskScore,
  type RiskScoringMetrics,
  type RiskBreakdown,
} from '../services/user-risk-scoring.service';

const ITEMS_PER_PAGE = 25;

export interface UseUserRiskScoringReturn {
  // Metrics
  metrics: RiskScoringMetrics;
  
  // Data
  allScores: UserRiskScore[];
  breakdown: RiskBreakdown[];
  trends: Array<{ date: string; safeCount: number; suspiciousCount: number; dangerousCount: number }>;
  
  // Pagination
  page: number;
  totalPages: number;
  goToPage: (page: number) => void;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
}

export function useUserRiskScoring(
  startDate?: string,
  endDate?: string
): UseUserRiskScoringReturn {
  const [metrics, setMetrics] = useState<RiskScoringMetrics>({
    safeUsers: 0,
    suspiciousUsers: 0,
    dangerousUsers: 0,
    averageRiskScore: 0,
    totalUsersAnalyzed: 0,
  });

  const [allScores, setAllScores] = useState<UserRiskScore[]>([]);
  const [breakdown, setBreakdown] = useState<RiskBreakdown[]>([]);
  const [trends, setTrends] = useState<Array<{
    date: string;
    safeCount: number;
    suspiciousCount: number;
    dangerousCount: number;
  }>>([]);

  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => {
    return Math.ceil(allScores.length / ITEMS_PER_PAGE) || 1;
  }, [allScores.length]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load all data in parallel
      const [metricsResult, scoresResult, breakdownResult, trendsResult] = await Promise.all([
        fetchRiskScoringMetrics(startDate, endDate),
        calculateUserRiskScores(startDate, endDate),
        fetchRiskBreakdown(startDate, endDate),
        fetchUserRiskTrends(7),
      ]);

      if (metricsResult.error) {
        throw new Error(metricsResult.error);
      }

      setMetrics(metricsResult.metrics);
      setAllScores(scoresResult.scores || []);
      setBreakdown(breakdownResult.breakdown || []);
      setTrends(trendsResult.trends || []);
      setPage(1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load risk scoring data';
      setError(errorMessage);
      console.error('Error loading risk scoring data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    metrics,
    allScores,
    breakdown,
    trends,
    page,
    totalPages,
    goToPage,
    isLoading,
    error,
    refresh,
  };
}
