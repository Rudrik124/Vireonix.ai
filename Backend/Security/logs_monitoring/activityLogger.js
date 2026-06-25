/**
 * Activity Logger Module
 * 
 * Purpose: Record normal user activity and platform usage.
 * 
 * Logs:
 * - User Login
 * - User Logout
 * - File Upload
 * - File Download
 * - Video Generation
 * - Image Generation
 * - Prompt Submission
 */

class ActivityLogger {
  constructor(options = {}) {
    this.logs = [];
    this.stats = {
      totalLogs: 0,
      loginCount: 0,
      logoutCount: 0,
      uploadCount: 0,
      downloadCount: 0,
      videoGenCount: 0,
      imageGenCount: 0,
      promptCount: 0
    };
    this.maxLogs = options.maxLogs || 100000;
    this.enableConsoleOutput = options.enableConsoleOutput !== false;
  }

  /**
   * Log user login
   */
  logUserLogin(userId, ipAddress, userAgent, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'USER_LOGIN',
      actionType: 'login',
      ipAddress: ipAddress,
      userAgent: userAgent,
      result: 'success',
      severity: 'info',
      module: 'auth',
      details: {
        loginMethod: metadata.loginMethod || 'password',
        mfaUsed: metadata.mfaUsed || false,
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.loginCount++;

    if (this.enableConsoleOutput) {
      console.log(`[ACTIVITY] User ${userId} logged in from ${ipAddress}`);
    }

    return logEntry;
  }

  /**
   * Log user logout
   */
  logUserLogout(userId, ipAddress, sessionDuration, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'USER_LOGOUT',
      actionType: 'logout',
      ipAddress: ipAddress,
      result: 'success',
      severity: 'info',
      module: 'auth',
      details: {
        sessionDuration: sessionDuration,
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.logoutCount++;

    if (this.enableConsoleOutput) {
      console.log(`[ACTIVITY] User ${userId} logged out`);
    }

    return logEntry;
  }

  /**
   * Log file upload
   */
  logFileUpload(userId, ipAddress, fileName, fileSize, fileType, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'FILE_UPLOAD',
      actionType: 'upload',
      ipAddress: ipAddress,
      result: 'success',
      severity: 'info',
      module: 'file_management',
      details: {
        fileName: fileName,
        fileSize: fileSize,
        fileType: fileType,
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.uploadCount++;

    if (this.enableConsoleOutput) {
      console.log(`[ACTIVITY] User ${userId} uploaded file: ${fileName} (${fileSize} bytes)`);
    }

    return logEntry;
  }

  /**
   * Log file download
   */
  logFileDownload(userId, ipAddress, fileName, fileSize, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'FILE_DOWNLOAD',
      actionType: 'download',
      ipAddress: ipAddress,
      result: 'success',
      severity: 'info',
      module: 'file_management',
      details: {
        fileName: fileName,
        fileSize: fileSize,
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.downloadCount++;

    if (this.enableConsoleOutput) {
      console.log(`[ACTIVITY] User ${userId} downloaded file: ${fileName}`);
    }

    return logEntry;
  }

  /**
   * Log video generation
   */
  logVideoGeneration(userId, ipAddress, videoId, duration, resolution, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'VIDEO_GENERATION',
      actionType: 'video_gen',
      ipAddress: ipAddress,
      result: 'success',
      severity: 'info',
      module: 'video_generation',
      details: {
        videoId: videoId,
        duration: duration,
        resolution: resolution,
        processingTime: metadata.processingTime || null,
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.videoGenCount++;

    if (this.enableConsoleOutput) {
      console.log(`[ACTIVITY] User ${userId} generated video: ${videoId} (${resolution})`);
    }

    return logEntry;
  }

  /**
   * Log image generation
   */
  logImageGeneration(userId, ipAddress, imageId, resolution, format, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'IMAGE_GENERATION',
      actionType: 'image_gen',
      ipAddress: ipAddress,
      result: 'success',
      severity: 'info',
      module: 'image_generation',
      details: {
        imageId: imageId,
        resolution: resolution,
        format: format,
        processingTime: metadata.processingTime || null,
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.imageGenCount++;

    if (this.enableConsoleOutput) {
      console.log(`[ACTIVITY] User ${userId} generated image: ${imageId} (${resolution})`);
    }

    return logEntry;
  }

  /**
   * Log prompt submission
   */
  logPromptSubmission(userId, ipAddress, promptId, promptLength, promptType, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      userId: userId,
      action: 'PROMPT_SUBMISSION',
      actionType: 'prompt_submit',
      ipAddress: ipAddress,
      result: 'success',
      severity: 'info',
      module: 'prompt_engine',
      details: {
        promptId: promptId,
        promptLength: promptLength,
        promptType: promptType,
        model: metadata.model || 'default',
        ...metadata
      }
    };

    this.addLog(logEntry);
    this.stats.promptCount++;

    if (this.enableConsoleOutput) {
      console.log(`[ACTIVITY] User ${userId} submitted prompt: ${promptId}`);
    }

    return logEntry;
  }

  /**
   * Add log entry
   */
  addLog(logEntry) {
    // Ensure log entry has required fields
    if (!logEntry.timestamp || !logEntry.userId || !logEntry.action) {
      throw new Error('Log entry missing required fields: timestamp, userId, action');
    }

    this.logs.push(logEntry);
    this.stats.totalLogs++;

    // Enforce max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Get logs by user
   */
  getLogsByUser(userId, options = {}) {
    let userLogs = this.logs.filter(log => log.userId === userId);

    // Filter by action type
    if (options.actionType) {
      userLogs = userLogs.filter(log => log.actionType === options.actionType);
    }

    // Filter by date range
    if (options.startDate && options.endDate) {
      userLogs = userLogs.filter(log =>
        log.timestamp >= options.startDate && log.timestamp <= options.endDate
      );
    }

    // Sort by timestamp (newest first)
    userLogs.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    const limit = options.limit || 100;
    userLogs = userLogs.slice(0, limit);

    return {
      userId: userId,
      total: userLogs.length,
      logs: userLogs
    };
  }

  /**
   * Get logs by action
   */
  getLogsByAction(action, options = {}) {
    let actionLogs = this.logs.filter(log => log.action === action);

    // Filter by user
    if (options.userId) {
      actionLogs = actionLogs.filter(log => log.userId === options.userId);
    }

    // Filter by date range
    if (options.startDate && options.endDate) {
      actionLogs = actionLogs.filter(log =>
        log.timestamp >= options.startDate && log.timestamp <= options.endDate
      );
    }

    // Sort by timestamp (newest first)
    actionLogs.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    const limit = options.limit || 100;
    actionLogs = actionLogs.slice(0, limit);

    return {
      action: action,
      total: actionLogs.length,
      logs: actionLogs
    };
  }

  /**
   * Get activity statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalActivities: this.logs.length,
      averageLogsPerUser: this.stats.totalLogs > 0 ? (this.stats.totalLogs / Object.keys(
        this.logs.reduce((acc, log) => ({ ...acc, [log.userId]: true }), {})
      ).length).toFixed(2) : 0
    };
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    return { success: true, message: 'All activity logs cleared' };
  }
}

module.exports = ActivityLogger;