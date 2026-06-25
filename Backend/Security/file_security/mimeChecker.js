/**
 * MIME Type Checker Module
 * Validates file MIME types for security and detects file spoofing
 */

// Comprehensive MIME type to extension mapping for video editing project
const mimeTypes = {
  // Image files
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  
  // Video files
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/webm': ['.webm'],
  'video/x-matroska': ['.mkv'],
  
  // Audio files
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/mp4': ['.m4a'],
  'audio/aac': ['.aac']
};

// Reverse mapping: extension to allowed MIME types
const extensionToMime = {};
for (const [mime, exts] of Object.entries(mimeTypes)) {
  for (const ext of exts) {
    if (!extensionToMime[ext]) {
      extensionToMime[ext] = [];
    }
    extensionToMime[ext].push(mime);
  }
}

class MimeChecker {
  constructor(options = {}) {
    this.allowedMimes = options.allowedMimes || Object.keys(mimeTypes);
    this.strictMode = options.strictMode !== false;
    this.extensionToMime = extensionToMime;
  }

  /**
   * Get allowed extensions for a MIME type
   * @param {string} mimeType - MIME type to check
   * @returns {array} - Array of allowed extensions
   */
  getExtensionsForMime(mimeType) {
    return mimeTypes[mimeType] || [];
  }

  /**
   * Validate MIME type
   * @param {string} mimeType - MIME type of the file
   * @returns {boolean} - True if MIME type is allowed
   */
  validateMime(mimeType) {
    return this.allowedMimes.includes(mimeType);
  }

  /**
   * Validate file extension matches MIME type
   * @param {string} ext - File extension
   * @param {string} mimeType - MIME type
   * @returns {boolean} - True if extension matches MIME type
   */
  validateMimeExtensionMatch(ext, mimeType) {
    const extensions = this.getExtensionsForMime(mimeType);
    return extensions.includes(ext.toLowerCase());
  }

  /**
   * Detect if file has been spoofed (renamed with wrong extension)
   * @param {string} extension - Claimed file extension
   * @param {string} mimeType - Detected MIME type
   * @returns {object} - Spoofing detection result
   */
  detectFileSpoofing(extension, mimeType) {
    const result = {
      isSpoofed: false,
      detectedExtension: null,
      expectedExtensions: [],
      warning: null
    };

    if (!extension || !mimeType) {
      return result;
    }

    const ext = extension.toLowerCase();
    const allowedExtensionsForMime = this.getExtensionsForMime(mimeType);

    // Check if claimed extension matches detected MIME type
    if (!allowedExtensionsForMime.includes(ext)) {
      result.isSpoofed = true;
      result.detectedExtension = allowedExtensionsForMime[0] || 'unknown';
      result.expectedExtensions = allowedExtensionsForMime;
      result.warning = `File spoofing detected! Claimed extension "${ext}" doesn't match detected MIME type "${mimeType}". Expected: ${allowedExtensionsForMime.join(', ')}`;
      return result;
    }

    return result;
  }

  /**
   * Comprehensive MIME validation with spoofing detection
   * @param {object} file - File object
   * @returns {object} - Validation result
   */
  validate(file) {
    const result = {
      isValid: true,
      errors: [],
      spoofingDetected: false
    };

    if (!file) {
      result.isValid = false;
      result.errors.push('No file provided');
      return result;
    }

    const ext = file.originalname.substring(file.originalname.lastIndexOf('.'));

    // Check MIME type
    if (!this.validateMime(file.mimetype)) {
      result.isValid = false;
      result.errors.push(`MIME type '${file.mimetype}' not allowed`);
    }

    // Detect file spoofing (e.g., virus.exe renamed as photo.jpg)
    const spoofingCheck = this.detectFileSpoofing(ext, file.mimetype);
    if (spoofingCheck.isSpoofed) {
      result.isValid = false;
      result.spoofingDetected = true;
      result.errors.push(spoofingCheck.warning);
    }

    // In strict mode, verify extension matches MIME type
    if (this.strictMode && !spoofingCheck.isSpoofed) {
      if (!this.validateMimeExtensionMatch(ext, file.mimetype)) {
        result.isValid = false;
        result.errors.push(`Extension '${ext}' does not match MIME type '${file.mimetype}'`);
      }
    }

    return result;
  }

  /**
   * Check MIME type validity
   * Simpler check function for basic MIME validation
   * @param {string} mimeType - MIME type to check
   * @returns {object} - Check result
   */
  checkMime(mimeType) {
    const result = {
      isValid: false,
      mimeType: mimeType,
      isAllowed: false,
      message: ''
    };

    if (!mimeType) {
      result.message = 'MIME type not provided';
      return result;
    }

    result.isAllowed = this.validateMime(mimeType);
    result.isValid = result.isAllowed;

    if (result.isAllowed) {
      result.message = `MIME type '${mimeType}' is allowed`;
      const extensions = this.getExtensionsForMime(mimeType);
      result.allowedExtensions = extensions;
    } else {
      result.message = `MIME type '${mimeType}' is not allowed`;
      result.allowedMimes = this.allowedMimes;
    }

    return result;
  }

  /**
   * Verify MIME type matches claimed extension
   * Detects fake/spoofed files like virus.exe renamed to photo.jpg
   * @param {string} extension - Claimed file extension
   * @param {string} detectedMimeType - Actual detected MIME type
   * @returns {object} - Verification result
   */
  verifyMime(extension, detectedMimeType) {
    const result = {
      isVerified: false,
      extension: extension,
      detectedMimeType: detectedMimeType,
      isSpoofed: false,
      message: '',
      details: {}
    };

    if (!extension || !detectedMimeType) {
      result.message = 'Extension and MIME type are required';
      return result;
    }

    // Detect spoofing
    const spoofingCheck = this.detectFileSpoofing(extension, detectedMimeType);

    if (spoofingCheck.isSpoofed) {
      result.isVerified = false;
      result.isSpoofed = true;
      result.message = spoofingCheck.warning;
      result.details = {
        claimedExtension: extension,
        detectedMimeType: detectedMimeType,
        expectedExtensions: spoofingCheck.expectedExtensions,
        riskLevel: 'HIGH - File spoofing detected'
      };
      return result;
    }

    // Verify match
    const isMatch = this.validateMimeExtensionMatch(extension, detectedMimeType);

    if (isMatch) {
      result.isVerified = true;
      result.message = `MIME type '${detectedMimeType}' matches extension '${extension}'`;
      result.details = {
        match: true,
        extension: extension,
        mimeType: detectedMimeType
      };
    } else {
      result.isVerified = false;
      result.message = `MIME type '${detectedMimeType}' does not match extension '${extension}'`;
      result.details = {
        match: false,
        claimedExtension: extension,
        detectedMimeType: detectedMimeType,
        expectedExtensions: this.getExtensionsForMime(detectedMimeType)
      };
    }

    return result;
  }

  /**
   * Detect dangerous/malicious MIME types
   * @param {string} mimeType - MIME type to check
   * @returns {object} - Detection result
   */
  detectDangerousMime(mimeType) {
    const result = {
      isDangerous: false,
      mimeType: mimeType,
      riskLevel: 'safe',
      warning: null
    };

    // Dangerous MIME types
    const dangerousMimes = [
      'application/octet-stream',      // Binary executable
      'application/x-msdownload',      // Windows executable
      'application/x-msdos-program',   // DOS executable
      'application/x-executable',      // Generic executable
      'application/x-elf',             // ELF executable
      'application/x-archive',         // Archive (potential payload)
      'application/x-zip-compressed',  // ZIP (potential payload)
      'application/x-rar-compressed',  // RAR (potential payload)
      'application/x-7z-compressed',   // 7Z (potential payload)
      'application/x-gzip',            // GZIP (potential payload)
      'application/x-tar'              // TAR (potential payload)
    ];

    if (dangerousMimes.includes(mimeType)) {
      result.isDangerous = true;
      result.riskLevel = 'high';
      result.warning = `Dangerous MIME type detected: ${mimeType}`;
      return result;
    }

    return result;
  }
}
module.exports = MimeChecker;