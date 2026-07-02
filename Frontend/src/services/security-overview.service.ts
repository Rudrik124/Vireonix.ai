import { supabase } from '../../../Backend/supabase';

export interface SecurityOverviewMetrics {
  totalUsers: number;
  activeUsersToday: number;
  videosGeneratedToday: number;
  filesUploadedToday: number;
  blockedPromptsToday: number;
  blockedUploadsToday: number;
  failedLoginsToday: number;
  securityAlertsTodayCount: number;
  loadingState: {
    isLoading: boolean;
    error: string | null;
  };
}

const getStartOfDay = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return start.toISOString();
};

export async function fetchSecurityOverviewMetrics(): Promise<SecurityOverviewMetrics> {
  try {
    const startOfDay = getStartOfDay();
    const today = new Date().toISOString();

    // Fetch total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('app_profiles')
      .select('id', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Fetch active users today (from login_activity)
    const { count: activeUsersToday, error: activeError } = await supabase
      .from('login_activity')
      .select('user_id', { count: 'exact' })
      .gte('login_time', startOfDay)
      .lte('login_time', today);

    if (activeError) throw activeError;

    // Fetch videos generated today (from usage_logs with video-related features)
    const { count: videosGeneratedToday, error: videosError } = await supabase
      .from('usage_logs')
      .select('id', { count: 'exact' })
      .or(`feature_key.eq.video_generation,feature_key.eq.video_from_images,feature_key.eq.runway_request`)
      .gte('created_at', startOfDay)
      .lte('created_at', today);

    if (videosError) throw videosError;

    // Fetch security events for various metrics
    const { data: securityEvents, error: securityError } = await supabase
      .from('security_events')
      .select('action, severity')
      .gte('created_at', startOfDay)
      .lte('created_at', today);

    if (securityError) throw securityError;

    // Calculate metrics from security events
    const filesUploadedToday = securityEvents?.filter(
      (e) => e.action === 'UPLOAD_SUCCESS'
    ).length || 0;

    const blockedPromptsToday = securityEvents?.filter(
      (e) => e.action === 'PROMPT_BLOCKED'
    ).length || 0;

    const blockedUploadsToday = securityEvents?.filter(
      (e) => e.action === 'UPLOAD_REJECTED'
    ).length || 0;

    const failedLoginsToday = securityEvents?.filter(
      (e) => e.action === 'LOGIN_FAILURE'
    ).length || 0;

    const securityAlertsTodayCount = securityEvents?.filter(
      (e) => e.severity === 'CRITICAL'
    ).length || 0;

    return {
      totalUsers: totalUsers || 0,
      activeUsersToday: activeUsersToday || 0,
      videosGeneratedToday: videosGeneratedToday || 0,
      filesUploadedToday,
      blockedPromptsToday,
      blockedUploadsToday,
      failedLoginsToday,
      securityAlertsTodayCount,
      loadingState: {
        isLoading: false,
        error: null,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch metrics';
    console.error('Error fetching security overview metrics:', error);

    return {
      totalUsers: 0,
      activeUsersToday: 0,
      videosGeneratedToday: 0,
      filesUploadedToday: 0,
      blockedPromptsToday: 0,
      blockedUploadsToday: 0,
      failedLoginsToday: 0,
      securityAlertsTodayCount: 0,
      loadingState: {
        isLoading: false,
        error: errorMessage,
      },
    };
  }
}

/**
 * Set up real-time listeners for security overview metrics
 * Calls the callback whenever security_events or login_activity changes
 */
export function subscribeToSecurityOverviewUpdates(
  callback: (metrics: Partial<SecurityOverviewMetrics>) => void
): () => void {
  if (!supabase) {
    console.warn('Supabase not configured');
    return () => { };
  }

  const channels: any[] = [];

  // Subscribe to security_events changes
  const securityChannel = supabase.channel('security_overview_events');
  securityChannel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'security_events',
    },
    (payload) => {
      // Trigger a refresh by fetching updated metrics
      fetchSecurityOverviewMetrics().then((metrics) => {
        callback({
          blockedPromptsToday: metrics.blockedPromptsToday,
          blockedUploadsToday: metrics.blockedUploadsToday,
          failedLoginsToday: metrics.failedLoginsToday,
          securityAlertsTodayCount: metrics.securityAlertsTodayCount,
          filesUploadedToday: metrics.filesUploadedToday,
        });
      });
    }
  );

  securityChannel.subscribe();
  channels.push(securityChannel);

  // Subscribe to login_activity changes
  const loginChannel = supabase.channel('security_overview_logins');
  loginChannel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'login_activity',
    },
    (payload) => {
      // Trigger a refresh
      fetchSecurityOverviewMetrics().then((metrics) => {
        callback({
          activeUsersToday: metrics.activeUsersToday,
        });
      });
    }
  );

  loginChannel.subscribe();
  channels.push(loginChannel);

  // Subscribe to usage_logs changes for videos
  const usageChannel = supabase.channel('security_overview_usage');
  usageChannel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'usage_logs',
    },
    (payload) => {
      // Trigger a refresh
      fetchSecurityOverviewMetrics().then((metrics) => {
        callback({
          videosGeneratedToday: metrics.videosGeneratedToday,
        });
      });
    }
  );

  usageChannel.subscribe();
  channels.push(usageChannel);

  // Return cleanup function
  return () => {
    channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
  };
}
