import { useMemo } from "react";
import { useLocation } from "react-router";
import { useAuth } from "../../app/context/auth-context";
import { buildUsageContext } from "../../services/usage.service";

export function buildPortalAwarePath(path: string, search = "") {
  return search ? `${path}${search}` : path;
}

export function usePortalTestingContext() {
  const location = useLocation();
  const { profile } = useAuth();

  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    const explicitPortal = params.get("portal");
    const explicitUsageType = params.get("usageType");
    const requestedTestMode =
      explicitPortal === "internal" ||
      explicitUsageType === "test" ||
      location.pathname.startsWith("/internal");

    const usageType = requestedTestMode ? "test" : "production";
    const portal = requestedTestMode ? "internal" : "user";

    return {
      isDeveloperTestMode: requestedTestMode,
      search: location.search,
      usageContext: buildUsageContext(profile, {
        usageType,
        portal,
      }),
    };
  }, [location.pathname, location.search, profile]);
}

