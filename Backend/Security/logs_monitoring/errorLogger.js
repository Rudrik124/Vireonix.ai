/**
 * Error Logger Module
 * 
 * Purpose: Record system and application errors.
 * 
 * Logs:
 * - API Errors
 * - Database Errors
 * - Storage Errors
 * - Authentication Errors
 * - Processing Errors
 */

class ErrorLogger {
  constructor(options = {}) {
    this.logs = [];
    this.stats = {
      totalErrors: 0,
      apiErrors: 0,
      databaseErrors: 0,
      storageErrors: 0,
      authErrors: 0,
      processingErrors: 0,
      criticalErrors: 0,
      warningErrors: 0
    };
    this.maxLogs = options.maxLogs || 100000;
    this.enableConsoleOutput = options.enableConsoleOutput !== false;
    this.alertOnCritical = options.alertOnCritical !== false;
    this.errorPatterns = {};
  }

  /**
   * Log API error
   */
  logApiError(endpoint, httpStatus, errorMessage, userId, metadata = {}) {
    const severity = this.determineSeverity(httpStatus);

    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'API_ERROR',
      actionType: 'error',
      ipAddress: metadata.ipAddress || null,
      result: 'api_error',
      severity: severity,
      module: 'api',
      errorCode: httpStatus,
      details: {
        endpoint: endpoint,
        httpStatus: httpStatus,
        errorMessage: errorMessage,
        method: metadata.method || 'UNKNOWN',
        responseTime: metadata.responseTime || null,
        requestSize: metadata.requestSize || null,
        responseSize: metadata.responseSize || null,
        stackTrace: metadata.stackTrace || null,
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.apiErrors++;
    this.recordErrorPattern(endpoint, httpStatus);

    if (this.enableConsoleOutput) {
      console.log(`[ERROR] API Error on ${endpoint}: ${httpStatus} - ${errorMessage}`);
    }

    return logEntry;
  }

  /**
   * Log database error
   */
  logDatabaseError(query, errorMessage, errorCode, userId, metadata = {}) {
    const severity = this.determineSeverity(errorCode, 'db');

    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'DATABASE_ERROR',
      actionType: 'error',
      ipAddress: metadata.ipAddress || null,
      result: 'database_error',
      severity: severity,
      module: 'database',
      errorCode: errorCode,
      details: {
        query: query,
        errorMessage: errorMessage,
        database: metadata.database || null,
        table: metadata.table || null,
        operation: metadata.operation || 'unknown', // select, insert, update, delete
        connectionTime: metadata.connectionTime || null,
        executionTime: metadata.executionTime || null,
        stackTrace: metadata.stackTrace || null,
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.databaseErrors++;
    this.recordErrorPattern(`db_${errorCode}`, 'database');

    if (this.enableConsoleOutput) {
      console.log(`[ERROR] Database Error: ${errorCode} - ${errorMessage}`);
    }

    return logEntry;
  }

  /**
   * Log storage error
   */
  logStorageError(operation, filePath, errorMessage, errorCode, userId, metadata = {}) {
    const severity = this.determineSeverity(errorCode, 'storage');

    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'STORAGE_ERROR',
      actionType: 'error',
      ipAddress: metadata.ipAddress || null,
      result: 'storage_error',
      severity: severity,
      module: 'storage',
      errorCode: errorCode,
      details: {
        operation: operation, // read, write, delete, list
        filePath: filePath,
        errorMessage: errorMessage,
        storageService: metadata.storageService || 'unknown',
        fileSize: metadata.fileSize || null,
        diskSpace: metadata.diskSpace || null,
        stackTrace: metadata.stackTrace || null,
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.storageErrors++;
    this.recordErrorPattern(`storage_${operation}`, errorCode);

    if (this.enableConsoleOutput) {
      console.log(`[ERROR] Storage Error on ${operation}: ${errorCode} - ${errorMessage}`);
    }

    return logEntry;
  }

  /**
   * Log authentication error
   */
  logAuthError(authMethod, errorMessage, userId, ipAddress, metadata = {}) {
    const severity = 'warning';

    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'AUTH_ERROR',
      actionType: 'error',
      ipAddress: ipAddress,
      result: 'auth_error',
      severity: severity,
      module: 'auth',
      details: {
        authMethod: authMethod, // password, oauth, mfa, api_key
        errorMessage: errorMessage,
        attemptCount: metadata.attemptCount || 1,
        accountLocked: metadata.accountLocked || false,
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.authErrors++;
    this.recordErrorPattern(`auth_${authMethod}`, authMethod);

    if (this.enableConsoleOutput) {
      console.log(`[ERROR] Authentication Error (${authMethod}): ${errorMessage}`);
    }

    return logEntry;
  }

  /**
   * Log processing error
   */
  logProcessingError(processType, errorMessage, errorCode, userId, metadata = {}) {
    const severity = this.determineSeverity(errorCode, 'processing');

    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'PROCESSING_ERROR',
      actionType: 'error',
      ipAddress: metadata.ipAddress || null,
      result: 'processing_error',
      severity: severity,
      module: 'processing',
      errorCode: errorCode,
      details: {
        processType: processType, // video_generation, image_generation, etc.
        errorMessage: errorMessage,
        inputSize: metadata.inputSize || null,
        processingTime: metadata.processingTime || null,
        retryable: metadata.retryable !== false,
        stackTrace: metadata.stackTrace || null,
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.processingErrors++;
    this.recordErrorPattern(`processing_${processType}`, errorCode);

    if (this.enableConsoleOutput) {
      console.log(`[ERROR] Processing Error (${processType}): ${errorCode} - ${errorMessage}`);
    }

    return logEntry;
  }

  /**
   * Determine error severity
   */
  determineSeverity(errorCode, type = 'http') {
    if (type === 'http') {
      if (errorCode >= 500) return 'critical';
      if (errorCode >= 400) return 'warning';
      return 'info';
    } else if (type === 'db') {
      if (errorCode < 1000) return 'critical';
      if (errorCode < 2000) return 'warning';
      return 'info';
    } else if (type === 'storage') {
      if (errorCode === 'ENOSPC') return 'critical';
      if (errorCode === 'EACCES') return 'warning';
      return 'warning';
    } else if (type === 'processing') {
      if (errorCode < 5000) return 'critical';
      return 'warning';
    }
    return 'warning';
  }

  /**
   * Record error pattern for anomaly detection
   */
  recordErrorPattern(key, errorCode) {
    if (!this.errorPatterns[key]) {
      this.errorPatterns[key] = {
        count: 0,
        lastOccurrence: new Date(),
        firstOccurrence: new Date()
      };
    }

    this.errorPatterns[key].count++;
    this.errorPatterns[key].lastOccurrence = new Date();
  }

  /**
   * Get error patterns
   */
  getErrorPatterns(threshold = 5) {
    const patterns = {};

    Object.entries(this.errorPatterns).forEach(([key, data]) => {
      if (data.count >= threshold) {
        patterns[key] = data;
      }
    });

    return patterns;
  }

  /**
   * Add log entry
   */
  addLog(logEntry) {
    if (!logEntry.timestamp || !logEntry.action) {
      throw new Error('Log entry missing required fields');
    }

    this.logs.push(logEntry);
    if (logEntry.severity === 'critical') {
      this.stats.criticalErrors++;
    } else if (logEntry.severity === 'warning') {
      this.stats.warningErrors++;
    }
    this.stats.totalErrors++;

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Get errors by module
   */
  getErrorsByModule(module, options = {}) {
    let moduleLogs = this.logs.filter(log => log.module === module);

    if (options.startDate && options.endDate) {
      moduleLogs = moduleLogs.filter(log =>
        log.timestamp >= options.startDate && log.timestamp <= options.endDate
      );
    }

    if (options.severity) {
      moduleLogs = moduleLogs.filter(log => log.severity === options.severity);
    }

    moduleLogs.sort((a, b) => b.timestamp - a.timestamp);

    const limit = options.limit || 100;
    moduleLogs = moduleLogs.slice(0, limit);

    return {
      module: module,
      total: moduleLogs.length,
      logs: moduleLogs
    };
  }

  /**
   * Get critical errors
   */
  getCriticalErrors(options = {}) {
    let criticalLogs = this.logs.filter(log => log.severity === 'critical');

    if (options.startDate && options.endDate) {
      criticalLogs = criticalLogs.filter(log =>
        log.timestamp >= options.startDate && log.timestamp <= options.endDate
      );
    }

    criticalLogs.sort((a, b) => b.timestamp - a.timestamp);

    const limit = options.limit || 100;
    criticalLogs = criticalLogs.slice(0, limit);

    return {
      criticalCount: criticalLogs.length,
      logs: criticalLogs
    };
  }

  /**
   * Get error summary
   */
  getErrorSummary(timeWindowMinutes = 60) {
    const now = new Date();
    const timeWindow = new Date(now - timeWindowMinutes * 60000);

    const recentErrors = this.logs.filter(log => log.timestamp > timeWindow);

    const summary = {
      timeWindow: `${timeWindowMinutes} minutes`,
      total: recentErrors.length,
      byModule: {},
      bySeverity: {
        critical: 0,
        warning: 0,
        info: 0
      },
      byType: {}
    };

    recentErrors.forEach(log => {
      // By module
      if (!summary.byModule[log.module]) {
        summary.byModule[log.module] = 0;
      }
      summary.byModule[log.module]++;

      // By severity
      summary.bySeverity[log.severity]++;

      // By type
      if (!summary.byType[log.action]) {
        summary.byType[log.action] = 0;
      }
      summary.byType[log.action]++;
    });

    return summary;
  }

  /**
   * Get error statistics
   */
  getStats() {
    return {
      ...this.stats,
      criticalToWarningRatio: this.stats.warningErrors > 0
        ? ((this.stats.criticalErrors / this.stats.warningErrors) * 100).toFixed(2) + '%'
        : '0%',
      errorPatterns: Object.keys(this.errorPatterns).length,
      averageErrorsPerHour: (this.stats.totalErrors / 24).toFixed(2)
    };
  }

  /**
   * Clear all error logs
   */
  clearLogs() {
    this.logs = [];
    this.errorPatterns = {};
    return { success: true, message: 'All error logs cleared' };
  }
}

module.exports = ErrorLogger;