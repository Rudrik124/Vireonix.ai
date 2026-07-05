import { supabase } from "@/lib/supabase";

export type PromptSecurityAction =
  | 'PROMPT_SUBMITTED'
  | 'PROMPT_BLOCKED'
  | 'NSFW_DETECTION'
  | 'VIOLENCE_DETECTION'
  | 'PROMPT_INJECTION'
  | 'COPYRIGHT_ABUSE';

export interface PromptSecurityEvent {
  id: string;
  user_id: string | null;
  category: 'PROMPT';
  action: PromptSecurityAction;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  event_message: string;
  event_source: string;
  metadata: {
    prompt_text?: string;
    confidence_score?: number;
    detection_type?: string;
    violation_reason?: string;
    moderation_tags?: string[];
    [key: string]: unknown;
  } | null;
  status: string;
  response_code: number | null;
  created_at: string;
  resolved_at: string | null;
  notes: string | null;
}

export interface PromptSecurityMetrics {
  totalPrompts: number;
  blockedPrompts: number;
  flaggedPrompts: number;
  nsfwDetections: number;
  violenceDetections: number;
  promptInjectionAttempts: number;
  copyrightAbuseDetections: number;
  blockRate: number; // percentage
}

export interface PromptFilterOptions {
  startDate?: string;
  endDate?: string;
  userId?: string;
  action?: PromptSecurityAction;
  minConfidence?: number;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  limit?: number;
  offset?: number;
}

/**
 * Fetch prompt security metrics
 */
export async function fetchPromptSecurityMetrics(
  startDate?: string,
  endDate?: string
): Promise<{ metrics: PromptSecurityMetrics; error: string | null }> {
  try {
    let query = supabase
      .from('security_events')
      .select('action')
      .eq('category', 'PROMPT');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const events = (data || []) as PromptSecurityEvent[];

    const totalPrompts = events.filter(
      (e) => e.action === 'PROMPT_SUBMITTED'
    ).length;
    const blockedPrompts = events.filter(
      (e) => e.action === 'PROMPT_BLOCKED'
    ).length;
    const flaggedPrompts = events.filter(
      (e) => ['NSFW_DETECTION', 'VIOLENCE_DETECTION', 'PROMPT_INJECTION', 'COPYRIGHT_ABUSE'].includes(e.action)
    ).length;
    const nsfwDetections = events.filter(
      (e) => e.action === 'NSFW_DETECTION'
    ).length;
    const violenceDetections = events.filter(
      (e) => e.action === 'VIOLENCE_DETECTION'
    ).length;
    const promptInjectionAttempts = events.filter(
      (e) => e.action === 'PROMPT_INJECTION'
    ).length;
    const copyrightAbuseDetections = events.filter(
      (e) => e.action === 'COPYRIGHT_ABUSE'
    ).length;

    const blockRate = totalPrompts > 0 ? (blockedPrompts / totalPrompts) * 100 : 0;

    return {
      metrics: {
        totalPrompts,
        blockedPrompts,
        flaggedPrompts,
        nsfwDetections,
        violenceDetections,
        promptInjectionAttempts,
        copyrightAbuseDetections,
        blockRate: Math.round(blockRate * 100) / 100,
      },
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch prompt metrics';
    console.error('Error fetching prompt security metrics:', error);
    return {
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
      error: errorMessage,
    };
  }
}

/**
 * Fetch prompt security events with filters
 */
export async function fetchPromptSecurityEvents(
  filters: PromptFilterOptions = {}
): Promise<{ events: PromptSecurityEvent[]; total: number; error: string | null }> {
  try {
    const {
      startDate,
      endDate,
      userId,
      action,
      minConfidence,
      severity,
      limit = 50,
      offset = 0,
    } = filters;

    let query = supabase
      .from('security_events')
      .select('*', { count: 'exact' })
      .eq('category', 'PROMPT')
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

    let events = (data || []) as PromptSecurityEvent[];

    // Client-side filter by confidence if specified
    if (minConfidence !== undefined) {
      events = events.filter(
        (e) => (e.metadata?.confidence_score || 0) >= minConfidence
      );
    }

    return { events, total: count || 0, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch prompt events';
    console.error('Error fetching prompt security events:', error);
    return { events: [], total: 0, error: errorMessage };
  }
}

/**
 * Get moderation breakdown by type
 */
export async function fetchModerationBreakdown(
  startDate?: string,
  endDate?: string
): Promise<{
  breakdown: Array<{ type: string; count: number; percentage: number }>;
  error: string | null;
}> {
  try {
    let query = supabase
      .from('security_events')
      .select('action')
      .eq('category', 'PROMPT');

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

    events.forEach((event: { action: string }) => {
      if (event.action !== 'PROMPT_SUBMITTED' && event.action !== 'PROMPT_BLOCKED') {
        typeMap.set(
          event.action.replace(/_/g, ' '),
          (typeMap.get(event.action.replace(/_/g, ' ')) || 0) + 1
        );
        total++;
      }
    });

    const breakdown = Array.from(typeMap.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { breakdown, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch moderation breakdown';
    console.error('Error fetching moderation breakdown:', error);
    return { breakdown: [], error: errorMessage };
  }
}

/**
 * Get daily prompt statistics for trending
 */
export async function fetchPromptSecurityTrends(days: number = 7): Promise<{
  trends: Array<{ date: string; submitted: number; blocked: number; flagged: number }>;
  error: string | null;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('security_events')
      .select('action, created_at')
      .eq('category', 'PROMPT')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const events = data || [];
    const trendMap = new Map<string, { submitted: number; blocked: number; flagged: number }>();

    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trendMap.set(dateStr, { submitted: 0, blocked: 0, flagged: 0 });
    }

    // Count events by date
    events.forEach((event: { action: string; created_at: string }) => {
      const dateStr = event.created_at.split('T')[0];
      const entry = trendMap.get(dateStr) || { submitted: 0, blocked: 0, flagged: 0 };

      if (event.action === 'PROMPT_SUBMITTED') entry.submitted++;
      else if (event.action === 'PROMPT_BLOCKED') entry.blocked++;
      else entry.flagged++;

      trendMap.set(dateStr, entry);
    });

    const trends = Array.from(trendMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { trends, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch trends';
    console.error('Error fetching prompt security trends:', error);
    return { trends: [], error: errorMessage };
  }
}

/**
 * Get severity distribution
 */
export async function fetchSeverityDistribution(
  startDate?: string,
  endDate?: string
): Promise<{
  distribution: Array<{ severity: string; count: number; percentage: number }>;
  error: string | null;
}> {
  try {
    let query = supabase
      .from('security_events')
      .select('severity')
      .eq('category', 'PROMPT');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const events = data || [];
    const severityMap = new Map<string, number>();
    let total = 0;

    events.forEach((event: { severity: string }) => {
      severityMap.set(
        event.severity,
        (severityMap.get(event.severity) || 0) + 1
      );
      total++;
    });

    const distribution = [
      { severity: 'CRITICAL', count: severityMap.get('CRITICAL') || 0 },
      { severity: 'WARNING', count: severityMap.get('WARNING') || 0 },
      { severity: 'INFO', count: severityMap.get('INFO') || 0 },
    ]
      .map((item) => ({
        ...item,
        percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => {
        const order: Record<string, number> = { CRITICAL: 0, WARNING: 1, INFO: 2 };
        return order[a.severity] - order[b.severity];
      });

    return { distribution, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch severity distribution';
    console.error('Error fetching severity distribution:', error);
    return { distribution: [], error: errorMessage };
  }
}

import { socketService } from '../lib/socket';

/**
 * Subscribe to real-time prompt security events
 */
export function subscribeToPromptSecurityEvents(
  callback: (event: PromptSecurityEvent) => void
): () => void {
  const socket = socketService.connect();

  const handleEvent = (payload: any) => {
    callback(payload as PromptSecurityEvent);
  };

  socket.on('prompt-security-updates', handleEvent);

  return () => {
    socket.off('prompt-security-updates', handleEvent);
  };
}

/**
 * Get high-confidence detections (confidence >= threshold)
 */
export async function fetchHighConfidenceDetections(
  threshold: number = 80,
  limit: number = 20
): Promise<{
  detections: PromptSecurityEvent[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .eq('category', 'PROMPT')
      .order('created_at', { ascending: false })
      .limit(100); // Get more to filter client-side

    if (error) throw error;

    const detections = (data || [])
      .filter((e: Partial<PromptSecurityEvent>) => (e.metadata?.confidence_score || 0) >= threshold)
      .slice(0, limit) as PromptSecurityEvent[];

    return { detections, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch high-confidence detections';
    console.error('Error fetching high-confidence detections:', error);
    return { detections: [], error: errorMessage };
  }
}
