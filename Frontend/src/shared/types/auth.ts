import type { Session } from "@supabase/supabase-js";

export const PORTALS = ["developer", "admin", "tester", "user", "internal"] as const;
export const USAGE_TYPES = ["production", "test"] as const;
export const TESTING_CREDENTIAL_TYPES = ["tester_email", "tester_password"] as const;

export type PortalId = (typeof PORTALS)[number];
export type UsageType = (typeof USAGE_TYPES)[number];
export type TestingCredentialType = (typeof TESTING_CREDENTIAL_TYPES)[number];

export interface AppProfile {
  id: string;
  email: string;
  fullName: string;
  name?: string;
  timezone?: string;
  role?: string;
  phone?: string;
  country?: string;
  language?: string;
  credits?: {
    userCredits: number;
  };
}

export interface TestingCredentials {
  id: string;
  createdBy: string;
  email: string;
  password: string;
  description: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface AuthContextType {
  session: Session | null;
  profile: AppProfile | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isInternalUser: boolean;
  activePortal: PortalId;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<AppProfile | null>;
}
