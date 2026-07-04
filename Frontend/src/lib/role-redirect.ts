/**
 * Centralized helper for role-based redirects after authentication.
 * Normal users route to a fallback URL (e.g., authRedirectUrl) or a default home route.
 */
export function getRoleRedirectUrl(
  userEmail: string | undefined | null,
  profile: any,
  fallbackUrl: string = '/home'
): string {
  const email = (userEmail || '').toLowerCase();

  // Priority 1: Security
  if (email === 'security@veytrix.ai') {
    return '/security';
  }

  // Priority 2: Developer
  if (email === 'developer@veytrix.ai') {
    return '/developer/dashboard';
  }

  // Priority 3: Tester
  if (
    email === 'tester@veytrix.ai' ||
    email === 'tester@veeytrix.ai'
  ) {
    return '/tester/dashboard';
  }

  // Admin fallback
  if (email === 'admin@veytrix.ai') {
    return '/admin/dashboard';
  }

  // Priority 4: Normal User
  // If they have a valid fallback (authRedirectUrl), redirect them there.
  if (fallbackUrl && fallbackUrl !== '/') {
    return fallbackUrl;
  }

  // Final Default for normal users if no fallback
  return '/home';
}

