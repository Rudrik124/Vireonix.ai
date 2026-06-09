// Enhanced video rendering with Ken Burns effect, pan, and fade transitions

import { createCanvas } from "canvas";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Download image from URL to temporary file
 * @param {string} imageUrl - URL of the image
 * @param {string} tempDir - Temporary directory
 * @returns {Promise<string>} - Path to downloaded image
 */
async function downloadImage(imageUrl, tempDir) {
  try {
    const response = await fetch(imageUrl, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const tempPath = path.join(tempDir, `image-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);

    fs.writeFileSync(tempPath, Buffer.from(buffer));
    return tempPath;
  } catch (error) {
    console.warn(`⚠️ Failed to download image ${imageUrl}:`, error.message);
    return null;
  }
}

/**
 * Load image from file path using Canvas
 * @param {string} imagePath - Path to image file
 * @returns {Promise<Image>} - Canvas image object
 */
async function loadCanvasImage(imagePath) {
  const Image = require("canvas").Image;
  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imagePath;
  });
}

/**
 * Calculate Ken Burns zoom effect
 * @param {number} progress - Animation progress (0 to 1)
 * @param {number} scaleStart - Starting scale
 * @param {number} scaleEnd - Ending scale
 * @returns {number} - Current scale value
 */
function calculateZoomScale(progress, scaleStart = 1.0, scaleEnd = 1.15) {
  return scaleStart + (scaleEnd - scaleStart) * progress;
}

/**
 * Calculate pan offset (subtle movement)
 * @param {number} progress - Animation progress (0 to 1)
 * @param {number} maxOffsetX - Maximum horizontal offset in pixels
 * @param {number} maxOffsetY - Maximum vertical offset in pixels
 * @returns {{x: number, y: number}} - Current pan offset
 */
function calculatePanOffset(progress, maxOffsetX = 40, maxOffsetY = 30) {
  return {
    x: maxOffsetX * Math.sin(progress * Math.PI),
    y: maxOffsetY * Math.sin(progress * Math.PI * 0.7),
  };
}

/**
 * Render frame with Ken Burns effect (zoom + pan)
 * @param {Canvas} canvas - Canvas object
 * @param {Image} image - Canvas image
 * @param {number} frameIndex - Frame index in sequence
 * @param {number} totalFrames - Total frames for this image
 * @param {Object} options - Animation options
 */
function renderMotionFrame(canvas, image, frameIndex, totalFrames, options = {}) {
  const ctx = canvas.getContext("2d");
  const { scaleStart = 1.0, scaleEnd = 1.15, enablePan = true } = options;

  // Calculate animation progress (0 to 1)
  const progress = frameIndex / (totalFrames - 1);

  // Black background
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate zoom (Ken Burns effect)
  const scale = calculateZoomScale(progress, scaleStart, scaleEnd);

  // Calculate pan offset
  const pan = enablePan ? calculatePanOffset(progress) : { x: 0, y: 0 };

  // Center position with pan
  const centerX = canvas.width / 2 + pan.x;
  const centerY = canvas.height / 2 + pan.y;

  // Calculate aspect ratios for proper fit
  const imageAspect = image.width / image.height;
  const canvasAspect = canvas.width / canvas.height;

  let drawWidth, drawHeight;

  if (imageAspect > canvasAspect) {
    // Image is wider - fit to height
    drawHeight = canvas.height;
    drawWidth = drawHeight * imageAspect;
  } else {
    // Image is taller - fit to width
    drawWidth = canvas.width;
    drawHeight = drawWidth / imageAspect;
  }

  // Apply scale
  drawWidth *= scale;
  drawHeight *= scale;

  // Draw image centered with motion
  ctx.drawImage(image, centerX - drawWidth / 2, centerY - drawHeight / 2, drawWidth, drawHeight);
}

/**
 * Render fade transition frame
 * @param {Canvas} canvas - Canvas object
 * @param {Image} image1 - Current image
 * @param {Image} image2 - Next image
 * @param {number} progress - Transition progress (0 to 1)
 */
function renderFadeTransition(canvas, image1, image2, progress) {
  const ctx = canvas.getContext("2d");

  // Black background
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const imageAspect1 = image1.width / image1.height;
  const canvasAspect = canvas.width / canvas.height;

  let drawWidth1, drawHeight1;
  if (imageAspect1 > canvasAspect) {
    drawHeight1 = canvas.height;
    drawWidth1 = drawHeight1 * imageAspect1;
  } else {
    drawWidth1 = canvas.width;
    drawHeight1 = drawWidth1 / imageAspect1;
  }

  // Image 1 with decreasing opacity
  ctx.globalAlpha = 1 - progress;
  ctx.drawImage(image1, canvas.width / 2 - drawWidth1 / 2, canvas.height / 2 - drawHeight1 / 2, drawWidth1, drawHeight1);

  // Image 2 with increasing opacity
  const imageAspect2 = image2.width / image2.height;
  let drawWidth2, drawHeight2;
  if (imageAspect2 > canvasAspect) {
    drawHeight2 = canvas.height;
    drawWidth2 = drawHeight2 * imageAspect2;
  } else {
    drawWidth2 = canvas.width;
    drawHeight2 = drawWidth2 / imageAspect2;
  }

  ctx.globalAlpha = progress;
  ctx.drawImage(image2, canvas.width / 2 - drawWidth2 / 2, canvas.height / 2 - drawHeight2 / 2, drawWidth2, drawHeight2);

  ctx.globalAlpha = 1;
}

/**
 * Create cinematic video with Ken Burns effect, pan, and fade transitions
 * @param {Array<string>} imageUrls - Array of image URLs
 * @param {string} outputPath - Output video file path
 * @param {Object} options - Animation options
 * @returns {Promise<string>} - Path to output video
 */
export async function createCinematicVideo(imageUrls, outputPath, options = {}) {
  const {
    width = 1280,
    height = 720,
    fps = 30,
    imageDuration = 3.5, // seconds per image
    transitionDuration = 1, // seconds for fade transition
    scaleStart = 1.0,
    scaleEnd = 1.15,
    enablePan = true,
    enableFade = true,
  } = options;

  if (!imageUrls || imageUrls.length < 2) {
    throw new Error("Minimum 2 images required to create video");
  }

  // Create temporary directory for frames
  const tempDir = path.join(os.tmpdir(), `cinematic-frames-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Step 1: Download and validate images
    console.log("📥 [CINEMATIC] Downloading images...");
    const downloadedPaths = [];

    for (const url of imageUrls) {
      const imagePath = await downloadImage(url, tempDir);
      if (imagePath) {
        downloadedPaths.push(imagePath);
      }
    }

    const validPaths = downloadedPaths.filter(Boolean);

    if (validPaths.length < 2) {
      throw new Error("Failed to download minimum 2 valid images");
    }

    console.log(`✅ [CINEMATIC] Downloaded ${validPaths.length}/${imageUrls.length} images`);

    // Step 2: Load images with Canvas
    console.log("🖼️  [CINEMATIC] Loading images into canvas...");
    const canvasImages = [];
    for (const imagePath of validPaths) {
      try {
        const img = await loadCanvasImage(imagePath);
        canvasImages.push(img);
      } catch (error) {
        console.warn(`⚠️ Failed to load canvas image:`, error.message);
      }
    }

    if (canvasImages.length < 2) {
      throw new Error("Failed to load minimum 2 valid canvas images");
    }

    // Step 3: Render animation frames with motion
    console.log("🎬 [CINEMATIC] Rendering cinematic frames with motion...");
    const canvas = createCanvas(width, height);
    const imageFrames = Math.round(imageDuration * fps);
    const transitionFrames = Math.round(transitionDuration * fps);
    const frameDir = path.join(tempDir, "frames");
    fs.mkdirSync(frameDir, { recursive: true });

    let frameCount = 0;

    for (let imgIdx = 0; imgIdx < canvasImages.length; imgIdx++) {
      const currentImage = canvasImages[imgIdx];
      const nextImage = canvasImages[(imgIdx + 1) % canvasImages.length];

      // Render image frames with Ken Burns effect (zoom + pan)
      console.log(`  🎞️  Rendering image ${imgIdx + 1}/${canvasImages.length} with motion...`);
      for (let frameIdx = 0; frameIdx < imageFrames; frameIdx++) {
        renderMotionFrame(canvas, currentImage, frameIdx, imageFrames, {
          scaleStart,
          scaleEnd,
          enablePan,
        });

        const framePath = path.join(frameDir, `frame-${String(frameCount).padStart(6, "0")}.png`);
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(framePath, buffer);
        frameCount++;
      }

      // Render fade transition frames
      if (imgIdx < canvasImages.length - 1 && enableFade) {
        console.log(`  ✨ Rendering fade transition ${imgIdx + 1}...`);
        for (let frameIdx = 0; frameIdx < transitionFrames; frameIdx++) {
          const progress = frameIdx / (transitionFrames - 1);
          renderFadeTransition(canvas, currentImage, nextImage, progress);

          const framePath = path.join(frameDir, `frame-${String(frameCount).padStart(6, "0")}.png`);
          const buffer = canvas.toBuffer("image/png");
          fs.writeFileSync(framePath, buffer);
          frameCount++;
        }
      }
    }

    console.log(`✅ [CINEMATIC] Rendered ${frameCount} total frames with motion effects`);

    // Step 4: Encode frames to video with FFmpeg
    console.log("🎥 [CINEMATIC] Encoding cinematic video with FFmpeg...");

    return new Promise((resolve, reject) => {
      const framePath = path.join(frameDir, "frame-%06d.png");

      ffmpeg()
        .input(framePath)
        .inputFPS(fps)
        .output(outputPath)
        .outputOptions(["-c:v libx264", "-pix_fmt yuv420p", "-crf 23"])
        .on("end", () => {
          console.log("✅ [CINEMATIC] Cinematic video encoding complete");

          // Cleanup temporary files
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
            console.log("🧹 [CINEMATIC] Temporary files cleaned");
          } catch (e) {
            console.warn("⚠️ Failed to cleanup temp files:", e.message);
          }

          resolve(outputPath);
        })
        .on("error", (err) => {
          console.error("❌ [CINEMATIC] FFmpeg error:", err.message);

          // Cleanup on error
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch (e) {
            // ignore
          }

          reject(err);
        })
        .run();
    });
  } catch (error) {
    // Cleanup on error
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }

    throw error;
  }
}

export default {
  createCinematicVideo,
};
