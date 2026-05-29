import { useAuth } from '../app/context/auth-context';

/**
 * Base fetch function for developer portal APIs
 */
async function callDeveloperAPI(endpoint: string, options?: RequestInit) {
  const token = localStorage.getItem('sb-auth-token');
  
  const response = await fetch(`/api/developer${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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
  // Get token from localStorage or from Supabase session
  return localStorage.getItem('sb-auth-token');
}
