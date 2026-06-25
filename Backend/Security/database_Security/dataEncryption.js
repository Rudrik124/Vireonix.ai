/**
 * Data Encryption Module
 * 
 * Purpose: Protect sensitive information.
 * 
 * Encrypts:
 * - API Tokens
 * - Private User Information
 * - Sensitive Configuration Data
 * 
 * Ensures data remains unreadable if exposed.
 */

const crypto = require('crypto');

class DataEncryption {
  constructor(options = {}) {
    this.encryptionKey = options.encryptionKey || this.getDefaultKey();
    this.algorithm = options.algorithm || 'aes-256-gcm';
    this.saltLength = options.saltLength || 16;
    this.stats = {
      encrypted: 0,
      decrypted: 0,
      encryptionFailures: 0,
      decryptionFailures: 0
    };
    this.sensitiveFields = options.sensitiveFields || this.getDefaultSensitiveFields();
  }

  /**
   * Get default encryption key (should be from env in production)
   */
  getDefaultKey() {
    return crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-insecure-key', 'salt', 32);
  }

  /**
   * Get fields that should be encrypted by default
   */
  getDefaultSensitiveFields() {
    return [
      'apiToken',
      'password',
      'apiKey',
      'privateKey',
      'secret',
      'ssn',
      'creditCard',
      'bankAccount',
      'refreshToken',
      'accessToken'
    ];
  }

  /**
   * Encrypt data
   */
  encrypt(data, options = {}) {
    try {
      if (!data) {
        return {
          encrypted: false,
          error: 'Data is required',
          value: null
        };
      }

      // Convert data to JSON string if it's an object
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);

      // Generate IV (Initialization Vector)
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Encrypt data
      let encrypted = cipher.update(dataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      this.stats.encrypted++;

      // Return encrypted data with IV and auth tag
      return {
        encrypted: true,
        value: iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted,
        algorithm: this.algorithm
      };

    } catch (error) {
      this.stats.encryptionFailures++;
      return {
        encrypted: false,
        error: error.message,
        value: null
      };
    }
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData, options = {}) {
    try {
      if (!encryptedData) {
        return {
          decrypted: false,
          error: 'Encrypted data is required',
          value: null
        };
      }

      // Parse the encrypted data format: iv:authTag:encrypted
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        return {
          decrypted: false,
          error: 'Invalid encrypted data format',
          value: null
        };
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      this.stats.decrypted++;

      // Try to parse as JSON
      try {
        const parsed = JSON.parse(decrypted);
        return {
          decrypted: true,
          value: parsed,
          isJson: true
        };
      } catch (e) {
        // Not JSON, return as string
        return {
          decrypted: true,
          value: decrypted,
          isJson: false
        };
      }

    } catch (error) {
      this.stats.decryptionFailures++;
      return {
        decrypted: false,
        error: error.message,
        value: null
      };
    }
  }

  /**
   * Encrypt object fields
   */
  encryptObject(obj = {}, fieldsToEncrypt = null) {
    if (typeof obj !== 'object' || obj === null) {
      return { encrypted: false, error: 'Object is required' };
    }

    const encrypted = { ...obj };
    const fields = fieldsToEncrypt || this.sensitiveFields;

    for (const field of fields) {
      if (field in encrypted && encrypted[field]) {
        const result = this.encrypt(encrypted[field]);
        if (result.encrypted) {
          encrypted[field] = result.value;
        }
      }
    }

    return {
      encrypted: true,
      value: encrypted
    };
  }

  /**
   * Decrypt object fields
   */
  decryptObject(obj = {}, fieldsToDecrypt = null) {
    if (typeof obj !== 'object' || obj === null) {
      return { decrypted: false, error: 'Object is required' };
    }

    const decrypted = { ...obj };
    const fields = fieldsToDecrypt || this.sensitiveFields;

    for (const field of fields) {
      if (field in decrypted && decrypted[field]) {
        const result = this.decrypt(decrypted[field]);
        if (result.decrypted) {
          decrypted[field] = result.value;
        }
      }
    }

    return {
      decrypted: true,
      value: decrypted
    };
  }

  /**
   * Hash sensitive data (one-way encryption)
   */
  hashData(data, options = {}) {
    try {
      if (!data) {
        return {
          hashed: false,
          error: 'Data is required',
          value: null
        };
      }

      const algorithm = options.algorithm || 'sha256';
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);

      const hash = crypto.createHash(algorithm);
      hash.update(dataString);

      return {
        hashed: true,
        value: hash.digest('hex'),
        algorithm: algorithm
      };

    } catch (error) {
      return {
        hashed: false,
        error: error.message,
        value: null
      };
    }
  }

  /**
   * Verify hashed data
   */
  verifyHash(data, hash, options = {}) {
    try {
      const newHash = this.hashData(data, options);
      if (!newHash.hashed) {
        return { verified: false, error: newHash.error };
      }

      return {
        verified: newHash.value === hash,
        match: newHash.value === hash
      };

    } catch (error) {
      return {
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Generate random encryption key
   */
  generateKey(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate random IV
   */
  generateIv(length = 16) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Mask sensitive data for logging
   */
  maskSensitive(data, maskChar = '*') {
    if (typeof data === 'string') {
      if (data.length <= 4) {
        return maskChar.repeat(data.length);
      }
      return data.substring(0, 2) + maskChar.repeat(data.length - 4) + data.substring(data.length - 2);
    }

    return data;
  }

  /**
   * Check if field should be encrypted
   */
  isSensitiveField(fieldName) {
    return this.sensitiveFields.some(field => 
      fieldName.toLowerCase().includes(field.toLowerCase())
    );
  }

  /**
   * Add sensitive field
   */
  addSensitiveField(fieldName) {
    if (!fieldName || this.sensitiveFields.includes(fieldName)) return false;
    this.sensitiveFields.push(fieldName);
    return true;
  }

  /**
   * Get encryption statistics
   */
  getStats() {
    return {
      ...this.stats,
      encryptionRate: this.stats.encrypted > 0
        ? ((this.stats.encrypted / (this.stats.encrypted + this.stats.encryptionFailures)) * 100).toFixed(2) + '%'
        : '0%',
      decryptionRate: this.stats.decrypted > 0
        ? ((this.stats.decrypted / (this.stats.decrypted + this.stats.decryptionFailures)) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      encrypted: 0,
      decrypted: 0,
      encryptionFailures: 0,
      decryptionFailures: 0
    };
  }
}

module.exports = DataEncryption;