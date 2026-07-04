import React, { useEffect } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../app/context/auth-context";

interface SecurityPortalGateProps {
  children: React.ReactNode;
}

export function SecurityPortalGate({
  children,
}: SecurityPortalGateProps) {
  const { isLoading, isLoggedIn } = useAuth();

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

  return <>{children}</>;
}

