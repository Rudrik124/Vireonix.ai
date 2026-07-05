import { supabase } from "@/lib/supabase";

export type ErrorStatus = 'open' | 'resolved';
export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ErrorLog {
  id: string;
  timestamp: string;
  module: string;
  route: string;
  user_id?: string;
  error_message: string;
  stack_trace?: string;
  severity: ErrorSeverity;
  browser?: string;
  device?: string;
  status: ErrorStatus;
  resolved_at?: string;
  resolved_by?: string;
  additional_context?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ErrorLogFilters {
  timeRange?: 'today' | 'last7days' | 'last30days' | 'all';
  severity?: ErrorSeverity[];
  status?: ErrorStatus[];
  module?: string;
  searchQuery?: string;
}

/**
 * Fetch error logs with filters
 */
export async function fetchErrorLogs(filters?: ErrorLogFilters): Promise<ErrorLog[]> {
  if (!supabase) return [];

  try {
    let query = supabase.from('error_logs').select('*');

    // Apply time range filter
    if (filters?.timeRange) {
      const now = new Date();
      let startDate = new Date();

      switch (filters.timeRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'last7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'last30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case 'all':
        default:
          break;
      }

      if (filters.timeRange !== 'all') {
        query = query.gte('timestamp', startDate.toISOString());
      }
    }

    // Apply severity filter
    if (filters?.severity && filters.severity.length > 0) {
      query = query.in('severity', filters.severity);
    }

    // Apply status filter
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    // Apply module filter
    if (filters?.module) {
      query = query.eq('module', filters.module);
    }

    // Sort by timestamp descending (most recent first)
    query = query.order('timestamp', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching error logs:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception fetching error logs:', err);
    return [];
  }
}

/**
 * Fetch error logs grouped by module
 */
export async function fetchErrorsByModule(): Promise<Record<string, number>> {
  if (!supabase) return {};

  try {
    const { data, error } = await supabase
      .from('error_logs')
      .select('module')
      .eq('status', 'open');

    if (error) {
      console.error('Error fetching errors by module:', error);
      return {};
    }

    const grouped: Record<string, number> = {};
    (data || []).forEach((log: any) => {
      grouped[log.module] = (grouped[log.module] || 0) + 1;
    });

    return grouped;
  } catch (err) {
    console.error('Exception fetching errors by module:', err);
    return {};
  }
}

/**
 * Fetch error count summary
 */
export async function fetchErrorSummary(): Promise<{
  total: number;
  openCount: number;
  resolvedCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}> {
  if (!supabase) {
    return {
      total: 0,
      openCount: 0,
      resolvedCount: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    };
  }

  try {
    const { data, error } = await supabase.from('error_logs').select('id, status, severity');

    if (error) {
      console.error('Error fetching error summary:', error);
      return {
        total: 0,
        openCount: 0,
        resolvedCount: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
      };
    }

    const logs = data || [];
    return {
      total: logs.length,
      openCount: logs.filter((l: any) => l.status === 'open').length,
      resolvedCount: logs.filter((l: any) => l.status === 'resolved').length,
      criticalCount: logs.filter((l: any) => l.severity === 'critical').length,
      highCount: logs.filter((l: any) => l.severity === 'high').length,
      mediumCount: logs.filter((l: any) => l.severity === 'medium').length,
      lowCount: logs.filter((l: any) => l.severity === 'low').length,
    };
  } catch (err) {
    console.error('Exception fetching error summary:', err);
    return {
      total: 0,
      openCount: 0,
      resolvedCount: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    };
  }
}

/**
 * Mark an error as resolved
 */
export async function resolveError(errorId: string, adminId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('error_logs')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', errorId);

    if (error) {
      console.error('Error resolving error log:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception resolving error log:', err);
    return false;
  }
}

/**
 * Mark an error as open (reopen a resolved error)
 */
export async function reopenError(errorId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('error_logs')
      .update({
        status: 'open',
        resolved_at: null,
        resolved_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', errorId);

    if (error) {
      console.error('Error reopening error log:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception reopening error log:', err);
    return false;
  }
}

/**
 * Delete an error log
 */
export async function deleteErrorLog(errorId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('error_logs').delete().eq('id', errorId);

    if (error) {
      console.error('Error deleting error log:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception deleting error log:', err);
    return false;
  }
}
