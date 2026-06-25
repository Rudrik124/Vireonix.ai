/**
 * Bot Protection Module
 * 
 * Purpose: Detect and block automated bots while allowing legitimate traffic.
 * 
 * Responsibilities:
 * - Identify scraping bots
 * - Detect spam bots
 * - Prevent automated abuse
 * - Filter fake traffic
 * - Allow verified search engine bots
 */

class BotProtection {
  constructor(options = {}) {
    this.stats = {
      botDetected: 0,
      botsBlocked: 0,
      legitimateBots: 0,
      suspiciousTraffic: 0
    };
    this.botLog = [];
    this.verifiedBots = options.verifiedBots || this.getVerifiedBots();
    this.suspiciousBots = options.suspiciousBots || this.getSuspiciousBots();
    this.config = {
      blockSuspiciousBots: options.blockSuspiciousBots !== false,
      allowSearchEngineBots: options.allowSearchEngineBots !== false,
      enableChallenge: options.enableChallenge !== false,
      challengeScore: options.challengeScore || 0.5 // 0-1 confidence score
    };
  }

  /**
   * Get verified search engine bots
   */
  getVerifiedBots() {
    return {
      'google-bot': {
        name: 'Google Bot',
        userAgentPattern: ['Googlebot', 'Google-Site-Verification'],
        verified: true,
        category: 'search_engine'
      },
      'bing-bot': {
        name: 'Bing Bot',
        userAgentPattern: ['Bingbot', 'MSNBot'],
        verified: true,
        category: 'search_engine'
      },
      'yahoo-bot': {
        name: 'Yahoo Bot',
        userAgentPattern: ['Slurp'],
        verified: true,
        category: 'search_engine'
      },
      'duckduckgo-bot': {
        name: 'DuckDuckGo Bot',
        userAgentPattern: ['DuckDuckBot'],
        verified: true,
        category: 'search_engine'
      },
      'facebook-bot': {
        name: 'Facebook Bot',
        userAgentPattern: ['facebookexternalhit', 'Facebot'],
        verified: true,
        category: 'social_media'
      },
      'twitter-bot': {
        name: 'Twitter Bot',
        userAgentPattern: ['Twitterbot'],
        verified: true,
        category: 'social_media'
      }
    };
  }

  /**
   * Get suspicious bot patterns
   */
  getSuspiciousBots() {
    return {
      'scraper-bot': {
        indicators: ['curl', 'wget', 'python', 'scrapy', 'beautifulsoup'],
        riskScore: 0.9,
        category: 'scraper'
      },
      'automated-tool': {
        indicators: ['selenium', 'phantomjs', 'headless', 'puppeteer'],
        riskScore: 0.85,
        category: 'automation'
      },
      'spam-bot': {
        indicators: ['spam', 'advertise', 'promote', 'click', 'vote'],
        riskScore: 0.8,
        category: 'spam'
      },
      'malicious-bot': {
        indicators: ['sqlmap', 'nikto', 'nmap', 'masscan', 'metasploit'],
        riskScore: 1.0,
        category: 'security_threat'
      }
    };
  }

  /**
   * Analyze request for bot indicators
   */
  analyzeRequest(requestData) {
    const userAgent = requestData.userAgent || '';
    const headers = requestData.headers || {};
    const behaviorPattern = requestData.behavior || {};

    // Check for verified search engine bots
    const verifiedBotResult = this.checkVerifiedBots(userAgent);
    if (verifiedBotResult.isVerified) {
      this.stats.legitimateBots++;
      this.logBot(userAgent, 'VERIFIED_BOT', verifiedBotResult);

      return {
        isBot: false,
        botType: 'verified_bot',
        botName: verifiedBotResult.botName,
        action: 'allow',
        reason: 'Verified search engine bot'
      };
    }

    // Check for suspicious bots
    const suspiciousResult = this.detectSuspiciousBot(userAgent, headers, behaviorPattern);
    if (suspiciousResult.detected) {
      this.stats.botDetected++;

      if (this.config.blockSuspiciousBots) {
        this.stats.botsBlocked++;
        this.logBot(userAgent, 'MALICIOUS_BOT', suspiciousResult);

        return {
          isBot: true,
          botType: 'suspicious_bot',
          riskScore: suspiciousResult.riskScore,
          action: 'block',
          reason: `Suspicious bot detected: ${suspiciousResult.category}`,
          indicators: suspiciousResult.indicators
        };
      } else {
        // Challenge instead of block
        if (this.config.enableChallenge) {
          this.logBot(userAgent, 'SUSPICIOUS_BOT_CHALLENGED', suspiciousResult);

          return {
            isBot: true,
            botType: 'suspicious_bot',
            riskScore: suspiciousResult.riskScore,
            action: 'challenge',
            reason: 'Suspected bot - requires verification',
            challenge: 'cloudflare_challenge'
          };
        }
      }
    }

    // Check for bot-like behavior
    const behaviorResult = this.detectBotBehavior(behaviorPattern);
    if (behaviorResult.suspicious) {
      this.stats.suspiciousTraffic++;
      this.logBot(userAgent, 'SUSPICIOUS_BEHAVIOR', behaviorResult);

      return {
        isBot: true,
        botType: 'behavior_pattern',
        suspiciousIndicators: behaviorResult.indicators,
        action: 'challenge',
        reason: 'Suspicious behavior pattern detected'
      };
    }

    // Appears to be legitimate traffic
    return {
      isBot: false,
      action: 'allow',
      reason: 'Traffic appears legitimate'
    };
  }

  /**
   * Check if user agent belongs to verified bot
   */
  checkVerifiedBots(userAgent) {
    for (const [botId, botData] of Object.entries(this.verifiedBots)) {
      for (const pattern of botData.userAgentPattern) {
        if (userAgent.toLowerCase().includes(pattern.toLowerCase())) {
          return {
            isVerified: true,
            botId: botId,
            botName: botData.name,
            category: botData.category
          };
        }
      }
    }

    return { isVerified: false };
  }

  /**
   * Detect suspicious bot patterns
   */
  detectSuspiciousBot(userAgent, headers, behavior) {
    const contentToAnalyze = (userAgent + JSON.stringify(headers) + JSON.stringify(behavior)).toLowerCase();
    const detectedBots = [];
    let maxRiskScore = 0;

    for (const [botType, botData] of Object.entries(this.suspiciousBots)) {
      for (const indicator of botData.indicators) {
        if (contentToAnalyze.includes(indicator.toLowerCase())) {
          detectedBots.push({
            type: botType,
            category: botData.category,
            indicator: indicator,
            riskScore: botData.riskScore
          });

          if (botData.riskScore > maxRiskScore) {
            maxRiskScore = botData.riskScore;
          }
        }
      }
    }

    if (detectedBots.length > 0) {
      return {
        detected: true,
        bots: detectedBots,
        indicators: detectedBots.map(b => b.indicator),
        category: detectedBots[0].category,
        riskScore: maxRiskScore
      };
    }

    return { detected: false };
  }

  /**
   * Detect bot-like behavior patterns
   */
  detectBotBehavior(behavior) {
    const indicators = [];

    // Check for suspicious patterns
    if (behavior.requestsPerSecond && behavior.requestsPerSecond > 50) {
      indicators.push('Extremely high request rate');
    }

    if (behavior.sameBrowserFingerprint && behavior.multipleIPs) {
      indicators.push('Same browser from multiple IPs');
    }

    if (behavior.noJavaScriptExecution !== false && behavior.noJavaScriptExecution) {
      indicators.push('No JavaScript execution capability');
    }

    if (behavior.rapidParameterChanges) {
      indicators.push('Rapid parameter changes detected');
    }

    if (behavior.patternedBehavior) {
      indicators.push('Mechanical behavior pattern');
    }

    if (behavior.noInteraction) {
      indicators.push('No user interaction detected');
    }

    return {
      suspicious: indicators.length > 0,
      indicators: indicators
    };
  }

  /**
   * Log bot detection
   */
  logBot(userAgent, detectionType, details) {
    const logEntry = {
      timestamp: new Date(),
      userAgent: userAgent,
      detectionType: detectionType,
      details: details
    };

    this.botLog.push(logEntry);

    // Keep log manageable
    if (this.botLog.length > 10000) {
      this.botLog = this.botLog.slice(-10000);
    }
  }

  /**
   * Get bot detection log
   */
  getBotDetectionLog(options = {}) {
    let log = [...this.botLog];

    if (options.detectionType) {
      log = log.filter(entry => entry.detectionType === options.detectionType);
    }

    if (options.startDate && options.endDate) {
      log = log.filter(entry =>
        entry.timestamp >= options.startDate && entry.timestamp <= options.endDate
      );
    }

    log.sort((a, b) => b.timestamp - a.timestamp);

    const limit = options.limit || 100;
    log = log.slice(0, limit);

    return {
      total: this.botLog.length,
      filtered: log.length,
      entries: log
    };
  }

  /**
   * Add custom bot signature
   */
  addBotSignature(botId, indicators, category, riskScore) {
    this.suspiciousBots[botId] = {
      indicators: indicators,
      category: category,
      riskScore: riskScore
    };

    return {
      success: true,
      botId: botId,
      message: `Bot signature '${botId}' added`
    };
  }

  /**
   * Add verified bot
   */
  addVerifiedBot(botId, name, userAgentPatterns, category) {
    this.verifiedBots[botId] = {
      name: name,
      userAgentPattern: userAgentPatterns,
      verified: true,
      category: category
    };

    return {
      success: true,
      botId: botId,
      message: `Verified bot '${name}' added`
    };
  }

  /**
   * Get bot statistics
   */
  getBotStats() {
    return {
      ...this.stats,
      detectionLogSize: this.botLog.length,
      verifiedBotsCount: Object.keys(this.verifiedBots).length,
      suspiciousPatternsCount: Object.keys(this.suspiciousBots).length
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    const total = this.stats.botDetected + this.stats.legitimateBots + this.stats.suspiciousTraffic;

    return {
      ...this.stats,
      totalAnalyzed: total,
      botBlockRate: this.stats.botDetected > 0
        ? ((this.stats.botsBlocked / this.stats.botDetected) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Clear bot detection log
   */
  clearBotLog() {
    this.botLog = [];
    return { success: true, message: 'Bot detection log cleared' };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      botDetected: 0,
      botsBlocked: 0,
      legitimateBots: 0,
      suspiciousTraffic: 0
    };
  }
}

module.exports = BotProtection;