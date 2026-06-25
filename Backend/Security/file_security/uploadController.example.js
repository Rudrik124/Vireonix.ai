/**
 * Example Upload Controller
 * Demonstrates complete file upload security implementation
 * 
 * Features:
 * - Category-based file validation (image, video, audio)
 * - MIME type spoofing detection
 * - Category-specific size limits
 * - Comprehensive error handling
 */

const express = require('express');
const UploadConfig = require('../uploadConfig');

const router = express.Router();
const uploadConfig = new UploadConfig({
  uploadDir: 'uploads/',
  supabaseStorage: {
    bucket: process.env.SUPABASE_BUCKET_FILE_SECURITY || 'file-security',
    folder: process.env.SUPABASE_STORAGE_FOLDER_FILE_SECURITY || 'File security'
  },
  sizeLimiter: {
    categoryLimits: {
      image: 20 * 1024 * 1024,    // 20MB
      audio: 20 * 1024 * 1024,    // 20MB
      video: 50 * 1024 * 1024     // 50MB
    }
  }
});

/**
 * Upload Image
 * POST /upload/image
 */
router.post('/upload/image', uploadConfig.singleFileMiddlewareWithCategory('file', 'image'), (req, res) => {
  res.json({
    success: true,
    message: 'Image uploaded successfully',
    file: {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

/**
 * Upload Video
 * POST /upload/video
 */
router.post('/upload/video', uploadConfig.singleFileMiddlewareWithCategory('file', 'video'), (req, res) => {
  res.json({
    success: true,
    message: 'Video uploaded successfully',
    file: {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

/**
 * Upload Audio
 * POST /upload/audio
 */
router.post('/upload/audio', uploadConfig.singleFileMiddlewareWithCategory('file', 'audio'), (req, res) => {
  res.json({
    success: true,
    message: 'Audio uploaded successfully',
    file: {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

/**
 * Error Handler Middleware
 * Handles all file upload validation errors
 */
router.use((err, req, res, next) => {
  if (err.message && err.message.includes('spoofing')) {
    // File spoofing detected (e.g., virus.exe renamed as photo.jpg)
    return res.status(403).json({
      success: false,
      error: 'Security Alert: File Spoofing Detected',
      message: 'This appears to be a spoofed file. The claimed file type doesn\'t match the actual content.',
      code: 'SPOOFING_DETECTED',
      details: err.message,
      recommendation: 'Please upload a valid file of the correct type'
    });
  }

  if (err.message && err.message.includes('exceed')) {
    // File size exceeds limit
    return res.status(413).json({
      success: false,
      error: 'File Too Large',
      message: err.message,
      code: 'FILE_TOO_LARGE',
      supportedLimits: uploadConfig.uploadConfig.sizeLimiter?.getCategoryLimits?.()
    });
  }

  if (err.message && (err.message.includes('not allowed') || err.message.includes('support'))) {
    // Unsupported file type
    return res.status(400).json({
      success: false,
      error: 'Unsupported File Type',
      message: err.message,
      code: 'UNSUPPORTED_FILE_TYPE',
      supportedFormats: uploadConfig.getSupportedFileTypes()
    });
  }

  // Generic error
  res.status(400).json({
    success: false,
    error: 'Upload Failed',
    message: err.message || 'An error occurred during file upload',
    code: 'UPLOAD_ERROR'
  });
});

/**
 * Get Supported Formats
 * GET /api/supported-formats
 */
router.get('/api/supported-formats', (req, res) => {
  res.json({
    formats: uploadConfig.getSupportedFileTypes(),
    sizeLimits: uploadConfig.uploadConfig?.sizeLimiter?.getCategoryLimits?.(),
    info: {
      image: {
        extensions: ['jpg', 'jpeg', 'png', 'webp'],
        maxSize: '20 MB'
      },
      video: {
        extensions: ['mp4', 'mov', 'webm', 'mkv'],
        maxSize: '50 MB'
      },
      audio: {
        extensions: ['mp3', 'wav', 'm4a', 'aac'],
        maxSize: '20 MB'
      }
    }
  });
});

module.exports = router;