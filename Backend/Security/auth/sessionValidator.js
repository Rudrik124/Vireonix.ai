import { createHash } from "crypto";
import { getSupabaseClient } from "./supabaseClient.js";

class SessionValidator {
  constructor() {
    this.activeSessions = new Map();
  }

  buildSessionKey(userId, accessToken = "") {
    const normalizedToken = String(accessToken || "").trim();
    const digest = createHash("sha256").update(`${userId}:${normalizedToken}`).digest("hex");
    return `${userId}:${digest.slice(0, 16)}`;
  }

  cacheSession({ userId, accessToken, refreshToken, user }) {
    const key = this.buildSessionKey(userId, accessToken);
    this.activeSessions.set(key, {
      userId,
      accessToken,
      refreshToken,
      user,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
      revoked: false,
    });
    return key;
  }

  getSession(userId, accessToken) {
    const key = this.buildSessionKey(userId, accessToken);
    return this.activeSessions.get(key) || null;
  }

  async validateSession({ accessToken, refreshToken, userId } = {}) {
    if (!accessToken) {
      return { valid: false, error: "TOKEN_MISSING" };
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.getUser(accessToken);

      if (!error && data?.user) {
        const normalizedUserId = userId || data.user.id;
        this.cacheSession({
          userId: normalizedUserId,
          accessToken,
          refreshToken,
          user: data.user,
        });
        return {
          valid: true,
          user: data.user,
          accessToken,
          refreshToken,
          provider: data.user?.app_metadata?.provider || data.user?.user_metadata?.provider || "supabase",
        };
      }

      if (refreshToken) {
        const refreshedSession = await supabase.auth.refreshSession({ refresh_token: refreshToken });
        if (!refreshedSession.error && refreshedSession.data?.session) {
          const nextUser = refreshedSession.data.user || refreshedSession.data.session.user;
          this.cacheSession({
            userId: nextUser?.id,
            accessToken: refreshedSession.data.session.access_token,
            refreshToken: refreshedSession.data.session.refresh_token,
            user: nextUser,
          });
          return {
            valid: true,
            user: nextUser,
            accessToken: refreshedSession.data.session.access_token,
            refreshToken: refreshedSession.data.session.refresh_token,
            provider: nextUser?.app_metadata?.provider || nextUser?.user_metadata?.provider || "supabase",
          };
        }
      }

      return { valid: false, error: error?.message || "SESSION_INVALID" };
    } catch (error) {
      return { valid: false, error: error?.message || "SESSION_VALIDATION_FAILED" };
    }
  }

  revokeSession(userId, accessToken) {
    const session = this.getSession(userId, accessToken);
    if (!session) {
      return false;
    }

    session.revoked = true;
    return true;
  }

  getStats() {
    return {
      activeSessions: this.activeSessions.size,
    };
  }
}

const sessionValidator = new SessionValidator();

export const validateSupabaseSession = (payload) => sessionValidator.validateSession(payload);
export const revokeSupabaseSession = (userId, accessToken) => sessionValidator.revokeSession(userId, accessToken);
export const getSessionValidatorStats = () => sessionValidator.getStats();

export default sessionValidator;
