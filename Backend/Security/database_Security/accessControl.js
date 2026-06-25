/**
 * Access Control Module
 * 
 * Purpose: Control who can access what data.
 * 
 * Checks:
 * - User can access only own data
 * - Admin can access admin resources
 * - Anonymous users cannot access private data
 * 
 * Prevents unauthorized data access
 */

class AccessControl {
  constructor(options = {}) {
    this.roleHierarchy = options.roleHierarchy || this.getDefaultRoles();
    this.permissions = options.permissions || this.getDefaultPermissions();
    this.stats = {
      accessChecks: 0,
      allowedAccess: 0,
      deniedAccess: 0,
      denialReasons: {}
    };
  }

  /**
   * Get default role hierarchy
   */
  getDefaultRoles() {
    return {
      'anonymous': { level: 0, canRead: ['public'] },
      'user': { level: 1, canRead: ['public', 'own'], canWrite: ['own'] },
      'moderator': { level: 5, canRead: ['public', 'own', 'flagged'], canWrite: ['own', 'flagged'] },
      'admin': { level: 100, canRead: ['all'], canWrite: ['all'], canDelete: ['all'] }
    };
  }

  /**
   * Get default permissions
   */
  getDefaultPermissions() {
    return {
      // User data
      'users': {
        read: { public: false, own: true, admin: true },
        write: { own: true, admin: true },
        delete: { admin: true }
      },
      // Generated videos
      'videos': {
        read: { public: false, own: true, admin: true },
        write: { own: true, admin: true },
        delete: { own: true, admin: true }
      },
      // Prompts
      'prompts': {
        read: { public: false, own: true, admin: true },
        write: { own: true, admin: true },
        delete: { own: true, admin: true }
      },
      // Audit logs
      'audit_logs': {
        read: { admin: true },
        write: { system: true },
        delete: { system: true }
      },
      // Subscription data
      'subscriptions': {
        read: { own: true, admin: true },
        write: { admin: true },
        delete: { admin: true }
      },
      // Usage statistics
      'usage_stats': {
        read: { own: true, admin: true },
        write: { system: true },
        delete: { admin: true }
      },
      // Admin data
      'admin_data': {
        read: { admin: true },
        write: { admin: true },
        delete: { admin: true }
      }
    };
  }

  /**
   * Check if user can access resource
   */
  checkAccess(user, resource, operation = 'read', targetUserId = null) {
    this.stats.accessChecks++;

    // Validate inputs
    if (!user || !resource || !operation) {
      this.stats.deniedAccess++;
      this.trackDenial('INVALID_REQUEST');
      return {
        allowed: false,
        reason: 'Invalid request parameters',
        resource: resource,
        operation: operation
      };
    }

    const userRole = user.role || 'anonymous';
    const roleInfo = this.roleHierarchy[userRole];

    if (!roleInfo) {
      this.stats.deniedAccess++;
      this.trackDenial('INVALID_ROLE');
      return {
        allowed: false,
        reason: `Unknown role: ${userRole}`,
        resource: resource
      };
    }

    // Check if resource exists in permissions
    const resourcePerms = this.permissions[resource];
    if (!resourcePerms) {
      this.stats.deniedAccess++;
      this.trackDenial('RESOURCE_NOT_FOUND');
      return {
        allowed: false,
        reason: `Unknown resource: ${resource}`,
        resource: resource
      };
    }

    // Get operation permissions
    const operationPerms = resourcePerms[operation];
    if (!operationPerms) {
      this.stats.deniedAccess++;
      this.trackDenial('INVALID_OPERATION');
      return {
        allowed: false,
        reason: `Invalid operation: ${operation}`,
        resource: resource,
        operation: operation
      };
    }

    // Check permission for role
    const allowed = this.hasPermission(user, operationPerms, targetUserId);

    if (!allowed) {
      this.stats.deniedAccess++;
      this.trackDenial('PERMISSION_DENIED');
      return {
        allowed: false,
        reason: `${userRole} cannot ${operation} ${resource}`,
        resource: resource,
        operation: operation,
        userRole: userRole
      };
    }

    this.stats.allowedAccess++;
    return {
      allowed: true,
      reason: 'Access granted',
      resource: resource,
      operation: operation,
      userRole: userRole,
      userId: user.id
    };
  }

  /**
   * Check if user has permission
   */
  hasPermission(user, permissions, targetUserId = null) {
    const userRole = user.role || 'anonymous';
    const userId = user.id;

    // Admin has all permissions
    if (userRole === 'admin') {
      return permissions.admin === true;
    }

    // Check if user can access own data
    if (permissions.own && userId === targetUserId) {
      return true;
    }

    // Check if user can access public data
    if (permissions.public) {
      return true;
    }

    // Check other role-specific permissions
    if (permissions[userRole]) {
      return true;
    }

    return false;
  }

  /**
   * Get user permissions
   */
  getUserPermissions(user) {
    const userRole = user.role || 'anonymous';
    const roleInfo = this.roleHierarchy[userRole];

    if (!roleInfo) {
      return null;
    }

    const permissions = {
      role: userRole,
      level: roleInfo.level,
      canRead: roleInfo.canRead || [],
      canWrite: roleInfo.canWrite || [],
      canDelete: roleInfo.canDelete || [],
      resources: []
    };

    // Map resource access
    for (const [resource, perms] of Object.entries(this.permissions)) {
      const access = {
        resource: resource,
        read: this.canPerform(user, resource, 'read', user.id),
        write: this.canPerform(user, resource, 'write', user.id),
        delete: this.canPerform(user, resource, 'delete', user.id)
      };
      permissions.resources.push(access);
    }

    return permissions;
  }

  /**
   * Check if user can perform operation
   */
  canPerform(user, resource, operation, targetUserId = null) {
    const check = this.checkAccess(user, resource, operation, targetUserId);
    return check.allowed;
  }

  /**
   * Add role
   */
  addRole(roleName, roleConfig) {
    if (!roleName || !roleConfig) return false;
    this.roleHierarchy[roleName] = roleConfig;
    return true;
  }

  /**
   * Remove role
   */
  removeRole(roleName) {
    if (!roleName || !this.roleHierarchy[roleName]) return false;
    delete this.roleHierarchy[roleName];
    return true;
  }

  /**
   * Add permission
   */
  addPermission(resource, operation, rolePermissions) {
    if (!resource || !operation) return false;

    if (!this.permissions[resource]) {
      this.permissions[resource] = {};
    }

    this.permissions[resource][operation] = rolePermissions;
    return true;
  }

  /**
   * Track denial reason
   */
  trackDenial(reason) {
    this.stats.denialReasons[reason] = (this.stats.denialReasons[reason] || 0) + 1;
  }

  /**
   * Get access statistics
   */
  getStats() {
    return {
      ...this.stats,
      allowanceRate: this.stats.accessChecks > 0
        ? ((this.stats.allowedAccess / this.stats.accessChecks) * 100).toFixed(2) + '%'
        : '0%',
      denialRate: this.stats.accessChecks > 0
        ? ((this.stats.deniedAccess / this.stats.accessChecks) * 100).toFixed(2) + '%'
        : '0%',
      topDenialReasons: Object.entries(this.stats.denialReasons)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .reduce((acc, [reason, count]) => ({ ...acc, [reason]: count }), {})
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      accessChecks: 0,
      allowedAccess: 0,
      deniedAccess: 0,
      denialReasons: {}
    };
  }

  /**
   * Audit access attempt
   */
  auditAccess(user, resource, operation, allowed, targetUserId = null) {
    return {
      timestamp: new Date(),
      userId: user?.id,
      userRole: user?.role,
      resource: resource,
      operation: operation,
      allowed: allowed,
      targetUserId: targetUserId
    };
  }
}

module.exports = AccessControl;