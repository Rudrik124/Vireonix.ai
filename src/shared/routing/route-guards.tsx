import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { canAccessPortal } from "../auth/permissions";
import type { AppRole, PortalId } from "../types/auth";
import { useAuth } from "../../app/context/auth-context";

function FullScreenState({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-screen bg-[#07111f] text-white flex items-center justify-center px-6">
      <div className="max-w-xl rounded-3xl border border-cyan-500/20 bg-white/5 p-10 backdrop-blur-xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">{title}</p>
        <p className="mt-4 text-base text-slate-300">{body}</p>
      </div>
    </div>
  );
}

interface PortalGateProps {
  portal: PortalId;
  allowedRoles?: AppRole[];
  children: ReactNode;
}

export function PortalGate({ portal, allowedRoles, children }: PortalGateProps) {
  const location = useLocation();
  const { isLoading, isLoggedIn, profile, hasRole } = useAuth();

  if (isLoading) {
    return <FullScreenState title="Loading Access" body="Checking your portal session and permissions." />;
  }

  if (!isLoggedIn) {
    const loginRoutes: Record<PortalId, string> = {
      developer: "/developer/auth",
      admin: "/admin/auth",
      tester: "/tester/auth",
      user: "/user/auth",
    };
    const loginRoute = loginRoutes[portal] || "/user/auth";
    return <Navigate to={loginRoute} replace state={{ from: location.pathname }} />;
  }

  if (!canAccessPortal(profile, portal)) {
    return (
      <FullScreenState
        title="Access Denied"
        body={`Your account does not have access to the ${portal} portal.`}
      />
    );
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <FullScreenState title="Permission Required" body="Your account is signed in, but this screen requires a higher role." />;
  }

  return <>{children}</>;
}
