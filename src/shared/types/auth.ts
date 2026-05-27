import type { Session } from "@supabase/supabase-js";

export const APP_ROLES = ["super_admin", "admin", "developer", "tester", "user"] as const;
export const PORTALS = ["developer", "admin", "tester", "user", "internal"] as const;
export const USAGE_TYPES = ["production", "test"] as const;
export const CREDIT_WALLET_TYPES = ["user_credits", "developer_credits"] as const;
export const TESTING_CREDENTIAL_TYPES = ["tester_email", "tester_password"] as const;

export type AppRole = (typeof APP_ROLES)[number];
export type PortalId = (typeof PORTALS)[number];
export type UsageType = (typeof USAGE_TYPES)[number];
export type CreditWalletType = (typeof CREDIT_WALLET_TYPES)[number];
export type TestingCredentialType = (typeof TESTING_CREDENTIAL_TYPES)[number];

export interface CreditSnapshot {
  userCredits: number;
  developerCredits: number;
}

export interface AppProfile {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  portalAccess: PortalId[];
  permissions: string[];
  bypassCreditChecks: boolean;
  testingModeEnabled: boolean;
  subscriptionStatus: string;
  credits: CreditSnapshot;
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
  hasRole: (role: AppRole | AppRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}
