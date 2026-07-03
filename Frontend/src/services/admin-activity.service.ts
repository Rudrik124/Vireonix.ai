import { supabase } from "@/lib/supabase";
import { formatDateRange } from '../lib/api';

export type AdminActionType =
  | 'ADMIN_LOGIN'
  | 'USER_BAN'
  | 'USER_DELETE'
  | 'ROLE_CHANGE'
  | 'SETTINGS_CHANGE';

export interface AdminActivity {
  id: string;
  admin_id: string;
  admin_name?: string;
  action_type: AdminActionType;
  title: string;
  description: string;
  target_user_id?: string;
  target_user_email?: string;
  ip_address?: string;
  device_info?: string;
  created_at: string;
  metadata?: {
    old_value?: string;
    new_value?: string;
    reason?: string;
    location?: string;
    browser?: string;
    [key: string]: any;
  };
}

export interface AdminActivityMetrics {
  totalAdminLogins: number;
  totalAdminActions: number;
  userBans: number;
  userDeletes: number;
  roleChanges: number;
  settingsChanges: number;
  activeAdmins: number;
  lastAdminLogin?: string;
}

export interface AdminActionStats {
  type: AdminActionType;
  count: number;
  lastAction?: string;
}

export interface AdminAuditHistory {
  admin_id: string;
  admin_name?: string;
  actionCount: number;
  lastAction: string;
  actions: AdminActivity[];
}

export interface AdminActivityFilterOptions {
  startDate?: string;
  endDate?: string;
  actionType?: AdminActionType | '';
  adminId?: string;
  targetUserId?: string;
}

// Map action types to security_events categories and actions
const ACTION_TYPE_MAPPING: Record<AdminActionType, { category: string; action: string }> = {
  ADMIN_LOGIN: { category: 'AUTH', action: 'ADMIN_LOGIN' },
  USER_BAN: { category: 'AUTH', action: 'USER_BAN' },
  USER_DELETE: { category: 'AUTH', action: 'USER_DELETE' },
  ROLE_CHANGE: { category: 'AUTH', action: 'ROLE_CHANGE' },
  SETTINGS_CHANGE: { category: 'AUTH', action: 'SETTINGS_CHANGE' },
};

export async function fetchAdminActivities(
  filters: AdminActivityFilterOptions,
  limit: number = 100,
  offset: number = 0
): Promise<{ activities: AdminActivity[]; total: number; error: string | null }> {
  try {
    const { start, end } = formatDateRange(filters.startDate, filters.endDate);

    let query = supabase
      .from('security_events')
      .select('*', { count: 'exact' })
      .eq('category', 'AUTH')
      .gte('created_at', start)
      .lte('created_at', end);

    // Filter by action type
    const actionTypes = Object.keys(ACTION_TYPE_MAPPING) as AdminActionType[];
    const relevantActions = actionTypes
      .filter((type) => !filters.actionType || type === filters.actionType)
      .map((type) => ACTION_TYPE_MAPPING[type].action);

    if (relevantActions.length > 0) {
      query = query.in('action', relevantActions);
    }

    // Filter by admin ID
    if (filters.adminId) {
      query = query.eq('user_id', filters.adminId);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Transform to AdminActivity format
    const activities: AdminActivity[] = (data || []).map((event: any) => ({
      id: event.id,
      admin_id: event.user_id,
      admin_name: event.metadata?.admin_name,
      action_type: getActionType(event.action),
      title: getActionTitle(event.action),
      description: event.event_message,
      target_user_id: event.metadata?.target_user_id,
      target_user_email: event.metadata?.target_user_email,
      ip_address: event.metadata?.ip_address,
      device_info: event.metadata?.device_info,
      created_at: event.created_at,
      metadata: event.metadata,
    }));

    return { activities, total: count || 0, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch admin activities';
    return { activities: [], total: 0, error: errorMessage };
  }
}

export async function fetchAdminActivityMetrics(
  startDate?: string,
  endDate?: string
): Promise<{ metrics: AdminActivityMetrics; error: string | null }> {
  try {
    const { start, end } = formatDateRange(startDate, endDate);

    const { data, error } = await supabase
      .from('security_events')
      .select('user_id, action, created_at')
      .eq('category', 'AUTH')
      .in(
        'action',
        Object.values(ACTION_TYPE_MAPPING).map((m) => m.action)
      )
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) throw error;

    const metrics: AdminActivityMetrics = {
      totalAdminLogins: 0,
      totalAdminActions: 0,
      userBans: 0,
      userDeletes: 0,
      roleChanges: 0,
      settingsChanges: 0,
      activeAdmins: 0,
    };

    const adminSet = new Set<string>();
    const loginDates: string[] = [];

    (data || []).forEach((event: any) => {
      metrics.totalAdminActions += 1;
      adminSet.add(event.user_id);

      if (event.action === 'ADMIN_LOGIN') {
        metrics.totalAdminLogins += 1;
        loginDates.push(event.created_at);
      } else if (event.action === 'USER_BAN') {
        metrics.userBans += 1;
      } else if (event.action === 'USER_DELETE') {
        metrics.userDeletes += 1;
      } else if (event.action === 'ROLE_CHANGE') {
        metrics.roleChanges += 1;
      } else if (event.action === 'SETTINGS_CHANGE') {
        metrics.settingsChanges += 1;
      }
    });

    metrics.activeAdmins = adminSet.size;
    if (loginDates.length > 0) {
      metrics.lastAdminLogin = loginDates[0];
    }

    return { metrics, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch admin activity metrics';
    return {
      metrics: {
        totalAdminLogins: 0,
        totalAdminActions: 0,
        userBans: 0,
        userDeletes: 0,
        roleChanges: 0,
        settingsChanges: 0,
        activeAdmins: 0,
      },
      error: errorMessage,
    };
  }
}

export async function fetchAdminActionStats(
  startDate?: string,
  endDate?: string
): Promise<{ stats: AdminActionStats[]; error: string | null }> {
  try {
    const { start, end } = formatDateRange(startDate, endDate);

    const { data, error } = await supabase
      .from('security_events')
      .select('action, created_at')
      .eq('category', 'AUTH')
      .in(
        'action',
        Object.values(ACTION_TYPE_MAPPING).map((m) => m.action)
      )
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) throw error;

    const statsMap = new Map<AdminActionType, AdminActionStats>();

    const actionTypes: AdminActionType[] = [
      'ADMIN_LOGIN',
      'USER_BAN',
      'USER_DELETE',
      'ROLE_CHANGE',
      'SETTINGS_CHANGE',
    ];

    actionTypes.forEach((type) => {
      statsMap.set(type, {
        type,
        count: 0,
      });
    });

    const latestActions = new Map<AdminActionType, string>();

    (data || []).forEach((event: any) => {
      const actionType = getActionType(event.action);
      if (statsMap.has(actionType)) {
        const stat = statsMap.get(actionType)!;
        stat.count += 1;
        if (!latestActions.has(actionType)) {
          latestActions.set(actionType, event.created_at);
        }
      }
    });

    const stats = Array.from(statsMap.values()).map((stat) => ({
      ...stat,
      lastAction: latestActions.get(stat.type),
    }));

    return { stats, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch admin action stats';
    return { stats: [], error: errorMessage };
  }
}

export async function fetchAdminAuditHistory(
  adminId?: string,
  startDate?: string,
  endDate?: string,
  limit: number = 50
): Promise<{ history: AdminAuditHistory[]; error: string | null }> {
  try {
    const { start, end } = formatDateRange(startDate, endDate);

    let query = supabase
      .from('security_events')
      .select('user_id, metadata, action, event_message, created_at')
      .eq('category', 'AUTH')
      .in(
        'action',
        Object.values(ACTION_TYPE_MAPPING).map((m) => m.action)
      )
      .gte('created_at', start)
      .lte('created_at', end);

    if (adminId) {
      query = query.eq('user_id', adminId);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

    if (error) throw error;

    const historyMap = new Map<string, AdminAuditHistory>();

    (data || []).forEach((event: any) => {
      const adminId = event.user_id;
      if (!historyMap.has(adminId)) {
        historyMap.set(adminId, {
          admin_id: adminId,
          admin_name: event.metadata?.admin_name,
          actionCount: 0,
          lastAction: event.created_at,
          actions: [],
        });
      }

      const history = historyMap.get(adminId)!;
      history.actionCount += 1;

      history.actions.push({
        id: event.id || `${adminId}-${event.created_at}`,
        admin_id: adminId,
        admin_name: event.metadata?.admin_name,
        action_type: getActionType(event.action),
        title: getActionTitle(event.action),
        description: event.event_message,
        target_user_id: event.metadata?.target_user_id,
        target_user_email: event.metadata?.target_user_email,
        ip_address: event.metadata?.ip_address,
        device_info: event.metadata?.device_info,
        created_at: event.created_at,
        metadata: event.metadata,
      });
    });

    const history = Array.from(historyMap.values());
    return { history, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch admin audit history';
    return { history: [], error: errorMessage };
  }
}

export async function fetchAdminActivityTrends(
  days: number = 7,
  startDate?: string,
  endDate?: string
): Promise<{
  trends: Array<{ date: string; logins: number; bans: number; deletes: number; roleChanges: number; settingsChanges: number }>;
  error: string | null;
}> {
  try {
    let start = new Date();
    let end = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      start.setDate(start.getDate() - days);
    }

    const { data, error } = await supabase
      .from('security_events')
      .select('action, created_at')
      .eq('category', 'AUTH')
      .in(
        'action',
        Object.values(ACTION_TYPE_MAPPING).map((m) => m.action)
      )
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (error) throw error;

    const dateMap = new Map<
      string,
      { logins: number; bans: number; deletes: number; roleChanges: number; settingsChanges: number }
    >();

    (data || []).forEach((event: any) => {
      const date = new Date(event.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      if (!dateMap.has(date)) {
        dateMap.set(date, {
          logins: 0,
          bans: 0,
          deletes: 0,
          roleChanges: 0,
          settingsChanges: 0,
        });
      }

      const dayData = dateMap.get(date)!;
      if (event.action === 'ADMIN_LOGIN') {
        dayData.logins += 1;
      } else if (event.action === 'USER_BAN') {
        dayData.bans += 1;
      } else if (event.action === 'USER_DELETE') {
        dayData.deletes += 1;
      } else if (event.action === 'ROLE_CHANGE') {
        dayData.roleChanges += 1;
      } else if (event.action === 'SETTINGS_CHANGE') {
        dayData.settingsChanges += 1;
      }
    });

    const trends = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { trends, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch admin activity trends';
    return { trends: [], error: errorMessage };
  }
}

// Helper functions
function getActionType(action: string): AdminActionType {
  const mapping: Record<string, AdminActionType> = {
    ADMIN_LOGIN: 'ADMIN_LOGIN',
    USER_BAN: 'USER_BAN',
    USER_DELETE: 'USER_DELETE',
    ROLE_CHANGE: 'ROLE_CHANGE',
    SETTINGS_CHANGE: 'SETTINGS_CHANGE',
  };
  return mapping[action] || 'ADMIN_LOGIN';
}

function getActionTitle(action: string): string {
  const mapping: Record<string, string> = {
    ADMIN_LOGIN: 'Admin Login',
    USER_BAN: 'User Banned',
    USER_DELETE: 'User Deleted',
    ROLE_CHANGE: 'Role Changed',
    SETTINGS_CHANGE: 'Settings Changed',
  };
  return mapping[action] || 'Admin Action';
}
