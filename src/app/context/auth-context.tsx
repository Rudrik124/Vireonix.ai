import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultSession = {
  user: {
    email: "guest@vireonix.ai",
    user_metadata: {
      full_name: "Guest",
    },
  },
} as unknown as Session;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const logout = async () => {
    return;
  };

  return (
    <AuthContext.Provider value={{ session: defaultSession, isLoading, isLoggedIn: true, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a default context instead of throwing
    // This handles cases where the hook is called outside of AuthProvider
    return {
      session: null,
      isLoading: false,
      isLoggedIn: true,
      logout: async () => {},
    } as AuthContextType;
  }
  return context;
}
