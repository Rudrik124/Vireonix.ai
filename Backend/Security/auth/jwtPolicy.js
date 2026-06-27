/**
 * JWT Policy
 * 
 * Purpose: JWT token management, validation, and rotation
 * 
 * Features:
 * - Token generation with expiry
 * - Token validation and verification
 * - Token rotation for security
 * - Refresh token management
 * - Token blacklisting/revocation
 * - Payload signing and verification
 */

import crypto from 'crypto';

class JWTPolicy {
  constructor(options = {}) {
    this.config = {
      // Algorithm for token signing
      algorithm: options.algorithm || process.env.JWT_ALGORITHM || 'HS256',
      
      // Secret key for signing
      secretKey: options.secretKey || process.env.JWT_SECRET || process.env.AUTH_JWT_SECRET || 'default-secret-key',
      
      // Token expiry time (seconds)
      tokenExpiry: options.tokenExpiry || Number(process.env.AUTH_ACCESS_TOKEN_TTL_SECONDS || process.env.JWT_ACCESS_TOKEN_TTL_SECONDS || 3600), // 1 hour
      
      // Refresh token expiry (seconds)
      refreshTokenExpiry: options.refreshTokenExpiry || Number(process.env.AUTH_REFRESH_TOKEN_TTL_SECONDS || process.env.JWT_REFRESH_TOKEN_TTL_SECONDS || 604800), // 7 days
      
      // Enable token rotation
      enableRotation: options.enableRotation !== false,
      
      // Rotation threshold (seconds before expiry to rotate)
      rotationThreshold: options.rotationThreshold || 300, // 5 minutes
      
      // Enable refresh tokens
      enableRefreshTokens: options.enableRefreshTokens !== false,
      
      // Token version tracking
      versionTracking: options.versionTracking !== false,
      
      // Blacklist enabled
      enableBlacklist: options.enableBlacklist !== false
    };
    
    this.tokenStore = new Map();           // tokenId -> token data
    this.refreshTokenStore = new Map();    // refreshTokenId -> refresh token data
    this.blacklist = new Set();            // revoked token IDs
    this.tokenVersions = new Map();        // userId -> version
    
    this.stats = {
      tokensGenerated: 0,
      tokensValidated: 0,
      tokensExpired: 0,
      tokensRevoked: 0,
      tokensRotated: 0,
      refreshTokensIssued: 0,
      validationFailed: 0
    };
  }

  /**
   * Generate JWT token
   */
  generateToken(payload, options = {}) {
    try {
      const tokenId = crypto.randomBytes(16).toString('hex');
      const issuedAt = Math.floor(Date.now() / 1000);
      const expiresAt = issuedAt + (options.expiry || this.config.tokenExpiry);

      // Build token data
      const tokenData = {
        header: {
          alg: this.config.algorithm,
          typ: 'JWT'
        },
        payload: {
          ...payload,
          iat: issuedAt,
          exp: expiresAt,
          jti: tokenId, // JWT ID for tracking
          version: this.getTokenVersion(payload.userId)
        },
        signature: null
      };

      // Sign token
      const signatureInput = `${this.base64urlEncode(tokenData.header)}.${this.base64urlEncode(tokenData.payload)}`;
      tokenData.signature = this.signData(signatureInput);

      const token = `${signatureInput}.${tokenData.signature}`;

      // Store token info
      this.tokenStore.set(tokenId, {
        token: token,
        payload: tokenData.payload,
        issuedAt: issuedAt,
        expiresAt: expiresAt,
        rotated: false
      });

      this.stats.tokensGenerated++;

      return {
        success: true,
        token: token,
        expiresAt: expiresAt,
        expiresIn: this.config.tokenExpiry,
        tokenId: tokenId
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate and verify JWT token
   */
  validateToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        this.stats.validationFailed++;
        return { valid: false, error: 'Invalid token format' };
      }

      const [headerEncoded, payloadEncoded, signatureProvided] = parts;

      // Decode payload
      const payload = JSON.parse(Buffer.from(payloadEncoded, 'base64').toString('utf8'));

      // Check if token is blacklisted
      if (this.config.enableBlacklist && this.blacklist.has(payload.jti)) {
        this.stats.validationFailed++;
        return { valid: false, error: 'Token has been revoked' };
      }

      // Check expiry
      const now = Math.floor(Date.now() / 1000);
      if (now > payload.exp) {
        this.stats.tokensExpired++;
        this.stats.validationFailed++;
        return { valid: false, error: 'Token has expired' };
      }

      // Verify signature
      const signatureInput = `${headerEncoded}.${payloadEncoded}`;
      const expectedSignature = this.signData(signatureInput);

      if (signatureProvided !== expectedSignature) {
        this.stats.validationFailed++;
        return { valid: false, error: 'Signature verification failed' };
      }

      this.stats.tokensValidated++;

      // Check if rotation needed
      const timeToExpiry = payload.exp - now;
      const shouldRotate = this.config.enableRotation && 
                          timeToExpiry <= this.config.rotationThreshold;

      return {
        valid: true,
        payload: payload,
        shouldRotate: shouldRotate,
        expiresIn: timeToExpiry
      };
    } catch (error) {
      this.stats.validationFailed++;
      return { valid: false, error: error.message };
    }
  }

  /**
   * Rotate token (issue new token)
   */
  rotateToken(oldToken, payload = null, options = {}) {
    try {
      // Validate old token
      const validation = this.validateToken(oldToken);
      if (!validation.valid) {
        return { success: false, error: 'Cannot rotate invalid token' };
      }

      // Extract payload from old token if not provided
      const newPayload = payload || validation.payload;

      // Extract jti to mark old token as rotated
      const oldTokenId = validation.payload.jti;
      if (this.tokenStore.has(oldTokenId)) {
        this.tokenStore.get(oldTokenId).rotated = true;
      }

      // Generate new token
      const newTokenResult = this.generateToken(newPayload, options);

      this.stats.tokensRotated++;

      return {
        success: true,
        oldToken: oldToken,
        newToken: newTokenResult.token,
        message: 'Token rotated successfully'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId, options = {}) {
    try {
      const refreshTokenId = crypto.randomBytes(16).toString('hex');
      const issuedAt = Math.floor(Date.now() / 1000);
      const expiresAt = issuedAt + (options.expiry || this.config.refreshTokenExpiry);

      const refreshTokenData = {
        userId: userId,
        jti: refreshTokenId,
        iat: issuedAt,
        exp: expiresAt,
        version: this.getTokenVersion(userId)
      };

      // Sign refresh token
      const signatureInput = this.base64urlEncode(refreshTokenData);
      const signature = this.signData(signatureInput);
      const refreshToken = `${signatureInput}.${signature}`;

      // Store refresh token
      this.refreshTokenStore.set(refreshTokenId, {
        token: refreshToken,
        data: refreshTokenData,
        issuedAt: issuedAt,
        expiresAt: expiresAt,
        used: false
      });

      this.stats.refreshTokensIssued++;

      return {
        success: true,
        refreshToken: refreshToken,
        expiresIn: this.config.refreshTokenExpiry
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate refresh token
   */
  validateRefreshToken(refreshToken) {
    try {
      const parts = refreshToken.split('.');
      if (parts.length !== 2) {
        return { valid: false, error: 'Invalid refresh token format' };
      }

      const [dataEncoded, signatureProvided] = parts;
      const data = JSON.parse(Buffer.from(dataEncoded, 'base64').toString('utf8'));

      // Verify signature
      const expectedSignature = this.signData(dataEncoded);
      if (signatureProvided !== expectedSignature) {
        return { valid: false, error: 'Refresh token signature verification failed' };
      }

      // Check expiry
      const now = Math.floor(Date.now() / 1000);
      if (now > data.exp) {
        return { valid: false, error: 'Refresh token has expired' };
      }

      return {
        valid: true,
        data: data
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Revoke/blacklist token
   */
  revokeToken(token) {
    try {
      const validation = this.validateToken(token);
      if (!validation.valid) {
        return { success: false, error: 'Cannot revoke invalid token' };
      }

      const tokenId = validation.payload.jti;
      this.blacklist.add(tokenId);
      this.stats.tokensRevoked++;

      return {
        success: true,
        message: 'Token revoked successfully',
        tokenId: tokenId
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get token version for user
   */
  getTokenVersion(userId) {
    if (!this.config.versionTracking) return 1;
    return this.tokenVersions.get(userId) || 1;
  }

  /**
   * Increment token version (invalidates all previous tokens)
   */
  incrementTokenVersion(userId) {
    const currentVersion = this.getTokenVersion(userId);
    this.tokenVersions.set(userId, currentVersion + 1);
    return currentVersion + 1;
  }

  /**
   * Sign data with secret
   */
  signData(data) {
    const hmac = crypto.createHmac('sha256', this.config.secretKey);
    hmac.update(data);
    return hmac.digest('base64url');
  }

  /**
   * Base64URL encode
   */
  base64urlEncode(data) {
    return Buffer.from(JSON.stringify(data)).toString('base64url');
  }

  /**
   * Get token info
   */
  getTokenInfo(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { error: 'Invalid token format' };
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      const now = Math.floor(Date.now() / 1000);

      return {
        payload: payload,
        issuedAt: new Date(payload.iat * 1000),
        expiresAt: new Date(payload.exp * 1000),
        expiresIn: payload.exp - now,
        expired: now > payload.exp
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get JWT statistics
   */
  getStats() {
    return {
      ...this.stats,
      blacklistedTokens: this.blacklist.size,
      activeTokens: this.tokenStore.size,
      refreshTokens: this.refreshTokenStore.size,
      userVersions: this.tokenVersions.size
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      tokensGenerated: 0,
      tokensValidated: 0,
      tokensExpired: 0,
      tokensRevoked: 0,
      tokensRotated: 0,
      refreshTokensIssued: 0,
      validationFailed: 0
    };
  }
}

module.exports = JWTPolicy;