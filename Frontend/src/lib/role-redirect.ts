/**
 * Centralized helper for role-based redirects after authentication.
 * Privileged accounts (Security, Developer, Tester) always route to their respective dashboards.
 * Normal users route to a fallback URL (e.g., authRedirectUrl) or a default home route.
 */
export function getRoleRedirectUrl(
  userEmail: string | undefined | null,
  profile: any,
  fallbackUrl: string = '/home'
): string {
  const email = (userEmail || '').toLowerCase();
  const role = (profile?.role || '').toLowerCase();
  const access = Array.isArray(profile?.portalAccess) ? profile.portalAccess.map((a: string) => a.toLowerCase()) : [];

  // Priority 1: Security
  if (email === 'security@veytrix.ai' || role === 'security' || access.includes('security')) {
    return '/security';
  }

  // Priority 2: Developer
  if (email === 'developer@veytrix.ai' || role === 'developer' || access.includes('developer')) {
    return '/developer/dashboard';
  }

  // Priority 3: Tester
  if (
    email === 'tester@veytrix.ai' ||
    email === 'tester@veeytrix.ai' ||
    role === 'tester' ||
    access.includes('tester')
  ) {
    return '/tester/dashboard';
  }

  // Admin fallback
  if (email === 'admin@veytrix.ai' || role === 'admin' || role === 'super_admin' || access.includes('admin')) {
    return '/admin/dashboard';
  }

  // Priority 4: Normal User
  // If they have a valid fallback (authRedirectUrl), redirect them there.
  if (fallbackUrl && fallbackUrl !== '/') {
    return fallbackUrl;
  }

  // Final Default for normal users if no fallback
  return '/video-type';
}
