/**
 * Input Sanitizer Module
 * 
 * Purpose: Clean user-supplied input before processing.
 * 
 * Prevents:
 * - SQL Injection Attempts
 * - XSS Payloads
 * - Script Injection
 * - Malformed Inputs
 * 
 * Flow: User Input → Sanitize → Safe to Use
 */

class InputSanitizer {
  constructor(options = {}) {
    this.strictMode = options.strictMode || true;
    this.allowedTags = options.allowedTags || [];
    this.stats = {
      totalSanitized: 0,
      injectionAttempts: 0,
      xssAttempts: 0,
      sqlAttempts: 0,
      commandAttempts: 0,
      pathTraversalAttempts: 0
    };
  }

  /**
   * Main sanitization method
   * 
   * @param {*} input - Input to sanitize
   * @returns {object} - { sanitized, threats, isSafe, type }
   */
  sanitize(input) {
    this.stats.totalSanitized++;

    if (input === null || input === undefined) {
      return {
        sanitized: input,
        threats: [],
        isSafe: true,
        type: 'null'
      };
    }

    const inputType = typeof input;

    if (inputType === 'string') {
      return this.sanitizeString(input);
    } else if (inputType === 'object') {
      if (Array.isArray(input)) {
        return this.sanitizeArray(input);
      } else {
        return this.sanitizeObject(input);
      }
    } else if (inputType === 'number') {
      return this.sanitizeNumber(input);
    } else if (inputType === 'boolean') {
      return { sanitized: input, threats: [], isSafe: true, type: 'boolean' };
    }

    return { sanitized: input, threats: [], isSafe: true, type: inputType };
  }

  /**
   * Sanitize string input
   */
  sanitizeString(str) {
    const result = {
      sanitized: str,
      threats: [],
      isSafe: true,
      type: 'string'
    };

    // Check for SQL injection
    const sqlInjection = this.detectSqlInjection(str);
    if (sqlInjection.detected) {
      result.threats.push(...sqlInjection.patterns);
      result.isSafe = false;
      this.stats.sqlAttempts++;
    }

    // Check for XSS
    const xssPatterns = this.detectXSS(str);
    if (xssPatterns.detected) {
      result.threats.push(...xssPatterns.patterns);
      result.isSafe = false;
      this.stats.xssAttempts++;
    }

    // Check for command injection
    const commandInjection = this.detectCommandInjection(str);
    if (commandInjection.detected) {
      result.threats.push(...commandInjection.patterns);
      result.isSafe = false;
      this.stats.commandAttempts++;
    }

    // Check for path traversal
    const pathTraversal = this.detectPathTraversal(str);
    if (pathTraversal.detected) {
      result.threats.push(...pathTraversal.patterns);
      result.isSafe = false;
      this.stats.pathTraversalAttempts++;
    }

    // If threats found, track injection attempts
    if (result.threats.length > 0) {
      this.stats.injectionAttempts++;
    }

    // Clean the string
    result.sanitized = this.cleanString(str);

    return result;
  }

  /**
   * Sanitize array
   */
  sanitizeArray(arr) {
    const result = {
      sanitized: [],
      threats: [],
      isSafe: true,
      type: 'array'
    };

    for (const item of arr) {
      const sanitized = this.sanitize(item);
      result.sanitized.push(sanitized.sanitized);
      
      if (!sanitized.isSafe) {
        result.isSafe = false;
        result.threats.push(...sanitized.threats);
      }
    }

    return result;
  }

  /**
   * Sanitize object
   */
  sanitizeObject(obj) {
    const result = {
      sanitized: {},
      threats: [],
      isSafe: true,
      type: 'object'
    };

    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeString(key);
      const sanitizedValue = this.sanitize(value);

      result.sanitized[sanitizedKey.sanitized] = sanitizedValue.sanitized;

      if (!sanitizedKey.isSafe || !sanitizedValue.isSafe) {
        result.isSafe = false;
        result.threats.push(...sanitizedKey.threats, ...sanitizedValue.threats);
      }
    }

    return result;
  }

  /**
   * Sanitize number
   */
  sanitizeNumber(num) {
    return {
      sanitized: num,
      threats: [],
      isSafe: true,
      type: 'number'
    };
  }

  /**
   * Detect SQL injection attempts
   */
  detectSqlInjection(str) {
    const sqlPatterns = [
      /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT)\b)/gi,
      /(-{2}|\/\*|\*\/|;)/,
      /(\bOR\b.*?=.*?|1\s*=\s*1)/gi,
      /(CASE|WHEN|THEN|ELSE|END)/gi,
      /(CAST|CONVERT|SUBSTRING|LENGTH|CHAR)/gi
    ];

    const detected = [];
    for (const pattern of sqlPatterns) {
      if (pattern.test(str)) {
        detected.push(`SQL: ${pattern.source}`);
      }
    }

    return {
      detected: detected.length > 0,
      patterns: detected
    };
  }

  /**
   * Detect XSS attempts
   */
  detectXSS(str) {
    const xssPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<object[^>]*>/gi,
      /<img[^>]*onerror[^>]*>/gi,
      /<svg[^>]*onload[^>]*>/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
      /vbscript:/gi
    ];

    const detected = [];
    for (const pattern of xssPatterns) {
      if (pattern.test(str)) {
        detected.push(`XSS: ${pattern.source}`);
      }
    }

    return {
      detected: detected.length > 0,
      patterns: detected
    };
  }

  /**
   * Detect command injection attempts
   */
  detectCommandInjection(str) {
    const commandPatterns = [
      /[;&|`$(){}[\]<>]/,
      /\$\{.*?\}/,
      /`.*?`/,
      /\|\s*(cat|ls|rm|bash|sh|cmd|powershell)/gi,
      /(wget|curl|nc|ncat|netcat)/gi
    ];

    const detected = [];
    for (const pattern of commandPatterns) {
      if (pattern.test(str)) {
        detected.push(`Command: ${pattern.source}`);
      }
    }

    return {
      detected: detected.length > 0,
      patterns: detected
    };
  }

  /**
   * Detect path traversal attempts
   */
  detectPathTraversal(str) {
    const pathPatterns = [
      /\.\.\//,
      /\.\.\\/,
      /(%2e%2e\/|%2e%2e\\)/gi,
      /\.\.%2f/gi,
      /\.\.%5c/gi
    ];

    const detected = [];
    for (const pattern of pathPatterns) {
      if (pattern.test(str)) {
        detected.push(`PathTraversal: ${pattern.source}`);
      }
    }

    return {
      detected: detected.length > 0,
      patterns: detected
    };
  }

  /**
   * Clean dangerous characters from string
   */
  cleanString(str) {
    if (typeof str !== 'string') return str;

    let cleaned = str;

    // Remove potentially dangerous HTML tags
    cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
    cleaned = cleaned.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');

    // Remove event handlers
    cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

    // Remove javascript protocol
    cleaned = cleaned.replace(/javascript:/gi, '');
    cleaned = cleaned.replace(/vbscript:/gi, '');

    // HTML encode dangerous characters if in strict mode
    if (this.strictMode) {
      cleaned = this.htmlEncode(cleaned);
    }

    // Remove null bytes
    cleaned = cleaned.replace(/\0/g, '');

    // Remove control characters
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Trim excessive whitespace
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * HTML encode special characters
   */
  htmlEncode(str) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return str.replace(/[&<>"'\/]/g, char => map[char]);
  }

  /**
   * Get sanitization statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalThreatsDetected: this.stats.injectionAttempts,
      threatBreakdown: {
        xss: this.stats.xssAttempts,
        sql: this.stats.sqlAttempts,
        command: this.stats.commandAttempts,
        pathTraversal: this.stats.pathTraversalAttempts
      }
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalSanitized: 0,
      injectionAttempts: 0,
      xssAttempts: 0,
      sqlAttempts: 0,
      commandAttempts: 0,
      pathTraversalAttempts: 0
    };
  }
}

module.exports = InputSanitizer;