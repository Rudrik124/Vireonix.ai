/**
 * Comprehensive File Security Testing
 * Demonstrates all validation functions and security checks
 */

const FileValidator = require('./fileValidator');
const MimeChecker = require('./mimeChecker');
const SizeLimiter = require('./sizeLimiter');

console.log('='.repeat(80));
console.log('COMPREHENSIVE FILE SECURITY TESTING');
console.log('='.repeat(80));

// Initialize modules
const validator = new FileValidator();
const mimeChecker = new MimeChecker();
const sizeLimiter = new SizeLimiter();

// ============================================
// TEST 1: FileValidator - validateFile()
// ============================================
console.log('\n1. FileValidator.validateFile() - Main Validation Function');
console.log('-'.repeat(80));

const testFile1 = {
  originalname: 'photo.jpg',
  size: 15 * 1024 * 1024,
  mimetype: 'image/jpeg'
};

const validation1 = validator.validateFile(testFile1, 'image');
console.log('File:', testFile1.originalname);
console.log('Result:', JSON.stringify(validation1, null, 2));

// ============================================
// TEST 2: FileValidator - validateImage()
// ============================================
console.log('\n2. FileValidator.validateImage() - Image-Specific Validation');
console.log('-'.repeat(80));

const imageValidation = validator.validateImage(testFile1);
console.log('Category:', imageValidation.category);
console.log('Max Size:', imageValidation.maxSizeFormatted);
console.log('Valid:', imageValidation.isValid);
console.log(JSON.stringify(imageValidation, null, 2));

// ============================================
// TEST 3: FileValidator - validateVideo()
// ============================================
console.log('\n3. FileValidator.validateVideo() - Video-Specific Validation');
console.log('-'.repeat(80));

const testFile2 = {
  originalname: 'movie.mp4',
  size: 40 * 1024 * 1024,
  mimetype: 'video/mp4'
};

const videoValidation = validator.validateVideo(testFile2);
console.log('Category:', videoValidation.category);
console.log('Max Size:', videoValidation.maxSizeFormatted);
console.log('Valid:', videoValidation.isValid);

// ============================================
// TEST 4: FileValidator - validateAudio()
// ============================================
console.log('\n4. FileValidator.validateAudio() - Audio-Specific Validation');
console.log('-'.repeat(80));

const testFile3 = {
  originalname: 'song.mp3',
  size: 10 * 1024 * 1024,
  mimetype: 'audio/mpeg'
};

const audioValidation = validator.validateAudio(testFile3);
console.log('Category:', audioValidation.category);
console.log('Max Size:', audioValidation.maxSizeFormatted);
console.log('Valid:', audioValidation.isValid);

// ============================================
// TEST 5: Malware Detection
// ============================================
console.log('\n5. FileValidator.checkMalwareIndicators() - Malware Detection');
console.log('-'.repeat(80));

const maliciousFiles = [
  'virus.exe',
  'image.jpg.exe',
  'document.pdf',
  'setup.bat',
  'photo.jpg'
];

for (const filename of maliciousFiles) {
  const malwareCheck = validator.checkMalwareIndicators(filename);
  console.log(`\nFile: ${filename}`);
  console.log(`Is Suspicious: ${malwareCheck.isSuspicious}`);
  console.log(`Risk Level: ${malwareCheck.riskLevel}`);
  if (malwareCheck.indicators.length > 0) {
    console.log(`Indicators:`, malwareCheck.indicators);
  }
}

// ============================================
// TEST 6: Complete File Validation
// ============================================
console.log('\n6. FileValidator.validateFileComplete() - Complete Security Check');
console.log('-'.repeat(80));

const completeTest = {
  originalname: 'vacation.jpg',
  size: 18 * 1024 * 1024,
  mimetype: 'image/jpeg'
};

const completeValidation = validator.validateFileComplete(completeTest, 'image');
console.log('Filename:', completeValidation.filename);
console.log('All Checks Passed:', completeValidation.allChecksPassed);
console.log('Security Status:', JSON.stringify(completeValidation.security, null, 2));

// ============================================
// TEST 7: MIME Checker - checkMime()
// ============================================
console.log('\n7. MimeChecker.checkMime() - MIME Type Check');
console.log('-'.repeat(80));

const mimes = ['image/jpeg', 'image/png', 'application/zip', 'video/mp4'];

for (const mime of mimes) {
  const check = mimeChecker.checkMime(mime);
  console.log(`\nMIME: ${mime}`);
  console.log(`Valid: ${check.isValid}`);
  console.log(`Allowed: ${check.isAllowed}`);
}

// ============================================
// TEST 8: MIME Checker - verifyMime()
// ============================================
console.log('\n8. MimeChecker.verifyMime() - MIME Verification');
console.log('-'.repeat(80));

const verifyTests = [
  { ext: '.jpg', mime: 'image/jpeg', description: 'Legitimate image' },
  { ext: '.jpg', mime: 'image/png', description: 'Wrong MIME for extension' },
  { ext: '.jpg', mime: 'application/octet-stream', description: 'Spoofed executable' },
  { ext: '.mp4', mime: 'video/mp4', description: 'Legitimate video' }
];

for (const test of verifyTests) {
  const verify = mimeChecker.verifyMime(test.ext, test.mime);
  console.log(`\n${test.description}`);
  console.log(`Extension: ${test.ext} | MIME: ${test.mime}`);
  console.log(`Verified: ${verify.isVerified}`);
  console.log(`Spoofed: ${verify.isSpoofed}`);
  if (!verify.isVerified) {
    console.log(`Message: ${verify.message}`);
  }
}

// ============================================
// TEST 9: MIME Checker - Dangerous MIME Detection
// ============================================
console.log('\n9. MimeChecker.detectDangerousMime() - Dangerous MIME Detection');
console.log('-'.repeat(80));

const dangerousMimes = [
  'application/octet-stream',
  'application/x-msdownload',
  'image/jpeg',
  'application/x-executable'
];

for (const mime of dangerousMimes) {
  const dangerous = mimeChecker.detectDangerousMime(mime);
  console.log(`\nMIME: ${mime}`);
  console.log(`Is Dangerous: ${dangerous.isDangerous}`);
  console.log(`Risk Level: ${dangerous.riskLevel}`);
  if (dangerous.warning) {
    console.log(`Warning: ${dangerous.warning}`);
  }
}

// ============================================
// TEST 10: Size Limiter - Category Checks
// ============================================
console.log('\n10. SizeLimiter - Category-Specific Size Checks');
console.log('-'.repeat(80));

const sizeTests = [
  { size: 15 * 1024 * 1024, func: 'checkImageSize', name: 'Image 15MB' },
  { size: 25 * 1024 * 1024, func: 'checkImageSize', name: 'Image 25MB (EXCEEDS)' },
  { size: 45 * 1024 * 1024, func: 'checkVideoSize', name: 'Video 45MB' },
  { size: 60 * 1024 * 1024, func: 'checkVideoSize', name: 'Video 60MB (EXCEEDS)' },
  { size: 18 * 1024 * 1024, func: 'checkAudioSize', name: 'Audio 18MB' },
  { size: 25 * 1024 * 1024, func: 'checkAudioSize', name: 'Audio 25MB (EXCEEDS)' }
];

for (const test of sizeTests) {
  console.log(`\n${test.name}:`);
  const result = sizeLimiter[test.func](test.size);
  console.log(`Valid: ${result.isValid}`);
  console.log(`Size: ${result.fileSizeFormatted} / Limit: ${result.limitFormatted}`);
  if (result.isValid) {
    console.log(`Remaining: ${result.remainingSizeFormatted}`);
    console.log(`Usage: ${result.percentageUsed}%`);
  } else {
    console.log(`Error: ${result.message}`);
  }
}

// ============================================
// TEST 11: Complete Workflow Simulation
// ============================================
console.log('\n11. Complete Workflow - File Upload Simulation');
console.log('-'.repeat(80));

const uploadScenarios = [
  {
    name: 'Legitimate Image',
    file: { originalname: 'vacation.jpg', size: 15 * 1024 * 1024, mimetype: 'image/jpeg' },
    category: 'image'
  },
  {
    name: 'Spoofed File (virus.exe as photo.jpg)',
    file: { originalname: 'photo.jpg', size: 2 * 1024 * 1024, mimetype: 'application/x-msdownload' },
    category: 'image'
  },
  {
    name: 'File Too Large',
    file: { originalname: 'movie.mp4', size: 60 * 1024 * 1024, mimetype: 'video/mp4' },
    category: 'video'
  },
  {
    name: 'Valid Large Video',
    file: { originalname: 'movie.mp4', size: 45 * 1024 * 1024, mimetype: 'video/mp4' },
    category: 'video'
  }
];

for (const scenario of uploadScenarios) {
  console.log(`\n📁 Scenario: ${scenario.name}`);
  console.log(`   File: ${scenario.file.originalname}`);
  
  // Step 1: File validation
  const fileValidation = validator.validateFileComplete(scenario.file, scenario.category);
  console.log(`   ✓ File Validation: ${fileValidation.allChecksPassed ? '✅ PASS' : '❌ FAIL'}`);
  
  // Step 2: MIME verification
  const ext = scenario.file.originalname.substring(scenario.file.originalname.lastIndexOf('.'));
  const mimeVerify = mimeChecker.verifyMime(ext, scenario.file.mimetype);
  console.log(`   ✓ MIME Verification: ${mimeVerify.isVerified && !mimeVerify.isSpoofed ? '✅ PASS' : '❌ FAIL'}`);
  
  // Step 3: Size check
  let sizeCheck;
  if (scenario.category === 'image') {
    sizeCheck = sizeLimiter.checkImageSize(scenario.file.size);
  } else if (scenario.category === 'video') {
    sizeCheck = sizeLimiter.checkVideoSize(scenario.file.size);
  }
  console.log(`   ✓ Size Check: ${sizeCheck.isValid ? '✅ PASS' : '❌ FAIL'}`);
  
  // Overall result
  const overallPass = fileValidation.allChecksPassed && mimeVerify.isVerified && !mimeVerify.isSpoofed && sizeCheck.isValid;
  console.log(`   ─────────────────────`);
  console.log(`   📊 FINAL RESULT: ${overallPass ? '✅ ACCEPTED' : '❌ REJECTED'}`);
  
  if (!overallPass) {
    if (!fileValidation.allChecksPassed) {
      console.log(`      Errors: ${fileValidation.errors.join(', ')}`);
    }
    if (mimeVerify.isSpoofed) {
      console.log(`      Spoofing: ${mimeVerify.message}`);
    }
    if (!sizeCheck.isValid) {
      console.log(`      Size: ${sizeCheck.message}`);
    }
  }
}

console.log('\n' + '='.repeat(80));
console.log('TESTING COMPLETED');
console.log('='.repeat(80));