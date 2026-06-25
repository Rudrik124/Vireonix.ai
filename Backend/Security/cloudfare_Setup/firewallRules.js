/**
 * Firewall Rules Module
 * 
 * Purpose: Define and enforce Cloudflare firewall policies.
 * 
 * Responsibilities:
 * - Block known malicious IPs
 * - Block requests from blocked countries
 * - Detect suspicious traffic patterns
 * - Block attack signatures
 * - Allow legitimate users
 */

class FirewallRules {
  constructor(options = {}) {
    this.rules = [];
    this.blockedIPs = new Set(options.blockedIPs || []);
    this.allowedIPs = new Set(options.allowedIPs || []);
    this.blockedCountries = new Set(options.blockedCountries || []);
    this.allowedCountries = new Set(options.allowedCountries || []);
    this.attackSignatures = options.attackSignatures || this.getDefaultAttackSignatures();
    this.stats = {
      rulesCreated: 0,
      requestsBlocked: 0,
      requestsAllowed: 0,
      countriesBlocked: 0,
      signatureMatches: 0
    };
    this.ruleLog = [];
  }

  /**
   * Get default attack signatures
   */
  getDefaultAttackSignatures() {
    return [
      {
        name: 'SQL_Injection',
        patterns: ['UNION', 'SELECT', 'DROP', 'INSERT', 'DELETE', 'exec', 'script'],
        severity: 'critical'
      },
      {
        name: 'XSS_Attack',
        patterns: ['<script', '</script>', 'javascript:', 'onerror=', 'onclick='],
        severity: 'critical'
      },
      {
        name: 'Path_Traversal',
        patterns: ['..//', '..\\\\', '%2e%2e/', 'directory.traversal'],
        severity: 'high'
      },
      {
        name: 'Command_Injection',
        patterns: [';rm', '|cat', '&&', 'bash', 'cmd.exe'],
        severity: 'critical'
      },
      {
        name: 'XXE_Attack',
        patterns: ['<!ENTITY', 'SYSTEM', 'DOCTYPE'],
        severity: 'high'
      }
    ];
  }

  /**
   * Check if request should be allowed
   */
  evaluateRequest(requestData) {
    const ipAddress = requestData.ipAddress;
    const country = requestData.country || 'UNKNOWN';
    const userAgent = requestData.userAgent || '';
    const url = requestData.url || '';

    // Check whitelist first (allow takes priority)
    if (this.allowedIPs.has(ipAddress)) {
      this.stats.requestsAllowed++;
      return {
        allowed: true,
        reason: 'IP is whitelisted'
      };
    }

    // Check IP blacklist
    if (this.blockedIPs.has(ipAddress)) {
      this.stats.requestsBlocked++;
      this.logRuleMatch('IP_BLACKLIST', requestData);
      return {
        allowed: false,
        reason: 'IP is blacklisted',
        ruleType: 'IP_BLACKLIST'
      };
    }

    // Check country restrictions
    if (this.blockedCountries.has(country)) {
      this.stats.countriesBlocked++;
      this.stats.requestsBlocked++;
      this.logRuleMatch('COUNTRY_BLOCKED', requestData);
      return {
        allowed: false,
        reason: `Country ${country} is blocked`,
        ruleType: 'COUNTRY_BLOCKED',
        country: country
      };
    }

    // Check country whitelist (if enabled)
    if (this.allowedCountries.size > 0 && !this.allowedCountries.has(country)) {
      this.stats.requestsBlocked++;
      this.logRuleMatch('COUNTRY_NOT_WHITELISTED', requestData);
      return {
        allowed: false,
        reason: `Country ${country} is not whitelisted`,
        ruleType: 'COUNTRY_NOT_WHITELISTED'
      };
    }

    // Check for attack signatures
    const signatureMatch = this.detectAttackSignature(url, userAgent);
    if (signatureMatch) {
      this.stats.signatureMatches++;
      this.stats.requestsBlocked++;
      this.logRuleMatch('ATTACK_SIGNATURE', requestData, signatureMatch);
      return {
        allowed: false,
        reason: `Attack signature detected: ${signatureMatch.name}`,
        ruleType: 'ATTACK_SIGNATURE',
        signatureName: signatureMatch.name,
        severity: signatureMatch.severity
      };
    }

    // Check suspicious patterns
    const suspiciousResult = this.detectSuspiciousTraffic(requestData);
    if (suspiciousResult.suspicious) {
      this.stats.requestsBlocked++;
      this.logRuleMatch('SUSPICIOUS_TRAFFIC', requestData, suspiciousResult);
      return {
        allowed: false,
        reason: 'Suspicious traffic pattern detected',
        ruleType: 'SUSPICIOUS_TRAFFIC',
        suspiciousIndicators: suspiciousResult.indicators
      };
    }

    // Request passes all checks
    this.stats.requestsAllowed++;
    return {
      allowed: true,
      reason: 'Request passed all firewall checks'
    };
  }

  /**
   * Detect attack signature
   */
  detectAttackSignature(url, userAgent) {
    const content = (url + userAgent).toUpperCase();

    for (const signature of this.attackSignatures) {
      for (const pattern of signature.patterns) {
        if (content.includes(pattern.toUpperCase())) {
          return signature;
        }
      }
    }

    return null;
  }

  /**
   * Detect suspicious traffic patterns
   */
  detectSuspiciousTraffic(requestData) {
    const indicators = [];

    // Check for unusual user agents
    if (!requestData.userAgent || requestData.userAgent === '') {
      indicators.push('Missing user agent');
    }

    // Check for missing headers
    if (!requestData.referer && requestData.method === 'POST') {
      indicators.push('Missing referer on POST request');
    }

    // Check for suspicious request rates (would need historical data)
    if (requestData.requestsPerSecond && requestData.requestsPerSecond > 100) {
      indicators.push('High request rate');
    }

    // Check for bot indicators
    if (requestData.userAgent && this.isBotUserAgent(requestData.userAgent)) {
      indicators.push('Bot detected in user agent');
    }

    return {
      suspicious: indicators.length > 0,
      indicators: indicators
    };
  }

  /**
   * Check if user agent is bot
   */
  isBotUserAgent(userAgent) {
    const botPatterns = ['bot', 'crawler', 'scraper', 'spider', 'wget', 'curl'];
    const agent = userAgent.toLowerCase();

    return botPatterns.some(pattern => agent.includes(pattern));
  }

  /**
   * Add IP to blacklist
   */
  blockIP(ipAddress, reason = '') {
    if (this.blockedIPs.has(ipAddress)) {
      return {
        success: false,
        error: `IP ${ipAddress} is already blacklisted`
      };
    }

    this.blockedIPs.add(ipAddress);

    return {
      success: true,
      ipAddress: ipAddress,
      reason: reason,
      message: `IP ${ipAddress} added to blacklist`
    };
  }

  /**
   * Remove IP from blacklist
   */
  unblockIP(ipAddress) {
    if (!this.blockedIPs.has(ipAddress)) {
      return {
        success: false,
        error: `IP ${ipAddress} is not in blacklist`
      };
    }

    this.blockedIPs.delete(ipAddress);

    return {
      success: true,
      ipAddress: ipAddress,
      message: `IP ${ipAddress} removed from blacklist`
    };
  }

  /**
   * Add country to blocked list
   */
  blockCountry(countryCode) {
    if (this.blockedCountries.has(countryCode)) {
      return {
        success: false,
        error: `Country ${countryCode} is already blocked`
      };
    }

    this.blockedCountries.add(countryCode);
    this.stats.countriesBlocked++;

    return {
      success: true,
      country: countryCode,
      message: `Country ${countryCode} added to blocked list`
    };
  }

  /**
   * Remove country from blocked list
   */
  unblockCountry(countryCode) {
    if (!this.blockedCountries.has(countryCode)) {
      return {
        success: false,
        error: `Country ${countryCode} is not blocked`
      };
    }

    this.blockedCountries.delete(countryCode);

    return {
      success: true,
      country: countryCode,
      message: `Country ${countryCode} removed from blocked list`
    };
  }

  /**
   * Create custom firewall rule
   */
  createRule(ruleName, conditions, action) {
    const rule = {
      id: `rule_${Date.now()}`,
      name: ruleName,
      conditions: conditions,
      action: action, // 'block' or 'allow'
      createdAt: new Date(),
      enabled: true
    };

    this.rules.push(rule);
    this.stats.rulesCreated++;

    return {
      success: true,
      rule: rule,
      message: `Rule '${ruleName}' created`
    };
  }

  /**
   * Enable/disable rule
   */
  toggleRule(ruleId, enabled) {
    const rule = this.rules.find(r => r.id === ruleId);

    if (!rule) {
      return {
        success: false,
        error: `Rule ${ruleId} not found`
      };
    }

    rule.enabled = enabled;

    return {
      success: true,
      rule: rule,
      message: `Rule '${rule.name}' is now ${enabled ? 'enabled' : 'disabled'}`
    };
  }

  /**
   * Delete rule
   */
  deleteRule(ruleId) {
    const index = this.rules.findIndex(r => r.id === ruleId);

    if (index === -1) {
      return {
        success: false,
        error: `Rule ${ruleId} not found`
      };
    }

    const deletedRule = this.rules.splice(index, 1)[0];

    return {
      success: true,
      message: `Rule '${deletedRule.name}' deleted`
    };
  }

  /**
   * Get all rules
   */
  getAllRules() {
    return {
      total: this.rules.length,
      rules: this.rules
    };
  }

  /**
   * Log rule match
   */
  logRuleMatch(ruleType, requestData, details = null) {
    const logEntry = {
      timestamp: new Date(),
      ruleType: ruleType,
      ipAddress: requestData.ipAddress,
      country: requestData.country,
      url: requestData.url,
      details: details
    };

    this.ruleLog.push(logEntry);

    // Keep log manageable
    if (this.ruleLog.length > 5000) {
      this.ruleLog = this.ruleLog.slice(-5000);
    }
  }

  /**
   * Get rule violation log
   */
  getRuleViolationLog(options = {}) {
    let log = [...this.ruleLog];

    if (options.ruleType) {
      log = log.filter(entry => entry.ruleType === options.ruleType);
    }

    if (options.ipAddress) {
      log = log.filter(entry => entry.ipAddress === options.ipAddress);
    }

    log.sort((a, b) => b.timestamp - a.timestamp);

    const limit = options.limit || 100;
    log = log.slice(0, limit);

    return {
      total: this.ruleLog.length,
      filtered: log.length,
      entries: log
    };
  }

  /**
   * Get firewall summary
   */
  getFirewallSummary() {
    return {
      stats: this.stats,
      blockedIPCount: this.blockedIPs.size,
      blockedCountries: Array.from(this.blockedCountries),
      allowedIPCount: this.allowedIPs.size,
      allowedCountries: Array.from(this.allowedCountries),
      customRules: this.rules.length,
      attackSignatures: this.attackSignatures.length
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    const total = this.stats.requestsBlocked + this.stats.requestsAllowed;

    return {
      ...this.stats,
      totalRequests: total,
      blockRate: total > 0
        ? ((this.stats.requestsBlocked / total) * 100).toFixed(2) + '%'
        : '0%',
      ruleViolationsLogged: this.ruleLog.length
    };
  }

  /**
   * Clear rule violation log
   */
  clearRuleLog() {
    this.ruleLog = [];
    return { success: true, message: 'Rule violation log cleared' };
  }
}

module.exports = FirewallRules;