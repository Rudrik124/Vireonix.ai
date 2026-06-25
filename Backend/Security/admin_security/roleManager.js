/**
 * Admin Role Manager Module
 * 
 * Purpose: Manage administrator roles and assign permissions based on role.
 * 
 * Responsibilities:
 * - Define admin roles (Super Admin, Admin, Moderator, Support Staff)
 * - Assign permissions to roles
 * - Manage role hierarchies
 * - Validate role assignments
 */

class RoleManager {
  constructor(options = {}) {
    this.roles = options.roles || this.getDefaultRoles();
    this.adminRoles = new Map(); // Map of admin -> role
    this.stats = {
      rolesCreated: 0,
      rolesDeleted: 0,
      rolesAssigned: 0,
      rolesRevoked: 0,
      permissionsModified: 0
    };
  }

  /**
   * Get default admin roles
   */
  getDefaultRoles() {
    return {
      super_admin: {
        name: 'Super Admin',
        description: 'Full system access and control',
        level: 4,
        permissions: [
          'delete_users',
          'ban_users',
          'modify_settings',
          'view_security_logs',
          'manage_admins',
          'view_audit_logs',
          'modify_system_config',
          'manage_roles',
          'access_system_settings',
          'export_data',
          'backup_restore',
          'manage_api_keys',
          'modify_compliance_settings'
        ]
      },
      admin: {
        name: 'Admin',
        description: 'Administrative access with some restrictions',
        level: 3,
        permissions: [
          'delete_users',
          'ban_users',
          'modify_settings',
          'view_security_logs',
          'view_audit_logs',
          'manage_api_keys',
          'export_data'
        ]
      },
      moderator: {
        name: 'Moderator',
        description: 'Content and user moderation access',
        level: 2,
        permissions: [
          'ban_users',
          'delete_content',
          'view_security_logs',
          'manage_reports'
        ]
      },
      support_staff: {
        name: 'Support Staff',
        description: 'Limited support access',
        level: 1,
        permissions: [
          'view_user_info',
          'view_security_logs',
          'create_support_tickets'
        ]
      }
    };
  }

  /**
   * Assign role to admin
   */
  assignRole(adminUsername, roleName) {
    if (!this.roles[roleName]) {
      return {
        success: false,
        error: `Role '${roleName}' does not exist`
      };
    }

    if (!adminUsername) {
      return {
        success: false,
        error: 'Admin username is required'
      };
    }

    this.adminRoles.set(adminUsername, roleName);
    this.stats.rolesAssigned++;

    return {
      success: true,
      adminUsername: adminUsername,
      role: roleName,
      permissions: this.roles[roleName].permissions,
      message: `Role '${roleName}' assigned to admin ${adminUsername}`
    };
  }

  /**
   * Revoke role from admin
   */
  revokeRole(adminUsername) {
    if (!this.adminRoles.has(adminUsername)) {
      return {
        success: false,
        error: `No role assigned to admin ${adminUsername}`
      };
    }

    const previousRole = this.adminRoles.get(adminUsername);
    this.adminRoles.delete(adminUsername);
    this.stats.rolesRevoked++;

    return {
      success: true,
      adminUsername: adminUsername,
      revokedRole: previousRole,
      message: `Role revoked from admin ${adminUsername}`
    };
  }

  /**
   * Get admin role
   */
  getAdminRole(adminUsername) {
    if (!this.adminRoles.has(adminUsername)) {
      return {
        found: false,
        error: `No role assigned to admin ${adminUsername}`
      };
    }

    const roleName = this.adminRoles.get(adminUsername);
    const roleData = this.roles[roleName];

    return {
      found: true,
      adminUsername: adminUsername,
      role: roleName,
      roleDetails: roleData
    };
  }

  /**
   * Get role details
   */
  getRoleDetails(roleName) {
    if (!this.roles[roleName]) {
      return {
        found: false,
        error: `Role '${roleName}' not found`
      };
    }

    return {
      found: true,
      role: roleName,
      details: this.roles[roleName]
    };
  }

  /**
   * Get all roles
   */
  getAllRoles() {
    return {
      total: Object.keys(this.roles).length,
      roles: this.roles
    };
  }

  /**
   * Get role permissions
   */
  getRolePermissions(roleName) {
    if (!this.roles[roleName]) {
      return null;
    }

    return this.roles[roleName].permissions;
  }

  /**
   * Check if role exists
   */
  roleExists(roleName) {
    return this.roles.hasOwnProperty(roleName);
  }

  /**
   * Create custom role
   */
  createRole(roleName, roleConfig = {}) {
    if (this.roles[roleName]) {
      return {
        success: false,
        error: `Role '${roleName}' already exists`
      };
    }

    this.roles[roleName] = {
      name: roleConfig.name || roleName,
      description: roleConfig.description || '',
      level: roleConfig.level || 1,
      permissions: roleConfig.permissions || []
    };

    this.stats.rolesCreated++;

    return {
      success: true,
      role: roleName,
      message: `Role '${roleName}' created successfully`
    };
  }

  /**
   * Delete role
   */
  deleteRole(roleName) {
    if (!this.roles[roleName]) {
      return {
        success: false,
        error: `Role '${roleName}' not found`
      };
    }

    // Check if any admins have this role
    const adminsWithRole = [];
    for (const [admin, role] of this.adminRoles.entries()) {
      if (role === roleName) {
        adminsWithRole.push(admin);
      }
    }

    if (adminsWithRole.length > 0) {
      return {
        success: false,
        error: `Cannot delete role '${roleName}' - ${adminsWithRole.length} admin(s) assigned to this role`,
        admins: adminsWithRole
      };
    }

    delete this.roles[roleName];
    this.stats.rolesDeleted++;

    return {
      success: true,
      role: roleName,
      message: `Role '${roleName}' deleted successfully`
    };
  }

  /**
   * Add permission to role
   */
  addPermissionToRole(roleName, permission) {
    if (!this.roles[roleName]) {
      return {
        success: false,
        error: `Role '${roleName}' not found`
      };
    }

    if (this.roles[roleName].permissions.includes(permission)) {
      return {
        success: false,
        error: `Permission '${permission}' already exists in role '${roleName}'`
      };
    }

    this.roles[roleName].permissions.push(permission);
    this.stats.permissionsModified++;

    return {
      success: true,
      role: roleName,
      permission: permission,
      totalPermissions: this.roles[roleName].permissions.length
    };
  }

  /**
   * Remove permission from role
   */
  removePermissionFromRole(roleName, permission) {
    if (!this.roles[roleName]) {
      return {
        success: false,
        error: `Role '${roleName}' not found`
      };
    }

    const index = this.roles[roleName].permissions.indexOf(permission);
    if (index === -1) {
      return {
        success: false,
        error: `Permission '${permission}' not found in role '${roleName}'`
      };
    }

    this.roles[roleName].permissions.splice(index, 1);
    this.stats.permissionsModified++;

    return {
      success: true,
      role: roleName,
      permission: permission,
      totalPermissions: this.roles[roleName].permissions.length
    };
  }

  /**
   * Get admins by role
   */
  getAdminsByRole(roleName) {
    const admins = [];

    for (const [admin, role] of this.adminRoles.entries()) {
      if (role === roleName) {
        admins.push(admin);
      }
    }

    return {
      role: roleName,
      adminCount: admins.length,
      admins: admins
    };
  }

  /**
   * Get role hierarchy
   */
  getRoleHierarchy() {
    const hierarchy = {};

    Object.entries(this.roles).forEach(([roleName, roleData]) => {
      hierarchy[roleName] = {
        level: roleData.level,
        name: roleData.name,
        permissionCount: roleData.permissions.length
      };
    });

    // Sort by level (highest first)
    const sorted = Object.entries(hierarchy)
      .sort((a, b) => b[1].level - a[1].level)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    return sorted;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalRoles: Object.keys(this.roles).length,
      adminsWithRoles: this.adminRoles.size,
      totalPermissions: Object.values(this.roles).reduce((sum, role) => sum + role.permissions.length, 0)
    };
  }
}

module.exports = RoleManager;