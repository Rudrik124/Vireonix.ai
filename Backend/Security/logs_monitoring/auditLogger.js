/**
 * Audit Logger Module
 * 
 * Purpose: Record important administrative actions and system changes.
 * 
 * Logs:
 * - User Deleted
 * - User Banned
 * - Role Changed
 * - Security Settings Changed
 * - System Configuration Updated
 */

class AuditLogger {
  constructor(options = {}) {
    this.logs = [];
    this.stats = {
      totalLogs: 0,
      userDeleted: 0,
      userBanned: 0,
      roleChanged: 0,
      securitySettingsChanged: 0,
      systemConfigUpdated: 0,
      dataExported: 0,
      backupCreated: 0
    };
    this.maxLogs = options.maxLogs || 100000;
    this.enableConsoleOutput = options.enableConsoleOutput !== false;
    this.requiresApproval = options.requiresApproval !== false;
    this.approvalQueue = [];
  }

  /**
   * Log user deletion
   */
  logUserDeleted(adminId, ipAddress, deletedUserId, reason, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: adminId,
      action: 'USER_DELETED',
      actionType: 'user_management',
      ipAddress: ipAddress,
      result: 'user_deleted',
      severity: 'critical',
      module: 'admin_panel',
      details: {
        deletedUserId: deletedUserId,
        reason: reason,
        deletedByRole: metadata.deletedByRole || 'admin',
        permanentDelete: metadata.permanentDelete || true,
        dataPreserved: metadata.dataPreserved || false,
        ...metadata
      },
      approvalRequired: this.requiresApproval,
      approved: false
    };

    this.addLog(logEntry);
    this.stats.userDeleted++;

    if (this.enableConsoleOutput) {
      console.log(`[AUDIT] Admin ${adminId} deleted user ${deletedUserId}: ${reason}`);
    }

    return logEntry;
  }

  /**
   * Log user banned
   */
  logUserBanned(adminId, ipAddress, bannedUserId, banReason, banDuration, metadata = {}) {
    const banExpiry = banDuration ? new Date(Date.now() + banDuration) : null;

    const logEntry = {
      timestamp: new Date(),
      userId: adminId,
      action: 'USER_BANNED',
      actionType: 'user_management',
      ipAddress: ipAddress,
      result: 'user_banned',
      severity: 'high',
      module: 'admin_panel',
      details: {
        bannedUserId: bannedUserId,
        banReason: banReason,
        banDuration: banDuration,
        banExpiry: banExpiry,
        banType: metadata.banType || 'temporary', // temporary, permanent
        ...metadata
      },
      approvalRequired: this.requiresApproval,
      approved: false
    };

    this.addLog(logEntry);
    this.stats.userBanned++;

    if (this.enableConsoleOutput) {
      console.log(`[AUDIT] Admin ${adminId} banned user ${bannedUserId} until ${banExpiry}`);
    }

    return logEntry;
  }

  /**
   * Log role change
   */
  logRoleChanged(adminId, ipAddress, targetUserId, previousRole, newRole, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: adminId,
      action: 'ROLE_CHANGED',
      actionType: 'access_control',
      ipAddress: ipAddress,
      result: 'role_updated',
      severity: 'high',
      module: 'admin_panel',
      details: {
        targetUserId: targetUserId,
        previousRole: previousRole,
        newRole: newRole,
        changedByRole: metadata.changedByRole || 'admin',
        permissions: metadata.permissions || [],
        ...metadata
      },
      approvalRequired: this.requiresApproval,
      approved: false
    };

    this.addLog(logEntry);
    this.stats.roleChanged++;

    if (this.enableConsoleOutput) {
      console.log(`[AUDIT] Admin ${adminId} changed role for user ${targetUserId}: ${previousRole} → ${newRole}`);
    }

    return logEntry;
  }

  /**
   * Log security settings change
   */
  logSecuritySettingsChanged(adminId, ipAddress, settingName, previousValue, newValue, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: adminId,
      action: 'SECURITY_SETTINGS_CHANGED',
      actionType: 'configuration',
      ipAddress: ipAddress,
      result: 'settings_updated',
      severity: 'critical',
      module: 'admin_panel',
      details: {
        settingName: settingName,
        previousValue: previousValue,
        newValue: newValue,
        impact: metadata.impact || 'system-wide', // user, department, system-wide
        affectedUsers: metadata.affectedUsers || null,
        ...metadata
      },
      approvalRequired: this.requiresApproval,
      approved: false
    };

    this.addLog(logEntry);
    this.stats.securitySettingsChanged++;

    if (this.enableConsoleOutput) {
      console.log(`[AUDIT] Admin ${adminId} changed security setting: ${settingName}`);
    }

    return logEntry;
  }

  /**
   * Log system configuration update
   */
  logSystemConfigUpdated(adminId, ipAddress, configSection, changes, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: adminId,
      action: 'SYSTEM_CONFIG_UPDATED',
      actionType: 'configuration',
      ipAddress: ipAddress,
      result: 'config_updated',
      severity: 'critical',
      module: 'admin_panel',
      details: {
        configSection: configSection,
        changes: changes,
        systemImpact: metadata.systemImpact || 'low', // low, medium, high
        requiresRestart: metadata.requiresRestart || false,
        ...metadata
      },
      approvalRequired: this.requiresApproval,
      approved: false
    };

    this.addLog(logEntry);
    this.stats.systemConfigUpdated++;

    if (this.enableConsoleOutput) {
      console.log(`[AUDIT] Admin ${adminId} updated system config: ${configSection}`);
    }

    return logEntry;
  }

  /**
   * Log data export
   */
  logDataExported(adminId, ipAddress, dataType, recordCount, exportFormat, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: adminId,
      action: 'DATA_EXPORTED',
      actionType: 'data_access',
      ipAddress: ipAddress,
      result: 'data_exported',
      severity: 'high',
      module: 'admin_panel',
      details: {
        dataType: dataType,
        recordCount: recordCount,
        exportFormat: exportFormat,
        filters: metadata.filters || {},
        ...metadata
      },
      approvalRequired: this.requiresApproval,
      approved: false
    };

    this.addLog(logEntry);
    this.stats.dataExported++;

    if (this.enableConsoleOutput) {
      console.log(`[AUDIT] Admin ${adminId} exported ${recordCount} records of ${dataType}`);
    }

    return logEntry;
  }

  /**
   * Log backup creation
   */
  logBackupCreated(adminId, ipAddress, backupType, backupSize, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: adminId,
      action: 'BACKUP_CREATED',
      actionType: 'backup',
      ipAddress: ipAddress,
      result: 'backup_created',
      severity: 'info',
      module: 'admin_panel',
      details: {
        backupType: backupType,
        backupSize: backupSize,
        backupLocation: metadata.backupLocation || null,
        encrypted: metadata.encrypted || true,
        compressed: metadata.compressed || true,
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.backupCreated++;

    if (this.enableConsoleOutput) {
      console.log(`[AUDIT] Admin ${adminId} created ${backupType} backup (${backupSize} bytes)`);
    }

    return logEntry;
  }

  /**
   * Approve audit action (for approval queue)
   */
  approveAction(logId, approverAdminId) {
    const log = this.logs.find(l => l.timestamp.getTime() === logId);

    if (!log) {
      return {
        success: false,
        error: 'Log entry not found'
      };
    }

    log.approved = true;
    log.approvedBy = approverAdminId;
    log.approvedAt = new Date();

    return {
      success: true,
      action: log.action,
      approvedBy: approverAdminId,
      approvedAt: log.approvedAt
    };
  }

  /**
   * Reject audit action
   */
  rejectAction(logId, rejectionReason) {
    const log = this.logs.find(l => l.timestamp.getTime() === logId);

    if (!log) {
      return {
        success: false,
        error: 'Log entry not found'
      };
    }

    log.approved = false;
    log.rejected = true;
    log.rejectionReason = rejectionReason;
    log.rejectedAt = new Date();

    return {
      success: true,
      action: log.action,
      rejectionReason: rejectionReason
    };
  }

  /**
   * Add log entry
   */
  addLog(logEntry) {
    if (!logEntry.timestamp || !logEntry.userId || !logEntry.action) {
      throw new Error('Log entry missing required fields');
    }

    this.logs.push(logEntry);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Get critical audit logs
   */
  getCriticalLogs(options = {}) {
    let criticalLogs = this.logs.filter(log => log.severity === 'critical');

    if (options.startDate && options.endDate) {
      criticalLogs = criticalLogs.filter(log =>
        log.timestamp >= options.startDate && log.timestamp <= options.endDate
      );
    }

    criticalLogs.sort((a, b) => b.timestamp - a.timestamp);

    const limit = options.limit || 100;
    criticalLogs = criticalLogs.slice(0, limit);

    return {
      criticalCount: criticalLogs.length,
      logs: criticalLogs
    };
  }

  /**
   * Get pending approvals
   */
  getPendingApprovals() {
    const pending = this.logs.filter(log => log.approvalRequired && !log.approved && !log.rejected);

    return {
      pendingCount: pending.length,
      logs: pending
    };
  }

  /**
   * Get audit trail by admin
   */
  getAuditTrailByAdmin(adminId, options = {}) {
    let adminLogs = this.logs.filter(log => log.userId === adminId);

    if (options.startDate && options.endDate) {
      adminLogs = adminLogs.filter(log =>
        log.timestamp >= options.startDate && log.timestamp <= options.endDate
      );
    }

    adminLogs.sort((a, b) => b.timestamp - a.timestamp);

    const limit = options.limit || 100;
    adminLogs = adminLogs.slice(0, limit);

    return {
      adminId: adminId,
      total: adminLogs.length,
      logs: adminLogs
    };
  }

  /**
   * Get audit statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalAuditEvents: this.logs.length,
      pendingApprovals: this.logs.filter(log => log.approvalRequired && !log.approved).length,
      approvedActions: this.logs.filter(log => log.approved).length,
      rejectedActions: this.logs.filter(log => log.rejected).length,
      criticalActionsCount: this.logs.filter(log => log.severity === 'critical').length
    };
  }

  /**
   * Clear all audit logs
   */
  clearLogs() {
    this.logs = [];
    return { success: true, message: 'All audit logs cleared' };
  }
}

module.exports = AuditLogger;