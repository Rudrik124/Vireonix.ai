import { supabase } from "@/lib/supabase";

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ErrorLogEntry {
  module: string;
  route: string;
  errorMessage: string;
  stackTrace?: string;
  severity: ErrorSeverity;
  userId?: string;
  additionalContext?: Record<string, any>;
}

/**
 * Detect browser and device information
 */
function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Mobile')) return 'Mobile';
  if (ua.includes('Tablet')) return 'Tablet';
  if (ua.includes('iPad')) return 'iPad';
  return 'Desktop';
}

/**
 * Determine error severity based on error type
 */
export function determineErrorSeverity(error: any): ErrorSeverity {
  const message = error?.message || '';
  const isNetwork = message.includes('fetch') || message.includes('network');
  const isAuth = message.includes('auth') || message.includes('unauthorized');
  const isDatabase = message.includes('database') || message.includes('query');
  const isPayment = message.includes('payment') || message.includes('billing');

  if (isPayment || isDatabase) return 'critical';
  if (isAuth || isNetwork) return 'high';
  return 'medium';
}

/**
 * Log an error to the error_logs table
 * Gracefully handles missing user profiles by retrying without user_id if FK constraint fails
 */
export async function logError(entry: ErrorLogEntry): Promise<void> {
  if (!supabase) {
    console.error('[ErrorLogger] Supabase not configured');
    return;
  }

  try {
    const browser = getBrowserInfo();
    const device = getDeviceInfo();
    const currentRoute = window.location.pathname;

    const logEntry = {
      module: entry.module,
      route: entry.route || currentRoute,
      user_id: entry.userId || null, // Allow null
      error_message: entry.errorMessage,
      stack_trace: entry.stackTrace,
      severity: entry.severity,
      browser,
      device,
      status: 'open',
      additional_context: entry.additionalContext || {},
      timestamp: new Date().toISOString(),
    };

    let { error } = await supabase.from('error_logs').insert([logEntry]);

    // If FK constraint fails (profile doesn't exist), retry without user_id
    if (error && error.code === '23503') {
      console.warn('[ErrorLogger] User profile not found, logging without user_id');
      logEntry.user_id = null;
      const retry = await supabase.from('error_logs').insert([logEntry]);
      if (retry.error) {
        console.error('[ErrorLogger] Failed to log error after retry:', retry.error);
      }
    } else if (error) {
      console.error('[ErrorLogger] Failed to log error:', error);
    }
  } catch (err) {
    console.error('[ErrorLogger] Exception while logging error:', err);
  }
}

/**
 * Wrapper to catch and log errors in async functions
 */
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  module: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      const severity = determineErrorSeverity(error);
      await logError({
        module,
        route: window.location.pathname,
        errorMessage: error?.message || String(error),
        stackTrace: error?.stack,
        severity,
        additionalContext: {
          functionName: fn.name,
          args: args.map((arg) => String(arg).substring(0, 100)), // Truncate for safety
        },
      });
      throw error; // Re-throw to maintain error handling upstream
    }
  }) as T;
}

/**
 * Setup global error handlers
 */
export function setupGlobalErrorHandlers(userId?: string): void {
  // Handle uncaught errors
  window.addEventListener('error', async (event: ErrorEvent) => {
    const severity = determineErrorSeverity(event.error);
    await logError({
      module: 'global_error_handler',
      route: window.location.pathname,
      errorMessage: event.message,
      stackTrace: event.error?.stack,
      severity,
      userId,
      additionalContext: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', async (event: PromiseRejectionEvent) => {
    const severity = determineErrorSeverity(event.reason);
    await logError({
      module: 'unhandled_promise_rejection',
      route: window.location.pathname,
      errorMessage: event.reason?.message || String(event.reason),
      stackTrace: event.reason?.stack,
      severity,
      userId,
      additionalContext: {
        reason: String(event.reason).substring(0, 500),
      },
    });
  });
}

/**
 * Log API errors
 */
export async function logApiError(
  endpoint: string,
  method: string,
  statusCode: number,
  errorMessage: string,
  userId?: string
): Promise<void> {
  const severity = statusCode >= 500 ? 'critical' : statusCode >= 400 ? 'high' : 'medium';

  await logError({
    module: 'api_request',
    route: endpoint,
    errorMessage: `${method} ${endpoint} - ${statusCode}: ${errorMessage}`,
    severity,
    userId,
    additionalContext: {
      statusCode,
      method,
      endpoint,
    },
  });
}

/**
 * Log upload errors
 */
export async function logUploadError(
  fileName: string,
  errorMessage: string,
  userId?: string
): Promise<void> {
  await logError({
    module: 'file_upload',
    route: window.location.pathname,
    errorMessage: `Upload failed for ${fileName}: ${errorMessage}`,
    severity: 'high',
    userId,
    additionalContext: {
      fileName,
    },
  });
}

/**
 * Log authentication errors
 */
export async function logAuthError(
  errorMessage: string,
  userId?: string
): Promise<void> {
  await logError({
    module: 'authentication',
    route: window.location.pathname,
    errorMessage,
    severity: 'high',
    userId,
  });
}

/**
 * Log database/query errors
 */
export async function logDatabaseError(
  operation: string,
  table: string,
  errorMessage: string,
  userId?: string
): Promise<void> {
  await logError({
    module: 'database',
    route: window.location.pathname,
    errorMessage: `Database ${operation} on ${table}: ${errorMessage}`,
    severity: 'critical',
    userId,
    additionalContext: {
      operation,
      table,
    },
  });
}

/**
 * Log payment errors
 */
export async function logPaymentError(
  errorMessage: string,
  userId?: string
): Promise<void> {
  await logError({
    module: 'payment',
    route: window.location.pathname,
    errorMessage,
    severity: 'critical',
    userId,
  });
}
