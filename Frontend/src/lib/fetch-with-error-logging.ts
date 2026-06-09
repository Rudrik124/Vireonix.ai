import { logApiError } from '../lib/error-logger';
import { useAuth } from '../app/context/auth-context';

/**
 * Wrapper for fetch requests that automatically logs API errors
 */
export async function fetchWithErrorLogging(
  endpoint: string,
  options?: RequestInit,
  userId?: string
): Promise<Response> {
  const method = options?.method || 'GET';

  try {
    const response = await fetch(endpoint, options);

    // Log error responses
    if (!response.ok) {
      const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      await logApiError(endpoint, method, response.status, errorMessage, userId);
    }

    return response;
  } catch (error: any) {
    // Log network errors
    const errorMessage = error?.message || 'Network error';
    await logApiError(endpoint, method, 0, errorMessage, userId);
    throw error;
  }
}

/**
 * Hook to get a wrapped fetch function that logs errors automatically
 */
export function useFetchWithErrorLogging() {
  const { profile } = useAuth();

  return async (endpoint: string, options?: RequestInit) => {
    return fetchWithErrorLogging(endpoint, options, profile?.id);
  };
}
