import { SelectedMusic } from "../app/context/music-context";
import { buildApiUrl } from "./api";

/**
 * Export utilities for video with music and captions
 */

export interface CaptionItem {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
}

export interface ExportOptions {
  videoPath: string;
  music?: SelectedMusic;
  captions?: CaptionItem[];
  format?: "mp4" | "webm" | "mov";
  quality?: "high" | "medium" | "low";
  videoDuration: number;
}

export interface ExportResult {
  success: boolean;
  videoPath?: string;
  downloadUrl?: string;
  error?: string;
}

/**
 * Export video with music
 * Handles the complete export flow including audio merging
 */
export async function exportVideoWithMusic(options: ExportOptions): Promise<ExportResult> {
  try {
    const { videoPath, music, videoDuration, format = "mp4", quality = "high" } = options;

    if (!videoPath) {
      return {
        success: false,
        error: "Video path is required",
      };
    }

    let finalVideoPath = videoPath;

    // If music is selected, merge it with the video
    if (music) {
      console.log("🎵 Merging audio with video for export...");

      const formData = new FormData();
      formData.append("videoPath", videoPath);
      formData.append("volume", String(music.volume || 80));
      formData.append("startTime", String(music.startTime || 0));
      formData.append("endTime", String(music.endTime || videoDuration));
      formData.append("muteOriginal", String(music.muteOriginal || false));

      // Add music file or URL
      if (music.file) {
        formData.append("musicFile", music.file);
      } else if (music.url && music.source === "device") {
        // Fetch and convert URL to blob for device uploads
        try {
          const audioBlob = await fetch(music.url).then((res) => res.blob());
          const audioFile = new File([audioBlob], `audio.${getAudioExtension(music.url)}`, {
            type: audioBlob.type,
          });
          formData.append("musicFile", audioFile);
        } catch (e) {
          console.error("Failed to fetch audio file:", e);
          // Continue without music if fetch fails
        }
      } else if (music.url && music.source === "library") {
        // For library tracks, the server will handle the URL
        formData.append("musicUrl", music.url);
      }

      try {
        const response = await fetch(buildApiUrl("/api/merge-audio"), {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Audio merge failed: ${response.statusText}`);
        }

        // Create a blob from the response
        const videoBlob = await response.blob();

        // Create a temporary URL for the merged video
        finalVideoPath = URL.createObjectURL(videoBlob);
        console.log("✅ Audio merged successfully");
      } catch (e) {
        console.error("Failed to merge audio:", e);
        // Continue with video without music
      }
    }

    // Return the final video path
    return {
      success: true,
      videoPath: finalVideoPath,
      downloadUrl: finalVideoPath,
    };
  } catch (error) {
    console.error("Export error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Export failed",
    };
  }
}

/**
 * Get file extension from URL or MIME type
 */
function getAudioExtension(url: string | undefined): string {
  if (!url) return "mp3";

  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split(".").pop()?.toLowerCase();
    if (ext && ["mp3", "wav", "aac", "m4a"].includes(ext)) {
      return ext;
    }
  } catch {}

  return "mp3";
}

/**
 * Download video from blob
 */
export function downloadVideoBlob(blob: Blob, filename: string = "video.mp4"): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Upload exported video to Supabase
 */
export async function burnCaptions(
  videoPath: string,
  captions: CaptionItem[],
  captionStyle?: any
): Promise<Blob> {
  const formData = new FormData();
  formData.append("videoPath", videoPath);
  formData.append("captions", JSON.stringify(captions));
  if (captionStyle) {
    formData.append("captionStyle", JSON.stringify(captionStyle));
  }

  const response = await fetch(buildApiUrl("/api/burn-captions"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Caption burn failed: ${response.statusText}`);
  }

  return await response.blob();
}

export async function uploadExportedVideo(
  blob: Blob,
  filename: string
): Promise<{ publicUrl: string; storagePath: string }> {
  const formData = new FormData();
  formData.append("file", blob);
  formData.append("filename", filename);
  formData.append("bucket", "quick_edits");

  const response = await fetch(buildApiUrl("/api/upload-export"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload exported video");
  }

  return response.json();
}

/**
 * Get export settings from user
 */
export async function getExportSettings(): Promise<Partial<ExportOptions>> {
  // This would typically open a dialog to get export preferences
  // For now, return defaults
  return {
    format: "mp4",
    quality: "high",
  };
}

/**
 * Estimate export file size
 */
export function estimateExportSize(
  videoDuration: number,
  quality: "high" | "medium" | "low" = "high",
  includeAudio: boolean = true
): string {
  // Rough estimation: 1080p @ 30fps
  // High: ~10 Mbps, Medium: ~5 Mbps, Low: ~2 Mbps
  const bitratesPerSecond = {
    high: 10 * 1024 * 1024,
    medium: 5 * 1024 * 1024,
    low: 2 * 1024 * 1024,
  };

  const audioBitrate = includeAudio ? 128 * 1024 : 0; // 128 kbps for audio

  const totalBitrate = (bitratesPerSecond[quality] + audioBitrate) / 8; // Convert to bytes per second
  const sizeBytes = totalBitrate * videoDuration;

  return formatFileSize(sizeBytes);
}

/**
 * Format bytes to human readable size
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
