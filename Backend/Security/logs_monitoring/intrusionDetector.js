/**
 * Intrusion Detector
 * 
 * Purpose: Detect suspicious user behavior and abuse patterns
 * 
 * Detects:
 * - Repeated failed login attempts
 * - API endpoint abuse
 * - Prompt/content abuse
 * - Upload abuse
 * - Anomalous activity patterns
 */

class IntrusionDetector {
  constructor(options = {}) {
    this.config = {
      // Failed login detection
      failedLoginThreshold: options.failedLoginThreshold || 5,
      failedLoginWindow: options.failedLoginWindow || 15 * 60 * 1000, // 15 minutes
      
      // API abuse detection
      apiRequestsThreshold: options.apiRequestsThreshold || 1000,
      apiRequestsWindow: options.apiRequestsWindow || 60 * 1000,     // 1 minute
      
      // Prompt abuse detection
      promptAbusThreshold: options.promptAbusThreshold || 100,
      promptAbuseWindow: options.promptAbuseWindow || 60 * 1000,      // 1 minute
      
      // Upload abuse detection
      uploadAbuseThreshold: options.uploadAbuseThreshold || 50,
      uploadAbuseWindow: options.uploadAbuseWindow || 60 * 1000,      // 1 minute
      
      // Lockout settings
      enableAutoLockout: options.enableAutoLockout !== false,
      lockoutDuration: options.lockoutDuration || 30 * 60 * 1000,    // 30 minutes
      
      // Alert settings
      enableAlerts: options.enableAlerts !== false,
      alertThreshold: options.alertThreshold || 3
    };
    
    this.failedLogins = new Map();          // userId -> [timestamps]
    this.apiRequests = new Map();           // userId -> [timestamps]
    this.promptAbuse = new Map();           // userId -> [timestamps]
    this.uploadAbuse = new Map();           // userId -> [timestamps]
    this.lockedAccounts = new Set();        // locked userIds
    this.intrusions = [];                   // intrusion events log
    
    this.stats = {
      failedLoginDetected: 0,
      apiAbuseDetected: 0,
      promptAbuseDetected: 0,
      uploadAbuseDetected: 0,
      accountsLocked: 0,
      alertsTriggered: 0,
      intrusionsBlocked: 0
    };
  }

  /**
   * Detect failed login attempts
   */
  detectFailedLogin(userId, ipAddress = null) {
    try {
      // Check if account is locked
      if (this.lockedAccounts.has(userId)) {
        return {
          detected: true,
          type: 'ACCOUNT_LOCKED',
        category: 'failed_login',
          severity: 'critical',
          action: 'block'
        };
      }

      // Get current timestamp
      const now = Date.now();
      const windowStart = now - this.config.failedLoginWindow;

      // Initialize if needed
      if (!this.failedLogins.has(userId)) {
        this.failedLogins.set(userId, []);
      }

      const attempts = this.failedLogins.get(userId);
      
      // Remove old attempts outside window
      const recentAttempts = attempts.filter(time => time > windowStart);
      this.failedLogins.set(userId, recentAttempts);

      // Add current attempt
      recentAttempts.push(now);

      // Check threshold
      if (recentAttempts.length >= this.config.failedLoginThreshold) {
        this.stats.failedLoginDetected++;

        // Lock account if enabled
        if (this.config.enableAutoLockout) {
          this.lockAccount(userId, 'failed_login_attempts');
          this.stats.accountsLocked++;
        }

        // Create intrusion event
        this.logIntrusion({
          type: 'FAILED_LOGIN_ABUSE',
          userId: userId,
          ipAddress: ipAddress,
          severity: 'high',
          attempts: recentAttempts.length,
          threshold: this.config.failedLoginThreshold
        });

        // Trigger alert
        if (this.config.enableAlerts) {
          this.triggerAlert('FAILED_LOGIN_ABUSE', userId);
        }

        this.stats.intrusionsBlocked++;

        return {
          detected: true,
          type: 'FAILED_LOGIN_ABUSE',
          category: 'failed_login',
          severity: 'high',
          attempts: recentAttempts.length,
          threshold: this.config.failedLoginThreshold,
          action: 'lockout',
          locked: true
        };
      }

      return {
        detected: false,
        attemptsRemaining: this.config.failedLoginThreshold - recentAttempts.length
      };
    } catch (error) {
      return { detected: false, error: error.message };
    }
  }

  /**
   * Detect API endpoint abuse
   */
  detectAPIAbuse(userId, endpoint, ipAddress = null) {
    try {
      const now = Date.now();
      const windowStart = now - this.config.apiRequestsWindow;
      const key = `${userId}_${endpoint}`;

      // Initialize if needed
      if (!this.apiRequests.has(key)) {
        this.apiRequests.set(key, []);
      }

      const requests = this.apiRequests.get(key);
      
      // Remove old requests outside window
      const recentRequests = requests.filter(time => time > windowStart);
      this.apiRequests.set(key, recentRequests);

      // Add current request
      recentRequests.push(now);

      // Check threshold
      if (recentRequests.length >= this.config.apiRequestsThreshold) {
        this.stats.apiAbuseDetected++;

        // Create intrusion event
        this.logIntrusion({
          type: 'API_ABUSE',
          userId: userId,
          endpoint: endpoint,
          ipAddress: ipAddress,
          severity: 'high',
          requests: recentRequests.length,
          threshold: this.config.apiRequestsThreshold
        });

        // Trigger alert
        if (this.config.enableAlerts) {
          this.triggerAlert('API_ABUSE', userId);
        }

        this.stats.intrusionsBlocked++;

        return {
          detected: true,
          type: 'API_ABUSE',
          category: 'api_abuse',
          endpoint: endpoint,
          severity: 'high',
          requests: recentRequests.length,
          threshold: this.config.apiRequestsThreshold,
          action: 'throttle'
        };
      }

      return {
        detected: false,
        requestsRemaining: this.config.apiRequestsThreshold - recentRequests.length
      };
    } catch (error) {
      return { detected: false, error: error.message };
    }
  }

  /**
   * Detect prompt abuse
   */
  detectPromptAbuse(userId, ipAddress = null) {
    try {
      const now = Date.now();
      const windowStart = now - this.config.promptAbuseWindow;

      // Initialize if needed
      if (!this.promptAbuse.has(userId)) {
        this.promptAbuse.set(userId, []);
      }

      const attempts = this.promptAbuse.get(userId);
      
      // Remove old attempts outside window
      const recentAttempts = attempts.filter(time => time > windowStart);
      this.promptAbuse.set(userId, recentAttempts);

      // Add current attempt
      recentAttempts.push(now);

      // Check threshold
      if (recentAttempts.length >= this.config.promptAbusThreshold) {
        this.stats.promptAbuseDetected++;

        // Create intrusion event
        this.logIntrusion({
          type: 'PROMPT_ABUSE',
          userId: userId,
          ipAddress: ipAddress,
          severity: 'medium',
          attempts: recentAttempts.length,
          threshold: this.config.promptAbusThreshold
        });

        // Trigger alert
        if (this.config.enableAlerts) {
          this.triggerAlert('PROMPT_ABUSE', userId);
        }

        this.stats.intrusionsBlocked++;

        return {
          detected: true,
          type: 'PROMPT_ABUSE',
          category: 'prompt_abuse',
          severity: 'medium',
          attempts: recentAttempts.length,
          threshold: this.config.promptAbusThreshold,
          action: 'rate_limit'
        };
      }

      return {
        detected: false,
        attemptsRemaining: this.config.promptAbusThreshold - recentAttempts.length
      };
    } catch (error) {
      return { detected: false, error: error.message };
    }
  }

  /**
   * Detect upload abuse
   */
  detectUploadAbuse(userId, ipAddress = null) {
    try {
      const now = Date.now();
      const windowStart = now - this.config.uploadAbuseWindow;

      // Initialize if needed
      if (!this.uploadAbuse.has(userId)) {
        this.uploadAbuse.set(userId, []);
      }

      const uploads = this.uploadAbuse.get(userId);
      
      // Remove old uploads outside window
      const recentUploads = uploads.filter(time => time > windowStart);
      this.uploadAbuse.set(userId, recentUploads);

      // Add current upload
      recentUploads.push(now);

      // Check threshold
      if (recentUploads.length >= this.config.uploadAbuseThreshold) {
        this.stats.uploadAbuseDetected++;

        // Create intrusion event
        this.logIntrusion({
          type: 'UPLOAD_ABUSE',
          userId: userId,
          ipAddress: ipAddress,
          severity: 'medium',
          uploads: recentUploads.length,
          threshold: this.config.uploadAbuseThreshold
        });

        // Trigger alert
        if (this.config.enableAlerts) {
          this.triggerAlert('UPLOAD_ABUSE', userId);
        }

        this.stats.intrusionsBlocked++;

        return {
          detected: true,
          type: 'UPLOAD_ABUSE',
          category: 'upload_abuse',
          severity: 'medium',
          uploads: recentUploads.length,
          threshold: this.config.uploadAbuseThreshold,
          action: 'block_uploads'
        };
      }

      return {
        detected: false,
        uploadsRemaining: this.config.uploadAbuseThreshold - recentUploads.length
      };
    } catch (error) {
      return { detected: false, error: error.message };
    }
  }

  /**
   * Lock user account
   */
  lockAccount(userId, reason) {
    this.lockedAccounts.add(userId);
    
    // Schedule automatic unlock
    setTimeout(() => {
      this.unlockAccount(userId);
    }, this.config.lockoutDuration);

    return {
      success: true,
      userId: userId,
      locked: true,
      reason: reason,
      unlocksAt: Date.now() + this.config.lockoutDuration
    };
  }

  /**
   * Unlock user account
   */
  unlockAccount(userId) {
    this.lockedAccounts.delete(userId);
    return { success: true, userId: userId, unlocked: true };
  }

  /**
   * Check if account is locked
   */
  isAccountLocked(userId) {
    return this.lockedAccounts.has(userId);
  }

  /**
   * Log intrusion event
   */
  logIntrusion(event) {
    const intrusion = {
      timestamp: Date.now(),
      ...event
    };
    this.intrusions.push(intrusion);

    // Keep log manageable
    if (this.intrusions.length > 10000) {
      this.intrusions = this.intrusions.slice(-10000);
    }
  }

  /**
   * Trigger alert
   */
  triggerAlert(alertType, userId) {
    this.stats.alertsTriggered++;
    // In production, send to monitoring/alerting system
    console.warn(`[INTRUSION ALERT] ${alertType} for user ${userId}`);
  }

  /**
   * Get intrusion log
   */
  getIntrusionLog(options = {}) {
    let log = [...this.intrusions];

    if (options.userId) {
      log = log.filter(e => e.userId === options.userId);
    }

    if (options.type) {
      log = log.filter(e => e.type === options.type);
    }

    if (options.severity) {
      log = log.filter(e => e.severity === options.severity);
    }

    log.sort((a, b) => b.timestamp - a.timestamp);

    const limit = options.limit || 100;
    return {
      total: this.intrusions.length,
      filtered: log.length,
      events: log.slice(0, limit)
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      lockedAccounts: this.lockedAccounts.size,
      totalIntrusions: this.intrusions.length
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      failedLoginDetected: 0,
      apiAbuseDetected: 0,
      promptAbuseDetected: 0,
      uploadAbuseDetected: 0,
      accountsLocked: 0,
      alertsTriggered: 0,
      intrusionsBlocked: 0
    };
  }
}

module.exports = IntrusionDetector;