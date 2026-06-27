const readEnv = (name, fallback = "") => process.env[name] || process.env[`VITE_${name}`] || fallback;

const normalizeProviders = (rawProviders = "") => {
  if (!rawProviders) {
    return [];
  }

  return rawProviders
    .split(",")
    .map((provider) => provider.trim().toLowerCase())
    .filter(Boolean);
};

const policyConfig = {
  password: {
    minLength: Number(readEnv("AUTH_PASSWORD_MIN_LENGTH", "8")) || 8,
    maxLength: Number(readEnv("AUTH_PASSWORD_MAX_LENGTH", "128")) || 128,
    requireUppercase: readEnv("AUTH_PASSWORD_REQUIRE_UPPERCASE", "true") === "true",
    requireNumbers: readEnv("AUTH_PASSWORD_REQUIRE_NUMBERS", "true") === "true",
    requireSpecialCharacters: readEnv("AUTH_PASSWORD_REQUIRE_SPECIAL", "true") === "true",
  },
  login: {
    maxAttempts: Number(readEnv("AUTH_MAX_LOGIN_ATTEMPTS", "5")) || 5,
    lockoutDurationMinutes: Number(readEnv("AUTH_LOCKOUT_DURATION_MINUTES", "15")) || 15,
    failedLoginThreshold: Number(readEnv("AUTH_FAILED_LOGIN_THRESHOLD", "5")) || 5,
  },
  session: {
    timeoutMinutes: Number(readEnv("AUTH_SESSION_TIMEOUT_MINUTES", "30")) || 30,
    refreshTokenExpiryDays: Number(readEnv("AUTH_REFRESH_TOKEN_EXPIRY_DAYS", "7")) || 7,
    rememberMeDurationDays: Number(readEnv("AUTH_REMEMBER_ME_DURATION_DAYS", "30")) || 30,
  },
  oauth: {
    allowedProviders: normalizeProviders(readEnv("AUTH_OAUTH_PROVIDERS", "google,github")),
    providers: {
      google: {
        enabled: Boolean(readEnv("GOOGLE_CLIENT_ID", "")),
        clientId: readEnv("GOOGLE_CLIENT_ID", ""),
      },
      github: {
        enabled: Boolean(readEnv("GITHUB_CLIENT_ID", "")),
        clientId: readEnv("GITHUB_CLIENT_ID", ""),
      },
      apple: {
        enabled: Boolean(readEnv("APPLE_CLIENT_ID", "")),
        clientId: readEnv("APPLE_CLIENT_ID", ""),
      },
    },
  },
  admin: {
    require2FA: readEnv("AUTH_ADMIN_REQUIRE_2FA", "true") === "true",
    requireStrongPassword: readEnv("AUTH_ADMIN_REQUIRE_STRONG_PASSWORD", "true") === "true",
  },
};

export const getAuthPolicies = () => ({
  ...policyConfig,
  oauth: {
    ...policyConfig.oauth,
    providers: {
      ...policyConfig.oauth.providers,
    },
  },
});

export const isOAuthProviderEnabled = (provider) => {
  const policies = getAuthPolicies();
  const normalizedProvider = String(provider || "").trim().toLowerCase();
  return Boolean(policies.oauth.providers[normalizedProvider]?.enabled);
};

export default getAuthPolicies;
