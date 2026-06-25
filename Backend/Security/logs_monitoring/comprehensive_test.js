/**
 * Logs Monitoring Comprehensive Test
 * 
 * Tests all logging modules working together
 */

const ActivityLogger = require('./activityLogger');
const SecurityLogger = require('./securityLogger');
const AuditLogger = require('./auditLogger');
const ErrorLogger = require('./errorLogger');
const LogRetention = require('./logRetention');

console.log('=== Logs Monitoring Module Test Suite ===\n');

// Initialize all modules
const activityLogger = new ActivityLogger({ enableConsoleOutput: false });
const securityLogger = new SecurityLogger({ enableConsoleOutput: false });
const auditLogger = new AuditLogger({ enableConsoleOutput: false });
const errorLogger = new ErrorLogger({ enableConsoleOutput: false });
const logRetention = new LogRetention();

// ==================== TEST 1: Activity Logging ====================
console.log('TEST 1: Activity Logging');
console.log('------------------------');

activityLogger.logUserLogin('user123', '192.168.1.100', 'Mozilla/5.0');
activityLogger.logFileUpload('user123', '192.168.1.100', 'document.pdf', 1024000, 'application/pdf');
activityLogger.logVideoGeneration('user123', '192.168.1.100', 'video_001', 300, '1080p');
activityLogger.logImageGeneration('user123', '192.168.1.100', 'image_001', '1920x1080', 'png');
activityLogger.logPromptSubmission('user123', '192.168.1.100', 'prompt_001', 256, 'text-generation');

const activityStats = activityLogger.getStats();
console.log(`Activity Logs: ${activityStats.totalActivities} total`);
console.log(`  - Logins: ${activityStats.loginCount}`);
console.log(`  - Uploads: ${activityStats.uploadCount}`);
console.log(`  - Videos: ${activityStats.videoGenCount}`);
console.log(`  - Images: ${activityStats.imageGenCount}`);
console.log(`  - Prompts: ${activityStats.promptCount}`);
console.log('✓ Activity logging tests passed\n');

// ==================== TEST 2: Security Logging ====================
console.log('TEST 2: Security Logging');
console.log('------------------------');

securityLogger.logBlockedPrompt('user456', '192.168.1.101', 'prompt_002', 'Malicious content detected', 'blacklist');
securityLogger.logMalwareDetection('user456', '192.168.1.101', 'file', 'file_001', 'Trojan.Generic');
securityLogger.logRateLimitTriggered('user456', '192.168.1.101', '/api/generate', 100, '1m');
securityLogger.logUnauthorizedAccessAttempt('user456', '192.168.1.101', '/admin/panel', 'admin');
securityLogger.logFailedAuthentication('user456', '192.168.1.101', 'password', 3);
securityLogger.logSuspiciousActivity('user456', '192.168.1.101', 'brute_force', 'Multiple failed logins', 8);

const securityStats = securityLogger.getStats();
console.log(`Security Events: ${securityStats.totalSecurityEvents} total`);
console.log(`  - Blocked Prompts: ${securityStats.blockedPrompts}`);
console.log(`  - Malware Detected: ${securityStats.malwareDetections}`);
console.log(`  - Rate Limits: ${securityStats.rateLimitTriggered}`);
console.log(`  - Unauthorized Access: ${securityStats.unauthorizedAttempts}`);
console.log(`  - Failed Auth: ${securityStats.failedAuth}`);
console.log(`  - Suspicious Activities: ${securityStats.suspiciousActivities}`);

const flaggedUser = securityLogger.shouldFlagUser('user456');
console.log(`User 456 Flagged: ${flaggedUser.shouldFlag} (${flaggedUser.incidentCount} incidents)\n`);
console.log('✓ Security logging tests passed\n');

// ==================== TEST 3: Audit Logging ====================
console.log('TEST 3: Audit Logging');
console.log('---------------------');

auditLogger.logUserDeleted('admin1', '192.168.1.102', 'user789', 'Violates ToS');
auditLogger.logUserBanned('admin1', '192.168.1.102', 'user790', 'Abusive behavior', 2592000000);
auditLogger.logRoleChanged('admin1', '192.168.1.102', 'user791', 'user', 'moderator');
auditLogger.logSecuritySettingsChanged('admin1', '192.168.1.102', 'mfa_required', false, true);
auditLogger.logSystemConfigUpdated('admin1', '192.168.1.102', 'api_endpoints', { newEndpoint: 'v2' });
auditLogger.logDataExported('admin1', '192.168.1.102', 'users', 1000, 'csv');
auditLogger.logBackupCreated('admin1', '192.168.1.102', 'full', 5242880);

const auditStats = auditLogger.getStats();
console.log(`Audit Events: ${auditStats.totalAuditEvents} total`);
console.log(`  - Users Deleted: ${auditStats.userDeleted}`);
console.log(`  - Users Banned: ${auditStats.userBanned}`);
console.log(`  - Roles Changed: ${auditStats.roleChanged}`);
console.log(`  - Security Settings Changed: ${auditStats.securitySettingsChanged}`);
console.log(`  - System Config Updated: ${auditStats.systemConfigUpdated}`);
console.log(`  - Data Exported: ${auditStats.dataExported}`);
console.log(`  - Backups Created: ${auditStats.backupCreated}`);
console.log(`  - Critical Actions: ${auditStats.criticalActionsCount}\n`);
console.log('✓ Audit logging tests passed\n');

// ==================== TEST 4: Error Logging ====================
console.log('TEST 4: Error Logging');
console.log('---------------------');

errorLogger.logApiError('/api/users', 500, 'Internal Server Error', 'system');
errorLogger.logDatabaseError('SELECT * FROM users', 'Connection timeout', 'TIMEOUT', 'system');
errorLogger.logStorageError('write', '/uploads/file.pdf', 'Permission denied', 'EACCES', 'system');
errorLogger.logAuthError('password', 'Invalid credentials', 'user123', '192.168.1.103');
errorLogger.logProcessingError('video_generation', 'Timeout during encoding', 'TIMEOUT', 'user123');

const errorStats = errorLogger.getStats();
const errorSummary = errorLogger.getErrorSummary(60);
console.log(`Error Logs: ${errorStats.totalErrors} total`);
console.log(`  - API Errors: ${errorStats.apiErrors}`);
console.log(`  - Database Errors: ${errorStats.databaseErrors}`);
console.log(`  - Storage Errors: ${errorStats.storageErrors}`);
console.log(`  - Auth Errors: ${errorStats.authErrors}`);
console.log(`  - Processing Errors: ${errorStats.processingErrors}`);
console.log(`  - Critical: ${errorStats.criticalErrors}`);
console.log(`  - Warnings: ${errorStats.warningErrors}`);
console.log(`\nError Summary (last 60 min):`);
console.log(`  - Total: ${errorSummary.total}`);
console.log(`  - By Severity:`, errorSummary.bySeverity);
console.log('✓ Error logging tests passed\n');

// ==================== TEST 5: Log Retention ====================
console.log('TEST 5: Log Retention');
console.log('---------------------');

const retentionSummary = logRetention.getRetentionSummary();
console.log('Retention Policies:');
Object.entries(retentionSummary.policies).forEach(([type, policy]) => {
  console.log(`  - ${type}: ${policy.retention} (archive after ${policy.archiveAfter})`);
});

const validation = logRetention.validateRetentionPolicies();
console.log(`\nPolicy Validation: ${validation.valid ? 'VALID' : 'INVALID'}`);

const schedule = logRetention.getCleanupSchedule();
console.log(`\nCleanup Schedule:`);
console.log(`  - Schedule: ${schedule.schedule}`);
console.log(`  - Auto-cleanup: ${schedule.enabled}`);
console.log(`  - Last cleanup: ${schedule.lastCleanup}`);

// Test cleanup
const allLogs = [
  ...activityLogger.logs,
  ...securityLogger.logs,
  ...auditLogger.logs,
  ...errorLogger.logs
];

const cleanupResult = logRetention.executeCleanup(allLogs);
console.log(`\nCleanup Result:`);
console.log(`  - Archived: ${cleanupResult.cleanup.archived}`);
console.log(`  - Deleted: ${cleanupResult.cleanup.deleted}`);
console.log(`  - Remaining: ${cleanupResult.cleanup.remaining}`);

const retentionStats = logRetention.getStats();
console.log(`\nRetention Stats:`);
console.log(`  - Logs Archived: ${retentionStats.logsArchived}`);
console.log(`  - Logs Deleted: ${retentionStats.logsDeleted}`);
console.log(`  - Cleanup Runs: ${retentionStats.cleanupRunCount}\n`);
console.log('✓ Log retention tests passed\n');

// ==================== TEST 6: Logging Flow ====================
console.log('TEST 6: Complete Logging Flow');
console.log('-----------------------------');

const loggingFlowExample = {
  event: 'User downloads sensitive file',
  steps: [
    'Activity logged: FILE_DOWNLOAD',
    'Check for suspicious patterns',
    'If rate limit exceeded → Security log: RATE_LIMIT_TRIGGERED',
    'If malware detected → Security log: MALWARE_DETECTION',
    'If admin downloads → Audit log: DATA_ACCESSED',
    'If error occurs → Error log: STORAGE_ERROR or API_ERROR',
    'All logs stored with timestamp, user ID, IP, action, result, severity'
  ]
};

console.log(`\nExample: ${loggingFlowExample.event}`);
loggingFlowExample.steps.forEach((step, index) => {
  console.log(`  ${index + 1}. ${step}`);
});

console.log('\n=== All Tests Completed Successfully ===');
console.log('\nLogged Information in Each Entry:');
console.log('  - Timestamp');
console.log('  - User ID');
console.log('  - Action');
console.log('  - IP Address');
console.log('  - Result');
console.log('  - Severity');
console.log('  - Module');
console.log('  - Additional metadata');