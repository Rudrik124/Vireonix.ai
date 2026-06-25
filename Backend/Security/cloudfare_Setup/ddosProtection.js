/**
 * DDoS Protection Module
 * 
 * Purpose: Protect against Distributed Denial of Service (DDoS) attacks.
 * 
 * Responsibilities:
 * - Detect massive traffic spikes
 * - Detect request flooding
 * - Detect connection abuse
 * - Block malicious traffic before reaching backend
 */

class DDoSProtection {
  constructor(options = {}) {
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      detectedAttacks: 0,
      mitigatedAttacks: 0,
      falsePositives: 0
    };
    this.trafficHistory = [];
    this.attackLog = [];
    this.config = {
      requestThreshold: options.requestThreshold || 1000, // requests per minute
      trafficSpikeThreshold: options.trafficSpikeThreshold || 200, // % increase
      connectionAbuseLimitPerIP: options.connectionAbuseLimitPerIP || 50,
      timeWindow: options.timeWindow || 60000, // 1 minute in ms
      blockDuration: options.blockDuration || 300000, // 5 minutes in ms
      enableAutoMitigation: options.enableAutoMitigation !== false,
      alertThreshold: options.alertThreshold || 5000 // requests/min to alert
    };
    this.blockedIPs = new Map(); // IP -> unblock time
    this.ipTrafficMap = new Map(); // IP -> traffic data
  }

  /**
   * Analyze incoming request for DDoS indicators
   */
  analyzeRequest(requestData) {
    this.stats.totalRequests++;

    const ipAddress = requestData.ipAddress;
    const currentTime = Date.now();

    // Check if IP is already blocked
    if (this.isIPBlocked(ipAddress)) {
      this.stats.blockedRequests++;
      return {
        allowed: false,
        reason: 'IP is currently blocked due to suspicious activity',
        blockExpiry: this.blockedIPs.get(ipAddress)
      };
    }

    // Track IP traffic
    if (!this.ipTrafficMap.has(ipAddress)) {
      this.ipTrafficMap.set(ipAddress, {
        requests: [],
        firstSeen: currentTime,
        lastSeen: currentTime,
        connectionCount: 0
      });
    }

    const ipData = this.ipTrafficMap.get(ipAddress);
    ipData.requests.push(currentTime);
    ipData.lastSeen = currentTime;
    ipData.connectionCount++;

    // Clean old requests from history (outside time window)
    ipData.requests = ipData.requests.filter(time => currentTime - time < this.config.timeWindow);

    // Check for flooding
    const floodingResult = this.detectFloodingAttack(ipAddress, ipData);
    if (floodingResult.detected) {
      this.stats.detectedAttacks++;
      return {
        allowed: false,
        reason: 'Flooding attack detected',
        attackType: 'request_flooding',
        requestRate: floodingResult.requestRate
      };
    }

    // Check for connection abuse
    const abuseResult = this.detectConnectionAbuse(ipAddress, ipData);
    if (abuseResult.detected) {
      this.stats.detectedAttacks++;
      return {
        allowed: false,
        reason: 'Connection abuse detected',
        attackType: 'connection_abuse',
        connectionCount: abuseResult.connectionCount
      };
    }

    // Check for overall traffic spike
    const spikeResult = this.detectTrafficSpike();
    if (spikeResult.detected) {
      this.stats.detectedAttacks++;
      this.logAttack('traffic_spike', spikeResult);

      if (this.config.enableAutoMitigation) {
        return {
          allowed: true,
          warning: 'Traffic spike detected - connection may be rate limited',
          spikePercentage: spikeResult.spikePercentage
        };
      }
    }

    // Request allowed
    this.trafficHistory.push({
      timestamp: currentTime,
      ipAddress: ipAddress,
      requestsPerMinute: ipData.requests.length
    });

    return {
      allowed: true,
      reason: 'Request passed security checks'
    };
  }

  /**
   * Detect flooding attack
   */
  detectFloodingAttack(ipAddress, ipData) {
    const requestsPerMinute = ipData.requests.length;
    const requestThreshold = this.config.requestThreshold / 1000; // Normalize to requests per second

    if (requestsPerMinute > this.config.requestThreshold) {
      this.blockIP(ipAddress);
      this.stats.blockedRequests++;
      this.stats.mitigatedAttacks++;

      return {
        detected: true,
        requestRate: requestsPerMinute,
        threshold: this.config.requestThreshold
      };
    }

    return { detected: false };
  }

  /**
   * Detect connection abuse
   */
  detectConnectionAbuse(ipAddress, ipData) {
    if (ipData.connectionCount > this.config.connectionAbuseLimitPerIP) {
      this.blockIP(ipAddress);
      this.stats.blockedRequests++;
      this.stats.mitigatedAttacks++;

      return {
        detected: true,
        connectionCount: ipData.connectionCount,
        limit: this.config.connectionAbuseLimitPerIP
      };
    }

    return { detected: false };
  }

  /**
   * Detect traffic spike
   */
  detectTrafficSpike() {
    const currentTime = Date.now();
    const recentTraffic = this.trafficHistory.filter(
      entry => currentTime - entry.timestamp < this.config.timeWindow
    );

    if (recentTraffic.length === 0) {
      return { detected: false };
    }

    // Calculate average request rate
    const totalRequests = recentTraffic.length;
    const baselineRequests = this.stats.totalRequests / 100; // Simple baseline

    const spikePercentage = ((totalRequests - baselineRequests) / baselineRequests) * 100;

    if (spikePercentage > this.config.trafficSpikeThreshold) {
      return {
        detected: true,
        spikePercentage: spikePercentage.toFixed(2),
        currentRate: totalRequests,
        baselineRate: baselineRequests.toFixed(2)
      };
    }

    return { detected: false };
  }

  /**
   * Block IP address
   */
  blockIP(ipAddress, duration = null) {
    const blockDuration = duration || this.config.blockDuration;
    const unblockTime = new Date(Date.now() + blockDuration);

    this.blockedIPs.set(ipAddress, unblockTime);

    return {
      success: true,
      ipAddress: ipAddress,
      blockedUntil: unblockTime,
      duration: blockDuration
    };
  }

  /**
   * Unblock IP address
   */
  unblockIP(ipAddress) {
    if (!this.blockedIPs.has(ipAddress)) {
      return {
        success: false,
        error: `IP ${ipAddress} is not blocked`
      };
    }

    this.blockedIPs.delete(ipAddress);

    return {
      success: true,
      ipAddress: ipAddress,
      message: `IP ${ipAddress} unblocked`
    };
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ipAddress) {
    if (!this.blockedIPs.has(ipAddress)) {
      return false;
    }

    const unblockTime = this.blockedIPs.get(ipAddress);
    if (new Date() > unblockTime) {
      this.blockedIPs.delete(ipAddress);
      return false;
    }

    return true;
  }

  /**
   * Log attack
   */
  logAttack(attackType, details) {
    const logEntry = {
      timestamp: new Date(),
      attackType: attackType,
      details: details
    };

    this.attackLog.push(logEntry);

    // Keep attack log manageable
    if (this.attackLog.length > 1000) {
      this.attackLog = this.attackLog.slice(-1000);
    }
  }

  /**
   * Get blocked IPs
   */
  getBlockedIPs() {
    const blocked = [];

    for (const [ipAddress, unblockTime] of this.blockedIPs.entries()) {
      if (new Date() < unblockTime) {
        blocked.push({
          ipAddress: ipAddress,
          blockedUntil: unblockTime,
          timeRemaining: unblockTime - new Date()
        });
      }
    }

    return {
      blockedCount: blocked.length,
      blockedIPs: blocked
    };
  }

  /**
   * Get attack history
   */
  getAttackHistory(options = {}) {
    let history = [...this.attackLog];

    if (options.attackType) {
      history = history.filter(entry => entry.attackType === options.attackType);
    }

    history.sort((a, b) => b.timestamp - a.timestamp);

    const limit = options.limit || 100;
    history = history.slice(0, limit);

    return {
      total: this.attackLog.length,
      filtered: history.length,
      entries: history
    };
  }

  /**
   * Get traffic statistics
   */
  getTrafficStats() {
    const now = Date.now();
    const recentTraffic = this.trafficHistory.filter(
      entry => now - entry.timestamp < this.config.timeWindow
    );

    return {
      totalRequests: this.stats.totalRequests,
      recentRequests: recentTraffic.length,
      blockedRequests: this.stats.blockedRequests,
      detectedAttacks: this.stats.detectedAttacks,
      mitigatedAttacks: this.stats.mitigatedAttacks,
      blockRate: this.stats.totalRequests > 0
        ? ((this.stats.blockedRequests / this.stats.totalRequests) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentlyBlockedIPs: this.getBlockedIPs().blockedCount,
      trackedIPs: this.ipTrafficMap.size,
      recentAttacks: this.attackLog.length
    };
  }

  /**
   * Clear attack log
   */
  clearAttackLog() {
    this.attackLog = [];
    return { success: true, message: 'Attack log cleared' };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      detectedAttacks: 0,
      mitigatedAttacks: 0,
      falsePositives: 0
    };
  }
}

module.exports = DDoSProtection;