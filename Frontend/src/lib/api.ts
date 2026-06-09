const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");

export const buildApiUrl = (path: string) => {
  if (!apiBaseUrl) {
    // No base URL set — use relative paths (same-domain deployment, e.g. Render)
    return path;
  }

  // When a base URL is set, preserve the full path including /api prefix
  const normalizedPath = String(path || "");
  return `${apiBaseUrl}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
};
