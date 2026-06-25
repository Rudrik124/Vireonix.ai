/**
 * Environment Validator Module
 * 
 * Purpose: Verify required secrets exist during startup.
 * 
 * Checks at startup:
 * - RUNWAY_API_KEY
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_KEY
 * - JWT_SECRET
 * 
 * If missing: Application Startup Failed
 * Prevents production errors
 */

class EnvValidator {
  constructor(options = {}) {
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.keyManager = options.keyManager || null;
    this.strictMode = options.strictMode !== false;
    this.requiredKeys = options.requiredKeys || this.getDefaultRequiredKeys();
    this.optionalKeys = options.optionalKeys || this.getDefaultOptionalKeys();
    this.validationResult = null;
  }

  /**
   * Get default required keys for production
   */
  getDefaultRequiredKeys() {
    const baseRequired = [
      'RUNWAY_API_KEY',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_KEY',
      'JWT_SECRET'
    ];

    return baseRequired;
  }

  /**
   * Get default optional keys
   */
  getDefaultOptionalKeys() {
    return [
      'REDIS_URL',
      'DATABASE_URL',
      'ANALYTICS_KEY',
      'MONITORING_KEY'
    ];
  }

  /**
   * Validate environment at startup
   */
  async validateStartup() {
    console.log('🔍 Validating environment variables...');

    const result = {
      passed: false,
      required: {
        found: [],
        missing: []
      },
      optional: {
        found: [],
        missing: []
      },
      errors: [],
      warnings: [],
      timestamp: new Date()
    };

    // Check required keys
    for (const key of this.requiredKeys) {
      if (await this.keyExists(key)) {
        result.required.found.push(key);
      } else {
        result.required.missing.push(key);
        result.errors.push(`Missing required environment variable: ${key}`);
      }
    }

    // Check optional keys
    for (const key of this.optionalKeys) {
      if (await this.keyExists(key)) {
        result.optional.found.push(key);
      } else {
        result.optional.missing.push(key);
        result.warnings.push(`Optional environment variable not found: ${key}`);
      }
    }

    // Determine pass/fail
    result.passed = result.required.missing.length === 0;

    this.validationResult = result;
    return result;
  }

  /**
   * Validate specific key
   */
  async validateKey(key) {
    if (!key) {
      return {
        valid: false,
        key: null,
        error: 'Key name required'
      };
    }

    const exists = await this.keyExists(key);

    if (!exists) {
      return {
        valid: false,
        key: key,
        error: `Environment variable not found: ${key}`
      };
    }

    const value = await this.getKeyValue(key);

    // Validate value format based on key type
    const validation = this.validateKeyFormat(key, value);

    return {
      valid: validation.valid,
      key: key,
      format: validation.format,
      error: validation.error || null
    };
  }

  /**
   * Validate key value format
   */
  validateKeyFormat(key, value) {
    if (!value) {
      return {
        valid: false,
        format: 'empty',
        error: 'Value cannot be empty'
      };
    }

    // Key-specific validation
    const validations = {
      'RUNWAY_API_KEY': (v) => ({
        valid: v.length > 10,
        format: 'api_key',
        error: v.length <= 10 ? 'RUNWAY_API_KEY appears too short' : null
      }),

      'JWT_SECRET': (v) => ({
        valid: v.length >= 32,
        format: 'secret',
        error: v.length < 32 ? 'JWT_SECRET should be at least 32 characters' : null
      }),

      'SUPABASE_URL': (v) => ({
        valid: v.startsWith('https://') && v.includes('.supabase.co'),
        format: 'url',
        error: !v.startsWith('https://') || !v.includes('.supabase.co') 
          ? 'SUPABASE_URL should be a valid Supabase URL' 
          : null
      }),

      'SUPABASE_SERVICE_KEY': (v) => ({
        valid: v.length > 20,
        format: 'api_key',
        error: v.length <= 20 ? 'SUPABASE_SERVICE_KEY appears invalid' : null
      }),

      'REDIS_URL': (v) => ({
        valid: v.startsWith('redis://') || v.startsWith('rediss://'),
        format: 'url',
        error: !v.startsWith('redis://') && !v.startsWith('rediss://')
          ? 'REDIS_URL should start with redis:// or rediss://'
          : null
      }),

      'DATABASE_URL': (v) => ({
        valid: v.includes('://'),
        format: 'url',
        error: !v.includes('://')
          ? 'DATABASE_URL should be a valid connection string'
          : null
      })
    };

    if (validations[key]) {
      return validations[key](value);
    }

    // Default validation for unknown keys
    return {
      valid: value.length > 0,
      format: 'string',
      error: null
    };
  }

  /**
   * Check if key exists
   */
  async keyExists(key) {
    // Try from KeyManager first
    if (this.keyManager) {
      const result = await this.keyManager.hasSecret(key);
      if (result) return true;
    }

    // Try from process.env
    if (process.env[key]) {
      return true;
    }

    return false;
  }

  /**
   * Get key value
   */
  async getKeyValue(key) {
    // Try from KeyManager first
    if (this.keyManager) {
      const result = await this.keyManager.getSecret(key);
      if (result.found) return result.value;
    }

    // Try from process.env
    return process.env[key] || null;
  }

  /**
   * Validate all startup requirements
   */
  async validateAll() {
    const result = await this.validateStartup();

    if (!result.passed) {
      console.error('❌ Environment validation FAILED');
      console.error('Missing required variables:', result.required.missing);
      
      if (this.strictMode) {
        throw new Error(`Startup validation failed: Missing ${result.required.missing.join(', ')}`);
      }
      return result;
    }

    console.log('✅ Environment validation PASSED');
    console.log(`   Required keys found: ${result.required.found.length}`);
    console.log(`   Optional keys found: ${result.optional.found.length}`);

    if (result.warnings.length > 0) {
      console.warn('⚠️  Warnings:');
      result.warnings.forEach(w => console.warn(`   - ${w}`));
    }

    return result;
  }

  /**
   * Get validation report
   */
  getReport() {
    if (!this.validationResult) {
      return {
        validated: false,
        message: 'No validation performed yet. Call validateStartup() or validateAll()'
      };
    }

    const result = this.validationResult;
    return {
      validated: true,
      status: result.passed ? 'PASSED' : 'FAILED',
      required: {
        found: result.required.found.length,
        missing: result.required.missing.length,
        list: result.required.missing
      },
      optional: {
        found: result.optional.found.length,
        missing: result.optional.missing.length
      },
      errors: result.errors,
      warnings: result.warnings,
      timestamp: result.timestamp
    };
  }

  /**
   * Set required keys
   */
  setRequiredKeys(keys = []) {
    if (!Array.isArray(keys)) return false;
    this.requiredKeys = keys;
    return true;
  }

  /**
   * Add required key
   */
  addRequiredKey(key) {
    if (!key || this.requiredKeys.includes(key)) return false;
    this.requiredKeys.push(key);
    return true;
  }

  /**
   * Remove required key
   */
  removeRequiredKey(key) {
    const index = this.requiredKeys.indexOf(key);
    if (index === -1) return false;
    this.requiredKeys.splice(index, 1);
    return true;
  }

  /**
   * Export validation config
   */
  exportConfig() {
    return {
      environment: this.environment,
      requiredKeys: [...this.requiredKeys],
      optionalKeys: [...this.optionalKeys],
      strictMode: this.strictMode
    };
  }

  /**
   * Import validation config
   */
  importConfig(config = {}) {
    if (config.requiredKeys) this.requiredKeys = config.requiredKeys;
    if (config.optionalKeys) this.optionalKeys = config.optionalKeys;
    if (config.strictMode !== undefined) this.strictMode = config.strictMode;
    if (config.environment) this.environment = config.environment;
  }
}

module.exports = EnvValidator;