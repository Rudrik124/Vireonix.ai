import ffmpeg from "fluent-ffmpeg";
import logger from "../utils/logger.js";

// Helper for error messages
const toErrorMessage = (value, fallback = "Unexpected error") => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message || fallback;
  return String(value);
};

export const getAudioMetadata = async (req, res) => {
  try {
    const audioFile = req.file;

    if (!audioFile) {
      return res.status(400).json({
        success: false,
        error: "No audio file provided",
      });
    }

    ffmpeg.ffprobe(audioFile.path, (err, metadata) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: "Failed to read audio metadata",
        });
      }

      const audioStream = metadata.streams.find((s) => s.codec_type === "audio");
      const format = metadata.format;

      res.json({
        success: true,
        duration: Number(format.duration) || 0,
        bitrate: audioStream?.bit_rate || 0,
        sampleRate: audioStream?.sample_rate || 0,
        channels: audioStream?.channels || 0,
        codec: audioStream?.codec_name || "unknown",
      });
    });
  } catch (error) {
    logger.error("Metadata error:", error);
    res.status(500).json({
      success: false,
      error: toErrorMessage(error, "Failed to get audio metadata"),
    });
  }
};
