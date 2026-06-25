/**
 * SSL Configuration Module
 * 
 * Purpose: Ensure secure HTTPS communication and SSL/TLS encryption.
 * 
 * Responsibilities:
 * - Configure SSL certificates
 * - Enforce HTTPS
 * - Configure secure connections
 * - Prevent unencrypted traffic
 */

class SSLConfig {
  constructor(options = {}) {
    this.config = options.config || this.getDefaultConfig();
    this.certificates = options.certificates || [];
    this.stats = {
      httpsRequests: 0,
      httpRequests: 0,
      certificateErrors: 0,
      certificateValidations: 0
    };
    this.certificateLog = [];
  }

  /**
   * Get default SSL configuration
   */
  getDefaultConfig() {
    return {
      enforceHTTPS: true,
      minimumTLSVersion: '1.2',
      maximumTLSVersion: '1.3',
      autoRedirect: {
        http: 'https',
        enabled: true
      },
      hsts: {
        enabled: true,
        maxAge: 31536000, // 1 year
        includeSubdomains: true,
        preload: true
      },
      certificateTransparency: true,
      ocspStapling: true,
      certificatePinning: false,
      allowedCiphers: [
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_128_GCM_SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384'
      ],
      disabledCiphers: [
        'RC4',
        'MD5',
        'DES',
        'EXPORT',
        'NULL'
      ]
    };
  }

  /**
   * Validate incoming request protocol
   */
  validateRequestProtocol(requestData) {
    const protocol = requestData.protocol || 'http';
    const hostname = requestData.hostname || '';

    // Check if HTTPS enforcement is enabled
    if (this.config.enforceHTTPS && protocol === 'http') {
      this.stats.httpRequests++;

      if (this.config.autoRedirect.enabled) {
        return {
          valid: true,
          redirectRequired: true,
          redirectUrl: `https://${hostname}${requestData.path || ''}`,
          reason: 'HTTP requests redirected to HTTPS'
        };
      } else {
        return {
          valid: false,
          reason: 'HTTPS is required - unencrypted HTTP requests are not allowed',
          statusCode: 403
        };
      }
    }

    // HTTPS request
    if (protocol === 'https') {
      this.stats.httpsRequests++;

      // Validate certificate if provided
      if (requestData.certificate) {
        const certValidation = this.validateCertificate(requestData.certificate);

        if (!certValidation.valid) {
          this.stats.certificateErrors++;
          return {
            valid: false,
            reason: 'Invalid SSL certificate',
            error: certValidation.error,
            statusCode: 496
          };
        }

        this.stats.certificateValidations++;
      }

      return {
        valid: true,
        protocol: 'https',
        reason: 'Secure HTTPS connection'
      };
    }

    return {
      valid: true,
      protocol: protocol,
      warning: 'Unknown protocol'
    };
  }

  /**
   * Validate SSL certificate
   */
  validateCertificate(certificateData) {
    try {
      // Check certificate validity
      if (!certificateData.issuer) {
        return {
          valid: false,
          error: 'Certificate missing issuer'
        };
      }

      if (!certificateData.subject) {
        return {
          valid: false,
          error: 'Certificate missing subject'
        };
      }

      // Check certificate expiry
      const expiryDate = new Date(certificateData.expiryDate);
      if (expiryDate < new Date()) {
        return {
          valid: false,
          error: 'Certificate has expired'
        };
      }

      // Check if certificate is valid for domain
      if (certificateData.validDomains) {
        if (!certificateData.validDomains.includes(certificateData.hostname)) {
          return {
            valid: false,
            error: 'Certificate domain mismatch'
          };
        }
      }

      // Check for certificate pinning if enabled
      if (this.config.certificatePinning) {
        const pinValidation = this.validateCertificatePinning(certificateData);
        if (!pinValidation.valid) {
          return {
            valid: false,
            error: pinValidation.error
          };
        }
      }

      return {
        valid: true,
        certificate: {
          issuer: certificateData.issuer,
          subject: certificateData.subject,
          expiryDate: expiryDate,
          daysUntilExpiry: Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24))
        }
      };

    } catch (error) {
      this.stats.certificateErrors++;
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Validate certificate pinning
   */
  validateCertificatePinning(certificateData) {
    // Check if certificate hash matches pinned certificate
    const pinnedCerts = this.certificates.filter(cert => cert.pinned === true);

    if (pinnedCerts.length === 0) {
      return { valid: true }; // No pins configured
    }

    const certificateHash = certificateData.fingerprint;

    for (const pinnedCert of pinnedCerts) {
      if (pinnedCert.fingerprint === certificateHash) {
        return { valid: true };
      }
    }

    return {
      valid: false,
      error: 'Certificate not in pinned certificate list'
    };
  }

  /**
   * Generate HSTS header
   */
  generateHSTSHeader() {
    if (!this.config.hsts.enabled) {
      return null;
    }

    let header = `max-age=${this.config.hsts.maxAge}`;

    if (this.config.hsts.includeSubdomains) {
      header += '; includeSubDomains';
    }

    if (this.config.hsts.preload) {
      header += '; preload';
    }

    return header;
  }

  /**
   * Generate security headers
   */
  generateSecurityHeaders() {
    const headers = {
      'Strict-Transport-Security': this.generateHSTSHeader(),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };

    // Remove null values
    Object.keys(headers).forEach(key => {
      if (headers[key] === null) {
        delete headers[key];
      }
    });

    return headers;
  }

  /**
   * Check TLS version
   */
  checkTLSVersion(tlsVersion) {
    const minVersion = parseFloat(this.config.minimumTLSVersion);
    const maxVersion = parseFloat(this.config.maximumTLSVersion);
    const clientVersion = parseFloat(tlsVersion);

    if (clientVersion < minVersion) {
      return {
        allowed: false,
        reason: `TLS ${tlsVersion} is below minimum requirement (${this.config.minimumTLSVersion})`,
        statusCode: 426
      };
    }

    if (clientVersion > maxVersion) {
      return {
        allowed: false,
        reason: `TLS ${tlsVersion} exceeds maximum allowed (${this.config.maximumTLSVersion})`,
        statusCode: 426
      };
    }

    return {
      allowed: true,
      tlsVersion: tlsVersion
    };
  }

  /**
   * Check cipher suite
   */
  checkCipherSuite(cipherSuite) {
    // Check against disabled ciphers
    for (const disabledCipher of this.config.disabledCiphers) {
      if (cipherSuite.includes(disabledCipher)) {
        return {
          allowed: false,
          reason: `Cipher suite contains disabled cipher: ${disabledCipher}`,
          statusCode: 426
        };
      }
    }

    // Check against allowed ciphers if list is restrictive
    if (this.config.allowedCiphers.length > 0) {
      const isAllowed = this.config.allowedCiphers.some(cipher =>
        cipherSuite.includes(cipher)
      );

      if (!isAllowed) {
        return {
          allowed: false,
          reason: 'Cipher suite is not in allowed list',
          statusCode: 426
        };
      }
    }

    return {
      allowed: true,
      cipherSuite: cipherSuite
    };
  }

  /**
   * Add SSL certificate
   */
  addCertificate(certificateData) {
    const cert = {
      id: `cert_${Date.now()}`,
      domain: certificateData.domain,
      issuer: certificateData.issuer,
      expiryDate: new Date(certificateData.expiryDate),
      fingerprint: certificateData.fingerprint,
      pinned: certificateData.pinned || false,
      addedAt: new Date()
    };

    this.certificates.push(cert);

    return {
      success: true,
      certificate: cert
    };
  }

  /**
   * Get certificates
   */
  getCertificates() {
    return {
      total: this.certificates.length,
      certificates: this.certificates.map(cert => ({
        id: cert.id,
        domain: cert.domain,
        issuer: cert.issuer,
        expiryDate: cert.expiryDate,
        daysUntilExpiry: Math.floor((cert.expiryDate - new Date()) / (1000 * 60 * 60 * 24)),
        pinned: cert.pinned
      }))
    };
  }

  /**
   * Get certificates expiring soon
   */
  getCertificatesExpiringSoon(days = 30) {
    const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const expiringSoon = this.certificates.filter(cert =>
      cert.expiryDate <= cutoffDate && cert.expiryDate > new Date()
    );

    return {
      expiringWithinDays: days,
      count: expiringSoon.length,
      certificates: expiringSoon.map(cert => ({
        domain: cert.domain,
        expiryDate: cert.expiryDate,
        daysRemaining: Math.floor((cert.expiryDate - new Date()) / (1000 * 60 * 60 * 24))
      }))
    };
  }

  /**
   * Update SSL configuration
   */
  updateConfig(updates = {}) {
    this.config = { ...this.config, ...updates };

    return {
      success: true,
      config: this.config,
      message: 'SSL configuration updated'
    };
  }

  /**
   * Get SSL configuration
   */
  getConfig() {
    return {
      config: this.config,
      tlsInfo: {
        minimumVersion: this.config.minimumTLSVersion,
        maximumVersion: this.config.maximumTLSVersion,
        allowedCipherCount: this.config.allowedCiphers.length,
        disabledCipherCount: this.config.disabledCiphers.length
      }
    };
  }

  /**
   * Log certificate event
   */
  logCertificateEvent(eventType, details) {
    const logEntry = {
      timestamp: new Date(),
      eventType: eventType,
      details: details
    };

    this.certificateLog.push(logEntry);

    // Keep log manageable
    if (this.certificateLog.length > 1000) {
      this.certificateLog = this.certificateLog.slice(-1000);
    }
  }

  /**
   * Get certificate log
   */
  getCertificateLog(options = {}) {
    let log = [...this.certificateLog];

    if (options.eventType) {
      log = log.filter(entry => entry.eventType === options.eventType);
    }

    log.sort((a, b) => b.timestamp - a.timestamp);

    const limit = options.limit || 100;
    log = log.slice(0, limit);

    return {
      total: this.certificateLog.length,
      filtered: log.length,
      entries: log
    };
  }

  /**
   * Get SSL statistics
   */
  getStats() {
    const total = this.stats.httpsRequests + this.stats.httpRequests;

    return {
      ...this.stats,
      totalRequests: total,
      httpsPercentage: total > 0
        ? ((this.stats.httpsRequests / total) * 100).toFixed(2) + '%'
        : '0%',
      certificateCount: this.certificates.length,
      certificateLogSize: this.certificateLog.length
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      httpsRequests: 0,
      httpRequests: 0,
      certificateErrors: 0,
      certificateValidations: 0
    };
  }
}

module.exports = SSLConfig;