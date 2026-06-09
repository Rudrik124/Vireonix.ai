// Video creation from images with motion effects

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
 * Render frame with enhanced cinematic zoom and pan effects
 * @param {Canvas} canvas - Canvas object
 * @param {Image} image - Canvas image
 * @param {number} frameIndex - Frame index in sequence
 * @param {number} totalFrames - Total frames for this image
 * @param {Object} options - Animation options
 */
function renderFrame(canvas, image, frameIndex, totalFrames, options = {}) {
  const ctx = canvas.getContext("2d");
  const { enableZoom = true, enablePan = true, scaleEnd = 1.3, panX = 0, panY = 0 } = options;

  // Calculate animation progress (0 to 1)
  const progress = frameIndex / (totalFrames - 1);

  // Background (fade)
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate cinematic zoom (1.0 to scaleEnd - now 1.3 for more dramatic effect)
  const scale = enableZoom ? 1 + (scaleEnd - 1) * progress : 1;

  // Calculate dynamic pan offset with smooth easing
  let offsetX = 0;
  let offsetY = 0;
  if (enablePan && (panX !== 0 || panY !== 0)) {
    // Use easing function for smoother pan movement
    const easeProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress; // Ease in-out quad
    offsetX = panX * easeProgress;
    offsetY = panY * easeProgress;
  }

  // Center position with pan offset
  const centerX = canvas.width / 2 + offsetX;
  const centerY = canvas.height / 2 + offsetY;

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

  // Draw image centered
  ctx.drawImage(image, centerX - drawWidth / 2, centerY - drawHeight / 2, drawWidth, drawHeight);
}

/**
 * Render text overlay with cinematic styling
 * @param {Canvas} canvas - Canvas object
 * @param {string} text - Text to render
 * @param {number} frameIndex - Frame index in sequence
 * @param {number} totalFrames - Total frames for this segment
 * @param {Object} options - Text rendering options
 */
function renderTextOverlay(canvas, text, frameIndex, totalFrames, options = {}) {
  const ctx = canvas.getContext("2d");
  const {
    fontSize = 48,
    fontColor = "#FFFFFF",
    x = canvas.width / 2,
    y = canvas.height - 120,
    fontFamily = "Arial, sans-serif",
    opacity = 0.9,
    duration = 2.8,
  } = options;

  // Fade in and out animation for text
  const fadeInFrames = Math.ceil(totalFrames * 0.1); // 10% fade in
  const fadeOutFrames = Math.ceil(totalFrames * 0.1); // 10% fade out
  const holdFrames = totalFrames - fadeInFrames - fadeOutFrames;

  let textOpacity = opacity;
  if (frameIndex < fadeInFrames) {
    textOpacity = opacity * (frameIndex / fadeInFrames);
  } else if (frameIndex >= fadeInFrames + holdFrames) {
    textOpacity = opacity * ((totalFrames - frameIndex) / fadeOutFrames);
  }

  // Add text shadow for depth
  ctx.globalAlpha = textOpacity * 0.4;
  ctx.fillStyle = "#000000";
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 3, y + 3);

  // Main text
  ctx.globalAlpha = textOpacity;
  ctx.fillStyle = fontColor;
  ctx.fillText(text, x, y);

  // Reset
  ctx.globalAlpha = 1;
}

/**
 * Create transition frame (fade between two images)
 * @param {Canvas} canvas - Canvas object
 * @param {Image} image1 - First image
 * @param {Image} image2 - Second image
 * @param {number} progress - Transition progress (0 to 1)
 */
function renderTransition(canvas, image1, image2, progress) {
  const ctx = canvas.getContext("2d");

  // Black background
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate dimensions for image1
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

  // Calculate dimensions for image2
  const imageAspect2 = image2.width / image2.height;
  let drawWidth2, drawHeight2;
  if (imageAspect2 > canvasAspect) {
    drawHeight2 = canvas.height;
    drawWidth2 = drawHeight2 * imageAspect2;
  } else {
    drawWidth2 = canvas.width;
    drawHeight2 = drawWidth2 / imageAspect2;
  }

  // Draw first image with decreasing opacity
  ctx.globalAlpha = 1 - progress;
  ctx.drawImage(image1, canvas.width / 2 - drawWidth1 / 2, canvas.height / 2 - drawHeight1 / 2, drawWidth1, drawHeight1);

  // Draw second image with increasing opacity
  ctx.globalAlpha = progress;
  ctx.drawImage(image2, canvas.width / 2 - drawWidth2 / 2, canvas.height / 2 - drawHeight2 / 2, drawWidth2, drawHeight2);

  // Reset alpha
  ctx.globalAlpha = 1;
}

/**
 * Create animated video from image URLs
 * @param {Array<string>} imageUrls - Array of image URLs
 * @param {string} outputPath - Output video file path
 * @param {Object} options - Animation options
 * @returns {Promise<string>} - Path to output video
 */
export async function createVideoFromImages(imageUrls, outputPath, options = {}) {
  const {
    width = 1280,
    height = 720,
    fps = 30,
    imageDuration = 2.8, // seconds per image (cinematic duration)
    transitionDuration = 0.8, // seconds for fade transition
    enableZoom = true,
    enablePan = true,
    scaleEnd = 1.3, // Increased zoom for more cinematic feel
    panOffsets = [], // Array of {x, y} pan offsets for each image
    captions = [], // Array of caption texts for each image
    maxTotalFrames = 8000, // safety cap to avoid long processing / timeouts
  } = options;

  // Calculate estimated total frames and enforce safety limit
  const estimatedImageFrames = Math.round(imageDuration * fps);
  const estimatedTransitionFrames = Math.round(transitionDuration * fps);
  const estimatedTotalFrames = (estimatedImageFrames + estimatedTransitionFrames) * (imageUrls.length - 1);
  if (estimatedTotalFrames > maxTotalFrames) {
    throw new Error(`Estimated total frames (${estimatedTotalFrames}) exceed safety limit (${maxTotalFrames}). Reduce imageDuration, transitionDuration, or fps.`);
  }

  if (!imageUrls || imageUrls.length < 2) {
    throw new Error("Minimum 2 images required to create video");
  }

  // Create temporary directory for frames
  const tempDir = path.join(os.tmpdir(), `video-frames-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Step 1: Download and validate images
    console.log("📥 [VIDEO] Downloading images...");
    const downloadedPaths = [];

    for (const url of imageUrls) {
      const imagePath = await downloadImage(url, tempDir);
      if (imagePath) {
        downloadedPaths.push(imagePath);
      }
    }

    // Filter out failed images
    const validPaths = downloadedPaths.filter(Boolean);

    if (validPaths.length < 2) {
      throw new Error("Failed to download minimum 2 valid images");
    }

    console.log(`✅ [VIDEO] Downloaded ${validPaths.length}/${imageUrls.length} images`);

    // Step 2: Load images with Canvas
    console.log("🖼️  [VIDEO] Loading images into canvas...");
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

    // Step 3: Render animation frames
    console.log("🎬 [VIDEO] Rendering cinematic frames...");
    const canvas = createCanvas(width, height);
    const imageFrames = Math.round(imageDuration * fps);
    const transitionFrames = Math.round(transitionDuration * fps);
    const frameDir = path.join(tempDir, "frames");
    fs.mkdirSync(frameDir, { recursive: true });

    let frameCount = 0;

    for (let imgIdx = 0; imgIdx < canvasImages.length; imgIdx++) {
      const currentImage = canvasImages[imgIdx];
      const nextImage = canvasImages[(imgIdx + 1) % canvasImages.length];
      
      // Get pan offset for this image (or use default pattern)
      const panOffset = panOffsets[imgIdx] || {
        x: [40, -40, 20, -20, 50, 0][imgIdx % 6],
        y: [-20, 20, 40, -40, 0, 50][imgIdx % 6],
      };
      
      const caption = captions[imgIdx];

      // Render image frames with cinematic zoom/pan effect
      for (let frameIdx = 0; frameIdx < imageFrames; frameIdx++) {
        renderFrame(canvas, currentImage, frameIdx, imageFrames, {
          enableZoom,
          enablePan,
          scaleEnd,
          panX: panOffset.x,
          panY: panOffset.y,
        });

        // Add text overlay if caption exists
        if (caption) {
          renderTextOverlay(canvas, caption, frameIdx, imageFrames, {
            fontSize: Math.round(width / 30),
            fontColor: "#FFFFFF",
            x: width / 2,
            y: height - Math.round(height * 0.15),
            opacity: 0.85,
          });
        }

        const framePath = path.join(frameDir, `frame-${String(frameCount).padStart(6, "0")}.png`);
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(framePath, buffer);
        frameCount++;
      }

      // Render transition frames (fade to next image)
      if (imgIdx < canvasImages.length - 1) {
        for (let frameIdx = 0; frameIdx < transitionFrames; frameIdx++) {
          const progress = frameIdx / (transitionFrames - 1);
          renderTransition(canvas, currentImage, nextImage, progress);

          const framePath = path.join(frameDir, `frame-${String(frameCount).padStart(6, "0")}.png`);
          const buffer = canvas.toBuffer("image/png");
          fs.writeFileSync(framePath, buffer);
          frameCount++;
        }
      }
    }

    console.log(`✅ [VIDEO] Rendered ${frameCount} frames`);

    // Step 4: Encode frames to video with FFmpeg
    console.log("🎥 [VIDEO] Encoding cinematic video with FFmpeg...");

    return new Promise((resolve, reject) => {
      const framePath = path.join(frameDir, "frame-%06d.png");

      ffmpeg()
        .input(framePath)
        .inputFPS(fps)
        .output(outputPath)
        .outputOptions(["-c:v libx264", "-pix_fmt yuv420p", "-crf 23"])
        .on("end", () => {
          console.log("✅ [VIDEO] Cinematic video encoding complete");

          // Cleanup temporary files
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
            console.log("🧹 [VIDEO] Temporary files cleaned");
          } catch (e) {
            console.warn("⚠️ Failed to cleanup temp files:", e.message);
          }

          resolve(outputPath);
        })
        .on("error", (err) => {
          console.error("❌ [VIDEO] FFmpeg error:", err.message);

          // Cleanup on error
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch (e) {
            // ignore cleanup errors
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
      // ignore cleanup errors
    }

    throw error;
  }
}

export default {
  createVideoFromImages,
};
