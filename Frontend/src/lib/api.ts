const apiBaseUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");

export const buildApiUrl = (path: string) => {
  if (!apiBaseUrl) {
    // No base URL set — use relative paths for same-domain deployments or local dev without env vars
    return path;
  }

  const normalizedPath = String(path || "");
  return `${apiBaseUrl}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
};
