import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { AuthContextType, AppProfile } from "../../shared/types/auth";
import { fetchAppProfile } from "../../services/auth-profile";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthContextType["session"]>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const previousPathRef = useRef<string | null>(typeof window !== "undefined" ? window.location.pathname : null);

  const refreshProfile = async () => {
    if (!session) {
      setProfile(null);
      return null;
    }

    const nextProfile = await fetchAppProfile(session);
    setProfile(nextProfile);
    return nextProfile;
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      if (!supabase) {
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      const { data } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(data.session ?? null);

      if (data.session) {
        const nextProfile = await fetchAppProfile(data.session);
        if (mounted) {
          setProfile(nextProfile);
        }
      } else {
        setProfile(null);
      }

      if (mounted) {
        setIsLoading(false);
      }
    };

    bootstrap();

    const authListener = supabase?.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) {
        return;
      }

      setSession(nextSession);
      if (nextSession) {
        const nextProfile = await fetchAppProfile(nextSession);
        if (mounted) {
          setProfile(nextProfile);
        }
      } else {
        setProfile(null);
      }

      if (mounted) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener?.data.subscription.unsubscribe();
    };
  }, []);

  const clearStoredClientSession = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.removeItem("portalIntent");
    localStorage.removeItem("justLoggedIn");
    localStorage.removeItem("authRedirectUrl");

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  const logout = useCallback(async (redirectTo: string = "/") => {
    clearStoredClientSession();

    try {
      if (supabase) {
        await supabase.auth.signOut({ scope: "local" });
      }
    } catch (error) {
      console.warn("Logout encountered an error, but local session was cleared.", error);
    } finally {
      setSession(null);
      setProfile(null);
      setIsLoading(false);
      if (redirectTo) {
        window.location.assign(redirectTo);
      }
    }
  }, [clearStoredClientSession]);

  const getLoginRoute = useCallback((pathname: string) => {
    if (pathname.startsWith("/developer")) {
      return "/developer/auth";
    }

    if (pathname.startsWith("/admin")) {
      return "/admin/auth";
    }

    if (pathname.startsWith("/tester")) {
      return "/tester/auth";
    }

    return "/";
  }, []);

  const isProtectedPath = useCallback((pathname: string) => {
    return pathname === "/app" || pathname === "/user/dashboard" || pathname.startsWith("/developer") || pathname.startsWith("/admin") || pathname.startsWith("/tester") || pathname.startsWith("/user");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleHistoryNavigation = async () => {
      // On popstate, silently re-verify the session
      if (supabase) {
        await supabase.auth.getSession();
      }
    };

    const handlePageShow = async (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from BFCache, re-verify the session to prevent rendering stale authenticated UI
        if (supabase) {
          await supabase.auth.getSession();
        }
      }
    };

    window.addEventListener("popstate", handleHistoryNavigation);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("popstate", handleHistoryNavigation);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const isInternalUser = false; // Legacy roles removed
  const portalIntent = typeof window !== "undefined" ? localStorage.getItem("portalIntent") : null;
  const activePortal = (portalIntent === "developer" || portalIntent === "admin") ? "developer" : "user";

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        isLoading,
        isLoggedIn: Boolean(session),
        isInternalUser,
        activePortal,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
