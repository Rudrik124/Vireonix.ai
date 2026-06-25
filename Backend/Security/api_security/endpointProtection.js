/**
 * Endpoint Protection Module
 * 
 * Purpose: Control access to sensitive APIs.
 * 
 * Determine:
 * - Who can access? (Free user, Premium user, Admin)
 * - Request rate limits
 * - Quota management
 * 
 * Example Protected Endpoints:
 * /video/generate - Premium/Admin only
 * /image/generate - Premium/Admin only
 * /admin/* - Admin only
 */

class EndpointProtection {
  constructor(options = {}) {
    // Define endpoint access control rules
    this.endpoints = options.endpoints || this.getDefaultEndpoints();
    this.stats = {
      totalAccessAttempts: 0,
      allowedRequests: 0,
      deniedRequests: 0,
      denialReasons: {}
    };
  }

  /**
   * Get default endpoint configuration
   */
  getDefaultEndpoints() {
    return {
      // Public endpoints - anyone can access
      'GET /api/health': { required: 'none', tier: 'public' },
      'POST /api/auth/login': { required: 'none', tier: 'public' },
      'POST /api/auth/register': { required: 'none', tier: 'public' },
      'GET /api/docs': { required: 'none', tier: 'public' },

      // User endpoints - login required
      'GET /api/profile': { required: 'user', tier: 'user' },
      'PUT /api/profile': { required: 'user', tier: 'user' },
      'GET /api/videos': { required: 'user', tier: 'user' },

      // Premium endpoints
      'POST /api/video/generate': { required: 'premium', tier: 'premium', rateLimit: 10 },
      'POST /api/image/generate': { required: 'premium', tier: 'premium', rateLimit: 20 },
      'POST /api/audio/generate': { required: 'premium', tier: 'premium', rateLimit: 15 },
      'GET /api/video/download/:id': { required: 'premium', tier: 'premium' },

      // Admin endpoints
      'GET /api/admin/users': { required: 'admin', tier: 'admin' },
      'POST /api/admin/users/:id/suspend': { required: 'admin', tier: 'admin' },
      'GET /api/admin/logs': { required: 'admin', tier: 'admin' },
      'DELETE /api/admin/content/:id': { required: 'admin', tier: 'admin' },
      'PUT /api/admin/settings': { required: 'admin', tier: 'admin' }
    };
  }

  /**
   * Check if user can access endpoint
   * 
   * @param {string} endpoint - Endpoint path (e.g., '/api/video/generate')
   * @param {object} user - User object with role and tier
   * @returns {object} - { allowed, reason, rateLimit, tier }
   */
  checkAccess(endpoint = '', user = {}) {
    this.stats.totalAccessAttempts++;

    const endpointConfig = this.findEndpointConfig(endpoint);

    if (!endpointConfig) {
      // Unknown endpoint - allow by default but log
      return {
        allowed: true,
        reason: 'Endpoint not configured',
        rateLimit: null,
        tier: 'unknown',
        warning: 'Endpoint not in protection list'
      };
    }

    // Check if authentication required
    if (endpointConfig.required === 'none') {
      this.stats.allowedRequests++;
      return {
        allowed: true,
        reason: 'Public endpoint',
        rateLimit: endpointConfig.rateLimit || null,
        tier: endpointConfig.tier
      };
    }

    // Check if user is authenticated
    if (!user || !user.id) {
      this.stats.deniedRequests++;
      this.trackDenial('NOT_AUTHENTICATED');
      return {
        allowed: false,
        reason: 'User not authenticated',
        rateLimit: null,
        tier: null
      };
    }

    // Check tier/role requirement
    const tierCheck = this.checkTierRequirement(user, endpointConfig.required);
    
    if (!tierCheck.allowed) {
      this.stats.deniedRequests++;
      this.trackDenial('INSUFFICIENT_TIER');
      return {
        allowed: false,
        reason: `Requires ${endpointConfig.required} tier (user has ${user.tier || 'free'})`,
        rateLimit: null,
        tier: user.tier || 'free'
      };
    }

    this.stats.allowedRequests++;

    return {
      allowed: true,
      reason: 'Access granted',
      rateLimit: endpointConfig.rateLimit || null,
      tier: user.tier || 'free',
      userId: user.id
    };
  }

  /**
   * Find endpoint configuration by path
   */
  findEndpointConfig(endpoint = '') {
    // Exact match first
    for (const [path, config] of Object.entries(this.endpoints)) {
      if (this.pathsMatch(path, endpoint)) {
        return config;
      }
    }

    // Try pattern matching for parameterized routes
    const patterns = [
      { pattern: /^GET \/api\/video\/download\/[^/]+$/, config: this.endpoints['GET /api/video/download/:id'] },
      { pattern: /^POST \/api\/admin\/users\/[^/]+\/suspend$/, config: this.endpoints['POST /api/admin/users/:id/suspend'] },
      { pattern: /^DELETE \/api\/admin\/content\/[^/]+$/, config: this.endpoints['DELETE /api/admin/content/:id'] }
    ];

    for (const { pattern, config } of patterns) {
      if (pattern.test(endpoint)) {
        return config;
      }
    }

    return null;
  }

  /**
   * Check if paths match (considering parameters)
   */
  pathsMatch(pattern = '', path = '') {
    if (pattern === path) return true;

    // Convert pattern to regex for :id style parameters
    const regexPattern = pattern
      .replace(/:[^/]+/g, '[^/]+')
      .replace(/\*/g, '.*');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * Check if user meets tier requirement
   */
  checkTierRequirement(user = {}, requiredTier = 'user') {
    const userRole = user.role || 'user';
    const userTier = user.tier || 'free';

    // Tier hierarchy: free < user < premium < admin
    const tierHierarchy = {
      'none': 0,
      'public': 0,
      'free': 1,
      'user': 2,
      'premium': 3,
      'admin': 100
    };

    const requiredLevel = tierHierarchy[requiredTier] || tierHierarchy['user'];
    const userLevel = tierHierarchy[userTier] || tierHierarchy['free'];

    // Admin can access anything
    if (userRole === 'admin') {
      return { allowed: true };
    }

    const allowed = userLevel >= requiredLevel;

    return {
      allowed: allowed,
      userTier: userTier,
      requiredTier: requiredTier
    };
  }

  /**
   * Get access tier for user
   */
  getUserTier(user = {}) {
    const role = user.role || 'user';
    
    if (role === 'admin') {
      return 'admin';
    }

    return user.tier || 'free';
  }

  /**
   * Check rate limit for endpoint
   */
  checkRateLimit(endpoint = '', user = {}, windowSize = 60) {
    const endpointConfig = this.findEndpointConfig(endpoint);
    
    if (!endpointConfig || !endpointConfig.rateLimit) {
      return {
        isAllowed: true,
        remaining: null,
        limit: null,
        resetAt: null
      };
    }

    // In production, use Redis or database for rate limiting
    // This is a simplified version
    const limit = endpointConfig.rateLimit;
    const remaining = Math.max(0, limit);

    return {
      isAllowed: remaining > 0,
      remaining: remaining,
      limit: limit,
      resetAt: new Date(Date.now() + windowSize * 1000)
    };
  }

  /**
   * Get quota for user
   */
  getUserQuota(user = {}) {
    const tier = this.getUserTier(user);

    const quotas = {
      'free': {
        videoGenerations: 0,
        imageGenerations: 5,
        audioGenerations: 0,
        storageGB: 1
      },
      'user': {
        videoGenerations: 0,
        imageGenerations: 20,
        audioGenerations: 10,
        storageGB: 10
      },
      'premium': {
        videoGenerations: 50,
        imageGenerations: 200,
        audioGenerations: 100,
        storageGB: 100
      },
      'admin': {
        videoGenerations: -1, // Unlimited
        imageGenerations: -1,
        audioGenerations: -1,
        storageGB: -1
      }
    };

    return quotas[tier] || quotas['free'];
  }

  /**
   * Check if user can perform action
   */
  canPerformAction(action = '', user = {}) {
    const tier = this.getUserTier(user);
    const quota = this.getUserQuota(user);

    const actionChecks = {
      'generate_video': tier === 'premium' || tier === 'admin',
      'generate_image': tier !== 'free',
      'generate_audio': tier === 'premium' || tier === 'admin',
      'download_video': tier !== 'free',
      'admin_access': tier === 'admin',
      'delete_content': tier === 'admin'
    };

    return actionChecks[action] || false;
  }

  /**
   * Add custom endpoint protection rule
   */
  addEndpoint(path = '', config = {}) {
    if (!path || !config) return false;

    this.endpoints[path] = {
      required: config.required || 'user',
      tier: config.tier || 'user',
      rateLimit: config.rateLimit || null
    };

    return true;
  }

  /**
   * Remove endpoint protection rule
   */
  removeEndpoint(path = '') {
    if (!path || !this.endpoints[path]) return false;

    delete this.endpoints[path];
    return true;
  }

  /**
   * Get all protected endpoints
   */
  getProtectedEndpoints() {
    return { ...this.endpoints };
  }

  /**
   * Track denial reason
   */
  trackDenial(reason) {
    this.stats.denialReasons[reason] = (this.stats.denialReasons[reason] || 0) + 1;
  }

  /**
   * Get access statistics
   */
  getStats() {
    return {
      ...this.stats,
      allowanceRate: this.stats.totalAccessAttempts > 0
        ? ((this.stats.allowedRequests / this.stats.totalAccessAttempts) * 100).toFixed(2) + '%'
        : '0%',
      denialRate: this.stats.totalAccessAttempts > 0
        ? ((this.stats.deniedRequests / this.stats.totalAccessAttempts) * 100).toFixed(2) + '%'
        : '0%',
      topDenialReasons: Object.entries(this.stats.denialReasons)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .reduce((acc, [reason, count]) => ({ ...acc, [reason]: count }), {})
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalAccessAttempts: 0,
      allowedRequests: 0,
      deniedRequests: 0,
      denialReasons: {}
    };
  }
}

module.exports = EndpointProtection;