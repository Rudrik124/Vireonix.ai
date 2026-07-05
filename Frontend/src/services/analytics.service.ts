import { supabase } from "@/lib/supabase";

/**
 * Analytics Service - Reusable tracking for all user actions
 * All methods automatically log to database for real-time dashboards
 */

export interface UsageContext {
  portal?: 'user' | 'internal';
  usageType?: 'production' | 'test';
  metadata?: Record<string, any>;
}

/**
 * Track a feature usage event
 */
export async function trackUsage(
  featureKey: string,
  creditsRequested: number = 0,
  context: UsageContext = {}
) {
  try {
    if (!supabase) return null;

    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return null;

    const { data, error } = await supabase
      .from('usage_logs')
      .insert({
        user_id: session.session.user.id,
        portal: context.portal || 'user',
        usage_type: context.usageType || 'production',
        wallet_type: 'user_credits',
        feature_key: featureKey,
        credits_requested: creditsRequested,
        credits_charged: 0,
        status: 'started',
        actor_role: 'user',
        metadata: context.metadata || {},
      })
      .select('id')
      .maybeSingle();

    if (error) {
      console.warn('Failed to track usage:', error);
      return null;
    }

    return data?.id;
  } catch (error) {
    console.error('Track usage error:', error);
    return null;
  }
}

/**
 * Finalize a usage event (mark as completed/failed)
 */
export async function finalizeUsage(
  usageLogId: string,
  status: 'completed' | 'failed' | 'cancelled' = 'completed',
  creditsCharged: number = 0,
  metadata: Record<string, any> = {}
) {
  try {
    if (!supabase || !usageLogId) return;

    const { error } = await supabase
      .from('usage_logs')
      .update({
        status,
        credits_charged: creditsCharged,
        metadata,
      })
      .eq('id', usageLogId);

    if (error) {
      console.warn('Failed to finalize usage:', error);
    }
  } catch (error) {
    console.error('Finalize usage error:', error);
  }
}

/**
 * Track user credit transaction
 */
export async function trackCreditTransaction(
  amount: number,
  type: 'deducted' | 'added' | 'refunded',
  reason: string = '',
  metadata: Record<string, any> = {}
) {
  try {
    if (!supabase) return null;

    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return null;

    const { data, error } = await supabase
      .from('usage_logs')
      .insert({
        user_id: session.session.user.id,
        portal: 'user',
        usage_type: 'production',
        wallet_type: 'user_credits',
        feature_key: `credit_${type}`,
        credits_requested: type === 'deducted' ? amount : 0,
        credits_charged: type === 'deducted' ? amount : -amount,
        status: 'completed',
        actor_role: 'user',
        metadata: {
          reason,
          ...metadata,
        },
      })
      .select('id')
      .maybeSingle();

    if (error) {
      console.warn('Failed to track credit transaction:', error);
      return null;
    }

    return data?.id;
  } catch (error) {
    console.error('Track credit transaction error:', error);
    return null;
  }
}

/**
 * Track an error
 */
export async function trackError(
  errorMessage: string,
  module: string,
  route: string,
  severity: 'critical' | 'high' | 'medium' | 'low' = 'medium',
  metadata: Record<string, any> = {}
) {
  try {
    if (!supabase) return null;

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id || null;

    const { data, error } = await supabase
      .from('error_logs')
      .insert({
        error_message: errorMessage,
        module,
        route,
        user_id: userId,
        severity,
        status: 'open',
        additional_context: metadata,
      })
      .select('id')
      .maybeSingle();

    if (error) {
      console.warn('Failed to track error:', error);
      return null;
    }

    return data?.id;
  } catch (error) {
    console.error('Track error error:', error);
    return null;
  }
}

/**
 * Track user feedback
 */
export async function trackFeedback(
  title: string,
  description: string,
  type: 'bug' | 'feature_request' | 'feedback' = 'feedback',
  metadata: Record<string, any> = {}
) {
  try {
    if (!supabase) return null;

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id || null;

    // Check if feedback_logs table exists, otherwise create entry in metadata
    try {
      const { data, error } = await supabase
        .from('feedback_logs')
        .insert({
          user_id: userId,
          title,
          description,
          type,
          metadata,
        })
        .select('id')
        .maybeSingle();

      if (error && error.code === 'PGRST116') {
        // Table doesn't exist - log as usage instead
        return await trackUsage('user_feedback', 0, {
          metadata: { title, description, type, ...metadata },
        });
      }

      if (error) {
        console.warn('Failed to track feedback:', error);
        return null;
      }

      return data?.id;
    } catch (e) {
      // Fallback: use usage_logs
      return await trackUsage('user_feedback', 0, {
        metadata: { title, description, type, ...metadata },
      });
    }
  } catch (error) {
    console.error('Track feedback error:', error);
    return null;
  }
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  try {
    if (!supabase) return null;

    // Get total users
    const { count: totalUsers } = await supabase
      .from('app_profiles')
      .select('*', { count: 'exact', head: true });

    // Get active users (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: activeUsers } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', sevenDaysAgo);

    // Get new users (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: newUsers } = await supabase
      .from('app_profiles')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', oneDayAgo);

    // Get total credits consumed
    const { data: creditData } = await supabase
      .from('usage_logs')
      .select('credits_charged');

    const creditsConsumed = (creditData || []).reduce(
      (sum: any, log: any) => sum + (log.credits_charged || 0),
      0
    );

    // Get AI requests count
    const { count: aiRequests } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('usage_type', 'production');

    // Estimate revenue ($0.001 per credit)
    const revenue = creditsConsumed * 0.001;

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      newUsers: newUsers || 0,
      creditsConsumed: creditsConsumed || 0,
      aiRequests: aiRequests || 0,
      revenue: revenue || 0,
    };
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return null;
  }
}

/**
 * Get analytics data
 */
export async function getAnalytics(timeRange: '7d' | '30d' | '90d' = '7d') {
  try {
    if (!supabase) return null;

    let startDate = new Date();
    switch (timeRange) {
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '7d':
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const startDateIso = startDate.toISOString();

    // Daily Active Users
    const { count: dau } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Weekly Active Users
    const { count: wau } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Monthly Active Users
    const { count: mau } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Get unique users and retention rate
    const { data: allUsers } = await supabase
      .from('usage_logs')
      .select('user_id')
      .gt('created_at', startDateIso);

    const userCounts: Record<string, number> = {};
    (allUsers || []).forEach((log: any) => {
      userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
    });

    const returningUsers = Object.values(userCounts).filter((count) => count > 1).length;
    const uniqueUsers = Object.keys(userCounts).length;
    const retentionRate = uniqueUsers > 0 ? Math.round((returningUsers / uniqueUsers) * 100) : 0;

    // Get feature usage
    const { data: featureUsage } = await supabase
      .from('usage_logs')
      .select('feature_key, credits_charged, created_at')
      .gt('created_at', startDateIso)
      .order('created_at', { ascending: false });

    // Aggregate by feature
    const featureStats: Record<string, { count: number; creditsUsed: number }> = {};
    (featureUsage || []).forEach((log: any) => {
      if (!featureStats[log.feature_key]) {
        featureStats[log.feature_key] = { count: 0, creditsUsed: 0 };
      }
      featureStats[log.feature_key].count += 1;
      featureStats[log.feature_key].creditsUsed += log.credits_charged || 0;
    });

    return {
      dau: dau || 0,
      wau: wau || 0,
      mau: mau || 0,
      retentionRate,
      uniqueUsers,
      featureUsage: featureStats,
      timeRange,
    };
  } catch (error) {
    console.error('Get analytics error:', error);
    return null;
  }
}

/**
 * Get user list with pagination
 */
export async function getUserList(page: number = 1, limit: number = 20) {
  try {
    if (!supabase) return null;

    const offset = (page - 1) * limit;

    const { data: users, count: totalCount } = await supabase
      .from('app_profiles')
      .select(
        'id, email, full_name, role, user_credits, developer_credits, created_at, subscription_status, portal_access',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return {
      users: (users || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.full_name || 'N/A',
        role: u.role,
        status: u.subscription_status === 'active' ? 'active' : 'suspended',
        credits: u.user_credits || 0,
        portalAccess: u.portal_access || [],
        joinDate: new Date(u.created_at).toLocaleDateString(),
      })),
      totalCount: totalCount || 0,
      page,
      limit,
      totalPages: Math.ceil((totalCount || 0) / limit),
    };
  } catch (error) {
    console.error('Get user list error:', error);
    return null;
  }
}

/**
 * Get error logs
 */
export async function getErrorLogs(
  limit: number = 50,
  severity?: string[],
  status?: string[]
) {
  try {
    if (!supabase) return null;

    let query = supabase.from('error_logs').select('*').order('created_at', { ascending: false });

    if (severity && severity.length > 0) {
      query = query.in('severity', severity);
    }

    if (status && status.length > 0) {
      query = query.in('status', status);
    }

    const { data: logs, error } = await query.limit(limit);

    if (error) {
      console.warn('Failed to fetch error logs:', error);
      return [];
    }

    return logs || [];
  } catch (error) {
    console.error('Get error logs error:', error);
    return [];
  }
}

/**
 * Get feedback submissions
 */
export async function getFeedback(limit: number = 50) {
  try {
    if (!supabase) return [];

    try {
      const { data: feedback, error } = await supabase
        .from('feedback_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error && error.code === 'PGRST116') {
        // Table doesn't exist, return empty
        return [];
      }

      if (error) {
        console.warn('Failed to fetch feedback:', error);
        return [];
      }

      return feedback || [];
    } catch (e) {
      // Fallback: try to get from usage_logs
      const { data: logs } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('feature_key', 'user_feedback')
        .order('created_at', { ascending: false })
        .limit(limit);

      return (logs || []).map((log: any) => ({
        id: log.id,
        title: log.metadata?.title || 'Feedback',
        description: log.metadata?.description || '',
        type: log.metadata?.type || 'feedback',
        user_id: log.user_id,
        created_at: log.created_at,
      }));
    }
  } catch (error) {
    console.error('Get feedback error:', error);
    return [];
  }
}

/**
 * Get credit transactions
 */
export async function getCreditTransactions(limit: number = 50) {
  try {
    if (!supabase) return [];

    const { data: logs, error } = await supabase
      .from('usage_logs')
      .select('*')
      .in('feature_key', ['credit_deducted', 'credit_added', 'credit_refunded'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Failed to fetch credit transactions:', error);
      return [];
    }

    return logs || [];
  } catch (error) {
    console.error('Get credit transactions error:', error);
    return [];
  }
}
