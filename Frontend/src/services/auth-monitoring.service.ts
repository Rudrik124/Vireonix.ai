import { supabase } from "@/lib/supabase";

export type AuthEventType = 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'PASSWORD_RESET' | 'OAUTH_LOGIN' | 'SUSPICIOUS_LOGIN' | 'LOGOUT';

export interface AuthenticationEvent {
  id: string;
  user_id: string | null;
  category: 'AUTH';
  action: AuthEventType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  event_message: string;
  event_source: string;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  resource_type: string | null;
  resource_id: string | null;
  actor_role: string | null;
  metadata: {
    device_type?: string;
    browser?: string;
    operating_system?: string;
    provider?: string;
    risk_score?: number;
    [key: string]: unknown;
  } | null;
  status: string;
  response_code: number | null;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  notes: string | null;
  resolved_by: string | null;
}

export interface AuthMonitoringStats {
  successfulLogins: number;
  failedLogins: number;
  passwordResets: number;
  oauthLogins: number;
  suspiciousLogins: number;
  uniqueIPs: number;
  uniqueDevices: number;
  uniqueBrowsers: number;
}

export interface AuthFilterOptions {
  startDate?: string;
  endDate?: string;
  userId?: string;
  ipAddress?: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  action?: AuthEventType;
  limit?: number;
  offset?: number;
}

/**
 * Fetch authentication events with filters
 */
export async function fetchAuthenticationEvents(
  filters: AuthFilterOptions = {}
): Promise<{ events: AuthenticationEvent[]; total: number; error: string | null }> {
  try {
    const {
      startDate,
      endDate,
      userId,
      ipAddress,
      severity,
      action,
      limit = 50,
      offset = 0,
    } = filters;

    let query = supabase
      .from('security_events')
      .select('*', { count: 'exact' })
      .eq('category', 'AUTH')
      .order('created_at', { ascending: false });

    // Apply date filter
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply user filter
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Apply IP address filter
    if (ipAddress) {
      query = query.eq('ip_address', ipAddress);
    }

    // Apply severity filter
    if (severity) {
      query = query.eq('severity', severity);
    }

    // Apply action filter
    if (action) {
      query = query.eq('action', action);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      events: (data || []) as AuthenticationEvent[],
      total: count || 0,
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch authentication events';
    console.error('Error fetching authentication events:', error);
    return {
      events: [],
      total: 0,
      error: errorMessage,
    };
  }
}

/**
 * Calculate authentication monitoring statistics
 */
export async function fetchAuthMonitoringStats(
  startDate?: string,
  endDate?: string
): Promise<{ stats: AuthMonitoringStats; error: string | null }> {
  try {
    let baseQuery = supabase
      .from('security_events')
      .select('action, ip_address, metadata')
      .eq('category', 'AUTH');

    if (startDate) {
      baseQuery = baseQuery.gte('created_at', startDate);
    }
    if (endDate) {
      baseQuery = baseQuery.lte('created_at', endDate);
    }

    const { data, error } = await baseQuery;

    if (error) throw error;

    const events = (data || []) as AuthenticationEvent[];

    // Calculate statistics
    const stats: AuthMonitoringStats = {
      successfulLogins: events.filter((e) => e.action === 'LOGIN_SUCCESS').length,
      failedLogins: events.filter((e) => e.action === 'LOGIN_FAILURE').length,
      passwordResets: events.filter((e) => e.action === 'PASSWORD_RESET').length,
      oauthLogins: events.filter((e) => e.action === 'OAUTH_LOGIN').length,
      suspiciousLogins: events.filter((e) => e.action === 'SUSPICIOUS_LOGIN').length,
      uniqueIPs: new Set(
        events
          .map((e) => e.ip_address)
          .filter((ip): ip is string => ip !== null && ip !== undefined)
      ).size,
      uniqueDevices: new Set(
        events
          .map((e) => e.metadata?.device_type)
          .filter((d): d is string => d !== null && d !== undefined)
      ).size,
      uniqueBrowsers: new Set(
        events
          .map((e) => e.metadata?.browser)
          .filter((b): b is string => b !== null && b !== undefined)
      ).size,
    };

    return { stats, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch authentication stats';
    console.error('Error fetching authentication stats:', error);
    return {
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
      error: errorMessage,
    };
  }
}

/**
 * Track unique IPs with counts and details
 */
export async function fetchIPTracking(
  limit = 20
): Promise<{
  ips: Array<{
    ip_address: string;
    count: number;
    lastSeen: string;
    successCount: number;
    failureCount: number;
  }>;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('security_events')
      .select('ip_address, action, created_at')
      .eq('category', 'AUTH')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by IP and calculate stats
    const ipMap = new Map<
      string,
      {
        count: number;
        lastSeen: string;
        successCount: number;
        failureCount: number;
      }
    >();

    (data || []).forEach((event: AuthenticationEvent) => {
      if (!event.ip_address) return;

      const existing = ipMap.get(event.ip_address) || {
        count: 0,
        lastSeen: event.created_at,
        successCount: 0,
        failureCount: 0,
      };

      existing.count++;
      existing.lastSeen = event.created_at; // Already sorted, so first is most recent

      if (event.action === 'LOGIN_SUCCESS') existing.successCount++;
      else if (event.action === 'LOGIN_FAILURE') existing.failureCount++;

      ipMap.set(event.ip_address, existing);
    });

    const ips = Array.from(ipMap.entries())
      .map(([ip_address, stats]) => ({
        ip_address,
        ...stats,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return { ips, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch IP tracking data';
    console.error('Error fetching IP tracking:', error);
    return { ips: [], error: errorMessage };
  }
}

/**
 * Get device information breakdown
 */
export async function fetchDeviceInformation(): Promise<{
  devices: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('security_events')
      .select('metadata')
      .eq('category', 'AUTH');

    if (error) throw error;

    const deviceMap = new Map<string, number>();
    let total = 0;

    (data || []).forEach((event: AuthenticationEvent) => {
      const device = event.metadata?.device_type || 'Unknown';
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
      total++;
    });

    const devices = Array.from(deviceMap.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { devices, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch device information';
    console.error('Error fetching device information:', error);
    return { devices: [], error: errorMessage };
  }
}

/**
 * Get browser information breakdown
 */
export async function fetchBrowserInformation(): Promise<{
  browsers: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('security_events')
      .select('metadata')
      .eq('category', 'AUTH');

    if (error) throw error;

    const browserMap = new Map<string, number>();
    let total = 0;

    (data || []).forEach((event: AuthenticationEvent) => {
      const browser = event.metadata?.browser || 'Unknown';
      browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
      total++;
    });

    const browsers = Array.from(browserMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { browsers, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch browser information';
    console.error('Error fetching browser information:', error);
    return { browsers: [], error: errorMessage };
  }
}

import { socketService } from '../lib/socket';

/**
 * Subscribe to real-time authentication event updates
 */
export function subscribeToAuthenticationEvents(
  callback: (event: AuthenticationEvent) => void
): () => void {
  const socket = socketService.connect();

  const handleEvent = (payload: any) => {
    callback(payload as AuthenticationEvent);
  };

  socket.on('auth-events', handleEvent);

  return () => {
    socket.off('auth-events', handleEvent);
  };
}

/**
 * Detect suspicious login patterns
 */
export async function detectSuspiciousLogins(userId: string): Promise<{
  isSuspicious: boolean;
  riskScore: number;
  reasons: string[];
}> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentEvents, error } = await supabase
      .from('security_events')
      .select('action, ip_address, metadata, created_at')
      .eq('category', 'AUTH')
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false });

    if (error) throw error;

    let riskScore = 0;
    const reasons: string[] = [];

    const events = recentEvents || [];

    // Check for multiple failed logins
    const failedCount = events.filter((e: any) => e.action === 'LOGIN_FAILURE').length;
    if (failedCount >= 3) {
      riskScore += 30;
      reasons.push(`${failedCount} failed login attempts`);
    }

    // Check for rapid location changes (different IPs in short time)
    const uniqueIPs = new Set(events.map((e: any) => e.ip_address));
    if (uniqueIPs.size >= 2 && events.length >= 2) {
      riskScore += 25;
      reasons.push('Login from multiple IP addresses');
    }

    // Check for suspicious devices
    const suspiciousDevices = events.filter((e: any) => e.metadata?.risk_score && e.metadata.risk_score > 50);
    if (suspiciousDevices.length > 0) {
      riskScore += 20;
      reasons.push(`${suspiciousDevices.length} logins from suspicious devices`);
    }

    // Check for unusual browser/OS combination
    const oddCombos = events.filter(
      (e: any) => e.metadata?.browser === 'Unknown' || e.metadata?.operating_system === 'Unknown'
    );
    if (oddCombos.length >= 2) {
      riskScore += 15;
      reasons.push('Logins from unusual browser/OS combinations');
    }

    const isSuspicious = riskScore >= 50;

    return { isSuspicious, riskScore, reasons };
  } catch (error) {
    console.error('Error detecting suspicious logins:', error);
    return { isSuspicious: false, riskScore: 0, reasons: [] };
  }
}
