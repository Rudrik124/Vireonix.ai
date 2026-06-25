/**
 * Database Security Module - Comprehensive Test Suite
 * 
 * Tests all database security modules:
 * - AccessControl
 * - QueryValidator
 * - DataEncryption
 * - BackupPolicy
 * - DbSecurityConfig
 */

const AccessControl = require('./accessControl');
const QueryValidator = require('./queryValidator');
const DataEncryption = require('./dataEncryption');
const BackupPolicy = require('./backupPolicy');
const DbSecurityConfig = require('./dbSecurityConfig');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    failedTests++;
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

console.log('\n========================================');
console.log('DATABASE SECURITY MODULE TEST SUITE');
console.log('========================================\n');

// ============================================================================
// ACCESS CONTROL TESTS
// ============================================================================

console.log('\n📋 ACCESS CONTROL TESTS (15 scenarios)\n');

const ac = new AccessControl();

test('AC-1: Create AccessControl instance', () => {
  assert(ac !== null, 'Instance should not be null');
  assert(ac.checkAccess !== undefined, 'checkAccess method should exist');
});

test('AC-2: Get default roles', () => {
  const roles = ac.getDefaultRoles();
  assert(roles.length > 0, 'Should have default roles');
  assert(roles.some(r => r.name === 'user'), 'Should have user role');
});

test('AC-3: Get default permissions', () => {
  const perms = ac.getDefaultPermissions();
  assert(perms.length > 0, 'Should have default permissions');
  assert(perms.some(p => p.resource === 'videos'), 'Should have videos resource');
});

test('AC-4: User can read own video', () => {
  const result = ac.checkAccess(
    { id: 'user1', role: 'user' },
    'videos',
    'read',
    'user1'
  );
  assert(result.allowed === true, 'User should be able to read own video');
});

test('AC-5: User cannot read other user video', () => {
  const result = ac.checkAccess(
    { id: 'user1', role: 'user' },
    'videos',
    'read',
    'user2'
  );
  assert(result.allowed === false, 'User should not read other user video');
});

test('AC-6: User can read own data', () => {
  const result = ac.checkAccess(
    { id: 'user1', role: 'user' },
    'users',
    'read',
    'user1'
  );
  assert(result.allowed === true, 'User should read own data');
});

test('AC-7: User cannot delete others data', () => {
  const result = ac.checkAccess(
    { id: 'user1', role: 'user' },
    'users',
    'delete',
    'user2'
  );
  assert(result.allowed === false, 'User should not delete others data');
});

test('AC-8: Admin can read any video', () => {
  const result = ac.checkAccess(
    { id: 'admin1', role: 'admin' },
    'videos',
    'read',
    'user1'
  );
  assert(result.allowed === true, 'Admin should read any video');
});

test('AC-9: Moderator can read audit logs', () => {
  const result = ac.checkAccess(
    { id: 'mod1', role: 'moderator' },
    'audit_logs',
    'read'
  );
  assert(result.allowed === true, 'Moderator should read audit logs');
});

test('AC-10: User cannot access admin data', () => {
  const result = ac.checkAccess(
    { id: 'user1', role: 'user' },
    'admin_data',
    'read'
  );
  assert(result.allowed === false, 'User should not access admin data');
});

test('AC-11: Get user permissions', () => {
  const perms = ac.getUserPermissions({ role: 'user' });
  assert(perms.resources !== undefined, 'Should have resources');
  assert(perms.resources.length > 0, 'Should have multiple resources');
});

test('AC-12: Add custom role', () => {
  const result = ac.addRole('moderator2', {
    name: 'moderator2',
    permissions: { videos: ['read', 'write'] }
  });
  assert(result.success === true, 'Should add role successfully');
});

test('AC-13: Audit access', () => {
  const result = ac.auditAccess({
    user: { id: 'user1', role: 'user' },
    resource: 'videos',
    operation: 'read',
    targetUserId: 'user1'
  });
  assert(result.allowed === true, 'Access should be allowed');
});

test('AC-14: Get statistics', () => {
  const stats = ac.getStats();
  assert(stats !== undefined, 'Should return stats');
  assert(stats.accessChecks !== undefined, 'Should track access checks');
});

test('AC-15: Reset statistics', () => {
  ac.resetStats();
  const stats = ac.getStats();
  assert(stats.accessChecks === 0, 'Stats should reset');
});

// ============================================================================
// QUERY VALIDATOR TESTS
// ============================================================================

console.log('\n🔍 QUERY VALIDATOR TESTS (18 scenarios)\n');

const qv = new QueryValidator();

test('QV-1: Create QueryValidator instance', () => {
  assert(qv !== null, 'Instance should not be null');
  assert(qv.validateQuery !== undefined, 'validateQuery method should exist');
});

test('QV-2: Valid SELECT query', () => {
  const result = qv.validateQuery('SELECT * FROM users WHERE id = ?');
  assert(result.valid === true, 'Valid query should pass');
});

test('QV-3: Detect SQL injection - DROP', () => {
  const result = qv.detectSqlInjection("'; DROP TABLE users; --");
  assert(result.detected === true, 'Should detect DROP injection');
});

test('QV-4: Detect SQL injection - UNION', () => {
  const result = qv.detectSqlInjection('1" UNION SELECT * FROM users --');
  assert(result.detected === true, 'Should detect UNION injection');
});

test('QV-5: Detect SQL injection - OR clause', () => {
  const result = qv.detectSqlInjection("1' OR '1'='1");
  assert(result.detected === true, 'Should detect OR injection');
});

test('QV-6: Detect dangerous operation - DROP TABLE', () => {
  const result = qv.detectDangerousOperations('DROP TABLE users');
  assert(result.isDangerous === true, 'Should detect DROP TABLE');
});

test('QV-7: Detect dangerous operation - TRUNCATE', () => {
  const result = qv.detectDangerousOperations('TRUNCATE TABLE audit_logs');
  assert(result.isDangerous === true, 'Should detect TRUNCATE');
});

test('QV-8: Detect dangerous operation - ALTER', () => {
  const result = qv.detectDangerousOperations('ALTER TABLE users DROP COLUMN password');
  assert(result.isDangerous === true, 'Should detect ALTER TABLE');
});

test('QV-9: Detect mass operation', () => {
  const result = qv.detectMassOperations('UPDATE users SET status = ?');
  assert(result.isMassOperation === true, 'Should detect mass update');
});

test('QV-10: Extract tables from query', () => {
  const result = qv.extractTables('SELECT * FROM users JOIN videos ON users.id = videos.user_id');
  assert(result.tables.includes('users'), 'Should extract users table');
  assert(result.tables.includes('videos'), 'Should extract videos table');
});

test('QV-11: Validate parameters - all valid', () => {
  const result = qv.validateParameters(['user123', 'test@example.com']);
  assert(result.valid === true, 'Valid parameters should pass');
});

test('QV-12: Check if table allowed - users', () => {
  const result = qv.isTableAllowed('users');
  assert(result.allowed === true, 'users table should be allowed');
});

test('QV-13: Check if operation allowed - SELECT', () => {
  const result = qv.isOperationAllowed('SELECT');
  assert(result.allowed === true, 'SELECT should be allowed');
});

test('QV-14: Validate query with mass operations disabled', () => {
  const result = qv.validateQuery('UPDATE users SET role = ?', {
    allowMassOperations: false
  });
  assert(result.valid === false, 'Should reject mass operation');
});

test('QV-15: Validate complex query', () => {
  const query = `SELECT u.name, COUNT(v.id) as video_count 
    FROM users u 
    LEFT JOIN videos v ON u.id = v.user_id 
    WHERE u.role = ? 
    GROUP BY u.id 
    HAVING COUNT(v.id) > ?`;
  const result = qv.validateQuery(query, { allowComplexQueries: true });
  assert(result.valid === true, 'Complex query should be valid');
});

test('QV-16: Get statistics', () => {
  const stats = qv.getStats();
  assert(stats !== undefined, 'Should return stats');
  assert(stats.queriesValidated !== undefined, 'Should track queries');
});

test('QV-17: Reset statistics', () => {
  qv.resetStats();
  const stats = qv.getStats();
  assert(stats.queriesValidated === 0, 'Stats should reset');
});

test('QV-18: Detect comment-based injection', () => {
  const result = qv.detectSqlInjection('SELECT * FROM users -- SELECT * FROM passwords');
  assert(result.detected === true, 'Should detect comment-based injection');
});

// ============================================================================
// DATA ENCRYPTION TESTS
// ============================================================================

console.log('\n🔐 DATA ENCRYPTION TESTS (16 scenarios)\n');

const de = new DataEncryption();

test('DE-1: Create DataEncryption instance', () => {
  assert(de !== null, 'Instance should not be null');
  assert(de.encrypt !== undefined, 'encrypt method should exist');
});

test('DE-2: Encrypt and decrypt data', () => {
  const original = 'secret_api_key_12345';
  const encrypted = de.encrypt(original);
  assert(encrypted.encrypted === true, 'Should be marked as encrypted');
  
  const decrypted = de.decrypt(encrypted);
  assert(decrypted.value === original, 'Decrypted value should match original');
});

test('DE-3: Hash password', () => {
  const password = 'MySecurePassword123!';
  const hashed = de.hashData(password);
  assert(hashed.hashed === true, 'Should be marked as hashed');
  assert(hashed.value !== password, 'Hash should not equal original');
});

test('DE-4: Verify password hash', () => {
  const password = 'MySecurePassword123!';
  const hashed = de.hashData(password);
  const verification = de.verifyHash(password, hashed.value);
  assert(verification.verified === true, 'Password verification should succeed');
});

test('DE-5: Verify wrong password fails', () => {
  const password = 'MySecurePassword123!';
  const hashed = de.hashData(password);
  const verification = de.verifyHash('WrongPassword', hashed.value);
  assert(verification.verified === false, 'Wrong password should fail');
});

test('DE-6: Encrypt object with fields', () => {
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    apiToken: 'sk_live_1234567890'
  };
  
  const encrypted = de.encryptObject(user, ['apiToken']);
  assert(encrypted.value.name === 'John Doe', 'Non-encrypted field should remain');
  assert(encrypted.value.apiToken !== user.apiToken, 'Encrypted field should change');
});

test('DE-7: Decrypt object with fields', () => {
  const user = {
    name: 'John Doe',
    apiToken: 'sk_live_1234567890'
  };
  
  const encrypted = de.encryptObject(user, ['apiToken']);
  const decrypted = de.decryptObject(encrypted.value, ['apiToken']);
  assert(decrypted.value.apiToken === user.apiToken, 'Should decrypt correctly');
});

test('DE-8: Mask sensitive data', () => {
  const cardNumber = '1234567890123456';
  const masked = de.maskSensitive(cardNumber, '*');
  assert(masked.includes('*'), 'Should contain mask character');
  assert(masked.length === cardNumber.length, 'Should maintain length');
});

test('DE-9: Add sensitive field', () => {
  const result = de.addSensitiveField('creditCard');
  assert(result.success === true, 'Should add field successfully');
});

test('DE-10: Encrypt with different algorithm', () => {
  const data = 'test data';
  const encrypted = de.encrypt(data, {
    algorithm: 'aes-256-gcm'
  });
  assert(encrypted.encrypted === true, 'Should encrypt with specified algorithm');
});

test('DE-11: Multiple encryptions are different', () => {
  const data = 'same data';
  const enc1 = de.encrypt(data);
  const enc2 = de.encrypt(data);
  assert(enc1.value !== enc2.value, 'Multiple encryptions should differ (different IVs)');
});

test('DE-12: Encrypt null data', () => {
  const encrypted = de.encrypt(null);
  assert(encrypted.encrypted === false, 'Null data should not be encrypted');
});

test('DE-13: Decrypt invalid data', () => {
  const decrypted = de.decrypt({ value: 'invalid' });
  assert(decrypted.error !== undefined, 'Invalid data should error');
});

test('DE-14: Get statistics', () => {
  const stats = de.getStats();
  assert(stats !== undefined, 'Should return stats');
  assert(stats.encryptionCount !== undefined, 'Should track encryptions');
});

test('DE-15: Reset statistics', () => {
  de.resetStats();
  const stats = de.getStats();
  assert(stats.encryptionCount === 0, 'Stats should reset');
});

test('DE-16: Hash with custom salt rounds', () => {
  const data = 'password';
  const hashed = de.hashData(data, { saltRounds: 10 });
  assert(hashed.hashed === true, 'Should hash with custom salt');
});

// ============================================================================
// BACKUP POLICY TESTS
// ============================================================================

console.log('\n💾 BACKUP POLICY TESTS (15 scenarios)\n');

const bp = new BackupPolicy();

test('BP-1: Create BackupPolicy instance', () => {
  assert(bp !== null, 'Instance should not be null');
  assert(bp.createBackup !== undefined, 'createBackup method should exist');
});

test('BP-2: Create full backup', () => {
  const result = bp.createBackup({
    type: 'full',
    tables: ['users', 'videos'],
    encrypted: true
  });
  assert(result.success === true, 'Should create backup successfully');
  assert(result.backupId !== undefined, 'Should return backup ID');
});

test('BP-3: Complete backup', () => {
  const created = bp.createBackup({ type: 'full' });
  const completed = bp.completeBackup(created.backupId, 5242880, 'hash123');
  assert(completed.success === true, 'Should complete backup');
});

test('BP-4: Get backup status', () => {
  const created = bp.createBackup({ type: 'full' });
  bp.completeBackup(created.backupId, 1024, 'hash');
  const status = bp.getBackupStatus(created.backupId);
  assert(status.found === true, 'Should find backup');
  assert(status.status === 'completed', 'Status should be completed');
});

test('BP-5: List backups', () => {
  bp.createBackup({ type: 'full' });
  bp.createBackup({ type: 'incremental' });
  const list = bp.listBackups();
  assert(list.count >= 2, 'Should list multiple backups');
});

test('BP-6: Filter backups by type', () => {
  bp.createBackup({ type: 'full' });
  bp.createBackup({ type: 'incremental' });
  const list = bp.listBackups({ type: 'full' });
  assert(list.backups.every(b => b.type === 'full'), 'Should filter by type');
});

test('BP-7: Get backup schedule', () => {
  const schedule = bp.getBackupSchedule();
  assert(schedule.fullBackup !== undefined, 'Should have full backup schedule');
});

test('BP-8: Get retention policy', () => {
  const retention = bp.getDefaultRetention();
  assert(retention.daily === 30, 'Should have daily retention');
  assert(retention.monthly === 12, 'Should have monthly retention');
});

test('BP-9: Create backup with priority', () => {
  const result = bp.createBackup({
    type: 'full',
    priority: 'critical'
  });
  assert(result.success === true, 'Should create critical backup');
});

test('BP-10: Verify backup integrity', () => {
  const created = bp.createBackup({ type: 'full' });
  bp.completeBackup(created.backupId, 1024, 'hash123');
  const verified = bp.verifyBackupIntegrity(created.backupId, 'hash123');
  assert(verified.verified === true, 'Should verify backup');
});

test('BP-11: Recovery from backup', () => {
  const created = bp.createBackup({ type: 'full' });
  bp.completeBackup(created.backupId, 1024, 'hash123');
  const recovery = bp.recoverFromBackup(created.backupId);
  assert(recovery.success === true, 'Should start recovery');
});

test('BP-12: List backups with limit', () => {
  for (let i = 0; i < 15; i++) {
    bp.createBackup({ type: 'full' });
  }
  const list = bp.listBackups({ limit: 5 });
  assert(list.backups.length <= 5, 'Should respect limit');
});

test('BP-13: Get statistics', () => {
  const stats = bp.getStats();
  assert(stats !== undefined, 'Should return stats');
  assert(stats.backupsCreated !== undefined, 'Should track created backups');
});

test('BP-14: Reset statistics', () => {
  bp.resetStats();
  const stats = bp.getStats();
  assert(stats.backupsCreated === 0, 'Stats should reset');
});

test('BP-15: Prune old backups', () => {
  bp.createBackup({ type: 'daily' });
  const result = bp.pruneOldBackups();
  assert(result.deletedCount !== undefined, 'Should return deleted count');
});

// ============================================================================
// DATABASE SECURITY CONFIG TESTS
// ============================================================================

console.log('\n⚙️  DATABASE SECURITY CONFIG TESTS (15 scenarios)\n');

const dsc = new DbSecurityConfig({ environment: 'production' });

test('DSC-1: Create DbSecurityConfig instance', () => {
  assert(dsc !== null, 'Instance should not be null');
  assert(dsc.initializeConfig !== undefined, 'initializeConfig method should exist');
});

test('DSC-2: Initialize configuration', () => {
  const result = dsc.initializeConfig();
  assert(result.errors !== undefined, 'Should return validation result');
});

test('DSC-3: Get default configuration', () => {
  const config = dsc.getDefaultConfig();
  assert(config.connection !== undefined, 'Should have connection config');
  assert(config.security !== undefined, 'Should have security config');
});

test('DSC-4: Get default policies', () => {
  const policies = dsc.getDefaultPolicies();
  assert(policies.accessControl !== undefined, 'Should have access control policy');
  assert(policies.dataProtection !== undefined, 'Should have data protection policy');
});

test('DSC-5: Get configuration', () => {
  const config = dsc.getConfig();
  assert(config.connection !== undefined, 'Should return config');
});

test('DSC-6: Update configuration', () => {
  const result = dsc.updateConfig({
    connection: { maxConnections: 200 }
  });
  assert(result.success === true, 'Should update config');
  assert(dsc.getConfig().connection.maxConnections === 200, 'Should apply update');
});

test('DSC-7: Check feature enabled', () => {
  const enabled = dsc.isFeatureEnabled('security.enableEncryption');
  assert(typeof enabled === 'boolean', 'Should return boolean');
});

test('DSC-8: Get feature configuration', () => {
  const featureConfig = dsc.getFeatureConfig('connection');
  assert(featureConfig !== null, 'Should return feature config');
});

test('DSC-9: Get policy', () => {
  const policy = dsc.getPolicy('accessControl');
  assert(policy !== null, 'Should return policy');
});

test('DSC-10: Update policy', () => {
  const result = dsc.updatePolicy('accessControl', {
    dataOwnershipCheck: false
  });
  assert(result.success === true, 'Should update policy');
});

test('DSC-11: Validate security settings', () => {
  const validation = dsc.validateSecuritySettings();
  assert(validation.valid !== undefined, 'Should validate');
  assert(Array.isArray(validation.issues), 'Should return issues array');
});

test('DSC-12: Get security summary', () => {
  const summary = dsc.getSecuritySummary();
  assert(summary.environment === 'production', 'Should include environment');
  assert(summary.encrypted !== undefined, 'Should include encryption status');
});

test('DSC-13: Export configuration (sanitized)', () => {
  const exported = dsc.exportConfig();
  assert(exported.connection !== undefined, 'Should export config');
  assert(exported.connection.username === '***', 'Should sanitize username');
});

test('DSC-14: Get statistics', () => {
  const stats = dsc.getStats();
  assert(stats !== undefined, 'Should return stats');
  assert(stats.environment === 'production', 'Should include environment');
});

test('DSC-15: Reset to default', () => {
  dsc.updateConfig({ connection: { maxConnections: 50 } });
  const result = dsc.resetToDefault();
  assert(result.success === true, 'Should reset successfully');
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n========================================');
console.log('TEST SUITE SUMMARY');
console.log('========================================\n');

console.log(`Total Tests:   ${totalTests}`);
console.log(`Passed:        ${passedTests} ✅`);
console.log(`Failed:        ${failedTests} ❌`);
console.log(`Success Rate:  ${((passedTests / totalTests) * 100).toFixed(2)}%`);

if (failedTests === 0) {
  console.log('\n🎉 ALL TESTS PASSED! 🎉');
} else {
  console.log(`\n⚠️  ${failedTests} test(s) failed`);
}

console.log('\n========================================\n');

module.exports = {
  totalTests,
  passedTests,
  failedTests,
  successRate: ((passedTests / totalTests) * 100).toFixed(2)
};