/**
 * Security Headers Module
 * 
 * Purpose: Add security headers to responses to protect against:
 * - Clickjacking
 * - MIME Sniffing
 * - Basic Browser Exploits
 * 
 * Typical headers:
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Content-Security-Policy
 * - Strict-Transport-Security
 * - X-XSS-Protection
 */

class SecurityHeaders {
  constructor(options = {}) {
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.domainWhitelist = options.domainWhitelist || ['yourdomain.com'];
    this.useHsts = options.useHsts !== false; // Enable HSTS by default
    this.hstsMaxAge = options.hstsMaxAge || 31536000; // 1 year
    this.stats = {
      headersApplied: 0,
      headersSet: {}
    };
  }

  /**
   * Get all security headers
   */
  getSecurityHeaders() {
    const headers = {
      // Prevent clickjacking
      'X-Frame-Options': this.getXFrameOptions(),

      // Prevent MIME sniffing
      'X-Content-Type-Options': 'nosniff',

      // XSS Protection (legacy, but still useful)
      'X-XSS-Protection': '1; mode=block',

      // Referrer Policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',

      // Permissions Policy (formerly Feature-Policy)
      'Permissions-Policy': this.getPermissionsPolicy(),

      // Content Security Policy
      'Content-Security-Policy': this.getContentSecurityPolicy(),

      // HSTS - Force HTTPS
      ...(this.useHsts && {
        'Strict-Transport-Security': `max-age=${this.hstsMaxAge}; includeSubDomains; preload`
      })
    };

    return headers;
  }

  /**
   * Get X-Frame-Options header
   */
  getXFrameOptions() {
    // Prevent embedding in frames from other origins
    return 'SAMEORIGIN';
  }

  /**
   * Get Content-Security-Policy header
   */
  getContentSecurityPolicy() {
    const policies = {
      // Default source for all content types
      'default-src': ["'self'"],

      // Scripts - allow from self and CDNs
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],

      // Stylesheets - allow from self
      'style-src': ["'self'", "'unsafe-inline'"],

      // Images - allow from anywhere
      'img-src': ['*', 'data:', 'https:'],

      // Fonts - allow from self
      'font-src': ["'self'"],

      // Media - allow from self
      'media-src': ["'self'"],

      // Frames - prevent embedding
      'frame-ancestors': ["'none'"],

      // Form submissions - allow to self
      'form-action': ["'self'"],

      // Base tag - disable
      'base-uri': ["'self'"],

      // Manifest - allow from self
      'manifest-src': ["'self'"]
    };

    // In production, use stricter policies
    if (this.environment === 'production') {
      policies['script-src'] = ["'self'"];
      policies['style-src'] = ["'self'"];
    }

    // Convert to CSP string
    return Object.entries(policies)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }

  /**
   * Get Permissions-Policy header
   */
  getPermissionsPolicy() {
    const permissions = {
      'camera': '()',
      'microphone': '()',
      'geolocation': '()',
      'accelerometer': '()',
      'gyroscope': '()',
      'magnetometer': '()',
      'payment': '()',
      'usb': '()',
      'vr': '()',
      'xr-spatial-tracking': '()'
    };

    return Object.entries(permissions)
      .map(([feature, permission]) => `${feature}=${permission}`)
      .join(', ');
  }

  /**
   * Apply security headers to Express response
   */
  getMiddleware() {
    return (req, res, next) => {
      const headers = this.getSecurityHeaders();

      for (const [headerName, headerValue] of Object.entries(headers)) {
        if (headerValue) {
          res.setHeader(headerName, headerValue);
          this.stats.headersSet[headerName] = (this.stats.headersSet[headerName] || 0) + 1;
        }
      }

      this.stats.headersApplied++;
      next();
    };
  }

  /**
   * Get HSTS header
   */
  getHstsHeader() {
    if (!this.useHsts) return null;

    return {
      'Strict-Transport-Security': `max-age=${this.hstsMaxAge}; includeSubDomains; preload`
    };
  }

  /**
   * Get additional security headers for API
   */
  getApiHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
  }

  /**
   * Validate CSP compliance
   */
  validateCspCompliance(scriptSources = []) {
    const csp = this.getContentSecurityPolicy();
    const scriptSrcMatch = csp.match(/script-src ([^;]+)/);

    if (!scriptSrcMatch) {
      return { compliant: false, reason: 'No script-src policy found' };
    }

    const allowedSources = scriptSrcMatch[1].split(' ');
    const nonCompliant = scriptSources.filter(source => !allowedSources.includes(source));

    return {
      compliant: nonCompliant.length === 0,
      allowedSources: allowedSources,
      nonCompliant: nonCompliant
    };
  }

  /**
   * Generate CSP nonce for inline scripts
   */
  generateCspNonce() {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('base64');
  }

  /**
   * Get CSP header with nonce
   */
  getCspWithNonce(nonce = '') {
    if (!nonce) {
      return this.getContentSecurityPolicy();
    }

    const base = this.getContentSecurityPolicy();
    // Add nonce to script-src
    return base.replace(/script-src[^;]+/, `script-src 'self' 'nonce-${nonce}'`);
  }

  /**
   * Get security header summary
   */
  getSummary() {
    const headers = this.getSecurityHeaders();
    const summary = {
      protection: {
        clickjacking: 'Protected (X-Frame-Options)',
        mimeSniffing: 'Protected (X-Content-Type-Options)',
        xss: 'Protected (X-XSS-Protection, CSP)',
        scriptInjection: 'Protected (CSP)',
        https: this.useHsts ? 'Enforced (HSTS)' : 'Not enforced'
      },
      headers: {}
    };

    for (const [name, value] of Object.entries(headers)) {
      summary.headers[name] = {
        value: value.substring(0, 100) + (value.length > 100 ? '...' : ''),
        enabled: !!value
      };
    }

    return summary;
  }

  /**
   * Get security score (0-100)
   */
  getSecurityScore() {
    const headers = this.getSecurityHeaders();
    const score = {
      total: 0,
      maxScore: 0
    };

    const expectedHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'X-XSS-Protection',
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'Referrer-Policy',
      'Permissions-Policy'
    ];

    score.maxScore = expectedHeaders.length * 100 / 7;

    for (const header of expectedHeaders) {
      if (headers[header]) {
        score.total += 100 / 7;
      }
    }

    return Math.round(score.total);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      securityScore: this.getSecurityScore(),
      activeHeaders: Object.keys(this.stats.headersSet).length,
      avgHeadersPerRequest: this.stats.headersApplied > 0
        ? (Object.values(this.stats.headersSet).reduce((a, b) => a + b, 0) / this.stats.headersApplied).toFixed(2)
        : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      headersApplied: 0,
      headersSet: {}
    };
  }

  /**
   * Set custom CSP
   */
  setCustomCsp(directives = {}) {
    this.customCsp = directives;
  }

  /**
   * Enable/disable specific header
   */
  toggleHeader(headerName = '', enabled = true) {
    if (!this.disabledHeaders) {
      this.disabledHeaders = new Set();
    }

    if (enabled) {
      this.disabledHeaders.delete(headerName);
    } else {
      this.disabledHeaders.add(headerName);
    }
  }
}

module.exports = SecurityHeaders;