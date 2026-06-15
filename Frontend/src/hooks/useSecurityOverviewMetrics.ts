import { useState, useEffect, useCallback } from 'react';
import {
  fetchSecurityOverviewMetrics,
  subscribeToSecurityOverviewUpdates,
  type SecurityOverviewMetrics,
} from '../services/security-overview.service';

const initialMetrics: SecurityOverviewMetrics = {
  totalUsers: 0,
  activeUsersToday: 0,
  videosGeneratedToday: 0,
  filesUploadedToday: 0,
  blockedPromptsToday: 0,
  blockedUploadsToday: 0,
  failedLoginsToday: 0,
  securityAlertsTodayCount: 0,
  loadingState: {
    isLoading: true,
    error: null,
  },
};

export function useSecurityOverviewMetrics() {
  const [metrics, setMetrics] = useState<SecurityOverviewMetrics>(initialMetrics);
  const [isConnected, setIsConnected] = useState(false);

  // Initial fetch
  useEffect(() => {
    const loadMetrics = async () => {
      setMetrics((prev) => ({
        ...prev,
        loadingState: { isLoading: true, error: null },
      }));

      const data = await fetchSecurityOverviewMetrics();
      setMetrics(data);
    };

    loadMetrics();
  }, []);

  // Set up real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToSecurityOverviewUpdates((updatedMetrics) => {
      setMetrics((prev) => ({
        ...prev,
        ...updatedMetrics,
      }));
      setIsConnected(true);
    });

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, []);

  const refresh = useCallback(async () => {
    setMetrics((prev) => ({
      ...prev,
      loadingState: { isLoading: true, error: null },
    }));

    const data = await fetchSecurityOverviewMetrics();
    setMetrics(data);
  }, []);

  return {
    metrics,
    isConnected,
    refresh,
  };
}
