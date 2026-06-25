/**
 * Upload Configuration Module
 * Configures multer middleware for secure file uploads
 */

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const FileValidator = require('./fileValidator');
const MimeChecker = require('./mimeChecker');
const SizeLimiter = require('./sizeLimiter');

class UploadConfig {
  constructor(options = {}) {
    this.uploadDir = options.uploadDir || 'uploads/';
    this.fileValidator = new FileValidator(options.fileValidator || {});
    this.mimeChecker = new MimeChecker(options.mimeChecker || {});
    this.sizeLimiter = new SizeLimiter(options.sizeLimiter || {});
    // Use largest category limit as default
    this.maxFileSize = options.maxFileSize || 50 * 1024 * 1024;
    this.supabaseStorage = {
      url:
        options.supabaseStorage?.url ||
        process.env.SUPABASE_URL ||
        process.env.VITE_SUPABASE_URL ||
        '',
      apiKey:
        options.supabaseStorage?.apiKey ||
        process.env.SUPABASE_STORAGE_API_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY ||
        '',
      bucket:
        options.supabaseStorage?.bucket ||
        process.env.SUPABASE_BUCKET_FILE_SECURITY ||
        process.env.SUPABASE_STORAGE_BUCKET ||
        'file-security',
      folder:
        options.supabaseStorage?.folder ||
        process.env.SUPABASE_STORAGE_FOLDER_FILE_SECURITY ||
        'File security'
    };
  }

  /**
   * Get multer storage configuration
   * @returns {object} - Storage configuration
   */
  getStorageConfig() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueName = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueName}${ext}`);
      }
    });
  }

  /**
   * Get multer memory storage (for processing without disk save)
   * @returns {object} - Memory storage configuration
   */
  getMemoryStorageConfig() {
    return multer.memoryStorage();
  }

  /**
   * Get Supabase Storage configuration for file-security uploads
   * @returns {object} - Storage API configuration
   */
  getSupabaseStorageConfig() {
    return {
      url: this.supabaseStorage.url,
      apiKey: this.supabaseStorage.apiKey,
      bucket: this.supabaseStorage.bucket,
      folder: this.supabaseStorage.folder,
      isConfigured: Boolean(this.supabaseStorage.url && this.supabaseStorage.apiKey)
    };
  }

  /**
   * Build a Supabase Storage object path under the configured folder
   * @param {string} filename - Uploaded filename
   * @param {string} subfolder - Optional nested subfolder
   * @returns {string} - Posix-style storage path
   */
  getSupabaseStoragePath(filename, subfolder = '') {
    const safeName = path.basename(filename || 'upload.bin');
    const segments = [this.supabaseStorage.folder];

    if (subfolder) {
      segments.push(String(subfolder).replace(/[\\/]/g, '-'));
    }

    segments.push(safeName);
    return path.posix.join(...segments.filter(Boolean));
  }

  /**
   * Get multer instance with security filters
   * @param {object} options - Additional options
   * @returns {object} - Multer middleware
   */
  getMulterInstance(options = {}) {
    const storage = options.useMemory 
      ? this.getMemoryStorageConfig() 
      : this.getStorageConfig();

    return multer({
      storage: storage,
      limits: {
        fileSize: this.maxFileSize
      },
      fileFilter: (req, file, cb) => {
        // Get expected category from request (if provided)
        const expectedCategory = options.category || req.query.category || req.body.category;

        // Validate file extension with category
        const extValidation = this.fileValidator.validate(file, expectedCategory);
        if (!extValidation.isValid) {
          const error = new Error(extValidation.errors.join(', '));
          error.supportedFormats = extValidation.supportedFormats;
          return cb(error);
        }

        // Validate MIME type
        const mimeValidation = this.mimeChecker.validate(file);
        if (!mimeValidation.isValid) {
          return cb(new Error(mimeValidation.errors.join(', ')));
        }

        cb(null, true);
      }
    });
  }

  /**
   * Create Express middleware for single file upload
   * @param {string} fieldName - Form field name
   * @returns {function} - Express middleware
   */
  singleFileMiddleware(fieldName = 'file') {
    return this.getMulterInstance().single(fieldName);
  }

  /**
   * Create Express middleware for single file upload with category
   * @param {string} fieldName - Form field name
   * @param {string} category - File category (image, video, audio)
   * @returns {function} - Express middleware
   */
  singleFileMiddlewareWithCategory(fieldName = 'file', category) {
    return this.getMulterInstance({ category }).single(fieldName);
  }

  /**
   * Create Express middleware for multiple files upload with category
   * @param {string} fieldName - Form field name
   * @param {number} maxCount - Maximum number of files
   * @param {string} category - File category (image, video, audio)
   * @returns {function} - Express middleware
   */
  multipleFilesMiddlewareWithCategory(fieldName = 'files', maxCount = 5, category) {
    return this.getMulterInstance({ category }).array(fieldName, maxCount);
  }

  /**
   * Get supported file types
   * @returns {object} - All supported file types by category
   */
  getSupportedFileTypes() {
    return this.fileValidator.getAllSupportedExtensions();
  }
}

module.exports = UploadConfig;