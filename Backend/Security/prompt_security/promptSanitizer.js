/**
 * Prompt Sanitizer Module
 * Protects AI system from prompt manipulation and injection attacks
 * 
 * Workflow: Raw Prompt → Clean Input → Detect Injections → Remove Dangerous Patterns → Normalize → Safe Prompt
 */

class PromptSanitizer {
  constructor(options = {}) {
    this.maxLength = options.maxLength || 10000;
    this.stripHtml = options.stripHtml !== false;
    this.stripScripts = options.stripScripts !== false;

    // Prompt Injection Patterns
    this.injectionPatterns = {
      ignoreInstructions: [
        /ignore\s+(?:previous|all|my)\s+(?:instructions?|prompts?|rules?)/gi,
        /forget\s+(?:everything|all|your).*(?:instructions?|guidelines?|rules?)/gi,
        /disregard.*instructions?/gi,
        /don't\s+follow.*instructions?/gi
      ],
      bypassSafety: [
        /bypass\s+(?:safety|security|filters?)/gi,
        /disable\s+(?:moderation|safety|content\s+filters?|restrictions?)/gi,
        /override\s+(?:safety|security|restrictions?|filters?)/gi,
        /skip\s+(?:moderation|safety|checks?|filters?)/gi,
        /turn\s+(?:off|down)\s+(?:moderation|safety|filters?)/gi
      ],
      revealSystem: [
        /reveal\s+(?:system\s+)?prompt/gi,
        /show\s+(?:me\s+)?(?:the\s+)?system\s+(?:prompt|instructions?)/gi,
        /what\s+(?:is|are)\s+(?:your\s+)?(?:system\s+)?instructions?/gi,
        /(?:system|hidden|secret)\s+prompt/gi,
        /original\s+(?:system\s+)?prompt/gi,
        /you\s+were\s+(?:told|instructed|programmed)\s+to/gi
      ],
      manipulate: [
        /pretend\s+(?:you\s+(?:are|don't).*|that)/gi,
        /role\s+play\s+as/gi,
        /act\s+(?:as|like|you\s+are)/gi,
        /simulate\s+(?:being|yourself\s+as)/gi,
        /imagine\s+you\s+are/gi,
        /assume\s+you\s+(?:are|were)/gi,
        /(?:in|within)?\s+a\s+(?:hypothetical|fictional|alternate)\s+(?:scenario|universe|world)/gi
      ],
      instructionHijack: [
        /new\s+(?:instructions?|rules?|guidelines?):/gi,
        /your\s+(?:new\s+)?(?:instructions?|rules?)\s+(?:are|is|will\s+be):/gi,
        /from\s+now\s+on/gi,
        /instead\s+of.*?you\s+(?:should|must|will)/gi,
        /priority\s+override/gi,
        /higher\s+priority/gi
      ]
    };

    // Invisible/Dangerous Characters
    this.dangerousCharacters = {
      invisible: [
        '\u0000', // Null
        '\u200B', // Zero-width space
        '\u200C', // Zero-width non-joiner
        '\u200D', // Zero-width joiner
        '\u200E', // Left-to-right mark
        '\u200F', // Right-to-left mark
        '\uFEFF', // Zero-width no-break space
        '\u202A', // Left-to-right embedding
        '\u202B', // Right-to-left embedding
        '\u202C', // Pop directional formatting
        '\u202D', // Left-to-right override
        '\u202E'  // Right-to-left override
      ]
    };

    // System Override Keywords
    this.systemOverridePatterns = [
      /system\s+(?:mode|command|override)/gi,
      /admin\s+(?:mode|access|privileges?)/gi,
      /developer\s+mode/gi,
      /debug\s+mode/gi,
      /maintenance\s+mode/gi,
      /root\s+access/gi,
      /super\s+user/gi,
      /sudo/gi,
      /execute\s+command/gi,
      /run\s+(?:script|code|command)/gi
    ];

    // Unsupported Symbols to remove
    this.unsupportedSymbols = {
      remove: [
        '\\x00', '\\x01', '\\x02', '\\x03', '\\x04', '\\x05', '\\x06', '\\x07',
        '\\x08', '\\x0B', '\\x0C', '\\x0E', '\\x0F'
      ]
    };
  }

  /**
   * Step 1: Remove Extra Spaces
   * @private
   */
  removeExtraSpaces(text) {
    return text
      .replace(/\s+/g, ' ')           // Multiple spaces to single
      .replace(/\n\s+/g, '\n')        // Remove space after newline
      .replace(/\s+\n/g, '\n')        // Remove space before newline
      .trim();
  }

  /**
   * Step 2: Remove Invisible Characters
   * @private
   */
  removeInvisibleCharacters(text) {
    let cleaned = text;
    
    for (const char of this.dangerousCharacters.invisible) {
      cleaned = cleaned.split(char).join('');
    }

    // Remove control characters
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    return cleaned;
  }

  /**
   * Step 3: Remove Unsupported Symbols
   * @private
   */
  removeUnsupportedSymbols(text) {
    let cleaned = text;

    // Remove characters outside basic multilingual plane (optional)
    // Keep alphanumeric, common punctuation, and spaces
    cleaned = cleaned.replace(/[^\w\s\-.,!?;:()"'@#&*+=\[\]{}\/\\]/gu, '');

    return cleaned;
  }

  /**
   * Step 4: Clean Input
   * Removes extra spaces, invisible characters, unsupported symbols
   */
  cleanInput(text) {
    let cleaned = text;

    // Remove invisible characters
    cleaned = this.removeInvisibleCharacters(cleaned);

    // Remove unsupported symbols
    cleaned = this.removeUnsupportedSymbols(cleaned);

    // Remove extra spaces
    cleaned = this.removeExtraSpaces(cleaned);

    return cleaned;
  }

  /**
   * Detect Prompt Injection Attempts
   * Returns detailed information about injection attempts
   */
  detectPromptInjection(text) {
    const lowerText = text.toLowerCase();
    const result = {
      hasInjection: false,
      injectionTypes: [],
      detectedPhrases: [],
      severity: 'low', // low, medium, high
      score: 0
    };

    // Check each injection type
    for (const [type, patterns] of Object.entries(this.injectionPatterns)) {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          result.hasInjection = true;
          result.injectionTypes.push(type);
          result.detectedPhrases.push(match[0]);
          result.score += 1;
          break;
        }
      }
    }

    // Check system override patterns
    for (const pattern of this.systemOverridePatterns) {
      if (pattern.test(text)) {
        result.hasInjection = true;
        result.injectionTypes.push('systemOverride');
        result.score += 2; // Higher score for system override
        break;
      }
    }

    // Determine severity
    if (result.score >= 3) {
      result.severity = 'high';
    } else if (result.score >= 1) {
      result.severity = 'medium';
    }

    // Remove duplicates
    result.injectionTypes = [...new Set(result.injectionTypes)];
    result.detectedPhrases = [...new Set(result.detectedPhrases)];

    return result;
  }

  /**
   * Remove Dangerous Patterns
   * Removes patterns that attempt to manipulate the AI
   */
  removeDangerousPatterns(text) {
    let cleaned = text;

    // Remove "Ignore previous instructions" type patterns
    for (const pattern of this.injectionPatterns.ignoreInstructions) {
      cleaned = cleaned.replace(pattern, '');
    }

    // Remove "Bypass safety" type patterns
    for (const pattern of this.injectionPatterns.bypassSafety) {
      cleaned = cleaned.replace(pattern, '');
    }

    // Remove "Reveal system prompt" type patterns
    for (const pattern of this.injectionPatterns.revealSystem) {
      cleaned = cleaned.replace(pattern, '');
    }

    // Remove "Role play/pretend" type patterns
    for (const pattern of this.injectionPatterns.manipulate) {
      cleaned = cleaned.replace(pattern, '');
    }

    // Remove "New instructions" type patterns
    for (const pattern of this.injectionPatterns.instructionHijack) {
      cleaned = cleaned.replace(pattern, '');
    }

    // Remove system override patterns
    for (const pattern of this.systemOverridePatterns) {
      cleaned = cleaned.replace(pattern, '');
    }

    // Clean up any extra spaces left from removal
    cleaned = this.removeExtraSpaces(cleaned);

    return cleaned;
  }

  /**
   * Normalize Prompt
   * Converts prompt into safe format before sending to AI
   */
  normalizePrompt(text) {
    let normalized = text;

    // Encode special characters
    normalized = this.escapeXml(normalized);

    // Ensure single line or proper formatting
    normalized = normalized.replace(/\n{2,}/g, '\n');

    // Remove trailing/leading whitespace
    normalized = normalized.trim();

    return normalized;
  }

  /**
   * Remove HTML tags from text
   * @param {string} text - Text to sanitize
   * @returns {string} - Sanitized text
   */
  removeHtmlTags(text) {
    return text.replace(/<[^>]*>/g, '');
  }

  /**
   * Remove script tags and content
   * @param {string} text - Text to sanitize
   * @returns {string} - Sanitized text
   */
  removeScripts(text) {
    return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  /**
   * Escape special characters for SQL injection prevention
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeSqlInjection(text) {
    const escapeMap = {
      "'": "''",
      '"': '""',
      '\\': '\\\\',
      '\0': '\\0',
      '\n': '\\n',
      '\r': '\\r',
      '\x1a': '\\Z'
    };

    return text.replace(/['"\\\0\n\r\x1a]/g, (char) => escapeMap[char]);
  }

  /**
   * Escape special regex characters
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Escape special XML characters
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeXml(text) {
    const escapeMap = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
      '&': '&amp;'
    };

    return text.replace(/[<>"'&]/g, (char) => escapeMap[char]);
  }

  /**
   * Normalize whitespace
   * @param {string} text - Text to normalize
   * @returns {string} - Normalized text
   */
  normalizeWhitespace(text) {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n'); // Replace multiple newlines with single newline
  }

  /**
   * Check for suspicious patterns
   * @param {string} text - Text to check
   * @returns {object} - Check result
   */
  checkSuspiciousPatterns(text) {
    const suspiciousPatterns = [
      { name: 'SQL Injection', regex: /(\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b)/i },
      { name: 'XSS Attack', regex: /<script|javascript:|onerror=|onload=/i },
      { name: 'NoSQL Injection', regex: /(\{\$|db\.|collection\.)/i },
      { name: 'Command Injection', regex: /([;&|`$(){}]|\/bin\/|\/etc\/)/i }
    ];

    const result = {
      hasSuspiciousPatterns: false,
      detectedPatterns: []
    };

    for (const pattern of suspiciousPatterns) {
      if (pattern.regex.test(text)) {
        result.hasSuspiciousPatterns = true;
        result.detectedPatterns.push(pattern.name);
      }
    }

    return result;
  }

  /**
   * Comprehensive prompt sanitization with injection detection
   * Workflow: Input → Clean → Detect Injections → Remove Dangerous → Normalize → Output
   * @param {string} prompt - Prompt to sanitize
   * @returns {object} - Sanitized result with details
   */
  sanitize(prompt) {
    const result = {
      original: prompt,
      cleaned: prompt,
      sanitized: prompt,
      isValid: true,
      warnings: [],
      injectionDetected: false,
      injectionDetails: null,
      dangerousPatternsRemoved: false
    };

    if (!prompt || typeof prompt !== 'string') {
      result.isValid = false;
      result.warnings.push('Invalid prompt: must be a non-empty string');
      return result;
    }

    // Step 1: Clean Input
    result.cleaned = this.cleanInput(prompt);

    if (result.cleaned !== prompt) {
      result.warnings.push('Cleaned: Removed invisible characters and unsupported symbols');
    }

    // Step 2: Check length
    if (result.cleaned.length > this.maxLength) {
      result.warnings.push(`Prompt exceeds maximum length of ${this.maxLength} characters`);
      result.cleaned = result.cleaned.substring(0, this.maxLength);
    }

    // Step 3: Detect Prompt Injection
    const injectionCheck = this.detectPromptInjection(result.cleaned);
    if (injectionCheck.hasInjection) {
      result.injectionDetected = true;
      result.injectionDetails = injectionCheck;
      result.warnings.push(`🚨 Prompt injection attempt detected: ${injectionCheck.injectionTypes.join(', ')}`);
      
      // Remove dangerous patterns
      result.sanitized = this.removeDangerousPatterns(result.cleaned);
      result.dangerousPatternsRemoved = true;
    } else {
      result.sanitized = result.cleaned;
    }

    // Step 4: Check for other suspicious patterns
    const suspiciousCheck = this.checkSuspiciousPatterns(result.sanitized);
    if (suspiciousCheck.hasSuspiciousPatterns) {
      result.warnings.push(`Detected suspicious patterns: ${suspiciousCheck.detectedPatterns.join(', ')}`);
    }

    // Step 5: Apply additional sanitization
    if (this.stripHtml) {
      result.sanitized = this.removeHtmlTags(result.sanitized);
    }

    if (this.stripScripts) {
      result.sanitized = this.removeScripts(result.sanitized);
    }

    // Step 6: Normalize final output
    result.sanitized = this.normalizeWhitespace(result.sanitized);
    result.sanitized = this.normalizePrompt(result.sanitized);

    return result;
  }

  /**
   * Prepare prompt for database storage
   * @param {string} prompt - Prompt to prepare
   * @returns {string} - Prepared prompt
   */
  prepareForDatabase(prompt) {
    let sanitized = this.sanitize(prompt).sanitized;
    return this.escapeSqlInjection(sanitized);
  }

  /**
   * Prepare prompt for display/response
   * @param {string} prompt - Prompt to prepare
   * @returns {string} - Prepared prompt
   */
  prepareForDisplay(prompt) {
    return this.escapeXml(prompt);
  }

  /**
   * Get sanitizer statistics
   * @returns {object} - Statistics about patterns tracked
   */
  getSanitizationStats() {
    return {
      ignoreInstructionPatterns: this.injectionPatterns.ignoreInstructions.length,
      bypassSafetyPatterns: this.injectionPatterns.bypassSafety.length,
      revealSystemPatterns: this.injectionPatterns.revealSystem.length,
      manipulationPatterns: this.injectionPatterns.manipulate.length,
      instructionHijackPatterns: this.injectionPatterns.instructionHijack.length,
      systemOverridePatterns: this.systemOverridePatterns.length,
      invisibleCharactersTracked: this.dangerousCharacters.invisible.length,
      totalPatterns: this.injectionPatterns.ignoreInstructions.length +
                     this.injectionPatterns.bypassSafety.length +
                     this.injectionPatterns.revealSystem.length +
                     this.injectionPatterns.manipulate.length +
                     this.injectionPatterns.instructionHijack.length +
                     this.systemOverridePatterns.length
    };
  }
}

export default PromptSanitizer;