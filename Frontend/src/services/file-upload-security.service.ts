import { supabase } from "@/lib/supabase";

export type FileUploadAction =
  | 'UPLOAD_SUCCESS'
  | 'UPLOAD_REJECTED'
  | 'WRONG_MIME_TYPE'
  | 'FILE_TOO_LARGE'
  | 'MALWARE_DETECTED'
  | 'CORRUPTED_FILE';

export interface FileUploadSecurityEvent {
  id: string;
  user_id: string | null;
  category: 'FILE_UPLOAD';
  action: FileUploadAction;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  event_message: string;
  event_source: string;
  metadata: {
    file_name?: string;
    file_size?: number;
    file_type?: string;
    mime_type?: string;
    expected_mime?: string;
    max_file_size?: number;
    scan_time_ms?: number;
    malware_signature?: string;
    corruption_reason?: string;
    [key: string]: unknown;
  } | null;
  status: string;
  response_code: number | null;
  created_at: string;
  resolved_at: string | null;
  notes: string | null;
}

export interface FileUploadMetrics {
  imagesUploaded: number;
  videosUploaded: number;
  audioUploaded: number;
  rejectedFiles: number;
  malwareDetected: number;
  wrongMimeType: number;
  fileTooLarge: number;
  corruptedFiles: number;
  totalUploads: number;
  successRate: number; // percentage
}

export interface FileUploadFilterOptions {
  startDate?: string;
  endDate?: string;
  userId?: string;
  action?: FileUploadAction;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  fileType?: string;
  limit?: number;
  offset?: number;
}

/**
 * Categorize files by type from metadata
 */
function categorizeFileType(mimeType: string | undefined): 'image' | 'video' | 'audio' | 'other' {
  if (!mimeType) return 'other';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'other';
}

/**
 * Fetch file upload security metrics
 */
export async function fetchFileUploadMetrics(
  startDate?: string,
  endDate?: string
): Promise<{ metrics: FileUploadMetrics; error: string | null }> {
  try {
    let query = supabase
      .from('security_events')
      .select('action, metadata')
      .eq('category', 'FILE_UPLOAD');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const events = data || [];

    // Count successful uploads by type
    const successEvents = events.filter((e: any) => e.action === 'UPLOAD_SUCCESS');
    const imagesUploaded = successEvents.filter(
      (e: any) => categorizeFileType(e.metadata?.mime_type) === 'image'
    ).length;
    const videosUploaded = successEvents.filter(
      (e: any) => categorizeFileType(e.metadata?.mime_type) === 'video'
    ).length;
    const audioUploaded = successEvents.filter(
      (e: any) => categorizeFileType(e.metadata?.mime_type) === 'audio'
    ).length;

    const rejectedFiles = events.filter((e: any) => e.action === 'UPLOAD_REJECTED').length;
    const malwareDetected = events.filter((e: any) => e.action === 'MALWARE_DETECTED').length;
    const wrongMimeType = events.filter((e: any) => e.action === 'WRONG_MIME_TYPE').length;
    const fileTooLarge = events.filter((e: any) => e.action === 'FILE_TOO_LARGE').length;
    const corruptedFiles = events.filter((e: any) => e.action === 'CORRUPTED_FILE').length;

    const totalUploads = events.length;
    const successRate = totalUploads > 0
      ? (successEvents.length / totalUploads) * 100
      : 0;

    return {
      metrics: {
        imagesUploaded,
        videosUploaded,
        audioUploaded,
        rejectedFiles,
        malwareDetected,
        wrongMimeType,
        fileTooLarge,
        corruptedFiles,
        totalUploads,
        successRate: Math.round(successRate * 100) / 100,
      },
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch file upload metrics';
    console.error('Error fetching file upload metrics:', error);
    return {
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
      error: errorMessage,
    };
  }
}

/**
 * Fetch file upload security events with filters
 */
export async function fetchFileUploadSecurityEvents(
  filters: FileUploadFilterOptions = {}
): Promise<{ events: FileUploadSecurityEvent[]; total: number; error: string | null }> {
  try {
    const {
      startDate,
      endDate,
      userId,
      action,
      severity,
      fileType,
      limit = 50,
      offset = 0,
    } = filters;

    let query = supabase
      .from('security_events')
      .select('*', { count: 'exact' })
      .eq('category', 'FILE_UPLOAD')
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (action) {
      query = query.eq('action', action);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    let events = (data || []) as FileUploadSecurityEvent[];

    // Client-side filter by file type if specified
    if (fileType && fileType !== 'all') {
      events = events.filter(
        (e) => categorizeFileType(e.metadata?.mime_type) === fileType
      );
    }

    return { events, total: count || 0, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch file upload events';
    console.error('Error fetching file upload events:', error);
    return { events: [], total: 0, error: errorMessage };
  }
}

/**
 * Get rejection breakdown by reason
 */
export async function fetchRejectionBreakdown(
  startDate?: string,
  endDate?: string
): Promise<{
  breakdown: Array<{ reason: string; count: number; percentage: number }>;
  error: string | null;
}> {
  try {
    let query = supabase
      .from('security_events')
      .select('action')
      .eq('category', 'FILE_UPLOAD');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const events = data || [];
    const reasonMap = new Map<string, number>();
    let total = 0;

    events.forEach((event: Partial<FileUploadSecurityEvent>) => {
      if (
        event.action !== 'UPLOAD_SUCCESS' &&
        event.action !== 'UPLOAD_REJECTED'
      ) {
        reasonMap.set(
          event.action.replace(/_/g, ' '),
          (reasonMap.get(event.action.replace(/_/g, ' ')) || 0) + 1
        );
        total++;
      }
    });

    const breakdown = Array.from(reasonMap.entries())
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { breakdown, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch rejection breakdown';
    console.error('Error fetching rejection breakdown:', error);
    return { breakdown: [], error: errorMessage };
  }
}

/**
 * Get file type distribution
 */
export async function fetchFileTypeDistribution(
  startDate?: string,
  endDate?: string
): Promise<{
  distribution: Array<{ type: string; count: number; percentage: number }>;
  error: string | null;
}> {
  try {
    let query = supabase
      .from('security_events')
      .select('metadata, action')
      .eq('category', 'FILE_UPLOAD')
      .eq('action', 'UPLOAD_SUCCESS');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const events = data || [];
    const typeMap = new Map<string, number>();
    let total = 0;

    events.forEach((event: Partial<FileUploadSecurityEvent>) => {
      const fileType = categorizeFileType(event.metadata?.mime_type);
      typeMap.set(fileType, (typeMap.get(fileType) || 0) + 1);
      total++;
    });

    const distribution = Array.from(typeMap.entries())
      .map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { distribution, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch file type distribution';
    console.error('Error fetching file type distribution:', error);
    return { distribution: [], error: errorMessage };
  }
}

/**
 * Get daily upload trends
 */
export async function fetchUploadTrends(days: number = 7): Promise<{
  trends: Array<{ date: string; successful: number; failed: number; rejected: number }>;
  error: string | null;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('security_events')
      .select('action, created_at')
      .eq('category', 'FILE_UPLOAD')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const events = data || [];
    const trendMap = new Map<string, { successful: number; failed: number; rejected: number }>();

    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trendMap.set(dateStr, { successful: 0, failed: 0, rejected: 0 });
    }

    // Count events by date
    events.forEach((event: Partial<FileUploadSecurityEvent>) => {
      const dateStr = event.created_at.split('T')[0];
      const entry = trendMap.get(dateStr) || { successful: 0, failed: 0, rejected: 0 };

      if (event?.action === 'UPLOAD_SUCCESS') entry.successful++;
      else if (event?.action === 'UPLOAD_REJECTED') entry.rejected++;
      else entry.failed++;

      trendMap.set(dateStr, entry);
    });

    const trends = Array.from(trendMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { trends, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch upload trends';
    console.error('Error fetching upload trends:', error);
    return { trends: [], error: errorMessage };
  }
}

/**
 * Get malware detections
 */
export async function fetchMalwareDetections(limit: number = 20): Promise<{
  detections: FileUploadSecurityEvent[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .eq('category', 'FILE_UPLOAD')
      .eq('action', 'MALWARE_DETECTED')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { detections: (data || []) as FileUploadSecurityEvent[], error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch malware detections';
    console.error('Error fetching malware detections:', error);
    return { detections: [], error: errorMessage };
  }
}

/**
 * Subscribe to real-time file upload security events
 */
export function subscribeToFileUploadSecurityEvents(
  callback: (event: FileUploadSecurityEvent) => void
): () => void {
  if (!supabase) {
    console.warn('Supabase not configured');
    return () => { };
  }

  const channel = supabase.channel('file_upload_security_monitoring');

  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'security_events',
      filter: `category=eq.FILE_UPLOAD`,
    },
    (payload: any) => {
      callback(payload.new as FileUploadSecurityEvent);
    }
  );

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get average file sizes by type
 */
export async function fetchAverageFileSizes(): Promise<{
  sizes: Array<{ type: string; avgSize: string; count: number }>;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('security_events')
      .select('metadata')
      .eq('category', 'FILE_UPLOAD')
      .eq('action', 'UPLOAD_SUCCESS');

    if (error) throw error;

    const events = data || [];
    const typeMap = new Map<string, { total: number; count: number }>();

    events.forEach((event: Partial<FileUploadSecurityEvent>) => {
      const fileType = categorizeFileType(event.metadata?.mime_type);
      const fileSize = event.metadata?.file_size || 0;
      const existing = typeMap.get(fileType) || { total: 0, count: 0 };
      existing.total += fileSize;
      existing.count++;
      typeMap.set(fileType, existing);
    });

    const sizes = Array.from(typeMap.entries())
      .map(([type, stats]) => {
        const avgBytes = stats.count > 0 ? stats.total / stats.count : 0;
        return {
          type: type.charAt(0).toUpperCase() + type.slice(1),
          avgSize: formatBytes(avgBytes),
          count: stats.count,
        };
      })
      .sort((a, b) => b.count - a.count);

    return { sizes, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch average file sizes';
    console.error('Error fetching average file sizes:', error);
    return { sizes: [], error: errorMessage };
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
