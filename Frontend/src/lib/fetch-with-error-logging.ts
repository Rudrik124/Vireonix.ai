import { logApiError } from '../lib/error-logger';
import { useAuth } from '../app/context/auth-context';
import { supabase } from "@/lib/supabase";

function parseStoredToken(rawValue: string | null) {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (typeof parsed === 'string') {
      return parsed;
    }

    return parsed?.access_token || parsed?.currentSession?.access_token || parsed?.session?.access_token || null;
  } catch {
    return rawValue;
  }
}

function readStoredAccessToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  const authToken = localStorage.getItem('__VIREONIX_AUTH_TOKEN');
  if (authToken) {
    return authToken;
  }

  const legacyToken = parseStoredToken(localStorage.getItem('sb-auth-token'));
  if (legacyToken) {
    return legacyToken;
  }

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
      const parsedToken = parseStoredToken(localStorage.getItem(key));
      if (parsedToken) {
        return parsedToken;
      }
    }
  }

  return null;
}

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

// Lightweight wrapper that includes auth token from local session when available
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  let token = (window as any).__VIREONIX_AUTH_TOKEN || null;

  if (!token && typeof window !== 'undefined') {
    try {
      const sessionResult = await supabase?.auth.getSession();
      token = sessionResult?.data?.session?.access_token || token;
      if (token) {
        (window as any).__VIREONIX_AUTH_TOKEN = token;
        localStorage.setItem('__VIREONIX_AUTH_TOKEN', token);
      }
    } catch (error) {
      console.warn('Unable to read token from Supabase session', error);
    }

    if (!token) {
      token = readStoredAccessToken();
      if (token) {
        (window as any).__VIREONIX_AUTH_TOKEN = token;
      }
    }
  }

  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  if (options.body && !headers.has('Content-Type') && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  return fetchWithErrorLogging(endpoint, { ...options, headers });
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
