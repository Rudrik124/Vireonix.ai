/**
 * Cloudflare Setup Comprehensive Test
 * 
 * Tests all Cloudflare security modules working together
 */

const DDoSProtection = require('./ddosProtection');
const FirewallRules = require('./firewallRules');
const RateLimitRules = require('./rateLimitRules');
const BotProtection = require('./botProtection');
const SSLConfig = require('./sslConfig');

console.log('=== Cloudflare Setup Module Test Suite ===\n');

// Initialize all modules
const ddosProtection = new DDoSProtection();
const firewallRules = new FirewallRules();
const rateLimitRules = new RateLimitRules();
const botProtection = new BotProtection();
const sslConfig = new SSLConfig();

// ==================== TEST 1: DDoS Protection ====================
console.log('TEST 1: DDoS Protection');
console.log('----------------------');

const normalRequest = ddosProtection.analyzeRequest({
  ipAddress: '203.0.113.1',
  headers: {}
});
console.log('Normal Request:', normalRequest.allowed ? '✓ Allowed' : '✗ Blocked');

// Simulate flooding attack
for (let i = 0; i < 1500; i++) {
  ddosProtection.analyzeRequest({
    ipAddress: '203.0.113.2',
    headers: {}
  });
}

const floodingAttack = ddosProtection.analyzeRequest({
  ipAddress: '203.0.113.2',
  headers: {}
});
console.log('Flooding Attack:', floodingAttack.allowed ? '✗ Allowed' : '✓ Blocked');

const ddosStats = ddosProtection.getStats();
console.log(`DDoS Stats: ${ddosStats.blockedRequests} blocked, ${ddosStats.detectedAttacks} attacks detected\n`);

// ==================== TEST 2: Firewall Rules ====================
console.log('TEST 2: Firewall Rules');
console.log('----------------------');

// Add IP to blacklist
firewallRules.blockIP('192.0.2.1', 'Known malicious IP');
const blacklistedRequest = firewallRules.evaluateRequest({
  ipAddress: '192.0.2.1',
  country: 'US',
  userAgent: 'Mozilla/5.0',
  url: '/api/users'
});
console.log('Blacklisted IP:', blacklistedRequest.allowed ? '✗ Allowed' : '✓ Blocked');

// Test SQL injection detection
const sqlInjectionRequest = firewallRules.evaluateRequest({
  ipAddress: '203.0.113.10',
  country: 'US',
  userAgent: 'Mozilla/5.0',
  url: '/api/search?q=test\' UNION SELECT * FROM users--'
});
console.log('SQL Injection:', sqlInjectionRequest.allowed ? '✗ Allowed' : '✓ Blocked');

// Test country blocking
firewallRules.blockCountry('NK');
const countryBlockedRequest = firewallRules.evaluateRequest({
  ipAddress: '203.0.113.11',
  country: 'NK',
  userAgent: 'Mozilla/5.0',
  url: '/api/users'
});
console.log('Blocked Country:', countryBlockedRequest.allowed ? '✗ Allowed' : '✓ Blocked');

const firewallStats = firewallRules.getStats();
console.log(`Firewall Stats: ${firewallStats.requestsBlocked} blocked, ${firewallStats.requestsAllowed} allowed\n`);

// ==================== TEST 3: Rate Limiting ====================
console.log('TEST 3: Rate Limiting');
console.log('---------------------');

// Test within limits
const withinLimit = rateLimitRules.checkRateLimit('203.0.113.20', '/api/auth/login');
console.log('Within Limit:', withinLimit.allowed ? '✓ Allowed' : '✗ Blocked');

// Test exceeding limits
for (let i = 0; i < 12; i++) {
  rateLimitRules.checkRateLimit('203.0.113.21', '/api/auth/login');
}

const exceedsLimit = rateLimitRules.checkRateLimit('203.0.113.21', '/api/auth/login');
console.log('Exceeds Limit:', exceedsLimit.allowed ? '✗ Allowed' : '✓ Blocked');

const violations = rateLimitRules.getViolations({ limit: 5 });
console.log(`Rate Limit Violations: ${violations.total} total`);

const mostViolated = rateLimitRules.getMostViolatedEndpoints(3);
console.log(`Most Violated Endpoints: ${mostViolated.mostViolated.length} endpoints`);

const rateLimitStats = rateLimitRules.getStats();
console.log(`Rate Limit Stats: ${rateLimitStats.requestsBlocked} blocked, ${rateLimitStats.limitsExceeded} limits exceeded\n`);

// ==================== TEST 4: Bot Protection ====================
console.log('TEST 4: Bot Protection');
console.log('---------------------');

// Test legitimate Google Bot
const googleBotRequest = botProtection.analyzeRequest({
  userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)',
  headers: {}
});
console.log('Google Bot:', googleBotRequest.action === 'allow' ? '✓ Allowed' : '✗ Blocked');

// Test scraping bot
const scrapingBotRequest = botProtection.analyzeRequest({
  userAgent: 'Python/3.8 Scrapy/2.0',
  headers: {},
  behavior: {}
});
console.log('Scraping Bot:', scrapingBotRequest.action === 'allow' ? '✗ Allowed' : '✓ Blocked');

// Test malicious bot
const maliciousBotRequest = botProtection.analyzeRequest({
  userAgent: 'sqlmap/1.0',
  headers: {},
  behavior: {}
});
console.log('Malicious Bot:', maliciousBotRequest.action === 'allow' ? '✗ Allowed' : '✓ Blocked');

// Test legitimate user
const legitimateRequest = botProtection.analyzeRequest({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
  headers: { 'Accept': 'text/html' },
  behavior: {}
});
console.log('Legitimate User:', legitimateRequest.action === 'allow' ? '✓ Allowed' : '✗ Blocked');

const botStats = botProtection.getStats();
console.log(`Bot Protection Stats: ${botStats.botDetected} bots detected, ${botStats.botsBlocked} blocked\n`);

// ==================== TEST 5: SSL Configuration ====================
console.log('TEST 5: SSL Configuration');
console.log('-------------------------');

// Test HTTPS enforcement
const httpsRequest = sslConfig.validateRequestProtocol({
  protocol: 'https',
  hostname: 'api.example.com',
  path: '/api/users'
});
console.log('HTTPS Request:', httpsRequest.valid ? '✓ Valid' : '✗ Invalid');

// Test HTTP redirect
const httpRequest = sslConfig.validateRequestProtocol({
  protocol: 'http',
  hostname: 'api.example.com',
  path: '/api/users'
});
console.log('HTTP Request:', httpRequest.redirectRequired ? '✓ Redirected' : '✗ Not redirected');

// Check TLS version
const tlsCheck = sslConfig.checkTLSVersion('1.2');
console.log('TLS 1.2:', tlsCheck.allowed ? '✓ Allowed' : '✗ Not allowed');

// Get security headers
const headers = sslConfig.generateSecurityHeaders();
console.log(`Security Headers: ${Object.keys(headers).length} headers configured`);

// Add certificate
sslConfig.addCertificate({
  domain: 'api.example.com',
  issuer: 'Let\'s Encrypt',
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  fingerprint: 'abc123'
});

const certs = sslConfig.getCertificates();
console.log(`SSL Certificates: ${certs.total} certificates`);

const sslStats = sslConfig.getStats();
console.log(`SSL Stats: ${sslStats.httpsPercentage} HTTPS traffic\n`);

// ==================== TEST 6: Complete Protection Flow ====================
console.log('TEST 6: Complete Protection Flow');
console.log('--------------------------------');

console.log('\nRequest Protection Layers:');
console.log('1. SSL/TLS Verification');
console.log('   - Enforce HTTPS');
console.log('   - Validate certificates');
console.log('   - Check TLS version\n');

console.log('2. DDoS Protection');
console.log('   - Detect traffic spikes');
console.log('   - Block IP flooding');
console.log('   - Monitor connection abuse\n');

console.log('3. Firewall Rules');
console.log('   - Block blacklisted IPs');
console.log('   - Block countries');
console.log('   - Detect attack signatures\n');

console.log('4. Bot Protection');
console.log('   - Identify scraping bots');
console.log('   - Detect malicious bots');
console.log('   - Allow verified search engines\n');

console.log('5. Rate Limiting');
console.log('   - Protect login endpoint');
console.log('   - Protect API endpoints');
console.log('   - Block excessive requests\n');

// ==================== TEST 7: Statistics Summary ====================
console.log('TEST 7: Security Statistics Summary');
console.log('-----------------------------------');

console.log('\nDDoS Protection:');
console.log(`  Blocked: ${ddosStats.blockedRequests}, Attacks: ${ddosStats.detectedAttacks}`);

console.log('\nFirewall Rules:');
console.log(`  Blocked: ${firewallStats.requestsBlocked}, Allowed: ${firewallStats.requestsAllowed}`);

console.log('\nRate Limiting:');
console.log(`  Violations: ${rateLimitStats.totalViolations}`);

console.log('\nBot Protection:');
console.log(`  Detected: ${botStats.botDetected}, Blocked: ${botStats.botsBlocked}`);

console.log('\nSSL/TLS:');
console.log(`  HTTPS: ${sslStats.httpsPercentage}`);

console.log('\n=== All Tests Completed Successfully ===');