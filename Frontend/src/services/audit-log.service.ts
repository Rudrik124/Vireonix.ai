import { supabase } from "@/lib/supabase";

export type AuditEventType = "LOGIN" | "LOGOUT" | "UPLOAD" | "PROMPT_SUBMISSION" | "VIDEO_GENERATION" | "ADMIN_ACTION";
export type AuditSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface AuditLogEvent {
  id: string;
  user_id: string;
  user_email?: string;
  event_type: AuditEventType;
  severity: AuditSeverity;
  description: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  device_info?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  created_at: string;
}

export interface AuditLogMetrics {
  totalEvents: number;
  loginCount: number;
  logoutCount: number;
  uploadCount: number;
  promptSubmissionCount: number;
  videoGenerationCount: number;
  adminActionCount: number;
  criticalEventsCount: number;
  warningEventsCount: number;
  uniqueUsersCount: number;
}

export interface AuditLogStats {
  type: AuditEventType;
  count: number;
  percentage: number;
  severity: AuditSeverity;
  lastEvent?: string;
}

export interface AuditLogFilterOptions {
  startDate?: string;
  endDate?: string;
  eventType?: AuditEventType;
  userId?: string;
  severity?: AuditSeverity;
  searchQuery?: string;
  resourceType?: string;
}

export interface AuditLogTrendData {
  date: string;
  login: number;
  logout: number;
  upload: number;
  promptSubmission: number;
  videoGeneration: number;
  adminAction: number;
}

/**
 * Fetch paginated audit log events with filters
 */
export async function fetchAuditLogs(
  filters: AuditLogFilterOptions,
  page: number = 1,
  pageSize: number = 25
) {
  let query = supabase.from("audit_logs").select("*", { count: "exact" });

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate);
  }
  if (filters.eventType) {
    query = query.eq("event_type", filters.eventType);
  }
  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }
  if (filters.severity) {
    query = query.eq("severity", filters.severity);
  }
  if (filters.resourceType) {
    query = query.eq("resource_type", filters.resourceType);
  }

  if (filters.searchQuery) {
    query = query.or(
      `description.ilike.%${filters.searchQuery}%,action.ilike.%${filters.searchQuery}%,user_email.ilike.%${filters.searchQuery}%`
    );
  }

  const offset = (page - 1) * pageSize;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error("Error fetching audit logs:", error);
    throw new Error("Failed to fetch audit logs");
  }

  return {
    logs: (data || []) as AuditLogEvent[],
    total: count || 0,
    pageSize,
  };
}

/**
 * Fetch overall audit log metrics
 */
export async function fetchAuditLogMetrics(): Promise<AuditLogMetrics> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("event_type, severity, user_id", { count: "exact" });

    if (error) throw error;

    const logs = data || [];
    const uniqueUsers = new Set(logs.map((log: any) => log.user_id));

    return {
      totalEvents: logs.length,
      loginCount: logs.filter((l: any) => l.event_type === "LOGIN").length,
      logoutCount: logs.filter((l: any) => l.event_type === "LOGOUT").length,
      uploadCount: logs.filter((l: any) => l.event_type === "UPLOAD").length,
      promptSubmissionCount: logs.filter((l: any) => l.event_type === "PROMPT_SUBMISSION").length,
      videoGenerationCount: logs.filter((l: any) => l.event_type === "VIDEO_GENERATION").length,
      adminActionCount: logs.filter((l: any) => l.event_type === "ADMIN_ACTION").length,
      criticalEventsCount: logs.filter((l: any) => l.severity === "CRITICAL").length,
      warningEventsCount: logs.filter((l: any) => l.severity === "WARNING").length,
      uniqueUsersCount: uniqueUsers.size,
    };
  } catch (error) {
    console.error("Error fetching audit metrics:", error);
    throw new Error("Failed to fetch audit metrics");
  }
}

/**
 * Fetch event type statistics
 */
export async function fetchAuditLogStats(): Promise<AuditLogStats[]> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("event_type, severity, created_at", { count: "exact" });

    if (error) throw error;

    const logs = data || [];
    const stats: Record<string, { count: number; severity: AuditSeverity; lastEvent?: string }> = {
      LOGIN: { count: 0, severity: "INFO" },
      LOGOUT: { count: 0, severity: "INFO" },
      UPLOAD: { count: 0, severity: "INFO" },
      PROMPT_SUBMISSION: { count: 0, severity: "INFO" },
      VIDEO_GENERATION: { count: 0, severity: "INFO" },
      ADMIN_ACTION: { count: 0, severity: "WARNING" },
    };

    logs.forEach((log: any) => {
      if (stats[log.event_type]) {
        stats[log.event_type].count++;
        stats[log.event_type].severity = log.severity || "INFO";
        if (!stats[log.event_type].lastEvent || new Date(log.created_at) > new Date(stats[log.event_type].lastEvent!)) {
          stats[log.event_type].lastEvent = log.created_at;
        }
      }
    });

    const totalEvents = logs.length;
    return Object.entries(stats).map(([type, stat]) => ({
      type: type as AuditEventType,
      count: stat.count,
      percentage: totalEvents > 0 ? Math.round((stat.count / totalEvents) * 100) : 0,
      severity: stat.severity,
      lastEvent: stat.lastEvent,
    }));
  } catch (error) {
    console.error("Error fetching audit stats:", error);
    throw new Error("Failed to fetch audit stats");
  }
}

/**
 * Fetch audit log trends for the last 7 days
 */
export async function fetchAuditLogTrends(): Promise<AuditLogTrendData[]> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("audit_logs")
      .select("event_type, created_at")
      .gte("created_at", `${startDate}T00:00:00`);

    if (error) throw error;

    const logs = data || [];
    const trendsMap: Record<string, AuditLogTrendData> = {};

    // Initialize 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      trendsMap[dateStr] = {
        date: dateStr,
        login: 0,
        logout: 0,
        upload: 0,
        promptSubmission: 0,
        videoGeneration: 0,
        adminAction: 0,
      };
    }

    // Populate data
    logs.forEach((log: any) => {
      const dateStr = new Date(log.created_at).toISOString().split("T")[0];
      if (trendsMap[dateStr]) {
        const eventKey = log.event_type.toLowerCase().replace(/_/g, "");
        const keyMap: Record<string, keyof AuditLogTrendData> = {
          login: "login",
          logout: "logout",
          upload: "upload",
          promptsubmission: "promptSubmission",
          videogeneration: "videoGeneration",
          adminaction: "adminAction",
        };
        const trendKey = keyMap[eventKey] || "login";
        trendsMap[dateStr][trendKey]++;
      }
    });

    return Object.values(trendsMap);
  } catch (error) {
    console.error("Error fetching audit trends:", error);
    throw new Error("Failed to fetch audit trends");
  }
}

/**
 * Generate CSV export of audit logs
 */
export async function exportAuditLogsToCSV(
  filters: AuditLogFilterOptions
): Promise<string> {
  try {
    let query = supabase.from("audit_logs").select("*");

    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate);
    }
    if (filters.eventType) {
      query = query.eq("event_type", filters.eventType);
    }
    if (filters.userId) {
      query = query.eq("user_id", filters.userId);
    }
    if (filters.severity) {
      query = query.eq("severity", filters.severity);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    const logs = data || [];
    if (logs.length === 0) {
      return "No audit logs found for the selected filters";
    }

    // CSV headers
    const headers = [
      "Timestamp",
      "User Email",
      "Event Type",
      "Severity",
      "Action",
      "Description",
      "Resource Type",
      "Resource ID",
      "IP Address",
      "Device Info",
    ];

    // CSV rows
    const rows = logs.map((log: AuditLogEvent) => [
      new Date(log.created_at).toLocaleString(),
      log.user_email || "",
      log.event_type,
      log.severity,
      log.action,
      log.description,
      log.resource_type || "",
      log.resource_id || "",
      log.ip_address || "",
      log.device_info || "",
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((row: any) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return csvContent;
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    throw new Error("Failed to export audit logs to CSV");
  }
}

/**
 * Generate PDF export of audit logs (returns base64 or blob)
 * Note: Requires pdfkit or similar library for actual PDF generation
 */
export async function exportAuditLogsToPDF(
  filters: AuditLogFilterOptions
): Promise<string> {
  try {
    let query = supabase.from("audit_logs").select("*");

    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate);
    }
    if (filters.eventType) {
      query = query.eq("event_type", filters.eventType);
    }
    if (filters.userId) {
      query = query.eq("user_id", filters.userId);
    }
    if (filters.severity) {
      query = query.eq("severity", filters.severity);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    // Return HTML content that can be converted to PDF via print/download
    const logs = data || [];
    const htmlContent = generatePDFHTML(logs);
    return htmlContent;
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    throw new Error("Failed to export audit logs to PDF");
  }
}

/**
 * Generate HTML content for PDF export
 */
function generatePDFHTML(logs: AuditLogEvent[]): string {
  const timestamp = new Date().toLocaleString();
  const eventRows = logs
    .map(
      (log) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(log.created_at).toLocaleString()}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${log.user_email || "-"}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${log.event_type}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${log.severity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${log.description}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Audit Log Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    h1 { color: #0f172a; }
    .info { margin: 20px 0; color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background-color: #0f172a; color: white; padding: 12px; text-align: left; font-weight: bold; }
    td { padding: 8px; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) { background-color: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Audit Log Report</h1>
  <div class="info">
    <p><strong>Generated:</strong> ${timestamp}</p>
    <p><strong>Total Events:</strong> ${logs.length}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>User Email</th>
        <th>Event Type</th>
        <th>Severity</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      ${eventRows}
    </tbody>
  </table>
</body>
</html>
  `;
}

/**
 * Subscribe to real-time audit log updates
 */
export function subscribeToAuditLogs(
  callback: (event: AuditLogEvent) => void
): () => void {
  const subscription = supabase
    .channel("audit_logs:changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "audit_logs",
      },
      (payload: any) => {
        callback(payload.new as AuditLogEvent);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Log a new audit event
 */
export async function logAuditEvent(event: Omit<AuditLogEvent, "id" | "created_at">) {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .insert([
        {
          ...event,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as AuditLogEvent;
  } catch (error) {
    console.error("Error logging audit event:", error);
    throw new Error("Failed to log audit event");
  }
}
