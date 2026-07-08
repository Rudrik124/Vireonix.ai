import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AppProfile } from "../shared/types/auth";

type SupabaseProfileRow = {
  id?: string;
  email?: string | null;
  full_name?: string | null;
  name?: string | null;
  timezone?: string | null;
  role?: string | null;
  phone?: string | null;
  country?: string | null;
  language?: string | null;
};

export function buildFallbackProfile(session: Session): AppProfile {
  const fullName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";

  return {
    id: session.user.id,
    email: session.user.email || "",
    fullName,
  };
}

function normalizeProfile(row: SupabaseProfileRow, session: Session): AppProfile {
  const fallback = buildFallbackProfile(session);

  return {
    id: row.id || fallback.id,
    email: row.email || fallback.email,
    fullName: row.full_name || fallback.fullName,
    name: row.name || undefined,
    timezone: row.timezone || undefined,
    role: row.role || undefined,
    phone: row.phone || undefined,
    country: row.country || undefined,
    language: row.language || undefined,
  };
}

async function selectProfile(tableName: string, session: Session) {
  if (!supabase) {
    return null;
  }

  const query = await supabase
    .from(tableName)
    .select("id,email,full_name,name,timezone,role,phone,country,language")
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
