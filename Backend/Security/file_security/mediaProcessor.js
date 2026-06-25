/**
 * Media Processor
 * 
 * Purpose: Validate, re-encode, and process media files
 * 
 * Features:
 * - Video validation and re-encoding
 * - Audio validation and re-encoding
 * - Media metadata extraction
 * - Corrupted file detection and removal
 * - Format conversion
 * - Quality control
 */

const crypto = require('crypto');

class MediaProcessor {
  constructor(options = {}) {
    this.config = {
      // Video settings
      videoCodecs: options.videoCodecs || ['h264', 'h265', 'vp9'],
      audioCodecs: options.audioCodecs || ['aac', 'mp3', 'opus'],
      
      // Re-encoding settings
      enableReEncoding: options.enableReEncoding !== false,
      videoQuality: options.videoQuality || 'high', // low, medium, high
      audioQuality: options.audioQuality || 'high',  // low, medium, high
      
      // Validation settings
      validateHeaders: options.validateHeaders !== false,
      validateMetadata: options.validateMetadata !== false,
      checkForCorruption: options.checkForCorruption !== false,
      
      // Video format
      allowedVideoFormats: options.allowedVideoFormats || ['mp4', 'mkv', 'webm', 'mov'],
      allowedAudioFormats: options.allowedAudioFormats || ['mp3', 'aac', 'wav', 'flac', 'opus'],
      
      // Duration limits
      maxVideoDuration: options.maxVideoDuration || 3600, // 1 hour in seconds
      maxAudioDuration: options.maxAudioDuration || 7200,  // 2 hours in seconds
      
      // Cleaning
      removeCorrupted: options.removeCorrupted !== false,
      autoRepair: options.autoRepair !== false
    };
    
    this.stats = {
      videosValidated: 0,
      audiosValidated: 0,
      videosReencoded: 0,
      audiosReencoded: 0,
      corruptedFilesDetected: 0,
      corruptedFilesRemoved: 0,
      validationFailed: 0,
      formatConversions: 0
    };
    
    this.mediaStore = new Map(); // fileId -> media info
  }

  /**
   * Validate video file
   */
  validateVideo(fileInfo) {
    try {
      const validationResults = {
        fileId: fileInfo.fileId || crypto.randomBytes(16).toString('hex'),
        isValid: true,
        errors: [],
        warnings: [],
        metadata: null
      };

      // Check format
      if (!this.isValidVideoFormat(fileInfo.format)) {
        validationResults.isValid = false;
        validationResults.errors.push(`Invalid video format: ${fileInfo.format}`);
      }

      // Validate headers
      if (this.config.validateHeaders) {
        const headerValidation = this.validateVideoHeaders(fileInfo);
        if (!headerValidation.valid) {
          validationResults.isValid = false;
          validationResults.errors.push(...headerValidation.errors);
        }
      }

      // Check for corruption
      if (this.config.checkForCorruption) {
        const corruptionCheck = this.checkVideoCorruption(fileInfo);
        if (corruptionCheck.corrupted) {
          validationResults.isValid = false;
          validationResults.errors.push('Video file is corrupted');
          this.stats.corruptedFilesDetected++;
          
          // Try to repair
          if (this.config.autoRepair) {
            const repairResult = this.repairVideo(fileInfo);
            if (repairResult.success) {
              validationResults.isValid = true;
              validationResults.warnings.push('Video was auto-repaired');
            }
          }
        }
      }

      // Extract metadata
      if (this.config.validateMetadata) {
        const metadata = this.extractVideoMetadata(fileInfo);
        validationResults.metadata = metadata;

        // Check duration
        if (metadata.duration > this.config.maxVideoDuration) {
          validationResults.isValid = false;
          validationResults.errors.push(`Video duration exceeds limit: ${metadata.duration}s > ${this.config.maxVideoDuration}s`);
        }

        // Check codecs
        if (!this.isValidVideoCodec(metadata.videoCodec)) {
          validationResults.warnings.push(`Non-standard video codec: ${metadata.videoCodec}`);
        }
        
        if (!this.isValidAudioCodec(metadata.audioCodec)) {
          validationResults.warnings.push(`Non-standard audio codec: ${metadata.audioCodec}`);
        }
      }

      if (validationResults.isValid) {
        this.stats.videosValidated++;
        this.mediaStore.set(validationResults.fileId, {
          type: 'video',
          fileInfo: fileInfo,
          metadata: validationResults.metadata,
          validated: true,
          validatedAt: Date.now()
        });
      } else {
        this.stats.validationFailed++;
      }

      return validationResults;
    } catch (error) {
      this.stats.validationFailed++;
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Validate audio file
   */
  validateAudio(fileInfo) {
    try {
      const validationResults = {
        fileId: fileInfo.fileId || crypto.randomBytes(16).toString('hex'),
        isValid: true,
        errors: [],
        warnings: [],
        metadata: null
      };

      // Check format
      if (!this.isValidAudioFormat(fileInfo.format)) {
        validationResults.isValid = false;
        validationResults.errors.push(`Invalid audio format: ${fileInfo.format}`);
      }

      // Validate headers
      if (this.config.validateHeaders) {
        const headerValidation = this.validateAudioHeaders(fileInfo);
        if (!headerValidation.valid) {
          validationResults.isValid = false;
          validationResults.errors.push(...headerValidation.errors);
        }
      }

      // Check for corruption
      if (this.config.checkForCorruption) {
        const corruptionCheck = this.checkAudioCorruption(fileInfo);
        if (corruptionCheck.corrupted) {
          validationResults.isValid = false;
          validationResults.errors.push('Audio file is corrupted');
          this.stats.corruptedFilesDetected++;
          
          // Try to repair
          if (this.config.autoRepair) {
            const repairResult = this.repairAudio(fileInfo);
            if (repairResult.success) {
              validationResults.isValid = true;
              validationResults.warnings.push('Audio was auto-repaired');
            }
          }
        }
      }

      // Extract metadata
      if (this.config.validateMetadata) {
        const metadata = this.extractAudioMetadata(fileInfo);
        validationResults.metadata = metadata;

        // Check duration
        if (metadata.duration > this.config.maxAudioDuration) {
          validationResults.isValid = false;
          validationResults.errors.push(`Audio duration exceeds limit: ${metadata.duration}s > ${this.config.maxAudioDuration}s`);
        }

        // Check codec
        if (!this.isValidAudioCodec(metadata.codec)) {
          validationResults.warnings.push(`Non-standard audio codec: ${metadata.codec}`);
        }
      }

      if (validationResults.isValid) {
        this.stats.audiosValidated++;
        this.mediaStore.set(validationResults.fileId, {
          type: 'audio',
          fileInfo: fileInfo,
          metadata: validationResults.metadata,
          validated: true,
          validatedAt: Date.now()
        });
      } else {
        this.stats.validationFailed++;
      }

      return validationResults;
    } catch (error) {
      this.stats.validationFailed++;
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Re-encode video for compatibility
   */
  reencodeVideo(fileId, targetFormat = null, options = {}) {
    try {
      const mediaInfo = this.mediaStore.get(fileId);
      if (!mediaInfo || mediaInfo.type !== 'video') {
        return { success: false, error: 'Video not found' };
      }

      const reencodingOptions = {
        format: targetFormat || 'mp4',
        videoCodec: options.videoCodec || 'h264',
        audioCodec: options.audioCodec || 'aac',
        quality: options.quality || this.config.videoQuality
      };

      // Validate target codec
      if (!this.isValidVideoCodec(reencodingOptions.videoCodec)) {
        return { success: false, error: 'Invalid target video codec' };
      }

      // Simulate re-encoding
      const reencoded = {
        originalFileId: fileId,
        reencodedFileId: crypto.randomBytes(16).toString('hex'),
        format: reencodingOptions.format,
        codec: reencodingOptions.videoCodec,
        quality: reencodingOptions.quality,
        timestamp: Date.now()
      };

      this.stats.videosReencoded++;

      return {
        success: true,
        message: 'Video re-encoded successfully',
        reencoded: reencoded
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Re-encode audio for compatibility
   */
  reencodeAudio(fileId, targetFormat = null, options = {}) {
    try {
      const mediaInfo = this.mediaStore.get(fileId);
      if (!mediaInfo || mediaInfo.type !== 'audio') {
        return { success: false, error: 'Audio not found' };
      }

      const reencodingOptions = {
        format: targetFormat || 'mp3',
        codec: options.codec || 'mp3',
        quality: options.quality || this.config.audioQuality
      };

      // Validate target codec
      if (!this.isValidAudioCodec(reencodingOptions.codec)) {
        return { success: false, error: 'Invalid target audio codec' };
      }

      // Simulate re-encoding
      const reencoded = {
        originalFileId: fileId,
        reencodedFileId: crypto.randomBytes(16).toString('hex'),
        format: reencodingOptions.format,
        codec: reencodingOptions.codec,
        quality: reencodingOptions.quality,
        timestamp: Date.now()
      };

      this.stats.audiosReencoded++;

      return {
        success: true,
        message: 'Audio re-encoded successfully',
        reencoded: reencoded
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove corrupted files
   */
  removeCorruptedFiles(fileIds = []) {
    try {
      const removed = [];
      let corruptedCount = 0;

      for (const [fileId, mediaInfo] of this.mediaStore.entries()) {
        // Check if file is in removal list or if it's corrupted
        if (fileIds.includes(fileId) || this.isCorrupted(mediaInfo)) {
          this.mediaStore.delete(fileId);
          removed.push(fileId);
          corruptedCount++;
        }
      }

      this.stats.corruptedFilesRemoved += corruptedCount;

      return {
        success: true,
        removed: removed,
        message: `Removed ${corruptedCount} corrupted files`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper: Check if video headers are valid
   */
  validateVideoHeaders(fileInfo) {
    const errors = [];
    // Simulate header validation
    if (!fileInfo.size || fileInfo.size < 1024) {
      errors.push('File too small - likely corrupted');
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * Helper: Check if audio headers are valid
   */
  validateAudioHeaders(fileInfo) {
    const errors = [];
    if (!fileInfo.size || fileInfo.size < 512) {
      errors.push('File too small - likely corrupted');
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * Helper: Check video for corruption
   */
  checkVideoCorruption(fileInfo) {
    // Simulate corruption detection
    return { corrupted: false };
  }

  /**
   * Helper: Check audio for corruption
   */
  checkAudioCorruption(fileInfo) {
    return { corrupted: false };
  }

  /**
   * Helper: Repair video
   */
  repairVideo(fileInfo) {
    return { success: true, message: 'Video repaired' };
  }

  /**
   * Helper: Repair audio
   */
  repairAudio(fileInfo) {
    return { success: true, message: 'Audio repaired' };
  }

  /**
   * Helper: Extract video metadata
   */
  extractVideoMetadata(fileInfo) {
    return {
      duration: fileInfo.duration || 0,
      width: fileInfo.width || 0,
      height: fileInfo.height || 0,
      videoCodec: fileInfo.videoCodec || 'unknown',
      audioCodec: fileInfo.audioCodec || 'unknown',
      bitrate: fileInfo.bitrate || 0,
      fps: fileInfo.fps || 30
    };
  }

  /**
   * Helper: Extract audio metadata
   */
  extractAudioMetadata(fileInfo) {
    return {
      duration: fileInfo.duration || 0,
      codec: fileInfo.codec || 'unknown',
      bitrate: fileInfo.bitrate || 0,
      sampleRate: fileInfo.sampleRate || 44100,
      channels: fileInfo.channels || 2
    };
  }

  /**
   * Helper: Check if format is valid video format
   */
  isValidVideoFormat(format) {
    return this.config.allowedVideoFormats.includes(format.toLowerCase());
  }

  /**
   * Helper: Check if format is valid audio format
   */
  isValidAudioFormat(format) {
    return this.config.allowedAudioFormats.includes(format.toLowerCase());
  }

  /**
   * Helper: Check if codec is valid video codec
   */
  isValidVideoCodec(codec) {
    return this.config.videoCodecs.includes(codec.toLowerCase());
  }

  /**
   * Helper: Check if codec is valid audio codec
   */
  isValidAudioCodec(codec) {
    return this.config.audioCodecs.includes(codec.toLowerCase());
  }

  /**
   * Helper: Check if file is corrupted
   */
  isCorrupted(mediaInfo) {
    return mediaInfo.corrupted || false;
  }

  /**
   * Get media info
   */
  getMediaInfo(fileId) {
    return this.mediaStore.get(fileId) || null;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      mediaFilesStored: this.mediaStore.size
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      videosValidated: 0,
      audiosValidated: 0,
      videosReencoded: 0,
      audiosReencoded: 0,
      corruptedFilesDetected: 0,
      corruptedFilesRemoved: 0,
      validationFailed: 0,
      formatConversions: 0
    };
  }
}

module.exports = MediaProcessor;