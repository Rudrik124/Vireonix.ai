/**
 * Size Limiter Module
 * Enforces file size limits with various strategies
 */

class SizeLimiter {
  constructor(options = {}) {
    // Category-based size limits for video editing project
    this.categoryLimits = options.categoryLimits || {
      image: 20 * 1024 * 1024,    // 20MB
      audio: 20 * 1024 * 1024,    // 20MB
      video: 50 * 1024 * 1024     // 50MB
    };

    this.maxFileSize = options.maxFileSize || 50 * 1024 * 1024; // 50MB default
    this.maxTotalSize = options.maxTotalSize || 500 * 1024 * 1024; // 500MB
    this.fileSizeLimits = options.fileSizeLimits || {}; // Per-type limits (deprecated, use categoryLimits)
  }

  /**
   * Check single file size with category support
   * @param {number} fileSize - Size of file in bytes
   * @param {string} mimeType - MIME type of file (optional)
   * @param {string} category - File category (image, video, audio)
   * @returns {object} - Result with status and message
   */
  checkFileSize(fileSize, mimeType, category) {
    const result = {
      isValid: true,
      message: '',
      limit: null
    };

    // Check category-based limit first
    if (category && this.categoryLimits[category]) {
      const limit = this.categoryLimits[category];
      result.limit = limit;
      if (fileSize > limit) {
        result.isValid = false;
        result.message = `${category.charAt(0).toUpperCase() + category.slice(1)} file exceeds size limit of ${this.formatBytes(limit)}`;
        return result;
      }
    }

    // Check if specific MIME type has custom limit
    if (mimeType && this.fileSizeLimits[mimeType]) {
      const limit = this.fileSizeLimits[mimeType];
      result.limit = limit;
      if (fileSize > limit) {
        result.isValid = false;
        result.message = `File exceeds size limit of ${this.formatBytes(limit)} for type ${mimeType}`;
        return result;
      }
    }

    // Check default file size limit
    result.limit = this.maxFileSize;
    if (fileSize > this.maxFileSize) {
      result.isValid = false;
      result.message = `File exceeds maximum size of ${this.formatBytes(this.maxFileSize)}`;
    }

    return result;
  }

  /**
   * Check total size of multiple files
   * @param {array} files - Array of file size values
   * @returns {object} - Result with status and message
   */
  checkTotalSize(files) {
    const result = {
      isValid: true,
      totalSize: 0,
      message: ''
    };

    const totalSize = files.reduce((sum, file) => sum + file, 0);
    result.totalSize = totalSize;

    if (totalSize > this.maxTotalSize) {
      result.isValid = false;
      result.message = `Total size ${this.formatBytes(totalSize)} exceeds limit of ${this.formatBytes(this.maxTotalSize)}`;
    }

    return result;
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes - Number of bytes
   * @returns {string} - Formatted size string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get remaining quota
   * @param {number} usedSize - Already used size in bytes
   * @returns {object} - Quota information
   */
  getQuotaInfo(usedSize) {
    return {
      maxTotalSize: this.maxTotalSize,
      usedSize: usedSize,
      remainingSize: Math.max(0, this.maxTotalSize - usedSize),
      percentageUsed: (usedSize / this.maxTotalSize * 100).toFixed(2)
    };
  }

  /**
   * Get category-based size limits
   * @returns {object} - Size limits by category
   */
  getCategoryLimits() {
    const limits = {};
    for (const [category, limit] of Object.entries(this.categoryLimits)) {
      limits[category] = {
        bytes: limit,
        formatted: this.formatBytes(limit)
      };
    }
    return limits;
  }

  /**
   * Get size limit for a category
   * @param {string} category - Category name (image, video, audio)
   * @returns {number} - Size limit in bytes
   */
  getCategoryLimit(category) {
    return this.categoryLimits[category] || this.maxFileSize;
  }

  /**
   * Get size limit info by category
   * @param {string} category - Category name
   * @returns {object} - Category limit information
   */
  getCategoryLimitInfo(category) {
    const limit = this.getCategoryLimit(category);
    return {
      category: category,
      limit: limit,
      formatted: this.formatBytes(limit),
      warning: `Maximum ${category} file size is ${this.formatBytes(limit)}`
    };
  }

  /**
   * Check image file size
   * Max: 20 MB
   * @param {number} fileSize - Size of file in bytes
   * @returns {object} - Check result
   */
  checkImageSize(fileSize) {
    const result = {
      category: 'image',
      fileSize: fileSize,
      fileSizeFormatted: this.formatBytes(fileSize),
      isValid: true,
      message: '',
      limit: this.categoryLimits.image,
      limitFormatted: this.formatBytes(this.categoryLimits.image)
    };

    if (fileSize > this.categoryLimits.image) {
      result.isValid = false;
      result.message = `Image file size ${result.fileSizeFormatted} exceeds the maximum limit of ${result.limitFormatted}`;
    } else {
      result.message = `Image size is valid (${result.fileSizeFormatted} / ${result.limitFormatted})`;
      result.percentageUsed = ((fileSize / this.categoryLimits.image) * 100).toFixed(2);
      result.remainingSize = this.categoryLimits.image - fileSize;
      result.remainingSizeFormatted = this.formatBytes(result.remainingSize);
    }

    return result;
  }

  /**
   * Check video file size
   * Max: 50 MB
   * @param {number} fileSize - Size of file in bytes
   * @returns {object} - Check result
   */
  checkVideoSize(fileSize) {
    const result = {
      category: 'video',
      fileSize: fileSize,
      fileSizeFormatted: this.formatBytes(fileSize),
      isValid: true,
      message: '',
      limit: this.categoryLimits.video,
      limitFormatted: this.formatBytes(this.categoryLimits.video)
    };

    if (fileSize > this.categoryLimits.video) {
      result.isValid = false;
      result.message = `Video file size ${result.fileSizeFormatted} exceeds the maximum limit of ${result.limitFormatted}`;
    } else {
      result.message = `Video size is valid (${result.fileSizeFormatted} / ${result.limitFormatted})`;
      result.percentageUsed = ((fileSize / this.categoryLimits.video) * 100).toFixed(2);
      result.remainingSize = this.categoryLimits.video - fileSize;
      result.remainingSizeFormatted = this.formatBytes(result.remainingSize);
    }

    return result;
  }

  /**
   * Check audio file size
   * Max: 20 MB
   * @param {number} fileSize - Size of file in bytes
   * @returns {object} - Check result
   */
  checkAudioSize(fileSize) {
    const result = {
      category: 'audio',
      fileSize: fileSize,
      fileSizeFormatted: this.formatBytes(fileSize),
      isValid: true,
      message: '',
      limit: this.categoryLimits.audio,
      limitFormatted: this.formatBytes(this.categoryLimits.audio)
    };

    if (fileSize > this.categoryLimits.audio) {
      result.isValid = false;
      result.message = `Audio file size ${result.fileSizeFormatted} exceeds the maximum limit of ${result.limitFormatted}`;
    } else {
      result.message = `Audio size is valid (${result.fileSizeFormatted} / ${result.limitFormatted})`;
      result.percentageUsed = ((fileSize / this.categoryLimits.audio) * 100).toFixed(2);
      result.remainingSize = this.categoryLimits.audio - fileSize;
      result.remainingSizeFormatted = this.formatBytes(result.remainingSize);
    }

    return result;
  }
}

module.exports = SizeLimiter;