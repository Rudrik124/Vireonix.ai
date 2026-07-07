import express from "express";
import { logSecurityEvent, securityEventTemplates, extractRequestMetadata } from "./Security/logs_monitoring/security-events-logger.js";
import { getSupabaseClient as getAuthSupabaseClient } from "./Security/auth/supabaseClient.js";
import cloudflareConfigModule from "./Security/file_security/cloudflareConfig.js";

const { getCloudflareConfig } = cloudflareConfigModule;

const router = express.Router();

// Lazy initialize Supabase through the auth folder helper.
const getSupabaseClient = () => getAuthSupabaseClient();

const isMissingTableError = (error) => {
  if (!error) {
    return false;
  }

  const message = String(error.message || "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "PGRST116" ||
    message.includes("could not find the table") ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
};

const TESTER_PERMISSIONS = [
  "tester.portal.access",
  "user.portal.access",
  "developer.testing.run",
];

const TESTER_PORTAL_ACCESS = ["tester", "user"];

const PROFILE_SELECTS = [
  "id, email, full_name, role, user_credits, developer_credits, created_at, subscription_status, portal_access",
  "id, email, full_name, user_credits, developer_credits, created_at, subscription_status, portal_access",
  "id, email, full_name, created_at",
  "id, email",
];

const getInternalFallbackProfile = (user) => {
  const email = user.email?.toLowerCase();

  if (email === "admin@veytrix.ai") {
    return { id: user.id, email: user.email, role: "admin" };
  }

  if (email === "developer@veytrix.ai" || email === "official@mavrostech.in") {
    return { id: user.id, email: user.email, role: "developer" };
  }

  if (email === "tester@veeytrix.ai" || email === "tester@veytrix.ai") {
    return { id: user.id, email: user.email, role: "tester" };
  }

  // Fallback for local development or if user is somehow authenticated but missing a profile
  if (process.env.NODE_ENV !== "production") {
    return { id: user.id, email: user.email, role: "developer" };
  }

  return null;
};

/**
 * Extract Bearer token from Authorization header
 */
const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
};

const findInternalProfile = async (user) => {
  const selectProfile = async (tableName) => {
    for (const columns of ["id, email, role", "id, email"]) {
      const { data, error } = await getSupabaseClient()
        .from(tableName)
        .select(columns)
        .eq("id", user.id)
        .maybeSingle();

      if (!error) {
        const fallbackProfile = getInternalFallbackProfile(user);
        return data ? { ...data, role: data.role || fallbackProfile?.role || "user" } : null;
      }

      const message = error.message?.toLowerCase() || "";
      const isMissingColumn = error.code === "42703";
      const isMissingTable = error.code === "PGRST116" || message.includes("does not exist");

      if (isMissingColumn) {
        continue;
      }

      if (!isMissingTable) {
        console.warn(`Failed to load internal profile from ${tableName}:`, error.message);
      }

      return null;
    }
  };

  return (await selectProfile("app_profiles")) || (await selectProfile("profiles")) || getInternalFallbackProfile(user);
};

const selectAppProfiles = async ({ ids, offset, limit }) => {
  for (const columns of PROFILE_SELECTS) {
    let query = getSupabaseClient().from("app_profiles").select(columns);

    if (ids) {
      query = query.in("id", ids);
    } else {
      query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (!error) {
      return data || [];
    }

    if (error.code !== "42703") {
      throw error;
    }
  }

  return [];
};

const selectAppProfileById = async (id) => {
  const profiles = await selectAppProfiles({ ids: [id] });
  return profiles[0] || null;
};

/**
 * Get video counts for specified users from usage logs
 */
const getVideoCountsForUsers = async (userIds) => {
  if (!userIds.length) return new Map();

  try {
    const { data: usageLogs, error } = await getSupabaseClient()
      .from("usage_logs")
      .select("user_id")
      .in("user_id", userIds)
      .in("feature_key", ["video_generation", "ai_video_generation", "scene_generation"]);

    if (error) {
      console.warn("Failed to fetch video counts:", error.message);
      return new Map();
    }

    const videoCounts = new Map();
    (usageLogs || []).forEach((log) => {
      const count = videoCounts.get(log.user_id) || 0;
      videoCounts.set(log.user_id, count + 1);
    });

    return videoCounts;
  } catch (err) {
    console.warn("Error calculating video counts:", err);
    return new Map();
  }
};

const isTesterAccount = (authUser, profile) => {
  const email = (profile?.email || authUser?.email || "").toLowerCase();
  const metadataRole = authUser?.user_metadata?.role || authUser?.app_metadata?.role;
  const portalAccess = profile?.portal_access || authUser?.user_metadata?.portal_access || [];

  return (
    profile?.role === "tester" ||
    metadataRole === "tester" ||
    portalAccess.includes?.("tester") ||
    email === "tester@veeytrix.ai" ||
    email === "tester@veytrix.ai" ||
    email.includes("tester") ||
    email.includes("qa")
  );
};

const getDeveloperCreditBalance = async (userId, profile) => {
  const { data: wallet } = await getSupabaseClient()
    .from("tester_credit_wallets")
    .select("balance")
    .eq("user_id", userId)
    .eq("wallet_type", "tester_credits")
    .maybeSingle();

  return Number(wallet?.balance ?? profile?.developer_credits ?? 0);
};

const upsertTesterProfile = async ({ id, email, fullName, developerCredits }) => {
  try {
    // Try simple upsert with basic required columns
    const { error } = await getSupabaseClient()
      .from("app_profiles")
      .upsert({
        id,
        email,
        full_name: fullName,
        role: "tester",
        subscription_status: "active",
        user_credits: 0,
        developer_credits: developerCredits || 0,
      }, { onConflict: "id" });

    if (error) {
      console.error("Upsert profile error:", error);
      throw error;
    }
  } catch (err) {
    console.error("Failed to upsert tester profile:", err);
    throw err;
  }
};

const authenticateInternalRequest = async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return null;
  }

  const {
    data: { user },
    error: authError,
  } = await getSupabaseClient().auth.getUser(token);
  if (authError || !user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const profile = await findInternalProfile(user);
  if (!profile) {
    console.error("Profile not found for user:", user.email);
    res.status(403).json({ error: "Profile not found" });
    return null;
  }

  console.log("Auth successful - User:", user.email, "Profile Role:", profile.role);
  req.user = user;
  req.profile = profile;
  return { user, profile };
};

// Middleware to verify admin/developer access
const verifyDeveloperAccess = async (req, res, next) => {
  try {
    const auth = await authenticateInternalRequest(req, res);
    if (!auth) return;

    console.log("Developer access check - User:", auth.user.email, "Role:", auth.profile.role);

    if (!["admin", "super_admin", "developer"].includes(auth.profile.role)) {
      console.warn("Insufficient permissions - Role not in allowed list:", auth.profile.role);
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  } catch (error) {
    console.error("Developer access verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const verifyTesterOrDeveloperAccess = async (req, res, next) => {
  try {
    const auth = await authenticateInternalRequest(req, res);
    if (!auth) return;

    if (!["admin", "super_admin", "developer", "tester"].includes(auth.profile.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const targetTesterId = req.params.testerId;
    if (auth.profile.role === "tester" && targetTesterId && auth.user.id !== targetTesterId) {
      return res.status(403).json({ error: "Cannot access another tester profile" });
    }

    next();
  } catch (error) {
    console.error("Tester access verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const verifyPortalAccess = async (req, res, next) => {
  try {
    const auth = await authenticateInternalRequest(req, res);
    if (!auth) return;

    const allowedRoles = ["admin", "super_admin", "developer", "security_admin", "security_analyst", "security_viewer"];
    if (!allowedRoles.includes(auth.profile.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  } catch (error) {
    console.error("Portal access verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const buildCloudflareFallbackPayload = (config) => {
  const configured = Boolean(config.apiToken && config.accountId);
  return {
    configured,
    source: configured ? "cloudflare-api" : "fallback",
    generatedAt: new Date().toISOString(),
    accountId: config.accountId || null,
    zoneId: config.zoneId || null,
    summary: {
      requests: 0,
      bandwidthBytes: 0,
      blockedRequests: 0,
      uniqueVisitors: 0,
      threats: 0,
    },
    security: {
      criticalAlerts: 0,
      activeThreats: 0,
      failedLogins: 0,
      blockedRequests: 0,
      systemHealth: configured ? 98 : 95,
    },
    recentEvents: [],
    notes: configured
      ? []
      : ["Cloudflare API token and account ID are not configured. Showing safe fallback metrics."],
  };
};

const fetchCloudflarePortalOverview = async () => {
  const config = getCloudflareConfig();
  if (!config.apiToken) {
    return buildCloudflareFallbackPayload(config);
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const until = new Date().toISOString();
  const headers = {
    Authorization: `Bearer ${config.apiToken}`,
    "Content-Type": "application/json",
  };

  const analyticsUrl = config.zoneId
    ? `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/analytics/dashboard?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&interval=1d`
    : `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/analytics/dashboard?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&interval=1d`;

  const firewallUrl = config.zoneId
    ? `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/firewall/events?limit=10&direction=desc`
    : `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/firewall/events?limit=10&direction=desc`;

  const [analyticsResponse, firewallResponse] = await Promise.allSettled([
    fetch(analyticsUrl, { headers }),
    fetch(firewallUrl, { headers }),
  ]);

  const fallback = buildCloudflareFallbackPayload(config);

  if (analyticsResponse.status === "rejected") {
    return {
      ...fallback,
      source: "fallback",
      notes: ["Cloudflare analytics endpoint could not be reached. Showing safe fallback metrics."],
    };
  }

  const analyticsData = await analyticsResponse.value.json().catch(() => null);
  const firewallData = firewallResponse.status === "fulfilled"
    ? await firewallResponse.value.json().catch(() => null)
    : null;

  const analyticsResult = analyticsData?.result || analyticsData || {};
  const totals = analyticsResult?.totals || analyticsResult?.summary || analyticsResult?.data?.totals || {};
  const requests = Number(totals.requests || totals.all?.requests || analyticsResult?.requests || 0) || 0;
  const bandwidthBytes = Number(totals.bandwidth || totals.bytes || totals.bytes_proxied || analyticsResult?.bandwidth || 0) || 0;
  const uniqueVisitors = Number(totals.uniques || totals.unique_visitors || totals.uniqueVisitors || analyticsResult?.uniqueVisitors || 0) || 0;
  const threats = Number(totals.threats || totals.bot_requests || totals.attack_requests || analyticsResult?.threats || 0) || 0;

  const events = Array.isArray(firewallData?.result) ? firewallData.result : [];
  const blockedRequests = events.filter((event) => {
    const action = String(event?.action || "").toLowerCase();
    return ["block", "challenge", "managed_challenge", "jschl"].includes(action);
  }).length;
  const criticalAlerts = events.filter((event) => {
    const severity = String(event?.severity || "").toLowerCase();
    const action = String(event?.action || "").toLowerCase();
    return severity === "high" || severity === "critical" || action === "block";
  }).length;

  return {
    configured: true,
    source: "cloudflare-api",
    generatedAt: new Date().toISOString(),
    accountId: config.accountId || null,
    zoneId: config.zoneId || null,
    summary: {
      requests,
      bandwidthBytes,
      blockedRequests,
      uniqueVisitors,
      threats,
    },
    security: {
      criticalAlerts,
      activeThreats: Math.max(0, Math.round(threats / 10)),
      failedLogins: 0,
      blockedRequests,
      systemHealth: Math.max(88, 100 - Math.min(20, Math.round((blockedRequests + threats) / 50))),
    },
    recentEvents: events.slice(0, 5).map((event) => ({
      action: event?.action || "unknown",
      ruleId: event?.rule_id || event?.ruleId || null,
      severity: event?.severity || "info",
      source: event?.source || "cloudflare",
      timestamp: event?.timestamp || event?.created_at || new Date().toISOString(),
    })),
  };
};

// ============ DASHBOARD STATS ============

/**
 * GET /api/developer/dashboard/stats
 * Returns dashboard statistics
 */
router.get("/api/developer/dashboard/stats", verifyDeveloperAccess, async (req, res) => {
  console.log("Dashboard request received");
  console.log("Authenticated user:", req.user);

  try {
    const supabaseClient = getSupabaseClient();
    console.log("Database connection: Supabase client initialized");
    console.log("Executing dashboard queries...");

    // Get total users from auth
    let totalUsers = 0;
    try {
      const authResult = await supabaseClient.auth.admin.listUsers({ perPage: 1 });
      totalUsers = authResult.data?.total || 0;
    } catch (err) {
      console.warn("Failed to get auth users count, falling back to app_profiles:", err.message);
      const { count } = await supabaseClient
        .from("app_profiles")
        .select("*", { count: "exact", head: true });
      totalUsers = count || 0;
    }

    // Get active users (distinct users with activity in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: activeUserLogs, error: activeErr } = await supabaseClient
      .from("usage_logs")
      .select("user_id")
      .gt("created_at", sevenDaysAgo)
      .not("user_id", "is", null);
    if (activeErr) throw activeErr;

    const activeUsers = new Set((activeUserLogs || []).map(log => log.user_id)).size;

    // Get new users (registered in last 7 days)
    const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: newUsers, error: newUsersErr } = await supabaseClient
      .from("app_profiles")
      .select("*", { count: "exact", head: true })
      .gt("created_at", sevenDaysAgoDate);
    if (newUsersErr) throw newUsersErr;

    // Get total credits consumed (sum of all usage logs)
    const { data: creditData, error: creditErr } = await supabaseClient
      .from("usage_logs")
      .select("credits_charged");
    if (creditErr) throw creditErr;

    const creditsConsumed = (creditData || []).reduce((sum, log) => sum + (log.credits_charged || 0), 0);

    // Get AI requests count (distinct usage logs)
    const { data: aiRequestsData, error: aiReqErr } = await supabaseClient
      .from("usage_logs")
      .select("id")
      .eq("usage_type", "production");
    if (aiReqErr) throw aiReqErr;

    const aiRequests = (aiRequestsData || []).length;

    // Plan-type counts (FREE / PRO / PRO_MAX)
    let freeUsers = 0;
    let proUsers = 0;
    let proMaxUsers = 0;
    let planSchemaMissing = false;

    try {
      const { data: plans, error: plansError } = await supabaseClient
        .from('app_profiles')
        .select('id, plan_type');

      if (plansError) {
        const msg = String(plansError.message || '').toLowerCase();
        if (plansError.code === '42703' || msg.includes('column') || msg.includes('does not exist')) {
          planSchemaMissing = true;
        } else {
          throw plansError;
        }
      } else {
        (plans || []).forEach((p) => {
          const pt = (p.plan_type || 'FREE').toString().toUpperCase();
          if (pt === 'PRO') proUsers++;
          else if (pt === 'PRO_MAX' || pt === 'PROMAX') proMaxUsers++;
          else freeUsers++;
        });
      }
    } catch (err) {
      console.warn('Error while computing plan counts:', err?.message || err);
      planSchemaMissing = true;
    }

    const planSchemaSql = "ALTER TABLE app_profiles ADD COLUMN plan_type TEXT DEFAULT 'FREE';";

    const responseData = {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      newUsers: newUsers || 0,
      creditsConsumed: creditsConsumed || 0,
      aiRequests: aiRequests || 0,
      freeUsers,
      proUsers,
      proMaxUsers,
      planSchemaMissing,
      planSchemaSql: planSchemaMissing ? planSchemaSql : null,
      revenue: (creditsConsumed || 0) * 0.001, // Example: $0.001 per credit
    };

    console.log("Dashboard response prepared successfully");
    res.json(responseData);
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return res.status(500).json({
      message: err.message || "Unknown error",
      stack: err.stack,
      route: "/api/developer/dashboard/stats"
    });
  }
});

router.get("/api/developer/cloudflare/overview", verifyPortalAccess, async (_req, res) => {
  try {
    const payload = await fetchCloudflarePortalOverview();
    res.json(payload);
  } catch (error) {
    console.error("Cloudflare overview error:", error);
    res.status(500).json({ error: "Failed to fetch Cloudflare overview" });
  }
});

router.get("/api/security/cloudflare/overview", verifyPortalAccess, async (_req, res) => {
  try {
    const payload = await fetchCloudflarePortalOverview();
    res.json(payload);
  } catch (error) {
    console.error("Security Cloudflare overview error:", error);
    res.status(500).json({ error: "Failed to fetch Cloudflare overview" });
  }
});

// ============ USERS MANAGEMENT ============

/**
 * GET /api/developer/users
 * Returns list of all users with pagination
 */
router.get("/api/developer/users", verifyDeveloperAccess, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = String(req.query.search || "").trim().toLowerCase();

    const authResult = await getSupabaseClient().auth.admin.listUsers({
      page,
      perPage: limit,
    });

    if (authResult.error) {
      console.warn("Supabase auth users lookup failed, falling back to app_profiles:", authResult.error.message);
      const profileUsers = await selectAppProfiles({ offset, limit });
      const profileUserIds = (profileUsers || []).map((u) => u.id);

      const videoCounts = profileUserIds.length ? await getVideoCountsForUsers(profileUserIds) : new Map();

      const { count: totalCount } = await getSupabaseClient()
        .from("app_profiles")
        .select("*", { count: "exact", head: true });

      const users = (profileUsers || [])
        .filter((user) => {
          if (!search) return true;
          return (
            user.email?.toLowerCase().includes(search) ||
            user.full_name?.toLowerCase().includes(search)
          );
        })
        .map((user) => ({
          id: user.id,
          email: user.email,
          name: user.full_name || user.email?.split("@")[0] || "N/A",
          role: user.role || "user",
          status: user.subscription_status === "suspended" ? "suspended" : "active",
          credits: user.user_credits || 0,
          developerCredits: user.developer_credits || 0,
          portalAccess: user.portal_access || [],
          videos: videoCounts.get(user.id) || 0,
          joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A",
          lastLogin: "N/A",
        }));

      return res.json({
        users,
        totalCount: totalCount || users.length,
        page,
        limit,
        totalPages: Math.ceil((totalCount || users.length) / limit),
      });
    }

    const authUsers = authResult.data?.users || [];
    const userIds = authUsers.map((user) => user.id);

    const profiles = userIds.length ? await selectAppProfiles({ ids: userIds }) : [];
    const videoCounts = userIds.length ? await getVideoCountsForUsers(userIds) : new Map();

    const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));

    const users = authUsers
      .map((authUser) => {
        const profile = profileById.get(authUser.id);
        const email = profile?.email || authUser.email || "";
        const name =
          profile?.full_name ||
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          email.split("@")[0] ||
          "N/A";

        return {
          id: authUser.id,
          email,
          name,
          role: profile?.role || "user",
          status: profile?.subscription_status === "suspended" ? "suspended" : "active",
          credits: profile?.user_credits || 0,
          developerCredits: profile?.developer_credits || 0,
          portalAccess: profile?.portal_access || ["user"],
          videos: videoCounts.get(authUser.id) || 0,
          joinDate: new Date(profile?.created_at || authUser.created_at).toLocaleDateString(),
          lastLogin: authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString() : "Never",
        };
      })
      .filter((user) => {
        if (!search) return true;
        return user.email.toLowerCase().includes(search) || user.name.toLowerCase().includes(search);
      });

    res.json({
      users,
      totalCount: authResult.data?.total || users.length,
      page,
      limit,
      totalPages: Math.ceil((authResult.data?.total || users.length) / limit),
    });
  } catch (error) {
    console.error("Users list error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch users" });
  }
});

/**
 * GET /api/developer/profile-users
 * Returns app profile users with pagination
 */
router.get("/api/developer/profile-users", verifyDeveloperAccess, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data: users, error } = await getSupabaseClient()
      .from("app_profiles")
      .select("id, email, full_name, role, user_credits, developer_credits, created_at, subscription_status")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get total count
    const { count: totalCount } = await getSupabaseClient()
      .from("app_profiles")
      .select("*", { count: "exact", head: true });

    res.json({
      users: (users || []).map((u) => ({
        id: u.id,
        email: u.email,
        name: u.full_name || "N/A",
        role: u.role,
        status: u.subscription_status === "active" ? "active" : "suspended",
        credits: u.user_credits || 0,
        videos: 0, // Will calculate from usage logs
        joinDate: new Date(u.created_at).toLocaleDateString(),
      })),
      totalCount: totalCount || 0,
      page,
      limit,
      totalPages: Math.ceil((totalCount || 0) / limit),
    });
  } catch (error) {
    console.error("Profile users list error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * GET /api/developer/users/:userId
 * Returns detailed user profile
 */
router.get("/api/developer/users/:userId", verifyDeveloperAccess, async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error: userError } = await getSupabaseClient()
      .from("app_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !user) return res.status(404).json({ error: "User not found" });

    // Get usage statistics
    const { count: totalRequests } = await getSupabaseClient()
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { data: creditUsage } = await getSupabaseClient()
      .from("usage_logs")
      .select("credits_charged")
      .eq("user_id", userId);

    const totalCreditsUsed = (creditUsage || []).reduce((sum, log) => sum + (log.credits_charged || 0), 0);

    res.json({
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
      status: user.subscription_status === "active" ? "active" : "inactive",
      userCredits: user.user_credits,
      developerCredits: user.developer_credits,
      totalRequests: totalRequests || 0,
      totalCreditsUsed,
      joinedDate: new Date(user.created_at).toLocaleDateString(),
      lastActive: user.updated_at,
    });
  } catch (error) {
    console.error("User detail error:", error);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
});

/**
 * POST /api/developer/users/:userId/credits/add
 * Add credits to a user
 */
router.post("/api/developer/users/:userId/credits/add", verifyDeveloperAccess, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

    // Update user credits
    const { data: user, error: fetchError } = await getSupabaseClient()
      .from("app_profiles")
      .select("user_credits")
      .eq("id", userId)
      .single();

    if (fetchError || !user) return res.status(404).json({ error: "User not found" });

    const newBalance = (user.user_credits || 0) + amount;

    const { error: updateError } = await getSupabaseClient()
      .from("app_profiles")
      .update({ user_credits: newBalance })
      .eq("id", userId);

    if (updateError) throw updateError;

    // Log the transaction
    await getSupabaseClient().from("usage_logs").insert({
      user_id: userId,
      actor_role: req.profile.role,
      portal: "internal",
      usage_type: "test",
      wallet_type: "user_credits",
      feature_key: "admin_credit_add",
      credits_requested: amount,
      credits_charged: 0,
      status: "completed",
      metadata: { reason, admin_id: req.user.id },
    });

    // Log security event for admin action
    await logSecurityEvent({
      userId: req.user.id,
      category: 'ADMIN',
      action: 'ROLE_CHANGE',
      severity: 'INFO',
      eventMessage: `Admin added ${amount} credits to user (Reason: ${reason || 'No reason provided'})`,
      eventSource: 'developer-portal-api.js',
      actorRole: req.profile.role,
      affectedUserId: userId,
      metadata: { amount, reason, newBalance },
      ...extractRequestMetadata(req),
    });

    res.json({ success: true, newBalance });
  } catch (error) {
    console.error("Add credits error:", error);

    // Log security event for failed admin action
    await logSecurityEvent({
      userId: req.user.id,
      category: 'API',
      action: 'SERVER_ERROR',
      severity: 'WARNING',
      eventMessage: `Failed to add credits: ${error.message}`,
      eventSource: 'developer-portal-api.js',
      actorRole: req.profile.role,
      affectedUserId: req.params.userId,
      metadata: { error: error.message },
      ...extractRequestMetadata(req),
    });

    res.status(500).json({ error: "Failed to add credits" });
  }
});

/**
 * POST /api/developer/users/:userId/suspend
 * Suspend a user account
 */
router.post("/api/developer/users/:userId/suspend", verifyDeveloperAccess, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const { error } = await getSupabaseClient()
      .from("app_profiles")
      .update({ subscription_status: "suspended" })
      .eq("id", userId);

    if (error) throw error;

    // Log security event for user ban
    await logSecurityEvent({
      userId: req.user.id,
      category: 'ADMIN',
      action: 'USER_BAN',
      severity: 'WARNING',
      eventMessage: `User suspended by admin (Reason: ${reason || 'No reason provided'})`,
      eventSource: 'developer-portal-api.js',
      actorRole: req.profile.role,
      affectedUserId: userId,
      metadata: { reason, action: 'suspend' },
      ...extractRequestMetadata(req),
    });

    res.json({ success: true, message: "User suspended" });
  } catch (error) {
    console.error("Suspend user error:", error);

    // Log security event for failed admin action
    await logSecurityEvent({
      userId: req.user.id,
      category: 'API',
      action: 'SERVER_ERROR',
      severity: 'WARNING',
      eventMessage: `Failed to suspend user: ${error.message}`,
      eventSource: 'developer-portal-api.js',
      actorRole: req.profile.role,
      affectedUserId: req.params.userId,
      metadata: { error: error.message },
      ...extractRequestMetadata(req),
    });

    res.status(500).json({ error: "Failed to suspend user" });
  }
});

router.post("/api/developer/users/:userId/reactivate", verifyDeveloperAccess, async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await getSupabaseClient()
      .from("app_profiles")
      .update({ subscription_status: "active" })
      .eq("id", userId);

    if (error) throw error;

    // Log security event for role/status change
    await logSecurityEvent({
      userId: req.user.id,
      category: 'ADMIN',
      action: 'ROLE_CHANGE',
      severity: 'INFO',
      eventMessage: 'User reactivated by admin',
      eventSource: 'developer-portal-api.js',
      actorRole: req.profile.role,
      affectedUserId: userId,
      metadata: { action: 'reactivate', oldStatus: 'suspended', newStatus: 'active' },
      ...extractRequestMetadata(req),
    });

    res.json({ success: true, message: "User reactivated" });
  } catch (error) {
    console.error("Reactivate user error:", error);

    // Log security event for failed admin action
    await logSecurityEvent({
      userId: req.user.id,
      category: 'API',
      action: 'SERVER_ERROR',
      severity: 'WARNING',
      eventMessage: `Failed to reactivate user: ${error.message}`,
      eventSource: 'developer-portal-api.js',
      actorRole: req.profile.role,
      affectedUserId: req.params.userId,
      metadata: { error: error.message },
      ...extractRequestMetadata(req),
    });

    res.status(500).json({ error: "Failed to reactivate user" });
  }
});

// ============ CREDITS MANAGEMENT ============

/**
 * GET /api/developer/credits/stats
 * Returns credit statistics
 */
router.get("/api/developer/credits/stats", verifyDeveloperAccess, async (req, res) => {
  try {
    // Total user credits
    const { data: userCredits } = await getSupabaseClient()
      .from("app_profiles")
      .select("user_credits");

    const userCreditsTotal = (userCredits || []).reduce((sum, u) => sum + (u.user_credits || 0), 0);

    // Total developer credits
    const { data: devCredits } = await getSupabaseClient()
      .from("app_profiles")
      .select("developer_credits");

    const developerCreditsTotal = (devCredits || []).reduce((sum, u) => sum + (u.developer_credits || 0), 0);

    // Daily consumption
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: dailyUsage } = await getSupabaseClient()
      .from("usage_logs")
      .select("credits_charged")
      .gt("created_at", oneDayAgo);

    const dailyConsumption = (dailyUsage || []).reduce((sum, log) => sum + (log.credits_charged || 0), 0);

    // Average per user
    const { count: activeUsers } = await getSupabaseClient()
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .gt("created_at", oneDayAgo);

    const averagePerUser = activeUsers > 0 ? Math.round(dailyConsumption / activeUsers) : 0;

    res.json({
      userCreditsTotal,
      developerCreditsTotal,
      dailyConsumption,
      averagePerUser,
    });
  } catch (error) {
    console.error("Credits stats error:", error);
    res.status(500).json({ error: "Failed to fetch credits stats" });
  }
});

// ============ LOGIN ACTIVITY ============

/**
 * POST /api/developer/login-activity/record
 * Records a login or logout event. Any authenticated user can record their own activity.
 * Expects { user_id, user_name, user_role, session_id, event: 'login'|'logout', device_name, browser, operating_system, ip_address }
 */
router.post(
  "/api/developer/login-activity/record",
  async (req, res) => {
    try {
      const token = getBearerToken(req);
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { data: { user }, error: userError } = await getSupabaseClient().auth.getUser(token);
      if (userError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const payload = req.body || {};
      const event = payload.event || "login";
      const sessionId = payload.session_id || payload.sessionId || payload.session || null;

      if (!payload.user_id) return res.status(400).json({ error: "Missing user_id" });

      if (event === "login") {
        // If IP isn't provided, attempt to extract from request headers
        const ip = payload.ip_address || req.headers["x-forwarded-for"] || req.ip || req.socket?.remoteAddress || null;
        const activityRow = {
          user_id: payload.user_id,
          user_name: payload.user_name || user?.user_metadata?.full_name || user?.email,
          user_email: payload.user_email || user?.email || null,
          user_role: payload.user_role || "user",
          session_id: sessionId,
          login_time: new Date().toISOString(),
          device_name: payload.device_name,
          browser: payload.browser,
          operating_system: payload.operating_system,
          ip_address: ip,
          status: "active",
          metadata: payload.metadata || {},
        };

        let insertResult = await getSupabaseClient().from("login_activity").insert(activityRow);
        if (insertResult.error) {
          const message = String(insertResult.error.message || "").toLowerCase();
          const isMissingColumnError = insertResult.error.code === "42703" || message.includes("column") && message.includes("not found");

          if (isMissingColumnError) {
            const { error: retryError } = await getSupabaseClient().from("login_activity").insert({
              ...activityRow,
              user_email: undefined,
            });
            if (retryError) throw retryError;
          } else {
            throw insertResult.error;
          }
        }

        return res.json({ success: true });
      }

      if (event === "logout") {
        // find active session by session_id or user_id
        const match = sessionId ? { session_id: sessionId } : { user_id: payload.user_id, status: "active" };
        const logoutTime = new Date().toISOString();

        const { data: activeSessions, error: findErr } = await getSupabaseClient()
          .from("login_activity")
          .select("id, login_time")
          .match(match);

        if (findErr) throw findErr;

        const updates = (activeSessions || []).map((s) => ({
          id: s.id,
          logout_time: logoutTime,
          session_duration: Math.max(0, Math.floor((new Date(logoutTime) - new Date(s.login_time)) / 1000)),
          status: "logged_out",
          updated_at: new Date().toISOString(),
        }));

        for (const u of updates) {
          const { error: updErr } = await getSupabaseClient().from("login_activity").update(u).eq("id", u.id);
          if (updErr) console.warn("Failed to update logout for session", u.id, updErr.message);
        }

        return res.json({ success: true, updated: updates.length });
      }

      return res.status(400).json({ error: "Unknown event type" });
    } catch (error) {
      console.error("Record login activity error:", error);
      res.status(500).json({ error: "Failed to record login activity" });
    }
  }
);

/**
 * GET /api/developer/login-activity/active
 * Returns active sessions. Query params: page, limit
 */
router.get("/api/developer/login-activity/active", verifyDeveloperAccess, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { data, error } = await getSupabaseClient()
      .from("login_activity")
      .select("*")
      .eq("status", "active")
      .order("login_time", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // compute current duration
    const now = Date.now();
    const sessions = (data || []).map((s) => ({
      ...s,
      current_duration: Math.floor((now - new Date(s.login_time)) / 1000),
    }));

    res.json({ sessions, page, limit, total: (sessions || []).length });
  } catch (error) {
    console.error("Active sessions error:", error);
    res.status(500).json({ error: "Failed to fetch active sessions" });
  }
});

/**
 * GET /api/developer/login-activity/history
 * Returns login history. Query: user_id, search (name/role/device), from, to, page, limit
 */
router.get("/api/developer/login-activity/history", verifyDeveloperAccess, async (req, res) => {
  try {
    const { user_id, search } = req.query;
    const from = req.query.from ? new Date(req.query.from).toISOString() : null;
    const to = req.query.to ? new Date(req.query.to).toISOString() : null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    let query = getSupabaseClient().from("login_activity").select("*").order("login_time", { ascending: false });

    if (user_id) query = query.eq("user_id", user_id);
    if (from) query = query.gte("login_time", from);
    if (to) query = query.lte("login_time", to);
    if (search) {
      const s = String(search).toLowerCase();
      query = query.or(
        `user_name.ilike.%${s}%,device_name.ilike.%${s}%,browser.ilike.%${s}%,operating_system.ilike.%${s}%`
      );
    }

    const { data, error } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    res.json({ history: data || [], page, limit });
  } catch (error) {
    console.error("Login history error:", error);
    res.status(500).json({ error: "Failed to fetch login history" });
  }
});

/**
 * POST /api/developer/login-activity/logout-device
 * Body: { session_id }
 */
router.post("/api/developer/login-activity/logout-device", verifyDeveloperAccess, async (req, res) => {
  try {
    const { session_id } = req.body || {};
    if (!session_id) return res.status(400).json({ error: "Missing session_id" });

    const { data, error } = await getSupabaseClient()
      .from("login_activity")
      .select("id, login_time")
      .eq("session_id", session_id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Session not found" });

    const logoutTime = new Date().toISOString();
    const { error: upd } = await getSupabaseClient()
      .from("login_activity")
      .update({ logout_time: logoutTime, session_duration: Math.floor((new Date(logoutTime) - new Date(data.login_time)) / 1000), status: "logged_out", updated_at: new Date().toISOString() })
      .eq("id", data.id);

    if (upd) throw upd;

    res.json({ success: true });
  } catch (error) {
    console.error("Logout device error:", error);
    res.status(500).json({ error: "Failed to logout device" });
  }
});

/**
 * POST /api/developer/login-activity/logout-all
 * Body: { user_id }
 */
router.post("/api/developer/login-activity/logout-all", verifyDeveloperAccess, async (req, res) => {
  try {
    const { user_id } = req.body || {};
    if (!user_id) return res.status(400).json({ error: "Missing user_id" });

    const { data: sessions, error: fetchErr } = await getSupabaseClient()
      .from("login_activity")
      .select("id, login_time")
      .eq("user_id", user_id)
      .eq("status", "active");

    if (fetchErr) throw fetchErr;

    const logoutTime = new Date().toISOString();

    for (const s of sessions || []) {
      const duration = Math.max(0, Math.floor((new Date(logoutTime) - new Date(s.login_time)) / 1000));
      const { error: upd } = await getSupabaseClient()
        .from("login_activity")
        .update({ logout_time: logoutTime, session_duration: duration, status: "logged_out", updated_at: new Date().toISOString() })
        .eq("id", s.id);
      if (upd) console.warn("Failed to update session during logout-all", s.id, upd.message);
    }

    res.json({ success: true, updated: (sessions || []).length });
  } catch (error) {
    console.error("Logout all devices error:", error);
    res.status(500).json({ error: "Failed to logout all devices" });
  }
});

/**
 * POST /api/developer/login-activity/force-logout
 * Admin only. Body: { user_id }
 */
router.post("/api/developer/login-activity/force-logout", verifyDeveloperAccess, async (req, res) => {
  try {
    if (!["admin", "super_admin"].includes(req.profile?.role)) return res.status(403).json({ error: "Admin only" });
    const { user_id } = req.body || {};
    if (!user_id) return res.status(400).json({ error: "Missing user_id" });

    const { data: sessions, error: fetchErr } = await getSupabaseClient()
      .from("login_activity")
      .select("id, login_time")
      .eq("user_id", user_id)
      .eq("status", "active");

    if (fetchErr) throw fetchErr;

    const logoutTime = new Date().toISOString();

    for (const s of sessions || []) {
      const duration = Math.max(0, Math.floor((new Date(logoutTime) - new Date(s.login_time)) / 1000));
      const { error: upd } = await getSupabaseClient()
        .from("login_activity")
        .update({ logout_time: logoutTime, session_duration: duration, status: "logged_out", updated_at: new Date().toISOString() })
        .eq("id", s.id);
      if (upd) console.warn("Failed to update session during force-logout", s.id, upd.message);
    }

    res.json({ success: true, updated: (sessions || []).length });
  } catch (error) {
    console.error("Force logout error:", error);
    res.status(500).json({ error: "Failed to force logout user" });
  }
});

/**
 * GET /api/developer/login-activity/analytics
 * Returns totals: totalLoginsToday, activeUsers, mostActiveUser, mostUsedDevice
 */
router.get("/api/developer/login-activity/analytics", verifyDeveloperAccess, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: todayLogins } = await getSupabaseClient()
      .from("login_activity")
      .select("id, user_id, device_name")
      .gte("login_time", startOfDay.toISOString());

    const totalLoginsToday = (todayLogins || []).length;
    const activeSessionsRes = await getSupabaseClient().from("login_activity").select("user_id").eq("status", "active");
    const activeUsers = new Set((activeSessionsRes.data || []).map((s) => s.user_id)).size;

    // most active user: count logins per user
    const counts = {};
    (todayLogins || []).forEach((r) => { counts[r.user_id] = (counts[r.user_id] || 0) + 1; });
    const mostActiveUser = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || null;

    // most used device
    const deviceCounts = {};
    (todayLogins || []).forEach((r) => { if (r.device_name) deviceCounts[r.device_name] = (deviceCounts[r.device_name] || 0) + 1; });
    const mostUsedDevice = Object.keys(deviceCounts).sort((a, b) => deviceCounts[b] - deviceCounts[a])[0] || null;

    res.json({ totalLoginsToday, activeUsers, mostActiveUser, mostUsedDevice });
  } catch (error) {
    console.error("Login analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

/**
 * GET /api/developer/credits/summary
 * Returns detailed credits analytics: total distributed, daily, monthly, used, left, saved
 */
router.get("/api/developer/credits/summary", verifyDeveloperAccess, async (req, res) => {
  try {
    // Aggregate from usage_logs
    let totalDistributed = 0;
    let totalUsed = 0;
    let creditsLeft = 0;
    let overallUnused = 0;
    let savedCredits = 0;
    let daily = [];
    let monthly = [];
    let lifetime = {};
    let schemaMissing = false;

    try {
      const { data: logs, error: logsError } = await getSupabaseClient()
        .from('usage_logs')
        .select('credits_requested, credits_charged, created_at')
        .order('created_at', { ascending: true });

      if (logsError) {
        const msg = String(logsError.message || '').toLowerCase();
        if (logsError.code === '42P01' || msg.includes('does not exist') || msg.includes('could not find the table')) {
          schemaMissing = true;
        } else {
          console.warn('Failed to query usage_logs:', logsError.message);
        }
      } else {
        // totals
        totalDistributed = (logs || []).reduce((s, r) => s + (Number(r.credits_requested) || 0), 0);
        totalUsed = (logs || []).reduce((s, r) => s + (Number(r.credits_charged) || 0), 0);

        // daily for last 30 days
        const byDay = {};
        const byMonth = {};
        (logs || []).forEach((r) => {
          const d = new Date(r.created_at || Date.now());
          const day = d.toISOString().slice(0, 10);
          const month = d.toISOString().slice(0, 7);
          const given = Number(r.credits_requested) || 0;
          const used = Number(r.credits_charged) || 0;
          byDay[day] = (byDay[day] || 0) + given;
          byMonth[month] = (byMonth[month] || 0) + given;
        });

        daily = Object.keys(byDay).sort().map((k) => ({ date: k, credits: byDay[k] }));
        monthly = Object.keys(byMonth).sort().map((k) => ({ month: k, credits: byMonth[k] }));
        lifetime = { totalDistributed, totalUsed };
      }
    } catch (err) {
      console.warn('Error aggregating usage_logs:', err?.message || err);
      schemaMissing = true;
    }

    try {
      const { data: wallets, error: walletsError } = await getSupabaseClient()
        .from('tester_credit_wallets')
        .select('balance')
        .eq('wallet_type', 'tester_credits');

      if (walletsError) {
        const msg = String(walletsError.message || '').toLowerCase();
        if (walletsError.code === '42P01' || msg.includes('does not exist') || msg.includes('could not find the table')) {
          schemaMissing = true;
        } else {
          console.warn('Failed to query tester_credit_wallets:', walletsError.message);
        }
      } else {
        creditsLeft = (wallets || []).reduce((s, w) => s + (Number(w.balance) || 0), 0);
      }
    } catch (err) {
      console.warn('Error querying tester_credit_wallets:', err?.message || err);
      schemaMissing = true;
    }

    overallUnused = Math.max(0, totalDistributed - totalUsed);
    savedCredits = creditsLeft;

    const createUsageLogsSql = `CREATE TABLE IF NOT EXISTS usage_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, credits_requested numeric, credits_charged numeric, feature_key text, wallet_type text, created_at timestamptz DEFAULT now());`;
    const createWalletsSql = `CREATE TABLE IF NOT EXISTS credit_wallets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, wallet_type text, balance numeric DEFAULT 0, updated_at timestamptz DEFAULT now());`;

    res.json({
      totalDistributed,
      daily,
      monthly,
      lifetime,
      totalUsed,
      creditsLeft,
      overallUnused,
      savedCredits,
      schemaMissing,
      createUsageLogsSql: schemaMissing ? createUsageLogsSql : null,
      createWalletsSql: schemaMissing ? createWalletsSql : null,
    });
  } catch (error) {
    console.error('Credits summary error:', error);
    res.status(500).json({ error: 'Failed to fetch credits summary' });
  }
});

/**
 * GET /api/developer/costs
 * Returns expenses and cost summaries
 */
router.get("/api/developer/costs", verifyDeveloperAccess, async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    let schemaMissing = false;
    let expenses = [];
    const createExpensesTableSql = `CREATE TABLE IF NOT EXISTS expenses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), amount numeric NOT NULL, category text NOT NULL, month int NOT NULL, year int NOT NULL, notes text, created_at timestamptz NOT NULL DEFAULT now());`;

    try {
      const { data, error } = await getSupabaseClient()
        .from("expenses")
        .select("id, amount, category, month, year, notes, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        const msg = String(error.message || "").toLowerCase();
        if (error.code === "42P01" || msg.includes("does not exist") || msg.includes("could not find the table")) {
          schemaMissing = true;
        } else {
          throw error;
        }
      } else {
        expenses = data || [];
      }
    } catch (err) {
      console.warn("Failed to read expenses:", err?.message || err);
      schemaMissing = true;
    }

    const totals = {
      total: 0,
      currentMonth: 0,
      currentYear: 0,
      previousMonths: [],
      previousYears: [],
    };

    if (!schemaMissing) {
      totals.total = expenses.reduce((sum, row) => sum + Number(row.amount || 0), 0);
      totals.currentMonth = expenses
        .filter((row) => row.month === currentMonth && row.year === currentYear)
        .reduce((sum, row) => sum + Number(row.amount || 0), 0);
      totals.currentYear = expenses
        .filter((row) => row.year === currentYear)
        .reduce((sum, row) => sum + Number(row.amount || 0), 0);

      const byMonth = new Map();
      expenses.forEach((row) => {
        const key = `${row.year}-${String(row.month).padStart(2, "0")}`;
        byMonth.set(key, (byMonth.get(key) || 0) + Number(row.amount || 0));
      });

      totals.previousMonths = Array.from(byMonth.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .filter(([key]) => key !== `${currentYear}-${String(currentMonth).padStart(2, "0")}`)
        .slice(0, 6)
        .map(([key, amount]) => {
          const [year, month] = key.split("-");
          return { label: `${month}/${year}`, amount };
        });

      const byYear = new Map();
      expenses.forEach((row) => {
        byYear.set(row.year, (byYear.get(row.year) || 0) + Number(row.amount || 0));
      });

      totals.previousYears = Array.from(byYear.entries())
        .sort(([a], [b]) => Number(b) - Number(a))
        .filter(([year]) => Number(year) !== currentYear)
        .slice(0, 5)
        .map(([year, amount]) => ({ label: String(year), amount }));
    }

    res.json({
      schemaMissing,
      createExpensesTableSql: schemaMissing ? createExpensesTableSql : null,
      expenses,
      totals,
      currentMonth: { month: currentMonth, year: currentYear },
    });
  } catch (error) {
    console.error("Cost fetch error:", error);
    res.status(500).json({ error: "Failed to fetch cost data" });
  }
});

router.post("/api/developer/costs", verifyDeveloperAccess, async (req, res) => {
  try {
    const { amount, category, month, year, notes } = req.body;
    if (!amount || !category || !month || !year) {
      return res.status(400).json({ error: "Missing required expense fields" });
    }

    const payload = {
      amount: Number(amount),
      category: String(category).toUpperCase(),
      month: Number(month),
      year: Number(year),
      notes: String(notes || ""),
    };

    const { data, error } = await getSupabaseClient()
      .from("expenses")
      .insert(payload)
      .select("*");

    if (error) {
      const msg = String(error.message || "").toLowerCase();
      if (error.code === "42P01" || msg.includes("does not exist") || msg.includes("could not find the table")) {
        return res.status(500).json({ error: "Expenses table missing", schemaMissing: true, createExpensesTableSql });
      }
      throw error;
    }

    res.json({ expense: data?.[0] || null });
  } catch (error) {
    console.error("Create expense error:", error);
    res.status(500).json({ error: "Failed to create expense" });
  }
});

router.patch("/api/developer/costs/:expenseId", verifyDeveloperAccess, async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { amount, category, month, year, notes } = req.body;
    const updates = {
      ...(amount !== undefined ? { amount: Number(amount) } : {}),
      ...(category !== undefined ? { category: String(category).toUpperCase() } : {}),
      ...(month !== undefined ? { month: Number(month) } : {}),
      ...(year !== undefined ? { year: Number(year) } : {}),
      ...(notes !== undefined ? { notes: String(notes) } : {}),
    };

    const { data, error } = await getSupabaseClient()
      .from("expenses")
      .update(updates)
      .eq("id", expenseId)
      .select("*");

    if (error) {
      const msg = String(error.message || "").toLowerCase();
      if (error.code === "42P01" || msg.includes("does not exist") || msg.includes("could not find the table")) {
        return res.status(500).json({ error: "Expenses table missing" });
      }
      throw error;
    }

    res.json({ expense: data?.[0] || null });
  } catch (error) {
    console.error("Update expense error:", error);
    res.status(500).json({ error: "Failed to update expense" });
  }
});

router.delete("/api/developer/costs/:expenseId", verifyDeveloperAccess, async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { error } = await getSupabaseClient()
      .from("expenses")
      .delete()
      .eq("id", expenseId);

    if (error) {
      const msg = String(error.message || "").toLowerCase();
      if (error.code === "42P01" || msg.includes("does not exist") || msg.includes("could not find the table")) {
        return res.status(500).json({ error: "Expenses table missing" });
      }
      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete expense error:", error);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

/**
 * GET /api/developer/revenue-profit
 * Returns revenue, profit, and breakdown data
 */
router.get("/api/developer/revenue-profit", verifyDeveloperAccess, async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let revenueData = {
      currentMonth: { revenue: 0, expenses: 0, profit: 0 },
      currentYear: { revenue: 0, expenses: 0, profit: 0 },
      all: { revenue: 0, expenses: 0, profit: 0 },
      breakdown: { revenue: {}, expenses: {} },
    };

    // Fetch payments
    const { data: payments, error: paymentsError } = await getSupabaseClient()
      .from("payments")
      .select("amount, payment_date, status")
      .eq("status", "completed");

    // Fetch expenses
    const { data: expenses, error: expensesError } = await getSupabaseClient()
      .from("expenses")
      .select("amount, category, month, year");

    // Calculate revenue by month/year
    const revenueByMonth = new Map();
    const revenueByYear = new Map();
    let totalRevenue = 0;

    (payments || []).forEach((payment) => {
      const date = new Date(payment.payment_date);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const amount = Number(payment.amount || 0);

      totalRevenue += amount;

      const monthKey = `${year}-${String(month).padStart(2, "0")}`;
      revenueByMonth.set(monthKey, (revenueByMonth.get(monthKey) || 0) + amount);
      revenueByYear.set(year, (revenueByYear.get(year) || 0) + amount);

      if (month === currentMonth && year === currentYear) {
        revenueData.currentMonth.revenue += amount;
      }
      if (year === currentYear) {
        revenueData.currentYear.revenue += amount;
      }
    });

    // Calculate expenses by month/year
    const expensesByMonth = new Map();
    const expensesByYear = new Map();
    const expensesByCategory = {};
    let totalExpenses = 0;

    (expenses || []).forEach((expense) => {
      const amount = Number(expense.amount || 0);
      const category = String(expense.category || "OTHER");
      totalExpenses += amount;

      expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;

      const monthKey = `${expense.year}-${String(expense.month).padStart(2, "0")}`;
      expensesByMonth.set(monthKey, (expensesByMonth.get(monthKey) || 0) + amount);
      expensesByYear.set(expense.year, (expensesByYear.get(expense.year) || 0) + amount);

      if (expense.month === currentMonth && expense.year === currentYear) {
        revenueData.currentMonth.expenses += amount;
      }
      if (expense.year === currentYear) {
        revenueData.currentYear.expenses += amount;
      }
    });

    // Calculate profit
    revenueData.currentMonth.profit = revenueData.currentMonth.revenue - revenueData.currentMonth.expenses;
    revenueData.currentYear.profit = revenueData.currentYear.revenue - revenueData.currentYear.expenses;
    revenueData.all.revenue = totalRevenue;
    revenueData.all.expenses = totalExpenses;
    revenueData.all.profit = totalRevenue - totalExpenses;

    // Build historical data
    const historicalData = [];
    const allMonthKeys = new Set([...revenueByMonth.keys(), ...expensesByMonth.keys()]);
    Array.from(allMonthKeys)
      .sort()
      .reverse()
      .slice(0, 12)
      .forEach((key) => {
        const rev = revenueByMonth.get(key) || 0;
        const exp = expensesByMonth.get(key) || 0;
        historicalData.push({
          label: key,
          revenue: rev,
          expenses: exp,
          profit: rev - exp,
        });
      });

    // Build yearly data
    const yearlyData = [];
    Array.from(revenueByYear.keys())
      .sort((a, b) => Number(b) - Number(a))
      .forEach((year) => {
        const rev = revenueByYear.get(year) || 0;
        const exp = expensesByYear.get(year) || 0;
        yearlyData.push({
          label: String(year),
          revenue: rev,
          expenses: exp,
          profit: rev - exp,
        });
      });

    revenueData.breakdown.revenue = {
      total: totalRevenue,
      byMonth: Object.fromEntries(
        Array.from(revenueByMonth.entries()).sort(([a], [b]) => b.localeCompare(a)).slice(0, 6)
      ),
    };

    revenueData.breakdown.expenses = {
      total: totalExpenses,
      byCategory: expensesByCategory,
      byMonth: Object.fromEntries(
        Array.from(expensesByMonth.entries()).sort(([a], [b]) => b.localeCompare(a)).slice(0, 6)
      ),
    };

    res.json({
      success: true,
      data: revenueData,
      historical: historicalData,
      yearly: yearlyData,
      currentPeriod: { month: currentMonth, year: currentYear },
    });
  } catch (error) {
    console.error("Revenue/profit fetch error:", error);
    res.status(500).json({ error: "Failed to fetch revenue and profit data" });
  }
});

/**
 * GET /api/developer/snapshots
 * Returns historical monthly snapshots
 */
router.get("/api/developer/snapshots", verifyDeveloperAccess, async (req, res) => {
  try {
    const { year } = req.query;
    let query = getSupabaseClient().from("monthly_snapshots").select("*").order("year", { ascending: false }).order("month", { ascending: false });

    if (year) {
      query = query.eq("year", parseInt(year));
    }

    const { data, error } = await query.limit(24);

    if (error) throw error;

    res.json({
      snapshots: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error("Snapshots fetch error:", error);
    res.status(500).json({ error: "Failed to fetch snapshots" });
  }
});

/**
 * POST /api/developer/snapshots/store
 * Store current month's revenue/profit snapshot
 */
router.post("/api/developer/snapshots/store", verifyDeveloperAccess, async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const { totalRevenue, totalExpenses, activeUsers } = req.body;

    const netProfit = (totalRevenue || 0) - (totalExpenses || 0);

    const { data, error } = await getSupabaseClient()
      .from("monthly_snapshots")
      .upsert(
        {
          month,
          year,
          total_revenue: Number(totalRevenue || 0),
          total_expenses: Number(totalExpenses || 0),
          net_profit: netProfit,
          active_users: Number(activeUsers || 0),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "month,year" }
      )
      .select();

    if (error) throw error;

    res.json({
      success: true,
      snapshot: data?.[0] || null,
    });
  } catch (error) {
    console.error("Snapshot store error:", error);
    res.status(500).json({ error: "Failed to store snapshot" });
  }
});

/**
 * GET /api/developer/credits/transactions
 * Returns credit transaction history
 */
router.get("/api/developer/credits/transactions", verifyDeveloperAccess, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { data: transactions, error } = await getSupabaseClient()
      .from("usage_logs")
      .select("id, user_id, wallet_type, credits_charged, feature_key, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get user emails for transactions
    const userIds = [...new Set((transactions || []).map((t) => t.user_id))];
    const { data: users } = await getSupabaseClient().from("app_profiles").select("id, email").in("id", userIds);

    const userMap = {};
    (users || []).forEach((u) => {
      userMap[u.id] = u.email;
    });

    res.json({
      transactions: (transactions || []).map((t) => ({
        id: t.id,
        user: userMap[t.user_id] || "Unknown",
        type: t.wallet_type === "user_credits" ? "usage" : "admin",
        amount: t.credits_charged,
        reason: t.feature_key,
        date: new Date(t.created_at).toLocaleString(),
      })),
      page,
      limit,
    });
  } catch (error) {
    console.error("Transactions error:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// ============ TESTER CREDITS ============

router.get("/api/developer/testers", verifyDeveloperAccess, async (_req, res) => {
  try {
    const authResult = await getSupabaseClient().auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (authResult.error) throw authResult.error;

    const authUsers = authResult.data?.users || [];
    const profiles = authUsers.length ? await selectAppProfiles({ ids: authUsers.map((user) => user.id) }) : [];
    const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
    const testerUsers = authUsers.filter((authUser) => isTesterAccount(authUser, profileById.get(authUser.id)));

    const testers = await Promise.all(
      testerUsers.map(async (authUser) => {
        const profile = profileById.get(authUser.id);
        const { count: totalUsed } = await getSupabaseClient()
          .from("usage_logs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", authUser.id)
          .eq("wallet_type", "developer_credits");

        const email = profile?.email || authUser.email || "";
        const name =
          profile?.full_name ||
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          email.split("@")[0] ||
          email;

        return {
          id: authUser.id,
          email,
          name,
          currentCredits: await getDeveloperCreditBalance(authUser.id, profile),
          weeklyAllocation: 500,
          totalUsed: totalUsed || 0,
          status: profile?.subscription_status === "suspended" ? "inactive" : "active",
        };
      }),
    );

    res.json({ testers });
  } catch (error) {
    console.error("Tester list error:", error);
    res.status(500).json({ error: "Failed to fetch testers" });
  }
});

router.post("/api/developer/testers", verifyDeveloperAccess, async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const fullName = String(req.body?.fullName || "").trim();

    if (!email || !fullName) {
      return res.status(400).json({ error: "Email and full name are required" });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address" });
    }

    const { data: existingProfile, error: existingProfileError } = await getSupabaseClient()
      .from("app_profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (existingProfileError) throw existingProfileError;

    if (existingProfile) {
      await upsertTesterProfile({
        id: existingProfile.id,
        email,
        fullName,
        developerCredits: 0,
      });

      return res.json({
        success: true,
        mode: "updated",
        email,
      });
    }

    const temporaryPassword = `${Math.random().toString(36).slice(-8)}T9!`;
    const { data: createdUserData, error: createUserError } = await getSupabaseClient().auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createUserError || !createdUserData?.user) {
      throw createUserError || new Error("Failed to create tester account");
    }

    const testerId = createdUserData.user.id;

    await upsertTesterProfile({
      id: testerId,
      email,
      fullName,
      developerCredits: 0,
    });

    await getSupabaseClient().from("tester_credit_wallets").upsert(
      [
        {
          user_id: testerId,
          wallet_type: "tester_credits",
          balance: 0,
          is_unlimited: false,
        },
      ],
      { onConflict: "user_id,wallet_type" },
    );

    res.json({
      success: true,
      mode: "created",
      email,
      temporaryPassword,
    });
  } catch (error) {
    console.error("Create tester error:", error);
    res.status(500).json({ error: error?.message || "Failed to create tester" });
  }
});

router.get("/api/developer/testers/:testerId/credits", verifyTesterOrDeveloperAccess, async (req, res) => {
  try {
    const { testerId } = req.params;

    const { data: tester, error: testerError } = await getSupabaseClient()
      .from("app_profiles")
      .select("developer_credits")
      .eq("id", testerId)
      .maybeSingle();

    if (testerError || !tester) {
      return res.status(404).json({ error: "Tester not found" });
    }

    // Get current balance from credit_wallets (the source of truth)
    const currentBalance = await getDeveloperCreditBalance(testerId, tester);

    const now = Date.now();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: weeklyLogs } = await getSupabaseClient()
      .from("usage_logs")
      .select("credits_charged")
      .eq("user_id", testerId)
      .eq("wallet_type", "developer_credits")
      .gt("created_at", weekAgo);

    const { data: monthlyLogs } = await getSupabaseClient()
      .from("usage_logs")
      .select("credits_charged")
      .eq("user_id", testerId)
      .eq("wallet_type", "developer_credits")
      .gt("created_at", monthAgo);

    const weeklyUsed = (weeklyLogs || []).reduce((sum, log) => sum + Math.max(log.credits_charged || 0, 0), 0);
    const monthlyUsed = (monthlyLogs || []).reduce((sum, log) => sum + Math.max(log.credits_charged || 0, 0), 0);

    res.json({
      currentBalance: currentBalance || 0,
      weeklyAllocation: 500,
      weeklyUsed,
      monthlyUsed,
    });
  } catch (error) {
    console.error("Tester credits error:", error);
    res.status(500).json({ error: "Failed to fetch tester credits" });
  }
});

router.get("/api/developer/testers/:testerId/credits/history", verifyTesterOrDeveloperAccess, async (req, res) => {
  try {
    const { testerId } = req.params;

    const { data: transactions, error } = await getSupabaseClient()
      .from("usage_logs")
      .select("id, user_id, credits_charged, feature_key, created_at, metadata")
      .eq("user_id", testerId)
      .eq("wallet_type", "developer_credits")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({
      transactions: (transactions || []).map((log) => {
        const amount = Math.abs(log.credits_charged || 0);
        let type = "assigned";

        if (log.feature_key === "credit_refunded") {
          type = "refunded";
        } else if ((log.credits_charged || 0) > 0) {
          type = "used";
        }

        return {
          id: log.id,
          testerId: log.user_id,
          amount,
          reason: log.metadata?.reason || log.feature_key,
          assignedBy: log.metadata?.assignedBy || log.metadata?.assigned_by || "System",
          timestamp: new Date(log.created_at).toLocaleString(),
          type,
        };
      }),
    });
  } catch (error) {
    console.error("Tester credit history error:", error);
    res.status(500).json({ error: "Failed to fetch tester credit history" });
  }
});

router.post("/api/developer/testers/:testerId/credits/assign", verifyDeveloperAccess, async (req, res) => {
  try {
    const { testerId } = req.params;
    const { amount, reason } = req.body;
    const creditAmount = Number(amount);

    if (!creditAmount || creditAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const { data: authUserData, error: authUserError } = await getSupabaseClient().auth.admin.getUserById(testerId);
    if (authUserError || !authUserData?.user) {
      return res.status(404).json({ error: "Tester not found" });
    }

    const existingProfile = await selectAppProfileById(testerId);
    if (!isTesterAccount(authUserData.user, existingProfile)) {
      return res.status(404).json({ error: "Tester not found" });
    }

    const testerEmail = existingProfile?.email || authUserData.user.email || "";
    const testerName =
      existingProfile?.full_name ||
      authUserData.user.user_metadata?.full_name ||
      authUserData.user.user_metadata?.name ||
      testerEmail.split("@")[0] ||
      testerEmail;

    // Ensure tester profile exists in app_profiles before creating wallet
    if (!existingProfile) {
      console.log("Creating tester profile for:", testerEmail);
      await upsertTesterProfile({
        id: testerId,
        email: testerEmail,
        fullName: testerName,
        developerCredits: 0,
      });
    }

    // Ensure wallet exists before updating balance
    const { data: existingWallet } = await getSupabaseClient()
      .from("tester_credit_wallets")
      .select("id")
      .eq("user_id", testerId)
      .eq("wallet_type", "tester_credits")
      .maybeSingle();

    if (!existingWallet) {
      // Initialize wallet if it doesn't exist
      const { error: initError } = await getSupabaseClient()
        .from("tester_credit_wallets")
        .insert({
          user_id: testerId,
          wallet_type: "tester_credits",
          balance: 0,
          is_unlimited: false,
        });

      if (initError) {
        console.error("Wallet initialization error:", initError);
        throw initError;
      }
    }

    const newBalance = (await getDeveloperCreditBalance(testerId, existingProfile)) + creditAmount;

    const { error: walletError } = await getSupabaseClient()
      .from("tester_credit_wallets")
      .upsert(
        {
          user_id: testerId,
          wallet_type: "tester_credits",
          balance: newBalance,
          is_unlimited: false,
        },
        { onConflict: "user_id,wallet_type" },
      );

    if (walletError) {
      console.error("Wallet upsert error:", walletError);
      throw walletError;
    }

    const { error: logError } = await getSupabaseClient().from("usage_logs").insert({
      user_id: testerId,
      actor_role: req.profile.role,
      portal: "internal",
      usage_type: "test",
      wallet_type: "developer_credits",
      feature_key: "credit_added",
      credits_requested: 0,
      credits_charged: -creditAmount,
      status: "completed",
      metadata: {
        reason: reason || "Manual tester credit assignment",
        assignedBy: req.profile.email || req.user.email || "Developer",
        assigned_by: req.user.id,
      },
    });

    if (logError) {
      console.error("Usage log insert error:", logError);
      throw logError;
    }

    res.json({ success: true, newBalance });
  } catch (error) {
    console.error("Assign tester credits error:", error);
    res.status(500).json({ error: error?.message || "Failed to assign tester credits" });
  }
});

// ============ ANALYTICS ============

/**
 * GET /api/developer/analytics
 * Returns analytics data
 */
router.get("/api/developer/analytics", verifyDeveloperAccess, async (req, res) => {
  try {
    const timeRange = req.query.timeRange || "7d";

    let startDate = new Date();
    switch (timeRange) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const startDateIso = startDate.toISOString();

    // Daily Active Users
    const { count: dau } = await getSupabaseClient()
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Weekly Active Users
    const { count: wau } = await getSupabaseClient()
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .gt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Monthly Active Users
    const { count: mau } = await getSupabaseClient()
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .gt("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Retention rate (users with multiple sessions)
    const { data: allUsers } = await getSupabaseClient()
      .from("usage_logs")
      .select("user_id")
      .gt("created_at", startDateIso);

    const userCounts = {};
    (allUsers || []).forEach((log) => {
      userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
    });

    const returningUsers = Object.values(userCounts).filter((count) => count > 1).length;
    const uniqueUsers = Object.keys(userCounts).length;
    const retentionRate = uniqueUsers > 0 ? Math.round((returningUsers / uniqueUsers) * 100) : 0;

    res.json({
      dau: dau || 0,
      wau: wau || 0,
      mau: mau || 0,
      retentionRate,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ============ FEEDBACK ============

/**
 * GET /api/developer/feedback
 * Returns user feedback
 */
router.get("/api/developer/feedback", verifyDeveloperAccess, async (req, res) => {
  try {
    const { data: feedback, error } = await getSupabaseClient()
      .from("feedback_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error && error.code !== "PGRST116") throw error; // Table might not exist yet

    res.json({
      feedback: feedback || [],
    });
  } catch (error) {
    console.error("Feedback error:", error);
    res.json({ feedback: [] }); // Return empty if table doesn't exist
  }
});

// ============ ERROR LOGS ============

/**
 * GET /api/developer/error-logs
 * Returns error logs (already implemented, but included here for completeness)
 */
router.get("/api/developer/error-logs", verifyDeveloperAccess, async (req, res) => {
  try {
    const timeRange = req.query.timeRange || "all";
    const severity = req.query.severity?.split(",") || [];
    const status = req.query.status?.split(",") || [];
    const search = req.query.search || "";

    let query = getSupabaseClient().from("error_logs").select("*");

    // Apply filters
    if (timeRange !== "all") {
      const startDate = new Date();
      switch (timeRange) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "last7days":
          startDate.setDate(startDate.getDate() - 7);
          break;
      }
      query = query.gte("timestamp", startDate.toISOString());
    }

    if (severity.length > 0) {
      query = query.in("severity", severity);
    }

    if (status.length > 0) {
      query = query.in("status", status);
    }

    const { data: logs, error } = await query.order("timestamp", { ascending: false });

    if (error) throw error;

    // Client-side search filtering
    const filtered = (logs || []).filter((log) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        log.error_message?.toLowerCase().includes(searchLower) ||
        log.module?.toLowerCase().includes(searchLower) ||
        log.route?.toLowerCase().includes(searchLower)
      );
    });

    res.json({ errorLogs: filtered });
  } catch (error) {
    console.error("Error logs error:", error);
    res.status(500).json({ error: "Failed to fetch error logs" });
  }
});

// ============ SETTINGS ============

let profitDistributionSettings = {
  reservePercentage: 20,
  growthPercentage: 30,
  workerPercentage: 50,
};

/**
 * GET /api/developer/settings
 * Returns developer settings
 */
router.get("/api/developer/settings", verifyDeveloperAccess, async (req, res) => {
  try {
    // In a real app, these would be stored in a settings table
    // For now, returning defaults
    res.json({
      aiModel: "gpt-4",
      temperature: 0.7,
      maxTokens: 2000,
      creditMultiplier: 1.0,
      dailyBudget: 100000,
      enableBeta: true,
      notifyOnErrors: true,
    });
  } catch (error) {
    console.error("Settings error:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

/**
 * POST /api/developer/settings
 * Updates developer settings
 */
router.post("/api/developer/settings", verifyDeveloperAccess, async (req, res) => {
  try {
    const settings = req.body;

    // TODO: Store settings in database
    // For now, just return success

    res.json({ success: true, settings });
  } catch (error) {
    console.error("Settings update error:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

/**
 * GET /api/developer/profit-distribution/settings
 * Returns profit distribution percentages
 */
router.get("/api/developer/profit-distribution/settings", verifyDeveloperAccess, async (req, res) => {
  try {
    res.json({ success: true, settings: profitDistributionSettings });
  } catch (error) {
    console.error("Profit distribution settings error:", error);
    res.status(500).json({ error: "Failed to fetch profit distribution settings" });
  }
});

/**
 * PATCH /api/developer/profit-distribution/settings
 * Updates profit distribution percentages
 */
router.patch("/api/developer/profit-distribution/settings", verifyDeveloperAccess, async (req, res) => {
  try {
    const { reservePercentage, growthPercentage, workerPercentage } = req.body;

    const reserve = Number(reservePercentage ?? profitDistributionSettings.reservePercentage);
    const growth = Number(growthPercentage ?? profitDistributionSettings.growthPercentage);
    const worker = Number(workerPercentage ?? profitDistributionSettings.workerPercentage);
    const total = reserve + growth + worker;

    if (reserve < 0 || growth < 0 || worker < 0) {
      return res.status(400).json({ error: "Percentages must be non-negative" });
    }

    if (total !== 100) {
      return res.status(400).json({ error: "Percentages must total 100" });
    }

    profitDistributionSettings = {
      reservePercentage: reserve,
      growthPercentage: growth,
      workerPercentage: worker,
    };

    res.json({ success: true, settings: profitDistributionSettings });
  } catch (error) {
    console.error("Profit distribution settings update error:", error);
    res.status(500).json({ error: "Failed to update profit distribution settings" });
  }
});

const formatMoney = (value) => Number(Number(value).toFixed(2));

const buildDistributionRow = (label, revenue, expenses, profit, settings) => {
  const reservedAmount = formatMoney((profit * settings.reservePercentage) / 100);
  const growthAmount = formatMoney((profit * settings.growthPercentage) / 100);
  const workerAmount = formatMoney((profit * settings.workerPercentage) / 100);
  const remainder = formatMoney(profit - reservedAmount - growthAmount - workerAmount);

  return {
    label,
    revenue: formatMoney(revenue),
    expenses: formatMoney(expenses),
    profit: formatMoney(profit),
    reservedAmount,
    growthAmount,
    workerAmount,
    remainder,
  };
};

/**
 * GET /api/developer/profit-distribution
 * Returns profit distribution summary and breakdowns
 */
router.get("/api/developer/profit-distribution", verifyDeveloperAccess, async (req, res) => {
  try {
    const selectedMonth = req.query.month ? Number(req.query.month) : null;
    const selectedYear = req.query.year ? Number(req.query.year) : null;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const { data: payments } = await getSupabaseClient()
      .from("payments")
      .select("amount, payment_date, status")
      .eq("status", "completed");

    const { data: expenses } = await getSupabaseClient()
      .from("expenses")
      .select("amount, month, year");

    const revenueByMonth = new Map();
    const revenueByYear = new Map();
    const expensesByMonth = new Map();
    const expensesByYear = new Map();

    (payments || []).forEach((payment) => {
      const date = new Date(payment.payment_date);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const amount = Number(payment.amount || 0);

      const monthKey = `${year}-${String(month).padStart(2, "0")}`;
      revenueByMonth.set(monthKey, (revenueByMonth.get(monthKey) || 0) + amount);
      revenueByYear.set(year, (revenueByYear.get(year) || 0) + amount);
    });

    (expenses || []).forEach((expense) => {
      const amount = Number(expense.amount || 0);
      const monthKey = `${expense.year}-${String(expense.month).padStart(2, "0")}`;
      expensesByMonth.set(monthKey, (expensesByMonth.get(monthKey) || 0) + amount);
      expensesByYear.set(expense.year, (expensesByYear.get(expense.year) || 0) + amount);
    });

    const allMonthKeys = Array.from(new Set([...revenueByMonth.keys(), ...expensesByMonth.keys()]));
    const monthly = allMonthKeys
      .sort()
      .map((monthKey) => {
        const revenue = revenueByMonth.get(monthKey) || 0;
        const expense = expensesByMonth.get(monthKey) || 0;
        const profit = revenue - expense;
        return buildDistributionRow(monthKey, revenue, expense, profit, profitDistributionSettings);
      });

    const allYears = Array.from(new Set([...revenueByYear.keys(), ...expensesByYear.keys()]));
    const yearly = allYears
      .sort((a, b) => Number(a) - Number(b))
      .map((year) => {
        const revenue = revenueByYear.get(year) || 0;
        const expense = expensesByYear.get(year) || 0;
        const profit = revenue - expense;
        return buildDistributionRow(String(year), revenue, expense, profit, profitDistributionSettings);
      });

    const summaryMonth = selectedMonth || currentMonth;
    const summaryYear = selectedYear || currentYear;
    const summaryMonthKey = `${summaryYear}-${String(summaryMonth).padStart(2, "0")}`;
    const summaryRevenue = revenueByMonth.get(summaryMonthKey) || 0;
    const summaryExpense = expensesByMonth.get(summaryMonthKey) || 0;
    const summaryProfit = summaryRevenue - summaryExpense;
    const summary = buildDistributionRow("Current Period", summaryRevenue, summaryExpense, summaryProfit, profitDistributionSettings);

    res.json({
      success: true,
      settings: profitDistributionSettings,
      summary,
      monthly,
      yearly,
      currentPeriod: { month: currentMonth, year: currentYear },
    });
  } catch (error) {
    console.error("Profit distribution fetch error:", error);
    res.status(500).json({ error: "Failed to fetch profit distribution" });
  }
});

// ============ GROWTH ANALYTICS ============

/**
 * Helper function to calculate growth percentage
 */
const calculateGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 100) / 100;
};

/**
 * GET /api/developer/analytics/monthly-revenue-growth
 * Returns monthly revenue with growth percentages
 */
router.get("/api/developer/analytics/monthly-revenue-growth", verifyDeveloperAccess, async (req, res) => {
  try {
    const { data: payments } = await getSupabaseClient()
      .from("payments")
      .select("amount, payment_date")
      .eq("status", "completed")
      .order("payment_date", { ascending: true });

    const byMonth = new Map();
    (payments || []).forEach((p) => {
      const date = new Date(p.payment_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + Number(p.amount || 0));
    });

    const data = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue], idx, arr) => {
        const previous = idx > 0 ? arr[idx - 1][1] : revenue;
        return { month, revenue, growth: idx > 0 ? calculateGrowth(revenue, previous) : 0 };
      });

    res.json({ data, total: data.length });
  } catch (error) {
    console.error("Monthly revenue growth error:", error);
    res.status(500).json({ error: "Failed to fetch monthly revenue growth" });
  }
});

/**
 * GET /api/developer/analytics/yearly-revenue-growth
 * Returns yearly revenue with growth percentages
 */
router.get("/api/developer/analytics/yearly-revenue-growth", verifyDeveloperAccess, async (req, res) => {
  try {
    const { data: payments } = await getSupabaseClient()
      .from("payments")
      .select("amount, payment_date")
      .eq("status", "completed")
      .order("payment_date", { ascending: true });

    const byYear = new Map();
    (payments || []).forEach((p) => {
      const year = new Date(p.payment_date).getFullYear();
      byYear.set(year, (byYear.get(year) || 0) + Number(p.amount || 0));
    });

    const data = Array.from(byYear.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, revenue], idx, arr) => {
        const previous = idx > 0 ? arr[idx - 1][1] : revenue;
        return { year: String(year), revenue, growth: idx > 0 ? calculateGrowth(revenue, previous) : 0 };
      });

    res.json({ data, total: data.length });
  } catch (error) {
    console.error("Yearly revenue growth error:", error);
    res.status(500).json({ error: "Failed to fetch yearly revenue growth" });
  }
});

/**
 * GET /api/developer/analytics/monthly-profit-growth
 * Returns monthly profit with growth percentages
 */
router.get("/api/developer/analytics/monthly-profit-growth", verifyDeveloperAccess, async (req, res) => {
  try {
    const { data: payments } = await getSupabaseClient()
      .from("payments")
      .select("amount, payment_date")
      .eq("status", "completed");

    const { data: expenses } = await getSupabaseClient()
      .from("expenses")
      .select("amount, month, year");

    const revenueByMonth = new Map();
    (payments || []).forEach((p) => {
      const date = new Date(p.payment_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      revenueByMonth.set(monthKey, (revenueByMonth.get(monthKey) || 0) + Number(p.amount || 0));
    });

    const expensesByMonth = new Map();
    (expenses || []).forEach((e) => {
      const monthKey = `${e.year}-${String(e.month).padStart(2, "0")}`;
      expensesByMonth.set(monthKey, (expensesByMonth.get(monthKey) || 0) + Number(e.amount || 0));
    });

    const allMonths = new Set([...revenueByMonth.keys(), ...expensesByMonth.keys()]);
    const data = Array.from(allMonths)
      .sort()
      .map((month) => {
        const revenue = revenueByMonth.get(month) || 0;
        const expense = expensesByMonth.get(month) || 0;
        return { month, profit: revenue - expense };
      })
      .map((item, idx, arr) => {
        const previous = idx > 0 ? arr[idx - 1].profit : item.profit;
        return { ...item, growth: idx > 0 ? calculateGrowth(item.profit, previous) : 0 };
      });

    res.json({ data, total: data.length });
  } catch (error) {
    console.error("Monthly profit growth error:", error);
    res.status(500).json({ error: "Failed to fetch monthly profit growth" });
  }
});

/**
 * GET /api/developer/analytics/yearly-profit-growth
 * Returns yearly profit with growth percentages
 */
router.get("/api/developer/analytics/yearly-profit-growth", verifyDeveloperAccess, async (req, res) => {
  try {
    const { data: payments } = await getSupabaseClient()
      .from("payments")
      .select("amount, payment_date")
      .eq("status", "completed");

    const { data: expenses } = await getSupabaseClient()
      .from("expenses")
      .select("amount, month, year");

    const revenueByYear = new Map();
    (payments || []).forEach((p) => {
      const year = new Date(p.payment_date).getFullYear();
      revenueByYear.set(year, (revenueByYear.get(year) || 0) + Number(p.amount || 0));
    });

    const expensesByYear = new Map();
    (expenses || []).forEach((e) => {
      expensesByYear.set(e.year, (expensesByYear.get(e.year) || 0) + Number(e.amount || 0));
    });

    const allYears = new Set([...revenueByYear.keys(), ...expensesByYear.keys()]);
    const data = Array.from(allYears)
      .sort()
      .map((year) => {
        const revenue = revenueByYear.get(year) || 0;
        const expense = expensesByYear.get(year) || 0;
        return { year: String(year), profit: revenue - expense };
      })
      .map((item, idx, arr) => {
        const previous = idx > 0 ? arr[idx - 1].profit : item.profit;
        return { ...item, growth: idx > 0 ? calculateGrowth(item.profit, previous) : 0 };
      });

    res.json({ data, total: data.length });
  } catch (error) {
    console.error("Yearly profit growth error:", error);
    res.status(500).json({ error: "Failed to fetch yearly profit growth" });
  }
});

/**
 * GET /api/developer/analytics/monthly-users
 * Returns monthly user growth
 */
router.get("/api/developer/analytics/monthly-users", verifyDeveloperAccess, async (req, res) => {
  try {
    const { data: profiles } = await getSupabaseClient()
      .from("app_profiles")
      .select("created_at")
      .order("created_at", { ascending: true });

    const byMonth = new Map();
    let cumulativeCount = 0;
    (profiles || []).forEach((p) => {
      const date = new Date(p.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + 1);
    });

    const data = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => {
        cumulativeCount += count;
        return { month, newUsers: count, totalUsers: cumulativeCount };
      })
      .map((item, idx, arr) => {
        const previous = idx > 0 ? arr[idx - 1].totalUsers : item.totalUsers;
        return { ...item, growth: idx > 0 ? calculateGrowth(item.totalUsers, previous) : 0 };
      });

    res.json({ data, total: data.length });
  } catch (error) {
    console.error("Monthly users error:", error);
    res.status(500).json({ error: "Failed to fetch monthly user growth" });
  }
});

/**
 * GET /api/developer/analytics/yearly-users
 * Returns yearly user growth
 */
router.get("/api/developer/analytics/yearly-users", verifyDeveloperAccess, async (req, res) => {
  try {
    const { data: profiles } = await getSupabaseClient()
      .from("app_profiles")
      .select("created_at")
      .order("created_at", { ascending: true });

    const byYear = new Map();
    let cumulativeCount = 0;
    (profiles || []).forEach((p) => {
      const year = new Date(p.created_at).getFullYear();
      byYear.set(year, (byYear.get(year) || 0) + 1);
    });

    const data = Array.from(byYear.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, count]) => {
        cumulativeCount += count;
        return { year: String(year), newUsers: count, totalUsers: cumulativeCount };
      })
      .map((item, idx, arr) => {
        const previous = idx > 0 ? arr[idx - 1].totalUsers : item.totalUsers;
        return { ...item, growth: idx > 0 ? calculateGrowth(item.totalUsers, previous) : 0 };
      });

    res.json({ data, total: data.length });
  } catch (error) {
    console.error("Yearly users error:", error);
    res.status(500).json({ error: "Failed to fetch yearly user growth" });
  }
});


// ============ DEBUG ============

/**
 * GET /api/developer/debug/stats
 * Test version of dashboard stats WITHOUT authentication
 */
router.get("/api/developer/debug/stats", async (req, res) => {
  try {
    // Get total users
    const { count: totalUsers } = await getSupabaseClient()
      .from("app_profiles")
      .select("*", { count: "exact", head: true });

    // Get active users (logged in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: activeUsers } = await getSupabaseClient()
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .gt("created_at", sevenDaysAgo);

    // Get new users (registered in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: newUsers } = await getSupabaseClient()
      .from("app_profiles")
      .select("*", { count: "exact", head: true })
      .gt("created_at", oneDayAgo);

    // Get total credits consumed (sum of all usage logs)
    const { data: creditData } = await getSupabaseClient()
      .from("usage_logs")
      .select("credits_charged");

    const creditsConsumed = (creditData || []).reduce((sum, log) => sum + (log.credits_charged || 0), 0);

    // Get AI requests count
    const { count: aiRequests } = await getSupabaseClient()
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("usage_type", "production");

    res.json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      newUsers: newUsers || 0,
      creditsConsumed: creditsConsumed || 0,
      aiRequests: aiRequests || 0,
      revenue: (creditsConsumed || 0) * 0.001,
      debug: {
        message: "This is the debug stats endpoint (no auth required)",
        creditData: creditData,
      }
    });
  } catch (error) {
    console.error("Dashboard debug stats error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/developer/debug/simulate-usage
 * Simulate user video generation for testing (DEBUG ONLY)
 */
router.post("/api/developer/debug/simulate-usage", async (req, res) => {
  try {
    // Get first user from app_profiles
    let { data: profiles } = await getSupabaseClient()
      .from("app_profiles")
      .select("id")
      .eq("role", "user")
      .limit(1);

    if (!profiles || profiles.length === 0) {
      // Use any user for testing
      const { data: anyProfile } = await getSupabaseClient()
        .from("app_profiles")
        .select("id")
        .limit(1);

      if (!anyProfile || anyProfile.length === 0) {
        return res.status(400).json({ error: "No users found in database" });
      }

      profiles = anyProfile;
    }

    const userId = profiles[0].id;

    // Insert test usage logs
    const logs = [
      {
        user_id: userId,
        portal: "user",
        usage_type: "production",
        wallet_type: "user_credits",
        feature_key: "video_from_images",
        credits_requested: 50,
        credits_charged: 50,
        status: "completed",
        metadata: { imageCount: 3, videoDuration: 9, test: true },
      },
      {
        user_id: userId,
        portal: "user",
        usage_type: "production",
        wallet_type: "user_credits",
        feature_key: "cinematic_video",
        credits_requested: 75,
        credits_charged: 75,
        status: "completed",
        metadata: { imageCount: 4, videoDuration: 18, test: true },
      },
      {
        user_id: userId,
        portal: "user",
        usage_type: "production",
        wallet_type: "user_credits",
        feature_key: "video_from_images",
        credits_requested: 40,
        credits_charged: 40,
        status: "completed",
        metadata: { imageCount: 2, videoDuration: 8, test: true },
      },
    ];

    const { error: insertError } = await getSupabaseClient()
      .from("usage_logs")
      .insert(logs);

    if (insertError) throw insertError;

    res.json({
      success: true,
      message: `Added ${logs.length} test usage logs for user: ${userId}`,
      userId,
      logsAdded: logs.length,
    });
  } catch (error) {
    console.error("Simulate usage error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle testing mode for tester accounts
router.post("/api/tester/toggle-testing-mode", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.slice(7);
    const supabaseClient = getSupabaseClient();

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const enabled = req.body?.enabled !== undefined ? req.body.enabled : true;

    // Update the user's profile in app_profiles table
    const { data: profile, error: updateError } = await supabaseClient
      .from("app_profiles")
      .update({ testing_mode_enabled: enabled })
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Testing mode toggle error:", updateError);
      return res.status(500).json({ error: "Failed to update testing mode" });
    }

    res.json({
      success: true,
      testingModeEnabled: profile.testing_mode_enabled,
      message: `Testing mode ${enabled ? "enabled" : "disabled"}`,
    });
  } catch (error) {
    console.error("Toggle testing mode error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/developer/tester/bug-reports", verifyTesterOrDeveloperAccess, async (req, res) => {
  try {
    const { data, error } = await getSupabaseClient()
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch tester bug reports:", error);
      if (isMissingTableError(error)) {
        return res.status(500).json({
          error:
            "Bug reports table not found. Apply supabase/sql/2026-06-10_bug_reports_table.sql to configure the schema.",
        });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error("Bug reports fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/developer/reports", verifyTesterOrDeveloperAccess, async (req, res) => {
  try {
    const { data, error } = await getSupabaseClient()
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch developer reports:", error);
      if (isMissingTableError(error)) {
        return res.status(500).json({
          error:
            "Bug reports table not found. Apply supabase/sql/2026-06-10_bug_reports_table.sql to configure the schema.",
        });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error("Developer report fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch("/api/developer/reports/:reportId", verifyDeveloperAccess, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, comment } = req.body;

    if (!reportId) {
      return res.status(400).json({ error: "Report ID is required" });
    }

    const allowedStatuses = ["fixed", "in-review", "open", "verified"];
    const normalizedStatus = typeof status === "string" ? status : null;

    if (!normalizedStatus || !allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ error: "Invalid status provided" });
    }

    const updateFields = {
      status: normalizedStatus,
      notes: typeof comment === "string" ? comment.trim() || null : null,
      resolved_at: normalizedStatus === "fixed" ? new Date().toISOString() : null,
    };

    // If a developer performed the update, map their profile to one of the
    // fixed developer labels so the tester portal's "Developer Updates"
    // grouping shows the update under the developer who marked it done.
    const DEVELOPER_LABELS = ["RUDRIK", "MOHAN", "MANJITH", "HARSHITHA", "UDAY", "SASWATEE"];
    try {
      const profileName = String(req.profile?.full_name || req.profile?.email || "").toLowerCase();
      const userEmail = String(req.user?.email || "").toLowerCase();
      const matched = DEVELOPER_LABELS.find((lbl) => profileName.includes(lbl.toLowerCase()) || userEmail.includes(lbl.toLowerCase()));
      if (matched) {
        updateFields.assigned_developer = matched;
      }
    } catch (e) {
      // Non-fatal — if mapping fails, leave assigned_developer unchanged.
      console.warn("Developer label mapping failed:", e);
    }

    const { error } = await getSupabaseClient()
      .from("bug_reports")
      .update(updateFields)
      .eq("id", reportId);

    if (error) {
      console.error("Failed to update developer report:", error);
      if (isMissingTableError(error)) {
        return res.status(500).json({
          error:
            "Bug reports table not found. Apply supabase/sql/2026-06-10_bug_reports_table.sql to configure the schema.",
        });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Developer report update error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/developer/tester/bug-reports", verifyTesterOrDeveloperAccess, async (req, res) => {
  try {
    const {
      assignedDeveloper,
      description,
      screenshotUrl,
      testerName,
      submittedBy,
    } = req.body;

    if (!assignedDeveloper || !description || !testerName || !submittedBy) {
      return res.status(400).json({ error: "Missing required bug report fields" });
    }

    const title = description.trim().slice(0, 120) || "New Tester Bug Report";
    const attachmentUrls = screenshotUrl ? [screenshotUrl] : [];

    const { error } = await getSupabaseClient().from("bug_reports").insert({
      title,
      description,
      severity: "medium",
      component: "tester-reports",
      status: "open",
      os: "unknown",
      browser: "unknown",
      device: "desktop",
      attachment_count: attachmentUrls.length,
      attachment_urls: attachmentUrls,
      tester_name: testerName,
      assigned_developer: assignedDeveloper,
      submitted_by: submittedBy,
    });

    if (error) {
      console.error("Failed to submit tester bug report:", error);
      if (isMissingTableError(error)) {
        return res.status(500).json({
          error:
            "Bug reports table not found. Apply supabase/sql/2026-06-10_bug_reports_table.sql to configure the schema.",
        });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Tester bug report submission error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Tester actions on developer updates: close or escalate as a new bug report
router.post("/api/tester/updates/:reportId/action", verifyTesterOrDeveloperAccess, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action } = req.body;

    if (!reportId || !action) {
      return res.status(400).json({ error: "Missing reportId or action" });
    }

    // Load the original report
    const { data: original, error: fetchError } = await getSupabaseClient()
      .from("bug_reports")
      .select("*")
      .eq("id", reportId)
      .maybeSingle();

    if (fetchError) {
      console.error("Failed to fetch original report:", fetchError);
      if (isMissingTableError(fetchError)) {
        return res.status(500).json({ error: "Bug reports table not found" });
      }
      return res.status(500).json({ error: fetchError.message });
    }

    if (!original) {
      return res.status(404).json({ error: "Original report not found" });
    }

    const testerId = req.profile?.id || null;

    if (action === "closed") {
      const { error: updateError } = await getSupabaseClient()
        .from("bug_reports")
        .update({ status: "fixed", resolved_at: new Date().toISOString() })
        .eq("id", reportId);

      if (updateError) {
        console.error("Failed to mark report closed:", updateError);
        return res.status(500).json({ error: updateError.message });
      }

      return res.json({ success: true });
    }

    if (action === "bug_report") {
      // Create a follow-up bug report assigned to the same developer
      const newTitle = `Follow-up: ${original.title || 'Developer update'}`;
      const newDescription = original.notes || original.description || "Follow-up reported by tester";

      const insertObj = {
        title: newTitle,
        description: newDescription,
        severity: original.severity || "medium",
        component: original.component || "tester-feedback",
        status: "open",
        os: original.os || "unknown",
        browser: original.browser || "unknown",
        device: original.device || "unknown",
        attachment_count: 0,
        attachment_urls: [],
        tester_name: req.profile?.full_name || req.profile?.email || "Tester",
        assigned_developer: original.assigned_developer || "RUDRIK",
        submitted_by: testerId,
      };

      const { error: insertError } = await getSupabaseClient().from("bug_reports").insert(insertObj);
      if (insertError) {
        console.error("Failed to insert follow-up report:", insertError);
        return res.status(500).json({ error: insertError.message });
      }

      return res.json({ success: true });
    }

    if (action === "resend") {
      // Resend the report to developer by setting status back to "open"
      const { error: updateError } = await getSupabaseClient()
        .from("bug_reports")
        .update({ status: "open" })
        .eq("id", reportId);

      if (updateError) {
        console.error("Failed to resend report to developer:", updateError);
        return res.status(500).json({ error: updateError.message });
      }

      return res.json({ success: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (error) {
    console.error("Tester update action error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
