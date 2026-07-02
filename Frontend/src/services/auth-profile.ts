import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../../Backend/supabase";
import { getPortalAccessForRole, getRolePermissions } from "../shared/auth/permissions";
import type { AppProfile, AppRole } from "../shared/types/auth";

type SupabaseProfileRow = {
  id?: string;
  email?: string | null;
  full_name?: string | null;
  role?: AppRole | null;
  portal_access?: string[] | null;
  permissions?: string[] | null;
  bypass_credit_checks?: boolean | null;
  testing_mode_enabled?: boolean | null;
  user_credits?: number | null;
  developer_credits?: number | null;
  subscription_status?: string | null;
};

export function buildFallbackProfile(session: Session): AppProfile {
  const fullName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";

  return {
    id: session.user.id,
    email: session.user.email || "",
    fullName,
    role: "user",
    portalAccess: ["user"],
    permissions: getRolePermissions("user"),
    bypassCreditChecks: false,
    testingModeEnabled: false,
    subscriptionStatus: "free",
    credits: {
      userCredits: 0,
      developerCredits: 0,
    },
  };
}

function normalizeProfile(row: SupabaseProfileRow, session: Session): AppProfile {
  const fallback = buildFallbackProfile(session);
  const role = row.role || fallback.role;
  const portalAccess = Array.isArray(row.portal_access) && row.portal_access.length > 0
    ? (row.portal_access.filter(Boolean) as AppProfile["portalAccess"])
    : getPortalAccessForRole(role);

  return {
    id: row.id || fallback.id,
    email: row.email || fallback.email,
    fullName: row.full_name || fallback.fullName,
    role,
    portalAccess,
    permissions: Array.isArray(row.permissions) && row.permissions.length > 0
      ? row.permissions
      : getRolePermissions(role),
    bypassCreditChecks: Boolean(row.bypass_credit_checks),
    testingModeEnabled: Boolean(row.testing_mode_enabled),
    subscriptionStatus: row.subscription_status || fallback.subscriptionStatus,
    credits: {
      userCredits: Number(row.user_credits ?? 0),
      developerCredits: Number(row.developer_credits ?? 0),
    },
  };
}

async function selectProfile(tableName: string, session: Session) {
  if (!supabase) {
    return null;
  }

  const query = await supabase
    .from(tableName)
    .select("id,email,full_name,role,portal_access,permissions,bypass_credit_checks,testing_mode_enabled,user_credits,developer_credits,subscription_status")
    .eq("id", session.user.id)
    .maybeSingle();

  if (query.error) {
    if (query.error.code !== "PGRST116" && !query.error.message?.toLowerCase().includes("does not exist")) {
      console.warn(`Failed to load profile from ${tableName}:`, query.error.message);
    }
    return null;
  }

  return query.data as SupabaseProfileRow | null;
}

export async function fetchAppProfile(session: Session): Promise<AppProfile> {
  if (!supabase) {
    return buildFallbackProfile(session);
  }

  const userEmail = session.user.email?.toLowerCase();

  if (userEmail === "admin@veytrix.ai" || userEmail === "security@veytrix.ai") {
    const fallback = buildFallbackProfile(session);
    return {
      ...fallback,
      role: "admin",
      portalAccess: ["developer", "admin", "tester", "user"],
      permissions: getRolePermissions("admin"),
    };
  }

  if (userEmail === "developer@veytrix.ai") {
    const fallback = buildFallbackProfile(session);
    return {
      ...fallback,
      role: "developer",
      portalAccess: ["developer", "tester", "user"],
      permissions: getRolePermissions("developer"),
    };
  }

  if (userEmail === "tester@veeytrix.ai" || userEmail === "tester@veytrix.ai") {
    const fallback = buildFallbackProfile(session);
    return {
      ...fallback,
      role: "tester",
      portalAccess: ["tester", "user"],
      permissions: getRolePermissions("tester"),
    };
  }

  try {
    // Add a timeout to prevent hanging
    const profilePromise = Promise.all([
      selectProfile("app_profiles", session),
      selectProfile("profiles", session),
    ]);

    const timeoutPromise = new Promise<[null, null]>((resolve) => {
      setTimeout(() => resolve([null, null]), 5000); // 5 second timeout
    });

    const [appProfile, legacyProfile] = await Promise.race([
      profilePromise,
      timeoutPromise,
    ]);

    const profileRow = appProfile || legacyProfile;
    return profileRow ? normalizeProfile(profileRow, session) : buildFallbackProfile(session);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return buildFallbackProfile(session);
  }
}
