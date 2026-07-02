import { supabase } from "../../../Backend/supabase";
import { canBypassCreditChecks } from "../shared/auth/permissions";
import type { AppProfile, CreditWalletType, PortalId, UsageType } from "../shared/types/auth";

export interface UsageContext {
  portal: PortalId;
  usageType: UsageType;
  walletType: CreditWalletType;
  skipCreditCheck: boolean;
  actorRole: AppProfile["role"];
}

export interface UsageLogPayload {
  profile: AppProfile | null;
  featureKey: string;
  creditsRequested?: number;
  status?: "started" | "completed" | "failed";
  metadata?: Record<string, unknown>;
  usageType?: UsageType;
  portal?: PortalId;
}

export function buildUsageContext(profile: AppProfile | null, overrides?: Partial<UsageContext>): UsageContext {
  const usageType = overrides?.usageType || (profile?.portalAccess.includes("internal") ? "test" : "production");
  const portal = overrides?.portal || (usageType === "test" ? "internal" : "user");
  const walletType = overrides?.walletType || (usageType === "test" ? "developer_credits" : "user_credits");

  return {
    portal,
    usageType,
    walletType,
    skipCreditCheck: overrides?.skipCreditCheck ?? canBypassCreditChecks(profile, usageType),
    actorRole: overrides?.actorRole || profile?.role || "user",
  };
}

export async function logUsageEvent(payload: UsageLogPayload) {
  if (!supabase || !payload.profile) {
    return null;
  }

  const usageContext = buildUsageContext(payload.profile, {
    usageType: payload.usageType,
    portal: payload.portal,
  });

  const insert = await supabase.from("usage_logs").insert({
    user_id: payload.profile.id,
    actor_role: payload.profile.role,
    portal: usageContext.portal,
    usage_type: usageContext.usageType,
    wallet_type: usageContext.walletType,
    feature_key: payload.featureKey,
    credits_requested: payload.creditsRequested ?? 0,
    credit_check_bypassed: usageContext.skipCreditCheck,
    status: payload.status ?? "started",
    metadata: payload.metadata ?? {},
  }).select("id").maybeSingle();

  if (insert.error) {
    console.warn("Failed to write usage log:", insert.error.message);
    return null;
  }

  return insert.data;
}

export async function fetchCreditOverview(profile: AppProfile | null) {
  if (!profile) {
    return null;
  }

  if (!supabase) {
    return profile.credits;
  }

  const query = await supabase
    .from("credit_wallets")
    .select("wallet_type,balance")
    .eq("user_id", profile.id);

  if (query.error || !query.data) {
    return profile.credits;
  }

  return query.data.reduce((acc, row) => {
    if (row.wallet_type === "user_credits") {
      acc.userCredits = Number(row.balance ?? 0);
    }

    if (row.wallet_type === "developer_credits") {
      acc.developerCredits = Number(row.balance ?? 0);
    }

    return acc;
  }, {
    userCredits: profile.credits.userCredits,
    developerCredits: profile.credits.developerCredits,
  });
}
