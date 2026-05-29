import { useEffect } from 'react';
import { useAuth } from '../app/context/auth-context';
import { setupGlobalErrorHandlers } from '../lib/error-logger';

/**
 * Hook to setup global error logging
 * Should be called once in the root component or main app
 */
export function useErrorLogging() {
  const { profile } = useAuth();

  useEffect(() => {
    const userId = profile?.id;
    setupGlobalErrorHandlers(userId);
  }, [profile?.id]);
}
