import { supabase } from "@/lib/supabase";

export const buildPortalRequestHeaders = async (
  usageContext?: { portal?: string; usageType?: string; skipCreditCheck?: boolean },
  extraHeaders: Record<string, string> = {}
) => {
  const { data: sessionData } = await supabase?.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  return {
    ...extraHeaders,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(usageContext?.portal ? { "X-Portal": usageContext.portal } : {}),
    ...(usageContext?.usageType ? { "X-Usage-Type": usageContext.usageType } : {}),
    ...(usageContext?.skipCreditCheck ? { "X-Skip-Credit-Check": "true" } : {}),
  };
};
