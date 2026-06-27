/**
 * Cookie Security
 * 
 * Purpose: Secure cookie settings and management
 * 
 * Features:
 * - HttpOnly flag (prevents JavaScript access)
 * - Secure flag (HTTPS only)
 * - SameSite policy (CSRF protection)
 * - Expiry management
 * - Secure serialization
 */

import crypto from "crypto";

class CookieSecurity {
  constructor(options = {}) {
    this.config = {
      // HttpOnly: prevents client-side JS from accessing cookie
      httpOnly: options.httpOnly !== false,
      
      // Secure: cookie only sent over HTTPS
      secure: options.secure !== false && (process.env.NODE_ENV === 'production' || process.env.AUTH_COOKIE_SECURE === 'true'),
      
      // SameSite: prevents CSRF attacks
      // strict: only same-site requests
      // lax: same-site + safe cross-site (GET)
      // none: allow cross-site (requires Secure)
      sameSite: options.sameSite || process.env.AUTH_COOKIE_SAMESITE || 'strict',
      
      // Path: which URLs receive the cookie
      path: options.path || '/',
      
      // Domain: which domains can access
      domain: options.domain || undefined,
      
      // Max-Age: cookie lifetime in seconds
      maxAge: options.maxAge || Number(process.env.AUTH_COOKIE_MAX_AGE || 86400), // 24 hours
      
      // Priority: browser preference (high/medium/low)
      priority: options.priority || 'high',
      
      // Encoding: how to encode cookie value
      encoding: options.encoding || 'base64',
      
      // Rotation: enable cookie rotation
      enableRotation: options.enableRotation !== false,
      
      // Signature: sign cookies to prevent tampering
      enableSignature: options.enableSignature !== false,
      
      // Secret key for signing
      secretKey: options.secretKey || process.env.AUTH_COOKIE_SECRET || process.env.JWT_SECRET || 'default-secret-key'
    };
    
    this.stats = {
      cookiesSet: 0,
      cookiesCleared: 0,
      cookiesRotated: 0,
      signatureVerificationFailed: 0,
      signatureVerificationSuccess: 0
    };
  }

  /**
   * Generate secure cookie options
   */
  generateCookieOptions(customOptions = {}) {
    return {
      httpOnly: customOptions.httpOnly !== undefined ? customOptions.httpOnly : this.config.httpOnly,
      secure: customOptions.secure !== undefined ? customOptions.secure : this.config.secure,
      sameSite: customOptions.sameSite || this.config.sameSite,
      path: customOptions.path || this.config.path,
      domain: customOptions.domain || this.config.domain,
      maxAge: customOptions.maxAge || this.config.maxAge,
      priority: customOptions.priority || this.config.priority
    };
  }

  /**
   * Set secure cookie
   */
  setCookie(res, name, value, options = {}) {
    try {
      // Sign the value if enabled
      let cookieValue = value;
      if (this.config.enableSignature) {
        cookieValue = this.signCookie(value);
      }

      // Encode if enabled
      if (this.config.encoding) {
        cookieValue = this.encodeCookie(cookieValue);
      }

      // Set cookie with secure options
      const cookieOptions = this.generateCookieOptions(options);
      res.cookie(name, cookieValue, cookieOptions);

      this.stats.cookiesSet++;

      return {
        success: true,
        message: `Cookie '${name}' set securely`,
        options: cookieOptions
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get and verify secure cookie
   */
  getCookie(req, name) {
    try {
      let cookieValue = req.cookies[name];
      
      if (!cookieValue) {
        return { success: false, error: 'Cookie not found' };
      }

      // Decode if enabled
      if (this.config.encoding) {
        cookieValue = this.decodeCookie(cookieValue);
      }

      // Verify signature if enabled
      if (this.config.enableSignature) {
        const verifyResult = this.verifyCookieSignature(cookieValue);
        if (!verifyResult.valid) {
          this.stats.signatureVerificationFailed++;
          return { success: false, error: 'Cookie signature verification failed' };
        }
        this.stats.signatureVerificationSuccess++;
        cookieValue = verifyResult.value;
      }

      return {
        success: true,
        value: cookieValue
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear cookie securely
   */
  clearCookie(res, name) {
    try {
      res.clearCookie(name, {
        path: this.config.path,
        httpOnly: this.config.httpOnly,
        secure: this.config.secure,
        sameSite: this.config.sameSite
      });

      this.stats.cookiesCleared++;

      return {
        success: true,
        message: `Cookie '${name}' cleared`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Rotate cookie (for security)
   */
  rotateCookie(res, oldCookieName, newCookieName, newValue, options = {}) {
    try {
      // Clear old cookie
      this.clearCookie(res, oldCookieName);

      // Set new cookie
      this.setCookie(res, newCookieName, newValue, options);

      this.stats.cookiesRotated++;

      return {
        success: true,
        message: 'Cookie rotated successfully',
        oldName: oldCookieName,
        newName: newCookieName
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign cookie value
   */
  signCookie(value) {
    const hmac = crypto.createHmac('sha256', this.config.secretKey);
    hmac.update(value);
    const signature = hmac.digest('hex');
    return `${value}.${signature}`;
  }

  /**
   * Verify cookie signature
   */
  verifyCookieSignature(signedValue) {
    try {
      const parts = signedValue.split('.');
      if (parts.length !== 2) {
        return { valid: false, error: 'Invalid signature format' };
      }

      const [value, signature] = parts;
      const expectedSignature = this.signCookie(value).split('.')[1];

      if (signature === expectedSignature) {
        return { valid: true, value: value };
      } else {
        return { valid: false, error: 'Signature mismatch' };
      }
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Encode cookie value
   */
  encodeCookie(value) {
    if (this.config.encoding === 'base64') {
      return Buffer.from(value).toString('base64');
    }
    return value;
  }

  /**
   * Decode cookie value
   */
  decodeCookie(value) {
    if (this.config.encoding === 'base64') {
      return Buffer.from(value, 'base64').toString('utf8');
    }
    return value;
  }

  /**
   * Get cookie security report
   */
  getSecurityReport() {
    return {
      httpOnly: this.config.httpOnly,
      secure: this.config.secure,
      sameSite: this.config.sameSite,
      path: this.config.path,
      domain: this.config.domain,
      maxAge: this.config.maxAge,
      signatureEnabled: this.config.enableSignature,
      encodingEnabled: this.config.encoding,
      rotationEnabled: this.config.enableRotation
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      securityConfig: this.getSecurityReport()
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      cookiesSet: 0,
      cookiesCleared: 0,
      cookiesRotated: 0,
      signatureVerificationFailed: 0,
      signatureVerificationSuccess: 0
    };
  }
}

export { CookieSecurity };
export default CookieSecurity;