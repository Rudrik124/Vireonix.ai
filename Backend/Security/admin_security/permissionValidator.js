/**
 * Permission Validator Module
 * 
 * Purpose: Verify whether an admin can perform a specific action.
 * 
 * Responsibilities:
 * - Check if admin can delete users
 * - Check if admin can ban users
 * - Check if admin can modify settings
 * - Check if admin can view security logs
 * - Validate permissions for any action
 */

class PermissionValidator {
  constructor(roleManager, options = {}) {
    this.roleManager = roleManager;
    this.stats = {
      permissionChecks: 0,
      permissionGranted: 0,
      permissionDenied: 0,
      auditLog: []
    };
    this.auditEnabled = options.auditEnabled !== false;
    this.maxAuditEntries = options.maxAuditEntries || 1000;
  }

  /**
   * Validate if admin has permission
   */
  hasPermission(adminUsername, permission) {
    this.stats.permissionChecks++;

    try {
      // Get admin's role
      const adminRoleData = this.roleManager.getAdminRole(adminUsername);

      if (!adminRoleData.found) {
        this.logAudit(adminUsername, permission, false, 'No role assigned');
        this.stats.permissionDenied++;
        return {
          granted: false,
          reason: 'No role assigned to admin',
          adminUsername: adminUsername,
          permission: permission
        };
      }

      const roleData = adminRoleData.roleDetails;

      // Check if role has permission
      const hasPermission = roleData.permissions.includes(permission);

      if (hasPermission) {
        this.stats.permissionGranted++;
        this.logAudit(adminUsername, permission, true, 'Permission granted');
      } else {
        this.stats.permissionDenied++;
        this.logAudit(adminUsername, permission, false, 'Permission not in role');
      }

      return {
        granted: hasPermission,
        adminUsername: adminUsername,
        role: adminRoleData.role,
        permission: permission,
        reason: hasPermission ? 'Permission granted' : 'Permission denied'
      };

    } catch (error) {
      this.stats.permissionDenied++;
      this.logAudit(adminUsername, permission, false, error.message);
      return {
        granted: false,
        reason: error.message,
        adminUsername: adminUsername,
        permission: permission
      };
    }
  }

  /**
   * Check if admin can delete users
   */
  canDeleteUsers(adminUsername) {
    return this.hasPermission(adminUsername, 'delete_users');
  }

  /**
   * Check if admin can ban users
   */
  canBanUsers(adminUsername) {
    return this.hasPermission(adminUsername, 'ban_users');
  }

  /**
   * Check if admin can modify settings
   */
  canModifySettings(adminUsername) {
    return this.hasPermission(adminUsername, 'modify_settings');
  }

  /**
   * Check if admin can view security logs
   */
  canViewSecurityLogs(adminUsername) {
    return this.hasPermission(adminUsername, 'view_security_logs');
  }

  /**
   * Check if admin can view audit logs
   */
  canViewAuditLogs(adminUsername) {
    return this.hasPermission(adminUsername, 'view_audit_logs');
  }

  /**
   * Check if admin can manage API keys
   */
  canManageApiKeys(adminUsername) {
    return this.hasPermission(adminUsername, 'manage_api_keys');
  }

  /**
   * Check if admin can export data
   */
  canExportData(adminUsername) {
    return this.hasPermission(adminUsername, 'export_data');
  }

  /**
   * Check if admin can modify system config
   */
  canModifySystemConfig(adminUsername) {
    return this.hasPermission(adminUsername, 'modify_system_config');
  }

  /**
   * Check if admin can manage admins
   */
  canManageAdmins(adminUsername) {
    return this.hasPermission(adminUsername, 'manage_admins');
  }

  /**
   * Check if admin can manage roles
   */
  canManageRoles(adminUsername) {
    return this.hasPermission(adminUsername, 'manage_roles');
  }

  /**
   * Validate multiple permissions
   */
  validatePermissions(adminUsername, permissionsArray) {
    if (!Array.isArray(permissionsArray)) {
      return {
        valid: false,
        error: 'Permissions must be an array'
      };
    }

    const results = {};
    let allGranted = true;

    for (const permission of permissionsArray) {
      const result = this.hasPermission(adminUsername, permission);
      results[permission] = result.granted;

      if (!result.granted) {
        allGranted = false;
      }
    }

    return {
      valid: allGranted,
      adminUsername: adminUsername,
      results: results,
      grantedCount: Object.values(results).filter(v => v === true).length,
      deniedCount: Object.values(results).filter(v => v === false).length
    };
  }

  /**
   * Get all permissions for admin
   */
  getAdminPermissions(adminUsername) {
    const adminRoleData = this.roleManager.getAdminRole(adminUsername);

    if (!adminRoleData.found) {
      return {
        found: false,
        error: `No role assigned to admin ${adminUsername}`
      };
    }

    return {
      found: true,
      adminUsername: adminUsername,
      role: adminRoleData.role,
      permissions: adminRoleData.roleDetails.permissions,
      permissionCount: adminRoleData.roleDetails.permissions.length
    };
  }

  /**
   * Check if admin has any of the permissions
   */
  hasAnyPermission(adminUsername, permissionsArray) {
    if (!Array.isArray(permissionsArray)) {
      return false;
    }

    for (const permission of permissionsArray) {
      const result = this.hasPermission(adminUsername, permission);
      if (result.granted) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if admin has all permissions
   */
  hasAllPermissions(adminUsername, permissionsArray) {
    if (!Array.isArray(permissionsArray)) {
      return false;
    }

    for (const permission of permissionsArray) {
      const result = this.hasPermission(adminUsername, permission);
      if (!result.granted) {
        return false;
      }
    }

    return true;
  }

  /**
   * Log audit trail
   */
  logAudit(adminUsername, permission, granted, reason) {
    if (!this.auditEnabled) {
      return;
    }

    const auditEntry = {
      timestamp: new Date(),
      adminUsername: adminUsername,
      permission: permission,
      granted: granted,
      reason: reason
    };

    this.stats.auditLog.push(auditEntry);

    // Keep audit log size manageable
    if (this.stats.auditLog.length > this.maxAuditEntries) {
      this.stats.auditLog = this.stats.auditLog.slice(-this.maxAuditEntries);
    }
  }

  /**
   * Get audit trail
   */
  getAuditTrail(options = {}) {
    let audit = [...this.stats.auditLog];

    // Filter by admin
    if (options.adminUsername) {
      audit = audit.filter(entry => entry.adminUsername === options.adminUsername);
    }

    // Filter by permission
    if (options.permission) {
      audit = audit.filter(entry => entry.permission === options.permission);
    }

    // Filter by grant status
    if (options.granted !== undefined) {
      audit = audit.filter(entry => entry.granted === options.granted);
    }

    // Sort by timestamp (newest first)
    audit.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    const limit = options.limit || 100;
    audit = audit.slice(0, limit);

    return {
      total: this.stats.auditLog.length,
      filtered: audit.length,
      entries: audit
    };
  }

  /**
   * Clear audit trail
   */
  clearAuditTrail() {
    this.stats.auditLog = [];
    return { success: true, message: 'Audit trail cleared' };
  }

  /**
   * Get permission statistics
   */
  getStats() {
    const grantedCount = this.stats.auditLog.filter(entry => entry.granted).length;
    const deniedCount = this.stats.auditLog.filter(entry => !entry.granted).length;

    return {
      permissionChecks: this.stats.permissionChecks,
      permissionGranted: this.stats.permissionGranted,
      permissionDenied: this.stats.permissionDenied,
      grantDenyRatio: this.stats.permissionDenied > 0
        ? ((this.stats.permissionGranted / this.stats.permissionDenied) * 100).toFixed(2) + '%'
        : 'N/A',
      auditLogEntries: this.stats.auditLog.length,
      auditGrant: grantedCount,
      auditDeny: deniedCount
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      permissionChecks: 0,
      permissionGranted: 0,
      permissionDenied: 0,
      auditLog: []
    };
  }
}

module.exports = PermissionValidator;