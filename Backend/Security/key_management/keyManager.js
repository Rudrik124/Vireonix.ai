/**
 * Key Manager Module
 * 
 * Purpose: Single place where application requests secrets.
 * 
 * All modules should request secrets from here, NOT from .env directly.
 * 
 * Examples:
 * - getRunwayKey()
 * - getSupabaseKey()
 * - getJwtSecret()
 * 
 * Benefits:
 * - Centralized secret management
 * - Easy to switch secret providers
 * - Secrets never exposed to rest of codebase
 * - Can add encryption/rotation later
 * - Auditable secret access
 */

class KeyManager {
  constructor(options = {}) {
    this.secretProvider = options.secretProvider || null;
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.cache = new Map();
    this.cacheExpiry = options.cacheExpiry || 3600000; // 1 hour
    this.stats = {
      secretsRequested: 0,
      secretsRetrieved: 0,
      secretsNotFound: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  /**
   * Set secret provider
   */
  setSecretProvider(provider) {
    if (!provider || typeof provider.getSecret !== 'function') {
      throw new Error('Provider must have getSecret method');
    }
    this.secretProvider = provider;
  }

  /**
   * Get secret by key
   */
  async getSecret(key) {
    this.stats.secretsRequested++;

    if (!key) {
      return {
        found: false,
        value: null,
        error: 'Key required'
      };
    }

    // Check cache first
    const cached = this.getFromCache(key);
    if (cached !== null) {
      this.stats.cacheHits++;
      return {
        found: true,
        value: cached,
        source: 'cache'
      };
    }

    this.stats.cacheMisses++;

    // Get from provider
    if (this.secretProvider) {
      const result = await this.secretProvider.getSecret(key);
      if (result && result.found) {
        this.stats.secretsRetrieved++;
        this.setInCache(key, result.value);
        return result;
      }
    }

    this.stats.secretsNotFound++;
    return {
      found: false,
      value: null,
      error: `Secret not found: ${key}`
    };
  }

  /**
   * Get Runway API key
   */
  async getRunwayKey() {
    return this.getSecret('RUNWAY_API_KEY');
  }

  /**
   * Get Supabase URL
   */
  async getSupabaseUrl() {
    return this.getSecret('SUPABASE_URL');
  }

  /**
   * Get Supabase service key
   */
  async getSupabaseServiceKey() {
    return this.getSecret('SUPABASE_SERVICE_KEY');
  }

  /**
   * Get JWT secret
   */
  async getJwtSecret() {
    return this.getSecret('JWT_SECRET');
  }

  /**
   * Get API key by name
   */
  async getApiKey(name) {
    if (!name) return { found: false, value: null, error: 'API key name required' };
    return this.getSecret(`API_KEY_${name}`);
  }

  /**
   * Get database connection string
   */
  async getDatabaseUrl() {
    return this.getSecret('DATABASE_URL');
  }

  /**
   * Get Redis URL
   */
  async getRedisUrl() {
    return this.getSecret('REDIS_URL');
  }

  /**
   * Get OAuth credentials
   */
  async getOAuthCredentials(provider) {
    if (!provider) {
      return { found: false, value: null, error: 'Provider required' };
    }

    const clientId = await this.getSecret(`OAUTH_${provider.toUpperCase()}_CLIENT_ID`);
    const clientSecret = await this.getSecret(`OAUTH_${provider.toUpperCase()}_CLIENT_SECRET`);

    if (!clientId.found || !clientSecret.found) {
      return {
        found: false,
        value: null,
        error: `Missing OAuth credentials for ${provider}`
      };
    }

    return {
      found: true,
      value: {
        clientId: clientId.value,
        clientSecret: clientSecret.value
      },
      source: clientId.source || 'provider'
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
   * Cache operations
   */
  setInCache(key, value) {
    this.cache.set(key, {
      value: value,
      timestamp: Date.now()
    });
  }

  getFromCache(key) {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  clearCache(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Check if secret exists
   */
  async hasSecret(key) {
    const result = await this.getSecret(key);
    return result.found;
  }

  /**
   * Verify required secrets are available
   */
  async verifyRequired(keys = []) {
    if (!Array.isArray(keys) || keys.length === 0) {
      return {
        verified: false,
        missing: []
      };
    }

    const missing = [];

    for (const key of keys) {
      const result = await this.hasSecret(key);
      if (!result) {
        missing.push(key);
      }
    }

    return {
      verified: missing.length === 0,
      missing: missing,
      status: missing.length === 0 ? 'All required secrets found' : `Missing: ${missing.join(', ')}`
    };
  }

  /**
   * Rotate secret
   */
  async rotateSecret(key, newValue) {
    if (!key || !newValue) {
      return {
        success: false,
        error: 'Key and newValue required'
      };
    }

    // Clear cache for this key
    this.clearCache(key);

    // Update in provider
    if (this.secretProvider && typeof this.secretProvider.setSecret === 'function') {
      const result = await this.secretProvider.setSecret(key, newValue);
      return result;
    }

    // Fallback: update cache
    this.setInCache(key, newValue);
    return {
      success: true,
      message: `Secret rotated: ${key}`,
      timestamp: new Date()
    };
  }

  /**
   * Get stats
   */
  getStats() {
    const total = this.stats.secretsRequested;
    return {
      ...this.stats,
      hitRate: total > 0
        ? ((this.stats.cacheHits / total) * 100).toFixed(2) + '%'
        : '0%',
      successRate: total > 0
        ? ((this.stats.secretsRetrieved / total) * 100).toFixed(2) + '%'
        : '0%',
      cachedSecrets: this.cache.size,
      environment: this.environment
    };
  }

  /**
   * Reset stats
   */
  resetStats() {
    this.stats = {
      secretsRequested: 0,
      secretsRetrieved: 0,
      secretsNotFound: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }
}

module.exports = KeyManager;