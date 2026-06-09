import { createClient } from "@supabase/supabase-js";
import express from "express";

const router = express.Router();

// Lazy initialize Supabase (gets env vars from server.js)
let supabase = null;

const getSupabaseClient = () => {
  if (!supabase) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
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

  if (email === "developer@veytrix.ai") {
    return { id: user.id, email: user.email, role: "developer" };
  }

  if (email === "tester@veeytrix.ai" || email === "tester@veytrix.ai") {
    return { id: user.id, email: user.email, role: "tester" };
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
    .from("credit_wallets")
    .select("balance")
    .eq("user_id", userId)
    .eq("wallet_type", "developer_credits")
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

// ============ DASHBOARD STATS ============

/**
 * GET /api/developer/dashboard/stats
 * Returns dashboard statistics
 */
router.get("/api/developer/dashboard/stats", verifyDeveloperAccess, async (req, res) => {
  try {
    // Get total users from auth
    let totalUsers = 0;
    try {
      const authResult = await getSupabaseClient().auth.admin.listUsers({ perPage: 1 });
      totalUsers = authResult.data?.total || 0;
    } catch (err) {
      console.warn("Failed to get auth users count, falling back to app_profiles:", err.message);
      const { count } = await getSupabaseClient()
        .from("app_profiles")
        .select("*", { count: "exact", head: true });
      totalUsers = count || 0;
    }

    // Get active users (distinct users with activity in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: activeUserLogs } = await getSupabaseClient()
      .from("usage_logs")
      .select("user_id")
      .gt("created_at", sevenDaysAgo)
      .neq("user_id", null);

    const activeUsers = new Set((activeUserLogs || []).map(log => log.user_id)).size;

    // Get new users (registered in last 7 days)
    const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: newUsers } = await getSupabaseClient()
      .from("app_profiles")
      .select("*", { count: "exact", head: true })
      .gt("created_at", sevenDaysAgoDate);

    // Get total credits consumed (sum of all usage logs)
    const { data: creditData } = await getSupabaseClient()
      .from("usage_logs")
      .select("credits_charged");

    const creditsConsumed = (creditData || []).reduce((sum, log) => sum + (log.credits_charged || 0), 0);

    // Get AI requests count (distinct usage logs)
    const { data: aiRequestsData } = await getSupabaseClient()
      .from("usage_logs")
      .select("id")
      .eq("usage_type", "production");

    const aiRequests = (aiRequestsData || []).length;

    res.json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      newUsers: newUsers || 0,
      creditsConsumed: creditsConsumed || 0,
      aiRequests: aiRequests || 0,
      revenue: (creditsConsumed || 0) * 0.001, // Example: $0.001 per credit
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
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

    res.json({ success: true, newBalance });
  } catch (error) {
    console.error("Add credits error:", error);
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

    const { error } = await getSupabaseClient()
      .from("app_profiles")
      .update({ subscription_status: "suspended" })
      .eq("id", userId);

    if (error) throw error;

    res.json({ success: true, message: "User suspended" });
  } catch (error) {
    console.error("Suspend user error:", error);
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

    res.json({ success: true, message: "User reactivated" });
  } catch (error) {
    console.error("Reactivate user error:", error);
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

    await getSupabaseClient().from("credit_wallets").upsert(
      [
        {
          user_id: testerId,
          wallet_type: "user_credits",
          balance: 0,
          is_unlimited: false,
        },
        {
          user_id: testerId,
          wallet_type: "developer_credits",
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
      .from("credit_wallets")
      .select("id")
      .eq("user_id", testerId)
      .eq("wallet_type", "developer_credits")
      .maybeSingle();

    if (!existingWallet) {
      // Initialize wallet if it doesn't exist
      const { error: initError } = await getSupabaseClient()
        .from("credit_wallets")
        .insert({
          user_id: testerId,
          wallet_type: "developer_credits",
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
      .from("credit_wallets")
      .upsert(
        {
          user_id: testerId,
          wallet_type: "developer_credits",
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

export default router;
