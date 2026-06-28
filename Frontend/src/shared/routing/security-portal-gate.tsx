import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../app/context/auth-context";
import { getRoleRedirectUrl } from "../../lib/role-redirect";

interface SecurityPortalGateProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function SecurityPortalGate({
  children,
  requiredRoles = ["SECURITY_ADMIN", "SECURITY_ANALYST", "SECURITY_VIEWER", "admin", "ADMIN", "super_admin", "security", "SECURITY"],
}: SecurityPortalGateProps) {
  const location = useLocation();
  const { profile, isLoading, isLoggedIn } = useAuth();

  // Disable back and forward buttons inside privileged portals
  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      const handlePopState = (event: PopStateEvent) => {
        // If they click back/forward, forcefully push them forward again to trap them
        window.history.go(1);
      };
      
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [isLoggedIn, isLoading]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-slate-950">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  // Check if user has required role
  const role = (profile?.role || '').toLowerCase();
  const hasAccess = profile && (
    requiredRoles.map(r => r.toLowerCase()).includes(role) || 
    (profile.portalAccess && profile.portalAccess.map((a: string) => a.toLowerCase()).includes('security'))
  );

  if (!hasAccess) {
    // If they landed in the wrong portal, bounce them to their correct portal
    const correctPortalUrl = getRoleRedirectUrl(profile?.email, profile, null);
    if (correctPortalUrl && correctPortalUrl !== location.pathname) {
      return <Navigate to={correctPortalUrl} replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
