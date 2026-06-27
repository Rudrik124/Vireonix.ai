import { getSupabaseClient } from "./supabaseClient.js";
import { getAuthPolicies } from "./authPolicies.js";

const normalizeProvider = (provider = "") => String(provider).trim().toLowerCase();

export const signInWithSupabaseCredentials = async ({ email, password } = {}) => {
  if (!email || !password) {
    return { success: false, error: "EMAIL_AND_PASSWORD_REQUIRED" };
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { success: false, error: error.message || "LOGIN_FAILED" };
    }

    return {
      success: true,
      session: data?.session ?? null,
      user: data?.user ?? null,
      accessToken: data?.session?.access_token ?? null,
      refreshToken: data?.session?.refresh_token ?? null,
    };
  } catch (error) {
    return { success: false, error: error?.message || "LOGIN_FAILED" };
  }
};

export const getOAuthProviderConfig = (provider = "") => {
  const normalizedProvider = normalizeProvider(provider);
  const policies = getAuthPolicies();
  return policies.oauth.providers[normalizedProvider] || null;
};

export const initiateOAuthFlow = async (provider, options = {}) => {
  const normalizedProvider = normalizeProvider(provider);
  const policies = getAuthPolicies();

  if (!policies.oauth.allowedProviders.includes(normalizedProvider)) {
    return { success: false, error: "PROVIDER_NOT_ALLOWED" };
  }

  const providerConfig = getOAuthProviderConfig(normalizedProvider);
  if (!providerConfig?.enabled) {
    return { success: false, error: "PROVIDER_NOT_CONFIGURED" };
  }

  try {
    const supabase = getSupabaseClient();
    const redirectTo = options.redirectTo || process.env.APP_URL || "http://localhost:5173/auth/callback";
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: normalizedProvider,
      options: {
        redirectTo,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error?.message || "OAUTH_INIT_FAILED" };
  }
};

export const verifyOAuthAccount = (user = {}, provider = "") => {
  const normalizedProvider = normalizeProvider(provider);
  const providerId = user?.app_metadata?.provider || user?.user_metadata?.provider || user?.app_metadata?.providers?.[0] || "";
  const isMatch = !normalizedProvider || String(providerId).toLowerCase() === normalizedProvider;

  return {
    valid: Boolean(user?.id && user?.email && isMatch),
    provider: normalizedProvider,
    providerId,
    email: user?.email || "",
  };
};

export default {
  getOAuthProviderConfig,
  initiateOAuthFlow,
  signInWithSupabaseCredentials,
  verifyOAuthAccount,
};
