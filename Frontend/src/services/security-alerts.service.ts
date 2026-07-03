import { supabase } from "@/lib/supabase";
import { formatDateRange } from '../lib/api';

export type AlertType =
  | 'MALWARE_UPLOAD'
  | 'PROMPT_INJECTION'
  | 'EXCESSIVE_VIDEO_GENERATION'
  | 'ADMIN_LOGIN_NEW_DEVICE'
  | 'API_ABUSE';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface SecurityAlert {
  id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  user_id?: string;
  ip_address?: string;
  created_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  metadata?: {
    file_name?: string;
    file_type?: string;
    file_size?: string;
    malware_detected?: string;
    injection_type?: string;
    video_count?: number;
    device_name?: string;
    device_os?: string;
    endpoint?: string;
    request_count?: number;
    affected_users?: number;
    [key: string]: any;
  };
}

export interface SecurityAlertMetrics {
  totalAlerts: number;
  unacknowledgedAlerts: number;
  unresolvedAlerts: number;
  criticalAlerts: number;
  malwareUploads: number;
  promptInjections: number;
  excessiveVideoGeneration: number;
  adminLoginNewDevice: number;
  apiAbuse: number;
}

export interface AlertStats {
  type: AlertType;
  count: number;
  criticalCount: number;
  unresolvedCount: number;
}

export interface AlertFilterOptions {
  startDate?: string;
  endDate?: string;
  alertType?: AlertType | '';
  severity?: AlertSeverity | '';
  acknowledged?: boolean | null;
  resolved?: boolean | null;
}

// Map alert types to security_events categories and actions
const ALERT_TYPE_MAPPING: Record<AlertType, { category: string; action: string }> = {
  MALWARE_UPLOAD: { category: 'FILE_UPLOAD', action: 'MALWARE_DETECTED' },
  PROMPT_INJECTION: { category: 'PROMPT', action: 'INJECTION_DETECTED' },
  EXCESSIVE_VIDEO_GENERATION: { category: 'AI_COST', action: 'EXCESSIVE_GENERATION' },
  ADMIN_LOGIN_NEW_DEVICE: { category: 'AUTH', action: 'ADMIN_LOGIN_NEW_DEVICE' },
  API_ABUSE: { category: 'RATE_LIMIT', action: 'API_ABUSE_DETECTED' },
};

export async function fetchSecurityAlerts(
  filters: AlertFilterOptions,
  limit: number = 100,
  offset: number = 0
): Promise<{ alerts: SecurityAlert[]; total: number; error: string | null }> {
  try {
    const { start, end } = formatDateRange(filters.startDate, filters.endDate);

    let query = supabase
      .from('security_events')
      .select('*', { count: 'exact' })
      .gte('created_at', start)
      .lte('created_at', end);

    // Apply filters based on alert type
    if (filters.alertType) {
      const mapping = ALERT_TYPE_MAPPING[filters.alertType as AlertType];
      query = query.eq('category', mapping.category).eq('action', mapping.action);
    }

    // Apply severity filter
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }

    // For acknowledged/resolved filtering, we'd use metadata or additional columns
    // For now, we'll filter client-side or use metadata flags

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Transform to SecurityAlert format
    const alerts: SecurityAlert[] = (data || []).map((event: any) => ({
      id: event.id,
      alert_type: getAlertType(event.category, event.action),
      severity: event.severity,
      title: getAlertTitle(event.category, event.action),
      description: event.event_message,
      user_id: event.user_id,
      ip_address: event.metadata?.ip_address,
      created_at: event.created_at,
      acknowledged_at: event.metadata?.acknowledged_at,
      acknowledged_by: event.metadata?.acknowledged_by,
      resolved_at: event.metadata?.resolved_at,
      resolved_by: event.metadata?.resolved_by,
      resolution_notes: event.metadata?.resolution_notes,
      metadata: event.metadata,
    }));

    return { alerts, total: count || 0, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch security alerts';
    return { alerts: [], total: 0, error: errorMessage };
  }
}

export async function fetchSecurityAlertMetrics(
  startDate?: string,
  endDate?: string
): Promise<{ metrics: SecurityAlertMetrics; error: string | null }> {
  try {
    const { start, end } = formatDateRange(startDate, endDate);

    const { data, error } = await supabase
      .from('security_events')
      .select('category, action, severity, metadata')
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) throw error;

    const metrics: SecurityAlertMetrics = {
      totalAlerts: data?.length || 0,
      unacknowledgedAlerts: 0,
      unresolvedAlerts: 0,
      criticalAlerts: 0,
      malwareUploads: 0,
      promptInjections: 0,
      excessiveVideoGeneration: 0,
      adminLoginNewDevice: 0,
      apiAbuse: 0,
    };

    (data || []).forEach((event: any) => {
      if (event.severity === 'CRITICAL') metrics.criticalAlerts += 1;
      if (!event.metadata?.acknowledged_at) metrics.unacknowledgedAlerts += 1;
      if (!event.metadata?.resolved_at) metrics.unresolvedAlerts += 1;

      if (event.category === 'FILE_UPLOAD' && event.action === 'MALWARE_DETECTED') {
        metrics.malwareUploads += 1;
      } else if (event.category === 'PROMPT' && event.action === 'INJECTION_DETECTED') {
        metrics.promptInjections += 1;
      } else if (event.category === 'AI_COST' && event.action === 'EXCESSIVE_GENERATION') {
        metrics.excessiveVideoGeneration += 1;
      } else if (event.category === 'AUTH' && event.action === 'ADMIN_LOGIN_NEW_DEVICE') {
        metrics.adminLoginNewDevice += 1;
      } else if (event.category === 'RATE_LIMIT' && event.action === 'API_ABUSE_DETECTED') {
        metrics.apiAbuse += 1;
      }
    });

    return { metrics, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch alert metrics';
    return {
      metrics: {
        totalAlerts: 0,
        unacknowledgedAlerts: 0,
        unresolvedAlerts: 0,
        criticalAlerts: 0,
        malwareUploads: 0,
        promptInjections: 0,
        excessiveVideoGeneration: 0,
        adminLoginNewDevice: 0,
        apiAbuse: 0,
      },
      error: errorMessage,
    };
  }
}

export async function fetchAlertStats(
  startDate?: string,
  endDate?: string
): Promise<{ stats: AlertStats[]; error: string | null }> {
  try {
    const { start, end } = formatDateRange(startDate, endDate);

    const { data, error } = await supabase
      .from('security_events')
      .select('category, action, severity')
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) throw error;

    const statsMap = new Map<AlertType, AlertStats>();

    const alertTypes: AlertType[] = [
      'MALWARE_UPLOAD',
      'PROMPT_INJECTION',
      'EXCESSIVE_VIDEO_GENERATION',
      'ADMIN_LOGIN_NEW_DEVICE',
      'API_ABUSE',
    ];

    alertTypes.forEach((type) => {
      statsMap.set(type, {
        type,
        count: 0,
        criticalCount: 0,
        unresolvedCount: 0,
      });
    });

    (data || []).forEach((event: any) => {
      const alertType = getAlertType(event.category, event.action);
      if (statsMap.has(alertType)) {
        const stat = statsMap.get(alertType)!;
        stat.count += 1;
        if (event.severity === 'CRITICAL') stat.criticalCount += 1;
      }
    });

    const stats = Array.from(statsMap.values());
    return { stats, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch alert stats';
    return { stats: [], error: errorMessage };
  }
}

export async function acknowledgeAlert(
  alertId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('security_events')
      .update({
        metadata: {
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: userId,
        },
      })
      .eq('id', alertId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to acknowledge alert';
    return { success: false, error: errorMessage };
  }
}

export async function resolveAlert(
  alertId: string,
  userId: string,
  resolutionNotes?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('security_events')
      .update({
        metadata: {
          resolved_at: new Date().toISOString(),
          resolved_by: userId,
          resolution_notes: resolutionNotes,
        },
      })
      .eq('id', alertId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to resolve alert';
    return { success: false, error: errorMessage };
  }
}

export function subscribeToSecurityAlerts(
  callback: (alert: SecurityAlert) => void
): () => void {
  try {
    const subscription = supabase
      .channel('security_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events',
        },
        (payload: any) => {
          if (payload.new) {
            const alert: SecurityAlert = {
              id: payload.new.id,
              alert_type: getAlertType(payload.new.category, payload.new.action),
              severity: payload.new.severity,
              title: getAlertTitle(payload.new.category, payload.new.action),
              description: payload.new.event_message,
              user_id: payload.new.user_id,
              ip_address: payload.new.metadata?.ip_address,
              created_at: payload.new.created_at,
              metadata: payload.new.metadata,
            };
            callback(alert);
          }
        }
      )
      .subscribe();

    return () => {
      subscription?.unsubscribe?.();
    };
  } catch (error) {
    console.error('Error subscribing to alerts:', error);
    return () => { };
  }
}

// Helper functions
function getAlertType(category: string, action: string): AlertType {
  if (category === 'FILE_UPLOAD' && action === 'MALWARE_DETECTED') return 'MALWARE_UPLOAD';
  if (category === 'PROMPT' && action === 'INJECTION_DETECTED') return 'PROMPT_INJECTION';
  if (category === 'AI_COST' && action === 'EXCESSIVE_GENERATION') return 'EXCESSIVE_VIDEO_GENERATION';
  if (category === 'AUTH' && action === 'ADMIN_LOGIN_NEW_DEVICE') return 'ADMIN_LOGIN_NEW_DEVICE';
  if (category === 'RATE_LIMIT' && action === 'API_ABUSE_DETECTED') return 'API_ABUSE';
  return 'API_ABUSE'; // Default
}

function getAlertTitle(category: string, action: string): string {
  const mapping: Record<string, string> = {
    'FILE_UPLOAD-MALWARE_DETECTED': 'Malware Upload Detected',
    'PROMPT-INJECTION_DETECTED': 'Prompt Injection Attempt',
    'AI_COST-EXCESSIVE_GENERATION': 'Excessive Video Generation',
    'AUTH-ADMIN_LOGIN_NEW_DEVICE': 'Admin Login From New Device',
    'RATE_LIMIT-API_ABUSE_DETECTED': 'API Abuse Detected',
  };
  return mapping[`${category}-${action}`] || 'Security Alert';
}
