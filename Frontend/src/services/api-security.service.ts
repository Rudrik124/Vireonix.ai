import { supabase } from "@/lib/supabase";
import { formatDateRange } from '../lib/api';

export interface APISecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  invalidRequests: number;
  serverErrors: number;
  botActivity: number;
  blockRate: number;
}

export interface APISecurityEvent {
  id: string;
  user_id: string | null;
  ip_address: string | null;
  action: APISecurityAction;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  created_at: string;
  event_message: string;
  metadata?: {
    endpoint?: string;
    method?: string;
    status_code?: number;
    response_time_ms?: number;
    user_agent?: string;
    is_bot?: boolean;
    threat_score?: number;
  };
}

export type APISecurityAction =
  | 'REQUEST_RECEIVED'
  | 'REQUEST_BLOCKED'
  | 'INVALID_REQUEST'
  | 'SERVER_ERROR'
  | 'BOT_DETECTED'
  | 'SUSPICIOUS_PATTERN'
  | 'ENDPOINT_ATTACK';

export interface APISecurityFilterOptions {
  startDate?: string;
  endDate?: string;
  userId?: string;
  ipAddress?: string;
  action?: APISecurityAction;
  endpoint?: string;
  limit?: number;
  offset?: number;
}

export interface EndpointMetric {
  endpoint: string;
  method: string;
  totalRequests: number;
  blockedRequests: number;
  errors: number;
  avgResponseTime: number;
  threatScore: number;
}

export interface AttackPattern {
  ip_address: string | null;
  endpoint: string | null;
  attack_count: number;
  last_attack: string;
  severity: string;
}

export async function fetchAPISecurityMetrics(
  startDate?: string,
  endDate?: string
): Promise<{ metrics: APISecurityMetrics; error: string | null }> {
  try {
    const { start, end } = formatDateRange(startDate, endDate);

    // Total requests
    const { count: totalCount } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'API')
      .gte('created_at', start)
      .lte('created_at', end);

    // Blocked requests
    const { count: blockedCount } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'API')
      .eq('action', 'REQUEST_BLOCKED')
      .gte('created_at', start)
      .lte('created_at', end);

    // Invalid requests
    const { count: invalidCount } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'API')
      .eq('action', 'INVALID_REQUEST')
      .gte('created_at', start)
      .lte('created_at', end);

    // Server errors
    const { count: errorCount } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'API')
      .eq('action', 'SERVER_ERROR')
      .gte('created_at', start)
      .lte('created_at', end);

    // Bot activity
    const { count: botCount } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'API')
      .eq('action', 'BOT_DETECTED')
      .gte('created_at', start)
      .lte('created_at', end);

    const metrics: APISecurityMetrics = {
      totalRequests: totalCount || 0,
      blockedRequests: blockedCount || 0,
      invalidRequests: invalidCount || 0,
      serverErrors: errorCount || 0,
      botActivity: botCount || 0,
      blockRate: totalCount ? ((blockedCount || 0) / totalCount) * 100 : 0,
    };

    return { metrics, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch API security metrics';
    return {
      metrics: {
        totalRequests: 0,
        blockedRequests: 0,
        invalidRequests: 0,
        serverErrors: 0,
        botActivity: 0,
        blockRate: 0,
      },
      error: errorMessage,
    };
  }
}

export async function fetchAPISecurityEvents(
  filters: APISecurityFilterOptions
): Promise<{ events: APISecurityEvent[]; total: number; error: string | null }> {
  try {
    const { start, end } = formatDateRange(filters.startDate, filters.endDate);
    const offset = filters.offset || 0;
    const limit = filters.limit || 25;

    let query = supabase
      .from('security_events')
      .select('*', { count: 'exact' })
      .eq('category', 'API')
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

    if (filters.endpoint) {
      query = query.filter('metadata->endpoint', 'eq', filters.endpoint);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      events: (data || []) as APISecurityEvent[],
      total: count || 0,
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch API security events';
    return { events: [], total: 0, error: errorMessage };
  }
}

export async function fetchEndpointMetrics(
  startDate?: string,
  endDate?: string
): Promise<{ endpoints: EndpointMetric[]; error: string | null }> {
  try {
    const { start, end } = formatDateRange(startDate, endDate);

    const { data, error } = await supabase
      .from('security_events')
      .select('action, metadata')
      .eq('category', 'API')
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) throw error;

    const endpointMap = new Map<string, {
      method: string;
      totalRequests: number;
      blockedRequests: number;
      errors: number;
      responseTimes: number[];
      threatScores: number[];
    }>();

    (data || []).forEach((event: any) => {
      const endpoint = (event.metadata as any)?.endpoint || 'unknown';
      const method = (event.metadata as any)?.method || 'GET';
      const responseTime = (event.metadata as any)?.response_time_ms || 0;
      const threatScore = (event.metadata as any)?.threat_score || 0;

      const existing = endpointMap.get(endpoint) || {
        method,
        totalRequests: 0,
        blockedRequests: 0,
        errors: 0,
        responseTimes: [] as number[],
        threatScores: [] as number[],
      };

      existing.totalRequests += 1;

      if (event.action === 'REQUEST_BLOCKED') existing.blockedRequests += 1;
      if (event.action === 'SERVER_ERROR') existing.errors += 1;

      existing.responseTimes.push(responseTime);
      existing.threatScores.push(threatScore);

      endpointMap.set(endpoint, existing);
    });

    const endpoints: EndpointMetric[] = Array.from(endpointMap.entries())
      .map(([endpoint, { method, totalRequests, blockedRequests, errors, responseTimes, threatScores }]) => ({
        endpoint,
        method,
        totalRequests,
        blockedRequests,
        errors,
        avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        threatScore: threatScores.reduce((a, b) => a + b, 0) / threatScores.length,
      }))
      .sort((a, b) => b.blockedRequests - a.blockedRequests)
      .slice(0, 15);

    return { endpoints, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch endpoint metrics';
    return { endpoints: [], error: errorMessage };
  }
}

export async function fetchMostAttackedEndpoints(
  limit: number = 10
): Promise<{ patterns: AttackPattern[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('security_events')
      .select('ip_address, action, metadata, severity, created_at')
      .eq('category', 'API')
      .in('action', ['REQUEST_BLOCKED', 'SUSPICIOUS_PATTERN', 'ENDPOINT_ATTACK'])
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const patternMap = new Map<string, {
      attack_count: number;
      last_attack: string;
      severity: string;
    }>();

    (data || []).forEach((event: any) => {
      const key = `${event.ip_address || 'anonymous'}_${(event.metadata as any)?.endpoint || 'unknown'}`;
      const existing = patternMap.get(key) || {
        attack_count: 0,
        last_attack: event.created_at,
        severity: 'INFO',
      };

      existing.attack_count += 1;
      existing.last_attack = event.created_at;
      if (event.severity === 'CRITICAL') existing.severity = 'CRITICAL';
      else if (event.severity === 'WARNING' && existing.severity !== 'CRITICAL') existing.severity = 'WARNING';

      patternMap.set(key, existing);
    });

    const patterns: AttackPattern[] = Array.from(patternMap.entries())
      .map(([key, value]) => {
        const [ip, endpoint] = key.split('_');
        return {
          ip_address: ip === 'anonymous' ? null : ip,
          endpoint: endpoint === 'unknown' ? null : endpoint,
          ...value,
        };
      })
      .sort((a, b) => b.attack_count - a.attack_count)
      .slice(0, limit);

    return { patterns, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch attack patterns';
    return { patterns: [], error: errorMessage };
  }
}

export async function fetchAPIActivityTrends(days: number = 7): Promise<{
  trends: Array<{ date: string; requests: number; blocked: number; errors: number; bots: number }>;
  error: string | null;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('security_events')
      .select('created_at, action')
      .eq('category', 'API')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    const trendMap = new Map<string, { requests: number; blocked: number; errors: number; bots: number }>();

    (data || []).forEach((event: any) => {
      const date = new Date(event.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const existing = trendMap.get(date) || { requests: 0, blocked: 0, errors: 0, bots: 0 };

      existing.requests += 1;
      if (event.action === 'REQUEST_BLOCKED') existing.blocked += 1;
      else if (event.action === 'SERVER_ERROR') existing.errors += 1;
      else if (event.action === 'BOT_DETECTED') existing.bots += 1;

      trendMap.set(date, existing);
    });

    const trends = Array.from(trendMap.entries()).map(([date, counts]) => ({
      date,
      ...counts,
    }));

    return { trends, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch API activity trends';
    return { trends: [], error: errorMessage };
  }
}

export function subscribeToAPISecurityEvents(callback: (event: APISecurityEvent) => void): () => void {
  const subscription = supabase
    .channel('api_security_events')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'security_events',
        filter: `category=eq.API`,
      },
      (payload: any) => {
        callback(payload.new as APISecurityEvent);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
