import { useState, useEffect, useCallback } from 'react';
import {
  fetchAuthenticationEvents,
  fetchAuthMonitoringStats,
  fetchIPTracking,
  fetchDeviceInformation,
  fetchBrowserInformation,
  subscribeToAuthenticationEvents,
  detectSuspiciousLogins,
  type AuthenticationEvent,
  type AuthMonitoringStats,
  type AuthFilterOptions,
} from '../services/auth-monitoring.service';

export interface AuthMonitoringData {
  stats: AuthMonitoringStats;
  events: AuthenticationEvent[];
  ipTracking: Array<{
    ip_address: string;
    count: number;
    lastSeen: string;
    successCount: number;
    failureCount: number;
  }>;
  deviceInfo: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  browserInfo: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  totalEvents: number;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

const initialData: AuthMonitoringData = {
  stats: {
    successfulLogins: 0,
    failedLogins: 0,
    passwordResets: 0,
    oauthLogins: 0,
    suspiciousLogins: 0,
    uniqueIPs: 0,
    uniqueDevices: 0,
    uniqueBrowsers: 0,
  },
  events: [],
  ipTracking: [],
  deviceInfo: [],
  browserInfo: [],
  totalEvents: 0,
  isLoading: true,
  error: null,
  isConnected: false,
};

export function useAuthenticationMonitoring(filters: AuthFilterOptions = {}) {
  const [data, setData] = useState<AuthMonitoringData>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Load all data
  const loadData = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch stats
      const { stats: statsData, error: statsError } = await fetchAuthMonitoringStats(
        filters.startDate,
        filters.endDate
      );
      if (statsError) throw new Error(statsError);

      // Fetch events
      const offset = (page - 1) * pageSize;
      const { events, total, error: eventsError } = await fetchAuthenticationEvents({
        ...filters,
        limit: pageSize,
        offset,
      });
      if (eventsError) throw new Error(eventsError);

      // Fetch IP tracking
      const { ips, error: ipError } = await fetchIPTracking(20);
      if (ipError) throw new Error(ipError);

      // Fetch device information
      const { devices, error: deviceError } = await fetchDeviceInformation();
      if (deviceError) throw new Error(deviceError);

      // Fetch browser information
      const { browsers, error: browserError } = await fetchBrowserInformation();
      if (browserError) throw new Error(browserError);

      setData({
        stats: statsData,
        events,
        ipTracking: ips,
        deviceInfo: devices,
        browserInfo: browsers,
        totalEvents: total,
        isLoading: false,
        error: null,
        isConnected,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load authentication data';
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [filters, page, isConnected]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [filters, page]);

  // Set up real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToAuthenticationEvents((event) => {
      // Refresh data when new event arrives
      setIsConnected(true);
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

export function useSuspiciousLoginDetection(userId: string) {
  const [result, setResult] = useState({
    isSuspicious: false,
    riskScore: 0,
    reasons: [] as string[],
    isLoading: true,
    error: null as string | null,
  });

  useEffect(() => {
    const checkSuspicious = async () => {
      try {
        const detection = await detectSuspiciousLogins(userId);
        setResult({
          ...detection,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to check suspicious logins';
        setResult((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      }
    };

    checkSuspicious();
  }, [userId]);

  return result;
}
