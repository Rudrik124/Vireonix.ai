/**
 * CORS Configuration Module
 * 
 * Purpose: Prevent unauthorized websites from calling your APIs.
 * 
 * Allow only:
 * - yourdomain.com
 * - app.yourdomain.com
 * 
 * Block:
 * - randomsite.com
 * - other unauthorized domains
 */

class CorsConfig {
  constructor(options = {}) {
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.allowedOrigins = options.allowedOrigins || this.getDefaultOrigins();
    this.allowedMethods = options.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
    this.allowedHeaders = options.allowedHeaders || ['Content-Type', 'Authorization', 'X-Request-ID'];
    this.exposedHeaders = options.exposedHeaders || ['X-Total-Count', 'X-Page-Count'];
    this.maxAge = options.maxAge || 3600; // 1 hour
    this.credentials = options.credentials !== false; // Allow credentials by default
    this.stats = {
      corsChecks: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      blockedOrigins: {}
    };
  }

  /**
   * Get default CORS origins based on environment
   */
  getDefaultOrigins() {
    const development = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];

    const production = [
      'https://yourdomain.com',
      'https://www.yourdomain.com',
      'https://app.yourdomain.com'
    ];

    return this.environment === 'production' ? production : development;
  }

  /**
   * Verify CORS request
   * 
   * @param {string} origin - Request origin
   * @param {string} method - HTTP method
   * @returns {object} - { allowed, origin, headers, maxAge }
   */
  verifyCors(origin = '', method = 'GET') {
    this.stats.corsChecks++;

    // Handle requests without origin (same-origin or non-CORS)
    if (!origin) {
      this.stats.allowedRequests++;
      return {
        allowed: true,
        origin: null,
        headers: {
          'Access-Control-Allow-Methods': this.allowedMethods.join(', '),
          'Access-Control-Allow-Headers': this.allowedHeaders.join(', ')
        },
        maxAge: this.maxAge,
        note: 'No origin specified (same-origin or non-CORS request)'
      };
    }

    // Check if origin is allowed
    const originAllowed = this.isOriginAllowed(origin);

    if (!originAllowed) {
      this.stats.blockedRequests++;
      this.trackBlockedOrigin(origin);

      return {
        allowed: false,
        origin: origin,
        reason: 'Origin not in CORS whitelist',
        status: 403
      };
    }

    // Check if method is allowed
    if (!this.isMethodAllowed(method)) {
      this.stats.blockedRequests++;
      return {
        allowed: false,
        origin: origin,
        reason: `Method ${method} not allowed`,
        allowedMethods: this.allowedMethods,
        status: 405
      };
    }

    this.stats.allowedRequests++;

    return {
      allowed: true,
      origin: origin,
      headers: this.getCorsHeaders(origin),
      maxAge: this.maxAge,
      credentials: this.credentials
    };
  }

  /**
   * Get CORS response headers
   */
  getCorsHeaders(origin = '') {
    return {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': this.allowedMethods.join(', '),
      'Access-Control-Allow-Headers': this.allowedHeaders.join(', '),
      'Access-Control-Expose-Headers': this.exposedHeaders.join(', '),
      'Access-Control-Max-Age': this.maxAge.toString(),
      'Access-Control-Allow-Credentials': this.credentials ? 'true' : 'false'
    };
  }

  /**
   * Check if origin is allowed
   */
  isOriginAllowed(origin = '') {
    if (!origin) return false;

    // Normalize origin (remove trailing slash, convert to lowercase)
    const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');

    // Check for exact match
    for (const allowed of this.allowedOrigins) {
      if (allowed.toLowerCase() === normalizedOrigin) {
        return true;
      }
    }

    // Check for wildcard patterns
    for (const pattern of this.allowedOrigins) {
      if (pattern.includes('*')) {
        const regexPattern = pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        
        if (regex.test(normalizedOrigin)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if HTTP method is allowed
   */
  isMethodAllowed(method = '') {
    if (!method) return false;
    return this.allowedMethods.includes(method.toUpperCase());
  }

  /**
   * Check if header is allowed
   */
  isHeaderAllowed(headerName = '') {
    if (!headerName) return false;
    const normalized = headerName.toLowerCase();
    
    return this.allowedHeaders.some(h => h.toLowerCase() === normalized);
  }

  /**
   * Handle preflight request
   */
  handlePreflight(origin = '', requestMethod = '', requestHeaders = []) {
    const corsCheck = this.verifyCors(origin, requestMethod);

    if (!corsCheck.allowed) {
      return {
        allowed: false,
        status: 403,
        reason: corsCheck.reason
      };
    }

    // Verify requested headers are allowed
    for (const header of requestHeaders) {
      if (!this.isHeaderAllowed(header)) {
        return {
          allowed: false,
          status: 403,
          reason: `Header ${header} not allowed`,
          allowedHeaders: this.allowedHeaders
        };
      }
    }

    return {
      allowed: true,
      status: 204,
      headers: corsCheck.headers
    };
  }

  /**
   * Add allowed origin
   */
  addAllowedOrigin(origin = '') {
    if (!origin) return false;

    const normalized = origin.toLowerCase().replace(/\/$/, '');
    
    if (!this.allowedOrigins.includes(normalized)) {
      this.allowedOrigins.push(normalized);
      return true;
    }

    return false;
  }

  /**
   * Remove allowed origin
   */
  removeAllowedOrigin(origin = '') {
    if (!origin) return false;

    const normalized = origin.toLowerCase().replace(/\/$/, '');
    const index = this.allowedOrigins.indexOf(normalized);

    if (index !== -1) {
      this.allowedOrigins.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Get allowed origins
   */
  getAllowedOrigins() {
    return [...this.allowedOrigins];
  }

  /**
   * Set allowed origins
   */
  setAllowedOrigins(origins = []) {
    if (!Array.isArray(origins)) return false;
    this.allowedOrigins = origins.map(o => o.toLowerCase());
    return true;
  }

  /**
   * Get Express middleware
   */
  getMiddleware() {
    return (req, res, next) => {
      const origin = req.headers.origin;
      const method = req.method;

      const corsResult = this.verifyCors(origin, method);

      if (!corsResult.allowed) {
        return res.status(corsResult.status || 403).json({
          error: 'CORS policy violation',
          message: corsResult.reason
        });
      }

      // Set CORS headers
      for (const [header, value] of Object.entries(corsResult.headers)) {
        res.setHeader(header, value);
      }

      // Handle preflight requests
      if (method === 'OPTIONS') {
        const preflightResult = this.handlePreflight(
          origin,
          req.headers['access-control-request-method'] || 'GET',
          (req.headers['access-control-request-headers'] || '').split(',').map(h => h.trim())
        );

        if (!preflightResult.allowed) {
          return res.status(preflightResult.status).json({
            error: 'Preflight failed',
            message: preflightResult.reason
          });
        }

        return res.status(204).send();
      }

      next();
    };
  }

  /**
   * Track blocked origin
   */
  trackBlockedOrigin(origin = '') {
    this.stats.blockedOrigins[origin] = (this.stats.blockedOrigins[origin] || 0) + 1;
  }

  /**
   * Get CORS statistics
   */
  getStats() {
    return {
      ...this.stats,
      allowanceRate: this.stats.corsChecks > 0
        ? ((this.stats.allowedRequests / this.stats.corsChecks) * 100).toFixed(2) + '%'
        : '0%',
      blockageRate: this.stats.corsChecks > 0
        ? ((this.stats.blockedRequests / this.stats.corsChecks) * 100).toFixed(2) + '%'
        : '0%',
      topBlockedOrigins: Object.entries(this.stats.blockedOrigins)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reduce((acc, [origin, count]) => ({ ...acc, [origin]: count }), {})
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      corsChecks: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      blockedOrigins: {}
    };
  }
}

module.exports = CorsConfig;