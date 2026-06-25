/**
 * Auth Guard Module
 * 
 * Purpose: Verify authenticated users.
 * 
 * Checks:
 * - User Logged In?
 * - Valid Token?
 * - Token Expired?
 * - Valid Session?
 * 
 * Flow: Request → Check Token → Verify User → Allow/Deny
 */

class AuthGuard {
  constructor(options = {}) {
    this.tokenSecret = options.tokenSecret || process.env.JWT_SECRET || 'default-secret';
    this.tokenExpiry = options.tokenExpiry || 24 * 60 * 60; // 24 hours in seconds
    this.refreshTokenExpiry = options.refreshTokenExpiry || 7 * 24 * 60 * 60; // 7 days
    this.userSessions = new Map(); // In-memory session storage
    this.stats = {
      totalAuthChecks: 0,
      successfulAuths: 0,
      failedAuths: 0,
      expiredTokens: 0,
      invalidTokens: 0,
      sessionCreated: 0
    };
  }

  /**
   * Verify user is authenticated
   * 
   * @param {object} request - Express request object or custom request
   * @returns {object} - { isAuthenticated, user, token, message, error }
   */
  verifyAuth(request = {}) {
    this.stats.totalAuthChecks++;

    // Check if token exists
    const token = this.extractToken(request);
    
    if (!token) {
      this.stats.failedAuths++;
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        message: 'No authentication token provided',
        error: 'TOKEN_MISSING'
      };
    }

    // Verify token format
    if (!this.isValidTokenFormat(token)) {
      this.stats.invalidTokens++;
      this.stats.failedAuths++;
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        message: 'Invalid token format',
        error: 'TOKEN_INVALID_FORMAT'
      };
    }

    // Check token expiry
    const expiryCheck = this.checkTokenExpiry(token);
    if (expiryCheck.expired) {
      this.stats.expiredTokens++;
      this.stats.failedAuths++;
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        message: 'Token has expired',
        error: 'TOKEN_EXPIRED',
        expiredAt: expiryCheck.expiredAt
      };
    }

    // Verify token signature
    const signatureCheck = this.verifyTokenSignature(token);
    if (!signatureCheck.isValid) {
      this.stats.invalidTokens++;
      this.stats.failedAuths++;
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        message: 'Invalid token signature',
        error: 'TOKEN_SIGNATURE_INVALID'
      };
    }

    // Check if session is valid
    const payload = this.parseTokenPayload(token);
    const sessionCheck = this.verifySession(payload.userId, payload.sessionId);
    
    if (!sessionCheck.isValid) {
      this.stats.failedAuths++;
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        message: 'Invalid or revoked session',
        error: 'SESSION_INVALID'
      };
    }

    // All checks passed
    this.stats.successfulAuths++;
    
    return {
      isAuthenticated: true,
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role || 'user',
        permissions: payload.permissions || []
      },
      token: token,
      message: 'Authentication successful',
      expiresIn: expiryCheck.expiresIn
    };
  }

  /**
   * Create authentication token
   * 
   * @param {object} user - User object with id, email, role
   * @param {object} options - Options for token creation
   * @returns {object} - { token, expiresAt, sessionId }
   */
  createToken(user = {}, options = {}) {
    if (!user.id || !user.email) {
      return {
        token: null,
        expiresAt: null,
        sessionId: null,
        error: 'User ID and email required'
      };
    }

    const sessionId = this.generateSessionId();
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + (options.expiresIn || this.tokenExpiry);

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role || 'user',
      permissions: user.permissions || [],
      sessionId: sessionId,
      iat: issuedAt,
      exp: expiresAt
    };

    // Create session
    this.createSession(user.id, sessionId, payload, expiresAt);

    // Create token (simplified - in production use JWT library)
    const token = this.encodeToken(payload);

    this.stats.sessionCreated++;

    return {
      token: token,
      expiresAt: new Date(expiresAt * 1000),
      sessionId: sessionId,
      expiresIn: options.expiresIn || this.tokenExpiry
    };
  }

  /**
   * Refresh authentication token
   * 
   * @param {string} token - Current token
   * @param {string} refreshToken - Refresh token
   * @returns {object} - { token, refreshToken, expiresAt }
   */
  refreshToken(token = '', refreshToken = '') {
    // Verify refresh token
    if (!refreshToken) {
      return {
        token: null,
        refreshToken: null,
        expiresAt: null,
        error: 'Refresh token required'
      };
    }

    const currentPayload = this.parseTokenPayload(token);
    if (!currentPayload) {
      return {
        token: null,
        refreshToken: null,
        expiresAt: null,
        error: 'Invalid current token'
      };
    }

    const refreshCheck = this.verifyRefreshToken(refreshToken);
    if (!refreshCheck.isValid) {
      return {
        token: null,
        refreshToken: null,
        expiresAt: null,
        error: 'Invalid or expired refresh token'
      };
    }

    // Create new token
    const newToken = this.createToken({
      id: currentPayload.userId,
      email: currentPayload.email,
      role: currentPayload.role,
      permissions: currentPayload.permissions
    });

    return {
      token: newToken.token,
      refreshToken: refreshToken,
      expiresAt: newToken.expiresAt,
      expiresIn: newToken.expiresIn
    };
  }

  /**
   * Revoke authentication token
   * 
   * @param {string} token - Token to revoke
   * @returns {boolean} - Success
   */
  revokeToken(token = '') {
    const payload = this.parseTokenPayload(token);
    if (!payload) {
      return false;
    }

    return this.revokeSession(payload.userId, payload.sessionId);
  }

  /**
   * Extract token from request
   */
  extractToken(request = {}) {
    // Check Authorization header (Bearer token)
    if (request.headers && request.headers.authorization) {
      const authHeader = request.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
    }

    // Check cookies
    if (request.cookies && request.cookies.authToken) {
      return request.cookies.authToken;
    }

    // Check query parameter
    if (request.query && request.query.token) {
      return request.query.token;
    }

    // Check body
    if (request.body && request.body.token) {
      return request.body.token;
    }

    return null;
  }

  /**
   * Verify token format
   */
  isValidTokenFormat(token) {
    if (typeof token !== 'string') return false;
    // Check for typical JWT format: header.payload.signature
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * Check if token is expired
   */
  checkTokenExpiry(token) {
    const payload = this.parseTokenPayload(token);
    if (!payload) {
      return { expired: true, expiredAt: null, expiresIn: null };
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = payload.exp;
    const expired = now > expiresAt;
    const expiresIn = Math.max(0, expiresAt - now);

    return {
      expired: expired,
      expiredAt: expired ? new Date(expiresAt * 1000) : null,
      expiresIn: expiresIn
    };
  }

  /**
   * Verify token signature
   */
  verifyTokenSignature(token) {
    // In production, use JWT library like jsonwebtoken
    // This is simplified verification
    try {
      const [header, payload, signature] = token.split('.');
      
      if (!header || !payload || !signature) {
        return { isValid: false };
      }

      // Verify signature (simplified)
      const expectedSignature = this.generateSignature(header, payload);
      const isValid = signature === expectedSignature;

      return { isValid: isValid };
    } catch (error) {
      return { isValid: false };
    }
  }

  /**
   * Parse token payload
   */
  parseTokenPayload(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Encode token
   */
  encodeToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = this.generateSignature(header, payloadStr);

    return `${header}.${payloadStr}.${signature}`;
  }

  /**
   * Generate token signature
   */
  generateSignature(header, payload) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.tokenSecret);
    hmac.update(`${header}.${payload}`);
    return hmac.digest('base64');
  }

  /**
   * Create user session
   */
  createSession(userId, sessionId, payload, expiresAt) {
    this.userSessions.set(sessionId, {
      userId: userId,
      payload: payload,
      createdAt: Date.now(),
      expiresAt: expiresAt * 1000,
      revoked: false
    });
  }

  /**
   * Verify session is valid
   */
  verifySession(userId, sessionId) {
    if (!this.userSessions.has(sessionId)) {
      return { isValid: false, reason: 'Session not found' };
    }

    const session = this.userSessions.get(sessionId);

    if (session.revoked) {
      return { isValid: false, reason: 'Session revoked' };
    }

    if (Date.now() > session.expiresAt) {
      this.userSessions.delete(sessionId);
      return { isValid: false, reason: 'Session expired' };
    }

    if (session.userId !== userId) {
      return { isValid: false, reason: 'User ID mismatch' };
    }

    return { isValid: true };
  }

  /**
   * Revoke session
   */
  revokeSession(userId, sessionId) {
    if (!this.userSessions.has(sessionId)) {
      return false;
    }

    const session = this.userSessions.get(sessionId);
    if (session.userId !== userId) {
      return false;
    }

    session.revoked = true;
    return true;
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId) {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    return token;
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    // In production, store refresh tokens in database
    // This is simplified verification
    return { isValid: token && token.length > 0 };
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Get authentication statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalAuthChecks > 0
        ? ((this.stats.successfulAuths / this.stats.totalAuthChecks) * 100).toFixed(2) + '%'
        : '0%',
      failureRate: this.stats.totalAuthChecks > 0
        ? ((this.stats.failedAuths / this.stats.totalAuthChecks) * 100).toFixed(2) + '%'
        : '0%',
      activeSessions: this.userSessions.size
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalAuthChecks: 0,
      successfulAuths: 0,
      failedAuths: 0,
      expiredTokens: 0,
      invalidTokens: 0,
      sessionCreated: 0
    };
  }
}

module.exports = AuthGuard;