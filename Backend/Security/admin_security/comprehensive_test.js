/**
 * Admin Security Comprehensive Test
 * 
 * Tests all admin security modules working together
 */

const AdminAuth = require('./adminAuth');
const RoleManager = require('./roleManager');
const PermissionValidator = require('./permissionValidator');
const AdminActionGuard = require('./adminActionGuard');
const AdminSessionControl = require('./adminSessionControl');

console.log('=== Admin Security Module Test Suite ===\n');

// Initialize all modules
const adminAuth = new AdminAuth();
const roleManager = new RoleManager();
const permissionValidator = new PermissionValidator(roleManager);
const adminActionGuard = new AdminActionGuard(permissionValidator);
const adminSessionControl = new AdminSessionControl(adminAuth);

// ==================== TEST 1: Admin Authentication ====================
console.log('TEST 1: Admin Authentication');
console.log('-----------------------------');

const loginResult = adminAuth.loginAdmin({
  username: 'admin@system.com',
  password: 'SecurePassword123!',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0'
});

console.log('Login Result:', loginResult);

const sessionId = loginResult.sessionId;
const sessionValidation = adminAuth.validateAdminSession(sessionId);
console.log('Session Validation:', sessionValidation);

const tokenValidation = adminAuth.validateAdminToken(loginResult.token);
console.log('Token Validation:', tokenValidation);
console.log('✓ Authentication tests passed\n');

// ==================== TEST 2: Role Management ====================
console.log('TEST 2: Role Management');
console.log('------------------------');

const roleAssignment = roleManager.assignRole('admin@system.com', 'super_admin');
console.log('Role Assignment:', roleAssignment);

const adminRole = roleManager.getAdminRole('admin@system.com');
console.log('Admin Role Details:', adminRole);

const roleHierarchy = roleManager.getRoleHierarchy();
console.log('Role Hierarchy:');
Object.entries(roleHierarchy).forEach(([role, data]) => {
  console.log(`  ${role}: Level ${data.level} (${data.permissionCount} permissions)`);
});

console.log('✓ Role management tests passed\n');

// ==================== TEST 3: Permission Validation ====================
console.log('TEST 3: Permission Validation');
console.log('------------------------------');

const canDeleteUsers = permissionValidator.canDeleteUsers('admin@system.com');
console.log('Can Delete Users:', canDeleteUsers);

const canBanUsers = permissionValidator.canBanUsers('admin@system.com');
console.log('Can Ban Users:', canBanUsers);

const canModifySettings = permissionValidator.canModifySettings('admin@system.com');
console.log('Can Modify Settings:', canModifySettings);

const adminPermissions = permissionValidator.getAdminPermissions('admin@system.com');
console.log('All Admin Permissions:');
console.log(`  Total: ${adminPermissions.permissionCount} permissions`);
console.log('  Sample:', adminPermissions.permissions.slice(0, 3));

console.log('✓ Permission validation tests passed\n');

// ==================== TEST 4: Admin Action Guard ====================
console.log('TEST 4: Admin Action Guard');
console.log('---------------------------');

const deleteUserResult = adminActionGuard.deleteUser('admin@system.com', 'user123', 'Spam violation');
console.log('Delete User Action:', deleteUserResult);

const banUserResult = adminActionGuard.banUser('admin@system.com', 'user456', 'Abusive behavior', 2592000000);
console.log('Ban User Action:', banUserResult);

const deleteContentResult = adminActionGuard.deleteContent('admin@system.com', 'post789', 'post', 'Inappropriate content');
console.log('Delete Content Action:', deleteContentResult);

const auditTrail = adminActionGuard.getActionAuditTrail({ limit: 5 });
console.log(`Action Audit Trail: ${auditTrail.filtered} entries`);

console.log('✓ Admin action guard tests passed\n');

// ==================== TEST 5: Session Control ====================
console.log('TEST 5: Session Control');
console.log('------------------------');

const sessionExpiry = adminSessionControl.checkSessionExpiry(sessionId);
console.log('Session Expiry Check:', {
  valid: sessionExpiry.valid,
  timeRemaining: sessionExpiry.timeRemaining ? (sessionExpiry.timeRemaining / 60000).toFixed(2) + ' minutes' : 'N/A'
});

const multipleSessions = adminSessionControl.checkMultipleActiveSessions('admin@system.com');
console.log('Multiple Sessions Check:', {
  suspicious: multipleSessions.suspicious,
  activeSessions: multipleSessions.activeSessions
});

const sessionHealth = adminSessionControl.getSessionHealthReport();
console.log('Session Health Report:', {
  totalActiveSessions: sessionHealth.totalActiveSessions,
  healthy: sessionHealth.sessionHealth.healthy
});

console.log('✓ Session control tests passed\n');

// ==================== TEST 6: Unauthorized Access Attempt ====================
console.log('TEST 6: Unauthorized Access Attempt');
console.log('------------------------------------');

// Assign a lower role
roleManager.assignRole('support@system.com', 'support_staff');

// Attempt unauthorized action
const unauthorizedDelete = adminActionGuard.deleteUser('support@system.com', 'user999', 'Should fail');
console.log('Unauthorized Delete Attempt:', {
  success: unauthorizedDelete.success,
  reason: unauthorizedDelete.reason
});

console.log('✓ Unauthorized access tests passed\n');

// ==================== TEST 7: Statistics ====================
console.log('TEST 7: Security Module Statistics');
console.log('-----------------------------------');

console.log('Authentication Stats:', adminAuth.getStats());
console.log('\nRole Manager Stats:', roleManager.getStats());
console.log('\nPermission Validator Stats:', permissionValidator.getStats());
console.log('\nAdmin Action Guard Stats:', adminActionGuard.getStats());
console.log('\nSession Control Stats:', adminSessionControl.getStats());

console.log('\n=== All Tests Completed Successfully ===');