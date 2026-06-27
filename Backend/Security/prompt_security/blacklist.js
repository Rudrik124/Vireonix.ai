/**
 * Enhanced Blacklist Module
 * 
 * Purpose: Maintain a comprehensive list of blocked words, phrases, and patterns
 * that should be rejected before AI processing.
 * 
 * Responsibilities:
 * 1. Store Blocked Keywords (explicit content, violence, terror, illegal activities)
 * 2. Store Blocked Prompt Patterns (injection attempts, bypass attempts)
 * 3. Store Restricted Names (celebrities, politicians, protected brands)
 * 4. Support Fast Lookup (rapid matching against entire blacklist)
 * 5. Track User/IP/Prompt Violations (original functionality preserved)
 * 
 * Workflow:
 * Prompt → blacklist.check() → Match Found? → Yes: Block | No: Continue
 */

import crypto from 'crypto';

class Blacklist {
  constructor(options = {}) {
    // ORIGINAL FUNCTIONALITY - Violation Tracking
    this.blacklistedPrompts = new Map();
    this.blacklistedUsers = new Map();
    this.blacklistedIps = new Map();
    this.expirationTime = options.expirationTime || 24 * 60 * 60 * 1000; // 24 hours

    /**
     * RESPONSIBILITY 1: STORE BLOCKED KEYWORDS
     * Organized by category for easy management and severity tracking
     */
    this.blockedKeywords = {
      // Sexual/Adult Content (Explicit)
      explicit: [
        'xxx', 'pornographic', 'porn', 'sex video', 'naked images',
        'adult content', 'sexually explicit', 'nude', 'masturbation',
        'sexually graphic', 'erotic', 'orgasm', 'penetration'
      ],

      // Violence Related
      violence: [
        'kill', 'murder', 'blood', 'gore', 'torture', 'rape',
        'assault', 'stab', 'shoot', 'bomb', 'explosion', 'mutilation',
        'decapitate', 'dismember', 'crucify', 'hanging', 'poisoning'
      ],

      // Terrorism & Extremism
      terrorism: [
        'terrorist attack', 'bomb threat', 'jihadist', 'al-qaeda',
        'isis', 'extremist', 'suicide bomb', 'hijack plane',
        'attack government', 'chemical weapon', 'biological weapon',
        'nuclear attack', 'mass shooting'
      ],

      // Illegal Activities
      illegal: [
        'cocaine', 'heroin', 'methamphetamine', 'drug deal',
        'human trafficking', 'child exploitation', 'money laundering',
        'bank robbery', 'credit card fraud', 'identity theft',
        'counterfeiting', 'smuggling', 'smuggle', 'arms trafficking'
      ],

      // Hate Speech
      hate: [
        'racial slur', 'ethnic cleansing', 'genocide', 'apartheid',
        'white supremacy', 'nazi', 'kkk', 'racist joke',
        'discriminate against', 'religious extremism'
      ],

      // Self-Harm
      selfHarm: [
        'suicide', 'cutting', 'self-injury', 'self-harm instructions',
        'hanging yourself', 'overdose method', 'lethal dose',
        'wrist cutting', 'asphyxiation', 'drowning'
      ]
    };

    /**
     * RESPONSIBILITY 2: STORE BLOCKED PROMPT PATTERNS
     * Patterns that indicate injection or bypass attempts
     */
    this.blockedPatterns = [
      // Instruction Override Attempts
      'ignore previous instructions',
      'forget everything',
      'disregard all prior',
      'ignore everything above',
      
      // Bypass Attempts
      'bypass safety',
      'bypass moderation',
      'disable safety features',
      'turn off moderation',
      'remove restrictions',
      'disable filters',
      
      // System Prompt Extraction
      'show system prompt',
      'show me the system prompt',
      'reveal system prompt',
      'display system prompt',
      'what are your instructions',
      'tell me your prompt',
      'system message',
      'system override',
      'show me the prompt',
      
      // Role Play / Jailbreak
      'act as if',
      'pretend you have no rules',
      'roleplay as unrestricted',
      'simulate being',
      'imagine you are',
      
      // Code Injection
      'eval(',
      'exec(',
      'system(',
      'shell command',
      'execute command',
      'run script',
      
      // Admin/Developer Mode
      'enable admin mode',
      'activate debug mode',
      'developer mode',
      'maintenance mode',
      'backend access'
    ];

    /**
     * RESPONSIBILITY 3: STORE RESTRICTED NAMES
     * Names that may require special handling based on policy
     */
    this.restrictedNames = {
      // High-Profile Celebrities
      celebrities: [
        'taylor swift', 'beyonce', 'kim kardashian', 'elon musk',
        'oprah winfrey', 'bill gates', 'mark zuckerberg',
        'johnny depp', 'amber heard', 'brad pitt', 'angelina jolie'
      ],

      // Political Figures
      politicians: [
        'donald trump', 'joe biden', 'hillary clinton', 'barack obama',
        'vladimir putin', 'xi jinping', 'vladimir zelensky',
        'boris johnson', 'theresa may', 'macron'
      ],

      // Protected Brands
      brands: [
        'apple', 'microsoft', 'google', 'facebook', 'amazon',
        'tesla', 'coca-cola', 'pepsi', 'nike', 'disney',
        'netflix', 'spotify', 'adobe', 'nvidia', 'intel'
      ]
    };

    // Statistics tracking
    this.stats = {
      totalChecks: 0,
      keywordMatches: 0,
      patternMatches: 0,
      nameMatches: 0,
      lastCheck: null
    };
  }

  /**
   * RESPONSIBILITY 4: MAIN CHECK FUNCTION - Fast Lookup Support
   * Check if prompt contains any blacklisted content
   * 
   * @param {string} prompt - The text to check
   * @returns {object} - { isBlocked, reason, category, matches, severity, details }
   */
  check(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      return {
        isBlocked: false,
        reason: 'Invalid input',
        category: null,
        matches: [],
        severity: 'none',
        details: null
      };
    }

    this.stats.totalChecks++;
    const promptLower = prompt.toLowerCase();
    const results = {
      isBlocked: false,
      reason: null,
      category: null,
      matches: [],
      severity: 'none',
      details: null
    };

    // Check 1: Blocked Keywords
    const keywordMatch = this.checkKeywords(promptLower);
    if (keywordMatch) {
      results.isBlocked = true;
      results.reason = `Contains blocked keyword: ${keywordMatch.match}`;
      results.category = 'blocked_keyword';
      results.matches.push(keywordMatch.match);
      results.severity = this.calculateSeverity(keywordMatch.category);
      results.details = {
        type: 'keyword',
        category: keywordMatch.category,
        match: keywordMatch.match
      };
      this.stats.keywordMatches++;
      this.stats.lastCheck = new Date();
      return results;
    }

    // Check 2: Blocked Patterns
    const patternMatch = this.checkPatterns(promptLower);
    if (patternMatch) {
      results.isBlocked = true;
      results.reason = `Contains blocked pattern: ${patternMatch}`;
      results.category = 'blocked_pattern';
      results.matches.push(patternMatch);
      results.severity = 'high'; // Patterns are typically high severity
      results.details = {
        type: 'pattern',
        pattern: patternMatch
      };
      this.stats.patternMatches++;
      this.stats.lastCheck = new Date();
      return results;
    }

    // Check 3: Restricted Names
    const nameMatch = this.checkNames(promptLower);
    if (nameMatch) {
      results.isBlocked = false; // Names alone don't block, but flag for monitoring
      results.reason = `Contains restricted name: ${nameMatch.name}`;
      results.category = 'restricted_name';
      results.matches.push(nameMatch.name);
      results.severity = 'low'; // Names alone are lower severity
      results.details = {
        type: 'name',
        nameType: nameMatch.type,
        name: nameMatch.name,
        requiresReview: true
      };
      this.stats.nameMatches++;
      this.stats.lastCheck = new Date();
      // Note: Not blocked automatically, but flagged for review
    }

    this.stats.lastCheck = new Date();
    return results;
  }

  /**
   * Check if prompt contains any blocked keywords
   * 
   * @param {string} promptLower - Lowercase prompt text
   * @returns {object|null} - { match, category } or null
   */
  checkKeywords(promptLower) {
    for (const [category, keywords] of Object.entries(this.blockedKeywords)) {
      for (const keyword of keywords) {
        // Word boundary matching for accuracy
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        if (regex.test(promptLower)) {
          return { match: keyword, category };
        }
      }
    }
    return null;
  }

  /**
   * Check if prompt contains any blocked patterns
   * 
   * @param {string} promptLower - Lowercase prompt text
   * @returns {string|null} - Matched pattern or null
   */
  checkPatterns(promptLower) {
    for (const pattern of this.blockedPatterns) {
      // Pattern matching with word boundaries
      const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      if (regex.test(promptLower)) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * Check if prompt mentions restricted names
   * Doesn't block automatically, but flags for monitoring
   * 
   * @param {string} promptLower - Lowercase prompt text
   * @returns {object|null} - { name, type } or null
   */
  checkNames(promptLower) {
    for (const [type, names] of Object.entries(this.restrictedNames)) {
      for (const name of names) {
        // Word boundary matching
        const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        if (regex.test(promptLower)) {
          return { name, type };
        }
      }
    }
    return null;
  }

  /**
   * Calculate severity level based on keyword category
   * 
   * @param {string} category - Keyword category
   * @returns {string} - 'low', 'medium', 'high', or 'critical'
   */
  calculateSeverity(category) {
    const severityMap = {
      explicit: 'high',
      violence: 'high',
      terrorism: 'critical',
      illegal: 'critical',
      hate: 'high',
      selfHarm: 'critical'
    };
    return severityMap[category] || 'medium';
  }

  /**
   * Get all blocked keywords in a category
   * 
   * @param {string} category - Category name
   * @returns {array} - Keywords in category
   */
  getKeywordsInCategory(category) {
    if (category && this.blockedKeywords[category]) {
      return this.blockedKeywords[category];
    }
    return null;
  }

  /**
   * Get all blocked patterns
   * 
   * @returns {array} - All blocked patterns
   */
  getBlockedPatterns() {
    return [...this.blockedPatterns];
  }

  /**
   * Get all restricted names in a category
   * 
   * @param {string} type - Name type (celebrities, politicians, brands)
   * @returns {array} - Names in category
   */
  getRestrictedNames(type) {
    if (type && this.restrictedNames[type]) {
      return this.restrictedNames[type];
    }
    return null;
  }

  /**
   * Add a new blocked keyword
   * 
   * @param {string} category - Keyword category
   * @param {string} keyword - New keyword to block
   * @returns {boolean} - Success
   */
  addBlockedKeyword(category, keyword) {
    if (!keyword || !category) return false;
    if (!this.blockedKeywords[category]) {
      this.blockedKeywords[category] = [];
    }
    if (!this.blockedKeywords[category].includes(keyword.toLowerCase())) {
      this.blockedKeywords[category].push(keyword.toLowerCase());
      return true;
    }
    return false;
  }

  /**
   * Add a new blocked pattern
   * 
   * @param {string} pattern - New pattern to block
   * @returns {boolean} - Success
   */
  addBlockedPattern(pattern) {
    if (!pattern) return false;
    if (!this.blockedPatterns.includes(pattern.toLowerCase())) {
      this.blockedPatterns.push(pattern.toLowerCase());
      return true;
    }
    return false;
  }

  /**
   * Remove a blocked keyword
   * 
   * @param {string} category - Keyword category
   * @param {string} keyword - Keyword to remove
   * @returns {boolean} - Success
   */
  removeBlockedKeyword(category, keyword) {
    if (!keyword || !category) return false;
    if (!this.blockedKeywords[category]) return false;
    
    const index = this.blockedKeywords[category].indexOf(keyword.toLowerCase());
    if (index !== -1) {
      this.blockedKeywords[category].splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove a blocked pattern
   * 
   * @param {string} pattern - Pattern to remove
   * @returns {boolean} - Success
   */
  removeBlockedPattern(pattern) {
    if (!pattern) return false;
    
    const index = this.blockedPatterns.indexOf(pattern.toLowerCase());
    if (index !== -1) {
      this.blockedPatterns.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Find if a word exists anywhere in blacklist
   * 
   * @param {string} word - Word to search for
   * @returns {object} - { found, locations }
   */
  findWord(word) {
    if (!word) return { found: false, locations: [] };
    
    const wordLower = word.toLowerCase();
    const locations = [];

    // Search in keywords
    for (const [category, keywords] of Object.entries(this.blockedKeywords)) {
      if (keywords.includes(wordLower)) {
        locations.push({
          type: 'keyword',
          category: category,
          severity: this.calculateSeverity(category)
        });
      }
    }

    // Search in patterns
    if (this.blockedPatterns.includes(wordLower)) {
      locations.push({
        type: 'pattern',
        severity: 'high'
      });
    }

    // Search in names
    for (const [nameType, names] of Object.entries(this.restrictedNames)) {
      if (names.includes(wordLower)) {
        locations.push({
          type: 'name',
          category: nameType,
          severity: 'low'
        });
      }
    }

    return {
      found: locations.length > 0,
      locations: locations
    };
  }

  /**
   * Export blacklist data
   * 
   * @returns {object} - Complete blacklist data
   */
  exportBlacklist() {
    return {
      blockedKeywords: JSON.parse(JSON.stringify(this.blockedKeywords)),
      blockedPatterns: [...this.blockedPatterns],
      restrictedNames: JSON.parse(JSON.stringify(this.restrictedNames)),
      exportDate: new Date().toISOString()
    };
  }

  /**
   * Import blacklist data
   * 
   * @param {object} data - Blacklist data to import
   * @returns {boolean} - Success
   */
  importBlacklist(data) {
    if (!data) return false;
    
    try {
      if (data.blockedKeywords) {
        this.blockedKeywords = JSON.parse(JSON.stringify(data.blockedKeywords));
      }
      if (data.blockedPatterns) {
        this.blockedPatterns = [...data.blockedPatterns];
      }
      if (data.restrictedNames) {
        this.restrictedNames = JSON.parse(JSON.stringify(data.restrictedNames));
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  // ============================================
  // ORIGINAL FUNCTIONALITY - Preserved Below
  // ============================================

  /**
   * Generate hash for prompt
   * @param {string} prompt - Prompt to hash
   * @returns {string} - Hash of prompt
   */
  hashPrompt(prompt) {
    return crypto.createHash('sha256').update(prompt).digest('hex');
  }

  /**
   * Add prompt to blacklist
   * @param {string} prompt - Prompt to blacklist
   * @param {object} metadata - Additional metadata
   */
  addPrompt(prompt, metadata = {}) {
    const hash = this.hashPrompt(prompt);
    this.blacklistedPrompts.set(hash, {
      prompt: prompt,
      addedAt: Date.now(),
      metadata: metadata
    });
  }

  /**
   * Check if prompt is blacklisted
   * @param {string} prompt - Prompt to check
   * @returns {boolean} - True if blacklisted
   */
  isPromptBlacklisted(prompt) {
    const hash = this.hashPrompt(prompt);
    return this.blacklistedPrompts.has(hash);
  }

  /**
   * Add user to blacklist
   * @param {string|number} userId - User ID to blacklist
   * @param {string} reason - Reason for blacklist
   */
  addUser(userId, reason = '') {
    this.blacklistedUsers.set(userId, {
      userId: userId,
      reason: reason,
      addedAt: Date.now()
    });
  }

  /**
   * Check if user is blacklisted
   * @param {string|number} userId - User ID to check
   * @returns {boolean} - True if blacklisted
   */
  isUserBlacklisted(userId) {
    return this.blacklistedUsers.has(userId);
  }

  /**
   * Remove user from blacklist
   * @param {string|number} userId - User ID to remove
   * @returns {boolean} - True if removed
   */
  removeUser(userId) {
    return this.blacklistedUsers.delete(userId);
  }

  /**
   * Add IP address to blacklist
   * @param {string} ip - IP address to blacklist
   * @param {string} reason - Reason for blacklist
   */
  addIp(ip, reason = '') {
    this.blacklistedIps.set(ip, {
      ip: ip,
      reason: reason,
      addedAt: Date.now(),
      count: (this.blacklistedIps.get(ip)?.count || 0) + 1
    });
  }

  /**
   * Check if IP is blacklisted
   * @param {string} ip - IP address to check
   * @returns {boolean} - True if blacklisted
   */
  isIpBlacklisted(ip) {
    return this.blacklistedIps.has(ip);
  }

  /**
   * Get blacklist entry for IP
   * @param {string} ip - IP address
   * @returns {object|null} - Blacklist entry or null
   */
  getIpEntry(ip) {
    return this.blacklistedIps.get(ip) || null;
  }

  /**
   * Clean expired entries
   * @returns {number} - Number of entries removed
   */
  cleanExpired() {
    const now = Date.now();
    let removed = 0;

    // Clean expired prompts
    for (const [hash, entry] of this.blacklistedPrompts.entries()) {
      if (now - entry.addedAt > this.expirationTime) {
        this.blacklistedPrompts.delete(hash);
        removed++;
      }
    }

    // Clean expired users
    for (const [userId, entry] of this.blacklistedUsers.entries()) {
      if (now - entry.addedAt > this.expirationTime) {
        this.blacklistedUsers.delete(userId);
        removed++;
      }
    }

    // Clean expired IPs
    for (const [ip, entry] of this.blacklistedIps.entries()) {
      if (now - entry.addedAt > this.expirationTime) {
        this.blacklistedIps.delete(ip);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get enhanced blacklist statistics
   * @returns {object} - Statistics
   */
  getStats() {
    return {
      // Original violation tracking stats
      totalBlacklistedPrompts: this.blacklistedPrompts.size,
      totalBlacklistedUsers: this.blacklistedUsers.size,
      totalBlacklistedIps: this.blacklistedIps.size,
      mostFrequentIp: this.getMostFrequentIp(),
      
      // New keyword/pattern/name statistics
      keywordStats: {
        totalChecks: this.stats.totalChecks,
        keywordMatches: this.stats.keywordMatches,
        patternMatches: this.stats.patternMatches,
        nameMatches: this.stats.nameMatches,
        totalKeywordsBlocked: Object.values(this.blockedKeywords).reduce((sum, arr) => sum + arr.length, 0),
        totalPatternsBlocked: this.blockedPatterns.length,
        totalNamesRestricted: Object.values(this.restrictedNames).reduce((sum, arr) => sum + arr.length, 0),
        keywordsByCategory: Object.keys(this.blockedKeywords).reduce((acc, cat) => {
          acc[cat] = this.blockedKeywords[cat].length;
          return acc;
        }, {}),
        matchRate: this.stats.totalChecks > 0 
          ? ((this.stats.keywordMatches + this.stats.patternMatches + this.stats.nameMatches) / this.stats.totalChecks * 100).toFixed(2) + '%'
          : '0%',
        lastCheck: this.stats.lastCheck
      }
    };
  }

  /**
   * Get most frequently blacklisted IP
   * @returns {object|null} - Most frequent IP entry or null
   */
  getMostFrequentIp() {
    if (this.blacklistedIps.size === 0) return null;

    let maxEntry = null;
    let maxCount = 0;

    for (const entry of this.blacklistedIps.values()) {
      if (entry.count > maxCount) {
        maxCount = entry.count;
        maxEntry = entry;
      }
    }

    return maxEntry;
  }

  /**
   * Clear all blacklists
   */
  clearAll() {
    this.blacklistedPrompts.clear();
    this.blacklistedUsers.clear();
    this.blacklistedIps.clear();
  }
}

export default Blacklist;