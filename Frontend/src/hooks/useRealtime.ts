import { useEffect, useMemo, useState, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSubscription {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  callback: (payload: any) => void;
}

/**
 * Hook for Supabase Realtime subscriptions
 * Automatically handles connection/disconnection
 */
export function useRealtime(subscriptions: RealtimeSubscription[]) {
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase client not available');
      return;
    }

    const setupSubscriptions = async () => {
      try {
        // Clean up existing channels
        channelsRef.current.forEach((channel) => {
          supabase.removeChannel(channel);
        });
        channelsRef.current = [];

        // Create new subscriptions
        for (const sub of subscriptions) {
          const channel = supabase.channel(`${sub.table}-${Date.now()}`);

          channel.on(
            'postgres_changes',
            {
              event: sub.event || '*',
              schema: 'public',
              table: sub.table,
              filter: sub.filter,
            },
            (payload) => {
              sub.callback(payload);
            }
          );

          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
            } else if (status === 'CHANNEL_ERROR') {
              console.error(`Channel error for ${sub.table}`);
            }
          });

          channelsRef.current.push(channel);
        }
      } catch (error) {
        console.error('Failed to setup Realtime subscriptions:', error);
      }
    };

    setupSubscriptions();

    return () => {
      // Cleanup on unmount
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
      setIsConnected(false);
    };
  }, [subscriptions]);

  return {
    isConnected,
  };
}

/**
 * Hook for listening to usage_logs changes (for analytics)
 */
export function useUsageLogsRealtime(callback: (payload: any) => void) {
  const subscriptions = useMemo(
    () => [
      {
        table: 'usage_logs',
        event: 'INSERT' as const,
        callback,
      },
    ],
    [callback]
  );

  return useRealtime(subscriptions);
}

/**
 * Hook for listening to error_logs changes
 */
export function useErrorLogsRealtime(callback: (payload: any) => void) {
  const subscriptions = useMemo(
    () => [
      {
        table: 'error_logs',
        event: 'INSERT' as const,
        callback,
      },
    ],
    [callback]
  );

  return useRealtime(subscriptions);
}

/**
 * Hook for listening to app_profiles changes (new users)
 */
export function useNewUsersRealtime(callback: (payload: any) => void) {
  const subscriptions = useMemo(
    () => [
      {
        table: 'app_profiles',
        event: 'INSERT' as const,
        callback,
      },
    ],
    [callback]
  );

  return useRealtime(subscriptions);
}

/**
 * Hook for listening to credit_wallets changes
 */
export function useCreditWalletsRealtime(callback: (payload: any) => void) {
  const subscriptions = useMemo(
    () => [
      {
        table: 'credit_wallets',
        event: 'UPDATE' as const,
        callback,
      },
    ],
    [callback]
  );

  return useRealtime(subscriptions);
}
