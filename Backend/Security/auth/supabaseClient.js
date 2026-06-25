import { createClient } from "@supabase/supabase-js";

let supabaseClient = null;

export const getSupabaseAuthConfig = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";

  return { supabaseUrl, supabaseKey };
};

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    const { supabaseUrl, supabaseKey } = getSupabaseAuthConfig();

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing Supabase auth configuration in environment. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, or the VITE_* equivalents.",
      );
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
};

export const hasSupabaseAuthConfig = () => {
  const { supabaseUrl, supabaseKey } = getSupabaseAuthConfig();
  return Boolean(supabaseUrl && supabaseKey);
};