import { generateScenesWithImages } from "../Ai generated video/server-scenes.js";
import { createVideoFromImages } from "../Direct-pic-to-video/server-video-from-images.js";
import { createCinematicVideo } from "../Ai generated video/server-cinematic-video.js";
import logger from "../utils/logger.js";

const toErrorMessage = (value, fallback = "Unexpected error") => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message || fallback;
  return String(value);
};

export const generateSceneImages = async (req, res) => {
  try {
    const { script, theme } = req.body;
    logger.info("🎬 [API] generate-scene-images called", { theme });

    if (!script) {
      return res.status(400).json({ success: false, error: "Missing script" });
    }

    const scenes = await generateScenesWithImages(script, theme);
    res.json({ success: true, scenes });
  } catch (error) {
    logger.error("❌ [API] generate-scene-images error:", error);
    res.status(500).json({
      success: false,
      error: toErrorMessage(error, "Failed to generate scene images"),
    });
  }
};

export const generateVideoFromImages = async (req, res) => {
  try {
    const { images } = req.body;
    logger.info("🎬 [API] video-from-images called", { imageCount: images?.length });

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ success: false, error: "Missing or invalid images array" });
    }

    const videoUrl = await createVideoFromImages(images);
    res.json({ success: true, videoUrl });
  } catch (error) {
    logger.error("❌ [API] video-from-images error:", error);
    res.status(500).json({
      success: false,
      error: toErrorMessage(error, "Failed to create video from images"),
    });
  }
};

export const generateCinematicVideo = async (req, res) => {
  try {
    const { script, theme } = req.body;
    logger.info("🎬 [API] cinematic-video called", { theme });

    if (!script) {
      return res.status(400).json({ success: false, error: "Missing script" });
    }

    const videoUrl = await createCinematicVideo(script, theme);
    res.json({ success: true, videoUrl });
  } catch (error) {
    logger.error("❌ [API] cinematic-video error:", error);
    res.status(500).json({
      success: false,
      error: toErrorMessage(error, "Failed to create cinematic video"),
    });
  }
};
