/**
 * Admin Session Control Module
 * 
 * Purpose: Protect admin sessions.
 * 
 * Responsibilities:
 * - Monitor session expiry
 * - Track multiple active sessions
 * - Detect suspicious login activity
 * - Monitor inactive sessions
 * - Force logout when necessary
 */

class AdminSessionControl {
  constructor(adminAuth, options = {}) {
    this.adminAuth = adminAuth;
    this.suspiciousActivityLog = [];
    this.stats = {
      sessionsCreated: 0,
      sessionsExpired: 0,
      sessionsForceLogout: 0,
      suspiciousActivities: 0,
      inactiveSessionsCleared: 0
    };
    this.config = {
      maxActiveSessions: options.maxActiveSessions || 3,
      inactivityTimeout: options.inactivityTimeout || 1800000, // 30 minutes
      sessionWarningTime: options.sessionWarningTime || 300000, // 5 minutes before expiry
      maxSuspiciousAttempts: options.maxSuspiciousAttempts || 5,
      ipChangeThreshold: options.ipChangeThreshold || 2 // Flag if IP changes more than this
    };
    this.sessionWarnings = new Map();
    this.maxLogEntries = options.maxLogEntries || 5000;
  }

  /**
   * Track new session creation
   */
  trackSessionCreation(sessionData) {
    this.stats.sessionsCreated++;

    return {
      success: true,
      sessionId: sessionData.sessionId,
      username: sessionData.username,
      createdAt: new Date(),
      expiresAt: sessionData.expiryTime
    };
  }

  /**
   * Monitor session expiry
   */
  checkSessionExpiry(sessionId) {
    const sessions = this.adminAuth.getActiveSessions();
    const session = sessions.find(s => s.sessionId === sessionId);

    if (!session) {
      return {
        found: false,
        error: 'Session not found'
      };
    }

    const now = new Date();
    const expiryTime = new Date(session.expiryTime);
    const timeUntilExpiry = expiryTime - now;

    // Session expired
    if (timeUntilExpiry < 0) {
      this.stats.sessionsExpired++;
      return {
        expired: true,
        sessionId: sessionId,
        expiredAt: expiryTime,
        timeExpired: Math.abs(timeUntilExpiry) + 'ms'
      };
    }

    // Session about to expire (warning)
    if (timeUntilExpiry < this.config.sessionWarningTime) {
      return {
        warning: true,
        sessionId: sessionId,
        timeUntilExpiry: timeUntilExpiry,
        expiresAt: expiryTime,
        message: 'Session is about to expire'
      };
    }

    // Session is valid
    return {
      valid: true,
      sessionId: sessionId,
      timeRemaining: timeUntilExpiry,
      expiresAt: expiryTime
    };
  }

  /**
   * Check for multiple active sessions
   */
  checkMultipleActiveSessions(username) {
    const sessions = this.adminAuth.getActiveSessions();
    const userSessions = sessions.filter(s => s.username === username);

    if (userSessions.length > this.config.maxActiveSessions) {
      this.logSuspiciousActivity(username, 'MULTIPLE_SESSIONS', `Admin has ${userSessions.length} active sessions (max: ${this.config.maxActiveSessions})`);

      return {
        suspicious: true,
        username: username,
        activeSessions: userSessions.length,
        maxAllowed: this.config.maxActiveSessions,
        excess: userSessions.length - this.config.maxActiveSessions,
        sessions: userSessions
      };
    }

    return {
      suspicious: false,
      username: username,
      activeSessions: userSessions.length,
      maxAllowed: this.config.maxActiveSessions,
      sessions: userSessions
    };
  }

  /**
   * Detect suspicious login activity
   */
  detectSuspiciousActivity(loginData) {
    const suspiciousFlags = [];

    // Check for unusual IP address
    if (loginData.previousIpAddress && loginData.ipAddress !== loginData.previousIpAddress) {
      suspiciousFlags.push({
        type: 'IP_CHANGE',
        severity: 'medium',
        details: `IP changed from ${loginData.previousIpAddress} to ${loginData.ipAddress}`
      });
    }

    // Check for unusual user agent
    if (loginData.previousUserAgent && loginData.userAgent !== loginData.previousUserAgent) {
      suspiciousFlags.push({
        type: 'USER_AGENT_CHANGE',
        severity: 'low',
        details: 'User agent changed from last session'
      });
    }

    // Check for rapid successive logins
    if (loginData.lastLoginTime) {
      const timeSinceLastLogin = new Date() - new Date(loginData.lastLoginTime);
      if (timeSinceLastLogin < 60000) { // Less than 1 minute
        suspiciousFlags.push({
          type: 'RAPID_LOGIN',
          severity: 'high',
          details: 'Login attempt within 1 minute of last login'
        });
      }
    }

    // Check for login attempts after unusual hours
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      suspiciousFlags.push({
        type: 'UNUSUAL_HOURS',
        severity: 'low',
        details: `Login at unusual hour: ${hour}:00`
      });
    }

    if (suspiciousFlags.length > 0) {
      this.stats.suspiciousActivities++;
      this.logSuspiciousActivity(loginData.username, 'SUSPICIOUS_LOGIN', JSON.stringify(suspiciousFlags));

      return {
        suspicious: true,
        username: loginData.username,
        flags: suspiciousFlags,
        flagCount: suspiciousFlags.length
      };
    }

    return {
      suspicious: false,
      username: loginData.username,
      flags: []
    };
  }

  /**
   * Monitor inactive sessions
   */
  monitorInactiveSessions(inactivityThreshold = null) {
    const threshold = inactivityThreshold || this.config.inactivityTimeout;
    const sessions = this.adminAuth.getActiveSessions();
    const now = new Date();
    const inactiveSessions = [];

    sessions.forEach(session => {
      const inactiveTime = now - new Date(session.lastActivityTime);

      if (inactiveTime > threshold) {
        inactiveSessions.push({
          sessionId: session.sessionId,
          username: session.username,
          inactiveFor: inactiveTime,
          lastActivityTime: session.lastActivityTime
        });
      }
    });

    return {
      inactiveCount: inactiveSessions.length,
      inactivityThreshold: threshold,
      sessions: inactiveSessions
    };
  }

  /**
   * Force logout session
   */
  forceLogoutSession(sessionId, reason = '') {
    try {
      const result = this.adminAuth.logoutAdmin(sessionId);

      if (result.success) {
        this.stats.sessionsForceLogout++;
        this.logSuspiciousActivity('system', 'FORCE_LOGOUT', `Session ${sessionId} - Reason: ${reason}`);

        return {
          success: true,
          sessionId: sessionId,
          username: result.message.match(/admin (.*?) logged out/)?.[1] || 'unknown',
          reason: reason,
          forcedAt: new Date()
        };
      }

      return {
        success: false,
        error: result.error
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Force logout all inactive sessions
   */
  forceLogoutInactiveSessions(inactivityThreshold = null) {
    const inactiveData = this.monitorInactiveSessions(inactivityThreshold);
    const forceLoggedOut = [];

    for (const session of inactiveData.sessions) {
      const result = this.forceLogoutSession(session.sessionId, 'Inactive session timeout');
      if (result.success) {
        forceLoggedOut.push(session);
        this.stats.inactiveSessionsCleared++;
      }
    }

    return {
      forcedLogoutCount: forceLoggedOut.length,
      sessions: forceLoggedOut,
      message: `${forceLoggedOut.length} inactive sessions terminated`
    };
  }

  /**
   * Force logout all sessions for admin
   */
  forceLogoutAllAdminSessions(username, reason = '') {
    try {
      const result = this.adminAuth.forceLogoutAdminAllSessions(username);

      if (result.success) {
        this.stats.sessionsForceLogout += result.sessionsTerminated;
        this.logSuspiciousActivity(username, 'FORCE_LOGOUT_ALL', reason);

        return {
          success: true,
          username: username,
          sessionsTerminated: result.sessionsTerminated,
          reason: reason,
          terminatedAt: new Date()
        };
      }

      return {
        success: false,
        error: result.error
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enforce max active sessions
   */
  enforceMaxActiveSessions(username) {
    const multipleSessionCheck = this.checkMultipleActiveSessions(username);

    if (multipleSessionCheck.suspicious) {
      // Force logout oldest sessions
      const sessionsToRemove = multipleSessionCheck.sessions.slice(0, multipleSessionCheck.excess);

      for (const session of sessionsToRemove) {
        this.forceLogoutSession(session.sessionId, 'Max active sessions exceeded');
      }

      return {
        success: true,
        username: username,
        forceLoggedOutCount: sessionsToRemove.length,
        message: `Exceeded max active sessions (${this.config.maxActiveSessions})`
      };
    }

    return {
      success: true,
      message: 'Session count within limits'
    };
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(username, activityType, details) {
    const logEntry = {
      timestamp: new Date(),
      username: username,
      activityType: activityType,
      details: details
    };

    this.suspiciousActivityLog.push(logEntry);

    // Keep log size manageable
    if (this.suspiciousActivityLog.length > this.maxLogEntries) {
      this.suspiciousActivityLog = this.suspiciousActivityLog.slice(-this.maxLogEntries);
    }
  }

  /**
   * Get suspicious activity log
   */
  getSuspiciousActivityLog(options = {}) {
    let log = [...this.suspiciousActivityLog];

    // Filter by username
    if (options.username) {
      log = log.filter(entry => entry.username === options.username);
    }

    // Filter by activity type
    if (options.activityType) {
      log = log.filter(entry => entry.activityType === options.activityType);
    }

    // Sort by timestamp (newest first)
    log.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    const limit = options.limit || 100;
    log = log.slice(0, limit);

    return {
      total: this.suspiciousActivityLog.length,
      filtered: log.length,
      entries: log
    };
  }

  /**
   * Get session health report
   */
  getSessionHealthReport() {
    const allSessions = this.adminAuth.getActiveSessions();
    const expiringCount = allSessions.filter(s => {
      const timeUntilExpiry = new Date(s.expiryTime) - new Date();
      return timeUntilExpiry < this.config.sessionWarningTime;
    }).length;

    const suspiciousActivityCount = this.suspiciousActivityLog.length;

    return {
      totalActiveSessions: allSessions.length,
      sessionHealth: {
        healthy: allSessions.length - expiringCount,
        expiring: expiringCount,
        suspicious: suspiciousActivityCount
      },
      maxActiveSessionsLimit: this.config.maxActiveSessions,
      inactivityTimeout: this.config.inactivityTimeout,
      sessionWarningTime: this.config.sessionWarningTime
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      suspiciousActivityLogSize: this.suspiciousActivityLog.length
    };
  }

  /**
   * Clear suspicious activity log
   */
  clearSuspiciousActivityLog() {
    this.suspiciousActivityLog = [];
    return { success: true, message: 'Suspicious activity log cleared' };
  }
}

module.exports = AdminSessionControl;