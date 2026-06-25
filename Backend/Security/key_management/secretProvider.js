/**
 * Secret Provider Module
 * 
 * Purpose: Load secrets from Render Environment Variables or .env based on environment.
 * 
 * Security Flow:
 * Render Secret → secretProvider.js → keyManager.js → Backend Modules
 * 
 * Environment Detection:
 * - Render: Use process.env (deployed environment)
 * - Local: Use .env file (development)
 */

const fs = require('fs');
const path = require('path');

class SecretProvider {
  constructor(options = {}) {
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.envFilePath = options.envFilePath || path.join(process.cwd(), '.env');
    this.envFileLocalPath = options.envFileLocalPath || path.join(process.cwd(), '.env.local');
    this.secrets = new Map();
    this.isInitialized = false;
    this.stats = {
      secretsLoaded: 0,
      secretsFromRender: 0,
      secretsFromEnvFile: 0,
      loadErrors: 0
    };
  }

  /**
   * Initialize secret provider
   */
  async initialize() {
    console.log(`🔐 Initializing SecretProvider (${this.environment})`);

    try {
      if (this.isRenderEnvironment()) {
        await this.loadFromRender();
      } else {
        await this.loadFromEnvFile();
      }

      this.isInitialized = true;
      console.log(`✅ SecretProvider initialized (${this.stats.secretsLoaded} secrets loaded)`);
      return { success: true, loaded: this.stats.secretsLoaded };

    } catch (error) {
      console.error('❌ SecretProvider initialization failed:', error.message);
      this.stats.loadErrors++;
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if running on Render platform
   */
  isRenderEnvironment() {
    // Render sets RENDER_SERVICE_ID environment variable
    return !!process.env.RENDER_SERVICE_ID || this.environment === 'production';
  }

  /**
   * Load secrets from Render environment variables
   */
  async loadFromRender() {
    console.log('📦 Loading secrets from Render environment...');

    const requiredKeys = [
      'RUNWAY_API_KEY',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_KEY',
      'JWT_SECRET'
    ];

    for (const key of requiredKeys) {
      if (process.env[key]) {
        this.secrets.set(key, process.env[key]);
        this.stats.secretsFromRender++;
        this.stats.secretsLoaded++;
      }
    }

    // Also load optional keys
    const optionalKeys = [
      'REDIS_URL',
      'DATABASE_URL',
      'ANALYTICS_KEY',
      'MONITORING_KEY'
    ];

    for (const key of optionalKeys) {
      if (process.env[key]) {
        this.secrets.set(key, process.env[key]);
        this.stats.secretsFromRender++;
        this.stats.secretsLoaded++;
      }
    }
  }

  /**
   * Load secrets from .env file
   */
  async loadFromEnvFile() {
    console.log('📄 Loading secrets from .env file...');

    const paths = [this.envFileLocalPath, this.envFilePath];

    for (const filePath of paths) {
      if (fs.existsSync(filePath)) {
        console.log(`   Reading: ${filePath}`);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n');

          for (const line of lines) {
            // Skip comments and empty lines
            if (line.startsWith('#') || !line.trim()) continue;

            const [key, ...valueParts] = line.split('=');
            const cleanKey = key.trim();
            const cleanValue = valueParts.join('=').trim();

            if (cleanKey && cleanValue) {
              // Remove quotes if present
              const unquotedValue = cleanValue
                .replace(/^["']/, '')
                .replace(/["']$/, '');

              this.secrets.set(cleanKey, unquotedValue);
              this.stats.secretsFromEnvFile++;
              this.stats.secretsLoaded++;
            }
          }
          return; // Stop after first found file
        } catch (error) {
          console.error(`   Error reading ${filePath}:`, error.message);
          this.stats.loadErrors++;
        }
      }
    }

    if (this.stats.secretsLoaded === 0) {
      console.warn('   ⚠️  No .env file found. Using environment variables only.');
    }
  }

  /**
   * Get secret by key
   */
  async getSecret(key) {
    if (!key) {
      return {
        found: false,
        value: null,
        error: 'Key required'
      };
    }

    // If not initialized, try direct env lookup
    if (!this.isInitialized) {
      const value = process.env[key];
      if (value) {
        return {
          found: true,
          value: value,
          source: 'uninitialized',
          warning: 'SecretProvider not initialized'
        };
      }
      return {
        found: false,
        value: null,
        error: 'SecretProvider not initialized'
      };
    }

    // Get from loaded secrets
    if (this.secrets.has(key)) {
      return {
        found: true,
        value: this.secrets.get(key),
        source: this.environment === 'production' ? 'render' : 'envfile'
      };
    }

    // Fallback to process.env
    if (process.env[key]) {
      return {
        found: true,
        value: process.env[key],
        source: 'process.env'
      };
    }

    return {
      found: false,
      value: null,
      error: `Secret not found: ${key}`
    };
  }

  /**
   * Set secret (for testing/development)
   */
  async setSecret(key, value) {
    if (!key || !value) {
      return {
        success: false,
        error: 'Key and value required'
      };
    }

    this.secrets.set(key, value);
    return {
      success: true,
      message: `Secret set: ${key}`,
      source: 'memory'
    };
  }

  /**
   * Get all secrets (for initialization)
   */
  async getAllSecrets(keys = []) {
    if (!Array.isArray(keys) || keys.length === 0) {
      return {
        found: false,
        value: null,
        error: 'Keys array required'
      };
    }

    const secrets = {};
    const missing = [];

    for (const key of keys) {
      const result = await this.getSecret(key);
      if (result.found) {
        secrets[key] = result.value;
      } else {
        missing.push(key);
      }
    }

    return {
      found: missing.length === 0,
      value: secrets,
      missing: missing.length > 0 ? missing : null,
      partial: missing.length > 0 && Object.keys(secrets).length > 0
    };
  }

  /**
   * Check if secret exists
   */
  async hasSecret(key) {
    const result = await this.getSecret(key);
    return result.found;
  }

  /**
   * Clear all cached secrets (reload from source)
   */
  async reload() {
    this.secrets.clear();
    this.stats.secretsLoaded = 0;
    this.stats.secretsFromRender = 0;
    this.stats.secretsFromEnvFile = 0;

    return this.initialize();
  }

  /**
   * Get list of loaded secrets (keys only)
   */
  getLoadedSecretKeys() {
    return Array.from(this.secrets.keys());
  }

  /**
   * Validate secret format
   */
  validateSecretFormat(key, value) {
    const validations = {
      'RUNWAY_API_KEY': (v) => v && v.length > 10,
      'JWT_SECRET': (v) => v && v.length >= 32,
      'SUPABASE_URL': (v) => v && v.startsWith('https://') && v.includes('.supabase.co'),
      'SUPABASE_SERVICE_KEY': (v) => v && v.length > 20
    };

    if (validations[key]) {
      return validations[key](value);
    }

    return !!value; // Default: just check it exists
  }

  /**
   * Export secrets (WARNING: Only for testing/debugging)
   */
  exportSecrets() {
    if (this.environment === 'production') {
      return {
        error: 'Cannot export secrets in production'
      };
    }

    const exported = {};
    for (const [key, value] of this.secrets.entries()) {
      exported[key] = value.substring(0, 5) + '***'; // Mask values
    }

    return exported;
  }

  /**
   * Get provider statistics
   */
  getStats() {
    return {
      ...this.stats,
      environment: this.environment,
      initialized: this.isInitialized,
      totalSecretsLoaded: this.stats.secretsLoaded,
      sources: {
        render: this.stats.secretsFromRender,
        envFile: this.stats.secretsFromEnvFile
      }
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      secretsLoaded: 0,
      secretsFromRender: 0,
      secretsFromEnvFile: 0,
      loadErrors: 0
    };
  }
}

module.exports = SecretProvider;