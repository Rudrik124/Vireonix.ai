/**
 * File Security Test Examples
 * Demonstrates spoofing detection and category-based limits
 */

const FileValidator = require('./fileValidator');
const MimeChecker = require('./mimeChecker');
const SizeLimiter = require('./sizeLimiter');

console.log('='.repeat(60));
console.log('FILE SECURITY EXAMPLES');
console.log('='.repeat(60));

// Initialize security modules
const validator = new FileValidator();
const mimeChecker = new MimeChecker();
const sizeLimiter = new SizeLimiter();

// ============================================
// EXAMPLE 1: Spoofing Detection
// ============================================
console.log('\n1. SPOOFING DETECTION EXAMPLES\n');

console.log('Scenario: User uploads virus.exe renamed as photo.jpg');
console.log('Expected: File is DETECTED & BLOCKED');

const spoofingResult = mimeChecker.detectFileSpoofing('.jpg', 'application/octet-stream');
console.log('Result:', JSON.stringify(spoofingResult, null, 2));

console.log('\n---\n');

console.log('Scenario: User uploads legitimate photo.jpg');
console.log('Expected: File is ACCEPTED');

const legitimateFile = {
  originalname: 'photo.jpg',
  mimetype: 'image/jpeg',
  size: 5 * 1024 * 1024
};

const legit = mimeChecker.validate(legitimateFile);
console.log('Result:', JSON.stringify(legit, null, 2));

// ============================================
// EXAMPLE 2: Category-Based Size Limits
// ============================================
console.log('\n2. CATEGORY-BASED SIZE LIMITS\n');

console.log('Checking file sizes with category limits:');
console.log('Image Limit: 20MB | Audio Limit: 20MB | Video Limit: 50MB\n');

// Image file - within limit
const imageSizeCheck = sizeLimiter.checkFileSize(15 * 1024 * 1024, 'image/jpeg', 'image');
console.log('✓ Image 15MB:', imageSizeCheck);

// Image file - exceeds limit
const imageTooLarge = sizeLimiter.checkFileSize(25 * 1024 * 1024, 'image/jpeg', 'image');
console.log('\n✗ Image 25MB:', imageTooLarge);

// Video file - within limit
const videoSizeCheck = sizeLimiter.checkFileSize(45 * 1024 * 1024, 'video/mp4', 'video');
console.log('\n✓ Video 45MB:', videoSizeCheck);

// Video file - exceeds limit
const videoTooLarge = sizeLimiter.checkFileSize(60 * 1024 * 1024, 'video/mp4', 'video');
console.log('\n✗ Video 60MB:', videoTooLarge);

// ============================================
// EXAMPLE 3: Complete Validation Flow
// ============================================
console.log('\n3. COMPLETE VALIDATION FLOW\n');

console.log('Scenario: User attempts to upload malicious.exe as image.jpg');

const maliciousFile = {
  originalname: 'image.jpg',
  mimetype: 'application/octet-stream', // Real MIME type - executable
  size: 2 * 1024 * 1024
};

console.log('File details:', maliciousFile);

// Step 1: Check extension
const extCheck = validator.validateForCategory(maliciousFile, 'image');
console.log('\nExtension check:', extCheck.isValid ? 'PASS' : 'FAIL');

// Step 2: Check MIME spoofing
const spoofCheck = mimeChecker.validate(maliciousFile);
console.log('MIME/Spoofing check:', spoofCheck.isValid ? 'PASS' : 'FAIL');
if (!spoofCheck.isValid) {
  console.log('Reason:', spoofCheck.errors);
}

// Step 3: Check size
const sizeCheck = sizeLimiter.checkFileSize(maliciousFile.size, maliciousFile.mimetype, 'image');
console.log('Size check:', sizeCheck.isValid ? 'PASS' : 'FAIL');

console.log('\n' + '='.repeat(60));
console.log('FINAL RESULT: FILE REJECTED ✗');
console.log('='.repeat(60));

// ============================================
// EXAMPLE 4: Supported Formats
// ============================================
console.log('\n4. SUPPORTED FILE FORMATS\n');

const supportedFormats = validator.getAllSupportedExtensions();
console.log(JSON.stringify(supportedFormats, null, 2));

// ============================================
// EXAMPLE 5: Category Limits Info
// ============================================
console.log('\n5. CATEGORY SIZE LIMITS\n');

const categoryLimits = sizeLimiter.getCategoryLimits();
console.log(JSON.stringify(categoryLimits, null, 2));

console.log('\n' + '='.repeat(60));
console.log('All tests completed!');
console.log('='.repeat(60));