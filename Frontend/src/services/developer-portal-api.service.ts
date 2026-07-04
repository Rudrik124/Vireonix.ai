import { supabase } from "@/lib/supabase";
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

  const urlToFetch = buildApiUrl(`/api/developer${endpoint}`);
  const response = await fetch(urlToFetch, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText} when fetching ${urlToFetch}`);
  }

  return response.json();
}

// ============ DASHBOARD ============

export async function fetchDashboardStats() {
  return callDeveloperAPI('/dashboard/stats');
}

export async function fetchCloudflarePortalOverview() {
  return callDeveloperAPI('/cloudflare/overview');
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

export async function fetchCreditsSummary() {
  return callDeveloperAPI('/credits/summary');
}

export async function fetchCostExpenses() {
  return callDeveloperAPI('/costs');
}

export async function createCostExpense(expense: { amount: number; category: string; month: number; year: number; notes?: string }) {
  return callDeveloperAPI('/costs', {
    method: 'POST',
    body: JSON.stringify(expense),
  });
}

export async function updateCostExpense(expenseId: string, expense: { amount?: number; category?: string; month?: number; year?: number; notes?: string }) {
  return callDeveloperAPI(`/costs/${expenseId}`, {
    method: 'PATCH',
    body: JSON.stringify(expense),
  });
}

export async function deleteCostExpense(expenseId: string) {
  return callDeveloperAPI(`/costs/${expenseId}`, {
    method: 'DELETE',
  });
}

export async function fetchRevenueProfit() {
  return callDeveloperAPI('/revenue-profit');
}

export async function fetchProfitDistributionSettings() {
  return callDeveloperAPI('/profit-distribution/settings');
}

export async function updateProfitDistributionSettings(settings: { reservePercentage: number; growthPercentage: number; workerPercentage: number }) {
  return callDeveloperAPI('/profit-distribution/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export async function fetchProfitDistribution(month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.append('month', String(month));
  if (year) params.append('year', String(year));
  const query = params.toString() ? `?${params.toString()}` : '';
  return callDeveloperAPI(`/profit-distribution${query}`);
}

export async function fetchMonthlySnapshots(year?: number) {
  const params = year ? `?year=${year}` : '';
  return callDeveloperAPI(`/snapshots${params}`);
}

export async function storeMonthlySnapshot(data: { totalRevenue: number; totalExpenses: number; activeUsers?: number }) {
  return callDeveloperAPI('/snapshots/store', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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

export async function fetchTesterBugReports() {
  return callDeveloperAPI('/tester/bug-reports');
}

export async function submitTesterBugReport(report: {
  assignedDeveloper: string;
  description: string;
  screenshotUrl?: string | null;
  testerName: string;
  submittedBy: string;
}) {
  return callDeveloperAPI('/tester/bug-reports', {
    method: 'POST',
    body: JSON.stringify(report),
  });
}

export async function fetchDeveloperReports() {
  return callDeveloperAPI('/reports');
}

export async function updateDeveloperReport(reportId: string, payload: { status: string; comment?: string | null }) {
  return callDeveloperAPI(`/reports/${reportId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// Call tester-specific endpoints (same auth handling as developer API)
async function callTesterAPI(endpoint: string, options?: RequestInit) {
  let token: string | null = null;

  try {
    if (typeof window !== 'undefined') {
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

  const response = await fetch(buildApiUrl(`/api${endpoint}`), {
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

export async function submitTesterUpdateAction(reportId: string, action: 'closed' | 'bug_report' | 'resend') {
  return callTesterAPI(`/tester/updates/${reportId}/action`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
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
