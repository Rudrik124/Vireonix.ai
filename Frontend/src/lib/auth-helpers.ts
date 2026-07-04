import { supabase } from "@/lib/supabase";

export const signInWithGoogle = async (redirectTo: string = window.location.origin) => {
  if (!supabase) {
    throw new Error("Supabase is not configured for authentication.");
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw error;
  }
};
