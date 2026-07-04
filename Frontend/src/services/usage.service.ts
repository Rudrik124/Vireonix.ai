import { supabase } from "@/lib/supabase";
import type { AppProfile, PortalId, UsageType } from "../shared/types/auth";

export interface UsageContext {
  portal: PortalId;
  usageType: UsageType;
}

export interface UsageLogPayload {
  profile: AppProfile | null;
  featureKey: string;
  status?: "started" | "completed" | "failed";
  metadata?: Record<string, unknown>;
  usageType?: UsageType;
  portal?: PortalId;
}

export function buildUsageContext(profile: AppProfile | null, overrides?: Partial<UsageContext>): UsageContext {
  const usageType = overrides?.usageType || "production";
  const portal = overrides?.portal || "user";

  return {
    portal,
    usageType,
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
    portal: usageContext.portal,
    usage_type: usageContext.usageType,
    feature_key: payload.featureKey,
    status: payload.status ?? "started",
    metadata: payload.metadata ?? {},
  }).select("id").maybeSingle();

  if (insert.error) {
    console.warn("Failed to write usage log:", insert.error.message);
    return null;
  }

  return insert.data;
}
