import { useEffect, useState, useCallback } from 'react';
import {
  getAnalytics,
  getErrorLogs,
  getCreditTransactions,
  getFeedback,
} from '../services/analytics.service';
import { fetchDashboardStats, fetchUsers } from '../services/developer-portal-api.service';
import {
  useUsageLogsRealtime,
  useNewUsersRealtime,
  useErrorLogsRealtime,
} from './useRealtime';

/**
 * Hook for dashboard stats with real-time updates
 */
export function useDashboardStats() {
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    creditsConsumed: 0,
    aiRequests: 0,
    revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchDashboardStats();
      if (data) {
        setStats((previousStats: any) => ({
          ...previousStats,
          ...data,
        }));
      }
    } catch (statsError) {
      console.error('Failed to load dashboard stats:', statsError);
      setError(statsError instanceof Error ? statsError.message : 'Failed to load dashboard stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Subscribe to real-time updates
  useUsageLogsRealtime((payload) => {
    // Reload stats on new usage logs
    loadStats();
  });

  useNewUsersRealtime((payload) => {
    // Reload stats on new users
    loadStats();
  });

  useErrorLogsRealtime((payload) => {
    // Reload stats on new errors (for error count in analytics)
    loadStats();
  });

  return { stats, isLoading, error, refetch: loadStats };
}

/**
 * Hook for analytics data with real-time updates
 */
export function useAnalyticsData(timeRange: '7d' | '30d' | '90d' = '7d') {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    const data = await getAnalytics(timeRange);
    if (data) {
      setAnalytics(data);
    }
    setIsLoading(false);
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Subscribe to real-time updates
  useUsageLogsRealtime((payload) => {
    loadAnalytics();
  });

  return { analytics, isLoading, refetch: loadAnalytics };
}

/**
 * Hook for user list with pagination and real-time updates
 */
export function useUserList(page: number = 1, limit: number = 20) {
  const [users, setUsers] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchUsers(page, limit);
      if (data) {
        setUsers(data);
      }
    } catch (usersError) {
      console.error('Failed to fetch users:', usersError);
      setError(usersError instanceof Error ? usersError.message : 'Failed to fetch users');
      setUsers(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Subscribe to real-time updates (new users added)
  useNewUsersRealtime((payload) => {
    loadUsers();
  });

  return { users, isLoading, error, refetch: loadUsers };
}

/**
 * Hook for error logs with real-time updates
 */
export function useErrorLogsData(limit: number = 50, severity?: string[], status?: string[]) {
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadErrorLogs = useCallback(async () => {
    const data = await getErrorLogs(limit, severity, status);
    setErrorLogs(data);
    setIsLoading(false);
  }, [limit, severity, status]);

  useEffect(() => {
    loadErrorLogs();
  }, [loadErrorLogs]);

  // Subscribe to real-time updates (new errors)
  useErrorLogsRealtime((payload) => {
    setErrorLogs((prev) => [payload.new, ...prev].slice(0, limit));
  });

  return { errorLogs, isLoading, refetch: loadErrorLogs };
}

/**
 * Hook for credit transactions with real-time updates
 */
export function useCreditTransactionsData(limit: number = 50) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    const data = await getCreditTransactions(limit);
    setTransactions(data);
    setIsLoading(false);
  }, [limit]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Subscribe to real-time updates (new credit transactions)
  useUsageLogsRealtime((payload) => {
    if (
      payload.new?.feature_key &&
      ['credit_deducted', 'credit_added', 'credit_refunded'].includes(payload.new.feature_key)
    ) {
      setTransactions((prev) => [payload.new, ...prev].slice(0, limit));
    }
  });

  return { transactions, isLoading, refetch: loadTransactions };
}

/**
 * Hook for feedback data with real-time updates
 */
export function useFeedbackData(limit: number = 50) {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFeedback = useCallback(async () => {
    const data = await getFeedback(limit);
    setFeedback(data);
    setIsLoading(false);
  }, [limit]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  // Subscribe to real-time updates (new feedback)
  useUsageLogsRealtime((payload) => {
    if (payload.new?.feature_key === 'user_feedback') {
      const feedbackItem = {
        id: payload.new.id,
        title: payload.new.metadata?.title || 'Feedback',
        description: payload.new.metadata?.description || '',
        type: payload.new.metadata?.type || 'feedback',
        user_id: payload.new.user_id,
        created_at: payload.new.created_at,
      };
      setFeedback((prev) => [feedbackItem, ...prev].slice(0, limit));
    }
  });

  return { feedback, isLoading, refetch: loadFeedback };
}
