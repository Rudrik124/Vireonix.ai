import { createHash } from "crypto";
import { getSupabaseClient } from "./supabaseClient.js";
import { validateSupabaseSession } from "./sessionValidator.js";

const parseCookieHeader = (cookieHeader = "") => {
  return cookieHeader
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce((accumulator, segment) => {
      const separatorIndex = segment.indexOf("=");
      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = segment.slice(0, separatorIndex).trim();
      const value = decodeURIComponent(segment.slice(separatorIndex + 1).trim());
      accumulator[key] = value;
      return accumulator;
    }, {});
};

export const extractAuthTokens = (req = {}) => {
  const headers = req.headers || {};
  const cookieHeader = headers.cookie || "";
  const cookies = req.cookies || parseCookieHeader(cookieHeader);

  const authorizationHeader = headers.authorization || headers.Authorization || "";
  const bearerToken = authorizationHeader.startsWith("Bearer ") ? authorizationHeader.slice(7).trim() : "";

  const accessToken = bearerToken || cookies["sb-access-token"] || cookies["authToken"] || req.query?.access_token || req.body?.accessToken || "";
  const refreshToken = cookies["sb-refresh-token"] || cookies["refreshToken"] || req.headers["x-refresh-token"] || req.body?.refreshToken || req.query?.refresh_token || "";

  return {
    accessToken,
    refreshToken,
  };
};

export const decodeJwtPayload = (token = "") => {
  if (!token) {
    return null;
  }

  const parts = String(token).split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = parts[1];
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload + "=".repeat((4 - (normalizedPayload.length % 4)) % 4);
    return JSON.parse(Buffer.from(paddedPayload, "base64").toString("utf8"));
  } catch (error) {
    return null;
  }
};

export const getUserIdFromToken = (token = "") => decodeJwtPayload(token)?.sub || decodeJwtPayload(token)?.user_id || null;

export const getUserRoleFromToken = (token = "") => {
  const payload = decodeJwtPayload(token);
  return payload?.role || payload?.user_role || "user";
};

export const validateAccessToken = async (accessToken, refreshToken) => {
  if (!accessToken) {
    return { valid: false, error: "TOKEN_MISSING" };
  }

  const validation = await validateSupabaseSession({ accessToken, refreshToken });

  if (!validation.valid) {
    return validation;
  }

  const decodedPayload = decodeJwtPayload(accessToken);

  return {
    ...validation,
    userId: validation.user?.id || getUserIdFromToken(accessToken),
    role: validation.user?.role || getUserRoleFromToken(accessToken),
    expiresAt: decodedPayload?.exp ? new Date(decodedPayload.exp * 1000).toISOString() : null,
  };
};

export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    return { valid: false, error: "REFRESH_TOKEN_MISSING" };
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data?.session) {
      return { valid: false, error: error?.message || "REFRESH_FAILED" };
    }

    return {
      valid: true,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: data.user || data.session.user,
    };
  } catch (error) {
    return { valid: false, error: error?.message || "REFRESH_FAILED" };
  }
};

export const getTokenFingerprint = (token = "") => {
  if (!token) {
    return "";
  }

  return createHash("sha256").update(token).digest("hex");
};

export default {
  extractAuthTokens,
  decodeJwtPayload,
  getUserIdFromToken,
  getUserRoleFromToken,
  validateAccessToken,
  refreshAccessToken,
  getTokenFingerprint,
};
