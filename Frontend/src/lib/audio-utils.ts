import { SelectedMusic } from "../app/context/music-context";
import { buildApiUrl } from './api';

/**
 * Audio processing utilities for video export with music
 */

export interface AudioMergeParams {
  videoPath: string;
  musicFile?: File;
  musicUrl?: string;
  volume?: number; // 0-100
  startTime?: number; // trim start
  endTime?: number; // trim end
  muteOriginal?: boolean;
}

export interface AudioExportConfig {
  music?: SelectedMusic;
  videoDuration: number;
}

/**
 * Prepare audio data for export
 * Sends music file to backend for merging with video
 */
export async function prepareAudioForExport(
  config: AudioExportConfig
): Promise<{ musicData?: FormData; config: AudioExportConfig }> {
  if (!config.music) {
    return { config };
  }

  const formData = new FormData();
  const music = config.music;

  // Add music file
  if (music.file) {
    formData.append("musicFile", music.file);
  } else if (music.url) {
    formData.append("musicUrl", music.url);
  }

  // Add audio parameters
  formData.append("volume", String(music.volume || 80));
  formData.append("startTime", String(music.startTime || 0));
  formData.append("endTime", String(music.endTime || config.videoDuration));
  formData.append("muteOriginal", String(music.muteOriginal || false));

  return { musicData: formData, config };
}


/**
 * Merge video with audio during export
 * Call on backend endpoint
 */
export async function mergeVideoWithAudio(
  videoPath: string,
  musicFile?: File,
  options?: {
    volume?: number;
    startTime?: number;
    endTime?: number;
    muteOriginal?: boolean;
  }
): Promise<Blob> {
  const formData = new FormData();
  formData.append("videoPath", videoPath);

  if (musicFile) {
    formData.append("musicFile", musicFile);
  }

  if (options) {
    if (options.volume !== undefined) formData.append("volume", String(options.volume));
    if (options.startTime !== undefined) formData.append("startTime", String(options.startTime));
    if (options.endTime !== undefined) formData.append("endTime", String(options.endTime));
    if (options.muteOriginal !== undefined) formData.append("muteOriginal", String(options.muteOriginal));
  }

  const response = await fetch(buildApiUrl("/api/merge-audio"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to merge audio: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Get audio duration from file
 */
export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => resolve(audio.duration);
    audio.onerror = () => reject(new Error("Failed to load audio metadata"));
    audio.src = URL.createObjectURL(file);
  });
}

/**
 * Get audio duration from URL
 */
export async function getAudioDurationFromUrl(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.onloadedmetadata = () => resolve(audio.duration);
    audio.onerror = () => reject(new Error("Failed to load audio from URL"));
    audio.src = url;
  });
}

/**
 * Validate audio file
 */
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ["audio/mpeg", "audio/wav", "audio/aac", "audio/mp4"];
  const validExtensions = [".mp3", ".wav", ".aac", ".m4a"];

  if (!validTypes.includes(file.type)) {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      return {
        valid: false,
        error: "Unsupported audio format. Please use MP3, WAV, or AAC.",
      };
    }
  }

  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds 100MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Create audio preview blob for preview
 */
export async function createAudioPreview(
  file: File | string,
  startTime: number,
  endTime: number,
  volume: number
): Promise<Blob> {
  // This would typically be done on the backend with FFmpeg
  // For now, we'll just return a placeholder that indicates processing
  const formData = new FormData();

  if (typeof file === "string") {
    formData.append("audioUrl", file);
  } else {
    formData.append("audioFile", file);
  }

  formData.append("startTime", String(startTime));
  formData.append("endTime", String(endTime));
  formData.append("volume", String(volume));

  const response = await fetch(buildApiUrl("/api/process-audio-preview"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to create audio preview");
  }

  return response.blob();
}

/**
 * Convert audio format
 * Useful for ensuring compatibility
 */
export async function convertAudioFormat(
  file: File,
  targetFormat: "mp3" | "wav" | "aac" = "mp3"
): Promise<Blob> {
  const formData = new FormData();
  formData.append("audioFile", file);
  formData.append("format", targetFormat);

  const response = await fetch(buildApiUrl("/api/convert-audio"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to convert audio to ${targetFormat}`);
  }

  return response.blob();
}
