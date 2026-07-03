import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import fs from "fs";
import path from "path";

// Ensure ffmpeg and ffprobe paths are set
if (ffmpegPath && fs.existsSync(ffmpegPath)) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
if (ffprobePath && fs.existsSync(ffprobePath.path)) {
  ffmpeg.setFfprobePath(ffprobePath.path);
}

/**
 * Applies a specific aspect ratio to a video.
 * @param {string} inputPath - The path to the input video.
 * @param {string} outputPath - The path for the output video.
 * @param {string} aspectRatio - The target aspect ratio (e.g., '16:9', '9:16', '1:1', '4:3', '3:4', '21:9').
 * @returns {Promise<string>} A promise that resolves with the output path when done.
 */
export const applyAspectRatio = (inputPath, outputPath, aspectRatio = "16:9") => {
  return new Promise((resolve, reject) => {
    // Validate aspect ratio
    const validRatios = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"];
    if (!validRatios.includes(aspectRatio)) {
      console.warn(`[Aspect Ratio] Unsupported ratio: ${aspectRatio}. Defaulting to 16:9.`);
      aspectRatio = "16:9";
    }

    console.log(`🎬 [Aspect Ratio] Applying aspect ratio ${aspectRatio} to video...`);
    
    // Parse the aspect ratio to determine crop or scale dimensions
    let width, height;
    
    if (aspectRatio === "16:9") {
      width = 1920; height = 1080;
    } else if (aspectRatio === "9:16") {
      width = 1080; height = 1920;
    } else if (aspectRatio === "1:1") {
      width = 1080; height = 1080;
    } else if (aspectRatio === "4:3") {
      width = 1440; height = 1080;
    } else if (aspectRatio === "3:4") {
      width = 1080; height = 1440;
    } else if (aspectRatio === "21:9") {
      width = 2520; height = 1080;
    } else {
      width = 1920; height = 1080;
    }

    ffmpeg(inputPath)
      .outputOptions([
        "-c:v libx264",
        "-preset ultrafast",
        "-crf 28",
        "-threads 1",
        "-c:a copy",
        // Force the aspect ratio by scaling and cropping to fit precisely
        `-vf scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`
      ])
      .output(outputPath)
      .on("end", () => {
        console.log(`✅ [Aspect Ratio] Video aspect ratio applied successfully: ${aspectRatio}`);
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("❌ [Aspect Ratio] Error applying aspect ratio:", err);
        reject(err);
      })
      .run();
  });
};

export default {
  applyAspectRatio,
};
