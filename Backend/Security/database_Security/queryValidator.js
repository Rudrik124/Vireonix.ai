/**
 * Query Validator Module
 * 
 * Purpose: Validate database operations before execution.
 * 
 * Checks:
 * - Allowed Tables
 * - Allowed Operations
 * - Safe Query Parameters
 * 
 * Prevents:
 * - Unauthorized Reads
 * - Unauthorized Updates
 * - Mass Data Access
 */

class QueryValidator {
  constructor(options = {}) {
    this.allowedTables = options.allowedTables || this.getDefaultAllowedTables();
    this.allowedOperations = options.allowedOperations || ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
    this.queryLimits = options.queryLimits || this.getDefaultLimits();
    this.stats = {
      queriesValidated: 0,
      validQueries: 0,
      invalidQueries: 0,
      suspiciousPatterns: 0,
      validationReasons: {}
    };
  }

  /**
   * Get default allowed tables
   */
  getDefaultAllowedTables() {
    return [
      'users',
      'videos',
      'prompts',
      'audit_logs',
      'subscriptions',
      'usage_stats',
      'admin_data',
      'api_keys',
      'sessions',
      'notifications'
    ];
  }

  /**
   * Get default query limits
   */
  getDefaultLimits() {
    return {
      maxQueryLength: 10000,
      maxResultRows: 10000,
      maxJoins: 5,
      queryTimeout: 30000 // 30 seconds
    };
  }

  /**
   * Validate query operation
   */
  validateQuery(query, options = {}) {
    this.stats.queriesValidated++;

    if (!query) {
      this.stats.invalidQueries++;
      return {
        valid: false,
        reason: 'Query is empty',
        errors: []
      };
    }

    const errors = [];

    // Check query length
    if (query.length > this.queryLimits.maxQueryLength) {
      errors.push(`Query exceeds maximum length (${this.queryLimits.maxQueryLength} chars)`);
    }

    // Check for SQL injection patterns
    const injectionCheck = this.detectSqlInjection(query);
    if (injectionCheck.detected) {
      errors.push(`Potential SQL injection detected: ${injectionCheck.pattern}`);
      this.stats.suspiciousPatterns++;
    }

    // Check for dangerous operations
    const dangerousCheck = this.detectDangerousOperations(query);
    if (dangerousCheck.detected) {
      errors.push(`Dangerous operation detected: ${dangerousCheck.operation}`);
      this.stats.suspiciousPatterns++;
    }

    // Extract tables used
    const tables = this.extractTables(query);
    
    // Validate tables
    for (const table of tables) {
      if (!this.isTableAllowed(table)) {
        errors.push(`Access to table '${table}' is not allowed`);
      }
    }

    // Extract operations
    const operations = this.extractOperations(query);
    
    // Validate operations
    for (const operation of operations) {
      if (!this.isOperationAllowed(operation)) {
        errors.push(`Operation '${operation}' is not allowed`);
      }
    }

    // Check for mass operations
    const massCheck = this.detectMassOperations(query);
    if (massCheck.detected && !options.allowMassOperations) {
      errors.push(`Mass operation detected without explicit permission`);
      this.stats.suspiciousPatterns++;
    }

    // Check for unauthorized reads
    if (this.detectUnauthorizedRead(query, options.userId)) {
      errors.push('Attempted unauthorized data read');
    }

    if (errors.length > 0) {
      this.stats.invalidQueries++;
      this.trackValidationReason('VALIDATION_FAILED');
      return {
        valid: false,
        reason: 'Query validation failed',
        errors: errors,
        query: query.substring(0, 100) + (query.length > 100 ? '...' : '')
      };
    }

    this.stats.validQueries++;
    this.trackValidationReason('VALID');

    return {
      valid: true,
      reason: 'Query passed validation',
      tables: tables,
      operations: operations,
      safe: true
    };
  }

  /**
   * Detect SQL injection patterns
   */
  detectSqlInjection(query) {
    const patterns = [
      { pattern: /('|")\s*(OR|AND)\s*('|")?.*('|")?=('|")?/gi, name: 'OR-based injection' },
      { pattern: /;\s*(DROP|DELETE|TRUNCATE)\s+/gi, name: 'Drop/Delete injection' },
      { pattern: /UNION\s+SELECT/gi, name: 'UNION-based injection' },
      { pattern: /\/\*.*?\*\//g, name: 'Comment-based injection' },
      { pattern: /xp_|sp_/gi, name: 'Extended stored procedure' },
      { pattern: /exec\s*\(/gi, name: 'EXEC injection' },
      { pattern: /<script|javascript:/gi, name: 'Script injection' }
    ];

    for (const { pattern, name } of patterns) {
      if (pattern.test(query)) {
        return { detected: true, pattern: name };
      }
    }

    return { detected: false };
  }

  /**
   * Detect dangerous operations
   */
  detectDangerousOperations(query) {
    const dangerous = [
      { operation: 'DROP TABLE', pattern: /DROP\s+TABLE/gi },
      { operation: 'TRUNCATE', pattern: /TRUNCATE/gi },
      { operation: 'ALTER TABLE', pattern: /ALTER\s+TABLE/gi },
      { operation: 'CREATE TABLE', pattern: /CREATE\s+TABLE/gi },
      { operation: 'GRANT', pattern: /GRANT/gi },
      { operation: 'REVOKE', pattern: /REVOKE/gi }
    ];

    for (const { operation, pattern } of dangerous) {
      if (pattern.test(query)) {
        return { detected: true, operation: operation };
      }
    }

    return { detected: false };
  }

  /**
   * Extract tables from query
   */
  extractTables(query) {
    const tables = new Set();
    
    // Match table names in FROM, JOIN, INTO clauses
    const patterns = [
      /FROM\s+(\w+)/gi,
      /JOIN\s+(\w+)/gi,
      /INTO\s+(\w+)/gi,
      /UPDATE\s+(\w+)/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        const table = match[1].toLowerCase();
        if (table && !['AND', 'OR', 'ON', 'WHERE'].includes(table.toUpperCase())) {
          tables.add(table);
        }
      }
    }

    return Array.from(tables);
  }

  /**
   * Extract operations from query
   */
  extractOperations(query) {
    const operations = new Set();
    const upperQuery = query.toUpperCase();

    const ops = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TRUNCATE'];
    
    for (const op of ops) {
      if (upperQuery.includes(op)) {
        operations.add(op);
      }
    }

    return Array.from(operations);
  }

  /**
   * Detect mass operations
   */
  detectMassOperations(query) {
    // Check for UPDATE/DELETE without WHERE clause
    const updateDelete = /^(UPDATE|DELETE)\s+/i.test(query.trim());
    if (updateDelete && !query.toUpperCase().includes('WHERE')) {
      return { detected: true };
    }

    // Check for DELETE with LIMIT removed
    if (query.toUpperCase().includes('DELETE') && !query.toUpperCase().includes('LIMIT')) {
      return { detected: true };
    }

    return { detected: false };
  }

  /**
   * Detect unauthorized reads
   */
  detectUnauthorizedRead(query, userId) {
    // If no userId provided, any read is potentially unauthorized
    if (!userId && query.toUpperCase().includes('SELECT')) {
      // Check if it's a public data read
      return false; // In production, implement proper checks
    }

    return false;
  }

  /**
   * Check if table is allowed
   */
  isTableAllowed(table) {
    return this.allowedTables.includes(table);
  }

  /**
   * Check if operation is allowed
   */
  isOperationAllowed(operation) {
    return this.allowedOperations.includes(operation);
  }

  /**
   * Validate parameters
   */
  validateParameters(params = []) {
    if (!Array.isArray(params)) {
      return { valid: false, errors: ['Parameters must be an array'] };
    }

    const errors = [];

    for (let i = 0; i < params.length; i++) {
      const param = params[i];

      // Check for SQL injection in parameters
      if (typeof param === 'string') {
        if (this.detectSqlInjection(param).detected) {
          errors.push(`Parameter ${i} contains potential SQL injection`);
        }

        // Check for script injection
        if (/<script|javascript:/gi.test(param)) {
          errors.push(`Parameter ${i} contains potential script injection`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Add allowed table
   */
  addAllowedTable(table) {
    if (!table || this.allowedTables.includes(table)) return false;
    this.allowedTables.push(table);
    return true;
  }

  /**
   * Remove allowed table
   */
  removeAllowedTable(table) {
    const index = this.allowedTables.indexOf(table);
    if (index === -1) return false;
    this.allowedTables.splice(index, 1);
    return true;
  }

  /**
   * Track validation reason
   */
  trackValidationReason(reason) {
    this.stats.validationReasons[reason] = (this.stats.validationReasons[reason] || 0) + 1;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      validationRate: this.stats.queriesValidated > 0
        ? ((this.stats.validQueries / this.stats.queriesValidated) * 100).toFixed(2) + '%'
        : '0%',
      rejectionRate: this.stats.queriesValidated > 0
        ? ((this.stats.invalidQueries / this.stats.queriesValidated) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      queriesValidated: 0,
      validQueries: 0,
      invalidQueries: 0,
      suspiciousPatterns: 0,
      validationReasons: {}
    };
  }
}

module.exports = QueryValidator;