import type { AppProfile, AppRole, PortalId, UsageType } from "../types/auth";

const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  super_admin: [
    "admin.portal.access",
    "admin.users.manage",
    "admin.credentials.manage",
    "admin.logs.view",
    "developer.portal.access",
    "developer.access.view",
    "developer.logs.view",
    "developer.testing.run",
    "tester.portal.access",
    "user.portal.access",
    "billing.bypass",
    "billing.view",
  ],
  admin: [
    "admin.portal.access",
    "admin.users.manage",
    "admin.credentials.manage",
    "admin.logs.view",
    "developer.portal.access",
    "developer.access.view",
    "developer.logs.view",
    "developer.testing.run",
    "tester.portal.access",
    "user.portal.access",
    "billing.bypass",
    "billing.view",
  ],
  developer: [
    "developer.portal.access",
    "developer.access.view",
    "developer.logs.view",
    "developer.testing.run",
    "tester.portal.access",
    "user.portal.access",
    "billing.view",
  ],
  tester: [
    "tester.portal.access",
    "user.portal.access",
    "developer.testing.run",
  ],
  user: [
    "user.portal.access",
  ],
};

const PORTAL_ACCESS_MAP: Record<AppRole, PortalId[]> = {
  super_admin: ["developer", "admin", "tester", "user"],
  admin: ["developer", "admin", "tester", "user"],
  developer: ["developer", "tester", "user"],
  tester: ["tester", "user"],
  user: ["user"],
};

export function getRolePermissions(role: AppRole) {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function getPortalAccessForRole(role: AppRole): PortalId[] {
  return PORTAL_ACCESS_MAP[role] ?? ["user"];
}

export function hasPermission(profile: AppProfile, permission: string): boolean {
  return profile.permissions.includes(permission);
}

export function canAccessPortal(profile: AppProfile | null, portal: PortalId) {
  if (!profile) {
    return false;
  }

  return profile.portalAccess.includes(portal);
}

export function isInternalRole(role: AppRole) {
  return role !== "user";
}

export function canBypassCreditChecks(profile: AppProfile | null, usageType: UsageType) {
  if (!profile) {
    return false;
  }

  return usageType === "test" && (profile.bypassCreditChecks || isInternalRole(profile.role));
}
