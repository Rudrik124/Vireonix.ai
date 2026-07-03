import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || "https://cowdbhlpxzrlcbsxrvwh.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || "sb_publishable_dATLFlK6takFJUF3dIGMuw_uFrcm0oI";
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

if (!isSupabaseConfigured) {
	console.error(
		"Missing Supabase frontend env. Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (or SUPABASE_URL + SUPABASE_ANON_KEY in src/.env).",
	);
}

// We assert the type to any to avoid strict typescript errors if strictly typed locally
export const supabase: any = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;
