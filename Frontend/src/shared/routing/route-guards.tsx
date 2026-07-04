import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import type { PortalId } from "../types/auth";
import { useAuth } from "../../app/context/auth-context";

function FullScreenState({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-[100dvh] bg-[#07111f] text-white flex items-center justify-center px-6">
      <div className="max-w-xl rounded-3xl border border-cyan-500/20 bg-white/5 p-10 backdrop-blur-xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">{title}</p>
        <p className="mt-4 text-base text-slate-300">{body}</p>
      </div>
    </div>
  );
}

interface PortalGateProps {
  portal: PortalId;
  children: ReactNode;
}

export function PortalGate({ portal, children }: PortalGateProps) {
  const location = useLocation();
  const { isLoading, isLoggedIn } = useAuth();

  // Disable back and forward buttons inside privileged portals
  useEffect(() => {
    if (isLoggedIn && !isLoading && portal !== "user") {
      const handlePopState = (event: PopStateEvent) => {
        // If they click back/forward, forcefully push them forward again to trap them
        window.history.go(1);
      };
      
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [isLoggedIn, isLoading, portal]);

  if (isLoading) {
    return <FullScreenState title="Loading Access" body="Checking your portal session and permissions." />;
  }

  if (!isLoggedIn) {
    const loginRoutes: Record<PortalId, string> = {
      developer: "/developer/auth",
      admin: "/admin/auth",
      tester: "/",
      user: "/",
      internal: "/developer/auth",
    };
    const loginRoute = loginRoutes[portal] || "/user/auth";
    return <Navigate to={loginRoute} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
