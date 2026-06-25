/**
 * Security Logger Module
 * 
 * Purpose: Record security-related events and threats.
 * 
 * Logs:
 * - Blocked Prompt
 * - Malware Detection
 * - Rate Limit Triggered
 * - Unauthorized Access Attempt
 * - Failed Authentication
 * - Suspicious Activity
 */

class SecurityLogger {
  constructor(options = {}) {
    this.logs = [];
    this.stats = {
      totalLogs: 0,
      blockedPrompts: 0,
      malwareDetections: 0,
      rateLimitTriggered: 0,
      unauthorizedAttempts: 0,
      failedAuth: 0,
      suspiciousActivities: 0
    };
    this.maxLogs = options.maxLogs || 100000;
    this.enableConsoleOutput = options.enableConsoleOutput !== false;
    this.alertThreshold = options.alertThreshold || 5; // Alert after N incidents
    this.recentIncidents = [];
  }

  /**
   * Log blocked prompt
   */
  logBlockedPrompt(userId, ipAddress, promptId, reason, blockedBy, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'BLOCKED_PROMPT',
      actionType: 'security_block',
      ipAddress: ipAddress,
      result: 'blocked',
      severity: 'warning',
      module: 'prompt_security',
      details: {
        promptId: promptId,
        reason: reason,
        blockedBy: blockedBy,
        promptPreview: metadata.promptPreview || null,
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.blockedPrompts++;
    this.recordIncident(userId, 'BLOCKED_PROMPT');

    if (this.enableConsoleOutput) {
      console.log(`[SECURITY] Blocked prompt from user ${userId}: ${reason}`);
    }

    return logEntry;
  }

  /**
   * Log malware detection
   */
  logMalwareDetection(userId, ipAddress, resourceType, resourceId, malwareType, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'MALWARE_DETECTION',
      actionType: 'security_threat',
      ipAddress: ipAddress,
      result: 'threat_detected',
      severity: 'critical',
      module: 'malware_scanner',
      details: {
        resourceType: resourceType,
        resourceId: resourceId,
        malwareType: malwareType,
        detectionMethod: metadata.detectionMethod || 'signature',
        quarantined: metadata.quarantined || false,
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.malwareDetections++;
    this.recordIncident(userId, 'MALWARE_DETECTION');

    if (this.enableConsoleOutput) {
      console.log(`[SECURITY] MALWARE DETECTED: ${malwareType} in ${resourceType}`);
    }

    return logEntry;
  }

  /**
   * Log rate limit triggered
   */
  logRateLimitTriggered(userId, ipAddress, endpoint, limit, period, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'RATE_LIMIT_TRIGGERED',
      actionType: 'rate_limit',
      ipAddress: ipAddress,
      result: 'rate_limit_exceeded',
      severity: 'warning',
      module: 'rate_limiter',
      details: {
        endpoint: endpoint,
        limit: limit,
        period: period,
        requestCount: metadata.requestCount || 0,
        blockedDuration: metadata.blockedDuration || 60,
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.rateLimitTriggered++;
    this.recordIncident(userId, 'RATE_LIMIT_TRIGGERED');

    if (this.enableConsoleOutput) {
      console.log(`[SECURITY] Rate limit triggered for user ${userId} on ${endpoint}`);
    }

    return logEntry;
  }

  /**
   * Log unauthorized access attempt
   */
  logUnauthorizedAccessAttempt(userId, ipAddress, resource, accessLevel, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      actionType: 'access_violation',
      ipAddress: ipAddress,
      result: 'access_denied',
      severity: 'warning',
      module: 'access_control',
      details: {
        resource: resource,
        requestedAccessLevel: accessLevel,
        userAccessLevel: metadata.userAccessLevel || 'guest',
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.unauthorizedAttempts++;
    this.recordIncident(userId, 'UNAUTHORIZED_ACCESS_ATTEMPT');

    if (this.enableConsoleOutput) {
      console.log(`[SECURITY] Unauthorized access attempt by user ${userId} to ${resource}`);
    }

    return logEntry;
  }

  /**
   * Log failed authentication
   */
  logFailedAuthentication(userId, ipAddress, method, attemptNumber, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'FAILED_AUTHENTICATION',
      actionType: 'auth_failure',
      ipAddress: ipAddress,
      result: 'authentication_failed',
      severity: 'warning',
      module: 'auth',
      details: {
        authMethod: method,
        attemptNumber: attemptNumber,
        accountLocked: metadata.accountLocked || false,
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.failedAuth++;
    this.recordIncident(userId, 'FAILED_AUTHENTICATION');

    if (this.enableConsoleOutput) {
      console.log(`[SECURITY] Failed authentication for user ${userId} (Attempt ${attemptNumber})`);
    }

    return logEntry;
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(userId, ipAddress, activityType, description, riskScore, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'SUSPICIOUS_ACTIVITY',
      actionType: 'suspicious',
      ipAddress: ipAddress,
      result: 'flagged_for_review',
      severity: riskScore > 7 ? 'critical' : riskScore > 5 ? 'warning' : 'info',
      module: 'anomaly_detection',
      details: {
        activityType: activityType,
        description: description,
        riskScore: riskScore,
        automatedAction: metadata.automatedAction || 'none',
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.suspiciousActivities++;
    this.recordIncident(userId, 'SUSPICIOUS_ACTIVITY');

    if (this.enableConsoleOutput) {
      console.log(`[SECURITY] Suspicious activity detected: ${activityType} (Risk: ${riskScore}/10)`);
    }

    return logEntry;
  }

  /**
   * Record incident for tracking
   */
  recordIncident(userId, incidentType) {
    this.recentIncidents.push({
      timestamp: new Date(),
      userId: userId,
      incidentType: incidentType
    });

    // Keep recent incidents window (last hour)
    const oneHourAgo = new Date(Date.now() - 3600000);
    this.recentIncidents = this.recentIncidents.filter(incident => incident.timestamp > oneHourAgo);
  }

  /**
   * Check if user should be flagged
   */
  shouldFlagUser(userId) {
    const userIncidents = this.recentIncidents.filter(incident => incident.userId === userId);
    return {
      shouldFlag: userIncidents.length >= this.alertThreshold,
      incidentCount: userIncidents.length,
      threshold: this.alertThreshold,
      incidents: userIncidents
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

    // Enforce max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Get critical security logs
   */
  getCriticalLogs(options = {}) {
    let criticalLogs = this.logs.filter(log => log.severity === 'critical');

    // Filter by date range
    if (options.startDate && options.endDate) {
      criticalLogs = criticalLogs.filter(log =>
        log.timestamp >= options.startDate && log.timestamp <= options.endDate
      );
    }

    // Sort by timestamp (newest first)
    criticalLogs.sort((a, b) => b.timestamp - a.timestamp);

    const limit = options.limit || 100;
    criticalLogs = criticalLogs.slice(0, limit);

    return {
      criticalCount: criticalLogs.length,
      logs: criticalLogs
    };
  }

  /**
   * Get security logs by type
   */
  getLogsByType(type, options = {}) {
    let typeLogs = this.logs.filter(log => log.action === type);

    if (options.startDate && options.endDate) {
      typeLogs = typeLogs.filter(log =>
        log.timestamp >= options.startDate && log.timestamp <= options.endDate
      );
    }

    typeLogs.sort((a, b) => b.timestamp - a.timestamp);

    const limit = options.limit || 100;
    typeLogs = typeLogs.slice(0, limit);

    return {
      type: type,
      total: typeLogs.length,
      logs: typeLogs
    };
  }

  /**
   * Get security statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalSecurityEvents: this.logs.length,
      totalIncidentsLastHour: this.recentIncidents.length,
      criticalEventsCount: this.logs.filter(log => log.severity === 'critical').length,
      warningEventsCount: this.logs.filter(log => log.severity === 'warning').length
    };
  }

  /**
   * Clear all security logs
   */
  clearLogs() {
    this.logs = [];
    return { success: true, message: 'All security logs cleared' };
  }
}

module.exports = SecurityLogger;