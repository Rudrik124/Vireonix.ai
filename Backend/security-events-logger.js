/**
 * Security Event Logging Utility
 *
 * Provides a reusable function to log security events to Supabase.
 * Used across all backend modules for comprehensive security and audit logging.
 *
 * Usage:
 *   import { logSecurityEvent } from './security-events-logger.js';
 *
 *   await logSecurityEvent({
 *     userId: 'user-uuid',
 *     category: 'AUTH',
 *     action: 'LOGIN_SUCCESS',
 *     severity: 'INFO',
 *     eventMessage: 'User successfully logged in',
 *     eventSource: 'server.js',
 *     ipAddress: req.ip,
 *     userAgent: req.headers['user-agent'],
 *     metadata: { loginMethod: 'email', lastLogin: '2026-06-13' }
 *   });
 */

let supabaseClient = null;

/**
 * Initialize the Supabase client for security event logging
 * @param {Object} client - Supabase client instance
 */
export const initSecurityEventsLogger = (client) => {
  supabaseClient = client;
};

/**
 * Get the Supabase client
 */
const getSupabaseClient = () => {
  if (!supabaseClient) {
    throw new Error('Security events logger not initialized. Call initSecurityEventsLogger() first.');
  }
  return supabaseClient;
};

/**
 * Log a security event to the security_events table
 *
 * @param {Object} options - Event details
 * @param {string} options.userId - UUID of the user (required for most events)
 * @param {string} options.category - Event category (AUTH, PROMPT, FILE_UPLOAD, RATE_LIMIT, API, ADMIN, AI_COST, SECURITY_ALERT)
 * @param {string} options.action - Specific action (e.g., LOGIN_SUCCESS, PROMPT_SUBMITTED)
 * @param {string} [options.severity='INFO'] - Severity level (INFO, WARNING, CRITICAL)
 * @param {string} [options.eventMessage] - Human-readable event description
 * @param {string} [options.eventSource] - Source module (e.g., 'server.js', 'developer-portal-api.js')
 * @param {string} [options.ipAddress] - Client IP address
 * @param {string} [options.userAgent] - User agent string
 * @param {string} [options.requestId] - Request tracking ID
 * @param {string} [options.resourceType] - Type of affected resource (video, file, prompt, user)
 * @param {string} [options.resourceId] - ID of affected resource
 * @param {string} [options.actorRole] - Role of user performing action
 * @param {string} [options.affectedUserId] - UUID of user being affected (for admin actions)
 * @param {Object} [options.metadata] - Additional context data
 * @param {number} [options.responseCode] - HTTP response code if applicable
 * @param {string} [options.status='logged'] - Event status (logged, acknowledged, resolved, escalated)
 *
 * @returns {Promise<Object>} Inserted security event record
 */
export const logSecurityEvent = async (options = {}) => {
  try {
    const {
      userId = null,
      category,
      action,
      severity = 'INFO',
      eventMessage = '',
      eventSource = '',
      ipAddress = null,
      userAgent = null,
      requestId = null,
      resourceType = null,
      resourceId = null,
      actorRole = null,
      affectedUserId = null,
      metadata = null,
      responseCode = null,
      status = 'logged',
    } = options;

    // Validate required fields
    if (!category) {
      console.error('Security event logging: category is required');
      return null;
    }

    if (!action) {
      console.error('Security event logging: action is required');
      return null;
    }

    // Build the event record
    const eventRecord = {
      user_id: userId,
      category,
      action,
      severity,
      event_message: eventMessage,
      event_source: eventSource,
      ip_address: ipAddress,
      user_agent: userAgent,
      request_id: requestId,
      resource_type: resourceType,
      resource_id: resourceId,
      actor_role: actorRole,
      affected_user_id: affectedUserId,
      metadata: metadata ? (typeof metadata === 'string' ? JSON.parse(metadata) : metadata) : null,
      response_code: responseCode,
      status,
    };

    // Insert into security_events table
    const { data, error } = await getSupabaseClient()
      .from('security_events')
      .insert([eventRecord])
      .select()
      .single();

    if (error) {
      console.error('Failed to log security event:', error.message);
      return null;
    }

    // Log to console for immediate visibility (optional)
    if (severity === 'CRITICAL') {
      console.warn(`🚨 [SECURITY] ${action}: ${eventMessage}`);
    } else if (severity === 'WARNING') {
      console.warn(`⚠️ [SECURITY] ${action}: ${eventMessage}`);
    } else {
      console.log(`✓ [SECURITY] ${action}: ${eventMessage}`);
    }

    return data;
  } catch (err) {
    console.error('Error logging security event:', err);
    return null;
  }
};

/**
 * Log multiple security events in batch
 *
 * @param {Array<Object>} events - Array of event options (same structure as logSecurityEvent)
 * @returns {Promise<Array>} Array of inserted records
 */
export const logSecurityEventsBatch = async (events = []) => {
  try {
    if (!events.length) return [];

    // Build records
    const records = events.map((options) => {
      const {
        userId = null,
        category,
        action,
        severity = 'INFO',
        eventMessage = '',
        eventSource = '',
        ipAddress = null,
        userAgent = null,
        requestId = null,
        resourceType = null,
        resourceId = null,
        actorRole = null,
        affectedUserId = null,
        metadata = null,
        responseCode = null,
        status = 'logged',
      } = options;

      return {
        user_id: userId,
        category,
        action,
        severity,
        event_message: eventMessage,
        event_source: eventSource,
        ip_address: ipAddress,
        user_agent: userAgent,
        request_id: requestId,
        resource_type: resourceType,
        resource_id: resourceId,
        actor_role: actorRole,
        affected_user_id: affectedUserId,
        metadata: metadata ? (typeof metadata === 'string' ? JSON.parse(metadata) : metadata) : null,
        response_code: responseCode,
        status,
      };
    });

    // Batch insert
    const { data, error } = await getSupabaseClient()
      .from('security_events')
      .insert(records)
      .select();

    if (error) {
      console.error('Failed to batch log security events:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error batch logging security events:', err);
    return [];
  }
};

/**
 * Retrieve security events with optional filters
 *
 * @param {Object} options - Query options
 * @param {string} [options.userId] - Filter by user ID
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.action] - Filter by action
 * @param {string} [options.severity] - Filter by severity
 * @param {string} [options.status] - Filter by status
 * @param {Date} [options.startDate] - Filter events after this date
 * @param {Date} [options.endDate] - Filter events before this date
 * @param {number} [options.limit=100] - Max results to return
 * @param {number} [options.offset=0] - Result offset for pagination
 *
 * @returns {Promise<Array>} Array of security events
 */
export const getSecurityEvents = async (options = {}) => {
  try {
    const {
      userId = null,
      category = null,
      action = null,
      severity = null,
      status = null,
      startDate = null,
      endDate = null,
      limit = 100,
      offset = 0,
    } = options;

    let query = getSupabaseClient()
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) query = query.eq('user_id', userId);
    if (category) query = query.eq('category', category);
    if (action) query = query.eq('action', action);
    if (severity) query = query.eq('severity', severity);
    if (status) query = query.eq('status', status);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Failed to retrieve security events:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error retrieving security events:', err);
    return [];
  }
};

/**
 * Get security events summary statistics
 *
 * @param {Object} options - Query options
 * @param {Date} [options.startDate] - Filter events after this date
 * @param {Date} [options.endDate] - Filter events before this date
 *
 * @returns {Promise<Object>} Summary statistics
 */
export const getSecurityEventsSummary = async (options = {}) => {
  try {
    const { startDate = null, endDate = null } = options;

    let query = getSupabaseClient()
      .from('security_events')
      .select('category, action, severity, count');

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to retrieve security events summary:', error.message);
      return { byCategory: {}, bySeverity: {}, byAction: {} };
    }

    // Aggregate counts
    const summary = {
      byCategory: {},
      bySeverity: {},
      byAction: {},
      total: (data || []).length,
    };

    (data || []).forEach((event) => {
      summary.byCategory[event.category] = (summary.byCategory[event.category] || 0) + 1;
      summary.bySeverity[event.severity] = (summary.bySeverity[event.severity] || 0) + 1;
      summary.byAction[event.action] = (summary.byAction[event.action] || 0) + 1;
    });

    return summary;
  } catch (err) {
    console.error('Error retrieving security events summary:', err);
    return { byCategory: {}, bySeverity: {}, byAction: {} };
  }
};

/**
 * Helper: Extract request metadata from Express request object
 *
 * @param {Object} req - Express request object
 * @returns {Object} Extracted metadata
 */
export const extractRequestMetadata = (req) => {
  return {
    ipAddress: req.ip || req.connection?.remoteAddress || null,
    userAgent: req.headers?.['user-agent'] || null,
    requestId: req.id || req.headers?.['x-request-id'] || null,
  };
};

/**
 * Helper: Create standardized event options for common scenarios
 */
export const securityEventTemplates = {
  /**
   * AUTH event templates
   */
  loginSuccess: (userId, metadata = {}) => ({
    userId,
    category: 'AUTH',
    action: 'LOGIN_SUCCESS',
    severity: 'INFO',
    eventMessage: 'User successfully logged in',
    metadata,
  }),

  loginFailure: (email, reason = 'Invalid credentials', metadata = {}) => ({
    category: 'AUTH',
    action: 'LOGIN_FAILURE',
    severity: 'WARNING',
    eventMessage: `Login failed for ${email}: ${reason}`,
    metadata: { email, reason, ...metadata },
  }),

  logout: (userId, metadata = {}) => ({
    userId,
    category: 'AUTH',
    action: 'LOGOUT',
    severity: 'INFO',
    eventMessage: 'User logged out',
    metadata,
  }),

  passwordReset: (userId, metadata = {}) => ({
    userId,
    category: 'AUTH',
    action: 'PASSWORD_RESET',
    severity: 'INFO',
    eventMessage: 'User password reset initiated',
    metadata,
  }),

  /**
   * PROMPT event templates
   */
  promptSubmitted: (userId, resourceId, metadata = {}) => ({
    userId,
    category: 'PROMPT',
    action: 'PROMPT_SUBMITTED',
    severity: 'INFO',
    eventMessage: 'Prompt submitted for processing',
    resourceType: 'prompt',
    resourceId,
    metadata,
  }),

  promptBlocked: (userId, reason = 'Content policy violation', metadata = {}) => ({
    userId,
    category: 'PROMPT',
    action: 'PROMPT_BLOCKED',
    severity: 'WARNING',
    eventMessage: `Prompt blocked: ${reason}`,
    metadata: { reason, ...metadata },
  }),

  nsfwDetection: (userId, confidence = 0, metadata = {}) => ({
    userId,
    category: 'PROMPT',
    action: 'NSFW_DETECTION',
    severity: 'WARNING',
    eventMessage: `NSFW content detected (confidence: ${confidence})`,
    metadata: { confidence, ...metadata },
  }),

  promptInjection: (userId, pattern = '', metadata = {}) => ({
    userId,
    category: 'PROMPT',
    action: 'PROMPT_INJECTION',
    severity: 'CRITICAL',
    eventMessage: 'Prompt injection attempt detected',
    metadata: { pattern, ...metadata },
  }),

  /**
   * FILE_UPLOAD event templates
   */
  uploadSuccess: (userId, resourceId, fileName = '', metadata = {}) => ({
    userId,
    category: 'FILE_UPLOAD',
    action: 'UPLOAD_SUCCESS',
    severity: 'INFO',
    eventMessage: `File uploaded: ${fileName}`,
    resourceType: 'file',
    resourceId,
    metadata: { fileName, ...metadata },
  }),

  uploadRejected: (userId, reason = 'Unknown', metadata = {}) => ({
    userId,
    category: 'FILE_UPLOAD',
    action: 'UPLOAD_REJECTED',
    severity: 'WARNING',
    eventMessage: `Upload rejected: ${reason}`,
    metadata: { reason, ...metadata },
  }),

  wrongMimeType: (userId, received = '', expected = '', metadata = {}) => ({
    userId,
    category: 'FILE_UPLOAD',
    action: 'WRONG_MIME_TYPE',
    severity: 'WARNING',
    eventMessage: `Wrong MIME type. Received: ${received}, Expected: ${expected}`,
    metadata: { received, expected, ...metadata },
  }),

  fileTooLarge: (userId, fileSize = 0, maxSize = 0, metadata = {}) => ({
    userId,
    category: 'FILE_UPLOAD',
    action: 'FILE_TOO_LARGE',
    severity: 'WARNING',
    eventMessage: `File too large: ${fileSize} bytes (max: ${maxSize})`,
    metadata: { fileSize, maxSize, ...metadata },
  }),

  /**
   * RATE_LIMIT event templates
   */
  userHitLimit: (userId, limitType = '', metadata = {}) => ({
    userId,
    category: 'RATE_LIMIT',
    action: 'USER_HIT_LIMIT',
    severity: 'WARNING',
    eventMessage: `User hit rate limit: ${limitType}`,
    metadata: { limitType, ...metadata },
  }),

  requestBlocked: (reason = 'Rate limit exceeded', metadata = {}) => ({
    category: 'RATE_LIMIT',
    action: 'REQUEST_BLOCKED',
    severity: 'WARNING',
    eventMessage: `Request blocked: ${reason}`,
    metadata: { reason, ...metadata },
  }),

  /**
   * API event templates
   */
  invalidRequest: (reason = '', metadata = {}) => ({
    category: 'API',
    action: 'INVALID_REQUEST',
    severity: 'WARNING',
    eventMessage: `Invalid API request: ${reason}`,
    metadata: { reason, ...metadata },
  }),

  botActivity: (indicator = '', metadata = {}) => ({
    category: 'API',
    action: 'BOT_ACTIVITY',
    severity: 'WARNING',
    eventMessage: `Bot activity detected: ${indicator}`,
    metadata: { indicator, ...metadata },
  }),

  serverError: (error = '', metadata = {}) => ({
    category: 'API',
    action: 'SERVER_ERROR',
    severity: 'CRITICAL',
    eventMessage: `Server error: ${error}`,
    metadata: { error, ...metadata },
  }),

  /**
   * ADMIN event templates
   */
  roleChange: (adminId, affectedUserId, oldRole = '', newRole = '', metadata = {}) => ({
    userId: adminId,
    category: 'ADMIN',
    action: 'ROLE_CHANGE',
    severity: 'INFO',
    eventMessage: `User role changed from ${oldRole} to ${newRole}`,
    actorRole: 'admin',
    affectedUserId,
    metadata: { oldRole, newRole, ...metadata },
  }),

  userBan: (adminId, affectedUserId, reason = '', metadata = {}) => ({
    userId: adminId,
    category: 'ADMIN',
    action: 'USER_BAN',
    severity: 'WARNING',
    eventMessage: `User banned: ${reason}`,
    actorRole: 'admin',
    affectedUserId,
    metadata: { reason, ...metadata },
  }),

  userDelete: (adminId, affectedUserId, metadata = {}) => ({
    userId: adminId,
    category: 'ADMIN',
    action: 'USER_DELETE',
    severity: 'INFO',
    eventMessage: 'User account deleted',
    actorRole: 'admin',
    affectedUserId,
    metadata,
  }),

  /**
   * AI_COST event templates
   */
  videoGenerated: (userId, resourceId, cost = 0, metadata = {}) => ({
    userId,
    category: 'AI_COST',
    action: 'VIDEO_GENERATED',
    severity: 'INFO',
    eventMessage: `Video generated (cost: ${cost} credits)`,
    resourceType: 'video',
    resourceId,
    metadata: { cost, ...metadata },
  }),

  runwayRequest: (userId, resourceId, cost = 0, metadata = {}) => ({
    userId,
    category: 'AI_COST',
    action: 'RUNWAY_REQUEST',
    severity: 'INFO',
    eventMessage: `Runway request processed (cost: ${cost} credits)`,
    resourceType: 'video',
    resourceId,
    metadata: { cost, ...metadata },
  }),

  /**
   * SECURITY_ALERT templates
   */
  criticalSecurityEvent: (description = '', metadata = {}) => ({
    category: 'SECURITY_ALERT',
    action: 'CRITICAL_SECURITY_EVENT',
    severity: 'CRITICAL',
    eventMessage: description,
    metadata,
  }),
};
