import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../app/context/auth-context";

interface SecurityPortalGateProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function SecurityPortalGate({
  children,
  requiredRoles = ["SECURITY_ADMIN", "SECURITY_ANALYST", "SECURITY_VIEWER", "admin", "ADMIN", "super_admin"],
}: SecurityPortalGateProps) {
  const { profile, isLoading } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  // Check if user has required role
  const hasAccess = profile && requiredRoles.includes(profile.role);

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
