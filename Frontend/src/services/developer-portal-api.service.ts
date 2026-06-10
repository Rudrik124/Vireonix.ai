import { supabase } from '../lib/supabase';
import { buildApiUrl } from '../lib/api';

/**
 * Base fetch function for developer portal APIs
 */
function readStoredAccessToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  const parseStoredToken = (rawValue: string | null) => {
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
  };

  const legacyToken = parseStoredToken(localStorage.getItem('sb-auth-token'));
  if (legacyToken) {
    return legacyToken;
  }

  for (let i = 0; i < localStorage.length; i++) {
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

async function callDeveloperAPI(endpoint: string, options?: RequestInit) {
  let token: string | null = null;

  try {
    if (typeof window !== 'undefined') {
      // Prefer the live session token from Supabase.
      if (typeof supabase !== 'undefined' && supabase) {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token ?? null;
      }

      if (!token) {
        token = readStoredAccessToken();
      }
    }
  } catch (e) {
    console.warn('Unable to read auth token from storage/supabase', e);
  }

  const response = await fetch(buildApiUrl(`/api/developer${endpoint}`), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'API Error' }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json();
}

// ============ DASHBOARD ============

export async function fetchDashboardStats() {
  return callDeveloperAPI('/dashboard/stats');
}

// ============ USERS ============

export async function fetchUsers(page = 1, limit = 20) {
  return callDeveloperAPI(`/users?page=${page}&limit=${limit}`);
}

export async function fetchUserDetail(userId: string) {
  return callDeveloperAPI(`/users/${userId}`);
}

export async function addCreditsToUser(userId: string, amount: number, reason: string) {
  return callDeveloperAPI(`/users/${userId}/credits/add`, {
    method: 'POST',
    body: JSON.stringify({ amount, reason }),
  });
}

export async function suspendUser(userId: string) {
  return callDeveloperAPI(`/users/${userId}/suspend`, {
    method: 'POST',
  });
}

export async function reactivateUser(userId: string) {
  return callDeveloperAPI(`/users/${userId}/reactivate`, {
    method: 'POST',
  });
}

// ============ CREDITS ============

export async function fetchCreditsStats() {
  return callDeveloperAPI('/credits/stats');
}

export async function fetchCreditTransactions(page = 1, limit = 50) {
  return callDeveloperAPI(`/credits/transactions?page=${page}&limit=${limit}`);
}

// ============ ANALYTICS ============

export async function fetchAnalytics(timeRange = '7d') {
  return callDeveloperAPI(`/analytics?timeRange=${timeRange}`);
}

// ============ FEEDBACK ============

export async function fetchFeedback() {
  return callDeveloperAPI('/feedback');
}

// ============ ERROR LOGS ============

export async function fetchErrorLogsAPI(filters?: {
  timeRange?: string;
  severity?: string[];
  status?: string[];
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.timeRange) params.append('timeRange', filters.timeRange);
  if (filters?.severity) params.append('severity', filters.severity.join(','));
  if (filters?.status) params.append('status', filters.status.join(','));
  if (filters?.search) params.append('search', filters.search);

  return callDeveloperAPI(`/error-logs?${params.toString()}`);
}

// ============ SETTINGS ============

export async function fetchDeveloperSettings() {
  return callDeveloperAPI('/settings');
}

export async function saveDeveloperSettings(settings: any) {
  return callDeveloperAPI('/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  });
}

// ============ TESTER CREDIT MANAGEMENT ============

export async function fetchTesters() {
  return callDeveloperAPI('/testers');
}

export async function createTester(email: string, fullName: string) {
  return callDeveloperAPI('/testers', {
    method: 'POST',
    body: JSON.stringify({ email, fullName }),
  });
}

export async function fetchTesterCredits(testerId: string) {
  return callDeveloperAPI(`/testers/${testerId}/credits`);
}

export async function assignCreditsToTester(testerId: string, amount: number, reason: string) {
  return callDeveloperAPI(`/testers/${testerId}/credits/assign`, {
    method: 'POST',
    body: JSON.stringify({ amount, reason }),
  });
}

export async function fetchTesterCreditHistory(testerId: string) {
  return callDeveloperAPI(`/testers/${testerId}/credits/history`);
}

export async function fetchDeveloperTesterAssignments() {
  return callDeveloperAPI('/developer/tester-assignments');
}

/**
 * Hook to get the auth token from localStorage
 */
export function useAuthToken() {
  return readStoredAccessToken();
}
