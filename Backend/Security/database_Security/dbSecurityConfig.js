/**
 * Database Security Configuration Module
 * 
 * Purpose: Centralized configuration for all database security settings.
 * 
 * Manages:
 * - Connection settings
 * - Security policies
 * - Encryption configuration
 * - Access control rules
 * - Audit settings
 */

class DbSecurityConfig {
  constructor(options = {}) {
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.config = options.config || this.getDefaultConfig();
    this.policies = options.policies || this.getDefaultPolicies();
    this.allowedRoles = options.allowedRoles || this.getDefaultRoles();
    this.protectedTables = options.protectedTables || this.getDefaultProtectedTables();
    this.stats = {
      configLoaded: false,
      validationErrors: [],
      warnings: []
    };
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'secure_db',
        username: process.env.DB_USER || 'dbuser',
        ssl: this.environment === 'production',
        sslRejectUnauthorized: this.environment === 'production',
        timeout: 30000,
        maxConnections: 100,
        minConnections: 5
      },
      security: {
        enableEncryption: true,
        encryptionAlgorithm: 'aes-256-gcm',
        hashAlgorithm: 'sha256',
        saltRounds: 12,
        requireStrongPasswords: true,
        passwordMinLength: 16,
        sessionTimeout: 3600000, // 1 hour
        maxLoginAttempts: 5,
        lockoutDuration: 900000 // 15 minutes
      },
      audit: {
        enableAudit: true,
        logQueries: this.environment === 'development',
        logSensitiveData: false,
        auditLogRetention: 90, // days
        trackUserActivity: true,
        trackDataChanges: true
      },
      backup: {
        enableBackups: true,
        fullBackupFrequency: 'daily',
        incrementalBackupFrequency: '6-hours',
        backupRetention: 30, // days
        backupEncryption: true,
        backupCompression: true
      },
      performance: {
        queryTimeout: 30000,
        connectionTimeout: 10000,
        queryCache: true,
        cacheTTL: 3600000, // 1 hour
        maxBatchSize: 1000
      }
    };
  }

  /**
   * Get default allowed roles
   */
  getDefaultRoles() {
    return {
      admin: {
        permissions: ['read', 'write', 'delete', 'modify_schema', 'manage_users'],
        description: 'Full database access',
        maxConnections: 100
      },
      moderator: {
        permissions: ['read', 'write', 'delete'],
        description: 'Data management access',
        maxConnections: 50
      },
      user: {
        permissions: ['read'],
        description: 'Read-only access',
        maxConnections: 20
      },
      analyst: {
        permissions: ['read', 'create_reports'],
        description: 'Analytics and reporting',
        maxConnections: 30
      },
      service: {
        permissions: ['read', 'write'],
        description: 'Service account access',
        maxConnections: 5
      }
    };
  }

  /**
   * Get default protected tables
   */
  getDefaultProtectedTables() {
    return {
      users: {
        sensitive: true,
        encryptFields: ['password', 'email', 'phone'],
        allowedRoles: ['admin', 'moderator'],
        auditChanges: true,
        requireApproval: true
      },
      payments: {
        sensitive: true,
        encryptFields: ['card_number', 'cvv', 'bank_account'],
        allowedRoles: ['admin', 'moderator'],
        auditChanges: true,
        requireApproval: true
      },
      access_logs: {
        sensitive: false,
        allowedRoles: ['admin', 'analyst'],
        auditChanges: false,
        readOnly: true
      },
      api_keys: {
        sensitive: true,
        encryptFields: ['key_value', 'secret'],
        allowedRoles: ['admin'],
        auditChanges: true,
        requireApproval: true
      },
      audit_trail: {
        sensitive: true,
        allowedRoles: ['admin'],
        auditChanges: true,
        readOnly: true
      }
    };
  }

  /**
   * Get default policies
   */
  getDefaultPolicies() {
    return {
      accessControl: {
        enabled: true,
        defaultRole: 'user',
        roleBasedAccess: true,
        dataOwnershipCheck: true
      },
      dataProtection: {
        enabled: true,
        encryptSensitiveFields: true,
        maskSensitiveDataInLogs: true,
        preventDataExport: false,
        anonymizeDeletedData: false
      },
      queryValidation: {
        enabled: true,
        preventSqlInjection: true,
        validateParameterTypes: true,
        limitQueryComplexity: true,
        maxJoinDepth: 5
      },
      rateLimit: {
        enabled: true,
        queriesPerMinute: 100,
        dataPerMinute: '100MB',
        connectionsPerUser: 5
      },
      compliancePolicies: {
        gdprEnabled: true,
        hipaaEnabled: false,
        pciDssEnabled: false,
        dataRetentionDays: 365,
        rightToBeForget: true
      }
    };
  }

  /**
   * Initialize configuration
   */
  initializeConfig() {
    const errors = [];
    const warnings = [];

    // Validate connection settings
    if (!this.config.connection.host) {
      errors.push('Database host is not configured');
    }
    if (!this.config.connection.database) {
      errors.push('Database name is not configured');
    }

    // Check for insecure settings in production
    if (this.environment === 'production') {
      if (!this.config.connection.ssl) {
        warnings.push('SSL is not enabled for database connection');
      }
      if (this.config.audit.logSensitiveData) {
        warnings.push('Sensitive data logging is enabled in production');
      }
      if (this.config.security.requireStrongPasswords === false) {
        warnings.push('Strong password requirement is disabled');
      }
    }

    // Validate encryption settings
    if (this.config.security.enableEncryption && !this.config.security.encryptionAlgorithm) {
      errors.push('Encryption algorithm not specified');
    }

    // Validate timeout settings
    if (this.config.connection.timeout < 1000) {
      warnings.push('Connection timeout is less than 1 second');
    }

    this.stats.validationErrors = errors;
    this.stats.warnings = warnings;
    this.stats.configLoaded = errors.length === 0;

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }

  /**
   * Get configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates = {}) {
    if (!updates || typeof updates !== 'object') {
      return { success: false, error: 'Invalid configuration updates' };
    }

    // Deep merge configuration
    this.config = this.deepMerge(this.config, updates);

    return {
      success: true,
      message: 'Configuration updated',
      config: this.config
    };
  }

  /**
   * Get policy
   */
  getPolicy(policyName) {
    if (!policyName) {
      return this.policies;
    }

    return this.policies[policyName] || null;
  }

  /**
   * Update policy
   */
  updatePolicy(policyName, updates = {}) {
    if (!policyName || !this.policies[policyName]) {
      return { success: false, error: 'Policy not found' };
    }

    this.policies[policyName] = {
      ...this.policies[policyName],
      ...updates
    };

    return {
      success: true,
      message: `Policy '${policyName}' updated`
    };
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(featurePath) {
    if (!featurePath) return false;

    const parts = featurePath.split('.');
    let current = this.config;

    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return false;
      }
    }

    return current === true;
  }

  /**
   * Get feature configuration
   */
  getFeatureConfig(featurePath) {
    if (!featurePath) return null;

    const parts = featurePath.split('.');
    let current = this.config;

    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return null;
      }
    }

    return current;
  }

  /**
   * Validate security settings
   */
  validateSecuritySettings() {
    const issues = [];

    // Check password policy
    if (this.config.security.passwordMinLength < 8) {
      issues.push('Minimum password length should be at least 8 characters');
    }

    // Check session timeout
    if (this.config.security.sessionTimeout > 86400000) {
      issues.push('Session timeout should not exceed 24 hours');
    }

    // Check lockout duration
    if (this.config.security.lockoutDuration < 60000) {
      issues.push('Lockout duration should be at least 1 minute');
    }

    // Check encryption
    if (!this.config.security.enableEncryption && this.environment === 'production') {
      issues.push('Encryption should be enabled in production');
    }

    // Check audit
    if (!this.config.audit.enableAudit && this.environment === 'production') {
      issues.push('Audit logging should be enabled in production');
    }

    return {
      valid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * Export configuration (sanitized)
   */
  exportConfig() {
    const sanitized = { ...this.config };

    // Remove sensitive information
    if (sanitized.connection) {
      sanitized.connection = {
        ...sanitized.connection,
        username: '***',
        password: '***'
      };
    }

    return sanitized;
  }

  /**
   * Get security summary
   */
  getSecuritySummary() {
    const validation = this.validateSecuritySettings();

    return {
      environment: this.environment,
      encrypted: this.config.security.enableEncryption,
      auditingEnabled: this.config.audit.enableAudit,
      backupsEnabled: this.config.backup.enableBackups,
      sslEnabled: this.config.connection.ssl,
      validSecuritySettings: validation.valid,
      issues: validation.issues,
      policies: Object.keys(this.policies)
    };
  }

  /**
   * Deep merge objects
   */
  deepMerge(target, source) {
    const output = { ...target };

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }

    return output;
  }

  /**
   * Check if value is object
   */
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      configValid: this.stats.configLoaded,
      environment: this.environment,
      policiesCount: Object.keys(this.policies).length
    };
  }

  /**
   * Reset to default configuration
   */
  resetToDefault() {
    this.config = this.getDefaultConfig();
    this.policies = this.getDefaultPolicies();
    this.allowedRoles = this.getDefaultRoles();
    this.protectedTables = this.getDefaultProtectedTables();
    return { success: true, message: 'Configuration reset to defaults' };
  }

  /**
   * Check if user role is allowed
   */
  isRoleAllowed(roleName) {
    return this.allowedRoles.hasOwnProperty(roleName);
  }

  /**
   * Get role permissions
   */
  getRolePermissions(roleName) {
    if (!this.allowedRoles[roleName]) {
      return null;
    }
    return this.allowedRoles[roleName].permissions;
  }

  /**
   * Add new role
   */
  addRole(roleName, roleConfig) {
    if (this.allowedRoles[roleName]) {
      return { success: false, error: `Role '${roleName}' already exists` };
    }

    this.allowedRoles[roleName] = roleConfig;
    return { success: true, message: `Role '${roleName}' added successfully` };
  }

  /**
   * Remove role
   */
  removeRole(roleName) {
    if (!this.allowedRoles[roleName]) {
      return { success: false, error: `Role '${roleName}' not found` };
    }

    delete this.allowedRoles[roleName];
    return { success: true, message: `Role '${roleName}' removed successfully` };
  }

  /**
   * Check if table is protected
   */
  isTableProtected(tableName) {
    return this.protectedTables.hasOwnProperty(tableName);
  }

  /**
   * Get table protection rules
   */
  getTableProtection(tableName) {
    if (!this.protectedTables[tableName]) {
      return null;
    }
    return this.protectedTables[tableName];
  }

  /**
   * Check if role can access table
   */
  canRoleAccessTable(roleName, tableName) {
    if (!this.protectedTables[tableName]) {
      // If table is not protected, allow access
      return true;
    }

    const tableProtection = this.protectedTables[tableName];
    return tableProtection.allowedRoles.includes(roleName);
  }

  /**
   * Add protected table
   */
  addProtectedTable(tableName, protection) {
    if (this.protectedTables[tableName]) {
      return { success: false, error: `Table '${tableName}' already protected` };
    }

    this.protectedTables[tableName] = protection;
    return { success: true, message: `Table '${tableName}' protection added` };
  }

  /**
   * Remove table protection
   */
  removeTableProtection(tableName) {
    if (!this.protectedTables[tableName]) {
      return { success: false, error: `Table '${tableName}' not found in protection rules` };
    }

    delete this.protectedTables[tableName];
    return { success: true, message: `Table '${tableName}' protection removed` };
  }

  /**
   * Get all protected tables
   */
  getAllProtectedTables() {
    return this.protectedTables;
  }

  /**
   * Get all allowed roles
   */
  getAllRoles() {
    return this.allowedRoles;
  }

  /**
   * Get security flow summary
   */
  getSecurityFlowSummary() {
    return {
      flow: [
        '1. API Request → accessControl.js (check user role and permissions)',
        '2. accessControl.js → queryValidator.js (validate query syntax and safety)',
        '3. queryValidator.js → dataEncryption.js (encrypt sensitive data)',
        '4. dataEncryption.js → Database (execute on protected database)'
      ],
      objectives: [
        'Protect database from unauthorized access',
        'Prevent data leaks through query manipulation',
        'Prevent data tampering',
        'Prevent accidental data loss through proper backups'
      ],
      protectedTables: Object.keys(this.protectedTables).length,
      definedRoles: Object.keys(this.allowedRoles).length,
      backupEnabled: this.config.backup.enableBackups,
      auditEnabled: this.config.audit.enableAudit,
      encryptionEnabled: this.config.security.enableEncryption
    };
  }
}

module.exports = DbSecurityConfig;