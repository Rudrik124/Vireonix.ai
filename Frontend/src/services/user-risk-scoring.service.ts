import { supabase } from "@/lib/supabase";
import { formatDateRange } from '../lib/api';

export interface UserRiskScore {
  user_id: string;
  total_score: number;
  category: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS';
  event_count: number;
  critical_events: number;
  warning_events: number;
  last_incident: string;
  threat_history: Array<{ event_type: string; severity: string; timestamp: string }>;
}

export interface RiskScoringMetrics {
  safeUsers: number;
  suspiciousUsers: number;
  dangerousUsers: number;
  averageRiskScore: number;
  totalUsersAnalyzed: number;
}

export interface RiskEvent {
  user_id: string;
  category: string;
  action: string;
  severity: string;
  created_at: string;
  event_message: string;
  metadata?: any;
}

export interface RiskBreakdown {
  category: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS';
  userCount: number;
  percentage: number;
  users: UserRiskScore[];
}

// Risk scoring weights
const SEVERITY_WEIGHTS = {
  INFO: 1,
  WARNING: 5,
  CRITICAL: 15,
};

const CATEGORY_WEIGHTS: Record<string, number> = {
  AUTH: 3,
  PROMPT: 2,
  FILE_UPLOAD: 3,
  RATE_LIMIT: 4,
  API: 2,
  SECURITY_ALERT: 8,
};

export async function calculateUserRiskScores(
  startDate?: string,
  endDate?: string
): Promise<{ scores: UserRiskScore[]; error: string | null }> {
  try {
    const { start, end } = formatDateRange(startDate, endDate);

    // Get all security events
    const { data: events, error: eventsError } = await supabase
      .from('security_events')
      .select('user_id, category, action, severity, created_at, event_message, metadata')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false });

    if (eventsError) throw eventsError;

    // Calculate risk scores per user
    const userRiskMap = new Map<string, {
      total_score: number;
      events: RiskEvent[];
      critical_count: number;
      warning_count: number;
      last_incident: string;
    }>();

    (events || []).forEach((event: any) => {
      if (!event.user_id) return;

      const existing = userRiskMap.get(event.user_id) || {
        total_score: 0,
        events: [] as any[],
        critical_count: 0,
        warning_count: 0,
        last_incident: event.created_at,
      };

      const severityWeight = SEVERITY_WEIGHTS[event.severity as keyof typeof SEVERITY_WEIGHTS] || 1;
      const categoryWeight = CATEGORY_WEIGHTS[event.category] || 1;
      const score = severityWeight * categoryWeight;

      existing.total_score += score;
      existing.events.push({
        user_id: event.user_id,
        category: event.category,
        action: event.action,
        severity: event.severity,
        created_at: event.created_at,
        event_message: event.event_message,
        metadata: event.metadata,
      });

      if (event.severity === 'CRITICAL') existing.critical_count += 1;
      if (event.severity === 'WARNING') existing.warning_count += 1;

      userRiskMap.set(event.user_id, existing);
    });

    // Convert to UserRiskScore array with categories
    const scores: UserRiskScore[] = Array.from(userRiskMap.entries())
      .map(([user_id, data]) => {
        let category: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS';
        if (data.total_score > 50) {
          category = 'DANGEROUS';
        } else if (data.total_score > 20) {
          category = 'SUSPICIOUS';
        } else {
          category = 'SAFE';
        }

        return {
          user_id,
          total_score: data.total_score,
          category,
          event_count: data.events.length,
          critical_events: data.critical_count,
          warning_events: data.warning_count,
          last_incident: data.last_incident,
          threat_history: data.events.map((e) => ({
            event_type: e.action,
            severity: e.severity,
            timestamp: e.created_at,
          })),
        };
      })
      .sort((a, b) => b.total_score - a.total_score);

    return { scores, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to calculate user risk scores';
    return { scores: [], error: errorMessage };
  }
}

export async function fetchRiskScoringMetrics(
  startDate?: string,
  endDate?: string
): Promise<{ metrics: RiskScoringMetrics; error: string | null }> {
  try {
    const { scores, error: scoresError } = await calculateUserRiskScores(startDate, endDate);
    if (scoresError) throw new Error(scoresError);

    const safeCount = scores.filter((s) => s.category === 'SAFE').length;
    const suspiciousCount = scores.filter((s) => s.category === 'SUSPICIOUS').length;
    const dangerousCount = scores.filter((s) => s.category === 'DANGEROUS').length;
    const totalScore = scores.reduce((sum, s) => sum + s.total_score, 0);
    const averageScore = scores.length > 0 ? totalScore / scores.length : 0;

    const metrics: RiskScoringMetrics = {
      safeUsers: safeCount,
      suspiciousUsers: suspiciousCount,
      dangerousUsers: dangerousCount,
      averageRiskScore: averageScore,
      totalUsersAnalyzed: scores.length,
    };

    return { metrics, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch risk scoring metrics';
    return {
      metrics: {
        safeUsers: 0,
        suspiciousUsers: 0,
        dangerousUsers: 0,
        averageRiskScore: 0,
        totalUsersAnalyzed: 0,
      },
      error: errorMessage,
    };
  }
}

export async function fetchRiskBreakdown(
  startDate?: string,
  endDate?: string
): Promise<{ breakdown: RiskBreakdown[]; error: string | null }> {
  try {
    const { scores, error: scoresError } = await calculateUserRiskScores(startDate, endDate);
    if (scoresError) throw new Error(scoresError);

    const categories: Array<'SAFE' | 'SUSPICIOUS' | 'DANGEROUS'> = ['SAFE', 'SUSPICIOUS', 'DANGEROUS'];

    const breakdown: RiskBreakdown[] = categories.map((category) => {
      const categoryUsers = scores.filter((s) => s.category === category);
      return {
        category,
        userCount: categoryUsers.length,
        percentage: scores.length > 0 ? (categoryUsers.length / scores.length) * 100 : 0,
        users: categoryUsers.slice(0, 50), // Top 50 per category
      };
    });

    return { breakdown, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch risk breakdown';
    return { breakdown: [], error: errorMessage };
  }
}

export async function fetchHighRiskUsers(
  limit: number = 20,
  startDate?: string,
  endDate?: string
): Promise<{ users: UserRiskScore[]; error: string | null }> {
  try {
    const { scores, error: scoresError } = await calculateUserRiskScores(startDate, endDate);
    if (scoresError) throw new Error(scoresError);

    const highRiskUsers = scores
      .filter((s) => s.category === 'DANGEROUS')
      .slice(0, limit);

    return { users: highRiskUsers, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch high risk users';
    return { users: [], error: errorMessage };
  }
}

export async function fetchUserRiskTrends(days: number = 7): Promise<{
  trends: Array<{ date: string; safeCount: number; suspiciousCount: number; dangerousCount: number }>;
  error: string | null;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: events, error: eventsError } = await supabase
      .from('security_events')
      .select('user_id, severity, created_at, category')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (eventsError) throw eventsError;

    // Group by date and calculate daily risk distribution
    const dateMap = new Map<string, Map<string, number>>();

    (events || []).forEach((event: any) => {
      if (!event.user_id) return;

      const date = new Date(event.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      if (!dateMap.has(date)) {
        dateMap.set(date, new Map());
      }

      const userScoreMap = dateMap.get(date)!;
      const severityWeight = SEVERITY_WEIGHTS[event.severity as keyof typeof SEVERITY_WEIGHTS] || 1;
      const categoryWeight = CATEGORY_WEIGHTS[event.category] || 1;
      const score = (userScoreMap.get(event.user_id) || 0) + severityWeight * categoryWeight;
      userScoreMap.set(event.user_id, score);
    });

    const trends = Array.from(dateMap.entries())
      .map(([date, userScores]) => {
        let safeCount = 0;
        let suspiciousCount = 0;
        let dangerousCount = 0;

        Array.from(userScores.values()).forEach((score) => {
          if (score > 50) dangerousCount += 1;
          else if (score > 20) suspiciousCount += 1;
          else safeCount += 1;
        });

        return {
          date,
          safeCount,
          suspiciousCount,
          dangerousCount,
        };
      });

    return { trends, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user risk trends';
    return { trends: [], error: errorMessage };
  }
}
