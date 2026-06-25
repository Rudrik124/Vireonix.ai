/**
 * Log Retention Module
 * 
 * Purpose: Manage log retention policies and cleanup rules.
 * 
 * Responsibilities:
 * - Define security logs retention period
 * - Define audit logs retention period
 * - Define error logs retention period
 * - Implement cleanup rules and archival
 */

class LogRetention {
  constructor(options = {}) {
    this.retentionPolicies = options.retentionPolicies || this.getDefaultRetentionPolicies();
    this.stats = {
      logsArchived: 0,
      logsDeleted: 0,
      lastCleanupTime: null,
      cleanupRunCount: 0,
      totalArchivedSize: 0
    };
    this.archiveLocation = options.archiveLocation || './archives';
    this.enableAutoCleanup = options.enableAutoCleanup !== false;
    this.cleanupSchedule = options.cleanupSchedule || 'daily'; // daily, weekly, monthly
  }

  /**
   * Get default retention policies
   */
  getDefaultRetentionPolicies() {
    return {
      securityLogs: {
        name: 'Security Logs',
        retentionDays: 365, // 1 year
        archiveAfterDays: 90,
        priority: 'critical',
        compression: true,
        encryption: true,
        description: 'Logs of security events, threats, and violations'
      },
      auditLogs: {
        name: 'Audit Logs',
        retentionDays: 730, // 2 years
        archiveAfterDays: 180,
        priority: 'critical',
        compression: true,
        encryption: true,
        description: 'Logs of admin actions and system changes'
      },
      activityLogs: {
        name: 'Activity Logs',
        retentionDays: 90, // 90 days
        archiveAfterDays: 30,
        priority: 'medium',
        compression: true,
        encryption: false,
        description: 'Logs of normal user activities'
      },
      errorLogs: {
        name: 'Error Logs',
        retentionDays: 180, // 6 months
        archiveAfterDays: 60,
        priority: 'high',
        compression: true,
        encryption: true,
        description: 'Logs of system and application errors'
      },
      apiLogs: {
        name: 'API Logs',
        retentionDays: 60, // 60 days
        archiveAfterDays: 30,
        priority: 'low',
        compression: true,
        encryption: false,
        description: 'API request and response logs'
      }
    };
  }

  /**
   * Get retention policy
   */
  getRetentionPolicy(logType) {
    if (!this.retentionPolicies[logType]) {
      return {
        found: false,
        error: `Retention policy for '${logType}' not found`
      };
    }

    return {
      found: true,
      logType: logType,
      policy: this.retentionPolicies[logType]
    };
  }

  /**
   * Set retention policy
   */
  setRetentionPolicy(logType, retentionDays, archiveAfterDays, options = {}) {
    this.retentionPolicies[logType] = {
      name: options.name || logType,
      retentionDays: retentionDays,
      archiveAfterDays: archiveAfterDays,
      priority: options.priority || 'medium',
      compression: options.compression !== false,
      encryption: options.encryption !== false,
      description: options.description || ''
    };

    return {
      success: true,
      logType: logType,
      retentionDays: retentionDays,
      archiveAfterDays: archiveAfterDays
    };
  }

  /**
   * Calculate if log should be archived
   */
  shouldArchiveLog(logEntry) {
    const logType = this.getLogTypeFromEntry(logEntry);
    const policy = this.retentionPolicies[logType];

    if (!policy) {
      return false;
    }

    const logAge = Date.now() - logEntry.timestamp.getTime();
    const logAgeInDays = logAge / (1000 * 60 * 60 * 24);

    return logAgeInDays > policy.archiveAfterDays;
  }

  /**
   * Calculate if log should be deleted
   */
  shouldDeleteLog(logEntry) {
    const logType = this.getLogTypeFromEntry(logEntry);
    const policy = this.retentionPolicies[logType];

    if (!policy) {
      return false;
    }

    const logAge = Date.now() - logEntry.timestamp.getTime();
    const logAgeInDays = logAge / (1000 * 60 * 60 * 24);

    return logAgeInDays > policy.retentionDays;
  }

  /**
   * Get log type from entry
   */
  getLogTypeFromEntry(logEntry) {
    if (!logEntry || !logEntry.module) {
      return 'activityLogs';
    }

    const module = logEntry.module;

    if (module === 'admin_panel' || module === 'auth' && logEntry.action.includes('ADMIN')) {
      return 'auditLogs';
    }
    if (module === 'malware_scanner' || module === 'rate_limiter' || module === 'access_control') {
      return 'securityLogs';
    }
    if (module === 'api') {
      return 'apiLogs';
    }
    if (logEntry.action && logEntry.action.includes('ERROR')) {
      return 'errorLogs';
    }

    return 'activityLogs';
  }

  /**
   * Archive logs older than archiveAfterDays
   */
  archiveOldLogs(logs) {
    const archived = [];
    const remaining = [];

    logs.forEach(log => {
      if (this.shouldArchiveLog(log)) {
        archived.push(log);
        this.stats.logsArchived++;
      } else {
        remaining.push(log);
      }
    });

    if (archived.length > 0) {
      const archiveSize = JSON.stringify(archived).length;
      this.stats.totalArchivedSize += archiveSize;
    }

    return {
      archived: archived,
      remaining: remaining,
      archivedCount: archived.length
    };
  }

  /**
   * Delete logs older than retentionDays
   */
  deleteExpiredLogs(logs) {
    const deleted = [];
    const remaining = [];

    logs.forEach(log => {
      if (this.shouldDeleteLog(log)) {
        deleted.push(log);
        this.stats.logsDeleted++;
      } else {
        remaining.push(log);
      }
    });

    return {
      deleted: deleted,
      remaining: remaining,
      deletedCount: deleted.length
    };
  }

  /**
   * Execute cleanup
   */
  executeCleanup(logs) {
    this.stats.lastCleanupTime = new Date();
    this.stats.cleanupRunCount++;

    // First archive old logs
    const archiveResult = this.archiveOldLogs(logs);

    // Then delete expired logs from remaining
    const deleteResult = this.deleteExpiredLogs(archiveResult.remaining);

    return {
      cleanup: {
        executedAt: this.stats.lastCleanupTime,
        archived: archiveResult.archivedCount,
        deleted: deleteResult.deletedCount,
        remaining: deleteResult.remaining.length
      },
      finalLogs: deleteResult.remaining
    };
  }

  /**
   * Get retention summary
   */
  getRetentionSummary() {
    const summary = {
      policies: {},
      totalRetentionDays: 0,
      averageRetentionDays: 0
    };

    Object.entries(this.retentionPolicies).forEach(([logType, policy]) => {
      summary.policies[logType] = {
        retention: policy.retentionDays + ' days',
        archiveAfter: policy.archiveAfterDays + ' days',
        compression: policy.compression,
        encryption: policy.encryption,
        priority: policy.priority
      };
      summary.totalRetentionDays += policy.retentionDays;
    });

    summary.averageRetentionDays = Math.floor(
      summary.totalRetentionDays / Object.keys(this.retentionPolicies).length
    );

    return summary;
  }

  /**
   * Get cleanup schedule
   */
  getCleanupSchedule() {
    return {
      schedule: this.cleanupSchedule,
      enabled: this.enableAutoCleanup,
      lastCleanup: this.stats.lastCleanupTime,
      nextCleanup: this.calculateNextCleanupTime(),
      cleanupRunCount: this.stats.cleanupRunCount
    };
  }

  /**
   * Calculate next cleanup time
   */
  calculateNextCleanupTime() {
    if (!this.stats.lastCleanupTime) {
      return 'Not scheduled yet';
    }

    const lastCleanup = new Date(this.stats.lastCleanupTime);

    if (this.cleanupSchedule === 'daily') {
      const nextCleanup = new Date(lastCleanup);
      nextCleanup.setDate(nextCleanup.getDate() + 1);
      return nextCleanup;
    } else if (this.cleanupSchedule === 'weekly') {
      const nextCleanup = new Date(lastCleanup);
      nextCleanup.setDate(nextCleanup.getDate() + 7);
      return nextCleanup;
    } else if (this.cleanupSchedule === 'monthly') {
      const nextCleanup = new Date(lastCleanup);
      nextCleanup.setMonth(nextCleanup.getMonth() + 1);
      return nextCleanup;
    }

    return 'Unknown schedule';
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      archiveLocation: this.archiveLocation,
      autoCleanupEnabled: this.enableAutoCleanup,
      cleanupSchedule: this.cleanupSchedule,
      averageArchivedSizePerRun: this.stats.cleanupRunCount > 0
        ? (this.stats.totalArchivedSize / this.stats.cleanupRunCount).toFixed(2) + ' bytes'
        : '0 bytes'
    };
  }

  /**
   * Get all retention policies
   */
  getAllRetentionPolicies() {
    return {
      policies: this.retentionPolicies,
      policyCount: Object.keys(this.retentionPolicies).length
    };
  }

  /**
   * Validate retention policies
   */
  validateRetentionPolicies() {
    const issues = [];

    Object.entries(this.retentionPolicies).forEach(([logType, policy]) => {
      // Archive days should be less than retention days
      if (policy.archiveAfterDays >= policy.retentionDays) {
        issues.push(`${logType}: archiveAfterDays (${policy.archiveAfterDays}) should be less than retentionDays (${policy.retentionDays})`);
      }

      // Retention days should be reasonable
      if (policy.retentionDays < 1) {
        issues.push(`${logType}: retentionDays should be at least 1 day`);
      }

      // Archive days should be reasonable
      if (policy.archiveAfterDays < 0) {
        issues.push(`${logType}: archiveAfterDays cannot be negative`);
      }
    });

    return {
      valid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * Get logs older than days
   */
  getLogsOlderThan(logs, days) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const oldLogs = logs.filter(log => log.timestamp < cutoffDate);

    return {
      daysOlderThan: days,
      count: oldLogs.length,
      oldestLog: oldLogs.length > 0 ? oldLogs[0].timestamp : null,
      newestLog: oldLogs.length > 0 ? oldLogs[oldLogs.length - 1].timestamp : null,
      logs: oldLogs
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      logsArchived: 0,
      logsDeleted: 0,
      lastCleanupTime: null,
      cleanupRunCount: 0,
      totalArchivedSize: 0
    };
  }
}

module.exports = LogRetention;