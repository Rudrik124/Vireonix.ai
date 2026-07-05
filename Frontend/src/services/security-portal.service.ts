import { supabase } from "@/lib/supabase";

export type SecurityPortalEventType =
  | "SECURITY_PORTAL_LOGIN"
  | "SECURITY_PORTAL_ACCESS"
  | "SECURITY_PORTAL_ACTION"
  | "SETTINGS_UPDATE"
  | "ROLE_ASSIGNMENT";

export interface SecurityPortalActivityLog {
  id: string;
  user_id: string;
  user_email?: string;
  event_type: SecurityPortalEventType;
  module: string;
  action: string;
  details?: Record<string, any>;
  ip_address?: string;
  device_info?: string;
  timestamp?: string;
  created_at: string;
}

export interface SecurityThresholds {
  failedLoginThreshold: number;
  blockedRequestThreshold: number;
  securityEventThreshold: number;
  criticalAlertThreshold: number;
  autoLockoutAttempts: number;
  autoLockoutDuration: number;
}

export interface SecurityRole {
  id: string;
  name: "SECURITY_VIEWER" | "SECURITY_ANALYST" | "SECURITY_ADMIN" | "ADMIN";
  permissions: string[];
  description: string;
  created_at: string;
}

/**
 * Log security portal activity
 */
export async function logSecurityPortalActivity(
  event: Omit<SecurityPortalActivityLog, "id" | "created_at">
): Promise<SecurityPortalActivityLog> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .insert([
        {
          user_id: event.user_id,
          user_email: event.user_email,
          event_type: event.event_type,
          severity: "INFO",
          description: `${event.event_type}: ${event.action}`,
          action: event.action,
          metadata: {
            module: event.module,
            ip_address: event.ip_address,
            device_info: event.device_info,
            details: event.details,
          },
          ip_address: event.ip_address,
          device_info: event.device_info,
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn("Security portal activity logging skipped:", error.message || error);
      return {
        id: `local-${Date.now()}`,
        user_id: event.user_id,
        user_email: event.user_email,
        event_type: event.event_type,
        module: event.module,
        action: event.action,
        details: event.details,
        ip_address: event.ip_address,
        device_info: event.device_info,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
    }

    return {
      id: data.id,
      user_id: event.user_id,
      user_email: event.user_email,
      event_type: event.event_type,
      module: event.module,
      action: event.action,
      details: event.details,
      ip_address: event.ip_address,
      device_info: event.device_info,
      timestamp: data.created_at,
      created_at: data.created_at,
    };
  } catch (error) {
    console.warn("Security portal activity logging skipped:", error);
    return {
      id: `local-${Date.now()}`,
      user_id: event.user_id,
      user_email: event.user_email,
      event_type: event.event_type,
      module: event.module,
      action: event.action,
      details: event.details,
      ip_address: event.ip_address,
      device_info: event.device_info,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
  }
}

/**
 * Get security portal activity logs
 */
export async function fetchSecurityPortalActivityLogs(
  filters?: {
    startDate?: string;
    endDate?: string;
    eventType?: SecurityPortalEventType;
    userId?: string;
    module?: string;
  }
): Promise<SecurityPortalActivityLog[]> {
  try {
    let query = supabase
      .from("audit_logs")
      .select("*");

    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate);
    }
    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return (data || []).map((event: any) => {
      const metadata = typeof event.metadata === "string" ? JSON.parse(event.metadata) : event.metadata;
      return {
        id: event.id,
        user_id: event.user_id,
        user_email: event.user_email,
        event_type: event.event_type as SecurityPortalEventType,
        module: metadata?.module,
        action: event.action,
        details: metadata?.details,
        ip_address: event.ip_address,
        device_info: event.device_info,
        timestamp: event.created_at,
        created_at: event.created_at,
      };
    });
  } catch (error) {
    console.warn("Security portal activity logs unavailable:", error);
    return [];
  }
}

/**
 * Get security thresholds (from app settings or defaults)
 */
export async function getSecurityThresholds(): Promise<SecurityThresholds> {
  // In production, fetch from app_settings table
  // For now, return defaults
  return {
    failedLoginThreshold: 5,
    blockedRequestThreshold: 10,
    securityEventThreshold: 20,
    criticalAlertThreshold: 1,
    autoLockoutAttempts: 5,
    autoLockoutDuration: 30, // minutes
  };
}

/**
 * Update security thresholds
 */
export async function updateSecurityThresholds(
  thresholds: Partial<SecurityThresholds>
): Promise<SecurityThresholds> {
  try {
    // In production, update app_settings table
    // For now, just return updated values
    const current = await getSecurityThresholds();
    const updated = { ...current, ...thresholds };

    // Log the update
    await logSecurityPortalActivity({
      user_id: "system",
      event_type: "SETTINGS_UPDATE",
      module: "Settings",
      action: "Security Thresholds Updated",
      details: { previousValues: current, newValues: updated },
    });

    return updated;
  } catch (error) {
    console.error("Error updating security thresholds:", error);
    throw new Error("Failed to update security thresholds");
  }
}

/**
 * Get security roles
 */
export async function getSecurityRoles(): Promise<SecurityRole[]> {
  // Return predefined security roles
  return [
    {
      id: "security_viewer",
      name: "SECURITY_VIEWER",
      permissions: [
        "view_security_overview",
        "view_audit_logs",
        "view_threat_visualization",
        "view_user_risk_scores",
      ],
      description: "Can view security dashboards and reports",
      created_at: new Date().toISOString(),
    },
    {
      id: "security_analyst",
      name: "SECURITY_ANALYST",
      permissions: [
        "view_security_overview",
        "view_audit_logs",
        "view_threat_visualization",
        "view_user_risk_scores",
        "manage_security_alerts",
        "acknowledge_alerts",
      ],
      description: "Can view and manage security alerts",
      created_at: new Date().toISOString(),
    },
    {
      id: "security_admin",
      name: "SECURITY_ADMIN",
      permissions: [
        "view_security_overview",
        "view_audit_logs",
        "view_threat_visualization",
        "view_user_risk_scores",
        "manage_security_alerts",
        "acknowledge_alerts",
        "update_security_thresholds",
        "manage_security_roles",
        "export_security_reports",
      ],
      description: "Full security portal access and configuration",
      created_at: new Date().toISOString(),
    },
  ];
}

/**
 * Subscribe to security portal activity
 */
export function subscribeToSecurityPortalActivity(
  callback: (event: SecurityPortalActivityLog) => void
): () => void {
  const subscription = supabase
    .channel("security_events:changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "security_events",
        filter: "category=eq.SECURITY_PORTAL",
      },
      (payload: any) => {
        const event = payload.new as any;
        const metadata = typeof event.metadata === "string" ? JSON.parse(event.metadata) : event.metadata;

        callback({
          id: event.id,
          user_id: metadata.user_id,
          user_email: metadata.user_email,
          event_type: event.event_type,
          module: metadata.module,
          action: event.action,
          details: metadata.details,
          ip_address: metadata.ip_address,
          device_info: metadata.device_info,
          timestamp: event.created_at,
          created_at: event.created_at,
        });
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
