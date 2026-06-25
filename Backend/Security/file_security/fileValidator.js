/**
 * File Validator Module
 * Validates uploaded files for security threats
 */

const fs = require('fs');
const path = require('path');

class FileValidator {
  constructor(options = {}) {
    // Category-based extensions for video editing project
    this.categories = options.categories || {
      image: {
        extensions: ['.jpg', '.jpeg', '.png', '.webp'],
        label: 'Image'
      },
      video: {
        extensions: ['.mp4', '.mov', '.webm', '.mkv'],
        label: 'Video'
      },
      audio: {
        extensions: ['.mp3', '.wav', '.m4a', '.aac'],
        label: 'Audio'
      }
    };

    // Flatten all allowed extensions
    this.allowedExtensions = Object.values(this.categories).flatMap(cat => cat.extensions);
    this.maxFileSize = options.maxFileSize || 5 * 1024 * 1024; // 5MB default
  }

  /**
   * Get category for file extension
   * @param {string} filename - Name of the file
   * @returns {string|null} - Category name or null
   */
  getFileCategory(filename) {
    const ext = path.extname(filename).toLowerCase();
    for (const [category, config] of Object.entries(this.categories)) {
      if (config.extensions.includes(ext)) {
        return category;
      }
    }
    return null;
  }

  /**
   * Validate file extension
   * @param {string} filename - Name of the file
   * @returns {boolean} - True if extension is allowed
   */
  validateExtension(filename) {
    const ext = path.extname(filename).toLowerCase();
    return this.allowedExtensions.includes(ext);
  }

  /**
   * Get supported extensions for a category
   * @param {string} category - Category name (image, video, audio)
   * @returns {array} - List of supported extensions
   */
  getSupportedExtensions(category) {
    const categoryConfig = this.categories[category];
    return categoryConfig ? categoryConfig.extensions : [];
  }

  /**
   * Get all supported extensions grouped by category
   * @returns {object} - Supported extensions by category
   */
  getAllSupportedExtensions() {
    const result = {};
    for (const [category, config] of Object.entries(this.categories)) {
      result[category] = {
        label: config.label,
        extensions: config.extensions
      };
    }
    return result;
  }

  /**
   * Validate file size
   * @param {number} fileSize - Size of the file in bytes
   * @returns {boolean} - True if size is within limit
   */
  validateSize(fileSize) {
    return fileSize <= this.maxFileSize;
  }

  /**
   * Validate filename for malicious characters
   * @param {string} filename - Name of the file
   * @returns {boolean} - True if filename is safe
   */
  validateFilename(filename) {
    const dangerousChars = /[<>:"|?*\x00-\x1f]/g;
    return !dangerousChars.test(filename);
  }

  /**
   * Comprehensive file validation
   * @param {object} file - File object (Express multer)
   * @param {string} expectedCategory - Expected file category (image, video, audio)
   * @returns {object} - Validation result with status and message
   */
  validate(file, expectedCategory = null) {
    const result = {
      isValid: true,
      errors: [],
      supportedFormats: null
    };

    if (!file) {
      result.isValid = false;
      result.errors.push('No file provided');
      return result;
    }

    // Check filename validity
    if (!this.validateFilename(file.originalname)) {
      result.isValid = false;
      result.errors.push('Invalid filename. Contains forbidden characters');
    }

    // Check extension
    if (!this.validateExtension(file.originalname)) {
      result.isValid = false;
      const fileCategory = this.getFileCategory(file.originalname);
      
      if (expectedCategory) {
        // File uploaded in wrong category space
        const supportedExts = this.getSupportedExtensions(expectedCategory);
        const categoryLabel = this.categories[expectedCategory]?.label || expectedCategory;
        result.errors.push(`This file type doesn't support in ${categoryLabel} section`);
        result.supportedFormats = {
          category: expectedCategory,
          label: categoryLabel,
          supportedExtensions: supportedExts
        };
      } else {
        // General file type not supported
        result.errors.push('This file type is not supported');
        result.supportedFormats = this.getAllSupportedExtensions();
      }
    } else if (expectedCategory) {
      // File extension valid but check if it matches expected category
      const fileCategory = this.getFileCategory(file.originalname);
      if (fileCategory !== expectedCategory) {
        result.isValid = false;
        const supportedExts = this.getSupportedExtensions(expectedCategory);
        const categoryLabel = this.categories[expectedCategory]?.label || expectedCategory;
        result.errors.push(`This file type doesn't support in ${categoryLabel} section`);
        result.supportedFormats = {
          category: expectedCategory,
          label: categoryLabel,
          supportedExtensions: supportedExts
        };
      }
    }

    // Check file size
    if (!this.validateSize(file.size)) {
      result.isValid = false;
      result.errors.push(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    return result;
  }

  /**
   * Validate file for specific category
   * @param {object} file - File object
   * @param {string} category - Category (image, video, audio)
   * @returns {object} - Validation result
   */
  validateForCategory(file, category) {
    return this.validate(file, category);
  }

  /**
   * Main file validation function
   * Workflow: Filename → Extension → MIME → Size
   * @param {object} file - File object (Express multer)
   * @param {string} category - File category (optional)
   * @returns {object} - Complete validation result with all checks
   */
  validateFile(file, category = null) {
    return this.validate(file, category);
  }

  /**
   * Validate image file
   * Checks: filename, extension (.jpg, .jpeg, .png, .webp), size (20MB limit)
   * @param {object} file - File object
   * @returns {object} - Validation result
   */
  validateImage(file) {
    const result = this.validate(file, 'image');
    
    // Add image-specific metadata
    result.category = 'image';
    result.categoryLabel = 'Image';
    result.supportedExtensions = this.getSupportedExtensions('image');
    result.maxSizeForCategory = 20 * 1024 * 1024; // 20MB
    result.maxSizeFormatted = '20 MB';

    return result;
  }

  /**
   * Validate video file
   * Checks: filename, extension (.mp4, .mov, .webm, .mkv), size (50MB limit)
   * @param {object} file - File object
   * @returns {object} - Validation result
   */
  validateVideo(file) {
    const result = this.validate(file, 'video');
    
    // Add video-specific metadata
    result.category = 'video';
    result.categoryLabel = 'Video';
    result.supportedExtensions = this.getSupportedExtensions('video');
    result.maxSizeForCategory = 50 * 1024 * 1024; // 50MB
    result.maxSizeFormatted = '50 MB';

    return result;
  }

  /**
   * Validate audio file
   * Checks: filename, extension (.mp3, .wav, .m4a, .aac), size (20MB limit)
   * @param {object} file - File object
   * @returns {object} - Validation result
   */
  validateAudio(file) {
    const result = this.validate(file, 'audio');
    
    // Add audio-specific metadata
    result.category = 'audio';
    result.categoryLabel = 'Audio';
    result.supportedExtensions = this.getSupportedExtensions('audio');
    result.maxSizeForCategory = 20 * 1024 * 1024; // 20MB
    result.maxSizeFormatted = '20 MB';

    return result;
  }

  /**
   * Check for malware indicators in filename
   * Detects suspicious patterns and dangerous executable names
   * @param {string} filename - File name to check
   * @returns {object} - Malware check result
   */
  checkMalwareIndicators(filename) {
    const result = {
      isSuspicious: false,
      indicators: [],
      riskLevel: 'safe'
    };

    // Dangerous executable extensions
    const maliciousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr',
      '.vbs', '.js', '.jar', '.zip', '.rar', '.7z',
      '.dll', '.sys', '.ini', '.cfg'
    ];

    const ext = path.extname(filename).toLowerCase();
    if (maliciousExtensions.includes(ext)) {
      result.isSuspicious = true;
      result.indicators.push(`Dangerous executable extension: ${ext}`);
      result.riskLevel = 'high';
    }

    // Check for double extensions (e.g., file.jpg.exe)
    const nameWithoutExt = path.basename(filename, ext);
    const doubleExt = path.extname(nameWithoutExt).toLowerCase();
    if (doubleExt && maliciousExtensions.includes(doubleExt)) {
      result.isSuspicious = true;
      result.indicators.push(`Double extension detected: ${doubleExt}${ext}`);
      result.riskLevel = 'critical';
    }

    // Check for null bytes (potential bypass)
    if (filename.includes('\x00')) {
      result.isSuspicious = true;
      result.indicators.push('Null byte detected in filename');
      result.riskLevel = 'critical';
    }

    // Check for suspicious patterns
    const suspiciousPatterns = /(?:malware|virus|trojan|payload|backdoor|shellcode)/i;
    if (suspiciousPatterns.test(filename)) {
      result.indicators.push('Filename contains suspicious keywords');
      result.riskLevel = Math.max(result.riskLevel === 'safe' ? 0 : (result.riskLevel === 'high' ? 1 : 2), 1);
      result.riskLevel = result.riskLevel === 0 ? 'medium' : (result.riskLevel === 1 ? 'high' : 'critical');
    }

    return result;
  }

  /**
   * Comprehensive security validation including malware check
   * Workflow: Filename → Malware Check → Extension → Size
   * @param {object} file - File object
   * @param {string} category - File category
   * @returns {object} - Complete validation with security details
   */
  validateFileComplete(file, category = null) {
    const result = {
      filename: null,
      category: category,
      isValid: true,
      errors: [],
      warnings: [],
      security: {
        filenameValid: false,
        extensionValid: false,
        mimeValid: false,
        sizeValid: false,
        malwareFree: false
      }
    };

    if (!file) {
      result.isValid = false;
      result.errors.push('No file provided');
      return result;
    }

    result.filename = file.originalname;

    // Step 1: Filename validation
    if (!this.validateFilename(file.originalname)) {
      result.security.filenameValid = false;
      result.errors.push('Invalid filename. Contains forbidden characters');
      result.isValid = false;
    } else {
      result.security.filenameValid = true;
    }

    // Step 2: Malware check
    const malwareCheck = this.checkMalwareIndicators(file.originalname);
    if (malwareCheck.isSuspicious) {
      result.security.malwareFree = false;
      result.errors.push(`Malware indicator detected: ${malwareCheck.indicators.join(', ')}`);
      result.isValid = false;
    } else {
      result.security.malwareFree = true;
    }

    // Step 3: Extension validation
    if (!this.validateExtension(file.originalname)) {
      result.security.extensionValid = false;
      result.errors.push('File extension not allowed');
      result.isValid = false;
    } else {
      result.security.extensionValid = true;
    }

    // Step 4: Category check if provided
    if (category) {
      const fileCategory = this.getFileCategory(file.originalname);
      if (fileCategory !== category) {
        result.errors.push(`File category mismatch. Expected: ${category}, Got: ${fileCategory}`);
        result.isValid = false;
      }
    }

    // Step 5: Size validation
    if (!this.validateSize(file.size)) {
      result.security.sizeValid = false;
      result.errors.push(`File size exceeds limit`);
      result.isValid = false;
    } else {
      result.security.sizeValid = true;
    }

    result.allChecksPassed = Object.values(result.security).every(v => v === true);

    return result;
  }
}

module.exports = FileValidator;