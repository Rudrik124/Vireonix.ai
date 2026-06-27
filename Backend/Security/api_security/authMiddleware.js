import { getSupabaseClient } from "../auth/supabaseClient.js";
import { extractAuthTokens, validateAccessToken } from "../auth/tokenManager.js";
import { getAuthPolicies } from "../auth/authPolicies.js";

const isPublicRoute = (pathname = "") => {
  const publicPrefixes = ["/api/auth", "/health", "/api/health"];
  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
};

export const authMiddleware = async (req, res, next) => {
  if (isPublicRoute(req.path || req.originalUrl || "")) {
    return next();
  }

  const policies = getAuthPolicies();
  const { accessToken, refreshToken } = extractAuthTokens(req);

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      code: "TOKEN_MISSING",
      message: "Authentication token is required.",
    });
  }

  try {
    const validation = await validateAccessToken(accessToken, refreshToken);

    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        code: validation.error || "TOKEN_INVALID",
        message: "Authentication failed.",
      });
    }

    req.auth = {
      user: validation.user,
      accessToken: validation.accessToken || accessToken,
      refreshToken: validation.refreshToken || refreshToken,
      policies,
    };
    req.user = validation.user;
    res.locals.auth = req.auth;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Authentication error",
      message: error?.message || "Unable to authenticate request.",
    });
  }
};

export const attachAuthMiddleware = (app) => {
  app.use([
    "/api/generate-video",
    "/api/projects",
    "/api/profile",
    "/api/settings",
    "/api/history",
    "/api/secure",
    "/api/user",
    "/generate-video",
    "/projects",
    "/profile",
    "/settings",
    "/history",
    "/upload",
  ], authMiddleware);
};

export default authMiddleware;
