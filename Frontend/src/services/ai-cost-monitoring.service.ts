import { supabase } from "@/lib/supabase";
import { formatDateRange } from '../lib/api';

export interface AICostMetrics {
  runwayRequestsToday: number;
  estimatedCostToday: number;
  costPerUser: number;
  costPerFeature: number;
  totalCost: number;
  averageRequestCost: number;
}

export interface AICostEvent {
  id: string;
  user_id: string | null;
  action: AIFeatureType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  created_at: string;
  event_message: string;
  metadata?: {
    feature?: string;
    model?: string;
    tokens_used?: number;
    cost?: number;
    duration_ms?: number;
    status?: string;
  };
}

export type AIFeatureType =
  | 'VIDEO_GENERATION'
  | 'IMAGE_GENERATION'
  | 'TEXT_ANALYSIS'
  | 'VOICEOVER_GENERATION'
  | 'SUBTITLE_GENERATION'
  | 'SCENE_ANALYSIS'
  | 'EFFECT_RENDERING'
  | 'AI_EDIT';

export interface AICostFilterOptions {
  startDate?: string;
  endDate?: string;
  userId?: string;
  feature?: AIFeatureType;
  limit?: number;
  offset?: number;
}

export interface FeatureCost {
  feature: string;
  count: number;
  totalCost: number;
  averageCost: number;
}

export interface CostTrend {
  date: string;
  requests: number;
  cost: number;
  avgCost: number;
}

export async function fetchAICostMetrics(
  startDate?: string,
  endDate?: string
): Promise<{ metrics: AICostMetrics; error: string | null }> {
  try {
    const { start, end } = formatDateRange(startDate, endDate);

    // Get today's date range for "today" metrics
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    // Total requests today
    const { count: todayCount } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'AI_COST')
      .gte('created_at', todayStart)
      .lt('created_at', todayEnd);

    // Runway requests today
    const runwayRequestsToday = todayCount || 0;

    // Total cost today
    const { data: todayData } = await supabase
      .from('security_events')
      .select('metadata')
      .eq('category', 'AI_COST')
      .gte('created_at', todayStart)
      .lt('created_at', todayEnd);

    const estimatedCostToday = (todayData || []).reduce((sum: any, event: any) => {
      return sum + ((event.metadata as any)?.cost || 0);
    }, 0);

    // Total requests in period
    const { count: totalCount } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'AI_COST')
      .gte('created_at', start)
      .lte('created_at', end);

    // Total cost in period
    const { data: periodData } = await supabase
      .from('security_events')
      .select('metadata')
      .eq('category', 'AI_COST')
      .gte('created_at', start)
      .lte('created_at', end);

    const totalCost = (periodData || []).reduce((sum: any, event: any) => {
      return sum + ((event.metadata as any)?.cost || 0);
    }, 0);

    // Get unique users count
    const { data: usersData } = await supabase
      .from('security_events')
      .select('user_id')
      .eq('category', 'AI_COST')
      .gte('created_at', start)
      .lte('created_at', end);

    const uniqueUsers = new Set((usersData || []).map((u: any) => u.user_id).filter(Boolean)).size;
    const costPerUser = uniqueUsers > 0 ? totalCost / uniqueUsers : 0;

    // Get features count
    const { data: featuresData } = await supabase
      .from('security_events')
      .select('metadata')
      .eq('category', 'AI_COST')
      .gte('created_at', start)
      .lte('created_at', end);

    const featureSet = new Set(
      (featuresData || []).map((f: any) => (f.metadata as any)?.feature || 'unknown').filter(Boolean)
    );
    const costPerFeature = featureSet.size > 0 ? totalCost / featureSet.size : 0;

    const metrics: AICostMetrics = {
      runwayRequestsToday,
      estimatedCostToday,
      costPerUser,
      costPerFeature,
      totalCost,
      averageRequestCost: totalCount ? totalCost / totalCount : 0,
    };

    return { metrics, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch AI cost metrics';
    return {
      metrics: {
        runwayRequestsToday: 0,
        estimatedCostToday: 0,
        costPerUser: 0,
        costPerFeature: 0,
        totalCost: 0,
        averageRequestCost: 0,
      },
      error: errorMessage,
    };
  }
}

export async function fetchAICostEvents(
  filters: AICostFilterOptions
): Promise<{ events: AICostEvent[]; total: number; error: string | null }> {
  try {
    const { start, end } = formatDateRange(filters.startDate, filters.endDate);
    const offset = filters.offset || 0;
    const limit = filters.limit || 25;

    let query = supabase
      .from('security_events')
      .select('*', { count: 'exact' })
      .eq('category', 'AI_COST')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.feature) {
      query = query.eq('action', filters.feature);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      events: (data || []) as AICostEvent[],
      total: count || 0,
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch AI cost events';
    return { events: [], total: 0, error: errorMessage };
  }
}

export async function fetchFeatureCostBreakdown(
  startDate?: string,
  endDate?: string
): Promise<{ breakdown: FeatureCost[]; error: string | null }> {
  try {
    const { start, end } = formatDateRange(startDate, endDate);

    const { data, error } = await supabase
      .from('security_events')
      .select('action, metadata')
      .eq('category', 'AI_COST')
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) throw error;

    const featureMap = new Map<string, { count: number; costs: number[] }>();

    (data || []).forEach((event: any) => {
      const feature = event.action || 'unknown';
      const cost = (event.metadata as any)?.cost || 0;

      const existing = featureMap.get(feature) || { count: 0, costs: [] };
      existing.count += 1;
      existing.costs.push(cost);

      featureMap.set(feature, existing);
    });

    const breakdown: FeatureCost[] = Array.from(featureMap.entries())
      .map(([feature, { count, costs }]) => ({
        feature,
        count,
        totalCost: costs.reduce((a, b) => a + b, 0),
        averageCost: costs.reduce((a, b) => a + b, 0) / count,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);

    return { breakdown, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch feature cost breakdown';
    return { breakdown: [], error: errorMessage };
  }
}

export async function fetchCostTrends(
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  days: number = 7
): Promise<{ trends: CostTrend[]; error: string | null }> {
  try {
    const startDate = new Date();
    const periodDays = period === 'daily' ? days : period === 'weekly' ? days * 7 : days * 30;
    startDate.setDate(startDate.getDate() - periodDays);

    const { data, error } = await supabase
      .from('security_events')
      .select('created_at, metadata')
      .eq('category', 'AI_COST')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    const trendMap = new Map<string, { requests: number; costs: number[] }>();

    (data || []).forEach((event: any) => {
      let dateKey: string;

      if (period === 'daily') {
        dateKey = new Date(event.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      } else if (period === 'weekly') {
        const date = new Date(event.created_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        dateKey = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else {
        dateKey = new Date(event.created_at).toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        });
      }

      const existing = trendMap.get(dateKey) || { requests: 0, costs: [] };
      existing.requests += 1;
      existing.costs.push((event.metadata as any)?.cost || 0);

      trendMap.set(dateKey, existing);
    });

    const trends: CostTrend[] = Array.from(trendMap.entries())
      .map(([date, { requests, costs }]) => {
        const totalCost = costs.reduce((a, b) => a + b, 0);
        return {
          date,
          requests,
          cost: totalCost,
          avgCost: totalCost / requests,
        };
      });

    return { trends, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cost trends';
    return { trends: [], error: errorMessage };
  }
}

export function subscribeToAICostEvents(callback: (event: AICostEvent) => void): () => void {
  const subscription = supabase
    .channel('ai_cost_events')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'security_events',
        filter: `category=eq.AI_COST`,
      },
      (payload: any) => {
        callback(payload.new as AICostEvent);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
