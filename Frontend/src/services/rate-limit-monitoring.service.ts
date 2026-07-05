import { supabase } from "@/lib/supabase";
import { formatDateRange } from '../lib/api';

export interface RateLimitMetrics {
  usersHittingLimits: number;
  blockedRequests: number;
  highUsageAccounts: number;
  apiAbuseAttempts: number;
  totalViolations: number;
  blockRate: number;
}

export interface RateLimitEvent {
  id: string;
  user_id: string | null;
  ip_address: string | null;
  action: RateLimitAction;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  created_at: string;
  event_message: string;
  metadata?: {
    endpoint?: string;
    request_count?: number;
    limit?: number;
    abuse_score?: number;
    attempted_requests?: number;
  };
}

export type RateLimitAction =
  | 'RATE_LIMIT_EXCEEDED'
  | 'BLOCKED_REQUEST'
  | 'SUSPICIOUS_USAGE'
  | 'API_ABUSE_DETECTED'
  | 'LIMIT_RESET';

export interface RateLimitFilterOptions {
  startDate?: string;
  endDate?: string;
  userId?: string;
  ipAddress?: string;
  action?: RateLimitAction;
  limit?: number;
  offset?: number;
}

export interface TopOffender {
  user_id: string | null;
  ip_address: string | null;
  violation_count: number;
  last_violation: string;
  severity: string;
  abuse_score: number;
}

export async function fetchRateLimitMetrics(
  startDate?: string,
  endDate?: string
): Promise<{ metrics: RateLimitMetrics; error: string | null }> {
  try {
    const { start, end } = formatDateRange(startDate, endDate);

    // Total violations
    const { count: totalCount } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'RATE_LIMIT')
      .gte('created_at', start)
      .lte('created_at', end);

    // Blocked requests
    const { count: blockedCount } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'RATE_LIMIT')
      .eq('action', 'BLOCKED_REQUEST')
      .gte('created_at', start)
      .lte('created_at', end);

    // API abuse attempts
    const { count: abuseCount } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'RATE_LIMIT')
      .eq('action', 'API_ABUSE_DETECTED')
      .gte('created_at', start)
      .lte('created_at', end);

    // Users hitting limits (distinct users)
    const { data: limitUsers } = await supabase
      .from('security_events')
      .select('user_id', { head: false })
      .eq('category', 'RATE_LIMIT')
      .eq('action', 'RATE_LIMIT_EXCEEDED')
      .gte('created_at', start)
      .lte('created_at', end);

    const uniqueUsers = new Set(limitUsers?.map((u: any) => u.user_id).filter(Boolean) || []).size;

    // High usage accounts (suspicious usage)
    const { count: highUsageCount } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'RATE_LIMIT')
      .eq('action', 'SUSPICIOUS_USAGE')
      .gte('created_at', start)
      .lte('created_at', end);

    const metrics: RateLimitMetrics = {
      usersHittingLimits: uniqueUsers,
      blockedRequests: blockedCount || 0,
      highUsageAccounts: highUsageCount || 0,
      apiAbuseAttempts: abuseCount || 0,
      totalViolations: totalCount || 0,
      blockRate: totalCount ? ((blockedCount || 0) / totalCount) * 100 : 0,
    };

    return { metrics, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch rate limit metrics';
    return { metrics: { usersHittingLimits: 0, blockedRequests: 0, highUsageAccounts: 0, apiAbuseAttempts: 0, totalViolations: 0, blockRate: 0 }, error: errorMessage };
  }
}

export async function fetchRateLimitEvents(
  filters: RateLimitFilterOptions
): Promise<{ events: RateLimitEvent[]; total: number; error: string | null }> {
  try {
    const { start, end } = formatDateRange(filters.startDate, filters.endDate);
    const offset = filters.offset || 0;
    const limit = filters.limit || 25;

    let query = supabase
      .from('security_events')
      .select('*', { count: 'exact' })
      .eq('category', 'RATE_LIMIT')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.ipAddress) {
      query = query.eq('ip_address', filters.ipAddress);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      events: (data || []) as RateLimitEvent[],
      total: count || 0,
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch rate limit events';
    return { events: [], total: 0, error: errorMessage };
  }
}

export async function fetchTopOffenders(limit: number = 10): Promise<{ offenders: TopOffender[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('security_events')
      .select('user_id, ip_address, severity, metadata')
      .eq('category', 'RATE_LIMIT')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;

    // Group and count violations
    const offenderMap = new Map<string, TopOffender>();

    (data || []).forEach((event: any) => {
      const key = `${event.user_id || 'anonymous'}_${event.ip_address || 'unknown'}`;
      const existing = offenderMap.get(key);

      const abuseScore = (event.metadata as any)?.abuse_score || 0;
      const severity = event.severity;

      if (existing) {
        existing.violation_count += 1;
        existing.abuse_score = Math.max(existing.abuse_score, abuseScore);
        if (severity === 'CRITICAL') existing.severity = 'CRITICAL';
        else if (severity === 'WARNING' && existing.severity !== 'CRITICAL') existing.severity = 'WARNING';
      } else {
        offenderMap.set(key, {
          user_id: event.user_id,
          ip_address: event.ip_address,
          violation_count: 1,
          last_violation: event.created_at,
          severity: severity || 'INFO',
          abuse_score: abuseScore,
        });
      }
    });

    const offenders = Array.from(offenderMap.values())
      .sort((a, b) => b.violation_count - a.violation_count)
      .slice(0, limit);

    return { offenders, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch top offenders';
    return { offenders: [], error: errorMessage };
  }
}

export async function fetchRateLimitTrends(days: number = 7): Promise<{ trends: Array<{ date: string; limited: number; blocked: number; abused: number }>; error: string | null }> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('security_events')
      .select('created_at, action')
      .eq('category', 'RATE_LIMIT')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const trendMap = new Map<string, { limited: number; blocked: number; abused: number }>();

    (data || []).forEach((event: any) => {
      const date = new Date(event.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const existing = trendMap.get(date) || { limited: 0, blocked: 0, abused: 0 };

      if (event.action === 'RATE_LIMIT_EXCEEDED') existing.limited += 1;
      else if (event.action === 'BLOCKED_REQUEST') existing.blocked += 1;
      else if (event.action === 'API_ABUSE_DETECTED') existing.abused += 1;

      trendMap.set(date, existing);
    });

    const trends = Array.from(trendMap.entries()).map(([date, counts]) => ({
      date,
      ...counts,
    }));

    return { trends, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch rate limit trends';
    return { trends: [], error: errorMessage };
  }
}

export async function fetchEndpointMetrics(): Promise<{ endpoints: Array<{ endpoint: string; count: number; avgAbuseScore: number }>; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('security_events')
      .select('metadata')
      .eq('category', 'RATE_LIMIT')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const endpointMap = new Map<string, { count: number; scores: number[] }>();

    (data || []).forEach((event: any) => {
      const endpoint = (event.metadata as any)?.endpoint || 'unknown';
      const abuseScore = (event.metadata as any)?.abuse_score || 0;

      const existing = endpointMap.get(endpoint) || { count: 0, scores: [] };
      existing.count += 1;
      existing.scores.push(abuseScore);

      endpointMap.set(endpoint, existing);
    });

    const endpoints = Array.from(endpointMap.entries())
      .map(([endpoint, { count, scores }]) => ({
        endpoint,
        count,
        avgAbuseScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { endpoints, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch endpoint metrics';
    return { endpoints: [], error: errorMessage };
  }
}

export function subscribeToRateLimitEvents(callback: (event: RateLimitEvent) => void): () => void {
  const subscription = supabase
    .channel('rate_limit_events')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'security_events',
        filter: `category=eq.RATE_LIMIT`,
      },
      (payload: any) => {
        callback(payload.new as RateLimitEvent);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
