class AdminAuth {
  constructor(options = {}) {
    this.activeSessions = new Map();
    this.tokenBlacklist = new Set();
    this.stats = {
      loginAttempts: 0,
      successfulLogins: 0,
      failedLogins: 0,
      tokenValidations: 0,
      invalidTokens: 0,
      sessionValidations: 0,
      invalidSessions: 0
    };
    this.config = {
      tokenExpiry: options.tokenExpiry || 3600000, // 1 hour
      sessionExpiry: options.sessionExpiry || 86400000, // 24 hours
      maxFailedAttempts: options.maxFailedAttempts || 5,
      lockoutDuration: options.lockoutDuration || 900000 // 15 minutes
    };
  }

  /**
   * Authenticate admin user
   */
  loginAdmin(credentials = {}) {
    try {
      this.stats.loginAttempts++;

      // Validate credentials
      if (!credentials.username || !credentials.password) {
        this.stats.failedLogins++;
        return {
          success: false,
          error: 'Username and password are required'
        };
      }

      // Check if admin account exists and is active
      if (!this.isValidAdminAccount(credentials.username)) {
        this.stats.failedLogins++;
        return {
          success: false,
          error: 'Invalid admin account'
        };
      }

      // Verify password
      if (!this.verifyPassword(credentials.username, credentials.password)) {
        this.stats.failedLogins++;
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Check account status
      const accountStatus = this.getAdminAccountStatus(credentials.username);
      if (accountStatus.status !== 'active') {
        this.stats.failedLogins++;
        return {
          success: false,
          error: `Admin account is ${accountStatus.status}`
        };
      }

      // Create session and token
      const sessionId = this.generateSessionId();
      const token = this.generateAdminToken(credentials.username, sessionId);

      const session = {
        sessionId: sessionId,
        username: credentials.username,
        token: token,
        loginTime: new Date(),
        expiryTime: new Date(Date.now() + this.config.sessionExpiry),
        ipAddress: credentials.ipAddress || 'unknown',
        userAgent: credentials.userAgent || 'unknown',
        isActive: true,
        lastActivityTime: new Date()
      };

      this.activeSessions.set(sessionId, session);
      this.stats.successfulLogins++;

      return {
        success: true,
        sessionId: sessionId,
        token: token,
        expiryTime: session.expiryTime,
        message: `Admin ${credentials.username} logged in successfully`
      };

    } catch (error) {
      this.stats.failedLogins++;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if admin is logged in
   */
  isAdminLoggedIn(sessionId) {
    if (!sessionId || !this.activeSessions.has(sessionId)) {
      return false;
    }

    const session = this.activeSessions.get(sessionId);
    
    // Check if session is active
    if (!session.isActive) {
      return false;
    }

    // Check if session has expired
    if (new Date() > session.expiryTime) {
      this.activeSessions.delete(sessionId);
      return false;
    }

    return true;
  }

  /**
   * Validate admin session
   */
  validateAdminSession(sessionId) {
    this.stats.sessionValidations++;

    if (!sessionId) {
      this.stats.invalidSessions++;
      return {
        valid: false,
        error: 'Session ID is required'
      };
    }

    if (!this.activeSessions.has(sessionId)) {
      this.stats.invalidSessions++;
      return {
        valid: false,
        error: 'Session not found'
      };
    }

    const session = this.activeSessions.get(sessionId);

    // Check if session is active
    if (!session.isActive) {
      this.stats.invalidSessions++;
      return {
        valid: false,
        error: 'Session is inactive'
      };
    }

    // Check if session has expired
    if (new Date() > session.expiryTime) {
      session.isActive = false;
      this.activeSessions.delete(sessionId);
      this.stats.invalidSessions++;
      return {
        valid: false,
        error: 'Session has expired'
      };
    }

    // Update last activity time
    session.lastActivityTime = new Date();

    return {
      valid: true,
      sessionId: sessionId,
      username: session.username,
      loginTime: session.loginTime,
      expiryTime: session.expiryTime
    };
  }

  /**
   * Validate admin token
   */
  validateAdminToken(token) {
    this.stats.tokenValidations++;

    if (!token) {
      this.stats.invalidTokens++;
      return {
        valid: false,
        error: 'Token is required'
      };
    }

    // Check if token is blacklisted
    if (this.tokenBlacklist.has(token)) {
      this.stats.invalidTokens++;
      return {
        valid: false,
        error: 'Token has been revoked'
      };
    }

    // Validate token format (basic JWT-like validation)
    const parts = token.split('.');
    if (parts.length !== 3) {
      this.stats.invalidTokens++;
      return {
        valid: false,
        error: 'Invalid token format'
      };
    }

    // Decode token payload
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      // Check token expiry
      if (payload.exp && new Date().getTime() > payload.exp) {
        this.stats.invalidTokens++;
        return {
          valid: false,
          error: 'Token has expired'
        };
      }

      return {
        valid: true,
        token: token,
        username: payload.username,
        sessionId: payload.sessionId,
        issuedAt: new Date(payload.iat),
        expiresAt: new Date(payload.exp)
      };

    } catch (error) {
      this.stats.invalidTokens++;
      return {
        valid: false,
        error: 'Invalid token'
      };
    }
  }

  /**
   * Check admin account status
   */
  getAdminAccountStatus(username) {
    // Mock implementation - in production, query database
    return {
      username: username,
      status: 'active', // active, suspended, disabled, locked
      createdAt: new Date('2024-01-01'),
      lastLogin: new Date(),
      loginAttempts: 0,
      isLocked: false,
      requiresMFA: true
    };
  }

  /**
   * Check if valid admin account
   */
  isValidAdminAccount(username) {
    // Mock implementation - in production, query database
    const validAdmins = ['admin@system.com', 'superadmin@system.com'];
    return validAdmins.includes(username);
  }

  /**
   * Verify admin password
   */
  verifyPassword(username, password) {
    // Mock implementation - in production, use bcrypt or similar
    // This is a security risk - never do this in production
    return password.length >= 12; // Basic validation
  }

  /**
   * Generate admin session ID
   */
  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `admin_session_${timestamp}_${random}`;
  }

  /**
   * Generate admin token
   */
  generateAdminToken(username, sessionId) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const now = Date.now();
    const payload = Buffer.from(JSON.stringify({
      username: username,
      sessionId: sessionId,
      iat: now,
      exp: now + this.config.tokenExpiry,
      isAdmin: true
    })).toString('base64');
    const signature = Buffer.from(`signature_${Date.now()}`).toString('base64');

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Logout admin
   */
  logoutAdmin(sessionId) {
    if (!this.activeSessions.has(sessionId)) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    const session = this.activeSessions.get(sessionId);
    this.tokenBlacklist.add(session.token);
    this.activeSessions.delete(sessionId);

    return {
      success: true,
      message: `Admin ${session.username} logged out successfully`
    };
  }

  /**
   * Force logout all sessions for admin
   */
  forceLogoutAdminAllSessions(username) {
    const sessionsToRemove = [];

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.username === username) {
        this.tokenBlacklist.add(session.token);
        sessionsToRemove.push(sessionId);
      }
    }

    sessionsToRemove.forEach(sessionId => this.activeSessions.delete(sessionId));

    return {
      success: true,
      sessionsTerminated: sessionsToRemove.length,
      message: `All sessions for admin ${username} terminated`
    };
  }

  /**
   * Get active sessions
   */
  getActiveSessions() {
    return Array.from(this.activeSessions.values()).map(session => ({
      sessionId: session.sessionId,
      username: session.username,
      loginTime: session.loginTime,
      expiryTime: session.expiryTime,
      ipAddress: session.ipAddress,
      lastActivityTime: session.lastActivityTime
    }));
  }

  /**
   * Get authentication statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeSessions: this.activeSessions.size,
      blacklistedTokens: this.tokenBlacklist.size,
      successRate: this.stats.loginAttempts > 0
        ? ((this.stats.successfulLogins / this.stats.loginAttempts) * 100).toFixed(2) + '%'
        : 'N/A'
    };
  }
}

module.exports = AdminAuth;