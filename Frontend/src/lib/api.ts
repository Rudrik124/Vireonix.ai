const apiBaseUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");

export const buildApiUrl = (path: string) => {
  if (!apiBaseUrl) {
    // No base URL set — use relative paths for same-domain deployments or local dev without env vars
    return path;
  }

  const normalizedPath = String(path || "");
  return `${apiBaseUrl}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
};

/**
 * Format date range for Supabase queries
 * Returns ISO strings for the given date range, or defaults to last 7 days
 */
export function formatDateRange(
  startDate?: string,
  endDate?: string
): { start: string; end: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const start = startDate ? new Date(startDate).toISOString() : sevenDaysAgo.toISOString();
  const end = endDate ? new Date(endDate).toISOString() : now.toISOString();

  return { start, end };
}
