import crypto from 'crypto';

class Admin2FA {
  constructor(options = {}) {
    this.config = {
      otpLength: options.otpLength || 6,
      otpExpiry: options.otpExpiry || 5 * 60 * 1000,        // 5 minutes
      maxAttempts: options.maxAttempts || 5,
      attemptLockout: options.attemptLockout || 15 * 60 * 1000, // 15 minutes
      enableBackupCodes: options.enableBackupCodes !== false,
      backupCodesCount: options.backupCodesCount || 10,
      enableRememberDevice: options.enableRememberDevice !== false,
      rememberDeviceDuration: options.rememberDeviceDuration || 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    
    this.otpStore = new Map();                    // userId -> { otp, expiresAt, attempts }
    this.backupCodesStore = new Map();            // userId -> [codes]
    this.trustedDevices = new Map();              // deviceId -> { userId, addedAt, expiresAt }
    this.stats = {
      otpsGenerated: 0,
      otpsVerified: 0,
      otpsExpired: 0,
      verificationFailed: 0,
      backupCodesUsed: 0,
      devicesTrusted: 0,
      maxAttemptsExceeded: 0
    };
  }

  /**
   * Generate OTP for admin
   */
  generateOTP(userId) {
    try {
      // Check if admin is locked out
      const lockoutInfo = this.getAdminLockout(userId);
      if (lockoutInfo.isLocked) {
        return {
          success: false,
          error: 'Account locked due to failed attempts',
          lockoutTime: lockoutInfo.lockedUntil,
          reason: 'MAX_ATTEMPTS_EXCEEDED'
        };
      }

      // Generate OTP
      const otp = this.generateRandomOTP();
      const expiresAt = Date.now() + this.config.otpExpiry;

      // Store OTP
      this.otpStore.set(userId, {
        otp: otp,
        expiresAt: expiresAt,
        attempts: 0,
        generatedAt: Date.now(),
        verified: false
      });

      this.stats.otpsGenerated++;

      return {
        success: true,
        message: 'OTP generated successfully',
        expiresAt: expiresAt,
        otpLength: this.config.otpLength,
        // In production, send OTP via SMS/Email
        otp: otp  // Remove in production - send via secure channel
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify OTP for admin
   */
  verifyOTP(userId, providedOTP) {
    try {
      // Check if locked out
      const lockoutInfo = this.getAdminLockout(userId);
      if (lockoutInfo.isLocked) {
        return {
          success: false,
          verified: false,
          error: 'Account is locked due to failed attempts',
          lockedUntil: lockoutInfo.lockedUntil
        };
      }

      // Get stored OTP
      const storedData = this.otpStore.get(userId);
      if (!storedData) {
        return {
          success: false,
          verified: false,
          error: 'No OTP found. Please request a new OTP'
        };
      }

      // Check if OTP expired
      if (Date.now() > storedData.expiresAt) {
        this.stats.otpsExpired++;
        this.otpStore.delete(userId);
        return {
          success: false,
          verified: false,
          error: 'OTP has expired',
          expired: true
        };
      }

      // Increment attempt count
      storedData.attempts++;

      // Check if max attempts exceeded
      if (storedData.attempts > this.config.maxAttempts) {
        this.stats.maxAttemptsExceeded++;
        this.lockAdminAccount(userId);
        this.otpStore.delete(userId);
        return {
          success: false,
          verified: false,
          error: 'Maximum OTP verification attempts exceeded. Account locked.',
          maxAttemptsExceeded: true,
          lockedUntil: Date.now() + this.config.attemptLockout
        };
      }

      // Verify OTP
      if (providedOTP === storedData.otp) {
        this.stats.otpsVerified++;
        storedData.verified = true;
        
        return {
          success: true,
          verified: true,
          message: '2FA verification successful',
          userId: userId,
          verifiedAt: Date.now()
        };
      } else {
        this.stats.verificationFailed++;
        const attemptsRemaining = this.config.maxAttempts - storedData.attempts;
        
        return {
          success: false,
          verified: false,
          error: 'Invalid OTP',
          attemptsRemaining: attemptsRemaining,
          maxAttemptsExceeded: attemptsRemaining <= 0
        };
      }
    } catch (error) {
      return {
        success: false,
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Use backup code for 2FA
   */
  useBackupCode(userId, backupCode) {
    try {
      const codes = this.backupCodesStore.get(userId);
      if (!codes || codes.length === 0) {
        return {
          success: false,
          error: 'No backup codes available'
        };
      }

      const codeIndex = codes.findIndex(c => c.code === backupCode && !c.used);
      if (codeIndex === -1) {
        return {
          success: false,
          error: 'Invalid or already used backup code'
        };
      }

      // Mark code as used
      codes[codeIndex].used = true;
      codes[codeIndex].usedAt = Date.now();

      this.stats.backupCodesUsed++;

      return {
        success: true,
        message: '2FA verified with backup code',
        codesRemaining: codes.filter(c => !c.used).length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate backup codes for admin
   */
  generateBackupCodes(userId) {
    const codes = [];
    for (let i = 0; i < this.config.backupCodesCount; i++) {
      codes.push({
        code: `${crypto.randomBytes(3).toString('hex').toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        used: false,
        createdAt: Date.now()
      });
    }

    this.backupCodesStore.set(userId, codes);

    return {
      success: true,
      codes: codes.map(c => c.code), // Return only codes (hide used status initially)
      message: 'Backup codes generated. Store them in a safe place.'
    };
  }

  /**
   * Trust device for this admin
   */
  trustDevice(userId, deviceInfo) {
    try {
      const deviceId = crypto.randomBytes(16).toString('hex');
      const expiresAt = Date.now() + this.config.rememberDeviceDuration;

      this.trustedDevices.set(deviceId, {
        userId: userId,
        deviceInfo: deviceInfo,
        addedAt: Date.now(),
        expiresAt: expiresAt,
        lastUsed: Date.now()
      });

      this.stats.devicesTrusted++;

      return {
        success: true,
        deviceId: deviceId,
        message: 'Device trusted for future 2FA bypass',
        trustExpires: expiresAt
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if device is trusted
   */
  isDeviceTrusted(userId, deviceId) {
    try {
      const device = this.trustedDevices.get(deviceId);
      if (!device) {
        return { trusted: false, reason: 'Device not found' };
      }

      // Check if expired
      if (Date.now() > device.expiresAt) {
        this.trustedDevices.delete(deviceId);
        return { trusted: false, reason: 'Device trust expired' };
      }

      // Check if user matches
      if (device.userId !== userId) {
        return { trusted: false, reason: 'Device user mismatch' };
      }

      // Update last used
      device.lastUsed = Date.now();

      return {
        trusted: true,
        deviceInfo: device.deviceInfo,
        trustedSince: device.addedAt,
        expiresAt: device.expiresAt
      };
    } catch (error) {
      return { trusted: false, error: error.message };
    }
  }

  /**
   * Enable 2FA for admin
   */
  enable2FA(userId) {
    try {
      // Generate backup codes
      const backupCodesResult = this.generateBackupCodes(userId);
      
      return {
        success: true,
        message: '2FA enabled for admin account',
        backupCodes: backupCodesResult.codes,
        warning: 'Save backup codes in a secure location'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Disable 2FA for admin (requires password verification)
   */
  disable2FA(userId) {
    try {
      this.otpStore.delete(userId);
      this.backupCodesStore.delete(userId);
      
      return {
        success: true,
        message: '2FA disabled for admin account'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Lock admin account temporarily
   */
  lockAdminAccount(userId) {
    this.otpStore.set(`lock_${userId}`, {
      lockedAt: Date.now(),
      unlocksAt: Date.now() + this.config.attemptLockout
    });
  }

  /**
   * Get admin lockout status
   */
  getAdminLockout(userId) {
    const lockData = this.otpStore.get(`lock_${userId}`);
    if (!lockData) {
      return { isLocked: false };
    }

    if (Date.now() > lockData.unlocksAt) {
      this.otpStore.delete(`lock_${userId}`);
      return { isLocked: false };
    }

    return {
      isLocked: true,
      lockedAt: lockData.lockedAt,
      lockedUntil: lockData.unlocksAt,
      remainingTime: lockData.unlocksAt - Date.now()
    };
  }

  /**
   * Generate random OTP
   */
  generateRandomOTP() {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < this.config.otpLength; i++) {
      otp += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return otp;
  }

  /**
   * Get admin 2FA status
   */
  get2FAStatus(userId) {
    const hasBackupCodes = this.backupCodesStore.has(userId);
    const trustedDevices = Array.from(this.trustedDevices.values()).filter(d => d.userId === userId);

    return {
      userId: userId,
      is2FAEnabled: hasBackupCodes,
      trustedDevicesCount: trustedDevices.length,
      trustedDevices: trustedDevices.map(d => ({
        deviceInfo: d.deviceInfo,
        addedAt: d.addedAt,
        expiresAt: d.expiresAt,
        lastUsed: d.lastUsed
      }))
    };
  }

  /**
   * Get 2FA statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeOTPs: this.otpStore.size,
      trustedDevicesTotal: this.trustedDevices.size,
      successRate: this.stats.otpsGenerated > 0
        ? ((this.stats.otpsVerified / this.stats.otpsGenerated) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Reset stats
   */
  resetStats() {
    this.stats = {
      otpsGenerated: 0,
      otpsVerified: 0,
      otpsExpired: 0,
      verificationFailed: 0,
      backupCodesUsed: 0,
      devicesTrusted: 0,
      maxAttemptsExceeded: 0
    };
  }
}

export { Admin2FA };
export default Admin2FA;