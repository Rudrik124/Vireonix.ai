/**
 * Rate Limit Rules Module
 * 
 * Purpose: Implement Cloudflare-level rate limiting to protect APIs.
 * 
 * Responsibilities:
 * - Protect Login API
 * - Protect Video Generation API
 * - Protect Image Generation API
 * - Protect Upload API
 * - Protect other endpoints from excessive requests
 */

class RateLimitRules {
  constructor(options = {}) {
    this.limits = options.limits || this.getDefaultLimits();
    this.stats = {
      requestsAllowed: 0,
      requestsBlocked: 0,
      limitsExceeded: 0
    };
    this.requestTracker = new Map(); // IP -> endpoint tracking
    this.limitViolations = [];
  }

  /**
   * Get default rate limits for critical endpoints
   */
  getDefaultLimits() {
    return {
      '/api/auth/login': {
        name: 'Login API',
        requestsPerMinute: 10,
        requestsPerHour: 100,
        priority: 'critical',
        description: 'Protect against brute force login attacks'
      },
      '/api/generate/video': {
        name: 'Video Generation API',
        requestsPerMinute: 5,
        requestsPerHour: 50,
        priority: 'high',
        description: 'Prevent resource exhaustion from video generation'
      },
      '/api/generate/image': {
        name: 'Image Generation API',
        requestsPerMinute: 20,
        requestsPerHour: 200,
        priority: 'high',
        description: 'Prevent resource exhaustion from image generation'
      },
      '/api/upload': {
        name: 'Upload API',
        requestsPerMinute: 15,
        requestsPerHour: 150,
        priority: 'high',
        description: 'Prevent upload abuse and bandwidth exhaustion'
      },
      '/api/download': {
        name: 'Download API',
        requestsPerMinute: 30,
        requestsPerHour: 300,
        priority: 'medium',
        description: 'Prevent excessive download requests'
      },
      '/api/prompt': {
        name: 'Prompt API',
        requestsPerMinute: 30,
        requestsPerHour: 500,
        priority: 'medium',
        description: 'Rate limit prompt submissions'
      },
      'global': {
        name: 'Global Rate Limit',
        requestsPerMinute: 1000,
        requestsPerHour: 10000,
        priority: 'medium',
        description: 'Overall platform rate limit'
      }
    };
  }

  /**
   * Check if request exceeds rate limit
   */
  checkRateLimit(ipAddress, endpoint) {
    // Get the limit for this endpoint
    const limit = this.limits[endpoint] || this.limits['global'];

    // Initialize tracker for this IP if needed
    if (!this.requestTracker.has(ipAddress)) {
      this.requestTracker.set(ipAddress, new Map());
    }

    const ipTracking = this.requestTracker.get(ipAddress);

    // Initialize endpoint tracking for this IP if needed
    if (!ipTracking.has(endpoint)) {
      ipTracking.set(endpoint, {
        minuteRequests: [],
        hourRequests: [],
        lastReset: Date.now()
      });
    }

    const tracking = ipTracking.get(endpoint);
    const now = Date.now();

    // Clean old requests (older than 1 hour)
    tracking.hourRequests = tracking.hourRequests.filter(time => now - time < 3600000);
    tracking.minuteRequests = tracking.minuteRequests.filter(time => now - time < 60000);

    // Check minute limit
    if (tracking.minuteRequests.length >= limit.requestsPerMinute) {
      this.stats.requestsBlocked++;
      this.stats.limitsExceeded++;
      this.logViolation(ipAddress, endpoint, 'minute', tracking.minuteRequests.length, limit.requestsPerMinute);

      return {
        allowed: false,
        reason: 'Rate limit exceeded (per minute)',
        limit: limit.requestsPerMinute,
        current: tracking.minuteRequests.length,
        timeWindow: '1 minute',
        retryAfter: 60
      };
    }

    // Check hour limit
    if (tracking.hourRequests.length >= limit.requestsPerHour) {
      this.stats.requestsBlocked++;
      this.stats.limitsExceeded++;
      this.logViolation(ipAddress, endpoint, 'hour', tracking.hourRequests.length, limit.requestsPerHour);

      return {
        allowed: false,
        reason: 'Rate limit exceeded (per hour)',
        limit: limit.requestsPerHour,
        current: tracking.hourRequests.length,
        timeWindow: '1 hour',
        retryAfter: 3600
      };
    }

    // Request allowed - track it
    tracking.minuteRequests.push(now);
    tracking.hourRequests.push(now);
    this.stats.requestsAllowed++;

    return {
      allowed: true,
      reason: 'Request allowed',
      remaining: {
        perMinute: limit.requestsPerMinute - tracking.minuteRequests.length,
        perHour: limit.requestsPerHour - tracking.hourRequests.length
      }
    };
  }

  /**
   * Get endpoint rate limit
   */
  getEndpointLimit(endpoint) {
    const limit = this.limits[endpoint];

    if (!limit) {
      return {
        found: false,
        error: `Rate limit for endpoint '${endpoint}' not found`
      };
    }

    return {
      found: true,
      endpoint: endpoint,
      limit: limit
    };
  }

  /**
   * Set custom rate limit
   */
  setRateLimit(endpoint, requestsPerMinute, requestsPerHour, options = {}) {
    this.limits[endpoint] = {
      name: options.name || endpoint,
      requestsPerMinute: requestsPerMinute,
      requestsPerHour: requestsPerHour,
      priority: options.priority || 'medium',
      description: options.description || ''
    };

    return {
      success: true,
      endpoint: endpoint,
      limit: this.limits[endpoint]
    };
  }

  /**
   * Get all rate limits
   */
  getAllLimits() {
    return {
      total: Object.keys(this.limits).length,
      limits: this.limits
    };
  }

  /**
   * Get IP usage statistics
   */
  getIPUsage(ipAddress, endpoint = null) {
    if (!this.requestTracker.has(ipAddress)) {
      return {
        ipAddress: ipAddress,
        usage: {}
      };
    }

    const ipTracking = this.requestTracker.get(ipAddress);
    const usage = {};

    if (endpoint) {
      if (ipTracking.has(endpoint)) {
        const tracking = ipTracking.get(endpoint);
        const limit = this.limits[endpoint] || this.limits['global'];

        usage[endpoint] = {
          minuteUsage: tracking.minuteRequests.length,
          minuteLimit: limit.requestsPerMinute,
          hourUsage: tracking.hourRequests.length,
          hourLimit: limit.requestsPerHour
        };
      }
    } else {
      // Get usage for all endpoints
      for (const [ep, tracking] of ipTracking.entries()) {
        const limit = this.limits[ep] || this.limits['global'];

        usage[ep] = {
          minuteUsage: tracking.minuteRequests.length,
          minuteLimit: limit.requestsPerMinute,
          hourUsage: tracking.hourRequests.length,
          hourLimit: limit.requestsPerHour
        };
      }
    }

    return {
      ipAddress: ipAddress,
      usage: usage
    };
  }

  /**
   * Whitelist IP (bypass rate limits)
   */
  whitelistIP(ipAddress) {
    // This would be implemented in actual Cloudflare setup
    // For now, we'll track whitelisted IPs

    if (!this.requestTracker.has(ipAddress)) {
      this.requestTracker.set(ipAddress, new Map());
    }

    const ipData = this.requestTracker.get(ipAddress);
    ipData.whitelisted = true;

    return {
      success: true,
      ipAddress: ipAddress,
      message: `IP ${ipAddress} whitelisted from rate limits`
    };
  }

  /**
   * Remove IP from whitelist
   */
  removeWhitelist(ipAddress) {
    if (this.requestTracker.has(ipAddress)) {
      const ipData = this.requestTracker.get(ipAddress);
      ipData.whitelisted = false;
    }

    return {
      success: true,
      ipAddress: ipAddress,
      message: `IP ${ipAddress} removed from whitelist`
    };
  }

  /**
   * Log rate limit violation
   */
  logViolation(ipAddress, endpoint, timeWindow, current, limit) {
    const violation = {
      timestamp: new Date(),
      ipAddress: ipAddress,
      endpoint: endpoint,
      timeWindow: timeWindow,
      currentRequests: current,
      limit: limit,
      exceeded: current - limit
    };

    this.limitViolations.push(violation);

    // Keep violations log manageable
    if (this.limitViolations.length > 10000) {
      this.limitViolations = this.limitViolations.slice(-10000);
    }
  }

  /**
   * Get rate limit violations
   */
  getViolations(options = {}) {
    let violations = [...this.limitViolations];

    if (options.ipAddress) {
      violations = violations.filter(v => v.ipAddress === options.ipAddress);
    }

    if (options.endpoint) {
      violations = violations.filter(v => v.endpoint === options.endpoint);
    }

    if (options.startDate && options.endDate) {
      violations = violations.filter(v =>
        v.timestamp >= options.startDate && v.timestamp <= options.endDate
      );
    }

    violations.sort((a, b) => b.timestamp - a.timestamp);

    const limit = options.limit || 100;
    violations = violations.slice(0, limit);

    return {
      total: this.limitViolations.length,
      filtered: violations.length,
      violations: violations
    };
  }

  /**
   * Get most violated endpoints
   */
  getMostViolatedEndpoints(limit = 10) {
    const endpointViolations = {};

    for (const violation of this.limitViolations) {
      if (!endpointViolations[violation.endpoint]) {
        endpointViolations[violation.endpoint] = 0;
      }
      endpointViolations[violation.endpoint]++;
    }

    const sorted = Object.entries(endpointViolations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([endpoint, count]) => ({
        endpoint: endpoint,
        violationCount: count
      }));

    return {
      mostViolated: sorted
    };
  }

  /**
   * Get repeated offenders (IPs with most violations)
   */
  getRepeatedOffenders(limit = 10) {
    const ipViolations = {};

    for (const violation of this.limitViolations) {
      if (!ipViolations[violation.ipAddress]) {
        ipViolations[violation.ipAddress] = 0;
      }
      ipViolations[violation.ipAddress]++;
    }

    const sorted = Object.entries(ipViolations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([ipAddress, count]) => ({
        ipAddress: ipAddress,
        violationCount: count
      }));

    return {
      repeatedOffenders: sorted
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    const total = this.stats.requestsAllowed + this.stats.requestsBlocked;

    return {
      ...this.stats,
      totalRequests: total,
      blockRate: total > 0
        ? ((this.stats.requestsBlocked / total) * 100).toFixed(2) + '%'
        : '0%',
      trackedIPs: this.requestTracker.size,
      totalViolations: this.limitViolations.length
    };
  }

  /**
   * Clear violations log
   */
  clearViolationsLog() {
    this.limitViolations = [];
    return { success: true, message: 'Violations log cleared' };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      requestsAllowed: 0,
      requestsBlocked: 0,
      limitsExceeded: 0
    };
  }
}

module.exports = RateLimitRules;