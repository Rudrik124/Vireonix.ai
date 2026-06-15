import { useState, useEffect, useCallback } from 'react';
import {
  fetchFileUploadMetrics,
  fetchFileUploadSecurityEvents,
  fetchRejectionBreakdown,
  fetchFileTypeDistribution,
  fetchUploadTrends,
  fetchMalwareDetections,
  subscribeToFileUploadSecurityEvents,
  fetchAverageFileSizes,
  type FileUploadMetrics,
  type FileUploadSecurityEvent,
  type FileUploadFilterOptions,
} from '../services/file-upload-security.service';

export interface FileUploadSecurityData {
  metrics: FileUploadMetrics;
  events: FileUploadSecurityEvent[];
  rejectionBreakdown: Array<{ reason: string; count: number; percentage: number }>;
  fileTypeDistribution: Array<{ type: string; count: number; percentage: number }>;
  uploadTrends: Array<{ date: string; successful: number; failed: number; rejected: number }>;
  malwareDetections: FileUploadSecurityEvent[];
  averageFileSizes: Array<{ type: string; avgSize: string; count: number }>;
  totalEvents: number;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

const initialData: FileUploadSecurityData = {
  metrics: {
    imagesUploaded: 0,
    videosUploaded: 0,
    audioUploaded: 0,
    rejectedFiles: 0,
    malwareDetected: 0,
    wrongMimeType: 0,
    fileTooLarge: 0,
    corruptedFiles: 0,
    totalUploads: 0,
    successRate: 0,
  },
  events: [],
  rejectionBreakdown: [],
  fileTypeDistribution: [],
  uploadTrends: [],
  malwareDetections: [],
  averageFileSizes: [],
  totalEvents: 0,
  isLoading: true,
  error: null,
  isConnected: false,
};

export function useFileUploadSecurityMonitoring(filters: FileUploadFilterOptions = {}, trendDays: number = 7) {
  const [data, setData] = useState<FileUploadSecurityData>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Load all data
  const loadData = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch metrics
      const { metrics, error: metricsError } = await fetchFileUploadMetrics(
        filters.startDate,
        filters.endDate
      );
      if (metricsError) throw new Error(metricsError);

      // Fetch events
      const offset = (page - 1) * pageSize;
      const { events, total, error: eventsError } = await fetchFileUploadSecurityEvents({
        ...filters,
        limit: pageSize,
        offset,
      });
      if (eventsError) throw new Error(eventsError);

      // Fetch rejection breakdown
      const { breakdown, error: breakdownError } = await fetchRejectionBreakdown(
        filters.startDate,
        filters.endDate
      );
      if (breakdownError) throw new Error(breakdownError);

      // Fetch file type distribution
      const { distribution, error: distError } = await fetchFileTypeDistribution(
        filters.startDate,
        filters.endDate
      );
      if (distError) throw new Error(distError);

      // Fetch upload trends
      const { trends, error: trendsError } = await fetchUploadTrends(trendDays);
      if (trendsError) throw new Error(trendsError);

      // Fetch malware detections
      const { detections, error: detectionsError } = await fetchMalwareDetections(10);
      if (detectionsError) throw new Error(detectionsError);

      // Fetch average file sizes
      const { sizes, error: sizesError } = await fetchAverageFileSizes();
      if (sizesError) throw new Error(sizesError);

      setData({
        metrics,
        events,
        rejectionBreakdown: breakdown,
        fileTypeDistribution: distribution,
        uploadTrends: trends,
        malwareDetections: detections,
        averageFileSizes: sizes,
        totalEvents: total,
        isLoading: false,
        error: null,
        isConnected,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load file upload security data';
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
    const unsubscribe = subscribeToFileUploadSecurityEvents((event) => {
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
