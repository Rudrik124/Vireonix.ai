class AdminActionGuard {
  constructor(permissionValidator, options = {}) {
    this.permissionValidator = permissionValidator;
    this.stats = {
      actionsAttempted: 0,
      actionsApproved: 0,
      actionsDenied: 0,
      actionsFailed: 0,
      actionLog: []
    };
    this.actionLog = [];
    this.maxLogEntries = options.maxLogEntries || 10000;
    this.requireApproval = options.requireApproval !== false;
    this.approvalQueue = new Map();
  }

  /**
   * Protected action: Delete User
   */
  deleteUser(adminUsername, targetUserId, reason = '') {
    this.stats.actionsAttempted++;

    try {
      // Check permission
      const permResult = this.permissionValidator.canDeleteUsers(adminUsername);

      if (!permResult.granted) {
        this.stats.actionsDenied++;
        this.logAction(adminUsername, 'DELETE_USER', targetUserId, false, 'Permission denied');

        return {
          success: false,
          action: 'DELETE_USER',
          targetUserId: targetUserId,
          reason: 'Permission denied - admin cannot delete users'
        };
      }

      // Perform action
      this.stats.actionsApproved++;
      this.logAction(adminUsername, 'DELETE_USER', targetUserId, true, reason);

      return {
        success: true,
        action: 'DELETE_USER',
        adminUsername: adminUsername,
        targetUserId: targetUserId,
        timestamp: new Date(),
        reason: reason,
        message: `User ${targetUserId} deleted by admin ${adminUsername}`
      };

    } catch (error) {
      this.stats.actionsFailed++;
      this.logAction(adminUsername, 'DELETE_USER', targetUserId, false, error.message);

      return {
        success: false,
        action: 'DELETE_USER',
        error: error.message
      };
    }
  }

  /**
   * Protected action: Ban User
   */
  banUser(adminUsername, targetUserId, banReason = '', banDuration = null) {
    this.stats.actionsAttempted++;

    try {
      // Check permission
      const permResult = this.permissionValidator.canBanUsers(adminUsername);

      if (!permResult.granted) {
        this.stats.actionsDenied++;
        this.logAction(adminUsername, 'BAN_USER', targetUserId, false, 'Permission denied');

        return {
          success: false,
          action: 'BAN_USER',
          targetUserId: targetUserId,
          reason: 'Permission denied - admin cannot ban users'
        };
      }

      // Perform action
      this.stats.actionsApproved++;
      const banExpiry = banDuration ? new Date(Date.now() + banDuration) : null;
      this.logAction(adminUsername, 'BAN_USER', targetUserId, true, banReason);

      return {
        success: true,
        action: 'BAN_USER',
        adminUsername: adminUsername,
        targetUserId: targetUserId,
        banReason: banReason,
        banExpiry: banExpiry,
        timestamp: new Date(),
        message: `User ${targetUserId} banned by admin ${adminUsername}`
      };

    } catch (error) {
      this.stats.actionsFailed++;
      this.logAction(adminUsername, 'BAN_USER', targetUserId, false, error.message);

      return {
        success: false,
        action: 'BAN_USER',
        error: error.message
      };
    }
  }

  /**
   * Protected action: Delete Content
   */
  deleteContent(adminUsername, contentId, contentType = '', reason = '') {
    this.stats.actionsAttempted++;

    try {
      // Check permission
      const permResult = this.permissionValidator.hasPermission(adminUsername, 'delete_content');

      if (!permResult.granted) {
        this.stats.actionsDenied++;
        this.logAction(adminUsername, 'DELETE_CONTENT', contentId, false, 'Permission denied');

        return {
          success: false,
          action: 'DELETE_CONTENT',
          contentId: contentId,
          reason: 'Permission denied - admin cannot delete content'
        };
      }

      // Perform action
      this.stats.actionsApproved++;
      this.logAction(adminUsername, 'DELETE_CONTENT', contentId, true, reason);

      return {
        success: true,
        action: 'DELETE_CONTENT',
        adminUsername: adminUsername,
        contentId: contentId,
        contentType: contentType,
        deleteReason: reason,
        timestamp: new Date(),
        message: `Content ${contentId} deleted by admin ${adminUsername}`
      };

    } catch (error) {
      this.stats.actionsFailed++;
      this.logAction(adminUsername, 'DELETE_CONTENT', contentId, false, error.message);

      return {
        success: false,
        action: 'DELETE_CONTENT',
        error: error.message
      };
    }
  }

  /**
   * Protected action: Change Security Settings
   */
  changeSecuritySettings(adminUsername, settingsChanges = {}, reason = '') {
    this.stats.actionsAttempted++;

    try {
      // Check permission
      const permResult = this.permissionValidator.canModifySettings(adminUsername);

      if (!permResult.granted) {
        this.stats.actionsDenied++;
        this.logAction(adminUsername, 'CHANGE_SECURITY_SETTINGS', 'system', false, 'Permission denied');

        return {
          success: false,
          action: 'CHANGE_SECURITY_SETTINGS',
          reason: 'Permission denied - admin cannot modify security settings'
        };
      }

      // Validate settings changes
      if (!this.validateSecuritySettings(settingsChanges)) {
        this.stats.actionsDenied++;
        this.logAction(adminUsername, 'CHANGE_SECURITY_SETTINGS', 'system', false, 'Invalid settings');

        return {
          success: false,
          action: 'CHANGE_SECURITY_SETTINGS',
          error: 'Invalid security settings provided'
        };
      }

      // Perform action
      this.stats.actionsApproved++;
      this.logAction(adminUsername, 'CHANGE_SECURITY_SETTINGS', 'system', true, reason);

      return {
        success: true,
        action: 'CHANGE_SECURITY_SETTINGS',
        adminUsername: adminUsername,
        settingsChanges: settingsChanges,
        appliedAt: new Date(),
        reason: reason,
        message: `Security settings changed by admin ${adminUsername}`
      };

    } catch (error) {
      this.stats.actionsFailed++;
      this.logAction(adminUsername, 'CHANGE_SECURITY_SETTINGS', 'system', false, error.message);

      return {
        success: false,
        action: 'CHANGE_SECURITY_SETTINGS',
        error: error.message
      };
    }
  }

  /**
   * Protected action: Modify System Configuration
   */
  modifySystemConfig(adminUsername, configChanges = {}, reason = '') {
    this.stats.actionsAttempted++;

    try {
      // Check permission
      const permResult = this.permissionValidator.canModifySystemConfig(adminUsername);

      if (!permResult.granted) {
        this.stats.actionsDenied++;
        this.logAction(adminUsername, 'MODIFY_SYSTEM_CONFIG', 'system', false, 'Permission denied');

        return {
          success: false,
          action: 'MODIFY_SYSTEM_CONFIG',
          reason: 'Permission denied - admin cannot modify system configuration'
        };
      }

      // Validate configuration changes
      if (!this.validateSystemConfig(configChanges)) {
        this.stats.actionsDenied++;
        this.logAction(adminUsername, 'MODIFY_SYSTEM_CONFIG', 'system', false, 'Invalid config');

        return {
          success: false,
          action: 'MODIFY_SYSTEM_CONFIG',
          error: 'Invalid system configuration provided'
        };
      }

      // Perform action
      this.stats.actionsApproved++;
      this.logAction(adminUsername, 'MODIFY_SYSTEM_CONFIG', 'system', true, reason);

      return {
        success: true,
        action: 'MODIFY_SYSTEM_CONFIG',
        adminUsername: adminUsername,
        configChanges: configChanges,
        appliedAt: new Date(),
        reason: reason,
        message: `System configuration modified by admin ${adminUsername}`
      };

    } catch (error) {
      this.stats.actionsFailed++;
      this.logAction(adminUsername, 'MODIFY_SYSTEM_CONFIG', 'system', false, error.message);

      return {
        success: false,
        action: 'MODIFY_SYSTEM_CONFIG',
        error: error.message
      };
    }
  }

  /**
   * Validate security settings
   */
  validateSecuritySettings(settings) {
    if (!settings || typeof settings !== 'object') {
      return false;
    }

    // Basic validation - extend as needed
    const validKeys = ['encryption', 'mfa', 'sessionTimeout', 'passwordPolicy', 'ipWhitelist'];
    return Object.keys(settings).some(key => validKeys.includes(key));
  }

  /**
   * Validate system configuration
   */
  validateSystemConfig(config) {
    if (!config || typeof config !== 'object') {
      return false;
    }

    // Basic validation - extend as needed
    const validKeys = ['apiEndpoints', 'database', 'cache', 'logging', 'notifications'];
    return Object.keys(config).some(key => validKeys.includes(key));
  }

  /**
   * Log admin action
   */
  logAction(adminUsername, action, target, success, details) {
    const logEntry = {
      timestamp: new Date(),
      adminUsername: adminUsername,
      action: action,
      target: target,
      success: success,
      details: details
    };

    this.actionLog.push(logEntry);

    // Keep log size manageable
    if (this.actionLog.length > this.maxLogEntries) {
      this.actionLog = this.actionLog.slice(-this.maxLogEntries);
    }
  }

  /**
   * Get action audit trail
   */
  getActionAuditTrail(options = {}) {
    let trail = [...this.actionLog];

    // Filter by admin
    if (options.adminUsername) {
      trail = trail.filter(entry => entry.adminUsername === options.adminUsername);
    }

    // Filter by action
    if (options.action) {
      trail = trail.filter(entry => entry.action === options.action);
    }

    // Filter by success status
    if (options.success !== undefined) {
      trail = trail.filter(entry => entry.success === options.success);
    }

    // Sort by timestamp (newest first)
    trail.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    const limit = options.limit || 100;
    trail = trail.slice(0, limit);

    return {
      total: this.actionLog.length,
      filtered: trail.length,
      entries: trail
    };
  }

  /**
   * Get action statistics
   */
  getStats() {
    const successCount = this.actionLog.filter(entry => entry.success).length;
    const failureCount = this.actionLog.filter(entry => !entry.success).length;

    return {
      ...this.stats,
      actionAuditEntries: this.actionLog.length,
      approvalRate: this.stats.actionsAttempted > 0
        ? ((this.stats.actionsApproved / this.stats.actionsAttempted) * 100).toFixed(2) + '%'
        : '0%',
      denialRate: this.stats.actionsAttempted > 0
        ? ((this.stats.actionsDenied / this.stats.actionsAttempted) * 100).toFixed(2) + '%'
        : '0%',
      auditSuccess: successCount,
      auditFailure: failureCount
    };
  }

  /**
   * Clear action log
   */
  clearActionLog() {
    this.actionLog = [];
    return { success: true, message: 'Action log cleared' };
  }
}

module.exports = AdminActionGuard;